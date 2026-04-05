---
title: "MCP Servers"
summary: "Custom-built Model Context Protocol servers that give agents access to external APIs and data sources."
keywords:
  - mcp
  - tools
  - discord
  - openrouter
  - openobserve
  - google-news
  - cc-usage
  - bitwarden
  - google-search-console
related:
  - wiki/agent-team/index.html
  - wiki/custom-tools/index.html
scope: "Index of all MCP servers built for the agent team. Each server exposes one external API as a set of MCP tools."
last_verified: 2026-03-25
---

MCP servers expose external APIs as tools that Claude and the agent
team can call. Source code lives in `apps/mcp-servers/`. Configuration
is in `.mcp.json` at the repo root.

## Servers

| Server | Language | Tools | Purpose |
|--------|----------|-------|---------|
| [Discord](/wiki/mcp-servers/discord.html) | Python | 13 | Read/write Discord messages, threads, reactions |
| [OpenObserve](/wiki/mcp-servers/openobserve.html) | Python | 7 | Query logs, check for errors, list streams and alerts |
| [OpenRouter](/wiki/mcp-servers/openrouter.html) | TypeScript | 2 | Check API usage and model pricing |
| [Google News](/wiki/mcp-servers/google-news.html) | TypeScript | 2 | Search news via GNews API (journalist agent) |
| [CC Usage](/wiki/mcp-servers/cc-usage.html) | TypeScript | 2 | Track Claude Code token usage and estimated costs |
| [Bitwarden](/wiki/mcp-servers/bitwarden.html) | TypeScript | — | Password vault management |
| [Google Search Console](/wiki/mcp-servers/google-search-console.html) | Python | 4 | Search analytics, URL inspection, sitemaps |

## Third-party MCP Servers

These are installed via npm/pipx, not built in this repo:

| Server | Source | Purpose |
|--------|--------|---------|
| Playwright | `@playwright/mcp` | Browser automation for visual testing |
| Analytics | `analytics-mcp` | Google Analytics 4 reporting |
