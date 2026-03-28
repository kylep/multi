#!/usr/bin/env python3
"""Poll RSS feed and tweet new posts to X/Twitter.

Dedup via GUID file on persistent storage. Adds UTM params for GA4.
Uses OAuth 1.0a for X API v2.
"""
import os
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import urlencode, urlparse, urlunparse, parse_qs

import requests
from requests_oauthlib import OAuth1

# --- Config ---
RSS_URL = os.environ.get("RSS_URL", "https://kyle.pericak.com/feed.xml")
STATE_FILE = Path(os.environ.get("STATE_FILE", "/cache/posted-guids"))
DRY_RUN = "--dry-run" in sys.argv

UTM_PARAMS = {
    "utm_source": "twitter",
    "utm_medium": "social",
    "utm_campaign": "blog_post",
}

# Category → hashtags mapping
HASHTAGS = {
    "ai": ["#AI", "#LLM"],
    "dev": ["#Dev", "#SoftwareEngineering"],
    "cloud": ["#Cloud", "#DevOps"],
    "development": ["#Dev", "#Coding"],
    "systems administration": ["#SysAdmin", "#DevOps"],
}
DEFAULT_HASHTAGS = ["#Blog"]

TWEET_API = "https://api.x.com/2/tweets"


def get_oauth():
    return OAuth1(
        os.environ["TWITTER_API_KEY"],
        os.environ["TWITTER_API_KEY_SECRET"],
        os.environ["TWITTER_ACCESS_TOKEN"],
        os.environ["TWITTER_ACCESS_TOKEN_SECRET"],
    )


def add_utm(url):
    parsed = urlparse(url)
    params = parse_qs(parsed.query)
    params.update(UTM_PARAMS)
    new_query = urlencode(params, doseq=True)
    return urlunparse(parsed._replace(query=new_query))


def load_posted():
    if STATE_FILE.exists():
        return set(STATE_FILE.read_text().strip().splitlines())
    return set()


def save_posted(guids):
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text("\n".join(sorted(guids)) + "\n")


def parse_feed(url):
    resp = requests.get(url, timeout=15)
    resp.raise_for_status()
    root = ET.fromstring(resp.text)
    items = []
    for item in root.findall(".//item"):
        guid = item.findtext("guid", "").strip()
        title = item.findtext("title", "").strip()
        link = item.findtext("link", "").strip()
        desc = item.findtext("description", "").strip()
        category = item.findtext("category", "").strip().lower()
        if guid and title and link:
            items.append({
                "guid": guid,
                "title": title,
                "link": link,
                "description": desc,
                "category": category,
            })
    return items


def format_tweet(item):
    title = item["title"]
    desc = item["description"]
    link = add_utm(item["link"])
    category = item["category"]

    tags = HASHTAGS.get(category, DEFAULT_HASHTAGS)
    hashtag_str = " ".join(tags)

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
    posted = load_posted()
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

    save_posted(posted)
    print(f"\nDone. {len(posted)} total posts tracked.")


if __name__ == "__main__":
    main()
