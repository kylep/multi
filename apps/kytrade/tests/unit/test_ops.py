"""Tests for kytrade.ops."""

from datetime import date, timedelta
from pathlib import Path

import pytest

from kytrade import config, ops, stocks


@pytest.fixture
def reachable_db(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(ops, "_db_reachable", lambda: True)
    monkeypatch.setattr(ops, "_tables_exist", lambda: True)


def test_status_reports_unreachable_db(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(ops, "_db_reachable", lambda: False)
    report = ops.status()
    assert report.db_ok is False
    assert report.symbols == 0


def test_status_reports_staleness(fake_store: dict, reachable_db):
    today = date.today().isoformat()
    recent = (date.today() - timedelta(days=3)).isoformat()
    old = (date.today() - timedelta(days=40)).isoformat()
    fake_store[stocks.SYMBOLS_DOC] = {
        "A": {
            "indexes": [],
            "etfs": [],
            "sectors": [],
            "currency": None,
            "last_updated": today,
        },
        "B": {
            "indexes": [],
            "etfs": [],
            "sectors": [],
            "currency": None,
            "last_updated": recent,
        },
        "C": {
            "indexes": [],
            "etfs": [],
            "sectors": [],
            "currency": None,
            "last_updated": old,
        },
        "D": {
            "indexes": [],
            "etfs": [],
            "sectors": [],
            "currency": None,
            "last_updated": None,
        },
    }
    fake_store[f"{stocks.PRICES_DOC_PREFIX}/A"] = {"2026-01-02": {"close": 1.0}}
    report = ops.status()
    assert report.db_ok and report.tables_ok
    assert report.symbols == 4
    assert report.priced_symbols == 1
    assert report.staleness.today == 1
    assert report.staleness.week == 1
    assert report.staleness.older == 1
    assert report.staleness.never == 1


def test_refresh_skips_fresh_and_counts(
    fake_store: dict, monkeypatch: pytest.MonkeyPatch
):
    today = date.today().isoformat()
    fresh = stocks.new_symbol_metadata() | {"last_updated": today}
    stale = stocks.new_symbol_metadata()
    fake_store[stocks.SYMBOLS_DOC] = {
        "FRESH": fresh,
        "STALE": dict(stale),
        "BAD": dict(stale),
    }

    def pull(symbol, *, full=False, symbols=None):
        if symbol == "BAD":
            raise ValueError("boom")
        return 5

    monkeypatch.setattr(stocks, "pull_price_history", pull)
    report = ops.refresh()
    assert report.pulled == 1
    assert report.skipped == 1
    assert report.failed == ["BAD"]
    assert report.new_days == 5


def test_refresh_full_ignores_freshness(
    fake_store: dict, monkeypatch: pytest.MonkeyPatch
):
    today = date.today().isoformat()
    fake_store[stocks.SYMBOLS_DOC] = {
        "FRESH": stocks.new_symbol_metadata() | {"last_updated": today}
    }
    monkeypatch.setattr(stocks, "pull_price_history", lambda s, **kwargs: 3)
    report = ops.refresh(full=True)
    assert report.pulled == 1
    assert report.skipped == 0


def test_ensure_env_generates_password(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.delenv("POSTGRES_PASSWORD", raising=False)
    monkeypatch.setenv("KT_ENV_FILE", str(tmp_path / ".env"))
    config.reset_cache()
    path, generated = ops.ensure_env()
    assert generated is True
    content = path.read_text()
    assert "POSTGRES_PASSWORD=" in content
    assert (path.stat().st_mode & 0o777) == 0o600
    assert config.has("POSTGRES_PASSWORD")
    config.reset_cache()


def test_ensure_env_respects_existing_password(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
):
    monkeypatch.setenv("POSTGRES_PASSWORD", "already-set")
    monkeypatch.setenv("KT_ENV_FILE", str(tmp_path / ".env"))
    config.reset_cache()
    path, generated = ops.ensure_env()
    assert generated is False
    assert not path.exists()
    config.reset_cache()


def test_ensure_env_appends_without_clobbering(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
):
    env_file = tmp_path / ".env"
    env_file.write_text("POSTGRES_HOST=example.com")
    monkeypatch.delenv("POSTGRES_PASSWORD", raising=False)
    monkeypatch.setenv("KT_ENV_FILE", str(env_file))
    config.reset_cache()
    ops.ensure_env()
    content = env_file.read_text()
    assert "POSTGRES_HOST=example.com" in content
    assert "POSTGRES_PASSWORD=" in content
    config.reset_cache()
