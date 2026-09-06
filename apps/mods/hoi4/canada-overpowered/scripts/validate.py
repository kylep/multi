#!/usr/bin/env python3
"""Validate the Canada Overpowered mod state files."""

import re
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
MOD_DIR = SCRIPT_DIR.parent / "mod"
OUTPUT_STATES = MOD_DIR / "history" / "states"
VANILLA_STATES = Path.home() / "Library" / "Application Support" / "Steam" / "steamapps" / "common" / "Hearts of Iron IV" / "history" / "states"

CANADIAN_STATES = {276, 464, 465, 466, 467, 468, 469, 470, 471, 472, 473, 682, 683, 739, 740, 860, 861, 862, 863, 864, 865, 866, 867}
UK_CAN_STATES = {331, 332}
US_STATES = {261, 357, 358, 359, 360, 361, 362, 363, 364, 365, 366, 367, 368, 369, 370, 371, 372, 373, 374, 375, 376, 377, 378, 379, 380, 381, 382, 383, 384, 385, 386, 387, 388, 389, 390, 391, 392, 393, 394, 395, 396, 463, 629, 630, 631, 632, 638, 642, 650, 685, 686, 727}
MEX_STATES = {277, 474, 475, 476, 477, 478, 479, 480, 481, 482, 483, 484, 485}

BOOST_STATES = CANADIAN_STATES | UK_CAN_STATES
CORE_ONLY_STATES = US_STATES | MEX_STATES
ALL_STATES = BOOST_STATES | CORE_ONLY_STATES

# Max building levels
MAX_LEVELS = {
    "infrastructure": 5,
    "industrial_complex": 20,
    "arms_factory": 20,
    "dockyard": 20,
    "air_base": 10,
    "anti_air_building": 5,
    "synthetic_refinery": 3,
    "fuel_silo": 15,
    "nuclear_reactor": 1,
    "rocket_site": 3,
    "radar_station": 6,
    "naval_base": 10,
    "bunker": 10,
    "coastal_bunker": 10,
    "dam": 1,
}

SHARED_BUILDINGS = {"industrial_complex", "arms_factory", "dockyard", "synthetic_refinery", "fuel_silo", "nuclear_reactor", "rocket_site"}


def extract_state_id(filename: str) -> int | None:
    match = re.match(r"^(\d+)-", filename)
    return int(match.group(1)) if match else None


def extract_provinces(content: str) -> str | None:
    """Extract the provinces block content."""
    match = re.search(r"provinces\s*=\s*\{([^}]+)\}", content)
    return match.group(1).strip() if match else None


def extract_building_values(content: str) -> dict[str, int]:
    """Extract state-level building key=value pairs from the buildings block."""
    buildings = {}
    # Find the buildings block
    match = re.search(r"buildings\s*=\s*\{", content)
    if not match:
        return buildings

    # Parse buildings, skipping provincial sub-blocks
    start = match.end()
    depth = 1
    i = start
    while i < len(content) and depth > 0:
        if content[i] == "{":
            depth += 1
        elif content[i] == "}":
            depth -= 1
        i += 1

    buildings_text = content[start:i - 1]

    # Extract state-level buildings (not inside provincial blocks)
    lines = buildings_text.split("\n")
    in_provincial = 0
    for line in lines:
        stripped = line.strip()
        if re.match(r"\d+\s*=\s*\{", stripped):
            in_provincial += 1
        if in_provincial > 0:
            in_provincial += line.count("{") - line.count("}")
            if re.match(r"\d+\s*=\s*\{", stripped):
                in_provincial -= 1  # Don't double-count the opening
                in_provincial += 1
            continue
        # State-level building
        m = re.match(r"(\w+)\s*=\s*(\d+)", stripped)
        if m:
            buildings[m.group(1)] = int(m.group(2))

    return buildings


