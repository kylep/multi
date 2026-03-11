---
title: "OpenCode"
summary: "Open-source AI coding assistant with multi-agent architecture. Supports multiple LLM providers and custom agent definitions."
keywords:
  - opencode
  - open-source
  - ai-coding-assistant
  - multi-agent
  - llm
related:
  - wiki/ai-tools/claude-code
  - wiki/ai-tools/openrouter
  - local-opencode-setup
scope: "Covers OpenCode installation, configuration, multi-agent setup, and comparison with Claude Code and Cursor."
last_verified: 2026-03-10
---

# OpenCode

OpenCode is an open-source AI coding tool that supports multiple LLM
providers and custom agent definitions. It provides a terminal UI with
multi-agent workflows.

## Setup

Configuration lives in `opencode.json` at the project root. Custom agents
are defined in `.opencode/agents/` as markdown files with system prompts.

## Multi-Agent Architecture

OpenCode supports defining specialized agents for different tasks:
- Researcher: explores codebases and gathers context
- Writer: produces content based on research
- Fact-checker: verifies claims against source material
- Reviewer: checks output quality

## Provider Support

Works with OpenRouter, Anthropic, OpenAI, and local models. Provider
configuration is set per-agent in `opencode.json`.

## Related Blog Posts

- [Using OpenCode](/local-opencode-setup.html): setup guide and comparison
  with Claude Code and Cursor
