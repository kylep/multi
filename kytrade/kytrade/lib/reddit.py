"""Reddit API"""
import os
from datetime import datetime

import praw
from praw.models import Subreddit, Submission


# Only want one client, don't want to define it at import time
_CLIENT = None


def client() -> praw.reddit.Reddit:
    """Get the praw client"""
    global _CLIENT
    if not _CLIENT:
        AGENT = userAgent = "kytrade/0.1 by kepper"
        APP_ID = os.environ["REDDIT_APP_ID"]
        APP_SECRET = os.environ["REDDIT_APP_SECRET"]
        _CLIENT = praw.Reddit(
            client_id=APP_ID, client_secret=APP_SECRET, user_agent=AGENT
        )
    return _CLIENT


def get_posts(subreddit: str) -> Subreddit:
    """Get up to 250 of the top posts from a given subreddit over the last day"""
    return client().subreddit(subreddit).top(time_filter="day", limit=250)


def get_post(post_id: str) -> Submission:
    """Return a Submission object by post ID"""
    if "t3_" in post_id:
        post_id = post_id.replace("t3_", "")
    return client().submission(post_id)


def get_comments(post: Submission) -> list:
    """Get the comments of a given post"""
    post.comments.replace_more(limit=0)
    return post.comments.list()
