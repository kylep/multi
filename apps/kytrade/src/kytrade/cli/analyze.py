"""Analysis commands. Argument names and defaults mirror the API routes."""

from typing import Annotated

import typer
from rich.console import Console
from rich.table import Table

from kytrade import analysis
from kytrade.models import ComparisonEntry

app = typer.Typer(no_args_is_help=True)
console = Console()

JsonFlag = Annotated[bool, typer.Option("--json", help="Emit JSON")]


def _fail(err: Exception) -> None:
    console.print(f"[red]{err}[/red]")
    raise typer.Exit(code=1) from err


def _entries_table(title: str, entries: list[ComparisonEntry]) -> Table:
    table = Table("symbol", "return %", "start close", "end close", title=title)
    for entry in entries:
        table.add_row(
            entry.symbol,
            f"{entry.return_pct:+.2f}",
            f"{entry.start_close:.2f}",
            f"{entry.end_close:.2f}",
        )
    return table


@app.callback()
def main() -> None:
    """Analyze stored price history."""


@app.command()
def performance(
    symbol: Annotated[str, typer.Argument(help="Ticker to analyze")],
    days: Annotated[int, typer.Option(min=1, help="Window in calendar days")] = 90,
    as_json: JsonFlag = False,
) -> None:
    """Window performance for one symbol."""
    try:
        report = analysis.performance(symbol, days=days)
    except analysis.NotEnoughData as err:
        _fail(err)
    if as_json:
        print(report.model_dump_json(indent=2))
        return
    console.print(
        f"{report.symbol} {report.start_date} → {report.end_date}: "
        f"[bold]{report.return_pct:+.2f}%[/bold] "
        f"(close {report.start_close:.2f} → {report.end_close:.2f}, "
        f"high {report.high:.2f}, low {report.low:.2f}, "
        f"avg volume {report.avg_volume:,})"
    )


@app.command()
def compare(
    symbols: Annotated[list[str], typer.Argument(help="Two or more tickers")],
    days: Annotated[int, typer.Option(min=1, help="Window in calendar days")] = 365,
    as_json: JsonFlag = False,
) -> None:
    """Window returns for several symbols, best first."""
    if len(symbols) < 2:
        _fail(ValueError("provide at least two symbols"))
    try:
        report = analysis.compare(symbols, days=days)
    except analysis.NotEnoughData as err:
        _fail(err)
    if as_json:
        print(report.model_dump_json(indent=2))
        return
    console.print(_entries_table(f"last {report.days} days", report.entries))


@app.command()
def movers(
    days: Annotated[int, typer.Option(min=1, help="Window in calendar days")] = 30,
    top: Annotated[int, typer.Option(min=1, help="How many each way")] = 10,
    as_json: JsonFlag = False,
) -> None:
    """Best and worst returns across the stored universe."""
    report = analysis.movers(days=days, top=top)
    if as_json:
        print(report.model_dump_json(indent=2))
        return
    console.print(_entries_table(f"gainers, last {report.days} days", report.gainers))
    console.print(_entries_table(f"losers, last {report.days} days", report.losers))
    console.print(f"universe: {report.universe} symbols")


@app.command()
def sectors(
    days: Annotated[int, typer.Option(min=1, help="Window in calendar days")] = 90,
    as_json: JsonFlag = False,
) -> None:
    """Average member return per sector, best first."""
    report = analysis.sector_performance(days=days)
    if as_json:
        print(report.model_dump_json(indent=2))
        return
    table = Table("sector", "avg return %", "symbols", title=f"last {report.days} days")
    for sector in report.sectors:
        table.add_row(sector.sector, f"{sector.return_pct:+.2f}", str(sector.symbols))
    console.print(table)


@app.command()
def near_extreme(
    kind: Annotated[str, typer.Option(help="'high' or 'low'")] = "high",
    threshold_pct: Annotated[float, typer.Option(min=0.0, help="Max distance %")] = 5.0,
    lookback_days: Annotated[int, typer.Option(min=1, help="Lookback window")] = 365,
    as_json: JsonFlag = False,
) -> None:
    """Symbols trading within threshold of their lookback high or low."""
    try:
        report = analysis.near_extreme(
            kind=kind, threshold_pct=threshold_pct, lookback_days=lookback_days
        )
    except ValueError as err:
        _fail(err)
    if as_json:
        print(report.model_dump_json(indent=2))
        return
    table = Table(
        "symbol",
        "close",
        kind,
        "distance %",
        title=f"within {report.threshold_pct}% of {report.lookback_days}-day {kind}",
    )
    for hit in report.hits:
        table.add_row(
            hit.symbol,
            f"{hit.close:.2f}",
            f"{hit.extreme:.2f}",
            f"{hit.distance_pct:.2f}",
        )
    console.print(table)
    console.print(f"universe: {report.universe} symbols")


@app.command()
def volatility(
    symbol: Annotated[str, typer.Argument(help="Ticker to analyze")],
    window_days: Annotated[int, typer.Option(min=2, help="Rolling window size")] = 21,
    as_json: JsonFlag = False,
) -> None:
    """Daily-return volatility and the worst rolling window."""
    try:
        report = analysis.volatility(symbol, window_days=window_days)
    except analysis.NotEnoughData as err:
        _fail(err)
    if as_json:
        print(report.model_dump_json(indent=2))
        return
    worst = report.worst_window
    console.print(
        f"{report.symbol}: overall daily stddev "
        f"[bold]{report.overall_daily_stddev_pct:.2f}%[/bold]; "
        f"worst {report.window_days}-day window {worst.start_date} → "
        f"{worst.end_date} at {worst.daily_stddev_pct:.2f}%"
    )
