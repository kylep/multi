"""Stock price commands."""

import json
from typing import Annotated

import typer
from rich.console import Console
from rich.table import Table

from kytrade import stocks, yahoo

app = typer.Typer(no_args_is_help=True)
console = Console()


@app.callback()
def main() -> None:
    """Operate on stock price data."""


@app.command()
def save_history(
    symbol: Annotated[
        str | None, typer.Option("--symbol", "-s", help="Ticker to download")
    ] = None,
    all_symbols: Annotated[
        bool, typer.Option("--all", help="Update every known symbol")
    ] = False,
) -> None:
    """Download and store daily price history."""
    if all_symbols == bool(symbol):
        console.print("[red]Use exactly one of --symbol/-s or --all[/red]")
        raise typer.Exit(code=1)
    if all_symbols:
        stocks.save_all_price_histories()
    else:
        stocks.save_price_history(symbol)


def _cell(value: float | None) -> str:
    if value is None:
        return ""
    if isinstance(value, float):
        return f"{value:.2f}"
    return str(value)


@app.command()
def prices(
    symbol: Annotated[str, typer.Argument(help="Ticker to read")],
    tail: Annotated[int, typer.Option(min=0, help="Only the most recent N days")] = 0,
    as_json: Annotated[bool, typer.Option("--json", help="Emit JSON")] = False,
) -> None:
    """Print the stored daily prices for a symbol."""
    history = dict(sorted(stocks.get_prices(symbol).items()))
    if tail:
        history = dict(list(history.items())[-tail:])
    if as_json:
        print(json.dumps(history, indent=2))
        return
    table = Table(
        "date", "open", "high", "low", "close", "volume", title=symbol.upper()
    )
    for day, row in history.items():
        table.add_row(
            day, *(_cell(row.get(field)) for field in yahoo.PRICE_FIELDS.values())
        )
    console.print(table)
