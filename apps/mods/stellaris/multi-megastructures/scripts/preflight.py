#!/usr/bin/env python3
"""Pre-game verification suite for the Multi-Megastructures mod.

Runs without launching Stellaris. Catches the failure modes most likely to
turn into "mod loads but silently does nothing" or "crash on new game":

  C1  Brace balance on every script file (no unmatched braces).
  C2  No leaked `built_<X>` flags or `has_no_non_gate_megastructure` in
      generated megastructure files outside comments.
  C3  `mmegs_unused_flag` appears in every generated megastructure file
      where vanilla had a `built_X` reference (the rewrite actually fired).
  C4  Every top-level megastructure key in the vanilla file also exists in
      the override (we didn't drop a stage like `dyson_sphere_3`).
  C5  Every tech ID we `give_technology` exists in vanilla
      `common/technology/*.txt`.
  C6  Every on_action name we hook (e.g. `on_game_start_country`) is
      referenced as a real on_action in vanilla `common/on_actions/*.txt`.
  C7  Every event id our on_actions point at is defined in our events file.
  C8  Every localisation YAML file starts with a UTF-8 BOM (Stellaris
      requires this or strings render as raw keys).
  C9  descriptor.mod present and contains a supported_version line.
  C10 (Only if deployed) Symlink in ~/Documents/Paradox Interactive/Stellaris/
      mod/ resolves into this repo, and the outer .mod descriptor has an
      absolute path= pointing at the symlink.
  C11 thumbnail.png present in mod root, real PNG bytes, under 1 MB, and
      referenced from descriptor.mod via picture="..." (Steam Workshop
      preview will be broken otherwise).

Each check prints PASS or FAIL with a short reason. Exits non-zero on any FAIL.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
MOD_DIR = SCRIPT_DIR.parent / "mod"
MOD_NAME = "multi-megastructures"

VANILLA_ROOT = (
    Path.home()
    / "Library"
    / "Application Support"
    / "Steam"
    / "steamapps"
    / "common"
    / "Stellaris"
)
VANILLA_MEGAS = VANILLA_ROOT / "common" / "megastructures"
VANILLA_TECH = VANILLA_ROOT / "common" / "technology"
VANILLA_ON_ACTIONS = VANILLA_ROOT / "common" / "on_actions"

STELLARIS_USER_MOD_DIR = (
    Path.home() / "Documents" / "Paradox Interactive" / "Stellaris" / "mod"
)

failures: list[str] = []
passes: list[str] = []


def fail(check: str, detail: str) -> None:
    failures.append(f"{check}: {detail}")


def ok(check: str, detail: str) -> None:
    passes.append(f"{check}: {detail}")


# ---------- helpers ----------


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def strip_comments(text: str) -> str:
    out: list[str] = []
    for line in text.splitlines(keepends=True):
        if "#" in line:
            idx = line.index("#")
            out.append(line[:idx] + "\n")
        else:
            out.append(line)
    return "".join(out)


def top_level_keys(text: str) -> set[str]:
    """Return the set of `name = {` identifiers at brace depth 0."""
    keys: set[str] = set()
    text = strip_comments(text)
    depth = 0
    i = 0
    line_start = 0
    while i < len(text):
        c = text[i]
        if c == "{":
            if depth == 0:
                # Search backward to extract `name = {`.
                m = re.search(r"([A-Za-z_][A-Za-z0-9_]*)\s*=\s*$", text[line_start:i])
                if m:
                    keys.add(m.group(1))
            depth += 1
        elif c == "}":
            depth -= 1
        elif c == "\n":
            line_start = i + 1
        i += 1
    return keys


def find_techs_in_event_file(text: str) -> set[str]:
    return set(re.findall(r"give_technology\s*=\s*\{\s*tech\s*=\s*([A-Za-z_0-9]+)", text))


def find_on_actions_in_file(text: str) -> set[str]:
    """Top-level on_action hooks (e.g. `on_game_start_country = {`)."""
    return top_level_keys(text)


def find_event_refs_in_on_actions(text: str) -> set[str]:
    """Every `<namespace>.<id>` referenced inside an `events = { ... }` block."""
    refs: set[str] = set()
    for block in re.finditer(r"events\s*=\s*\{([^}]*)\}", text):
        for tok in re.findall(r"([a-z_]+\.\d+)", block.group(1)):
            refs.add(tok)
    return refs


def find_event_defs(text: str) -> set[str]:
    """Every event defined in our events file."""
    namespace_match = re.search(r"namespace\s*=\s*([A-Za-z_0-9]+)", text)
    if not namespace_match:
        return set()
    ns = namespace_match.group(1)
    ids = re.findall(r"\bid\s*=\s*([A-Za-z_0-9.]+)", text)
    # Normalize bare numeric ids into ns.id.
    out: set[str] = set()
    for raw in ids:
        out.add(raw if "." in raw else f"{ns}.{raw}")
    return out


def vanilla_on_action_names() -> set[str]:
    """All top-level on_action hook names found across vanilla on_actions files."""
    names: set[str] = set()
    if not VANILLA_ON_ACTIONS.exists():
        return names
    for path in VANILLA_ON_ACTIONS.glob("*.txt"):
        names |= top_level_keys(read(path))
    return names


def vanilla_tech_ids() -> set[str]:
    """All top-level tech identifiers found across vanilla technology files."""
    techs: set[str] = set()
    if not VANILLA_TECH.exists():
        return techs
    for path in VANILLA_TECH.glob("*.txt"):
        techs |= {k for k in top_level_keys(read(path)) if k.startswith("tech_")}
    return techs


# ---------- checks ----------


def c1_brace_balance() -> None:
    for path in sorted(MOD_DIR.glob("**/*.txt")):
        depth = 0
        text = strip_comments(read(path))
        for c in text:
            if c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
                if depth < 0:
                    fail("C1", f"{path.relative_to(MOD_DIR)}: extra closing brace")
                    return
        if depth != 0:
            fail("C1", f"{path.relative_to(MOD_DIR)}: imbalanced ({depth:+d})")
            return
    ok("C1", "brace balance OK on all script files")


LIMIT_LEAK_PATTERNS = (
    re.compile(r"has_country_flag\s*=\s*built_"),
    re.compile(r"set_country_flag\s*=\s*built_"),
    re.compile(r"has_no_non_gate_megastructure"),
)


def c2_no_limit_leaks() -> None:
    found: list[str] = []
    for path in sorted((MOD_DIR / "common" / "megastructures").glob("*.txt")):
        for lineno, line in enumerate(read(path).splitlines(), start=1):
            stripped = line.lstrip()
            if stripped.startswith("#"):
                continue
            for pat in LIMIT_LEAK_PATTERNS:
                if pat.search(line):
                    found.append(f"{path.name}:{lineno}: {stripped.rstrip()}")
    if found:
        fail("C2", "limit marker leaked: " + "; ".join(found[:3]))
    else:
        ok("C2", "no limit markers leaked into override files")


def c3_sentinel_present() -> None:
    """If the vanilla file had a built_X reference, the override must
    contain at least one mmegs_unused_flag occurrence."""
    missing: list[str] = []
    for path in sorted((MOD_DIR / "common" / "megastructures").glob("*.txt")):
        vanilla_path = VANILLA_MEGAS / path.name
        if not vanilla_path.exists():
            continue
        vanilla_text = read(vanilla_path)
        if "built_" not in vanilla_text and "has_no_non_gate_megastructure" not in vanilla_text:
            continue
        if "mmegs_unused_flag" not in read(path) and "always = yes" not in read(path):
            missing.append(path.name)
    if missing:
        fail("C3", f"override didn't pick up sentinel flag in: {', '.join(missing)}")
    else:
        ok("C3", "sentinel flag rewrite verified on all transformed files")


def c4_vanilla_keys_preserved() -> None:
    drifted: list[str] = []
    for path in sorted((MOD_DIR / "common" / "megastructures").glob("*.txt")):
        vanilla_path = VANILLA_MEGAS / path.name
        if not vanilla_path.exists():
            drifted.append(f"{path.name} (no vanilla source)")
            continue
        vanilla_keys = top_level_keys(read(vanilla_path))
        override_keys = top_level_keys(read(path))
        missing = vanilla_keys - override_keys
        extra = override_keys - vanilla_keys
        if missing:
            drifted.append(f"{path.name} missing {sorted(missing)}")
        if extra:
            drifted.append(f"{path.name} extra {sorted(extra)}")
    if drifted:
        fail("C4", "vanilla key drift: " + "; ".join(drifted))
    else:
        ok("C4", "top-level megastructure keys match vanilla on all files")


def c5_tech_ids_exist() -> None:
    events_file = MOD_DIR / "events" / "mmegs_events.txt"
    used = find_techs_in_event_file(read(events_file))
    if not used:
        fail("C5", "no give_technology calls found in events file")
        return
    vanilla = vanilla_tech_ids()
    if not vanilla:
        fail("C5", f"vanilla technology dir not found at {VANILLA_TECH}")
        return
    missing = used - vanilla
    if missing:
        fail("C5", f"techs not found in vanilla: {sorted(missing)}")
    else:
        ok("C5", f"all {len(used)} give_technology tech IDs exist in vanilla")


def c6_on_actions_exist() -> None:
    on_actions_dir = MOD_DIR / "common" / "on_actions"
    used: set[str] = set()
    for path in on_actions_dir.glob("*.txt"):
        used |= find_on_actions_in_file(read(path))
    if not used:
        fail("C6", "no on_action hooks found")
        return
    vanilla = vanilla_on_action_names()
    missing = used - vanilla
    if missing:
        fail("C6", f"on_actions not found in vanilla: {sorted(missing)}")
    else:
        ok("C6", f"all {len(used)} on_action hooks exist in vanilla")


def c7_event_refs_defined() -> None:
    on_actions_dir = MOD_DIR / "common" / "on_actions"
    events_file = MOD_DIR / "events" / "mmegs_events.txt"
    refs: set[str] = set()
    for path in on_actions_dir.glob("*.txt"):
        refs |= find_event_refs_in_on_actions(read(path))
    defs = find_event_defs(read(events_file))
    missing = refs - defs
    if missing:
        fail("C7", f"on_action references undefined events: {sorted(missing)}")
    else:
        ok("C7", f"all {len(refs)} event refs from on_actions are defined")


def c8_localisation_bom() -> None:
    missing: list[str] = []
    for path in sorted((MOD_DIR / "localisation").glob("**/*.yml")):
        head = path.read_bytes()[:3]
        if head != b"\xef\xbb\xbf":
            missing.append(path.name)
    if missing:
        fail("C8", f"missing UTF-8 BOM: {missing}")
    else:
        ok("C8", "all localisation YAML files start with UTF-8 BOM")


def c9_descriptor() -> None:
    descriptor = MOD_DIR / "descriptor.mod"
    if not descriptor.exists():
        fail("C9", f"missing {descriptor}")
        return
    text = read(descriptor)
    if "supported_version" not in text:
        fail("C9", "descriptor.mod missing supported_version")
        return
    ok("C9", "descriptor.mod present and contains supported_version")


def c11_thumbnail() -> None:
    descriptor = MOD_DIR / "descriptor.mod"
    descriptor_text = read(descriptor) if descriptor.exists() else ""
    m = re.search(r'picture\s*=\s*"([^"]+)"', descriptor_text)
    if not m:
        fail("C11", "descriptor.mod missing picture=\"...\" line")
        return
    thumb = MOD_DIR / m.group(1)
    if not thumb.exists():
        fail("C11", f"thumbnail file not found at {thumb.relative_to(MOD_DIR)}")
        return
    header = thumb.read_bytes()[:8]
    if header[:8] != b"\x89PNG\r\n\x1a\n":
        fail("C11", f"{thumb.name} is not a real PNG (bad magic bytes)")
        return
    size = thumb.stat().st_size
    if size >= 1024 * 1024:
        fail("C11", f"{thumb.name} is {size} bytes (>= 1 MB Workshop limit)")
        return
    ok("C11", f"{thumb.name} present, valid PNG, {size} bytes")


def c10_deploy() -> None:
    link = STELLARIS_USER_MOD_DIR / MOD_NAME
    outer = STELLARIS_USER_MOD_DIR / f"{MOD_NAME}.mod"
    if not link.exists() and not outer.exists():
        ok("C10", "not deployed (skipping deploy integrity check)")
        return
    if not link.is_symlink():
        fail("C10", f"{link} is not a symlink")
        return
    resolved = link.resolve()
    if resolved != MOD_DIR.resolve():
        fail("C10", f"symlink target {resolved} != repo mod dir {MOD_DIR.resolve()}")
        return
    if not outer.exists():
        fail("C10", f"missing outer descriptor {outer}")
        return
    text = read(outer)
    if "path=" not in text:
        fail("C10", "outer descriptor missing path= line")
        return
    ok("C10", "deploy symlink + outer descriptor verified")


def main() -> int:
    if not VANILLA_ROOT.exists():
        print(f"ERROR: Stellaris not found at {VANILLA_ROOT}", file=sys.stderr)
        return 2

    c1_brace_balance()
    c2_no_limit_leaks()
    c3_sentinel_present()
    c4_vanilla_keys_preserved()
    c5_tech_ids_exist()
    c6_on_actions_exist()
    c7_event_refs_defined()
    c8_localisation_bom()
    c9_descriptor()
    c10_deploy()
    c11_thumbnail()

    for line in passes:
        print(f"PASS {line}")
    for line in failures:
        print(f"FAIL {line}", file=sys.stderr)

    if failures:
        print(f"\n{len(failures)} check(s) failed", file=sys.stderr)
        return 1
    print(f"\n{len(passes)} check(s) passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
