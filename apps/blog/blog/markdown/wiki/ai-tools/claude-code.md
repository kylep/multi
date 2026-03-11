---
title: "Claude Code"
summary: "Anthropic's CLI-based AI coding assistant. Runs in terminal, edits files directly, supports MCP tool integrations and custom hooks."
keywords:
  - claude-code
  - anthropic
  - cli
  - ai-coding-assistant
  - mcp
  - hooks
related:
  - wiki/ai-tools/opencode
  - wiki/mcp
  - claude-code-coderabbit
scope: "Covers Claude Code setup, configuration, MCP integration, hooks, and usage patterns. Does not cover Claude chat interface or Anthropic API."
last_verified: 2026-03-10
---


Claude Code is Anthropic's CLI tool for AI-assisted software engineering.
It operates directly in the terminal, reading and editing files, running
commands, and integrating with external tools via MCP servers.

## Key Features

- Terminal-native: no IDE required
- Direct file editing with diff-based review
- MCP server integration for external tools (Linear, Playwright, GA4, etc.)
- Hook system for pre/post tool execution (e.g., linting on file save)
- CLAUDE.md project files for persistent instructions
- Memory system for cross-session context

## Configuration

Project instructions go in `CLAUDE.md` at the repo root. Per-user global
instructions go in `~/.claude/CLAUDE.md`. Memory files persist in
`~/.claude/projects/<project>/memory/`.

## MCP Integration

Claude Code connects to MCP servers defined in `~/.claude.json` or
project-level `.claude.json`. Each server exposes tools that Claude Code
can call during a session.

Example MCP servers used in this ecosystem:
- Playwright (browser automation and testing)
- Linear (project management)
- GA4 Analytics (Google Analytics reporting)
- Kubernetes (cluster management)

## Related Blog Posts

- [Claude Code + CodeRabbit](/claude-code-coderabbit.html): local AI code
  review before PR creation
- [Playwright MCP](/playwright-mcp.html): browser verification via MCP
- [Cross-Tool AI Rules with Ruler](/ruler-cross-tool-ai-rules.html):
  sharing instructions across Claude Code and other tools
