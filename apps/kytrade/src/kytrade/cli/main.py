"""Kytrade CLI entrypoint."""

import logging
from typing import Annotated

import typer

import kytrade
from kytrade.cli import data, db

app = typer.Typer(no_args_is_help=True)
app.add_typer(data.app, name="data")
app.add_typer(db.app, name="db")


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
