"""Index membership: live from Wikipedia, or offline from a holdings spreadsheet."""

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

MEMBERSHIP_LOG_DOC = "stock/membership-log"


@dataclass(frozen=True, slots=True)
class IndexSpec:
    """A tracked market index and how to fetch its membership."""

    key: str
    name: str
    etf: str
    currency: str
    url: str
    symbol_column: str
    sector_column: str
    yahoo_suffix: str = ""


SP500 = IndexSpec(
    key="sp500",
    name="S&P 500",
    etf="SPY",
    currency="USD",
    url="https://en.wikipedia.org/wiki/List_of_S%26P_500_companies",
    symbol_column="Symbol",
    sector_column="GICS Sector",
)

TSX60 = IndexSpec(
    key="tsx60",
    name="S&P/TSX 60",
    etf="XIU.TO",
    currency="CAD",
    url="https://en.wikipedia.org/wiki/S%26P/TSX_60",
    symbol_column="Symbol",
    sector_column="Sector",
    yahoo_suffix=".TO",
)

INDEXES = {spec.key: spec for spec in (SP500, TSX60)}

DEFAULT_ETFS = {"SPY": "USD", "QQQ": "USD", "XIU.TO": "CAD"}


@dataclass(frozen=True, slots=True)
class Member:
    """One index constituent."""

    ticker: str
    sector: str | None
    currency: str | None


def _clean(value: object) -> str | None:
    return None if value is None or pd.isna(value) else str(value)


def _normalize_ticker(ticker: str, suffix: str = "") -> str:
    """Match Yahoo's style: dashes for share classes, exchange suffix appended.

    BRK.B -> BRK-B; CTC.A + .TO -> CTC-A.TO.
    """
    return ticker.strip().upper().replace(".", "-") + suffix


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


def fetch_membership(spec: IndexSpec) -> list[Member]:
    """Fetch an index's current membership from its Wikipedia constituents table."""
    tables = pd.read_html(StringIO(_fetch_html(spec.url)), flavor="bs4")
    df = next(
        (
            table
            for table in tables
            if spec.symbol_column in table.columns
            and spec.sector_column in table.columns
        ),
        None,
    )
    if df is None:
        raise ValueError(f"no constituents table found at {spec.url}")
    df = df[df[spec.symbol_column].notnull()]
    logger.info("fetched %d %s constituents from %s", len(df), spec.name, spec.url)
    return [
        Member(
            ticker=_normalize_ticker(str(row[spec.symbol_column]), spec.yahoo_suffix),
            sector=_clean(row.get(spec.sector_column)),
            currency=spec.currency,
        )
        for _, row in df.iterrows()
    ]


def load_membership_from_excel(path: Path | str) -> list[Member]:
    """Read S&P 500 membership from a SPY holdings spreadsheet (offline fallback)."""
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


def _sectors_from_symbols(
    symbols: dict[str, stocks.SymbolMetadata],
) -> dict[str, list[str]]:
    """Derive the sectors document from current index members' sectors."""
    sectors: dict[str, list[str]] = {}
    for ticker, metadata in symbols.items():
        if not metadata["indexes"]:
            continue
        for sector in metadata["sectors"]:
            sectors.setdefault(sector, []).append(ticker)
    return {name: sorted(tickers) for name, tickers in sectors.items()}


def apply_membership(spec: IndexSpec, members: list[Member]) -> MembershipDiff:
    """Reconcile the symbol/sector documents with one index's membership.

    Symbols that left this index lose its index/ETF tags (price history
    stays), a member's sector list is replaced with its current sector,
    and the sectors document is re-derived from every current index
    member — so loading one index never disturbs another's sectors.
    Non-empty diffs are appended to the membership log document.
    """
    stocks.add_index(spec.name)
    stocks.add_etfs([spec.etf])
    symbols = stocks.get_symbols()
    current = {member.ticker for member in members}
    previous = {
        ticker
        for ticker, metadata in symbols.items()
        if spec.name in metadata["indexes"]
    }
    for ticker in previous - current:
        logger.info("%s left the %s", ticker, spec.name)
        metadata = symbols[ticker]
        metadata["indexes"] = [i for i in metadata["indexes"] if i != spec.name]
        metadata["etfs"] = [e for e in metadata["etfs"] if e != spec.etf]
    for member in members:
        metadata = symbols.setdefault(member.ticker, stocks.new_symbol_metadata())
        metadata["indexes"] = sorted(set(metadata["indexes"]) | {spec.name})
        metadata["etfs"] = sorted(set(metadata["etfs"]) | {spec.etf})
        if member.currency:
            metadata["currency"] = member.currency
        if member.sector:
            metadata["sectors"] = [member.sector]
    stocks.set_symbols(symbols)
    stocks.set_sectors(_sectors_from_symbols(symbols))
    diff = MembershipDiff(
        index=spec.name,
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
        {
            "date": date.today().isoformat(),
            "index": diff.index,
            "added": diff.added,
            "removed": diff.removed,
        }
    )
    db.set_document(MEMBERSHIP_LOG_DOC, log)


def membership_log() -> list[MembershipLogEntry]:
    """Return the dated membership changes recorded by past loads."""
    entries = db.get_document(MEMBERSHIP_LOG_DOC) or []
    return [MembershipLogEntry(**entry) for entry in entries]


def track_etf(ticker: str, currency: str | None = None) -> bool:
    """Track an ETF's prices like any symbol; return True if newly tracked.

    ETFs carry no index tags, so index reconciliation never untags them.
    """
    ticker = ticker.strip().upper()
    stocks.add_etfs([ticker])
    symbols = stocks.get_symbols()
    created = ticker not in symbols
    metadata = symbols.setdefault(ticker, stocks.new_symbol_metadata())
    metadata["etfs"] = sorted(set(metadata["etfs"]) | {ticker})
    if currency:
        metadata["currency"] = currency
    stocks.set_symbols(symbols)
    return created


def track_default_etfs() -> list[str]:
    """Track the house ETFs (SPY, QQQ, XIU.TO); return the newly added ones."""
    return [
        ticker
        for ticker, currency in DEFAULT_ETFS.items()
        if track_etf(ticker, currency)
    ]
