"""Stock documents: symbols, indexes, ETFs, sectors, and per-symbol price history."""

import logging
from datetime import date
from typing import Any

from kytrade import db, yahoo

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


def get_prices(symbol: str) -> yahoo.DailyPrices:
    """Return the stored date-keyed price history for a symbol."""
    return db.get_document(f"{PRICES_DOC_PREFIX}/{symbol}") or {}


def set_prices(symbol: str, prices: yahoo.DailyPrices) -> None:
    """Store the date-keyed price history for a symbol."""
    db.set_document(f"{PRICES_DOC_PREFIX}/{symbol}", prices)


def save_price_history(
    symbol: str, symbols: dict[str, SymbolMetadata] | None = None
) -> None:
    """Download and store the full daily history for one symbol."""
    if symbols is None:
        symbols = get_symbols()
    today = date.today().isoformat()
    metadata = symbols.setdefault(symbol, new_symbol_metadata())
    if metadata["last_updated"] == today:
        logger.info("%s already updated today, skipping", symbol)
        return
    set_prices(symbol, yahoo.download_daily_history(symbol))
    metadata["last_updated"] = today
    set_symbols(symbols)


def save_all_price_histories() -> None:
    """Download and store the daily history for every known symbol."""
    symbols = get_symbols()
    for i, symbol in enumerate(sorted(symbols), start=1):
        logger.info("%d/%d %s", i, len(symbols), symbol)
        try:
            save_price_history(symbol, symbols)
        except Exception:
            logger.exception("failed to save history for %s", symbol)
