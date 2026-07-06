"""S&P 500 membership: live from Wikipedia, or offline from a holdings spreadsheet."""

import logging
from dataclasses import dataclass
from datetime import date
from io import StringIO
from pathlib import Path

import pandas as pd
import requests

import kytrade
from kytrade import db, stocks
from kytrade.models import MembershipDiff, MembershipLogEntry

logger = logging.getLogger(__name__)

WIKIPEDIA_URL = "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies"
INDEX_NAME = "S&P 500"
INDEX_ETF = "SPY"
MEMBERSHIP_LOG_DOC = "stock/membership-log"


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


def _fetch_html(url: str) -> str:
    """GET a page with a real User-Agent; Wikipedia 403s the default one."""
    if not url.startswith("https://"):
        raise ValueError(f"refusing non-https URL: {url}")
    response = requests.get(
        url,
        headers={"User-Agent": f"kytrade/{kytrade.__version__} (kyle@pericak.com)"},
        timeout=30,
    )
    response.raise_for_status()
    return response.text


def fetch_membership(url: str = WIKIPEDIA_URL) -> list[Member]:
    """Fetch current S&P 500 membership from Wikipedia's constituents table."""
    df = pd.read_html(StringIO(_fetch_html(url)), flavor="bs4")[0]
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


def apply_membership(members: list[Member]) -> MembershipDiff:
    """Reconcile the symbol/sector documents with membership; return the diff.

    Symbols that left the index lose their index/ETF tags (price history
    stays), a member's sector list is replaced with its current GICS
    sector, and the sectors document is rebuilt from this membership.
    Non-empty diffs are appended to the membership log document.
    """
    stocks.add_index(INDEX_NAME)
    stocks.add_etfs([INDEX_ETF])
    symbols = stocks.get_symbols()
    current = {member.ticker for member in members}
    previous = {
        ticker
        for ticker, metadata in symbols.items()
        if INDEX_NAME in metadata["indexes"]
    }
    for ticker in previous - current:
        logger.info("%s left the %s", ticker, INDEX_NAME)
        metadata = symbols[ticker]
        metadata["indexes"] = [i for i in metadata["indexes"] if i != INDEX_NAME]
        metadata["etfs"] = [e for e in metadata["etfs"] if e != INDEX_ETF]
    sectors: dict[str, list[str]] = {}
    for member in members:
        metadata = symbols.setdefault(member.ticker, stocks.new_symbol_metadata())
        metadata["indexes"] = sorted(set(metadata["indexes"]) | {INDEX_NAME})
        metadata["etfs"] = sorted(set(metadata["etfs"]) | {INDEX_ETF})
        if member.currency:
            metadata["currency"] = member.currency
        if member.sector:
            metadata["sectors"] = [member.sector]
            sectors.setdefault(member.sector, []).append(member.ticker)
    stocks.set_symbols(symbols)
    stocks.set_sectors({name: sorted(tickers) for name, tickers in sectors.items()})
    diff = MembershipDiff(
        index=INDEX_NAME,
        added=sorted(current - previous),
        removed=sorted(previous - current),
        total=len(members),
    )
    if previous and (diff.added or diff.removed):
        _log_membership_change(diff)
    return diff


def _log_membership_change(diff: MembershipDiff) -> None:
    log = db.get_document(MEMBERSHIP_LOG_DOC) or []
    log.append(
        {"date": date.today().isoformat(), "added": diff.added, "removed": diff.removed}
    )
    db.set_document(MEMBERSHIP_LOG_DOC, log)


def membership_log() -> list[MembershipLogEntry]:
    """Return the dated membership changes recorded by past loads."""
    entries = db.get_document(MEMBERSHIP_LOG_DOC) or []
    return [MembershipLogEntry(**entry) for entry in entries]
