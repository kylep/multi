"""Yahoo Finance price data.

Suitable for small-batch daily pulls; Yahoo rate-limits aggressively.
"""

import logging
import math

import pandas as pd
import yfinance

logger = logging.getLogger(__name__)

PRICE_FIELDS = {
    "Open": "open",
    "High": "high",
    "Low": "low",
    "Close": "close",
    "Volume": "volume",
}

type DailyPrices = dict[str, dict[str, float | None]]


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


def download_daily_history(symbol: str) -> DailyPrices:
    """Download the full daily history for a symbol, oldest first."""
    logger.debug("downloading daily history for %s", symbol)
    df = yfinance.Ticker(symbol).history(period="max", auto_adjust=True)
    return history_df_to_dict(df)
