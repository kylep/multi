"""Stock command group"""
import typer

from kytrade.cli.common import error
import kytrade.lib.stock as lib_stock


app = typer.Typer()


@app.callback()
def app_callback() -> None:
    """Operate on stock data"""


@app.command()
def save_history(
    symbol: str = typer.Option("--symbol", "-s", help="which stock?"),
    all_symbols: bool = typer.Option(False, "--all", help="Update all known symbols")
) -> None:
    """Download the history for a given stock"""
    if all_symbols and symbol:
        error("Don't use --all and --symbol/-s at the same time", fatal=True)
    if all_symbols:
        lib_stock.save_price_history_for_all_known_stocks()
    else:
        lib_stock.save_price_history(symbol)
