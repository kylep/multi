"""Tests for kytrade.analysis."""

import pytest

from kytrade import analysis, stocks


def day_row(close: float, volume: int = 100) -> dict:
    return {
        "open": close,
        "high": close * 1.02,
        "low": close * 0.98,
        "close": close,
        "volume": volume,
    }


def seed(store: dict, symbol: str, closes: dict[str, float]) -> None:
    store[f"{stocks.PRICES_DOC_PREFIX}/{symbol}"] = {
        day: day_row(close) for day, close in closes.items()
    }


def test_performance_computes_window_return(fake_store: dict):
    seed(
        fake_store,
        "AAPL",
        {"2025-01-02": 50.0, "2026-06-01": 100.0, "2026-07-01": 110.0},
    )
    report = analysis.performance("AAPL", days=90)
    assert report.start_date == "2026-06-01"
    assert report.end_date == "2026-07-01"
    assert report.return_pct == 10.0
    assert report.high == 110.0 * 1.02
    assert report.low == 100.0 * 0.98
    assert report.avg_volume == 100


def test_performance_rejects_thin_history(fake_store: dict):
    seed(fake_store, "AAPL", {"2026-07-01": 100.0})
    with pytest.raises(analysis.NotEnoughData):
        analysis.performance("AAPL", days=90)


def test_performance_ignores_null_closes(fake_store: dict):
    fake_store[f"{stocks.PRICES_DOC_PREFIX}/AAPL"] = {
        "2026-06-01": day_row(100.0),
        "2026-06-15": {
            "open": 1.0,
            "high": 1.0,
            "low": 1.0,
            "close": None,
            "volume": 1,
        },
        "2026-07-01": day_row(120.0),
    }
    assert analysis.performance("AAPL", days=90).return_pct == 20.0


def test_compare_sorts_best_first(fake_store: dict):
    seed(fake_store, "AAA", {"2026-06-01": 100.0, "2026-07-01": 105.0})
    seed(fake_store, "BBB", {"2026-06-01": 100.0, "2026-07-01": 120.0})
    report = analysis.compare(["AAA", "BBB"], days=90)
    assert [entry.symbol for entry in report.entries] == ["BBB", "AAA"]
    assert report.entries[0].return_pct == 20.0


def test_compare_raises_on_unknown_symbol(fake_store: dict):
    seed(fake_store, "AAA", {"2026-06-01": 100.0, "2026-07-01": 105.0})
    with pytest.raises(analysis.NotEnoughData):
        analysis.compare(["AAA", "NOPE"], days=90)


def test_movers_ranks_universe(fake_store: dict):
    seed(fake_store, "UP", {"2026-06-01": 100.0, "2026-07-01": 130.0})
    seed(fake_store, "FLAT", {"2026-06-01": 100.0, "2026-07-01": 101.0})
    seed(fake_store, "DOWN", {"2026-06-01": 100.0, "2026-07-01": 70.0})
    report = analysis.movers(days=90, top=1)
    assert report.universe == 3
    assert report.gainers[0].symbol == "UP"
    assert report.losers[0].symbol == "DOWN"


def test_sector_performance_averages_members(fake_store: dict):
    fake_store[stocks.SECTORS_DOC] = {
        "Tech": ["AAA", "BBB"],
        "Energy": ["CCC"],
        "Empty": ["NODATA"],
    }
    seed(fake_store, "AAA", {"2026-06-01": 100.0, "2026-07-01": 110.0})
    seed(fake_store, "BBB", {"2026-06-01": 100.0, "2026-07-01": 130.0})
    seed(fake_store, "CCC", {"2026-06-01": 100.0, "2026-07-01": 90.0})
    report = analysis.sector_performance(days=90)
    assert [sector.sector for sector in report.sectors] == ["Tech", "Energy"]
    assert report.sectors[0].return_pct == 20.0
    assert report.sectors[0].symbols == 2


def test_near_extreme_high_finds_hits(fake_store: dict):
    seed(fake_store, "NEAR", {"2026-06-01": 100.0, "2026-07-01": 98.0})
    seed(fake_store, "FAR", {"2026-06-01": 100.0, "2026-07-01": 60.0})
    report = analysis.near_extreme(kind="high", threshold_pct=5.0, lookback_days=365)
    assert [hit.symbol for hit in report.hits] == ["NEAR"]
    assert report.hits[0].distance_pct == 2.0
    assert report.universe == 2


def test_near_extreme_low(fake_store: dict):
    seed(fake_store, "ATLOW", {"2026-06-01": 100.0, "2026-07-01": 80.0})
    report = analysis.near_extreme(kind="low", threshold_pct=1.0, lookback_days=365)
    assert [hit.symbol for hit in report.hits] == ["ATLOW"]


def test_near_extreme_rejects_bad_kind(fake_store: dict):
    with pytest.raises(ValueError):
        analysis.near_extreme(kind="sideways")


def test_volatility_finds_worst_window(fake_store: dict):
    closes = {}
    for i in range(1, 10):
        closes[f"2026-06-{i:02d}"] = 100.0 + (i % 2)
    closes["2026-06-10"] = 150.0
    closes["2026-06-11"] = 90.0
    seed(fake_store, "WILD", closes)
    report = analysis.volatility("WILD", window_days=3)
    assert report.worst_window.end_date == "2026-06-11"
    assert report.overall_daily_stddev_pct > 0


def test_volatility_rejects_thin_history(fake_store: dict):
    seed(fake_store, "AAPL", {"2026-07-01": 100.0, "2026-07-02": 101.0})
    with pytest.raises(analysis.NotEnoughData):
        analysis.volatility("AAPL", window_days=21)
