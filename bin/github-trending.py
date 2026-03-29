#!/usr/bin/env python3
"""Fetch GitHub weekly trending repos, filter, and output formatted list.

Usage:
    python3 bin/github-trending.py [--json] [--min-stars N] [--top N]

Outputs a numbered markdown list by default, or JSON with --json.
Exits 0 on success, 1 on fetch/parse error.
"""

import argparse
import html as html_mod
import json
import re
import sys
import urllib.request


URL = "https://github.com/trending?since=weekly"
USER_AGENT = "Mozilla/5.0 (compatible; newsbot/1.0)"
DEFAULT_MIN_STARS_WEEK = 3000
NON_ENGLISH_MIN_STARS_WEEK = 30000
DEFAULT_TOP = 8


def fetch_html(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    # nosemgrep: python.lang.security.audit.dynamic-urllib-use-detected.dynamic-urllib-use-detected
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", errors="replace")


def is_likely_english(text: str) -> bool:
    """Heuristic: if >30% of non-space chars are outside basic Latin, not English."""
    if not text:
        return True
    non_space = [c for c in text if not c.isspace()]
    if not non_space:
        return True
    non_ascii = sum(1 for c in non_space if ord(c) > 127)
    return (non_ascii / len(non_space)) < 0.3


def parse_trending(html: str) -> list[dict]:
    """Extract repos from GitHub trending page HTML using regex."""
    repos = []

    # Split into article blocks
    articles = re.split(r'<article\s+class="Box-row"', html)
    for article in articles[1:]:  # skip content before first article
        end = article.find("</article>")
        if end != -1:
            article = article[:end]

        # Repo name from h2 > a href
        m = re.search(r'<h2[^>]*>.*?<a\s+href="/([^"]+)"', article, re.DOTALL)
        if not m:
            continue
        raw = m.group(1).strip().rstrip("/")
        # Keep only owner/repo (first two path segments)
        parts = [p.strip() for p in raw.split("/") if p.strip()]
        if len(parts) < 2:
            continue
        name = f"{parts[0]}/{parts[1]}"

        # Description
        desc = ""
        m = re.search(r'<p\s+class="[^"]*color-fg-muted[^"]*"[^>]*>(.*?)</p>', article, re.DOTALL)
        if m:
            desc = html_mod.unescape(re.sub(r'<[^>]+>', '', m.group(1)).strip())

        # Total stars — link to /stargazers
        stars_total = 0
        m = re.search(r'href="/[^"]+/stargazers"[^>]*>\s*([\d,]+)\s*</a>', article, re.DOTALL)
        if not m:
            # Alternative: look for SVG star icon followed by number
            m = re.search(r'class="[^"]*octicon-star[^"]*".*?</svg>\s*([\d,]+)', article, re.DOTALL)
        if m:
            stars_total = int(m.group(1).replace(",", ""))

        # Stars this week
        stars_week = 0
        m = re.search(r'([\d,]+)\s+stars\s+this\s+week', article)
        if m:
            stars_week = int(m.group(1).replace(",", ""))

        repos.append({
            "name": name,
            "description": desc,
            "stars_total": stars_total,
            "stars_week": stars_week,
        })

    return repos


def filter_repos(repos: list[dict], min_stars: int, top: int) -> list[dict]:
    """Apply star and language filters, return top N by stars_week."""
    filtered = []
    for r in repos:
        if r["stars_week"] < min_stars:
            continue
        if not is_likely_english(r["description"]):
            if r["stars_week"] < NON_ENGLISH_MIN_STARS_WEEK:
                continue
        filtered.append(r)

    filtered.sort(key=lambda r: r["stars_week"], reverse=True)
    return filtered[:top]


def format_markdown(repos: list[dict]) -> str:
    """Format as numbered markdown list."""
    lines = []
    for i, r in enumerate(repos, 1):
        desc = f" - {r['description']}" if r["description"] else ""
        lines.append(
            f"{i}. {r['name']}: "
            f"{r['stars_week']:,} stars this week, "
            f"{r['stars_total']:,} stars total"
            f"{desc}"
        )
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="GitHub weekly trending repos")
    parser.add_argument("--json", action="store_true", help="Output JSON instead of markdown")
    parser.add_argument("--min-stars", type=int, default=DEFAULT_MIN_STARS_WEEK,
                        help=f"Minimum stars this week (default {DEFAULT_MIN_STARS_WEEK})")
    parser.add_argument("--top", type=int, default=DEFAULT_TOP,
                        help=f"Number of repos to show (default {DEFAULT_TOP})")
    args = parser.parse_args()

    try:
        html = fetch_html(URL)
    except Exception as e:
        print(f"Error fetching {URL}: {e}", file=sys.stderr)
        sys.exit(1)

    repos = parse_trending(html)
    if not repos:
        print("Warning: parsed 0 repos from trending page", file=sys.stderr)
        sys.exit(1)

    filtered = filter_repos(repos, args.min_stars, args.top)
    if not filtered:
        print("No repos passed the filter criteria", file=sys.stderr)
        sys.exit(1)

    if args.json:
        json.dump(filtered, sys.stdout, indent=2)
        print()
    else:
        print(format_markdown(filtered))


if __name__ == "__main__":
    main()
