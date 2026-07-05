"""Load index-membership spreadsheets into the document store."""

import logging
from pathlib import Path

import pandas as pd

from kytrade import stocks

logger = logging.getLogger(__name__)


def _clean(value: object) -> str | None:
    return None if value is None or pd.isna(value) else str(value)


def load_sp500(path: Path | str) -> int:
    """Load an S&P 500 holdings spreadsheet; return the number of symbols loaded."""
    df = pd.read_excel(path)
    df = df[df["Ticker"].notnull()]
    logger.info("loading %d S&P 500 symbols from %s", len(df), path)
    stocks.add_index("S&P 500")
    stocks.add_etfs(["SPY"])
    symbols = stocks.get_symbols()
    sectors = stocks.get_sectors()
    for _, row in df.iterrows():
        ticker = str(row["Ticker"])
        sector = _clean(row.get("Sector"))
        metadata = symbols.setdefault(ticker, stocks.new_symbol_metadata())
        metadata["indexes"] = sorted(set(metadata["indexes"]) | {"S&P 500"})
        metadata["etfs"] = sorted(set(metadata["etfs"]) | {"SPY"})
        metadata["currency"] = _clean(row.get("Local Currency"))
        if sector:
            metadata["sectors"] = sorted(set(metadata["sectors"]) | {sector})
            members = sectors.setdefault(sector, [])
            if ticker not in members:
                members.append(ticker)
    stocks.set_symbols(symbols)
    stocks.set_sectors({name: sorted(members) for name, members in sectors.items()})
    return len(df)
