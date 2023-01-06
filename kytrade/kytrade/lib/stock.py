"""Stock data controls"""
from datetime import date

import kytrade.lib.db.stocks as db_stocks
from kytrade.lib.yahoo import download_daily_stock_history
from kytrade.lib.common import debug


def save_price_history(symbol: str, symbols=None) -> None:
    """Download the history for a given symbol
    Also update the last_updated field in symbols
    """
    if not symbols:
        symbols = db_stocks.get_symbols()
    debug(f"Saving history for {symbol}")
    today = str(date.today())
    if symbol not in symbols:
		# TODO: Fix duplication in etl script
        symbols[symbol] = {
            "indexes": ["S&P 500"],
            "ETFs": ["SPY"],
            "sectors": [],
            "currency": None,
            "last_updated": today
        }
    if symbols[symbol]['last_updated'] == today:
        return
    symbols[symbol]['last_updated'] = today
    history = download_daily_stock_history(symbol)
    db_stocks.set_prices(symbol, history)
    db_stocks.set_symbols(symbols)


def save_price_history_for_all_known_stocks() -> None:
    """Download the history for each known stock"""
    symbols = db_stocks.get_symbols()
    number_of_symbols = len(symbols.keys())
    for i,symbol in enumerate(symbols.keys()):
        debug(f"{i}/{number_of_symbols}: {symbol}")
        try:
            save_price_history(symbol, symbols)
        except Exception as e:
            # TODO: actually fix the NaN problem causing this
            debug(f"ERROR: Failed to download {symbol}")
            debug("")

