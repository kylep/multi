"""Slack command group"""
import typer
from rich import print

import kytrade
import kytrade.lib.slackbot as slackbot


app = typer.Typer(no_args_is_help=True)


@app.callback()
def slack() -> None:
    """Operate the slack bot"""


@app.command()
def say(text: str, channel: str = "kytrade") -> None:
    """Print the current kytrade package version"""
    slackbot.send_text_message_to_channel(channel, text)
    print(f"SENT>  kytrade: {text}")
