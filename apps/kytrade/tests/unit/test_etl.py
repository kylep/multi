"""Tests for kytrade.etl."""

import pandas as pd
import pytest

from kytrade import etl, stocks


@pytest.fixture
def sp500_df(monkeypatch: pytest.MonkeyPatch) -> pd.DataFrame:
    df = pd.DataFrame(
        [
            {"Ticker": "AAPL", "Sector": "Tech", "Local Currency": "USD"},
            {"Ticker": "MSFT", "Sector": "Tech", "Local Currency": "USD"},
            {"Ticker": "XOM", "Sector": "Energy", "Local Currency": "USD"},
            {"Ticker": None, "Sector": None, "Local Currency": None},
            {"Ticker": "MYST", "Sector": float("nan"), "Local Currency": float("nan")},
        ]
    )
    monkeypatch.setattr(etl.pd, "read_excel", lambda path: df)
    return df


def test_load_sp500_writes_symbols_and_sectors(fake_store: dict, sp500_df):
    count = etl.load_sp500("fake.xlsx")
    assert count == 4
    symbols = stocks.get_symbols()
    assert symbols["AAPL"] == {
        "indexes": ["S&P 500"],
        "etfs": ["SPY"],
        "sectors": ["Tech"],
        "currency": "USD",
        "last_updated": None,
    }
    assert stocks.get_sectors() == {"Tech": ["AAPL", "MSFT"], "Energy": ["XOM"]}
    assert stocks.get_indexes() == ["S&P 500"]
    assert stocks.get_etfs() == ["SPY"]


def test_load_sp500_handles_missing_sector_and_currency(fake_store: dict, sp500_df):
    etl.load_sp500("fake.xlsx")
    mystery = stocks.get_symbols()["MYST"]
    assert mystery["sectors"] == []
    assert mystery["currency"] is None


def test_load_sp500_preserves_existing_metadata(fake_store: dict, sp500_df):
    metadata = stocks.new_symbol_metadata()
    metadata["indexes"] = ["Dow 30"]
    metadata["last_updated"] = "2026-01-01"
    fake_store[stocks.SYMBOLS_DOC] = {"AAPL": metadata}
    etl.load_sp500("fake.xlsx")
    merged = stocks.get_symbols()["AAPL"]
    assert merged["indexes"] == ["Dow 30", "S&P 500"]
    assert merged["last_updated"] == "2026-01-01"


def test_load_sp500_is_idempotent(fake_store: dict, sp500_df):
    etl.load_sp500("fake.xlsx")
    etl.load_sp500("fake.xlsx")
    assert stocks.get_sectors()["Tech"] == ["AAPL", "MSFT"]
    assert stocks.get_symbols()["AAPL"]["indexes"] == ["S&P 500"]
