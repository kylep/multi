"""Tests for kytrade.stocks."""

from datetime import date

import pytest

from kytrade import stocks
from kytrade.providers.base import DailyPrices


class FakeProvider:
    """PriceProvider stub returning a canned history, recording calls."""

    def __init__(self, history: DailyPrices):
        self.history = history
        self.calls: list[tuple[str, date | None]] = []

    def daily_history(self, symbol: str, start: date | None = None) -> DailyPrices:
        self.calls.append((symbol, start))
        if start is None:
            return self.history
        return {
            day: row
            for day, row in self.history.items()
            if date.fromisoformat(day) >= start
        }


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


def test_pull_price_history_downloads_everything_when_empty(fake_store: dict):
    provider = FakeProvider({"2026-01-02": {"open": 1.0}, "2026-01-03": {"open": 2.0}})
    new_days = stocks.pull_price_history("AAPL", provider=provider)
    assert new_days == 2
    assert provider.calls == [("AAPL", None)]
    assert stocks.get_prices("AAPL") == provider.history
    metadata = stocks.get_symbols()["AAPL"]
    assert metadata["last_updated"] == date.today().isoformat()


def test_pull_price_history_is_incremental(fake_store: dict):
    stocks.set_prices("AAPL", {"2026-01-02": {"open": 1.0}})
    provider = FakeProvider(
        {
            "2026-01-02": {"open": 1.0},
            "2026-01-03": {"open": 2.0},
            "2026-01-06": {"open": 3.0},
        }
    )
    new_days = stocks.pull_price_history("AAPL", provider=provider)
    assert new_days == 2
    assert provider.calls == [("AAPL", date(2026, 1, 3))]
    assert list(stocks.get_prices("AAPL")) == ["2026-01-02", "2026-01-03", "2026-01-06"]


def test_pull_price_history_full_redownloads(fake_store: dict):
    stocks.set_prices("AAPL", {"2020-01-02": {"open": 99.0}})
    provider = FakeProvider({"2026-01-02": {"open": 1.0}})
    new_days = stocks.pull_price_history("AAPL", full=True, provider=provider)
    assert new_days == 1
    assert provider.calls == [("AAPL", None)]
    assert stocks.get_prices("AAPL") == provider.history


def test_pull_price_history_skips_when_already_updated_today(fake_store: dict):
    metadata = stocks.new_symbol_metadata()
    metadata["last_updated"] = date.today().isoformat()
    fake_store[stocks.SYMBOLS_DOC] = {"AAPL": metadata}
    provider = FakeProvider({"2026-01-02": {"open": 1.0}})
    assert stocks.pull_price_history("AAPL", provider=provider) == 0
    assert provider.calls == []


def test_pull_price_history_full_ignores_daily_skip(fake_store: dict):
    metadata = stocks.new_symbol_metadata()
    metadata["last_updated"] = date.today().isoformat()
    fake_store[stocks.SYMBOLS_DOC] = {"AAPL": metadata}
    provider = FakeProvider({"2026-01-02": {"open": 1.0}})
    assert stocks.pull_price_history("AAPL", full=True, provider=provider) == 1


def test_pull_price_history_keeps_store_when_nothing_fetched(fake_store: dict):
    stored = {"2026-01-02": {"open": 1.0}}
    stocks.set_prices("AAPL", stored)
    writes_before = fake_store[f"{stocks.PRICES_DOC_PREFIX}/AAPL"]
    provider = FakeProvider({})
    assert stocks.pull_price_history("AAPL", provider=provider) == 0
    assert fake_store[f"{stocks.PRICES_DOC_PREFIX}/AAPL"] is writes_before


def test_pull_all_price_histories_continues_after_failure(
    fake_store: dict, monkeypatch: pytest.MonkeyPatch
):
    fake_store[stocks.SYMBOLS_DOC] = {
        "AAA": stocks.new_symbol_metadata(),
        "BBB": stocks.new_symbol_metadata(),
    }
    pulled = []

    def pull(symbol, *, full=False, provider=None, symbols=None):
        if symbol == "AAA":
            raise ValueError("boom")
        pulled.append(symbol)
        return 1

    monkeypatch.setattr(stocks, "pull_price_history", pull)
    stocks.pull_all_price_histories()
    assert pulled == ["BBB"]
