"""Tests for kytrade.stocks."""

from datetime import date

import pytest

from kytrade import stocks, yahoo


def test_add_etfs_merges_with_existing(fake_store: dict):
    fake_store[stocks.ETFS_DOC] = ["SPY"]
    stocks.add_etfs(["QQQ", "SPY"])
    assert fake_store[stocks.ETFS_DOC] == ["QQQ", "SPY"]


def test_add_index_is_idempotent(fake_store: dict):
    stocks.add_index("S&P 500")
    stocks.add_index("S&P 500")
    assert fake_store[stocks.INDEXES_DOC] == ["S&P 500"]


def test_getters_default_when_empty(fake_store: dict):
    assert stocks.get_indexes() == []
    assert stocks.get_etfs() == []
    assert stocks.get_sectors() == {}
    assert stocks.get_symbols() == {}
    assert stocks.get_prices("AAPL") == {}


def test_prices_round_trip(fake_store: dict):
    prices = {"2026-01-02": {"open": 1.0, "close": 2.0}}
    stocks.set_prices("AAPL", prices)
    assert stocks.get_prices("AAPL") == prices
    assert f"{stocks.PRICES_DOC_PREFIX}/AAPL" in fake_store


def test_save_price_history_downloads_and_updates_metadata(
    fake_store: dict, monkeypatch: pytest.MonkeyPatch
):
    history = {"2026-01-02": {"open": 1.0}}
    monkeypatch.setattr(yahoo, "download_daily_history", lambda symbol: history)
    stocks.save_price_history("AAPL")
    assert stocks.get_prices("AAPL") == history
    metadata = stocks.get_symbols()["AAPL"]
    assert metadata["last_updated"] == date.today().isoformat()


def test_save_price_history_skips_when_already_updated_today(
    fake_store: dict, monkeypatch: pytest.MonkeyPatch
):
    metadata = stocks.new_symbol_metadata()
    metadata["last_updated"] = date.today().isoformat()
    fake_store[stocks.SYMBOLS_DOC] = {"AAPL": metadata}

    def explode(symbol: str):
        raise AssertionError("should not download")

    monkeypatch.setattr(yahoo, "download_daily_history", explode)
    stocks.save_price_history("AAPL")


def test_save_all_price_histories_continues_after_failure(
    fake_store: dict, monkeypatch: pytest.MonkeyPatch
):
    fake_store[stocks.SYMBOLS_DOC] = {
        "AAA": stocks.new_symbol_metadata(),
        "BBB": stocks.new_symbol_metadata(),
    }
    downloaded = []

    def download(symbol: str):
        if symbol == "AAA":
            raise ValueError("boom")
        downloaded.append(symbol)
        return {}

    monkeypatch.setattr(yahoo, "download_daily_history", download)
    stocks.save_all_price_histories()
    assert downloaded == ["BBB"]
