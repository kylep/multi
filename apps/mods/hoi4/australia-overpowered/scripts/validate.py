#!/usr/bin/env python3
"""Validate the Australia Overpowered mod output files (run build.py first)."""

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from build import (  # noqa: E402
    ALL_STATES,
    BOOST_STATES,
    COUNTRY_FILE,
    NATIONAL_SPIRIT,
    OP_MANPOWER,
    OP_RESOURCES,
    OPINION_MODIFIER,
    OUTPUT_COUNTRIES,
    OUTPUT_STATES,
    TAG,
    VANILLA_STATES,
    extract_state_id,
)

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


def extract_provinces(content: str) -> str | None:
    """Extract the provinces block content."""
    match = re.search(r"provinces\s*=\s*\{([^}]+)\}", content)
    return match.group(1).strip() if match else None


def extract_building_values(content: str) -> dict[str, int]:
    """Extract state-level building key=value pairs from the buildings block."""
    buildings = {}
    match = re.search(r"buildings\s*=\s*\{", content)
    if not match:
        return buildings

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

    # State-level buildings only (skip provincial sub-blocks like '1234 = { ... }')
    in_provincial = 0
    for line in buildings_text.split("\n"):
        stripped = line.strip()
        if in_provincial > 0:
            in_provincial += line.count("{") - line.count("}")
            continue
        if re.match(r"\d+\s*=\s*\{", stripped):
            in_provincial += line.count("{") - line.count("}")
            continue
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

    for f in sorted(OUTPUT_STATES.iterdir()):
        if f.suffix != ".txt":
            continue

        sid = extract_state_id(f.name)
        if sid is None:
            continue

        content = f.read_text(encoding="utf-8")
        prefix = f.name

        raw = f.read_bytes()
        if raw[:3] == b"\xef\xbb\xbf":
            errors.append(f"{prefix}: has UTF-8 BOM (must be without BOM)")

        opens = content.count("{")
        closes = content.count("}")
        if opens != closes:
            errors.append(f"{prefix}: unbalanced braces ({{ = {opens}, }} = {closes})")

        if not re.search(r"state\s*=\s*\{", content):
            errors.append(f"{prefix}: missing 'state = {{'")
        if not re.search(r"id\s*=\s*" + str(sid) + r"\b", content):
            errors.append(f"{prefix}: missing or wrong state id")
        if not re.search(r"name\s*=", content):
            errors.append(f"{prefix}: missing 'name'")
        if not re.search(r"history\s*=\s*\{", content):
            errors.append(f"{prefix}: missing 'history = {{'")
        if not re.search(r"provinces\s*=\s*\{", content):
            errors.append(f"{prefix}: missing 'provinces = {{'")

        # Province list must match vanilla exactly
        vanilla_file = VANILLA_STATES / f.name
        if vanilla_file.exists():
            vanilla_provinces = extract_provinces(vanilla_file.read_text(encoding="utf-8"))
            mod_provinces = extract_provinces(content)
            if vanilla_provinces and mod_provinces:
                if " ".join(vanilla_provinces.split()) != " ".join(mod_provinces.split()):
                    errors.append(f"{prefix}: province list differs from vanilla")
        else:
            warnings.append(f"{prefix}: no matching vanilla file to compare provinces against")

        if not re.search(rf"add_core_of\s*=\s*{TAG}\b", content):
            errors.append(f"{prefix}: missing add_core_of = {TAG}")

        if sid in BOOST_STATES:
            if not re.search(r"state_category\s*=\s*gigalopolis", content):
                errors.append(f"{prefix}: expected state_category = gigalopolis")
            if not re.search(rf"manpower\s*=\s*{OP_MANPOWER}", content):
                errors.append(f"{prefix}: expected manpower = {OP_MANPOWER}")
            for res, val in OP_RESOURCES.items():
                if not re.search(rf"{res}\s*=\s*{val}\b", content):
                    errors.append(f"{prefix}: expected {res} = {val}")

        buildings = extract_building_values(content)
        shared_total = 0
        for bname, bval in buildings.items():
            if bname in MAX_LEVELS and bval > MAX_LEVELS[bname]:
                errors.append(f"{prefix}: {bname} = {bval} exceeds max {MAX_LEVELS[bname]}")
            if bname in SHARED_BUILDINGS:
                shared_total += bval
        if shared_total > 25:
            errors.append(f"{prefix}: shared building slots = {shared_total} exceeds max 25")

    # Country file
    country = OUTPUT_COUNTRIES / COUNTRY_FILE
    if not country.exists():
        errors.append(f"missing history/countries/{COUNTRY_FILE}")
    else:
        text = country.read_text(encoding="utf-8-sig")
        if text.count("{") != text.count("}"):
            errors.append(f"{COUNTRY_FILE}: unbalanced braces")
        if not re.search(rf"^add_ideas\s*=\s*{NATIONAL_SPIRIT}\s*$", text, flags=re.MULTILINE):
            errors.append(f"{COUNTRY_FILE}: missing add_ideas = {NATIONAL_SPIRIT}")
        if OPINION_MODIFIER not in text:
            errors.append(f"{COUNTRY_FILE}: missing {OPINION_MODIFIER} opinion modifier")

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
