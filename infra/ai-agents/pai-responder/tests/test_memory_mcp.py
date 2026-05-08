"""Tests for memory_mcp.py storage primitives and MemoryStore facade."""

import re
from datetime import date, datetime, timezone


# --- write_atomic ---

def test_write_atomic_creates_file(tmp_path):
    from memory_mcp import write_atomic
    target = tmp_path / "subdir" / "file.txt"
    write_atomic(target, "hello")
    assert target.read_text() == "hello"


def test_write_atomic_replaces_existing(tmp_path):
    from memory_mcp import write_atomic
    target = tmp_path / "f.txt"
    target.write_text("old")
    write_atomic(target, "new")
    assert target.read_text() == "new"


def test_write_atomic_no_partial_on_crash(tmp_path):
    from memory_mcp import write_atomic
    target = tmp_path / "f.txt"
    write_atomic(target, "content")
    leftover = list(tmp_path.glob("*.tmp"))
    assert leftover == []


# --- bm25_score ---

def test_bm25_returns_empty_on_empty_corpus():
    from memory_mcp import bm25_score
    assert bm25_score("query", []) == []


def test_bm25_ranks_exact_match_first():
    from memory_mcp import bm25_score
    docs = [
        "the cat sat on the mat",
        "the dog ate my homework",
        "cats and mats are common nouns",
    ]
    hits = bm25_score("cat mat", docs)
    assert hits[0][0] == 0
    assert all(s > 0 for _, s in hits)


def test_bm25_ignores_unrelated_docs():
    from memory_mcp import bm25_score
    docs = [
        "kyle prefers typescript over javascript",
        "the weather today is sunny",
    ]
    hits = bm25_score("typescript preference", docs)
    assert hits[0][0] == 0
    if len(hits) > 1:
        assert hits[0][1] > hits[1][1]


def test_bm25_returns_index_score_pairs_sorted_desc():
    from memory_mcp import bm25_score
    docs = ["alpha beta", "gamma alpha", "delta epsilon"]
    hits = bm25_score("alpha", docs)
    scores = [s for _, s in hits]
    assert scores == sorted(scores, reverse=True)


# --- parse_memory_md / append_memory_section ---

def test_parse_memory_md_empty_returns_empty_dict():
    from memory_mcp import parse_memory_md
    assert parse_memory_md("") == {}


def test_parse_memory_md_single_section():
    from memory_mcp import parse_memory_md
    text = "## Kyle\n- prefers TypeScript\n- Toronto, Eastern\n"
    sections = parse_memory_md(text)
    assert "Kyle" in sections
    assert sections["Kyle"] == ["prefers TypeScript", "Toronto, Eastern"]


def test_parse_memory_md_multiple_sections():
    from memory_mcp import parse_memory_md
    text = (
        "## Kyle\n- a\n- b\n\n"
        "## Kara\n- c\n\n"
        "## Stack\n- d\n"
    )
    sections = parse_memory_md(text)
    assert sections == {
        "Kyle": ["a", "b"],
        "Kara": ["c"],
        "Stack": ["d"],
    }


def test_append_memory_section_creates_section(tmp_path, monkeypatch):
    monkeypatch.setenv("MEMORY_DATA_DIR", str(tmp_path))
    import importlib
    import memory_mcp
    importlib.reload(memory_mcp)
    memory_mcp.append_memory_section(memory_mcp.MEMORY_FILE, "Kyle", "prefers TS")
    text = (tmp_path / "MEMORY.md").read_text()
    assert "## Kyle" in text
    assert "- prefers TS" in text


def test_append_memory_section_extends_existing(tmp_path, monkeypatch):
    monkeypatch.setenv("MEMORY_DATA_DIR", str(tmp_path))
    import importlib
    import memory_mcp
    importlib.reload(memory_mcp)
    memory_mcp.append_memory_section(memory_mcp.MEMORY_FILE, "Kyle", "first")
    memory_mcp.append_memory_section(memory_mcp.MEMORY_FILE, "Kyle", "second")
    sections = memory_mcp.parse_memory_md((tmp_path / "MEMORY.md").read_text())
    assert sections["Kyle"] == ["first", "second"]


def test_append_memory_section_multiple_sections(tmp_path, monkeypatch):
    monkeypatch.setenv("MEMORY_DATA_DIR", str(tmp_path))
    import importlib
    import memory_mcp
    importlib.reload(memory_mcp)
    memory_mcp.append_memory_section(memory_mcp.MEMORY_FILE, "Kyle", "a")
    memory_mcp.append_memory_section(memory_mcp.MEMORY_FILE, "Kara", "b")
    memory_mcp.append_memory_section(memory_mcp.MEMORY_FILE, "Kyle", "c")
    sections = memory_mcp.parse_memory_md((tmp_path / "MEMORY.md").read_text())
    assert sections["Kyle"] == ["a", "c"]
    assert sections["Kara"] == ["b"]


# --- daily notes ---

