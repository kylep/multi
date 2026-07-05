"""S&P 500 membership: live from Wikipedia, or offline from a holdings spreadsheet."""

import logging
from dataclasses import dataclass
from pathlib import Path

import pandas as pd

from kytrade import stocks

logger = logging.getLogger(__name__)

WIKIPEDIA_URL = "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies"
INDEX_NAME = "S&P 500"
INDEX_ETF = "SPY"


@dataclass(frozen=True, slots=True)
class Member:
    """One S&P 500 constituent."""

    ticker: str
    sector: str | None
    currency: str | None


def _clean(value: object) -> str | None:
    return None if value is None or pd.isna(value) else str(value)


def _normalize_ticker(ticker: str) -> str:
    """Match Yahoo's ticker style: class shares use dashes (BRK.B -> BRK-B)."""
    return ticker.strip().upper().replace(".", "-")


def fetch_membership(url: str = WIKIPEDIA_URL) -> list[Member]:
    """Fetch current S&P 500 membership from Wikipedia's constituents table."""
    df = pd.read_html(url, flavor="bs4")[0]
    logger.info("fetched %d S&P 500 constituents from %s", len(df), url)
    return [
        Member(
            ticker=_normalize_ticker(str(row["Symbol"])),
            sector=_clean(row.get("GICS Sector")),
            currency="USD",
        )
        for _, row in df.iterrows()
    ]


def load_membership_from_excel(path: Path | str) -> list[Member]:
    """Read membership from a SPY holdings spreadsheet (offline fallback)."""
    df = pd.read_excel(path)
    df = df[df["Ticker"].notnull()]
    logger.info("loaded %d S&P 500 constituents from %s", len(df), path)
    return [
        Member(
            ticker=_normalize_ticker(str(row["Ticker"])),
            sector=_clean(row.get("Sector")),
            currency=_clean(row.get("Local Currency")),
        )
        for _, row in df.iterrows()
    ]


def apply_membership(members: list[Member]) -> int:
    """Merge membership into the symbol/sector documents; return the member count."""
    stocks.add_index(INDEX_NAME)
    stocks.add_etfs([INDEX_ETF])
    symbols = stocks.get_symbols()
    sectors = stocks.get_sectors()
    for member in members:
        metadata = symbols.setdefault(member.ticker, stocks.new_symbol_metadata())
        metadata["indexes"] = sorted(set(metadata["indexes"]) | {INDEX_NAME})
        metadata["etfs"] = sorted(set(metadata["etfs"]) | {INDEX_ETF})
        if member.currency:
            metadata["currency"] = member.currency
        if member.sector:
            metadata["sectors"] = sorted(set(metadata["sectors"]) | {member.sector})
            tickers = sectors.setdefault(member.sector, [])
            if member.ticker not in tickers:
                tickers.append(member.ticker)
    stocks.set_symbols(symbols)
    stocks.set_sectors({name: sorted(tickers) for name, tickers in sectors.items()})
    return len(members)
