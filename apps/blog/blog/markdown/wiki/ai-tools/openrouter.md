---
title: "OpenRouter"
summary: "LLM token routing service. Single API endpoint for multiple model providers. Used to route requests from Claude Code, OpenCode, and OpenClaw."
keywords:
  - openrouter
  - llm-router
  - token-routing
  - api
  - multi-provider
related:
  - wiki/ai-tools/claude-code
  - wiki/ai-tools/opencode
  - wiki/openclaw
  - openrouter-ai-tools
scope: "Covers OpenRouter configuration for various AI tools. Does not cover individual model capabilities."
last_verified: 2026-03-10
---

# OpenRouter

OpenRouter provides a single API endpoint that routes to multiple LLM
providers (Anthropic, OpenAI, Google, open-source models). It simplifies
credential management and provides usage tracking across tools.

## Configuration

Each tool connects to OpenRouter differently:

- **Claude Code**: set `ANTHROPIC_BASE_URL` and `ANTHROPIC_API_KEY` env vars
- **OpenCode**: configure provider in `opencode.json`
- **OpenClaw**: configure in agent settings

## Custom MCP Server

A custom OpenRouter MCP server provides usage and pricing data directly
to AI tools. This enables cost-aware model selection during sessions.

## Related Blog Posts

- [OpenRouter for Claude Code, OpenCode, and OpenClaw](/openrouter-ai-tools.html):
  full setup guide
