---
title: "Google News MCP Server"
summary: "Custom MCP server wrapping the GNews API for structured news searches. Used by the journalist agent."
keywords:
  - google-news
  - gnews
  - mcp
  - mcp-server
  - journalist
related:
  - wiki/custom-tools
  - wiki/journal
scope: "Google News MCP server: tools, setup, and integration with the journalist agent."
last_verified: 2026-03-15
---

A TypeScript MCP server wrapping the [GNews API](https://gnews.io).
Built to replace `WebSearch` in the journalist agent. Structured API
responses use fewer tokens than scraping web search results.

Source: `apps/mcp-servers/google-news/`

## Tools

### search_news

Search for news articles by keyword.

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `query` | Yes | | Search query |
| `max` | No | 10 | Max results (1-10) |
| `lang` | No | en | Language code |
| `from` | No | | Oldest date (ISO 8601) |
| `to` | No | | Newest date (ISO 8601) |

### top_headlines

Top headlines by category.

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `category` | No | technology | general, world, business, technology, science, health, etc. |
| `max` | No | 10 | Max results (1-10) |
| `lang` | No | en | Language code |

## Setup

```bash
cd apps/mcp-servers/google-news
npm install && npm run build
```

Register in `~/.claude.json` under `mcpServers`:

```json
{
  "google-news": {
    "type": "stdio",
    "command": "node",
    "args": [
      "/Users/kp/gh/multi/apps/mcp-servers/google-news/build/index.js"
    ]
  }
}
```

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GNEWS_API_KEY` | Yes | GNews API key (free tier: 100 req/day) |

## Notes

GNews treats multi-word queries as AND. Short, focused queries
(`OpenAI`, `Anthropic`, `NVIDIA AI`) work better than long compound
queries. The journalist agent runs several in parallel.
