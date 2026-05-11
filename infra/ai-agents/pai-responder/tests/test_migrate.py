"""Tests for migrate.py."""

import json


def test_migrate_no_legacy_no_op(tmp_path, monkeypatch):
    monkeypatch.setenv("MEMORY_DATA_DIR", str(tmp_path))
    import importlib
    import migrate
    importlib.reload(migrate)
    result = migrate.run()
    assert "no legacy" in result.lower() or "skip" in result.lower()
    assert not (tmp_path / "MEMORY.md").exists()


def test_migrate_already_done_no_op(tmp_path, monkeypatch):
    monkeypatch.setenv("MEMORY_DATA_DIR", str(tmp_path))
    (tmp_path / "memory.json").write_text(json.dumps([
        {"key": "Kyle", "content": "x", "context": "", "ts": "2026-01-01T00:00:00+00:00"}
    ]))
    (tmp_path / "MEMORY.md").write_text("## Kyle\n- existing\n")
    import importlib
    import migrate
    importlib.reload(migrate)
    result = migrate.run()
    assert "already" in result.lower() or "skip" in result.lower()
    assert "existing" in (tmp_path / "MEMORY.md").read_text()


def test_migrate_converts_legacy_entries(tmp_path, monkeypatch):
    monkeypatch.setenv("MEMORY_DATA_DIR", str(tmp_path))
    legacy = [
        {"key": "Kyle", "content": "prefers TS", "context": "from chat", "ts": "2026-01-01T00:00:00+00:00"},
        {"key": "Kyle", "content": "Toronto", "context": "", "ts": "2026-01-02T00:00:00+00:00"},
        {"key": "Kara", "content": "wife", "context": "", "ts": "2026-01-03T00:00:00+00:00"},
    ]
    (tmp_path / "memory.json").write_text(json.dumps(legacy))
    import importlib
    import migrate
    importlib.reload(migrate)
    result = migrate.run()
    assert "migrated" in result.lower()
    md = (tmp_path / "MEMORY.md").read_text()
    assert "## Kyle" in md
    assert "## Kara" in md
    assert "prefers TS" in md
    assert "Toronto" in md
    assert "wife" in md


def test_migrate_renames_legacy_to_bak(tmp_path, monkeypatch):
    monkeypatch.setenv("MEMORY_DATA_DIR", str(tmp_path))
    (tmp_path / "memory.json").write_text(json.dumps([
        {"key": "Kyle", "content": "x", "context": "", "ts": "2026-01-01T00:00:00+00:00"}
    ]))
    import importlib
    import migrate
    importlib.reload(migrate)
    migrate.run()
    assert not (tmp_path / "memory.json").exists()
    bak_files = list(tmp_path.glob("memory.json.bak.*"))
    assert len(bak_files) == 1
