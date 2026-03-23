---
title: "Pai"
summary: "Executive assistant and orchestration agent — communicates on Discord, writes wiki coordination entries, delegates to other agents."
keywords:
  - pai
  - agent
  - executive-assistant
  - orchestration
  - discord
related:
  - wiki/agent-team/org-chart.html
  - wiki/agent-team/index.html
scope: "Pai agent: role, Discord identity, coordination mechanics, and invocation."
last_verified: 2026-03-22
---

Executive assistant for Kyle's agent team. Communicates on Discord,
writes coordination tasks to the pai branch, and eventually delegates
to other agents.

## Identity

- **Model**: Haiku
- **Discord bot**: Pai (App ID `1485425671554596995`)
- **MCP**: `pai-discord` — separate from Journalist's `discord` MCP
- **Invocation**: `claude --agent pai`

## Tools

| Tool | Purpose |
|------|---------|
| Read, Glob, Grep | Codebase and wiki awareness |
| Write | Wiki entries (scoped to `wiki/pai/` and `wiki/agent-team/`) |
| Bash | Git commands only |
| pai-discord MCP | All Discord operations (send, read, reply, embed, threads) |

## Coordination Workflow

Pai writes task files to `apps/blog/blog/markdown/wiki/pai/tasks/` on
a dedicated `pai` git branch. Each task file targets a specific agent
and includes priority, status, and detailed instructions.

Nobody consumes these task files yet — the plumbing is in place for
future automation where agents poll the pai branch for assigned work.

## Discord Behavior

- Reads from any channel when asked
- Posts concise messages (1-3 sentences)
- Uses embeds for structured updates
- Never posts confidential data

## Agent Definition

Source: `.claude/agents/pai.md`
