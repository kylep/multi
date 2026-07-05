"""Tests for kytrade.sp500."""

import pandas as pd
import pytest

from kytrade import sp500, stocks


@pytest.fixture
def wikipedia_df(monkeypatch: pytest.MonkeyPatch) -> pd.DataFrame:
    df = pd.DataFrame(
        [
            {"Symbol": "AAPL", "GICS Sector": "Information Technology"},
            {"Symbol": "BRK.B", "GICS Sector": "Financials"},
            {"Symbol": "XOM", "GICS Sector": "Energy"},
        ]
    )
    monkeypatch.setattr(sp500, "_fetch_html", lambda url: "<html></html>")
    monkeypatch.setattr(sp500.pd, "read_html", lambda html, **kwargs: [df])
    return df


@pytest.fixture
def excel_df(monkeypatch: pytest.MonkeyPatch) -> pd.DataFrame:
    df = pd.DataFrame(
        [
            {"Ticker": "AAPL", "Sector": "Tech", "Local Currency": "USD"},
            {"Ticker": None, "Sector": None, "Local Currency": None},
            {"Ticker": "MYST", "Sector": float("nan"), "Local Currency": float("nan")},
        ]
    )
    monkeypatch.setattr(sp500.pd, "read_excel", lambda path: df)
    return df


def test_fetch_html_rejects_non_https():
    with pytest.raises(ValueError):
        sp500._fetch_html("http://example.com/")


def test_fetch_membership_parses_wikipedia(wikipedia_df):
    members = sp500.fetch_membership()
    assert len(members) == 3
    assert members[0] == sp500.Member(
        ticker="AAPL", sector="Information Technology", currency="USD"
    )


def test_fetch_membership_normalizes_class_share_tickers(wikipedia_df):
    tickers = [member.ticker for member in sp500.fetch_membership()]
    assert "BRK-B" in tickers
    assert "BRK.B" not in tickers


def test_load_membership_from_excel_skips_blank_and_nan_rows(excel_df):
    members = sp500.load_membership_from_excel("fake.xlsx")
    assert [member.ticker for member in members] == ["AAPL", "MYST"]
    assert members[1].sector is None
    assert members[1].currency is None


def test_apply_membership_writes_documents(fake_store: dict, wikipedia_df):
    count = sp500.apply_membership(sp500.fetch_membership())
    assert count == 3
    symbols = stocks.get_symbols()
    assert symbols["AAPL"] == {
        "indexes": ["S&P 500"],
        "etfs": ["SPY"],
        "sectors": ["Information Technology"],
        "currency": "USD",
        "last_updated": None,
    }
    assert stocks.get_sectors()["Financials"] == ["BRK-B"]
    assert stocks.get_indexes() == ["S&P 500"]
    assert stocks.get_etfs() == ["SPY"]


def test_apply_membership_preserves_existing_metadata(fake_store: dict, wikipedia_df):
    metadata = stocks.new_symbol_metadata()
    metadata["indexes"] = ["Dow 30"]
    metadata["last_updated"] = "2026-01-01"
    fake_store[stocks.SYMBOLS_DOC] = {"AAPL": metadata}
    sp500.apply_membership(sp500.fetch_membership())
    merged = stocks.get_symbols()["AAPL"]
    assert merged["indexes"] == ["Dow 30", "S&P 500"]
    assert merged["last_updated"] == "2026-01-01"


def test_apply_membership_keeps_known_currency_when_new_is_missing(fake_store: dict):
    metadata = stocks.new_symbol_metadata()
    metadata["currency"] = "USD"
    fake_store[stocks.SYMBOLS_DOC] = {"MYST": metadata}
    sp500.apply_membership([sp500.Member(ticker="MYST", sector=None, currency=None)])
    assert stocks.get_symbols()["MYST"]["currency"] == "USD"


def test_apply_membership_is_idempotent(fake_store: dict, wikipedia_df):
    members = sp500.fetch_membership()
    sp500.apply_membership(members)
    sp500.apply_membership(members)
    assert stocks.get_sectors()["Energy"] == ["XOM"]
    assert stocks.get_symbols()["AAPL"]["indexes"] == ["S&P 500"]
