"""Stock documents: symbols, indexes, ETFs, sectors, and per-symbol price history."""

import logging
from datetime import date, timedelta
from typing import Any

from kytrade import db
from kytrade.providers import DailyPrices, PriceProvider
from kytrade.providers.yahoo import YahooProvider

logger = logging.getLogger(__name__)

INDEXES_DOC = "stock/indexes"
SYMBOLS_DOC = "stock/symbols"
ETFS_DOC = "stock/etfs"
SECTORS_DOC = "stock/sectors"
PRICES_DOC_PREFIX = "stock/prices"

type SymbolMetadata = dict[str, Any]


def new_symbol_metadata() -> SymbolMetadata:
    """Return empty metadata for a symbol not seen before."""
    return {
        "indexes": [],
        "etfs": [],
        "sectors": [],
        "currency": None,
        "last_updated": None,
    }


def _merge_unique(doc_name: str, new_values: list[str]) -> None:
    """Union new_values into a sorted list document."""
    merged = set(db.get_document(doc_name) or []) | set(new_values)
    db.set_document(doc_name, sorted(merged))


def get_indexes() -> list[str]:
    """Return the known index names."""
    return db.get_document(INDEXES_DOC) or []


def add_index(name: str) -> None:
    """Add an index name; no-op if already known."""
    _merge_unique(INDEXES_DOC, [name])


def get_etfs() -> list[str]:
    """Return the known ETF tickers."""
    return db.get_document(ETFS_DOC) or []


def add_etfs(etfs: list[str]) -> None:
    """Add ETF tickers, keeping the list unique."""
    _merge_unique(ETFS_DOC, etfs)


def get_sectors() -> dict[str, list[str]]:
    """Return sector name mapped to its member tickers."""
    return db.get_document(SECTORS_DOC) or {}


def set_sectors(sectors: dict[str, list[str]]) -> None:
    """Replace the sector membership document."""
    db.set_document(SECTORS_DOC, sectors)


def get_symbols() -> dict[str, SymbolMetadata]:
    """Return ticker mapped to metadata for every known symbol."""
    return db.get_document(SYMBOLS_DOC) or {}


def set_symbols(symbols: dict[str, SymbolMetadata]) -> None:
    """Replace the symbols document."""
    db.set_document(SYMBOLS_DOC, symbols)


def get_prices(symbol: str) -> DailyPrices:
    """Return the stored date-keyed price history for a symbol."""
    return db.get_document(f"{PRICES_DOC_PREFIX}/{symbol}") or {}


def set_prices(symbol: str, prices: DailyPrices) -> None:
    """Store the date-keyed price history for a symbol."""
    db.set_document(f"{PRICES_DOC_PREFIX}/{symbol}", prices)


def pull_price_history(
    symbol: str,
    *,
    full: bool = False,
    provider: PriceProvider | None = None,
    symbols: dict[str, SymbolMetadata] | None = None,
) -> int:
    """Pull daily history for one symbol; return the number of new days stored.

    Incremental by default: only dates after the newest stored row are
    fetched. Use full=True to re-download everything — worth doing
    occasionally, since auto-adjusted historical prices shift after
    splits and dividends.
    """
    provider = provider or YahooProvider()
    if symbols is None:
        symbols = get_symbols()
    today = date.today().isoformat()
    metadata = symbols.setdefault(symbol, new_symbol_metadata())
    if not full and metadata["last_updated"] == today:
        logger.info("%s already updated today, skipping", symbol)
        return 0
    stored = {} if full else get_prices(symbol)
    start = None
    if stored:
        start = date.fromisoformat(max(stored)) + timedelta(days=1)
    fetched = provider.daily_history(symbol, start=start)
    new_days = len(fetched.keys() - stored.keys())
    if fetched:
        set_prices(symbol, dict(sorted((stored | fetched).items())))
    metadata["last_updated"] = today
    set_symbols(symbols)
    logger.info("%s: %d new days", symbol, new_days)
    return new_days


def pull_all_price_histories(*, full: bool = False) -> None:
    """Pull daily history for every known symbol, continuing past failures."""
    symbols = get_symbols()
    provider = YahooProvider()
    for i, symbol in enumerate(sorted(symbols), start=1):
        logger.info("%d/%d %s", i, len(symbols), symbol)
        try:
            pull_price_history(symbol, full=full, provider=provider, symbols=symbols)
        except Exception:
            logger.exception("failed to pull history for %s", symbol)
