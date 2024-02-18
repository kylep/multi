"""Common code"""
import kytrade.const as const


def debug(msg: str) -> None:
    """Print a debug message if debug mode is on"""
    # TODO: impl logging
    if const.DEBUG:
        print(msg)