def validate():
    """Run all validation checks."""
    errors = []
    warnings = []

    if not OUTPUT_STATES.exists():
        print("ERROR: Output states directory does not exist. Run build.py first.")
        sys.exit(1)

    # Check all expected files exist
    found_ids = set()
    for f in OUTPUT_STATES.iterdir():
        if f.suffix == ".txt":
            sid = extract_state_id(f.name)
            if sid:
                found_ids.add(sid)

    missing = ALL_STATES - found_ids
    if missing:
        errors.append(f"Missing state files for IDs: {sorted(missing)}")

    extra = found_ids - ALL_STATES
    if extra:
        warnings.append(f"Extra state files for IDs: {sorted(extra)}")

    # Validate each file
    for f in sorted(OUTPUT_STATES.iterdir()):
        if f.suffix != ".txt":
            continue

        sid = extract_state_id(f.name)
        if sid is None:
            continue

        content = f.read_text(encoding="utf-8")
        prefix = f"{f.name}"

        # Check UTF-8 BOM
        raw = f.read_bytes()
        if raw[:3] == b"\xef\xbb\xbf":
            errors.append(f"{prefix}: has UTF-8 BOM (must be without BOM)")

        # Balanced braces
        opens = content.count("{")
        closes = content.count("}")
        if opens != closes:
            errors.append(f"{prefix}: unbalanced braces ({{ = {opens}, }} = {closes})")

        # Required fields
        if not re.search(r"state\s*=\s*\{", content):
            errors.append(f"{prefix}: missing 'state = {{'")
        if not re.search(r"id\s*=\s*" + str(sid), content):
            errors.append(f"{prefix}: missing or wrong state id")
        if not re.search(r"name\s*=", content):
            errors.append(f"{prefix}: missing 'name'")
        if not re.search(r"history\s*=\s*\{", content):
            errors.append(f"{prefix}: missing 'history = {{'")
        if not re.search(r"provinces\s*=\s*\{", content):
            errors.append(f"{prefix}: missing 'provinces = {{'")

        # Province list matches vanilla
        vanilla_file = None
        for vf in VANILLA_STATES.iterdir():
            if vf.name == f.name:
                vanilla_file = vf
                break
        if vanilla_file:
            vanilla_provinces = extract_provinces(vanilla_file.read_text(encoding="utf-8"))
            mod_provinces = extract_provinces(content)
            if vanilla_provinces and mod_provinces:
                # Normalize whitespace for comparison
                v_norm = " ".join(vanilla_provinces.split())
                m_norm = " ".join(mod_provinces.split())
                if v_norm != m_norm:
                    errors.append(f"{prefix}: province list differs from vanilla")

        # CAN core check
        has_can_core = bool(re.search(r"add_core_of\s*=\s*CAN", content))
        if sid in ALL_STATES and not has_can_core:
            errors.append(f"{prefix}: missing add_core_of = CAN")

        # Boosted state checks
        if sid in BOOST_STATES:
            if not re.search(r"state_category\s*=\s*gigalopolis", content):
                errors.append(f"{prefix}: expected state_category = megalopolis")
            if not re.search(r"manpower\s*=\s*10000000", content):
                errors.append(f"{prefix}: expected manpower = 10000000")
            # Check resources exist
            for res in ["oil", "aluminium", "rubber", "tungsten", "steel", "chromium"]:
                if not re.search(rf"{res}\s*=\s*500", content):
                    errors.append(f"{prefix}: expected {res} = 500")

        # Building level checks
        buildings = extract_building_values(content)
        shared_total = 0
        for bname, bval in buildings.items():
            if bname in MAX_LEVELS and bval > MAX_LEVELS[bname]:
                errors.append(f"{prefix}: {bname} = {bval} exceeds max {MAX_LEVELS[bname]}")
            if bname in SHARED_BUILDINGS:
                shared_total += bval
        if shared_total > 25:
            errors.append(f"{prefix}: shared building slots = {shared_total} exceeds max 25")

    # Summary
    print(f"Validated {len(found_ids)} state files")
    if warnings:
        print(f"\nWarnings ({len(warnings)}):")
        for w in warnings:
            print(f"  WARN: {w}")
    if errors:
        print(f"\nErrors ({len(errors)}):")
        for e in errors:
            print(f"  FAIL: {e}")
        sys.exit(1)
    else:
        print("\nAll checks passed.")


if __name__ == "__main__":
    validate()
