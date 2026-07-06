"""Yahoo Finance price provider.

Suitable for small-batch daily pulls; Yahoo rate-limits aggressively.
"""

import logging
import math
from datetime import date

import pandas as pd
import yfinance

from kytrade.providers.base import DailyPrices

logger = logging.getLogger(__name__)

PRICE_FIELDS = {
    "Open": "open",
    "High": "high",
    "Low": "low",
    "Close": "close",
    "Volume": "volume",
}


def history_df_to_dict(df: pd.DataFrame) -> DailyPrices:
    """Convert a yfinance history frame to a JSON-safe, date-keyed dict.

    Prices are rounded to 4 decimals to shed float32 conversion noise.
    """
    history: DailyPrices = {}
    for timestamp, row in df.iterrows():
        day: dict[str, float | None] = {}
        for column, field in PRICE_FIELDS.items():
            value = row.get(column)
            day[field] = (
                None if value is None or math.isnan(value) else round(float(value), 4)
            )
        if all(value is None for value in day.values()):
            continue
        if day["volume"] is not None:
            day["volume"] = int(day["volume"])
        history[str(timestamp.date())] = day
    return history


class YahooProvider:
    """PriceProvider backed by yfinance."""

    def daily_history(self, symbol: str, start: date | None = None) -> DailyPrices:
        """Return daily OHLCV for a symbol from start, or all time if start is None."""
        logger.debug("yahoo history for %s start=%s", symbol, start)
        ticker = yfinance.Ticker(symbol)
        if start is None:
            df = ticker.history(period="max", auto_adjust=True)
        else:
            df = ticker.history(start=start, auto_adjust=True)
        return history_df_to_dict(df)
