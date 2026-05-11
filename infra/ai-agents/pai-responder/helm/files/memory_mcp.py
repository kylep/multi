#!/usr/bin/env python3
"""Pai memory MCP v2 -- markdown-backed.

Storage:
  /data/MEMORY.md          long-term durable, organized by ## sections
  /data/daily/YYYY-MM-DD.md  rolling daily notes
  /data/COMMITMENTS.md     YAML-fenced blocks for follow-ups
"""

from __future__ import annotations

import math
import os
import re
import uuid
from collections import Counter
from datetime import date, datetime, timezone
from pathlib import Path

DATA_DIR = Path(os.environ.get("MEMORY_DATA_DIR", "/data"))
MEMORY_FILE = DATA_DIR / "MEMORY.md"
DAILY_DIR = DATA_DIR / "daily"
COMMITMENTS_FILE = DATA_DIR / "COMMITMENTS.md"


def write_atomic(path: Path, content: str) -> None:
    """Atomic file write via tmp + replace."""
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + ".tmp")
    tmp.write_text(content)
    tmp.replace(path)


_TOKEN_RE = re.compile(r"\w+", re.UNICODE)


def _tokenize(text: str) -> list[str]:
    return [t.lower() for t in _TOKEN_RE.findall(text)]


def bm25_score(
    query: str,
    docs: list[str],
    k1: float = 1.5,
    b: float = 0.75,
) -> list[tuple[int, float]]:
    """BM25-Okapi scorer. Returns [(doc_index, score), ...] sorted desc.

    Docs with score <= 0 are dropped. Empty corpus or empty query returns [].
    """
    if not docs:
        return []
    q_terms = _tokenize(query)
    if not q_terms:
        return []

    tokenized = [_tokenize(d) for d in docs]
    n = len(tokenized)
    avgdl = sum(len(d) for d in tokenized) / n if n else 0.0

    df: Counter[str] = Counter()
    for d in tokenized:
        for term in set(d):
            df[term] += 1

    results: list[tuple[int, float]] = []
    for i, doc in enumerate(tokenized):
        if not doc:
            continue
        tf = Counter(doc)
        score = 0.0
        for term in q_terms:
            if term not in tf:
                continue
            idf = math.log(1 + (n - df[term] + 0.5) / (df[term] + 0.5))
            num = tf[term] * (k1 + 1)
            denom = tf[term] + k1 * (1 - b + b * len(doc) / avgdl)
            score += idf * num / denom
        if score > 0:
            results.append((i, score))

    results.sort(key=lambda x: x[1], reverse=True)
    return results


_SECTION_RE = re.compile(r"^##\s+(.+?)\s*$")
_BULLET_RE = re.compile(r"^-\s+(.+?)\s*$")


def parse_memory_md(content: str) -> dict[str, list[str]]:
    """Parse MEMORY.md into {section_header: [bullet, ...]}."""
    sections: dict[str, list[str]] = {}
    current: str | None = None
    for line in content.splitlines():
        m_section = _SECTION_RE.match(line)
        if m_section:
            current = m_section.group(1)
            sections.setdefault(current, [])
            continue
        m_bullet = _BULLET_RE.match(line)
        if m_bullet and current is not None:
            sections[current].append(m_bullet.group(1))
    return sections


def append_memory_section(path: Path, section: str, bullet: str) -> None:
    """Append a bullet under `## <section>`, creating the section if absent."""
    existing = path.read_text() if path.exists() else ""
    sections = parse_memory_md(existing)
    if section in sections:
        lines = existing.splitlines()
        out: list[str] = []
        inserted = False
        i = 0
        while i < len(lines):
            line = lines[i]
            out.append(line)
            m = _SECTION_RE.match(line)
            if not inserted and m and m.group(1) == section:
                j = i + 1
                while j < len(lines) and (_BULLET_RE.match(lines[j]) or lines[j].strip() == ""):
                    out.append(lines[j])
                    j += 1
                while out and out[-1].strip() == "":
                    out.pop()
                out.append(f"- {bullet}")
                out.append("")
                i = j
                inserted = True
                continue
            i += 1
        write_atomic(path, "\n".join(out).rstrip() + "\n")
    else:
        prefix = existing.rstrip() + "\n\n" if existing.strip() else ""
        write_atomic(path, f"{prefix}## {section}\n- {bullet}\n")


