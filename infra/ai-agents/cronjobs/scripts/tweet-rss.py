#!/usr/bin/env python3
"""Poll RSS feed and tweet new posts to X/Twitter.

Dedup via GUID file on persistent storage. Adds UTM params for GA4.
Uses OAuth 1.0a for X API v2.
"""
import os
import sys

import requests
from requests_oauthlib import OAuth1

from crosspost_common import add_utm, load_posted, parse_feed, save_posted

# --- Config ---
RSS_URL = os.environ.get("RSS_URL", "https://kyle.pericak.com/feed.xml")
STATE_FILE = os.environ.get("STATE_FILE", "/cache/posted-guids")
DRY_RUN = "--dry-run" in sys.argv

UTM_PARAMS = {
    "utm_source": "twitter",
    "utm_medium": "social",
    "utm_campaign": "blog_post",
}

# Max hashtags per tweet
MAX_HASHTAGS = 4

TWEET_API = "https://api.x.com/2/tweets"


def get_oauth():
    return OAuth1(
        os.environ["TWITTER_API_KEY"],
        os.environ["TWITTER_API_KEY_SECRET"],
        os.environ["TWITTER_ACCESS_TOKEN"],
        os.environ["TWITTER_ACCESS_TOKEN_SECRET"],
    )


def format_tweet(item):
    title = item["title"]
    # Strip @ from titles — tweets starting with @ are hidden as replies
    title = title.replace("@", "")
    desc = item["description"]
    link = add_utm(item["link"], UTM_PARAMS)

    # Use post tags as hashtags (skip generic category like "dev", "cloud")
    skip = {"dev", "cloud", "development", "systems administration", "reference pages"}
    tags = [f"#{t.replace('-', '').replace(' ', '')}" for t in item["tags"] if t.lower() not in skip]
    hashtag_str = " ".join(tags[:MAX_HASHTAGS])

    # Build tweet: title + description + hashtags + link
    # X limit is 280 chars. URLs count as 23 chars (t.co wrapping).
    parts = [title]
    if desc:
        # Trim description to fit. Reserve space for hashtags + link.
        # 23 chars for t.co link + hashtags + newlines + title
        overhead = len(title) + len(hashtag_str) + 23 + 10  # newlines/spacing
        max_desc = 280 - overhead
        if max_desc > 30:
            if len(desc) > max_desc:
                desc = desc[: max_desc - 1] + "\u2026"
            parts.append(desc)
    if hashtag_str:
        parts.append(hashtag_str)
    parts.append(link)
    return "\n\n".join(parts)


def post_tweet(text, auth):
    resp = requests.post(
        TWEET_API,
        json={"text": text},
        auth=auth,
        timeout=15,
    )
    if resp.status_code == 201:
        tweet_id = resp.json()["data"]["id"]
        print(f"  Posted tweet {tweet_id}")
        return True
    else:
        print(f"  Failed: {resp.status_code} {resp.text}", file=sys.stderr)
        return False


def main():
    posted = load_posted(STATE_FILE)
    items = parse_feed(RSS_URL)
    new_items = [i for i in items if i["guid"] not in posted]

    if not new_items:
        print("No new posts.")
        return

    print(f"Found {len(new_items)} new post(s)")

    auth = None if DRY_RUN else get_oauth()

    for item in new_items:
        tweet = format_tweet(item)
        print(f"\n--- {item['title']} ---")
        print(tweet)

        if DRY_RUN:
            print("  [dry run — not posting]")
            posted.add(item["guid"])
        else:
            if post_tweet(tweet, auth):
                posted.add(item["guid"])

    save_posted(STATE_FILE, posted)
    print(f"\nDone. {len(posted)} total posts tracked.")


if __name__ == "__main__":
    main()
