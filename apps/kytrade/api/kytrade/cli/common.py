"""Common CLI functions"""
import sys

import pandas as pd


COLOURS = {
    "HEADER": "\033[95m",
    "BLUE": "\033[94m",
    "CYAN": "\033[96m",
    "GREEN": "\033[92m",
    "YELLOW": "\033[93m",
    "RED": "\033[91m",
    "WHITE": "\033[0m",
    "BOLD": "\033[1m",
    "UNDERLINE": "\033[4m",
}


def red(text: str) -> str:
    """Turn text red"""
    return f"{COLOURS['RED']}{text}{COLOURS['WHITE']}"


def error(msg: str, fatal=False, newline=True, colour=True):
    """Print an error message"""
    text = red(msg) if colour else msg
    text = f"{text}\n" if newline else text
    sys.stderr.write(text)
    if fatal:
        sys.exit(1)


def set_pandas_display_options(cols=1000, rows=1000, colwidth=30, width=300) -> None:
    """Set pandas display options."""
    # Ref: https://stackoverflow.com/a/52432757/
    display = pd.options.display
    display.max_columns = cols
    display.max_rows = rows
    display.max_colwidth = colwidth
    display.width = width
    # display.precision is also an option for decimal points
