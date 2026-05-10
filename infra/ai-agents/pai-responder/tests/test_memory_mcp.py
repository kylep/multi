"""Tests for memory_mcp.py storage primitives and MemoryStore facade."""

import re
from datetime import date, datetime, timezone

import pytest


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


def test_commitments_due_handles_naive_due_timestamps(tmp_path, monkeypatch):
    # Pai sometimes saves due-times without a tz suffix. The ticker must
    # treat those as UTC instead of crashing on aware/naive comparison.
    # Caught 2026-05-09 in production: TypeError stalled all delivery.
    monkeypatch.setenv("MEMORY_DATA_DIR", str(tmp_path))
    import importlib
    import memory_mcp
    importlib.reload(memory_mcp)
    memory_mcp.add_commitment(
        memory_mcp.COMMITMENTS_FILE, content="naive past", due="2020-01-01T00:00:00", scope="x")
    due = memory_mcp.commitments_due_at(
        memory_mcp.COMMITMENTS_FILE, datetime(2026, 5, 8, tzinfo=timezone.utc))
    assert len(due) == 1
    assert due[0]["content"].strip() == "naive past"


# --- MemoryStore ---

@pytest.fixture
def store(tmp_path, monkeypatch):
    monkeypatch.setenv("MEMORY_DATA_DIR", str(tmp_path))
    import importlib
    import memory_mcp
    importlib.reload(memory_mcp)
    return memory_mcp.MemoryStore()


def test_save_long_requires_key(store):
    with pytest.raises(ValueError, match="key"):
        store.save(scope="long", content="x")


def test_save_long_appends_to_memory_md(store):
    msg = store.save(scope="long", content="prefers TS", key="Kyle")
    assert "Kyle" in msg
    text = store.memory_path.read_text()
    assert "## Kyle" in text


def test_save_daily_writes_today(store):
    msg = store.save(scope="daily", content="context")
    today = date.today().isoformat()
    assert today in msg
    target = store.daily_dir / f"{today}.md"
    assert target.exists()


def test_save_commitment_requires_due_and_scope(store):
    with pytest.raises(ValueError, match="due"):
        store.save(scope="commitment", content="x")
    with pytest.raises(ValueError, match="commitment_scope"):
        store.save(scope="commitment", content="x", due="2026-05-08T19:00:00Z")


def test_save_commitment_returns_id(store):
    msg = store.save(
        scope="commitment", content="check in",
        due="2026-05-08T19:00:00Z",
        commitment_scope="channel:1234",
        precision="soft",
    )
    assert "c-" in msg


def test_save_unknown_scope_raises(store):
    with pytest.raises(ValueError, match="scope"):
        store.save(scope="garbage", content="x")


def test_search_returns_hits_with_provenance(store):
    store.save(scope="long", content="prefers TypeScript over JavaScript", key="Kyle")
    store.save(scope="long", content="works in Toronto", key="Kyle")
    store.save(scope="long", content="no relevance here", key="Random")
    results = store.search(query="TypeScript", limit=5)
    assert len(results) >= 1
    top = results[0]
    assert "TypeScript" in top["snippet"] or "typescript" in top["snippet"].lower()
    assert top["path"].endswith("MEMORY.md")
    assert "line" in top


def test_search_respects_scope_filter(store):
    store.save(scope="long", content="long-scope content", key="X")
    store.save(scope="daily", content="daily-scope content")
    long_only = store.search(query="content", scope="long")
    daily_only = store.search(query="content", scope="daily")
    assert all(r["path"].endswith("MEMORY.md") for r in long_only)
    assert all("daily" in r["path"] for r in daily_only)


def test_recall_returns_none_for_irrelevant_query(store):
    store.save(scope="long", content="Kyle prefers TS", key="Kyle")
    digest = store.recall(query="favorite color of penguins")
    assert digest == "NONE"


def test_recall_returns_digest_for_matched_query(store):
    store.save(scope="long", content="Kyle prefers TypeScript", key="Kyle")
    digest = store.recall(query="What language does Kyle prefer?")
    assert digest != "NONE"
    assert "TypeScript" in digest or "typescript" in digest.lower()


def test_recall_matches_on_section_header(store):
    # Bullet text lacks the subject ("Kyle"); only the ## header carries it.
    # Without section-aware indexing, BM25 misses queries phrased around the
    # subject. Production smoke test 2026-05-09 hit this exact case.
    store.save(scope="long", content="prefers TypeScript over JavaScript", key="Kyle")
    digest = store.recall(query="What language does Kyle prefer?")
    assert digest != "NONE"
    assert "TypeScript" in digest


def test_recall_respects_max_chars(store):
    long_content = "TypeScript " * 200
    store.save(scope="long", content=long_content, key="Kyle")
    digest = store.recall(query="TypeScript", max_chars=200)
    assert len(digest) <= 220


def test_get_returns_full_file(store):
    store.save(scope="long", content="x", key="Kyle")
    text = store.get(str(store.memory_path))
    assert "## Kyle" in text


def test_get_with_line_range(store):
    store.save(scope="long", content="a", key="A")
    store.save(scope="long", content="b", key="B")
    text = store.get(str(store.memory_path), lines=(1, 2))
    assert "## A" in text


