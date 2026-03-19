---
title: "Claude Code Usage MCP Server"
summary: "Track Claude Code token usage and estimated costs from local session logs."
keywords:
  - mcp
  - mcp-server
  - claude-code
  - usage
  - cost
  - tokens
related:
  - wiki/custom-tools/index.html
  - wiki/custom-tools/openrouter-mcp.html
scope: "Reads ~/.claude/projects/ JSONL session logs, calculates costs using LiteLLM pricing, and exposes usage data as MCP tools."
last_verified: 2026-03-18
---

Parses Claude Code's local JSONL session logs to calculate token usage
and estimated costs. Uses the same LiteLLM pricing source as
[ccusage](https://github.com/ryoppippi/ccusage) but runs as a
lightweight MCP server with no external dependencies beyond the MCP SDK.

Source: `apps/mcp-servers/cc-usage/`

## Tools

### get_usage

Daily or monthly usage breakdown with per-model cost estimates.

| Parameter | Required | Description |
|-----------|----------|-------------|
| `period` | No | `daily` (default) or `monthly` |
| `days` | No | Number of days to look back (default: 30) |

Returns: table of usage per period with input/output tokens and cost,
broken down by model.

### get_total_spend

Aggregate spend across all time or a specific window.

| Parameter | Required | Description |
|-----------|----------|-------------|
| `days` | No | Number of days to look back (omit for all time) |

Returns: total cost, token counts, and per-model cost breakdown.

## How it works

1. Discovers all `*.jsonl` files under `~/.claude/projects/`
2. Parses each line for `message.usage` records (input, output, cache
   creation, cache read tokens)
3. Fetches model pricing from LiteLLM's
   [model_prices_and_context_window.json](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json)
4. Applies tiered pricing (200k token threshold) and speed multipliers
   (e.g. 6x for fast Opus)
5. Aggregates by date/month and returns formatted results

Pricing is fetched once per server lifetime and cached in memory.

## Setup

### 1. Build

```bash
cd apps/mcp-servers/cc-usage
npm install
npm run build
```

### 2. Register in Claude Code

Add to `.mcp.json` under `mcpServers`:

```json
{
  "cc-usage": {
    "command": "node",
    "args": ["<absolute-path-to-repo>/apps/mcp-servers/cc-usage/build/index.js"]
  }
}
```

No environment variables required.

## Stack

- TypeScript compiled to ES2022
- `@modelcontextprotocol/sdk` v1.27.1
- `zod` for parameter validation
- stdio transport
- Pricing from LiteLLM (fetched at runtime, cached)