def append_daily_note(d: date, content: str, when: datetime | None = None) -> None:
    """Append a timestamped bullet to daily/YYYY-MM-DD.md."""
    when = when or datetime.now(timezone.utc)
    path = DAILY_DIR / f"{d.isoformat()}.md"
    existing = path.read_text() if path.exists() else f"# Daily notes -- {d.isoformat()}\n\n"
    line = f"- [{when.strftime('%H:%M')} UTC] {content}"
    write_atomic(path, existing.rstrip() + "\n" + line + "\n")


def parse_commitments(content: str) -> list[dict]:
    """Parse YAML-fenced commitment blocks separated by `---`.

    Returns list of dicts with frontmatter keys plus 'content' (body).
    """
    if not content.strip():
        return []
    parts: list[str] = []
    buf: list[str] = []
    for line in content.splitlines():
        if line.strip() == "---":
            parts.append("\n".join(buf))
            buf = []
        else:
            buf.append(line)
    parts.append("\n".join(buf))

    cmts: list[dict] = []
    i = 1
    while i + 1 <= len(parts) - 1:
        frontmatter = parts[i].strip()
        body = parts[i + 1] if i + 1 < len(parts) else ""
        i += 2
        if not frontmatter:
            continue
        d: dict = {}
        for fm_line in frontmatter.splitlines():
            if ":" in fm_line:
                k, _, v = fm_line.partition(":")
                d[k.strip()] = v.strip()
        d["content"] = body.strip("\n")
        cmts.append(d)
    return cmts


def _serialize_commitment(c: dict) -> str:
    fields = ["id", "status", "precision", "due", "scope", "created", "source"]
    lines = ["---"]
    for k in fields:
        if k in c and c[k] != "":
            lines.append(f"{k}: {c[k]}")
    lines.append("---")
    body = c.get("content", "").strip("\n")
    if body:
        lines.append(body)
    return "\n".join(lines)


def write_commitments(path: Path, commitments: list[dict]) -> None:
    """Re-serialize all commitments to disk."""
    if not commitments:
        write_atomic(path, "")
        return
    blocks = [_serialize_commitment(c) for c in commitments]
    write_atomic(path, "\n".join(blocks) + "\n")


def add_commitment(
    path: Path,
    content: str,
    due: str,
    scope: str,
    precision: str = "soft",
    source: str = "",
) -> str:
    """Append a new pending commitment, return its id."""
    existing = path.read_text() if path.exists() else ""
    cmts = parse_commitments(existing)
    cmt_id = "c-" + uuid.uuid4().hex[:8]
    cmts.append({
        "id": cmt_id,
        "status": "pending",
        "precision": precision,
        "due": due,
        "scope": scope,
        "created": datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
        "source": source,
        "content": content.strip(),
    })
    write_commitments(path, cmts)
    return cmt_id


def mark_commitment_done(path: Path, cmt_id: str) -> bool:
    """Mark a commitment delivered. Returns True if found, False otherwise."""
    if not path.exists():
        return False
    cmts = parse_commitments(path.read_text())
    found = False
    for c in cmts:
        if c.get("id") == cmt_id:
            c["status"] = "delivered"
            found = True
    if found:
        write_commitments(path, cmts)
    return found


def commitments_due_at(path: Path, when: datetime) -> list[dict]:
    """Return pending commitments whose due time is <= when."""
    if not path.exists():
        return []
    cmts = parse_commitments(path.read_text())
    out: list[dict] = []
    for c in cmts:
        if c.get("status") != "pending":
            continue
        due_str = c.get("due", "")
        if not due_str:
            continue
        try:
            due_dt = datetime.fromisoformat(due_str.replace("Z", "+00:00"))
        except ValueError:
            continue
        # Pai sometimes saves naive ISO timestamps (e.g. "2026-05-09T22:08:00").
        # Treat naive as UTC so we can compare against `when` (always aware).
        if due_dt.tzinfo is None:
            due_dt = due_dt.replace(tzinfo=timezone.utc)
        if due_dt <= when:
            out.append(c)
    return out


