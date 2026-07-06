"""Function-layer integration tests: pulls, analysis, and ops over real postgres."""

from datetime import date

import pytest

from kytrade import analysis, ops, sp500, stocks

pytestmark = pytest.mark.integration


class FakeProvider:
    """Deterministic provider so integration tests never touch the network."""

    def __init__(self, history):
        self.history = history

    def daily_history(self, symbol, start=None):
        if start is None:
            return self.history
        return {
            day: row
            for day, row in self.history.items()
            if date.fromisoformat(day) >= start
        }


def day_row(close: float) -> dict:
    return {"open": close, "high": close, "low": close, "close": close, "volume": 10}


def test_pull_is_incremental_through_real_store(clean_db):
    provider = FakeProvider({"2026-01-02": day_row(1.0)})
    assert stocks.pull_price_history("AAPL", provider=provider) == 1

    provider.history["2026-01-05"] = day_row(2.0)
    symbols = stocks.get_symbols()
    symbols["AAPL"]["last_updated"] = None
    stocks.set_symbols(symbols)
    assert stocks.pull_price_history("AAPL", provider=provider) == 1
    assert list(stocks.get_prices("AAPL")) == ["2026-01-02", "2026-01-05"]


def test_membership_and_analysis_over_real_store(clean_db):
    sp500.apply_membership(
        [
            sp500.Member(ticker="AAA", sector="Tech", currency="USD"),
            sp500.Member(ticker="BBB", sector="Energy", currency="USD"),
        ]
    )
    stocks.set_prices(
        "AAA", {"2026-06-01": day_row(100.0), "2026-07-01": day_row(120.0)}
    )
    stocks.set_prices(
        "BBB", {"2026-06-01": day_row(100.0), "2026-07-01": day_row(90.0)}
    )
    movers = analysis.movers(days=90, top=1)
    assert movers.gainers[0].symbol == "AAA"
    assert movers.losers[0].symbol == "BBB"
    sectors = analysis.sector_performance(days=90)
    assert [entry.sector for entry in sectors.sectors] == ["Tech", "Energy"]


def test_status_over_real_store(clean_db):
    stocks.set_symbols({"AAA": stocks.new_symbol_metadata()})
    report = ops.status()
    assert report.db_ok and report.tables_ok
    assert report.symbols == 1
    assert report.staleness.never == 1
