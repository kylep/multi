#!/usr/bin/env python3
"""Build the Australia Overpowered mod by copying and modifying vanilla HOI4 files.

Reads vanilla state and country files from the Steam install, applies the OP
modifications, and writes the results into mod/history/. Re-run after a game
patch to re-absorb vanilla changes.
"""

import re
import shutil
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
MOD_DIR = SCRIPT_DIR.parent / "mod"
OUTPUT_STATES = MOD_DIR / "history" / "states"
OUTPUT_COUNTRIES = MOD_DIR / "history" / "countries"

# macOS Steam path
VANILLA_ROOT = Path.home() / "Library" / "Application Support" / "Steam" / "steamapps" / "common" / "Hearts of Iron IV"
VANILLA_STATES = VANILLA_ROOT / "history" / "states"
VANILLA_COUNTRIES = VANILLA_ROOT / "history" / "countries"

TAG = "AST"
COUNTRY_FILE = "AST - Australia.txt"
NATIONAL_SPIRIT = "AST_shell_be_right"
OPINION_MODIFIER = "loves_australia"

# Every state Australia owns in 1936: the mainland, Tasmania, Papua, the
# New Guinea mandate, Bismarck, Bougainville and Nauru. All get the full OP
# treatment plus an AST core (the territories are cored PNG/FIJ in vanilla).
AUSTRALIAN_STATES = {285, 517, 518, 519, 520, 521, 522, 523, 674, 725, 737, 870, 871, 872, 873, 979, 1070, 1073, 1074, 1075}

# Pacific island states that get an AST core only (no boost). Grouped by
# 1936 owner. Philippines, Dutch East Indies (except New Guinea), Japan's
# home islands, Okinawa and Taiwan are deliberately excluded.
NZL_STATES = {284, 723, 1079, 1080, 1081, 726}  # New Zealand + Western Samoa
ENG_STATES = {634, 636, 639, 643, 734, 270}  # Solomons, Fiji, Gilbert, Ellice, Santa Cruz, Pitcairn
FRA_STATES = {635, 641, 1071}  # New Caledonia, Tahiti, Vanuatu
JAP_STATES = {633, 645, 646, 647, 648, 684}  # Marshalls, Iwo Jima, Saipan, Palau, Marcus, Carolines
USA_STATES = {629, 630, 631, 632, 638, 642, 650, 727, 1072}  # Hawaii, Johnston, Midway, Wake, Guam, Phoenix, Attu, Line Is., American Samoa
LATAM_STATES = {948, 649}  # Easter Island (CHL), Galapagos (ECU)
INS_STATES = {669, 1057}  # Dutch New Guinea, Dutch Southern New Guinea

BOOST_STATES = AUSTRALIAN_STATES
CORE_ONLY_STATES = NZL_STATES | ENG_STATES | FRA_STATES | JAP_STATES | USA_STATES | LATAM_STATES | INS_STATES

ALL_STATES = BOOST_STATES | CORE_ONLY_STATES

# OP building values (state-level)
OP_RESOURCES = {
    "oil": 500,
    "aluminium": 500,
    "rubber": 500,
    "tungsten": 500,
    "steel": 500,
    "chromium": 500,
    "coal": 500,
}

OP_MANPOWER = 10000000

# Vanilla state filenames come in two shapes: "285-Austraila.txt" and
# "1070 - Bougainville.txt" (newer DLC states have spaces around the dash).
STATE_FILENAME_RE = re.compile(r"^(\d+)\s*-")


def extract_state_id(filename: str) -> int | None:
    """Extract state ID from a filename like '276-Canada.txt' or '1070 - Bougainville.txt'."""
    match = STATE_FILENAME_RE.match(filename)
    return int(match.group(1)) if match else None


def find_vanilla_file(state_id: int) -> Path | None:
    """Find the vanilla state file by ID prefix."""
    for f in VANILLA_STATES.iterdir():
        if f.suffix == ".txt" and extract_state_id(f.name) == state_id:
            return f
    return None


def add_core(content: str) -> str:
    """Add 'add_core_of = AST' after the last existing add_core_of line."""
    lines = content.split("\n")
    result = []
    last_core_idx = -1

    # Find the last add_core_of line
    for i, line in enumerate(lines):
        if re.search(r"add_core_of\s*=", line):
            last_core_idx = i

    if last_core_idx == -1:
        # No existing core line — find 'owner = ' and add after it
        for i, line in enumerate(lines):
            if re.search(r"owner\s*=", line):
                last_core_idx = i
                break

    has_core = any(re.search(rf"add_core_of\s*=\s*{TAG}\b", line) for line in lines)

    for i, line in enumerate(lines):
        result.append(line)
        if i == last_core_idx and not has_core:
            indent = re.match(r"^(\s*)", line).group(1)
            result.append(f"{indent}add_core_of = {TAG}")

    return "\n".join(result)


