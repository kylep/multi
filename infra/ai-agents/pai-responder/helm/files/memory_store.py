"""Simple keyword-searchable memory store for Pai, persisted as JSON."""

import json
import logging
from datetime import datetime, timezone
from pathlib import Path

log = logging.getLogger("pai-memory")

MAX_MEMORIES = 500


class MemoryStore:
    """Flat JSON memory with keyword search. No vector DB needed."""

    def __init__(self, path: str = "/data/memory.json"):
        self.path = Path(path)
        self.memories: list[dict] = []
        self.load()

    def add(self, key: str, content: str, context: str = ""):
        entry = {
            "key": key.lower().strip(),
            "content": content,
            "context": context,
            "ts": datetime.now(timezone.utc).isoformat(),
        }
        self.memories.append(entry)
        # FIFO eviction
        if len(self.memories) > MAX_MEMORIES:
            self.memories = self.memories[-MAX_MEMORIES:]
        self.save()
        log.info("Saved memory key=%s", key)

    def search(self, query: str, limit: int = 5) -> list[dict]:
        query_lower = query.lower()
        tokens = query_lower.split()
        scored: list[tuple[int, dict]] = []
        for mem in self.memories:
            searchable = f"{mem['key']} {mem['content']} {mem.get('context', '')}".lower()
            score = sum(1 for t in tokens if t in searchable)
            if score > 0:
                scored.append((score, mem))
        scored.sort(key=lambda x: x[0], reverse=True)
        return [m for _, m in scored[:limit]]

    def delete(self, key: str):
        key_lower = key.lower().strip()
        before = len(self.memories)
        self.memories = [m for m in self.memories if m["key"] != key_lower]
        removed = before - len(self.memories)
        if removed:
            self.save()
            log.info("Deleted %d memories with key=%s", removed, key)

    def list_keys(self) -> list[str]:
        return sorted(set(m["key"] for m in self.memories))

    def load(self):
        if not self.path.exists():
            return
        try:
            self.memories = json.loads(self.path.read_text())
            log.info("Loaded %d memories", len(self.memories))
        except (json.JSONDecodeError, TypeError):
            log.warning("Failed to load memories, starting fresh")
            self.memories = []

    def save(self):
        self.path.parent.mkdir(parents=True, exist_ok=True)
        tmp = self.path.with_suffix(".tmp")
        tmp.write_text(json.dumps(self.memories, indent=2))
        tmp.replace(self.path)
