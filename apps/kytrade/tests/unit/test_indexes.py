"""Tests for kytrade.indexes."""

import pandas as pd
import pytest

from kytrade import indexes, stocks


def member(
    ticker: str, sector: str = "Energy", currency: str = "USD"
) -> indexes.Member:
    return indexes.Member(ticker=ticker, sector=sector, currency=currency)


@pytest.fixture
def wikipedia_tables(monkeypatch: pytest.MonkeyPatch) -> dict:
    """Serve canned constituents tables for both indexes, keyed by URL."""
    sp500_df = pd.DataFrame(
        [
            {"Symbol": "AAPL", "GICS Sector": "Information Technology"},
            {"Symbol": "BRK.B", "GICS Sector": "Financials"},
            {"Symbol": "XOM", "GICS Sector": "Energy"},
        ]
    )
    junk_df = pd.DataFrame([{"A": 1, "B": 2}])
    tsx60_df = pd.DataFrame(
        [
            {"Symbol": "RY", "Company": "Royal Bank", "Sector": "Financial Services"},
            {
                "Symbol": "CTC.A",
                "Company": "Canadian Tire",
                "Sector": "Consumer Cyclical",
            },
            {"Symbol": "SU", "Company": "Suncor", "Sector": "Energy"},
        ]
    )
    served = {
        indexes.SP500.url: [sp500_df],
        indexes.TSX60.url: [junk_df, tsx60_df],
    }
    urls: dict = {"last": None}

    def fetch(url: str) -> str:
        urls["last"] = url
        return url

    monkeypatch.setattr(indexes, "_fetch_html", fetch)
    monkeypatch.setattr(
        indexes.pd, "read_html", lambda html, **kwargs: served[html.getvalue()]
    )
    return served


def test_fetch_html_rejects_non_https():
    with pytest.raises(ValueError):
        indexes._fetch_html("http://example.com/")


def test_normalize_ticker_class_shares_and_suffix():
    assert indexes._normalize_ticker("BRK.B") == "BRK-B"
    assert indexes._normalize_ticker("CTC.A", ".TO") == "CTC-A.TO"
    assert indexes._normalize_ticker(" ry ", ".TO") == "RY.TO"


def test_fetch_membership_sp500(wikipedia_tables):
    members = indexes.fetch_membership(indexes.SP500)
    assert len(members) == 3
    assert members[0] == indexes.Member(
        ticker="AAPL", sector="Information Technology", currency="USD"
    )
    assert members[1].ticker == "BRK-B"


def test_fetch_membership_tsx60_selects_right_table_and_suffixes(wikipedia_tables):
    members = indexes.fetch_membership(indexes.TSX60)
    assert [m.ticker for m in members] == ["RY.TO", "CTC-A.TO", "SU.TO"]
    assert members[0].currency == "CAD"
    assert members[1].sector == "Consumer Cyclical"


def test_fetch_membership_raises_when_no_table_matches(
    wikipedia_tables, monkeypatch: pytest.MonkeyPatch
):
    monkeypatch.setattr(
        indexes.pd, "read_html", lambda html, **kwargs: [pd.DataFrame([{"X": 1}])]
    )
    with pytest.raises(ValueError):
        indexes.fetch_membership(indexes.SP500)


def test_load_membership_from_excel_skips_blank_rows(monkeypatch: pytest.MonkeyPatch):
    df = pd.DataFrame(
        [
            {"Ticker": "AAPL", "Sector": "Tech", "Local Currency": "USD"},
            {"Ticker": None, "Sector": None, "Local Currency": None},
            {"Ticker": "MYST", "Sector": float("nan"), "Local Currency": float("nan")},
        ]
    )
    monkeypatch.setattr(indexes.pd, "read_excel", lambda path: df)
    members = indexes.load_membership_from_excel("fake.xlsx")
    assert [m.ticker for m in members] == ["AAPL", "MYST"]
    assert members[1].sector is None