def boost_state(content: str) -> str:
    """Apply full OP modifications to a state file."""
    lines = content.split("\n")
    result = []
    resources_written = False
    brace_depth = 0

    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        opens = line.count("{")
        closes = line.count("}")

        # Replace state_category (can appear before or after history block)
        if re.search(r"state_category\s*=", line):
            indent = re.match(r"^(\s*)", line).group(1)
            result.append(f"{indent}state_category = gigalopolis")
            i += 1
            continue

        # Replace manpower (top-level, not inside history)
        if re.search(r"^\s*manpower\s*=", line) and brace_depth <= 1:
            indent = re.match(r"^(\s*)", line).group(1)
            result.append(f"{indent}manpower = {OP_MANPOWER}")
            i += 1
            continue

        # Replace the entire resources block
        if re.search(r"resources\s*=\s*\{", stripped):
            indent = re.match(r"^(\s*)", line).group(1)
            result.append(f"{indent}resources = {{")
            for res_name, res_val in OP_RESOURCES.items():
                result.append(f"{indent}\t{res_name} = {res_val}")
            resources_written = True
            # Skip until the matching close brace
            depth = opens - closes
            while depth > 0:
                i += 1
                depth += lines[i].count("{") - lines[i].count("}")
            result.append(f"{indent}}}")
            brace_depth = sum(l.count("{") - l.count("}") for l in result)
            i += 1
            continue

        result.append(line)
        brace_depth += opens - closes
        i += 1

    content = "\n".join(result)

    # If there was no resources block, add one after state_category
    if not resources_written:
        lines = content.split("\n")
        new_lines = []
        for line in lines:
            new_lines.append(line)
            if re.search(r"state_category\s*=", line):
                new_lines.append("")
                new_lines.append("\tresources = {")
                for res_name, res_val in OP_RESOURCES.items():
                    new_lines.append(f"\t\t{res_name} = {res_val}")
                new_lines.append("\t}")
        content = "\n".join(new_lines)

    return content


def build_country_file() -> None:
    """Copy the vanilla AST country file and inject the national spirit + opinion modifier.

    The injection goes right before the '1939.1.1 = {' block so it applies at
    the 1936 start regardless of DLC. Vanilla line endings and BOM are kept.
    """
    src = VANILLA_COUNTRIES / COUNTRY_FILE
    if not src.exists():
        print(f"ERROR: vanilla country file not found: {src}")
        sys.exit(1)

    raw = src.read_bytes()
    text = raw.decode("utf-8")
    newline = "\r\n" if "\r\n" in text else "\n"

    if NATIONAL_SPIRIT in text:
        print(f"  COUNTRY: {COUNTRY_FILE} (already patched?)")
    else:
        marker = re.search(r"^1939\.1\.1\s*=\s*\{", text, flags=re.MULTILINE)
        if not marker:
            print(f"ERROR: could not find the 1939.1.1 block in {COUNTRY_FILE}")
            sys.exit(1)
        injection = newline.join([
            f"add_ideas = {NATIONAL_SPIRIT}",
            "",
            "every_country = {",
            f"\tadd_opinion_modifier = {{ target = {TAG} modifier = {OPINION_MODIFIER} }}",
            "}",
            "",
            "",
        ])
        text = text[: marker.start()] + injection + text[marker.start():]
        print(f"  COUNTRY: {COUNTRY_FILE}")

    OUTPUT_COUNTRIES.mkdir(parents=True, exist_ok=True)
    (OUTPUT_COUNTRIES / COUNTRY_FILE).write_bytes(text.encode("utf-8"))


def build():
    """Main build function."""
    if not VANILLA_STATES.exists():
        print(f"ERROR: Vanilla state files not found at {VANILLA_STATES}")
        print("Make sure Hearts of Iron IV is installed via Steam.")
        sys.exit(1)

    # Clean output directories
    for d in (OUTPUT_STATES, OUTPUT_COUNTRIES):
        if d.exists():
            shutil.rmtree(d)
        d.mkdir(parents=True)

    processed = 0
    errors = []

    for state_id in sorted(ALL_STATES):
        vanilla_file = find_vanilla_file(state_id)
        if vanilla_file is None:
            errors.append(f"State {state_id}: vanilla file not found")
            continue

        content = vanilla_file.read_text(encoding="utf-8")
        output_file = OUTPUT_STATES / vanilla_file.name

        if state_id in BOOST_STATES:
            content = add_core(boost_state(content))
            print(f"  BOOSTED: {vanilla_file.name}")
        else:
            content = add_core(content)
            print(f"  CORE:    {vanilla_file.name}")

        output_file.write_text(content, encoding="utf-8")
        processed += 1

    build_country_file()

    print(f"\nProcessed {processed} state files")
    if errors:
        print(f"\nErrors ({len(errors)}):")
        for e in errors:
            print(f"  {e}")
        sys.exit(1)
    else:
        print("Build complete — no errors.")


if __name__ == "__main__":
    build()
