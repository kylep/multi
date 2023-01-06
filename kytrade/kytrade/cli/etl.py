"""Extract-Transform-Load scripts for kytrade data"""
from os.path import exists

import typer
from rich import print


from kytrade.cli.common import error, set_pandas_display_options
from kytrade.lib.etl import load_from_excel
from kytrade.lib.db.common import get_document, set_document
import kytrade.lib.db.stocks as db_stocks


app = typer.Typer(no_args_is_help=True)


@app.callback()
def etl() -> None:
    """ETL scripts"""


@app.command()
def load_sp500(file_path: str) -> None:
    """Load the S&P 500 data from a file representing a given year's quarter"""
    # check that file_path exists
    if not exists(file_path):
        error(f"file not found: {file_path}", fatal=True)
    # load the excel file
    print(f"Loading S&P 500 File: {file_path}")
    set_pandas_display_options()
    df = load_from_excel(file_path)
    # update the general documents
    db_stocks.add_index("S&P 500")
    db_stocks.add_etfs(["SPY"])
    symbols = {}
    sectors = {}
    for index, row in df.iterrows():
        symbol = {
            "indexes": ["S&P 500"],
            "ETFs": ["SPY"],
            "sectors": [row.get("Sector")],
            "currency": row.get("Local Currency"),
            "last_updated": None
        }
        symbols[row.Ticker] = symbol
        if row.get("Sector") not in sectors:
            sectors[row.get("Sector")] = []
        sectors[row.get("Sector")].append(symbol)
    db_stocks.set_symbols(symbols)
    # find all the sectors and what's in them
    db_stocks.add_sectors(sectors)
