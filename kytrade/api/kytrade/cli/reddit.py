"""Reddit integration CLI commands"""
from datetime import datetime

import typer
from rich import print

import kytrade
import kytrade.lib.reddit as _reddit
from kytrade.cli.common import error


app = typer.Typer(no_args_is_help=True)


@app.callback()
def reddit() -> None:
    """Reddit integrations"""


@app.command()
def todays_posts(subreddit: str) -> None:
    """Print the posts from last 24 hours"""
    posts = _reddit.get_posts(subreddit)
    for i, post in enumerate(posts):
        post_id = post.name
        author = post.author.name
        title = post.title.replace("\n", " -- ")[:140]
        timestamp = str(datetime.fromtimestamp(post.created))
        print(f"{i} {post_id}\t{timestamp}\t({author}) {title}")


@app.command()
def get_post_comments(post_id: str):
    """Print all the comments in a given post"""
    post = _reddit.get_post(post_id)
    comments = _reddit.get_comments(post)
    for i, comment in enumerate(comments):
        timestamp = str(datetime.fromtimestamp(post.created))
        author = comment.author.name
        body = comment.body.replace("\n", " -- ")[:140]
        print(f"{i} {comment.id}\t{timestamp}\t({author}) {body}")
