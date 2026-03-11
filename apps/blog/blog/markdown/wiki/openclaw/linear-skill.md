---
title: "OpenClaw Linear Skill"
summary: "Custom OpenClaw skill for Linear project management. Enables the agent to create, query, and update Linear issues via Telegram commands."
keywords:
  - openclaw
  - linear
  - skill
  - project-management
  - telegram
related:
  - wiki/openclaw
  - wiki/mcp/linear
  - openclaw-linear-skill
scope: "Covers the Linear skill implementation for OpenClaw. Does not cover Linear MCP (see wiki/mcp/linear) or other OpenClaw skills."
last_verified: 2026-03-10
---

# OpenClaw Linear Skill

A custom skill that gives OpenClaw access to Linear project management.
Developed as the first custom skill for the platform.

## Capabilities

- Create new issues with title, description, priority
- Query existing issues by assignee, status, or project
- Update issue state and details
- Report status summaries via Telegram

## Implementation

The skill wraps Linear's GraphQL API. It registers commands with
OpenClaw's skill system and formats responses for Telegram delivery.

## Related Blog Posts

- [Writing My Own OpenClaw Skill for Linear](/openclaw-linear-skill.html):
  development walkthrough
