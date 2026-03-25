"""Persistent JSONL transcript storage for Pai Discord sessions."""

import json
import os
from datetime import datetime, timezone
from pathlib import Path


class TranscriptStore:
    """Append-only JSONL transcripts per session, stored on PVC."""

    def __init__(self, base_dir: str = "/data/transcripts"):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def _path(self, session_id: str) -> Path:
        safe_id = session_id.replace("/", "_").replace("..", "_")
        return self.base_dir / f"{safe_id}.jsonl"

    def append(self, session_id: str, role: str, author: str, content: str, msg_id: str = ""):
        entry = {
            "ts": datetime.now(timezone.utc).isoformat(),
            "role": role,
            "author": author,
            "content": content,
            "msg_id": msg_id,
        }
        path = self._path(session_id)
        with open(path, "a") as f:
            f.write(json.dumps(entry) + "\n")

    def read(self, session_id: str, last_n: int = 50) -> list[dict]:
        path = self._path(session_id)
        if not path.exists():
            return []
        lines = path.read_text().strip().splitlines()
        entries = []
        for line in lines[-last_n:]:
            try:
                entries.append(json.loads(line))
            except json.JSONDecodeError:
                continue
        return entries

    def compact(self, session_id: str, keep: int = 30, threshold: int = 100):
        """Truncate transcript to last `keep` entries when it exceeds `threshold`."""
        path = self._path(session_id)
        if not path.exists():
            return
        lines = path.read_text().strip().splitlines()
        if len(lines) <= threshold:
            return
        kept = lines[-keep:]
        tmp = path.with_suffix(".tmp")
        tmp.write_text("\n".join(kept) + "\n")
        os.replace(tmp, path)

    def delete(self, session_id: str):
        path = self._path(session_id)
        if path.exists():
            path.unlink()

    def format_for_prompt(self, session_id: str, last_n: int = 50) -> str:
        entries = self.read(session_id, last_n)
        if not entries:
            return ""
        lines = []
        for e in entries:
            ts = e.get("ts", "")[:19].replace("T", " ")
            author = e.get("author", "unknown")
            content = e.get("content", "")
            lines.append(f"[{ts}] {author}: {content}")
        return "\n".join(lines)
