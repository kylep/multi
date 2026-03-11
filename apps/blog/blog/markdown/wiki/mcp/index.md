---
title: "MCP Integrations"
summary: "Model Context Protocol servers connecting AI tools to external services: Playwright for browser automation, Linear for project management, GA4 for analytics."
keywords:
  - mcp
  - model-context-protocol
  - tool-use
  - integration
related:
  - wiki/ai-tools/claude-code
  - wiki/openclaw
scope: "Covers MCP server configurations and usage patterns. Does not cover the MCP protocol specification itself."
last_verified: 2026-03-10
---

# MCP Integrations

MCP (Model Context Protocol) servers expose external tools to AI
assistants. Each server runs as a subprocess and communicates via
JSON-RPC over stdio.

## Configuration

MCP servers are configured in `~/.claude.json` (global) or
project-level `.claude.json`. Each entry specifies the command to
launch the server and any required environment variables.

## Available Servers

See sub-pages for details on each MCP server integration.
