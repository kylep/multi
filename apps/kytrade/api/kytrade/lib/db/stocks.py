"""Stocks data - I don't really like any of this, db cleanup later
In the meantime it's suitably abstracted
"""
from kytrade.lib.db.common import get_document, set_document
from kytrade.lib.common import debug

STOCK_INDEXES = "stock/indexes"
STOCK_SYMBOLS = "stock/symbols"
STOCK_ETFS = "stock/etfs"
STOCK_SECTORS = "stock/sectors"
STOCK_PRICES = "stock/prices"


def get_indexes() -> list:
    """Get the indexes"""
    debug(f"DB:R {STOCK_INDEXES}")
    return get_document(STOCK_INDEXES)


def add_index(name: str) -> None:
    """Add an index to the list, noop if already exists"""
    indexes = set(get_indexes())
    indexes.add(name)
    debug(f"DB:W {STOCK_INDEXES}")
    set_document(STOCK_INDEXES, list(indexes))


def get_symbols() -> dict:
    """Get the symbols and their metadata"""
    debug(f"DB:R {STOCK_SYMBOLS}")
    return get_document(STOCK_SYMBOLS)


def _add_unique_to_list_document(doc_name: str, new_values: list) -> None:
    """Add the unique elements of new_values to the list document"""
    current_values = set(get_document(doc_name))
    current_values |= set(new_values)
    debug(f"DB:W {doc_name}")
    set_document(doc_name, list(new_values))


def set_symbols(symbols: dict) -> None:
    """Add symbols to the list, remove dupes"""
    debug(f"DB:W {STOCK_SYMBOLS}")
    set_document(STOCK_SYMBOLS, symbols)


def get_etfs() -> list:
    debug(f"DB:R {STOCK_ETFS}")
    return get_document(STOCK_ETFS)


def add_etfs(etfs: list) -> None:
    """Add ETFs to the list, remove dupes"""
    _add_unique_to_list_document(STOCK_ETFS, etfs)


def get_sectorss() -> list:
    """Get the list of unique sectors"""
    debug(f"DB:R {STOCK_SECTORS}")
    return get_document(STOCK_SECTORS)


def add_sectors(sectors: list) -> None:
    """Add sectors to the list, remove dupes"""
    _add_unique_to_list_document(STOCK_SECTORS, sectors)


def get_prices(symbol: str) -> dict:
    """Return a date-keyed dict of prices for a given stock"""
    document = f"{STOCK_PRICES}/{symbol}"
    debug(f"DB:R {document}")
    return get_document(document)


def set_prices(symbol: str, prices: dict) -> None:
    """Set the date-keyed dict of prices for a given stock"""
    document = f"{STOCK_PRICES}/{symbol}"
    debug(f"DB:W {document}")
    return set_document(document, prices)
