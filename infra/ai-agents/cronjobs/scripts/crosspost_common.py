"""Shared helpers for RSS-driven crosspost scripts (tweet-rss, bluesky-rss, ...).

Each destination (X/Twitter, Bluesky, Mastodon, Dev.to) runs in its own
CronJob with its own PVC for dedup state, so destinations fail
independently.
"""
from pathlib import Path
from urllib.parse import urlencode, urlparse, urlunparse, parse_qs
import xml.etree.ElementTree as ET

import requests


def parse_feed(url, timeout=15):
    """Fetch an RSS feed and return a list of item dicts.

    Each item: {guid, title, link, description, tags}.
    """
    resp = requests.get(url, timeout=timeout)
    resp.raise_for_status()
    root = ET.fromstring(resp.text)
    items = []
    for item in root.findall(".//item"):
        guid = item.findtext("guid", "").strip()
        title = item.findtext("title", "").strip()
        link = item.findtext("link", "").strip()
        desc = item.findtext("description", "").strip()
        tags = [c.text.strip() for c in item.findall("category") if c.text]
        if guid and title and link:
            items.append({
                "guid": guid,
                "title": title,
                "link": link,
                "description": desc,
                "tags": tags,
            })
    return items


def load_posted(state_file):
    path = Path(state_file)
    if path.exists():
        return set(path.read_text().strip().splitlines())
    return set()


def save_posted(state_file, guids):
    path = Path(state_file)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(sorted(guids)) + "\n")


def add_utm(url, utm_params):
    """Append utm_* params to a URL (overwrites any existing keys of same name)."""
    parsed = urlparse(url)
    params = parse_qs(parsed.query)
    params.update(utm_params)
    new_query = urlencode(params, doseq=True)
    return urlunparse(parsed._replace(query=new_query))
