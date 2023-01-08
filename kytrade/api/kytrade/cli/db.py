"""Database commands"""
import json

import typer
from rich import print

import kytrade.lib.db.common as db_common
from kytrade.cli.common import error


app = typer.Typer(no_args_is_help=True)


@app.callback()
def db() -> None:
    """Database commands"""


@app.command()
def init() -> None:
    """Initialize a fresh database"""
    db_common.init_create_tables()


@app.command()
def documents():
    """Operator on Documents table"""


@app.command("list")
def _list():
    """List saved document keys"""
    for key in db_common.get_all_documents().keys():
        print(key)


@app.command("get")
def _get(key: str):
    """Get the value of a document with a given key"""
    print(json.dumps(db_common.get_document(key)))


@app.command("set")
def _set(key: str, path: str) -> None:
    """Set a document's value"""
    try:
        with open(path, "r") as file:
            data_string = file.read().strip()
            data = json.loads(data_string)
    except json.decoder.JSONDecodeError:
        error(f"Error - Invalid JSON: {data_string}", fatal=True)
    except FileNotFoundError:
        error(f"Error - Invalid file path: {path}", fatal=True)
    db_common.set_document(key, data)
    print(json.dumps(db_common.get_document(key)))


@app.command()
def load_market_data():
    """Load the metadata about stocks, not price history"""
