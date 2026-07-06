"""Tests for kt analyze and the top-level status/refresh/bootstrap commands."""

import json

import pytest
from typer.testing import CliRunner

from kytrade import ops, stocks
from kytrade.cli.main import app
from kytrade.models import BootstrapReport, RefreshReport

runner = CliRunner()


def seed(store: dict, symbol: str, closes: dict[str, float]) -> None:
    store[f"{stocks.PRICES_DOC_PREFIX}/{symbol}"] = {
        day: {"open": close, "high": close, "low": close, "close": close, "volume": 10}
        for day, close in closes.items()
    }


def test_analyze_performance_json(fake_store: dict):
    seed(fake_store, "AAPL", {"2026-06-01": 100.0, "2026-07-01": 110.0})
    result = runner.invoke(
        app, ["analyze", "performance", "AAPL", "--days", "90", "--json"]
    )
    assert result.exit_code == 0
    assert json.loads(result.output)["return_pct"] == 10.0


def test_analyze_performance_fails_cleanly_without_data(fake_store: dict):
    result = runner.invoke(app, ["analyze", "performance", "NOPE"])
    assert result.exit_code == 1


def test_analyze_compare_requires_two_symbols(fake_store: dict):
    result = runner.invoke(app, ["analyze", "compare", "AAPL"])
    assert result.exit_code == 1


def test_analyze_compare_json(fake_store: dict):
    seed(fake_store, "AAA", {"2026-06-01": 100.0, "2026-07-01": 105.0})
    seed(fake_store, "BBB", {"2026-06-01": 100.0, "2026-07-01": 120.0})
    result = runner.invoke(app, ["analyze", "compare", "AAA", "BBB", "--json"])
    entries = json.loads(result.output)["entries"]
    assert [entry["symbol"] for entry in entries] == ["BBB", "AAA"]


def test_analyze_movers_json(fake_store: dict):
    seed(fake_store, "UP", {"2026-06-01": 100.0, "2026-07-01": 130.0})
    seed(fake_store, "DOWN", {"2026-06-01": 100.0, "2026-07-01": 70.0})
    result = runner.invoke(app, ["analyze", "movers", "--top", "1", "--json"])
    report = json.loads(result.output)
    assert report["gainers"][0]["symbol"] == "UP"
    assert report["losers"][0]["symbol"] == "DOWN"


def test_analyze_sectors_json(fake_store: dict):
    fake_store[stocks.SECTORS_DOC] = {"Tech": ["AAA"]}
    seed(fake_store, "AAA", {"2026-06-01": 100.0, "2026-07-01": 110.0})
    result = runner.invoke(app, ["analyze", "sectors", "--json"])
    assert json.loads(result.output)["sectors"][0]["return_pct"] == 10.0


def test_analyze_near_extreme_rejects_bad_kind(fake_store: dict):
    result = runner.invoke(app, ["analyze", "near-extreme", "--kind", "sideways"])
    assert result.exit_code == 1


def test_analyze_volatility_json(fake_store: dict):
    closes = {f"2026-06-{i:02d}": 100.0 + i for i in range(1, 15)}
    seed(fake_store, "AAPL", closes)
    result = runner.invoke(
        app, ["analyze", "volatility", "AAPL", "--window-days", "5", "--json"]
    )
    assert result.exit_code == 0
    assert json.loads(result.output)["symbol"] == "AAPL"


def test_status_json(monkeypatch: pytest.MonkeyPatch, fake_store: dict):
    monkeypatch.setattr(ops, "_db_reachable", lambda: True)
    monkeypatch.setattr(ops, "_tables_exist", lambda: True)
    result = runner.invoke(app, ["status", "--json"])
    assert json.loads(result.output)["db_ok"] is True


def test_status_exits_nonzero_when_db_down(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(ops, "_db_reachable", lambda: False)
    result = runner.invoke(app, ["status"])
    assert result.exit_code == 1


def test_status_json_still_exits_nonzero_when_unhealthy(
    monkeypatch: pytest.MonkeyPatch,
):
    monkeypatch.setattr(ops, "_db_reachable", lambda: False)
    result = runner.invoke(app, ["status", "--json"])
    assert result.exit_code == 1
    assert json.loads(result.output)["db_ok"] is False


def test_refresh_reports(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(
        ops,
        "refresh",
        lambda full=False: RefreshReport(pulled=2, skipped=1, failed=["X"], new_days=9),
    )
    result = runner.invoke(app, ["refresh"])
    assert "pulled 2" in result.output
    assert "failed: X" in result.output


def test_bootstrap_reports_db_down(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(
        ops,
        "bootstrap",
        lambda: BootstrapReport(
            env_file=".env",
            password_generated=True,
            db_ok=False,
            tables_created=False,
            symbols_loaded=0,
            etfs_tracked=[],
        ),
    )
    result = runner.invoke(app, ["bootstrap"])
    assert result.exit_code == 1
    assert "generated a database password" in result.output
