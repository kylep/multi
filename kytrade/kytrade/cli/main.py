"""Typer entrypoint"""
from typing import Optional

import typer
from rich import print

import kytrade.const as const
from kytrade.cli.stock import app as stock
from kytrade.cli.slack import app as slack
from kytrade.cli.reddit import app as reddit
from kytrade.cli.db import app as db
from kytrade.cli.etl import app as etl


app = typer.Typer(no_args_is_help=True)


@app.callback()
def app_callback(debug: bool = typer.Option(False, "--debug", "-d", envvar="KT_DEBUG")):
    """Kytrade CLI"""
    # Using --debug will override the env var even if it's set to false
    if debug:
        const.debug = True
        print("~DEBUG MODE~")


@app.command()
def version() -> None:
    """Print the current kytrade package version"""
    print(kytrade.__version__)


app.add_typer(stock, name="stock")
app.add_typer(slack)
app.add_typer(reddit)
app.add_typer(db)
app.add_typer(etl)



def entrypoint() -> None:
    """Runs app()"""
    app()


# Allows running Typer by executing main.py without poetry's scripts `kt` command
if __name__ == "__main__":
    entrypoint()