class MemoryStore:
    """Facade over markdown storage. Tool functions delegate here."""

    def __init__(self) -> None:
        data_dir = Path(os.environ.get("MEMORY_DATA_DIR", "/data"))
        self.data_dir = data_dir
        self.memory_path = data_dir / "MEMORY.md"
        self.daily_dir = data_dir / "daily"
        self.commitments_path = data_dir / "COMMITMENTS.md"

    def save(
        self,
        scope: str,
        content: str,
        key: str | None = None,
        due: str | None = None,
        precision: str | None = None,
        commitment_scope: str | None = None,
    ) -> str:
        if scope == "long":
            if not key:
                raise ValueError("key required for scope='long'")
            append_memory_section(self.memory_path, key, content)
            return f"Saved to MEMORY.md under '## {key}'"
        if scope == "daily":
            today = date.today()
            append_daily_note(today, content)
            return f"Appended to daily/{today.isoformat()}.md"
        if scope == "commitment":
            if not due:
                raise ValueError("due required for scope='commitment'")
            if not commitment_scope:
                raise ValueError("commitment_scope required for scope='commitment'")
            cmt_id = add_commitment(
                self.commitments_path,
                content=content,
                due=due,
                scope=commitment_scope,
                precision=precision or "soft",
            )
            return f"Saved commitment {cmt_id}"
        raise ValueError(f"unknown scope: {scope!r}")

    def _collect_searchables(
        self, scope: str | None
    ) -> list[tuple[str, int, str]]:
        out: list[tuple[str, int, str]] = []
        if scope in (None, "long") and self.memory_path.exists():
            current_section: str | None = None
            for i, line in enumerate(self.memory_path.read_text().splitlines(), start=1):
                m_section = _SECTION_RE.match(line)
                if m_section:
                    current_section = m_section.group(1)
                    continue
                m_bullet = _BULLET_RE.match(line)
                if m_bullet:
                    bullet_text = m_bullet.group(1)
                    snippet = (
                        f"{current_section}: {bullet_text}"
                        if current_section
                        else bullet_text
                    )
                    out.append((str(self.memory_path), i, snippet))
        if scope in (None, "daily") and self.daily_dir.exists():
            for f in sorted(self.daily_dir.glob("*.md")):
                for i, line in enumerate(f.read_text().splitlines(), start=1):
                    if _BULLET_RE.match(line):
                        out.append((str(f), i, line))
        if scope in (None, "commitment") and self.commitments_path.exists():
            cmts = parse_commitments(self.commitments_path.read_text())
            for c in cmts:
                out.append((
                    str(self.commitments_path),
                    0,
                    f"[{c.get('status','?')}] {c.get('content','').strip()}",
                ))
        return out

    def search(
        self,
        query: str,
        scope: str | None = None,
        limit: int = 5,
    ) -> list[dict]:
        searchables = self._collect_searchables(scope)
        if not searchables:
            return []
        docs = [s[2] for s in searchables]
        hits = bm25_score(query, docs)
        return [
            {
                "path": searchables[i][0],
                "line": searchables[i][1],
                "snippet": searchables[i][2],
                "score": round(score, 3),
            }
            for i, score in hits[:limit]
        ]

    def recall(self, query: str, max_chars: int = 400) -> str:
        hits = self.search(query, limit=10)
        if not hits:
            return "NONE"
        out_lines: list[str] = []
        used = 0
        for h in hits:
            line = h["snippet"]
            if used + len(line) + 1 > max_chars:
                break
            out_lines.append(line)
            used += len(line) + 1
        if not out_lines:
            return "NONE"
        return "\n".join(out_lines)

    def get(self, path: str, lines: tuple[int, int] | None = None) -> str:
        p = Path(path)
        if not p.exists():
            return f"(file not found: {path})"
        if lines is None:
            return p.read_text()
        start, end = lines
        body = p.read_text().splitlines()
        return "\n".join(body[max(0, start - 1):end])

    def list_(self, scope: str) -> str:
        if scope == "long":
            if not self.memory_path.exists():
                return "(no long-term memory)"
            sections = parse_memory_md(self.memory_path.read_text())
            if not sections:
                return "(no sections)"
            return "\n".join(
                f"- {name} ({len(bullets)} entries)" for name, bullets in sections.items()
            )
        if scope == "daily":
            if not self.daily_dir.exists():
                return "(no daily notes)"
            files = sorted(self.daily_dir.glob("*.md"))
            return "\n".join(f"- {f.stem}" for f in files) or "(empty)"
        if scope == "commitment":
            if not self.commitments_path.exists():
                return "(no commitments)"
            cmts = parse_commitments(self.commitments_path.read_text())
            if not cmts:
                return "(empty)"
            return "\n".join(
                f"- {c.get('id')} [{c.get('status')}] due={c.get('due')} {c.get('content','').strip()[:60]}"
                for c in cmts
            )
        raise ValueError(f"unknown scope: {scope!r}")

    def commitment_done(self, cmt_id: str) -> str:
        ok = mark_commitment_done(self.commitments_path, cmt_id)
        return f"Marked {cmt_id} delivered" if ok else f"Commitment {cmt_id} not found"

    def commitments_due(self, now_iso: str | None = None) -> list[dict]:
        when = (
            datetime.fromisoformat(now_iso.replace("Z", "+00:00"))
            if now_iso
            else datetime.now(timezone.utc)
        )
        return commitments_due_at(self.commitments_path, when)

    def promote(self, date_str: str, line_num: int, section: str = "Promoted") -> str:
        daily_path = self.daily_dir / f"{date_str}.md"
        if not daily_path.exists():
            return f"daily/{date_str}.md not found"
        lines = daily_path.read_text().splitlines()
        if line_num < 1 or line_num > len(lines):
            return f"line {line_num} out of range"
        bullet_match = _BULLET_RE.match(lines[line_num - 1])
        if not bullet_match:
            return f"line {line_num} is not a bullet"
        body = bullet_match.group(1)
        body = re.sub(r"^\[\d{2}:\d{2} UTC\]\s*", "", body)
        append_memory_section(self.memory_path, section, body)
        return f"Promoted to MEMORY.md under '## {section}'"


