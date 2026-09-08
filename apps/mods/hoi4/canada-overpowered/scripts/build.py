#!/usr/bin/env python3
"""Build the Canada Overpowered mod by copying and modifying vanilla HOI4 state files."""

import os
import re
import shutil
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
MOD_DIR = SCRIPT_DIR.parent / "mod"
OUTPUT_STATES = MOD_DIR / "history" / "states"

# macOS Steam path
VANILLA_STATES = Path.home() / "Library" / "Application Support" / "Steam" / "steamapps" / "common" / "Hearts of Iron IV" / "history" / "states"

# State IDs by category
CANADIAN_STATES = {276, 464, 465, 466, 467, 468, 469, 470, 471, 472, 473, 682, 683, 739, 740, 860, 861, 862, 863, 864, 865, 866, 867}
UK_CAN_STATES = {331, 332}  # UK-owned, already have CAN core — boost them
US_STATES = {261, 357, 358, 359, 360, 361, 362, 363, 364, 365, 366, 367, 368, 369, 370, 371, 372, 373, 374, 375, 376, 377, 378, 379, 380, 381, 382, 383, 384, 385, 386, 387, 388, 389, 390, 391, 392, 393, 394, 395, 396, 463, 629, 630, 631, 632, 638, 642, 650, 685, 686, 727}
MEX_STATES = {277, 474, 475, 476, 477, 478, 479, 480, 481, 482, 483, 484, 485}

BOOST_STATES = CANADIAN_STATES | UK_CAN_STATES  # All states that get the full OP treatment
CORE_ONLY_STATES = US_STATES | MEX_STATES  # Just add CAN core

ALL_STATES = BOOST_STATES | CORE_ONLY_STATES

# OP building values (state-level)
OP_RESOURCES = {
    "oil": 500,
    "aluminium": 500,
    "rubber": 500,
    "tungsten": 500,
    "steel": 500,
    "chromium": 500,
}

OP_MANPOWER = 10000000


def find_vanilla_file(state_id: int) -> Path | None:
    """Find the vanilla state file by ID prefix."""
    for f in VANILLA_STATES.iterdir():
        if f.name.startswith(f"{state_id}-") and f.suffix == ".txt":
            return f
    return None


def extract_state_id(filename: str) -> int | None:
    """Extract state ID from filename like '276-Canada.txt'."""
    match = re.match(r"^(\d+)-", filename)
    if match:
        return int(match.group(1))
    return None


def add_can_core(content: str) -> str:
    """Add 'add_core_of = CAN' after the last existing add_core_of line."""
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

    # Check if CAN core already exists
    has_can_core = any(re.search(r"add_core_of\s*=\s*CAN", line) for line in lines)

    for i, line in enumerate(lines):
        result.append(line)
        if i == last_core_idx and not has_can_core:
            # Detect indentation from the current line
            indent = re.match(r"^(\s*)", line).group(1)
            result.append(f"{indent}add_core_of = CAN")

    return "\n".join(result)


def boost_state(content: str) -> str:
    """Apply full OP modifications to a state file."""
    lines = content.split("\n")
    result = []
    in_resources = False
    resources_written = False
    brace_depth = 0

    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        # Track brace depth
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

        # Handle resources block — replace entire block
        if re.search(r"resources\s*=\s*\{", stripped) and not in_resources:
            in_resources = True
            resources_depth = brace_depth + opens
            indent = re.match(r"^(\s*)", line).group(1)
            result.append(f"{indent}resources = {{")
            for res_name, res_val in OP_RESOURCES.items():
                result.append(f"{indent}\t{res_name} = {res_val}")
            resources_written = True
            # Skip until matching close brace
            depth = opens - closes
            while depth > 0:
                i += 1
                depth += lines[i].count("{") - lines[i].count("}")
            result.append(f"{indent}}}")
            brace_depth += opens - closes
            for j in range(i + 1 - len(lines) + len(lines), i + 1):
                brace_depth += lines[j].count("{") - lines[j].count("}")
            # Recalculate brace_depth properly
            brace_depth = 0
            for j in range(i + 1):
                brace_depth += lines[j].count("{") - lines[j].count("}")
            # Subtract what we already counted in result
            brace_depth = sum(l.count("{") - l.count("}") for l in result)
            i += 1
            in_resources = False
            continue

        result.append(line)
        brace_depth += opens - closes
        i += 1

    content = "\n".join(result)

    # If there was no resources block, add one before history
    if not resources_written:
        # Insert resources block after state_category line
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


def build():
    """Main build function."""
    if not VANILLA_STATES.exists():
        print(f"ERROR: Vanilla state files not found at {VANILLA_STATES}")
        print("Make sure Hearts of Iron IV is installed via Steam.")
        sys.exit(1)

    # Clean output directory
    if OUTPUT_STATES.exists():
        shutil.rmtree(OUTPUT_STATES)
    OUTPUT_STATES.mkdir(parents=True)

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
            content = boost_state(content)
            # Also ensure CAN core exists (for UK states that might not have it)
            if state_id in UK_CAN_STATES:
                content = add_can_core(content)
            print(f"  BOOSTED: {vanilla_file.name}")
        elif state_id in CORE_ONLY_STATES:
            content = add_can_core(content)
            print(f"  CORE:    {vanilla_file.name}")

        output_file.write_text(content, encoding="utf-8")
        processed += 1

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
