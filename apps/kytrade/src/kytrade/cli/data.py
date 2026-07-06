"""Market-data commands."""

import json
from pathlib import Path
from typing import Annotated

import typer
from rich.console import Console
from rich.table import Table

from kytrade import indexes, stocks
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


def _specs_for(index: str) -> list[indexes.IndexSpec]:
    if index == "all":
        return list(indexes.INDEXES.values())
    if index not in indexes.INDEXES:
        console.print(
            f"[red]unknown index {index!r}; use {'|'.join(indexes.INDEXES)}|all[/red]"
        )
        raise typer.Exit(code=1)
    return [indexes.INDEXES[index]]


@app.command()
def load_index(
    index: Annotated[str, typer.Argument(help="sp500, tsx60, or all")] = "all",
    file: Annotated[
        Path | None,
        typer.Option(
            exists=True,
            help="Offline SPY holdings .xlsx (sp500 only) instead of Wikipedia",
        ),
    ] = None,
    as_json: Annotated[bool, typer.Option("--json", help="Emit JSON")] = False,
) -> None:
    """Load current index membership (Wikipedia by default)."""
    specs = _specs_for(index)
    if file and specs != [indexes.SP500]:
        console.print("[red]--file only applies to the sp500 index[/red]")
        raise typer.Exit(code=1)
    if file:
        members = indexes.load_membership_from_excel(file)
        diffs = [indexes.apply_membership(indexes.SP500, members)]
    else:
        try:
            diffs = indexes.load_and_apply(specs)
        except Exception as err:
            console.print(f"[red]membership fetch failed: {err}[/red]")
            raise typer.Exit(code=1) from err
    if as_json:
        print(json.dumps([diff.model_dump() for diff in diffs], indent=2))
        return
    for diff in diffs:
        console.print(f"[green]{diff.index}: loaded {diff.total} symbols[/green]")
        if diff.added or diff.removed:
            console.print(f"joined: {diff.added} left: {diff.removed}")


@app.command()
def track_etf(
    ticker: Annotated[str, typer.Argument(help="Yahoo-style ticker, e.g. XIU.TO")],
    currency: Annotated[str | None, typer.Option(help="Currency, e.g. CAD")] = None,
) -> None:
    """Track an ETF's prices like any symbol (SPY, QQQ, XIU.TO by default)."""
    created = indexes.track_etf(ticker, currency)
    verb = "now tracking" if created else "already tracking"
    console.print(f"[green]{verb} {ticker.upper()}[/green]")


@app.command()
def symbols(
    as_json: Annotated[bool, typer.Option("--json", help="Emit JSON")] = False,
) -> None:
    """Every known symbol and its metadata."""
    known = stocks.get_symbols()
    if as_json:
        print(json.dumps(known, indent=2))
        return
    table = Table("symbol", "sectors", "currency", "last updated")
    for ticker, metadata in sorted(known.items()):
        table.add_row(
            ticker,
            ", ".join(metadata["sectors"]),
            metadata["currency"] or "",
            metadata["last_updated"] or "never",
        )
    console.print(table)


@app.command("membership-log")
def membership_log(
    as_json: Annotated[bool, typer.Option("--json", help="Emit JSON")] = False,
) -> None:
    """Dated membership changes recorded by past loads."""
    entries = indexes.membership_log()
    if as_json:
        print(json.dumps([entry.model_dump() for entry in entries], indent=2))
        return
    for entry in entries:
        console.print(
            f"{entry.date} {entry.index}: joined {entry.added or '[]'} "
            f"left {entry.removed or '[]'}"
        )
    if not entries:
        console.print("no membership changes recorded")


@app.command()
def backfill(
    index: Annotated[str, typer.Argument(help="sp500, tsx60, or all")] = "all",
    full: Annotated[
        bool, typer.Option("--full", help="Re-download all history, not just new days")
    ] = False,
) -> None:
    """Load index membership and house ETFs, then pull history for every symbol."""
    try:
        diffs = indexes.load_and_apply(_specs_for(index))
    except Exception as err:
        console.print(f"[red]membership fetch failed: {err}[/red]")
        raise typer.Exit(code=1) from err
    for diff in diffs:
        console.print(f"[green]{diff.index}: loaded {diff.total} symbols[/green]")
    indexes.track_default_etfs()
    console.print("pulling histories...")
    stocks.pull_all_price_histories(full=full)
