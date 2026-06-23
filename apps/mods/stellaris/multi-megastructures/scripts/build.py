#!/usr/bin/env python3
"""Build the Multi-Megastructures mod.

Reads vanilla Stellaris megastructure files from the local Steam install and
generates overrides that strip the per-empire and per-system build limits.

The bug class we're neutralizing: vanilla uses country flags as both a build
gate (`NOT has_country_flag = built_X` in `possible = { ... }`) AND as a
completion marker (`set_country_flag = built_X` in `on_build_complete = { ... }`).
After the first build, the flag is set, the gate fails, and subsequent builds
of that megastructure are blocked.

Critical detail: the flag's `set_country_flag` write is observed by **other**
vanilla systems too — focus cards (`built_think_tank`, `built_dyson_sphere`),
crisis events (`cosmogenesis_world_built`, `behemoth_egg_built`), room
textures, scripted effects, etc. Rewriting those writes would silently break
unrelated game systems. So:

- READS  (`has_country_flag = <tracking_flag>` inside megastructure `possible`
  / `custom_tooltip` blocks) are rewritten to a sentinel flag never set
  anywhere (`mmegs_read_never_set`). All `NOT { has_country_flag = ... }`
  gates therefore always pass. The build button stays enabled forever.
- WRITES (`set_country_flag` / `remove_country_flag`) are left untouched so
  vanilla focus cards / crisis / scripted effects continue to see the flag
  exactly as designed.

"Tracking flag" is defined precisely: any country flag that vanilla both sets
and reads across the megastructure files, restricted to names matching
`built_<X>` or `<X>_built` (the build-marker naming convention). Discovered
automatically so the mod adapts to future patches that add new megastructures.

The per-system gate `has_no_non_gate_megastructure = yes` is rewritten to
`always = yes`.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
MOD_DIR = SCRIPT_DIR.parent / "mod"
OUTPUT_DIR = MOD_DIR / "common" / "megastructures"

VANILLA_DIR = (
    Path.home()
    / "Library"
    / "Application Support"
    / "Steam"
    / "steamapps"
    / "common"
    / "Stellaris"
    / "common"
    / "megastructures"
)

# Files where the per-empire / per-system limit lives.
#
# Deliberately EXCLUDED, even though 4.4 added build-limit gates to them:
#   16_cosmogenesis_needle.txt — its `possible` block fires crisis.7400 and the
#     `cosmogenesis_needle_built` flag IS the Cosmogenesis crisis-ascension gate.
#     Lifting the cap would let the Needle re-trigger the crisis. Never override.
#   22_shroud_seal.txt — End-of-the-Cycle crisis structure. Limits via
#     `has_megastructure` / `count_owned_megastructure` (a different idiom this
#     transform doesn't handle) and is per-system unique while already allowing
#     galaxy-wide multi-build. No benefit, real crisis-chain risk.
TARGET_FILES = [
    "00_ring_world.txt",
    "01_dyson_sphere.txt",
    "02_spy_orb.txt",
    "03_think_tank.txt",
    "06_matter_decompressor.txt",
    "07_strategic_coordination_center.txt",
    "08_mega_art_installation.txt",
    "09_interstellar_assembly.txt",
    "11_mega_shipyard.txt",
    "13_quantum_catapult.txt",
    "16_cosmogenesis_world.txt",
    "18_dyson_swarm.txt",
    "21_behemoth_egg.txt",
    "22_galactic_crucible.txt",
    # Added in 4.4 "Pegasus" / Nomads DLC. Standard country-flag + per-system
    # gate idiom, so the existing transform handles them. Only reachable when
    # the Nomads DLC is active; harmless overrides otherwise.
    "30_nomad_waystation.txt",
    "31_dyson_gun.txt",
]

READ_SENTINEL = "mmegs_read_never_set"

SET_RE = re.compile(r"set_country_flag\s*=\s*([A-Za-z_0-9]+)")
HAS_RE = re.compile(r"has_country_flag\s*=\s*([A-Za-z_0-9]+)")


def is_tracking_flag_name(flag: str) -> bool:
    """Build-marker naming convention used by Stellaris megastructure files."""
    return flag.startswith("built_") or flag.endswith("_built")


def discover_tracking_flags() -> set[str]:
    """Cross-file intersection of set+read country flags in megastructure
    files, restricted to the build-marker naming convention. Flags only set
    (never read in megastructures) are not "build gates" and are skipped."""
    set_flags: set[str] = set()
    read_flags: set[str] = set()
    for path in VANILLA_DIR.glob("*.txt"):
        text = path.read_text(encoding="utf-8")
        set_flags |= set(SET_RE.findall(text))
        read_flags |= set(HAS_RE.findall(text))
    candidates = set_flags & read_flags
    return {f for f in candidates if is_tracking_flag_name(f)}


def transform(text: str, tracking_flags: set[str]) -> tuple[str, int]:
    total = 0
    # Longest first so flag-prefix collisions can't shadow a longer match.
    for flag in sorted(tracking_flags, key=len, reverse=True):
        text, n = re.subn(
            rf"(has_country_flag\s*=\s*){re.escape(flag)}\b",
            rf"\1{READ_SENTINEL}",
            text,
        )
        total += n
    text, n = re.subn(r"has_no_non_gate_megastructure\s*=\s*yes", "always = yes", text)
    total += n
    return text, total


def header(tracking_flags: set[str]) -> str:
    return (
        "# Generated by apps/mods/stellaris/multi-megastructures/scripts/build.py\n"
        "# Source: vanilla Stellaris (Pegasus v4.4.*).\n"
        "# Read-only rewrite:\n"
        f"#   has_country_flag = <tracking_flag> -> has_country_flag = {READ_SENTINEL}\n"
        "#   (never set anywhere, so `NOT { has_country_flag = ... }` always passes)\n"
        "# Writes (set_country_flag / remove_country_flag) are intentionally left\n"
        "# untouched so external systems (focus cards, crisis events, room textures,\n"
        "# scripted effects) continue to observe the flag as designed in vanilla.\n"
        "# Per-system gate `has_no_non_gate_megastructure = yes` -> `always = yes`.\n"
        f"# Tracking flags rewritten ({len(tracking_flags)}):\n"
        + "".join(f"#   {f}\n" for f in sorted(tracking_flags))
        + "\n"
    )


def main() -> int:
    if not VANILLA_DIR.exists():
        print(
            f"ERROR: vanilla megastructure dir not found: {VANILLA_DIR}",
            file=sys.stderr,
        )
        return 1

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    tracking_flags = discover_tracking_flags()
    print(f"Discovered {len(tracking_flags)} tracking flags: {sorted(tracking_flags)}\n")

    hdr = header(tracking_flags)

    for name in TARGET_FILES:
        src = VANILLA_DIR / name
        if not src.exists():
            print(f"WARN: vanilla file missing: {src}", file=sys.stderr)
            continue
        original = src.read_text(encoding="utf-8")
        transformed, count = transform(original, tracking_flags)
        dest = OUTPUT_DIR / name
        dest.write_text(hdr + transformed, encoding="utf-8")
        print(f"  {name}: {count} replacements")

    print(f"\nWrote {len(TARGET_FILES)} files to {OUTPUT_DIR}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