# --- FastMCP wiring ---

from mcp.server.fastmcp import FastMCP  # noqa: E402

mcp = FastMCP("pai-memory")
_store: MemoryStore | None = None


def _get_store() -> MemoryStore:
    global _store
    if _store is None:
        _store = MemoryStore()
    return _store


@mcp.tool()
async def memory_save(
    scope: str,
    content: str,
    key: str = "",
    due: str = "",
    precision: str = "",
    commitment_scope: str = "",
) -> str:
    """Save a memory.

    scope: 'long' (durable, requires key), 'daily' (timestamped daily note),
           or 'commitment' (requires due ISO time and commitment_scope).
    """
    return _get_store().save(
        scope=scope,
        content=content,
        key=key or None,
        due=due or None,
        precision=precision or None,
        commitment_scope=commitment_scope or None,
    )


@mcp.tool()
async def memory_search(query: str, scope: str = "", limit: int = 5) -> str:
    """BM25 search across memory files. Returns formatted hits with provenance."""
    hits = _get_store().search(query=query, scope=scope or None, limit=limit)
    if not hits:
        return "(no hits)"
    lines: list[str] = []
    for h in hits:
        lines.append(f"[{h['path']}:{h['line']}] (score={h['score']}) {h['snippet']}")
    return "\n".join(lines)


@mcp.tool()
async def memory_recall(query: str, max_chars: int = 400) -> str:
    """Compact digest. Returns 'NONE' if no relevant memory."""
    return _get_store().recall(query=query, max_chars=max_chars)


@mcp.tool()
async def memory_get(path: str, start: int = 0, end: int = 0) -> str:
    """Direct file read with optional line range (1-indexed, inclusive)."""
    lines = (start, end) if (start and end) else None
    return _get_store().get(path=path, lines=lines)


@mcp.tool()
async def memory_list(scope: str) -> str:
    """List entries by scope: 'long', 'daily', or 'commitment'."""
    return _get_store().list_(scope=scope)


@mcp.tool()
async def memory_commitment_due(now_iso: str = "") -> str:
    """Return pending commitments due at or before now_iso (defaults to now)."""
    cmts = _get_store().commitments_due(now_iso=now_iso or None)
    if not cmts:
        return "(none due)"
    lines: list[str] = []
    for c in cmts:
        lines.append(
            f"{c.get('id')} due={c.get('due')} scope={c.get('scope')} precision={c.get('precision')}: {c.get('content','').strip()}"
        )
    return "\n".join(lines)


@mcp.tool()
async def memory_commitment_done(cmt_id: str) -> str:
    """Mark a commitment as delivered."""
    return _get_store().commitment_done(cmt_id=cmt_id)


@mcp.tool()
async def memory_promote(date_str: str, line_num: int, section: str = "Promoted") -> str:
    """Move a daily-note bullet to MEMORY.md under the given section."""
    return _get_store().promote(date_str=date_str, line_num=line_num, section=section)


if __name__ == "__main__":
    mcp.run(transport="stdio")
