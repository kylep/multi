"""Tests for the kt CLI."""

import json

import pytest
from typer.testing import CliRunner

import kytrade
from kytrade import stocks
from kytrade.cli.main import app

runner = CliRunner()


def test_version():
    result = runner.invoke(app, ["version"])
    assert result.exit_code == 0
    assert result.output.strip() == kytrade.__version__


def test_help_needs_no_env_vars(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.delenv("POSTGRES_PASSWORD", raising=False)
    result = runner.invoke(app, ["--help"])
    assert result.exit_code == 0
    for group in ("data", "db"):
        assert group in result.output


def test_data_pull_reports_new_days(fake_store: dict, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(
        stocks, "pull_price_history", lambda symbol, full=False, **kwargs: 42
    )
    result = runner.invoke(app, ["data", "pull", "-s", "AAPL"])
    assert result.exit_code == 0
    assert "42 new days" in result.output


def test_data_pull_rejects_symbol_and_all():
    result = runner.invoke(app, ["data", "pull", "--symbol", "AAPL", "--all"])
    assert result.exit_code == 1


def test_data_pull_requires_symbol_or_all():
    result = runner.invoke(app, ["data", "pull"])
    assert result.exit_code == 1


def test_data_prices_json(fake_store: dict):
    stocks.set_prices(
        "AAPL",
        {
            "2026-01-03": {
                "open": 2.0,
                "high": 2.0,
                "low": 2.0,
                "close": 2.0,
                "volume": 2,
            },
            "2026-01-02": {
                "open": 1.0,
                "high": 1.0,
                "low": 1.0,
                "close": 1.0,
                "volume": 1,
            },
        },
    )
    result = runner.invoke(app, ["data", "prices", "AAPL", "--json"])
    assert result.exit_code == 0
    history = json.loads(result.output)
    assert list(history) == ["2026-01-02", "2026-01-03"]


def test_data_prices_tail(fake_store: dict):
    stocks.set_prices(
        "AAPL",
        {
            "2026-01-02": {"open": 1.0},
            "2026-01-03": {"open": 2.0},
            "2026-01-04": {"open": 3.0},
        },
    )
    result = runner.invoke(app, ["data", "prices", "AAPL", "--tail", "2", "--json"])
    history = json.loads(result.output)
    assert list(history) == ["2026-01-03", "2026-01-04"]


def test_data_prices_rejects_negative_tail(fake_store: dict):
    result = runner.invoke(app, ["data", "prices", "AAPL", "--tail", "-3"])
    assert result.exit_code != 0


def test_data_load_sp500_from_wikipedia(
    fake_store: dict, monkeypatch: pytest.MonkeyPatch
):
    import pandas as pd

    from kytrade import sp500

    df = pd.DataFrame([{"Symbol": "AAPL", "GICS Sector": "Information Technology"}])
    monkeypatch.setattr(sp500.pd, "read_html", lambda url, **kwargs: [df])
    result = runner.invoke(app, ["data", "load-sp500"])
    assert result.exit_code == 0
    assert "loaded 1 symbols" in result.output
    assert "AAPL" in stocks.get_symbols()


def test_db_list_json(fake_store: dict):
    fake_store["stock/indexes"] = ["S&P 500"]
    result = runner.invoke(app, ["db", "list", "--json"])
    assert result.exit_code == 0
    assert json.loads(result.output) == ["stock/indexes"]


def test_db_get_and_set(fake_store: dict, tmp_path):
    payload = tmp_path / "doc.json"
    payload.write_text(json.dumps({"hello": "world"}))
    result = runner.invoke(app, ["db", "set", "greeting", str(payload)])
    assert result.exit_code == 0
    result = runner.invoke(app, ["db", "get", "greeting"])
    assert json.loads(result.output) == {"hello": "world"}


def test_db_set_rejects_bad_json(fake_store: dict, tmp_path):
    payload = tmp_path / "doc.json"
    payload.write_text("{not json")
    result = runner.invoke(app, ["db", "set", "greeting", str(payload)])
    assert result.exit_code == 1
