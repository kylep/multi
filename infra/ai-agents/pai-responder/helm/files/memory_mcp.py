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
        if due_dt <= when:
            out.append(c)
    return out
