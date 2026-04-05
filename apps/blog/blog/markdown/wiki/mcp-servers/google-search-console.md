---
title: "Google Search Console MCP Server"
summary: "MCP server for querying Google Search Console — search analytics, URL inspection, and sitemap management."
keywords:
  - mcp
  - google-search-console
  - seo
  - search-analytics
  - indexing
related:
  - wiki/mcp-servers/index.html
scope: "Setup, configuration, and tool reference for the Google Search Console MCP server."
last_verified: 2026-04-04
---

## Overview

Python MCP server using FastMCP that wraps the Google Search Console API v1.
Provides search performance data, URL indexing inspection, and sitemap
management. Used for SEO audits and monitoring.

Source: `apps/mcp-servers/google-search-console/server.py`

## Prerequisites

- Google Cloud project with **Search Console API** enabled
- OAuth 2.0 Desktop credentials (`client_secrets.json`)
- Site verified in [Google Search Console](https://search.google.com/search-console)

## Setup

1. Enable the Search Console API in Google Cloud Console
2. Create OAuth 2.0 credentials (Desktop app type)
3. Download the JSON and save as `apps/mcp-servers/google-search-console/client_secrets.json`
4. First run opens a browser for OAuth consent — tokens are cached to `token.json`

## Configuration

Environment variables:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GSC_SITE_URL` | Yes | — | Default site URL (e.g. `https://kyle.pericak.com`) |
| `GSC_CLIENT_SECRETS` | No | `./client_secrets.json` | Path to OAuth client secrets |
| `GSC_TOKEN_PATH` | No | `./token.json` | Path to cached OAuth token |

`.mcp.json` entry:
```json
"google-search-console": {
  "command": "/path/to/apps/mcp-servers/google-search-console/.venv/bin/python",
  "args": ["/path/to/apps/mcp-servers/google-search-console/server.py"],
  "env": {
    "GSC_SITE_URL": "https://kyle.pericak.com"
  }
}
```

## Tools

### Search Analytics

**`gsc_search_analytics`** — Search performance data: clicks, impressions, CTR, position.
- `start_date`: Start date, YYYY-MM-DD (default: 28 days ago).
- `end_date`: End date, YYYY-MM-DD (default: 3 days ago, due to data delay).
- `dimensions`: Comma-separated: `query`, `page`, `date`, `device`, `country` (default: `query`).
- `limit`: Max rows, 1-25000 (default: 25).
- `page_filter`: Filter pages containing this string.
- `query_filter`: Filter queries containing this string.

### URL Inspection

**`gsc_inspect_url`** — Check indexing status, crawl state, canonical, robots.txt, rich results.
- `page_url`: Full URL to inspect.

### Sitemaps

**`gsc_list_sitemaps`** — List all registered sitemaps with status, errors, and content breakdown.

**`gsc_submit_sitemap`** — Submit or resubmit a sitemap URL.
- `sitemap_url`: Full URL of the sitemap.

## Example Usage

Top search queries in the last 28 days:
```
Use gsc_search_analytics with dimensions "query" and limit 20
```

Check if a specific page is indexed:
```
Use gsc_inspect_url with page_url "https://kyle.pericak.com/playwright-mcp.html"
```

Performance by page:
```
Use gsc_search_analytics with dimensions "page" and limit 10
```

Daily trend for a specific query:
```
Use gsc_search_analytics with dimensions "date" and query_filter "claude code"
```
