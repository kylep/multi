"""Provider protocol for daily price history."""

from datetime import date
from typing import Protocol

type DailyPrices = dict[str, dict[str, float | None]]


class PriceProvider(Protocol):
    """A source of daily OHLCV price history."""

    def daily_history(self, symbol: str, start: date | None = None) -> DailyPrices:
        """Return date-keyed OHLCV rows for a symbol, from start (or all time)."""
        ...
