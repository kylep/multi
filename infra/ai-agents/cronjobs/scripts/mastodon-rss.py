#!/usr/bin/env python3
"""Poll RSS feed and post new entries to Mastodon.

Dedup via GUID file on persistent storage. Adds UTM params for GA4.
Uses Mastodon's v1 statuses API directly; a single Bearer token is
all the auth needed (no OAuth flow since the token represents the
bot account itself).

Auth: Mastodon access token. Create an app at
`{instance}/settings/applications` with scope `write:statuses`,
copy "Your access token". Do NOT use the account password.

Mastodon renders a link-preview card for any URL it finds in the
status body by fetching the page's OpenGraph tags server-side, so
we don't upload images ourselves — we just need the URL in the
text and correct OG tags on the blog post.
"""
import os
import sys

import requests

from crosspost_common import add_utm, load_posted, parse_feed, save_posted

RSS_URL = os.environ.get("RSS_URL", "https://kyle.pericak.com/feed.xml")
STATE_FILE = os.environ.get("STATE_FILE", "/cache/posted-guids")
INSTANCE_URL = os.environ.get("MASTODON_INSTANCE_URL", "https://mastodon.social").rstrip("/")
DRY_RUN = "--dry-run" in sys.argv

UTM_PARAMS = {
    "utm_source": "mastodon",
    "utm_medium": "social",
    "utm_campaign": "blog_post",
}

# mastodon.social's default character limit. Some instances allow more,
# but staying under 500 is universally safe.
POST_CHAR_LIMIT = 500


def ensure_bot_flag(access_token):
    """Idempotent: set the account's `bot` flag if not already set.

    One GET + (on first run) one PATCH. Mirrors the bot self-label
    behavior from the Bluesky crossposter.
    """
    headers = {"Authorization": f"Bearer {access_token}"}
    r = requests.get(
        f"{INSTANCE_URL}/api/v1/accounts/verify_credentials",
        headers=headers,
        timeout=15,
    )
    if r.status_code != 200:
        print(f"  verify_credentials failed: {r.status_code}", file=sys.stderr)
        return
    if r.json().get("bot"):
        return
    r = requests.patch(
        f"{INSTANCE_URL}/api/v1/accounts/update_credentials",
        headers=headers,
        data={"bot": "true"},
        timeout=15,
    )
    if r.status_code == 200:
        print("  Set `bot` flag on profile")
    else:
        print(f"  bot-flag PATCH failed: {r.status_code} {r.text}", file=sys.stderr)


def format_status_text(item):
    """Title + blank line + UTM-stamped URL. The URL produces the
    link-preview card; Mastodon doesn't double-render the URL text."""
    link = add_utm(item["link"], UTM_PARAMS)
    # Strip @ — a status starting with @handle becomes a mention/reply
    # and gets hidden from followers who don't follow the mentioned user.
    title = item["title"].replace("@", "")

    # Reserve room for "\n\n<url>" — Mastodon counts URLs as 23 chars
    # regardless of actual length, same as Twitter.
    url_budget = 23 + 2
    if len(title) + url_budget > POST_CHAR_LIMIT:
        title = title[: POST_CHAR_LIMIT - url_budget - 1] + "\u2026"

    return f"{title}\n\n{link}"


def post_status(text, access_token):
    resp = requests.post(
        f"{INSTANCE_URL}/api/v1/statuses",
        headers={"Authorization": f"Bearer {access_token}"},
        data={"status": text, "visibility": "public"},
        timeout=15,
    )
    if resp.status_code == 200:
        data = resp.json()
        print(f"  Posted {data.get('url', '(no url)')}")
        return True
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

    access_token = None
    if not DRY_RUN:
        access_token = os.environ["MASTODON_ACCESS_TOKEN"]
        ensure_bot_flag(access_token)

    for item in new_items:
        text = format_status_text(item)
        print(f"\n--- {item['title']} ---")
        print(text)

        if DRY_RUN:
            print("  [dry run — not posting]")
            posted.add(item["guid"])
        else:
            if post_status(text, access_token):
                posted.add(item["guid"])

    save_posted(STATE_FILE, posted)
    print(f"\nDone. {len(posted)} total posts tracked.")


if __name__ == "__main__":
    main()
