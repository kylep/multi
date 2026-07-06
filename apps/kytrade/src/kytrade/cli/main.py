"""Kytrade CLI entrypoint."""

import logging
from typing import Annotated

import typer
from rich.console import Console

import kytrade
from kytrade import ops
from kytrade.cli import analyze, data, db

app = typer.Typer(no_args_is_help=True)
app.add_typer(data.app, name="data")
app.add_typer(analyze.app, name="analyze")
app.add_typer(db.app, name="db")
console = Console()

JsonFlag = Annotated[bool, typer.Option("--json", help="Emit JSON")]


@app.callback()
def main(
    debug: Annotated[
        bool,
        typer.Option("--debug", "-d", envvar="KT_DEBUG", help="Enable debug logging"),
    ] = False,
) -> None:
    """Kytrade: personal trading toolkit."""
    level = logging.DEBUG if debug else logging.INFO
    logging.basicConfig(level=level, format="%(levelname)s %(name)s: %(message)s")


@app.command()
def version() -> None:
    """Print the installed kytrade version."""
    print(kytrade.__version__)


@app.command()
def status(as_json: JsonFlag = False) -> None:
    """Toolkit health: database, tables, and data staleness."""
    report = ops.status()
    if as_json:
        print(report.model_dump_json(indent=2))
        return
    if not report.db_ok:
        console.print(
            "[red]database unreachable[/red] — is it up? docker compose up -d postgres"
        )
        raise typer.Exit(code=1)
    if not report.tables_ok:
        console.print("[yellow]no tables[/yellow] — run: kt bootstrap")
        raise typer.Exit(code=1)
    stale = report.staleness
    console.print(
        f"db [green]ok[/green], {report.documents} documents, "
        f"{report.symbols} symbols ({report.priced_symbols} with prices)\n"
        f"freshness: {stale.today} today, {stale.week} this week, "
        f"{stale.older} older, {stale.never} never pulled"
    )


@app.command()
def refresh(
    full: Annotated[
        bool, typer.Option("--full", help="Re-download all history, not just new days")
    ] = False,
    as_json: JsonFlag = False,
) -> None:
    """Pull every known symbol that isn't already fresh today."""
    report = ops.refresh(full=full)
    if as_json:
        print(report.model_dump_json(indent=2))
        return
    console.print(
        f"pulled {report.pulled}, skipped {report.skipped} (fresh), "
        f"{report.new_days} new days"
    )
    if report.failed:
        console.print(f"[red]failed: {', '.join(report.failed)}[/red]")


@app.command()
def bootstrap(as_json: JsonFlag = False) -> None:
    """Prepare the toolkit: secrets, tables, and S&P 500 membership."""
    report = ops.bootstrap()
    if as_json:
        print(report.model_dump_json(indent=2))
        return
    if report.password_generated:
        console.print(f"generated a database password in {report.env_file}")
    if not report.db_ok:
        console.print(
            "[red]database unreachable[/red] — start it with "
            "docker compose up -d postgres, then rerun kt bootstrap"
        )
        raise typer.Exit(code=1)
    console.print(
        f"[green]ready[/green] — tables created, {report.symbols_loaded} symbols loaded"
    )