def test_list_long_returns_section_headers(store):
    store.save(scope="long", content="x", key="Kyle")
    store.save(scope="long", content="y", key="Kara")
    out = store.list_(scope="long")
    assert "Kyle" in out
    assert "Kara" in out


def test_list_commitment_shows_status(store):
    store.save(
        scope="commitment", content="x",
        due="2099-01-01T00:00:00Z", commitment_scope="ch:1",
    )
    out = store.list_(scope="commitment")
    assert "pending" in out


def test_commitment_done_changes_status(store):
    msg = store.save(
        scope="commitment", content="x",
        due="2099-01-01T00:00:00Z", commitment_scope="ch:1",
    )
    cmt_id = msg.split("commitment ")[-1].strip()
    result = store.commitment_done(cmt_id)
    assert "delivered" in result.lower() or "done" in result.lower()


def test_commitments_due_returns_list(store):
    store.save(
        scope="commitment", content="past",
        due="2020-01-01T00:00:00Z", commitment_scope="ch:1",
    )
    store.save(
        scope="commitment", content="future",
        due="2099-01-01T00:00:00Z", commitment_scope="ch:1",
    )
    due = store.commitments_due(
        now_iso=datetime(2026, 5, 8, tzinfo=timezone.utc).isoformat()
    )
    assert len(due) == 1
    assert due[0]["content"].strip() == "past"


def test_promote_moves_daily_bullet_to_long(store):
    store.save(scope="daily", content="something to remember")
    today = date.today().isoformat()
    daily_path = store.daily_dir / f"{today}.md"
    lines = daily_path.read_text().splitlines()
    target_line = next(i for i, line in enumerate(lines, 1) if "something to remember" in line)
    result = store.promote(date_str=today, line_num=target_line, section="Notes")
    assert "promoted" in result.lower() or "moved" in result.lower()
    assert "## Notes" in store.memory_path.read_text()
    assert "something to remember" in store.memory_path.read_text()


# --- Code-review-driven security/robustness tests (2026-05-10) ---


def test_get_rejects_path_outside_data_dir(store):
    """Path traversal containment: memory_get must refuse paths outside data_dir.

    Without containment, an inbound Discord prompt could ask the recaller to
    `memory_get('/vault/secrets/config')` and exfiltrate tokens via the
    active_memory digest.
    """
    out = store.get("/etc/passwd")
    assert "outside memory dir" in out.lower()


def test_get_rejects_relative_traversal(store):
    """Relative `../../etc/passwd` style paths are also out-of-scope."""
    target = str(store.data_dir / ".." / ".." / "etc" / "passwd")
    out = store.get(target)
    assert "outside memory dir" in out.lower()


def test_get_allows_paths_under_data_dir(store):
    """Sanity: legitimate paths under data_dir still work."""
    store.save(scope="daily", content="hello world")
    today_path = next(store.daily_dir.glob("*.md"))
    out = store.get(str(today_path))
    assert "hello world" in out


def test_add_commitment_rejects_dash_dash_dash_in_body(tmp_path, monkeypatch):
    """A bare `---` line in a body would corrupt round-trip parsing."""
    from memory_mcp import add_commitment
    path = tmp_path / "C.md"
    with pytest.raises(ValueError, match="bare '---' line"):
        add_commitment(
            path=path,
            content="line one\n---\nline two",
            due="2099-01-01T00:00:00Z",
            scope="ch:1",
        )


def test_parse_commitments_skips_frontmatter_without_id():
    """Frontmatter lacking an id is malformed; emit nothing rather than junk."""
    from memory_mcp import parse_commitments
    content = (
        "---\n"
        "no_id: here\n"
        "status: pending\n"
        "---\n"
        "body\n"
        "---\n"
        "id: c-real\n"
        "status: pending\n"
        "due: 2099-01-01T00:00:00Z\n"
        "scope: ch:1\n"
        "---\n"
        "real body\n"
    )
    cmts = parse_commitments(content)
    # Only the well-formed block survives.
    ids = [c.get("id") for c in cmts]
    assert ids == ["c-real"]


def test_recall_defaults_to_long_scope(store):
    """recall() should ignore daily-note hits by default so durable
    facts dominate ranking as the daily corpus grows."""
    # Same query phrase appears in both long (real fact) and daily (chatter).
    store.save(scope="long", key="Kyle", content="prefers TypeScript over JavaScript")
    store.save(scope="daily", content="random unrelated TypeScript chatter line one")
    store.save(scope="daily", content="more TypeScript chatter line two")
    digest = store.recall(query="What language does Kyle prefer?")
    assert "TypeScript" in digest
    # Default scope='long' means daily-only hits don't appear.
    assert "chatter" not in digest


def test_recall_scope_none_searches_everything(store):
    """Passing scope=None lets recall fall back to whole-corpus search."""
    store.save(scope="daily", content="only-in-daily-fact")
    digest = store.recall(query="only-in-daily-fact", scope=None)
    assert "only-in-daily-fact" in digest


def test_promote_rejects_invalid_date_str(store):
    """date_str must match YYYY-MM-DD so `..` traversal can't escape."""
    out = store.promote(date_str="../etc/passwd", line_num=1)
    assert "invalid date_str" in out.lower()
