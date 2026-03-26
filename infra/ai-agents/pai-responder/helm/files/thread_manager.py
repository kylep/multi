"""Thread binding lifecycle manager for Pai Discord bot."""

import json
import logging
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path

log = logging.getLogger("pai-threads")


@dataclass
class ThreadBinding:
    thread_id: str
    session_id: str
    channel_id: str
    created_at: str
    last_active: str


class ThreadManager:
    """Manages Discord thread bindings with idle timeout and max age."""

    def __init__(
        self,
        state_path: str = "/data/thread_bindings.json",
        idle_timeout: int = 3600,
        max_age: int = 86400,
    ):
        self.state_path = Path(state_path)
        self.idle_timeout = idle_timeout
        self.max_age = max_age
        self.bindings: dict[str, ThreadBinding] = {}
        self.load()

    def bind(self, thread_id: str, channel_id: str = "") -> ThreadBinding:
        now = datetime.now(timezone.utc).isoformat()
        if thread_id in self.bindings:
            self.touch(thread_id)
            return self.bindings[thread_id]
        binding = ThreadBinding(
            thread_id=thread_id,
            session_id=f"thread:{thread_id}",
            channel_id=channel_id,
            created_at=now,
            last_active=now,
        )
        self.bindings[thread_id] = binding
        self.save()
        log.info("Bound thread %s", thread_id)
        return binding

    def unbind(self, thread_id: str):
        if thread_id in self.bindings:
            del self.bindings[thread_id]
            self.save()
            log.info("Unbound thread %s", thread_id)

    def is_bound(self, thread_id: str) -> bool:
        return thread_id in self.bindings

    def touch(self, thread_id: str):
        if thread_id in self.bindings:
            self.bindings[thread_id].last_active = datetime.now(timezone.utc).isoformat()

    def sweep(self) -> list[str]:
        """Return thread IDs that should be unbound due to idle timeout or max age."""
        now = datetime.now(timezone.utc)
        expired = []
        for tid, binding in list(self.bindings.items()):
            last_active = datetime.fromisoformat(binding.last_active)
            created_at = datetime.fromisoformat(binding.created_at)
            idle_secs = (now - last_active).total_seconds()
            age_secs = (now - created_at).total_seconds()
            if idle_secs > self.idle_timeout or age_secs > self.max_age:
                expired.append(tid)
        return expired

    def load(self):
        if not self.state_path.exists():
            return
        try:
            data = json.loads(self.state_path.read_text())
            for tid, b in data.items():
                self.bindings[tid] = ThreadBinding(**b)
            log.info("Loaded %d thread bindings", len(self.bindings))
        except (json.JSONDecodeError, TypeError, KeyError):
            log.warning("Failed to load thread bindings, starting fresh")
            self.bindings = {}

    def save(self):
        self.state_path.parent.mkdir(parents=True, exist_ok=True)
        data = {tid: asdict(b) for tid, b in self.bindings.items()}
        tmp = self.state_path.with_suffix(".tmp")
        tmp.write_text(json.dumps(data, indent=2))
        tmp.replace(self.state_path)
