"""Read-only analysis over stored price history.

Windows are measured in calendar days back from a symbol's most recent
stored trading day, so stale data still analyzes consistently.
"""

import logging
import statistics
from datetime import date, timedelta

from kytrade import db, stocks
from kytrade.models import (
    Comparison,
    ComparisonEntry,
    ExtremeHit,
    Movers,
    Performance,
    ScreenerReport,
    SectorPerformance,
    SectorReport,
    VolatilityReport,
    VolatilityWindow,
)
from kytrade.providers import DailyPrices

logger = logging.getLogger(__name__)


class NotEnoughData(Exception):
    """The stored history cannot support the requested calculation."""


def _closes(history: DailyPrices, days: int | None = None) -> list[tuple[str, float]]:
    """Return (date, close) pairs sorted by date, optionally windowed.

    Non-positive closes are treated as bad vendor data and dropped so
    ratio math can never divide by zero.
    """
    points = [
        (day, row["close"])
        for day, row in sorted(history.items())
        if row.get("close") is not None and row["close"] > 0
    ]
    if days is not None and points:
        cutoff = (date.fromisoformat(points[-1][0]) - timedelta(days=days)).isoformat()
        points = [point for point in points if point[0] >= cutoff]
    return points


def _return_pct(points: list[tuple[str, float]]) -> float:
    return round((points[-1][1] / points[0][1] - 1) * 100, 2)


def _all_price_histories() -> dict[str, DailyPrices]:
    prefix = f"{stocks.PRICES_DOC_PREFIX}/"
    return {
        name.removeprefix(prefix): history
        for name, history in db.get_documents(prefix).items()
    }


def performance(symbol: str, days: int = 90) -> Performance:
    """Window performance for one symbol: return, high/low, average volume."""
    history = stocks.get_prices(symbol)
    points = _closes(history, days)
    if len(points) < 2:
        raise NotEnoughData(f"{symbol}: {len(points)} closes in the last {days} days")
    window_days = {day for day, _ in points}
    highs = [
        row["high"]
        for day, row in history.items()
        if day in window_days and row.get("high") is not None
    ]
    lows = [
        row["low"]
        for day, row in history.items()
        if day in window_days and row.get("low") is not None
    ]
    volumes = [
        row["volume"]
        for day, row in history.items()
        if day in window_days and row.get("volume") is not None
    ]
    closes = [close for _, close in points]
    return Performance(
        symbol=symbol,
        days=days,
        start_date=points[0][0],
        end_date=points[-1][0],
        start_close=points[0][1],
        end_close=points[-1][1],
        return_pct=_return_pct(points),
        high=max(highs) if highs else max(closes),
        low=min(lows) if lows else min(closes),
        avg_volume=int(sum(volumes) / len(volumes)) if volumes else 0,
    )


def _entry(symbol: str, history: DailyPrices, days: int) -> ComparisonEntry | None:
    points = _closes(history, days)
    if len(points) < 2:
        return None
    return ComparisonEntry(
        symbol=symbol,
        return_pct=_return_pct(points),
        start_close=points[0][1],
        end_close=points[-1][1],
    )


def compare(symbols: list[str], days: int = 365) -> Comparison:
    """Window returns for several symbols, best first."""
    entries = []
    for symbol in symbols:
        entry = _entry(symbol, stocks.get_prices(symbol), days)
        if entry is None:
            raise NotEnoughData(f"{symbol}: not enough stored history")
        entries.append(entry)
    entries.sort(key=lambda entry: entry.return_pct, reverse=True)
    return Comparison(days=days, entries=entries)


def movers(days: int = 30, top: int = 10) -> Movers:
    """Best and worst window returns across every stored symbol."""
    entries = []
    for symbol, history in _all_price_histories().items():
        entry = _entry(symbol, history, days)
        if entry is not None:
            entries.append(entry)
    entries.sort(key=lambda entry: entry.return_pct, reverse=True)
    return Movers(
        days=days,
        gainers=entries[:top],
        losers=entries[-top:][::-1],
        universe=len(entries),
    )


def sector_performance(days: int = 90) -> SectorReport:
    """Average member return per sector over a window, best first."""
    histories = _all_price_histories()
    sectors = []
    for sector, members in stocks.get_sectors().items():
        returns = []
        for symbol in members:
            entry = _entry(symbol, histories.get(symbol, {}), days)
            if entry is not None:
                returns.append(entry.return_pct)
        if returns:
            sectors.append(
                SectorPerformance(
                    sector=sector,
                    return_pct=round(sum(returns) / len(returns), 2),
                    symbols=len(returns),
                )
            )
    sectors.sort(key=lambda sector: sector.return_pct, reverse=True)
    return SectorReport(days=days, sectors=sectors)


def near_extreme(
    kind: str = "high", threshold_pct: float = 5.0, lookback_days: int = 365
) -> ScreenerReport:
    """Symbols whose latest close is within threshold of their lookback extreme."""
    if kind not in ("high", "low"):
        raise ValueError(f"kind must be 'high' or 'low', not {kind!r}")
    hits = []
    histories = _all_price_histories()
    for symbol, history in histories.items():
        points = _closes(history, lookback_days)
        if len(points) < 2:
            continue
        closes = [close for _, close in points]
        latest = closes[-1]
        extreme = max(closes) if kind == "high" else min(closes)
        distance_pct = round(abs(latest / extreme - 1) * 100, 2)
        if distance_pct <= threshold_pct:
            hits.append(
                ExtremeHit(
                    symbol=symbol,
                    close=latest,
                    extreme=extreme,
                    distance_pct=distance_pct,
                )
            )
    hits.sort(key=lambda hit: hit.distance_pct)
    return ScreenerReport(
        kind=kind,
        threshold_pct=threshold_pct,
        lookback_days=lookback_days,
        hits=hits,
        universe=len(histories),
    )


def volatility(symbol: str, window_days: int = 21) -> VolatilityReport:
    """Daily-return volatility for a symbol and its worst rolling window."""
    if window_days < 2:
        raise ValueError("window_days must be at least 2")
    points = _closes(stocks.get_prices(symbol))
    if len(points) <= window_days:
        raise NotEnoughData(f"{symbol}: need more than {window_days} stored closes")
    returns = [
        (day, (close / prev_close - 1) * 100)
        for (_, prev_close), (day, close) in zip(points, points[1:], strict=False)
    ]
    overall = statistics.stdev(value for _, value in returns)
    worst = None
    for i in range(len(returns) - window_days + 1):
        window = returns[i : i + window_days]
        stddev = statistics.stdev(value for _, value in window)
        if worst is None or stddev > worst[2]:
            worst = (window[0][0], window[-1][0], stddev)
    return VolatilityReport(
        symbol=symbol,
        window_days=window_days,
        overall_daily_stddev_pct=round(overall, 2),
        worst_window=VolatilityWindow(
            start_date=worst[0],
            end_date=worst[1],
            daily_stddev_pct=round(worst[2], 2),
        ),
    )
