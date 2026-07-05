"""Bulk data-load commands."""

from pathlib import Path
from typing import Annotated

import typer
from rich.console import Console

from kytrade import etl

app = typer.Typer(no_args_is_help=True)
console = Console()


@app.callback()
def main() -> None:
    """Bulk data loads."""


@app.command()
def load_sp500(
    file_path: Annotated[
        Path, typer.Argument(exists=True, help="S&P 500 holdings .xlsx")
    ],
) -> None:
    """Load S&P 500 membership from a holdings spreadsheet."""
    count = etl.load_sp500(file_path)
    console.print(f"[green]loaded {count} symbols[/green]")
