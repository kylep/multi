"""Document-store commands."""

import json
from pathlib import Path
from typing import Annotated

import typer
from rich.console import Console

from kytrade import db as kytrade_db

app = typer.Typer(no_args_is_help=True)
console = Console()


@app.callback()
def main() -> None:
    """Operate on the document store."""


@app.command()
def init() -> None:
    """Create the database tables."""
    kytrade_db.init_tables()
    console.print("[green]tables created[/green]")


@app.command("list")
def list_(
    as_json: Annotated[bool, typer.Option("--json", help="Emit JSON")] = False,
) -> None:
    """List stored document names."""
    names = kytrade_db.list_documents()
    if as_json:
        print(json.dumps(names))
        return
    for name in names:
        print(name)


@app.command()
def get(key: str) -> None:
    """Print a document as JSON."""
    print(json.dumps(kytrade_db.get_document(key)))


@app.command("set")
def set_(key: str, path: Path) -> None:
    """Set a document's value from a JSON file."""
    try:
        data = json.loads(path.read_text())
    except FileNotFoundError:
        console.print(f"[red]file not found: {path}[/red]")
        raise typer.Exit(code=1) from None
    except json.JSONDecodeError as err:
        console.print(f"[red]invalid JSON in {path}: {err}[/red]")
        raise typer.Exit(code=1) from None
    kytrade_db.set_document(key, data)
    print(json.dumps(kytrade_db.get_document(key)))
