"""MCP server for Google Search Console — search analytics, URL inspection, sitemaps."""

import os
from datetime import datetime, timedelta
from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("google-search-console")

SCOPES = ["https://www.googleapis.com/auth/webmasters"]
SERVER_DIR = Path(__file__).parent
CLIENT_SECRETS = Path(os.environ.get("GSC_CLIENT_SECRETS", SERVER_DIR / "client_secrets.json"))
TOKEN_PATH = Path(os.environ.get("GSC_TOKEN_PATH", SERVER_DIR / "token.json"))
SITE_URL = os.environ.get("GSC_SITE_URL", "")


def _get_service():
    """Build an authenticated Search Console API service."""
    creds = None
    if TOKEN_PATH.exists():
        creds = Credentials.from_authorized_user_file(str(TOKEN_PATH), SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not CLIENT_SECRETS.exists():
                raise FileNotFoundError(
                    f"OAuth client secrets not found at {CLIENT_SECRETS}. "
                    "Download from Google Cloud Console > APIs & Services > Credentials."
                )
            flow = InstalledAppFlow.from_client_secrets_file(str(CLIENT_SECRETS), SCOPES)
            creds = flow.run_local_server(port=0)
        TOKEN_PATH.write_text(creds.to_json())
    return build("searchconsole", "v1", credentials=creds, cache_discovery=False)


def _resolve_site_url(site_url: str) -> str:
    """Use explicit arg, fall back to env var."""
    url = site_url.strip() if site_url else SITE_URL
    if not url:
        raise ValueError(
            "No site URL provided. Pass site_url or set GSC_SITE_URL env var."
        )
    return url


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------


@mcp.tool()
async def gsc_search_analytics(
    start_date: str = "",
    end_date: str = "",
    dimensions: str = "query",
    limit: int = 25,
    site_url: str = "",
    page_filter: str = "",
    query_filter: str = "",
) -> str:
    """Get search performance data — queries, pages, clicks, impressions, CTR, position.

    Args:
        start_date: Start date (YYYY-MM-DD). Default: 28 days ago.
        end_date: End date (YYYY-MM-DD). Default: 3 days ago (data delay).
        dimensions: Comma-separated: query, page, date, device, country. Default: query.
        limit: Max rows (1-25000). Default: 25.
        site_url: GSC property URL. Default: GSC_SITE_URL env var.
        page_filter: Only include rows where page contains this string.
        query_filter: Only include rows where query contains this string.
    """
    url = _resolve_site_url(site_url)
    service = _get_service()

    today = datetime.utcnow().date()
    sd = start_date or (today - timedelta(days=28)).isoformat()
    ed = end_date or (today - timedelta(days=3)).isoformat()
    dims = [d.strip() for d in dimensions.split(",") if d.strip()]

    body: dict = {
        "startDate": sd,
        "endDate": ed,
        "dimensions": dims,
        "rowLimit": min(limit, 25000),
        "dataState": "all",
    }

    filters = []
    if page_filter:
        filters.append({"dimension": "page", "operator": "contains", "expression": page_filter})
    if query_filter:
        filters.append({"dimension": "query", "operator": "contains", "expression": query_filter})
    if filters:
        body["dimensionFilterGroups"] = [{"filters": filters}]

    result = service.searchanalytics().query(siteUrl=url, body=body).execute()
    rows = result.get("rows", [])

    if not rows:
        return f"No search analytics data for {sd} to {ed}."

    lines = [f"Search analytics for {url} ({sd} to {ed}), {len(rows)} rows:"]
    lines.append("")

    # Header
    dim_headers = [d.capitalize() for d in dims]
    lines.append(f"{'  '.join(f'{h:<30}' for h in dim_headers)}  {'Clicks':>8}  {'Impr':>8}  {'CTR':>7}  {'Pos':>6}")
    lines.append("-" * (30 * len(dims) + 40))

    for row in rows:
        keys = row.get("keys", [])
        clicks = row.get("clicks", 0)
        impressions = row.get("impressions", 0)
        ctr = row.get("ctr", 0)
        position = row.get("position", 0)

        key_str = "  ".join(f"{k:<30}" for k in keys)
        lines.append(f"{key_str}  {clicks:>8}  {impressions:>8}  {ctr:>6.1%}  {position:>6.1f}")

    return "\n".join(lines)


@mcp.tool()
async def gsc_inspect_url(
    page_url: str,
    site_url: str = "",
) -> str:
    """Inspect a URL's indexing status — crawl state, canonical, robots, rich results.

    Args:
        page_url: The full URL to inspect (e.g. https://kyle.pericak.com/some-post.html).
        site_url: GSC property URL. Default: GSC_SITE_URL env var.
    """
    url = _resolve_site_url(site_url)
    service = _get_service()

    result = service.urlInspection().index().inspect(
        body={"inspectionUrl": page_url, "siteUrl": url}
    ).execute()

    inspection = result.get("inspectionResult", {})
    index_status = inspection.get("indexStatusResult", {})
    rich_results = inspection.get("richResultsResult", {})

    lines = [f"URL Inspection: {page_url}"]
    lines.append("")

    # Indexing
    lines.append("## Indexing")
    lines.append(f"  Verdict:        {index_status.get('verdict', 'UNKNOWN')}")
    lines.append(f"  Coverage:       {index_status.get('coverageState', 'N/A')}")
    lines.append(f"  Indexing state: {index_status.get('indexingState', 'N/A')}")
    lines.append(f"  Page fetch:     {index_status.get('pageFetchState', 'N/A')}")
    lines.append(f"  Robots.txt:     {index_status.get('robotsTxtState', 'N/A')}")
    lines.append(f"  Last crawl:     {index_status.get('lastCrawlTime', 'N/A')}")
    lines.append(f"  Crawled as:     {index_status.get('crawledAs', 'N/A')}")
    lines.append(f"  Google canon:   {index_status.get('googleCanonical', 'N/A')}")
    lines.append(f"  User canon:     {index_status.get('userCanonical', 'N/A')}")

    referring = index_status.get("referringUrls", [])
    if referring:
        lines.append(f"  Referring URLs: {', '.join(referring[:5])}")

    # Rich results
    if rich_results:
        lines.append("")
        lines.append("## Rich Results")
        lines.append(f"  Verdict: {rich_results.get('verdict', 'UNKNOWN')}")
        for item in rich_results.get("detectedItems", []):
            lines.append(f"  - {item.get('richResultType', '?')}")
            for issue in item.get("items", []):
                for i in issue.get("issues", []):
                    lines.append(f"    Issue: {i.get('issueMessage', '?')} ({i.get('severity', '?')})")

    return "\n".join(lines)


@mcp.tool()
async def gsc_list_sitemaps(
    site_url: str = "",
) -> str:
    """List all sitemaps registered in Google Search Console.

    Args:
        site_url: GSC property URL. Default: GSC_SITE_URL env var.
    """
    url = _resolve_site_url(site_url)
    service = _get_service()

    result = service.sitemaps().list(siteUrl=url).execute()
    sitemaps = result.get("sitemap", [])

    if not sitemaps:
        return f"No sitemaps found for {url}."

    lines = [f"Sitemaps for {url}:"]
    lines.append("")
    lines.append(f"{'Path':<60}  {'Type':<12}  {'Submitted':<12}  {'Errors':>6}  {'Warnings':>8}")
    lines.append("-" * 105)

    for sm in sitemaps:
        path = sm.get("path", "?")
        sm_type = sm.get("type", "?")
        submitted = sm.get("lastSubmitted", "?")[:10] if sm.get("lastSubmitted") else "?"
        errors = sm.get("errors", 0)
        warnings = sm.get("warnings", 0)
        lines.append(f"{path:<60}  {sm_type:<12}  {submitted:<12}  {errors:>6}  {warnings:>8}")

        # Show content breakdown if available
        for content in sm.get("contents", []):
            ctype = content.get("type", "?")
            sub = content.get("submitted", "?")
            indexed = content.get("indexed", "?")
            lines.append(f"  └─ {ctype}: {sub} submitted, {indexed} indexed")

    return "\n".join(lines)


@mcp.tool()
async def gsc_submit_sitemap(
    sitemap_url: str,
    site_url: str = "",
) -> str:
    """Submit or resubmit a sitemap to Google Search Console.

    Args:
        sitemap_url: Full URL of the sitemap (e.g. https://kyle.pericak.com/sitemap.xml).
        site_url: GSC property URL. Default: GSC_SITE_URL env var.
    """
    url = _resolve_site_url(site_url)
    service = _get_service()

    service.sitemaps().submit(siteUrl=url, feedpath=sitemap_url).execute()
    return f"Sitemap submitted: {sitemap_url}"


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    mcp.run()
