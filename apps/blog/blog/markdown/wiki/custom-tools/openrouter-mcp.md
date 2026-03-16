---
title: "OpenRouter MCP Server"
summary: "Custom MCP server for checking OpenRouter API usage and model pricing."
keywords:
  - openrouter
  - mcp
  - mcp-server
  - pricing
related:
  - wiki/custom-tools/index.html
scope: "OpenRouter MCP server: tools, setup, and Claude Code integration."
last_verified: 2026-03-15
---

A TypeScript MCP server that exposes OpenRouter API operations as tools.
Useful for checking credit balance and comparing model pricing without
leaving a Claude Code session.

Source: `apps/mcp-servers/openrouter/`

## Tools

### get_usage

Returns API key usage and credit balance.

- Daily, weekly, monthly, and total spend
- Credit limit and remaining balance
- Free tier status and key label

No parameters.

### get_model_pricing

Look up model pricing on OpenRouter.

| Parameter | Required | Description |
|-----------|----------|-------------|
| `model` | No | Filter by model ID or name (case-insensitive) |

Returns up to 20 matching models with prompt/completion pricing
(per million tokens) and context length.

## Setup

### 1. Build

```bash
cd apps/mcp-servers/openrouter
npm install
npm run build
```

### 2. Register in Claude Code

Add to `~/.claude.json` under `mcpServers`:

```json
{
  "openrouter": {
    "type": "stdio",
    "command": "node",
    "args": [
      "/Users/kp/gh/multi/apps/mcp-servers/openrouter/build/index.js"
    ],
    "env": {
      "OPENROUTER_API_KEY": "your-key-here"
    }
  }
}
```

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENROUTER_API_KEY` | Yes | OpenRouter API key (Bearer token) |

## Stack

- TypeScript compiled to ES2022
- `@modelcontextprotocol/sdk` v1.27.1
- `zod` for parameter validation
- stdio transport
