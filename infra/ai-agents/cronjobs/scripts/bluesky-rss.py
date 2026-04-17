#!/usr/bin/env python3
"""Poll RSS feed and post new entries to Bluesky.

Dedup via GUID file on persistent storage. Adds UTM params for GA4.
Uses AT Protocol XRPC API directly (no SDK) so the runtime image
doesn't need a new pinned dependency.

Auth: Bluesky App Password (Settings > Privacy and Security > App
Passwords). Do NOT use the account password.
"""
import datetime as dt
import os
import sys
from html.parser import HTMLParser

import requests

from crosspost_common import add_utm, load_posted, parse_feed, save_posted

# --- Config ---
RSS_URL = os.environ.get("RSS_URL", "https://kyle.pericak.com/feed.xml")
STATE_FILE = os.environ.get("STATE_FILE", "/cache/posted-guids")
PDS_URL = os.environ.get("BLUESKY_PDS_URL", "https://bsky.social")
DRY_RUN = "--dry-run" in sys.argv

UTM_PARAMS = {
    "utm_source": "bluesky",
    "utm_medium": "social",
    "utm_campaign": "blog_post",
}

# Bluesky post character limit is 300 graphemes. Using a slightly
# conservative byte-ish budget since we're not grapheme-counting.
POST_CHAR_LIMIT = 300


def login(handle, app_password):
    """Exchange handle + app password for accessJwt + did."""
    resp = requests.post(
        f"{PDS_URL}/xrpc/com.atproto.server.createSession",
        json={"identifier": handle, "password": app_password},
        timeout=15,
    )
    resp.raise_for_status()
    data = resp.json()
    return {"access_jwt": data["accessJwt"], "did": data["did"]}


def ensure_bot_label(session):
    """Idempotent: make sure the account profile carries the `bot` self-label.

    Runs on every invocation; if the label is already present it's a no-op
    (one GET, no writes). If the profile doesn't exist yet (404), creates a
    minimal profile with just the label.
    """
    auth = {"Authorization": f"Bearer {session['access_jwt']}"}
    params = {
        "repo": session["did"],
        "collection": "app.bsky.actor.profile",
        "rkey": "self",
    }
    r = requests.get(
        f"{PDS_URL}/xrpc/com.atproto.repo.getRecord",
        params=params,
        headers=auth,
        timeout=15,
    )
    if r.status_code == 404:
        record = {}
        existing_cid = None
    elif r.status_code == 200:
        data = r.json()
        record = dict(data.get("value") or {})
        existing_cid = data.get("cid")
    else:
        print(f"  Profile fetch failed: {r.status_code} {r.text}", file=sys.stderr)
        return False

    labels = record.get("labels") or {}
    values = list(labels.get("values") or []) if isinstance(labels, dict) else []
    if any(isinstance(v, dict) and v.get("val") == "bot" for v in values):
        return True

    values.append({"val": "bot"})
    record["$type"] = "app.bsky.actor.profile"
    record["labels"] = {
        "$type": "com.atproto.label.defs#selfLabels",
        "values": values,
    }

    body = {
        "repo": session["did"],
        "collection": "app.bsky.actor.profile",
        "rkey": "self",
        "record": record,
    }
    if existing_cid:
        body["swapRecord"] = existing_cid

    r = requests.post(
        f"{PDS_URL}/xrpc/com.atproto.repo.putRecord",
        headers=auth,
        json=body,
        timeout=15,
    )
    if r.status_code == 200:
        print("  Set `bot` self-label on profile")
        return True
    print(f"  putRecord (self-label) failed: {r.status_code} {r.text}", file=sys.stderr)
    return False


def fetch_og_image_url(page_url):
    """Return the og:image URL from a page, or None on any failure."""
    class _Parser(HTMLParser):
        def __init__(self):
            super().__init__()
            self.og_image = None
        def handle_starttag(self, tag, attrs):
            if tag != "meta" or self.og_image:
                return
            d = dict(attrs)
            if d.get("property") == "og:image":
                self.og_image = d.get("content")
    try:
        resp = requests.get(page_url, timeout=10)
        resp.raise_for_status()
        p = _Parser()
        p.feed(resp.text)
        return p.og_image
    except Exception:
        return None


def upload_thumb(session, image_url):
    """Download image_url and upload it as a Bluesky blob. Returns blob dict or None."""
    try:
        img = requests.get(image_url, timeout=15)
        img.raise_for_status()
        mime = img.headers.get("Content-Type", "image/jpeg").split(";")[0].strip()
        resp = requests.post(
            f"{PDS_URL}/xrpc/com.atproto.repo.uploadBlob",
            headers={"Authorization": f"Bearer {session['access_jwt']}", "Content-Type": mime},
            data=img.content,
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json().get("blob")
    except Exception as e:
        print(f"  Thumbnail upload failed: {e}", file=sys.stderr)
        return None


def format_post_text(item):
    """Title only — description lives in the embed card."""
    text = item["title"]
    if len(text) > POST_CHAR_LIMIT:
        text = text[: POST_CHAR_LIMIT - 1] + "\u2026"
    return text


def build_record(item, text, session):
    """Construct an app.bsky.feed.post record with an external-link embed."""
    link = add_utm(item["link"], UTM_PARAMS)
    external = {
        "uri": link,
        "title": item["title"],
        "description": item["description"] or item["title"],
    }
    og_url = fetch_og_image_url(item["link"])
    if og_url and session:
        blob = upload_thumb(session, og_url)
        if blob:
            external["thumb"] = blob
    return {
        "$type": "app.bsky.feed.post",
        "text": text,
        "createdAt": dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00", "Z"),
        "embed": {
            "$type": "app.bsky.embed.external",
            "external": external,
        },
    }


def post_to_bluesky(session, record):
    resp = requests.post(
        f"{PDS_URL}/xrpc/com.atproto.repo.createRecord",
        headers={"Authorization": f"Bearer {session['access_jwt']}"},
        json={
            "repo": session["did"],
            "collection": "app.bsky.feed.post",
            "record": record,
        },
        timeout=15,
    )
    if resp.status_code == 200:
        data = resp.json()
        print(f"  Posted {data.get('uri', '(no uri)')}")
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

    session = None
    if not DRY_RUN:
        handle = os.environ["BLUESKY_HANDLE"]
        app_password = os.environ["BLUESKY_APP_PASS"]
        session = login(handle, app_password)
        ensure_bot_label(session)

    for item in new_items:
        text = format_post_text(item)
        record = build_record(item, text, session)
        print(f"\n--- {item['title']} ---")
        print(text)
        print(f"  [embed] {record['embed']['external']['uri']}")

        if DRY_RUN:
            print("  [dry run — not posting]")
            posted.add(item["guid"])
        else:
            if post_to_bluesky(session, record):
                posted.add(item["guid"])

    save_posted(STATE_FILE, posted)
    print(f"\nDone. {len(posted)} total posts tracked.")


if __name__ == "__main__":
    main()
