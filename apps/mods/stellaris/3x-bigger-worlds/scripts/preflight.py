#!/usr/bin/env python3
"""Pre-game verification suite for the 3x Bigger Worlds mod.

Runs without launching Stellaris. Catches the failure modes most likely to
turn into "mod loads but silently does nothing" or "crash on new game":

  C1  Brace balance on every generated script file.
  C2  Vanilla key drift: every top-level `d_*` key present in vanilla
      `common/deposits/<file>` is also present in our override. Drops would
      delete the deposit definition entirely from the game.
  C3  scripted_variables override defines exactly the six expected variables,
      each at vanilla_value * MULTIPLIER (multiplier is constant across all
      six — if any drift, the build is stale).
  C4  For each generated deposit file, every `district_*_max_add = N` (N > 0)
      and every numeric `resource = N` inside a `produces = { ... }` block is
      *exactly* MULTIPLIER times the corresponding vanilla value at the same
      position. This is the spot check that the transform actually ran and
      did the right thing.
  C5  Negative values are preserved byte-for-byte (blockers must keep their
      vanilla magnitude — see build.py rationale).
  C6  Every localisation YAML file starts with a UTF-8 BOM.
  C7  descriptor.mod present and contains a supported_version line.
  C8  (Only if deployed) Symlink in ~/Documents/Paradox Interactive/Stellaris/
      mod/ resolves into this repo, and the outer .mod descriptor has an
      absolute path= pointing at the symlink.
  C9  thumbnail.png present in mod root, real PNG bytes, under 1 MB, and
      referenced from descriptor.mod via picture="..."
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

MULTIPLIER = 3
MOD_NAME = "3x-bigger-worlds"

SCRIPT_DIR = Path(__file__).resolve().parent
MOD_DIR = SCRIPT_DIR.parent / "mod"
DEPOSITS_OUT = MOD_DIR / "common" / "deposits"
VARIABLES_OUT = MOD_DIR / "common" / "scripted_variables"

VANILLA_ROOT = (
    Path.home()
    / "Library"
    / "Application Support"
    / "Steam"
    / "steamapps"
    / "common"
    / "Stellaris"
)
VANILLA_DEPOSITS = VANILLA_ROOT / "common" / "deposits"
VANILLA_VARIABLES = VANILLA_ROOT / "common" / "scripted_variables"

STELLARIS_USER_MOD_DIR = (
    Path.home() / "Documents" / "Paradox Interactive" / "Stellaris" / "mod"
)

EXPECTED_VARS = (
    "habitable_planet_max_size",
    "habitable_planet_min_size",
    "habitable_moon_max_size",
    "habitable_moon_min_size",
    "DISTRICTS_FROM_SR_DEPOSITS",
    "DISTRICTS_FROM_SR_DEPOSITS_SMALL",
)

DISTRICT_NUM_RE = re.compile(
    r"(\b(?:district_[A-Za-z_]+?_(?:max|min)_add|planet_max_districts_add)"
    r"\s*=\s*)\+?([0-9]+)\b"
)
DISTRICT_NEG_RE = re.compile(
    r"\b(?:district_[A-Za-z_]+?_(?:max|min)_add|planet_max_districts_add)"
    r"\s*=\s*-[0-9]+\b"
)
PRODUCES_BLOCK_RE = re.compile(r"produces\s*=\s*\{")
PRODUCES_NUM_RE = re.compile(
    r"(\b[A-Za-z_][A-Za-z_0-9]*\s*=\s*)\+?([0-9]+(?:\.[0-9]+)?)\b"
)
VAR_DEF_RE = re.compile(r"^@([A-Za-z_][A-Za-z_0-9]*)\s*=\s*([0-9]+)", re.MULTILINE)
TOP_KEY_RE = re.compile(r"^([A-Za-z_][A-Za-z_0-9]*)\s*=\s*\{", re.MULTILINE)

failures: list[str] = []
passes: list[str] = []


def fail(check: str, detail: str) -> None:
    failures.append(f"{check}: {detail}")


def ok(check: str, detail: str) -> None:
    passes.append(f"{check}: {detail}")


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


def top_level_deposit_keys(text: str) -> set[str]:
    """Top-level keys of the form `d_xxx = {`. Lightweight: skips nested
    blocks by only matching at depth 0."""
    keys: set[str] = set()
    text = strip_comments(text)
    depth = 0
    i = 0
    line_start = 0
    while i < len(text):
        c = text[i]
        if c == "{":
            if depth == 0:
                m = re.search(r"([A-Za-z_][A-Za-z_0-9]*)\s*=\s*$", text[line_start:i])
                if m and m.group(1).startswith("d_"):
                    keys.add(m.group(1))
            depth += 1
        elif c == "}":
            depth -= 1
        elif c == "\n":
            line_start = i + 1
        i += 1
    return keys


def find_produces_bodies(text: str) -> list[str]:
    bodies: list[str] = []
    for m in PRODUCES_BLOCK_RE.finditer(text):
        depth = 1
        j = m.end()
        while j < len(text) and depth:
            c = text[j]
            if c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
                if depth == 0:
                    break
            j += 1
        if depth == 0:
            bodies.append(text[m.end() : j])
    return bodies


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


def c2_vanilla_key_drift() -> None:
    """Symmetric: every vanilla `d_*` key must be in the override (otherwise
    we silently delete a deposit from generation) AND the override must not
    introduce new keys (would mean build.py duplicated or synthesized one)."""
    drifted: list[str] = []
    for src in sorted(VANILLA_DEPOSITS.glob("*.txt")):
        override = DEPOSITS_OUT / src.name
        if not override.exists():
            drifted.append(f"{src.name} missing from override")
            continue
        v_keys = top_level_deposit_keys(read(src))
        o_keys = top_level_deposit_keys(read(override))
        missing = v_keys - o_keys
        extra = o_keys - v_keys
        if missing:
            sample = sorted(missing)[:3]
            drifted.append(f"{src.name} missing {len(missing)} keys (e.g. {sample})")
        if extra:
            sample = sorted(extra)[:3]
            drifted.append(f"{src.name} has {len(extra)} extra keys (e.g. {sample})")
    if drifted:
        fail("C2", "; ".join(drifted))
    else:
        ok("C2", "vanilla d_* keys preserved bidirectionally (no missing, no extra)")


def c3_variables_override() -> None:
    path = VARIABLES_OUT / "zz_bworlds_planet_sizes.txt"
    if not path.exists():
        fail("C3", f"missing {path.relative_to(MOD_DIR)}")
        return
    overrides = {m.group(1): int(m.group(2)) for m in VAR_DEF_RE.finditer(read(path))}
    missing = [v for v in EXPECTED_VARS if v not in overrides]
    if missing:
        fail("C3", f"override missing vars: {missing}")
        return
    vanilla: dict[str, int] = {}
    for vfile in VANILLA_VARIABLES.glob("*.txt"):
        for m in VAR_DEF_RE.finditer(read(vfile)):
            if m.group(1) in EXPECTED_VARS and m.group(1) not in vanilla:
                vanilla[m.group(1)] = int(m.group(2))
    wrong: list[str] = []
    for var in EXPECTED_VARS:
        expected = vanilla.get(var, -1) * MULTIPLIER
        if overrides[var] != expected:
            wrong.append(f"@{var}={overrides[var]} (expected {expected})")
    if wrong:
        fail("C3", "wrong multipliers: " + ", ".join(wrong))
    else:
        ok("C3", f"all {len(EXPECTED_VARS)} vars overridden at x{MULTIPLIER}")


def c4_district_and_produces_multiplied() -> None:
    """For every vanilla file, parse out the sequence of positive
    district_*_max_add values and produces-block numeric values, then verify
    the override has the same sequence multiplied by MULTIPLIER."""
    wrong: list[str] = []
    for src in sorted(VANILLA_DEPOSITS.glob("*.txt")):
        override = DEPOSITS_OUT / src.name
        if not override.exists():
            continue

        v_text = read(src)
        o_text = read(override)

        v_d = [int(m.group(2)) for m in DISTRICT_NUM_RE.finditer(v_text)]
        o_d = [int(m.group(2)) for m in DISTRICT_NUM_RE.finditer(o_text)]
        if len(v_d) != len(o_d) or any(o != v * MULTIPLIER for v, o in zip(v_d, o_d)):
            wrong.append(f"{src.name}: district seq mismatch ({len(v_d)} vs {len(o_d)})")
            continue

        v_p: list[float] = []
        for body in find_produces_bodies(v_text):
            for m in PRODUCES_NUM_RE.finditer(body):
                v_p.append(float(m.group(2)))
        o_p: list[float] = []
        for body in find_produces_bodies(o_text):
            for m in PRODUCES_NUM_RE.finditer(body):
                o_p.append(float(m.group(2)))
        if len(v_p) != len(o_p):
            wrong.append(f"{src.name}: produces seq length {len(v_p)} vs {len(o_p)}")
            continue
        if any(abs(o - v * MULTIPLIER) > 1e-6 for v, o in zip(v_p, o_p)):
            bad = [(v, o) for v, o in zip(v_p, o_p) if abs(o - v * MULTIPLIER) > 1e-6][:3]
            wrong.append(f"{src.name}: produces values not multiplied: {bad}")
    if wrong:
        fail("C4", "; ".join(wrong[:5]))
    else:
        ok("C4", "district_*_max_add and produces values multiplied exactly")


def c5_negatives_preserved() -> None:
    """Negative district_*_max_add / planet_max_districts_add values must
    appear in the override the same number of times as in vanilla. Blocker
    penalties (the common case for negatives) are intentionally left at
    vanilla magnitude — see build.py rationale."""
    wrong: list[str] = []
    for src in sorted(VANILLA_DEPOSITS.glob("*.txt")):
        override = DEPOSITS_OUT / src.name
        if not override.exists():
            continue
        v_neg = DISTRICT_NEG_RE.findall(read(src))
        o_neg = DISTRICT_NEG_RE.findall(read(override))
        if v_neg != o_neg:
            wrong.append(
                f"{src.name}: negative district modifiers differ "
                f"(vanilla={len(v_neg)}, override={len(o_neg)})"
            )
    if wrong:
        fail("C5", "; ".join(wrong))
    else:
        ok("C5", "negative district modifiers preserved byte-for-byte")


def c6_localisation_bom() -> None:
    missing: list[str] = []
    for path in sorted((MOD_DIR / "localisation").glob("**/*.yml")):
        head = path.read_bytes()[:3]
        if head != b"\xef\xbb\xbf":
            missing.append(path.name)
    if missing:
        fail("C6", f"missing UTF-8 BOM: {missing}")
    else:
        ok("C6", "all localisation YAML files start with UTF-8 BOM")


def c7_descriptor() -> None:
    descriptor = MOD_DIR / "descriptor.mod"
    if not descriptor.exists():
        fail("C7", f"missing {descriptor}")
        return
    text = read(descriptor)
    if "supported_version" not in text:
        fail("C7", "descriptor.mod missing supported_version")
        return
    ok("C7", "descriptor.mod present and contains supported_version")


def c8_deploy() -> None:
    link = STELLARIS_USER_MOD_DIR / MOD_NAME
    outer = STELLARIS_USER_MOD_DIR / f"{MOD_NAME}.mod"
    # Path.exists() returns False for a broken symlink; treat any symlink
    # (broken or not) as evidence of a deploy attempt.
    link_present = link.exists() or link.is_symlink()
    if not link_present and not outer.exists():
        ok("C8", "not deployed (skipping deploy integrity check)")
        return
    if not link.is_symlink():
        fail("C8", f"{link} is not a symlink")
        return
    resolved = link.resolve()
    if resolved != MOD_DIR.resolve():
        fail("C8", f"symlink target {resolved} != repo mod dir {MOD_DIR.resolve()}")
        return
    if not outer.exists():
        fail("C8", f"missing outer descriptor {outer}")
        return
    text = read(outer)
    m = re.search(r'^\s*path\s*=\s*"([^"]+)"\s*$', text, re.MULTILINE)
    if not m:
        fail("C8", "outer descriptor missing path=\"...\" line")
        return
    declared = Path(m.group(1)).expanduser()
    if not declared.is_absolute():
        fail("C8", f"outer descriptor path is not absolute: {declared}")
        return
    if declared != link:
        fail("C8", f"outer descriptor path {declared} != expected symlink {link}")
        return
    ok("C8", "deploy symlink + outer descriptor verified")


def c9_thumbnail() -> None:
    """Enforce real-PNG bytes, 512x512, no alpha channel, under 1 MB.

    Each constraint maps to a Workshop / Stellaris failure mode the
    Multi-Megastructures mod hit on its first upload:
      - Wrong magic bytes (JPEG inside a .png filename) -> broken-image preview
      - Wrong dimensions -> the launcher Mods panel crops or pillarboxes oddly
      - Alpha channel    -> Workshop composites transparency to black inconsistently
      - >= 1 MB          -> hard Workshop rejection on upload
    """
    descriptor = MOD_DIR / "descriptor.mod"
    descriptor_text = read(descriptor) if descriptor.exists() else ""
    m = re.search(r'picture\s*=\s*"([^"]+)"', descriptor_text)
    if not m:
        fail("C9", 'descriptor.mod missing picture="..." line')
        return
    thumb = MOD_DIR / m.group(1)
    if not thumb.exists():
        fail("C9", f"thumbnail file not found at {thumb.relative_to(MOD_DIR)}")
        return
    data = thumb.read_bytes()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        fail("C9", f"{thumb.name} is not a real PNG (bad magic bytes)")
        return
    size = len(data)
    if size >= 1024 * 1024:
        fail("C9", f"{thumb.name} is {size} bytes (>= 1 MB Workshop limit)")
        return
    # Parse the IHDR chunk: it starts at byte 8 (after the PNG signature) with
    # `length(4) "IHDR" width(4) height(4) bit_depth(1) color_type(1) ...`.
    # color_type values: 0=greyscale, 2=RGB, 3=palette, 4=greyscale+alpha,
    # 6=RGBA. We want 0/2/3 (no alpha).
    if len(data) < 26 or data[12:16] != b"IHDR":
        fail("C9", f"{thumb.name} is malformed PNG (missing IHDR)")
        return
    width = int.from_bytes(data[16:20], "big")
    height = int.from_bytes(data[20:24], "big")
    color_type = data[25]
    if (width, height) != (512, 512):
        fail("C9", f"{thumb.name} is {width}x{height}, expected 512x512")
        return
    if color_type in (4, 6):
        fail(
            "C9",
            f"{thumb.name} has alpha channel (color_type={color_type}); "
            "re-save without transparency",
        )
        return
    ok(
        "C9",
        f"{thumb.name}: real PNG, 512x512, no alpha (color_type={color_type}), "
        f"{size} bytes",
    )


def main() -> int:
    if not VANILLA_ROOT.exists():
        print(f"ERROR: Stellaris not found at {VANILLA_ROOT}", file=sys.stderr)
        return 2

    c1_brace_balance()
    c2_vanilla_key_drift()
    c3_variables_override()
    c4_district_and_produces_multiplied()
    c5_negatives_preserved()
    c6_localisation_bom()
    c7_descriptor()
    c8_deploy()
    c9_thumbnail()

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
