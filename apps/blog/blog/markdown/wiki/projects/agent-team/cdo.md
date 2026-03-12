---
title: "CDO Agent"
summary: "Chief Data Officer agent. Manages shared knowledge, wiki strategy, and the Librarian subagent."
keywords:
  - cdo
  - data
  - wiki
  - knowledge-management
  - librarian
related:
  - wiki/projects/agent-team
  - wiki/projects/agent-team/pai
scope: "CDO agent role definition: goals, tools, subagents, and invocation."
last_verified: 2026-03-11
---


The CDO agent manages shared knowledge across the agent
organization. It owns the Bot-Wiki, decides what gets documented,
and directs the Librarian subagent for read/write operations.

## Goal

Maintain the quality, structure, and currency of the Bot-Wiki so
that all agents have reliable shared context.

## Tools

- **Read / Glob / Grep / Write** — direct wiki access
- **Bash** — invoke Librarian, read-only git operations
- **Linear MCP** — project context for documentation decisions

## Subagents

| Subagent | Status | Role |
|----------|--------|------|
| Librarian | Active | Read/write wiki pages on behalf of agents |

## How agents use the CDO

- **Kyle** talks to the CDO directly or through Pai for wiki
  strategy, reorganization, or quality reviews
- **Other agents** talk to the Librarian directly when they need
  to persist or retrieve shared context (notes, plans, evidence)
- The CDO handles structural decisions: new sections, archival,
  cross-referencing

## Invocation

```bash
# Claude Code
claude --agent cdo

# Example prompts
# "Audit the agent-team wiki pages for stale content"
# "Create a wiki page for the new MCP server integration"
# "What's our wiki coverage for the content pipeline?"
```
