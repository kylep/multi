"""Market-data commands."""

import json
from pathlib import Path
from typing import Annotated

import typer
from rich.console import Console
from rich.table import Table

from kytrade import sp500, stocks
from kytrade.providers import yahoo

app = typer.Typer(no_args_is_help=True)
console = Console()


@app.callback()
def main() -> None:
    """Pull and read market data."""


@app.command()
def pull(
    symbol: Annotated[
        str | None, typer.Option("--symbol", "-s", help="Ticker to pull")
    ] = None,
    all_symbols: Annotated[
        bool, typer.Option("--all", help="Pull every known symbol")
    ] = False,
    full: Annotated[
        bool, typer.Option("--full", help="Re-download all history, not just new days")
    ] = False,
) -> None:
    """Pull daily price history (incremental by default)."""
    if all_symbols == bool(symbol):
        console.print("[red]Use exactly one of --symbol/-s or --all[/red]")
        raise typer.Exit(code=1)
    if all_symbols:
        stocks.pull_all_price_histories(full=full)
    else:
        new_days = stocks.pull_price_history(symbol, full=full)
        console.print(f"{symbol}: [green]{new_days} new days[/green]")


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


@app.command()
def load_sp500(
    file: Annotated[
        Path | None,
        typer.Option(
            exists=True, help="Offline SPY holdings .xlsx instead of Wikipedia"
        ),
    ] = None,
) -> None:
    """Load current S&P 500 membership (Wikipedia by default)."""
    if file:
        members = sp500.load_membership_from_excel(file)
    else:
        members = sp500.fetch_membership()
    diff = sp500.apply_membership(members)
    console.print(f"[green]loaded {diff.total} symbols[/green]")
    if diff.added or diff.removed:
        console.print(f"joined: {diff.added} left: {diff.removed}")


@app.command()
def backfill_sp500(
    full: Annotated[
        bool, typer.Option("--full", help="Re-download all history, not just new days")
    ] = False,
) -> None:
    """Load current S&P 500 membership, then pull history for every symbol."""
    diff = sp500.apply_membership(sp500.fetch_membership())
    console.print(f"[green]loaded {diff.total} symbols, pulling histories...[/green]")
    stocks.pull_all_price_histories(full=full)