def test_append_daily_note_creates_dated_file(tmp_path, monkeypatch):
    monkeypatch.setenv("MEMORY_DATA_DIR", str(tmp_path))
    import importlib
    import memory_mcp
    importlib.reload(memory_mcp)
    memory_mcp.append_daily_note(date(2026, 5, 8), "morning context")
    target = tmp_path / "daily" / "2026-05-08.md"
    assert target.exists()
    assert "morning context" in target.read_text()


def test_append_daily_note_includes_timestamp(tmp_path, monkeypatch):
    monkeypatch.setenv("MEMORY_DATA_DIR", str(tmp_path))
    import importlib
    import memory_mcp
    importlib.reload(memory_mcp)
    memory_mcp.append_daily_note(date(2026, 5, 8), "context")
    text = (tmp_path / "daily" / "2026-05-08.md").read_text()
    assert re.search(r"- \[\d{2}:\d{2} UTC\] context", text)


def test_append_daily_note_appends_to_existing(tmp_path, monkeypatch):
    monkeypatch.setenv("MEMORY_DATA_DIR", str(tmp_path))
    import importlib
    import memory_mcp
    importlib.reload(memory_mcp)
    memory_mcp.append_daily_note(date(2026, 5, 8), "first")
    memory_mcp.append_daily_note(date(2026, 5, 8), "second")
    text = (tmp_path / "daily" / "2026-05-08.md").read_text()
    assert text.count("first") == 1
    assert text.count("second") == 1


# --- COMMITMENTS.md ---

def test_parse_commitments_empty_returns_empty():
    from memory_mcp import parse_commitments
    assert parse_commitments("") == []


def test_parse_commitments_single_block():
    from memory_mcp import parse_commitments
    text = """---
id: c-001
status: pending
precision: precise
due: 2026-05-08T19:00:00Z
scope: channel:1234
created: 2026-05-08T14:00:00Z
source: turn-1
---
Remind Kyle about dentist
"""
    cmts = parse_commitments(text)
    assert len(cmts) == 1
    c = cmts[0]
    assert c["id"] == "c-001"
    assert c["status"] == "pending"
    assert c["precision"] == "precise"
    assert c["due"] == "2026-05-08T19:00:00Z"
    assert c["scope"] == "channel:1234"
    assert c["content"].strip() == "Remind Kyle about dentist"


def test_parse_commitments_multiple_blocks():
    from memory_mcp import parse_commitments
    text = """---
id: c-001
status: pending
precision: soft
due: 2026-05-08T19:00:00Z
scope: channel:1234
created: 2026-05-08T14:00:00Z
---
First commitment
---
id: c-002
status: delivered
precision: precise
due: 2026-05-08T20:00:00Z
scope: channel:5678
created: 2026-05-08T15:00:00Z
---
Second commitment
"""
    cmts = parse_commitments(text)
    assert len(cmts) == 2
    assert cmts[0]["id"] == "c-001"
    assert cmts[1]["id"] == "c-002"
    assert cmts[1]["status"] == "delivered"


def test_add_commitment_generates_id_and_appends(tmp_path, monkeypatch):
    monkeypatch.setenv("MEMORY_DATA_DIR", str(tmp_path))
    import importlib
    import memory_mcp
    importlib.reload(memory_mcp)
    cmt_id = memory_mcp.add_commitment(
        memory_mcp.COMMITMENTS_FILE,
        content="check in after interview",
        due="2026-05-08T19:00:00Z",
        scope="channel:1234",
        precision="soft",
    )
    assert cmt_id.startswith("c-")
    cmts = memory_mcp.parse_commitments(memory_mcp.COMMITMENTS_FILE.read_text())
    assert len(cmts) == 1
    assert cmts[0]["id"] == cmt_id


def test_mark_commitment_done_updates_status(tmp_path, monkeypatch):
    monkeypatch.setenv("MEMORY_DATA_DIR", str(tmp_path))
    import importlib
    import memory_mcp
    importlib.reload(memory_mcp)
    cmt_id = memory_mcp.add_commitment(
        memory_mcp.COMMITMENTS_FILE,
        content="test",
        due="2026-05-08T19:00:00Z",
        scope="channel:1234",
    )
    memory_mcp.mark_commitment_done(memory_mcp.COMMITMENTS_FILE, cmt_id)
    cmts = memory_mcp.parse_commitments(memory_mcp.COMMITMENTS_FILE.read_text())
    assert cmts[0]["status"] == "delivered"


def test_commitments_due_returns_pending_past_due(tmp_path, monkeypatch):
    monkeypatch.setenv("MEMORY_DATA_DIR", str(tmp_path))
    import importlib
    import memory_mcp
    importlib.reload(memory_mcp)
    memory_mcp.add_commitment(
        memory_mcp.COMMITMENTS_FILE, content="past", due="2020-01-01T00:00:00Z", scope="x")
    memory_mcp.add_commitment(
        memory_mcp.COMMITMENTS_FILE, content="future", due="2099-01-01T00:00:00Z", scope="x")
    due = memory_mcp.commitments_due_at(
        memory_mcp.COMMITMENTS_FILE, datetime(2026, 5, 8, tzinfo=timezone.utc))
    assert len(due) == 1
    assert due[0]["content"].strip() == "past"