def test_apply_membership_writes_documents(fake_store: dict):
    diff = indexes.apply_membership(
        indexes.SP500, [member("AAPL", "Information Technology")]
    )
    assert diff.index == "S&P 500"
    assert diff.added == ["AAPL"]
    assert stocks.get_symbols()["AAPL"] == {
        "indexes": ["S&P 500"],
        "etfs": ["SPY"],
        "sectors": ["Information Technology"],
        "currency": "USD",
        "last_updated": None,
    }
    assert stocks.get_indexes() == ["S&P 500"]
    assert stocks.get_etfs() == ["SPY"]


def test_loading_one_index_never_disturbs_another(fake_store: dict):
    indexes.apply_membership(indexes.SP500, [member("XOM", "Energy")])
    indexes.apply_membership(
        indexes.TSX60,
        [
            member("SU.TO", "Energy", "CAD"),
            member("RY.TO", "Financial Services", "CAD"),
        ],
    )
    assert stocks.get_sectors()["Energy"] == ["SU.TO", "XOM"]
    xom = stocks.get_symbols()["XOM"]
    assert xom["indexes"] == ["S&P 500"]
    indexes.apply_membership(
        indexes.TSX60, [member("RY.TO", "Financial Services", "CAD")]
    )
    assert stocks.get_sectors()["Energy"] == ["XOM"]
    assert stocks.get_symbols()["XOM"]["indexes"] == ["S&P 500"]
    departed = stocks.get_symbols()["SU.TO"]
    assert departed["indexes"] == []
    assert departed["etfs"] == []


def test_apply_membership_untags_departed_symbols(fake_store: dict):
    indexes.apply_membership(indexes.SP500, [member("OLD")])
    stocks.set_prices("OLD", {"2026-01-02": {"open": 1.0}})
    indexes.apply_membership(indexes.SP500, [member("NEW")])
    departed = stocks.get_symbols()["OLD"]
    assert "S&P 500" not in departed["indexes"]
    assert "SPY" not in departed["etfs"]
    assert stocks.get_sectors() == {"Energy": ["NEW"]}
    assert stocks.get_prices("OLD") == {"2026-01-02": {"open": 1.0}}


def test_apply_membership_moves_resectored_symbols(fake_store: dict):
    indexes.apply_membership(indexes.SP500, [member("ACME", "Tech")])
    indexes.apply_membership(indexes.SP500, [member("ACME", "Energy")])
    assert stocks.get_symbols()["ACME"]["sectors"] == ["Energy"]
    assert stocks.get_sectors() == {"Energy": ["ACME"]}


def test_apply_membership_keeps_known_currency_when_new_is_missing(fake_store: dict):
    metadata = stocks.new_symbol_metadata()
    metadata["currency"] = "USD"
    fake_store[stocks.SYMBOLS_DOC] = {"MYST": metadata}
    indexes.apply_membership(
        indexes.SP500, [indexes.Member(ticker="MYST", sector=None, currency=None)]
    )
    assert stocks.get_symbols()["MYST"]["currency"] == "USD"


def test_membership_changes_are_logged_per_index(fake_store: dict):
    indexes.apply_membership(indexes.TSX60, [member("OLD.TO", currency="CAD")])
    assert indexes.membership_log() == []
    indexes.apply_membership(indexes.TSX60, [member("NEW.TO", currency="CAD")])
    log = indexes.membership_log()
    assert len(log) == 1
    assert log[0].index == "S&P/TSX 60"
    assert log[0].added == ["NEW.TO"]
    assert log[0].removed == ["OLD.TO"]


def test_track_etf_is_pull_visible_and_reconcile_safe(fake_store: dict):
    assert indexes.track_etf("xiu.to", "CAD") is True
    assert indexes.track_etf("XIU.TO") is False
    metadata = stocks.get_symbols()["XIU.TO"]
    assert metadata["etfs"] == ["XIU.TO"]
    assert metadata["currency"] == "CAD"
    assert metadata["indexes"] == []
    assert "XIU.TO" in stocks.get_etfs()
    indexes.apply_membership(indexes.TSX60, [member("RY.TO", currency="CAD")])
    assert "XIU.TO" in stocks.get_symbols()


def test_track_default_etfs_reports_new_only(fake_store: dict):
    assert indexes.track_default_etfs() == ["SPY", "QQQ", "XIU.TO"]
    assert indexes.track_default_etfs() == []
