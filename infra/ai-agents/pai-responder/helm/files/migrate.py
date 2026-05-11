#!/usr/bin/env python3
"""One-shot migration: legacy /data/memory.json -> /data/MEMORY.md.

Idempotent. Run as an init container before gateway.py starts.
Exits 0 in all non-error cases.
"""

import json
import logging
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from memory_mcp import append_memory_section  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(levelname)s migrate %(message)s")
log = logging.getLogger("migrate")


def run() -> str:
    data_dir = Path(os.environ.get("MEMORY_DATA_DIR", "/data"))
    legacy = data_dir / "memory.json"
    target = data_dir / "MEMORY.md"

    if not legacy.exists():
        log.info("no legacy memory.json -- skip")
        return "no legacy memory.json -- skip"
    if target.exists():
        log.info("MEMORY.md already exists -- skip (already migrated)")
        return "already migrated -- skip"

    try:
        entries = json.loads(legacy.read_text())
    except json.JSONDecodeError as e:
        log.error("legacy memory.json is malformed: %s", e)
        return f"error: malformed legacy file ({e})"

    if not isinstance(entries, list):
        log.error("legacy memory.json is not a list")
        return "error: legacy file is not a list"

    grouped: dict[str, list[dict]] = {}
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        key = (entry.get("key") or "uncategorized").strip() or "uncategorized"
        grouped.setdefault(key, []).append(entry)

    for key, items in grouped.items():
        for item in items:
            content = (item.get("content") or "").strip()
            if not content:
                continue
            ctx = (item.get("context") or "").strip()
            ts = (item.get("ts") or "").strip()
            extras: list[str] = []
            if ctx:
                extras.append(f"context: {ctx}")
            if ts:
                extras.append(f"ts: {ts}")
            bullet = content
            if extras:
                bullet = f"{content} (" + "; ".join(extras) + ")"
            append_memory_section(target, key, bullet)

    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    backup = data_dir / f"memory.json.bak.{stamp}"
    legacy.rename(backup)

    log.info("migrated %d entries from %s to %s; backup at %s",
             len(entries), legacy, target, backup)
    return f"migrated {len(entries)} entries"


if __name__ == "__main__":
    print(run())
