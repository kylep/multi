---
title: "Pai"
summary: "Personal Discord assistant. Sonnet, long-lived bot in K8s with markdown memory, active recall sub-agent, 1-min commitment scheduler, and browser automation."
keywords:
  - pai
  - agent
  - executive-assistant
  - discord
  - memory
  - commitments
related:
  - wiki/agent-team/org-chart.html
  - wiki/agent-team/index.html
  - wiki/design-docs/pai-improvements.html
scope: "Pai agent: identity, model, tools, runtime infra. For the v2 design rationale, see the design doc; for the day-to-day source map, see apps/pai/README.md."
last_verified: 2026-05-08
---

![Pai avatar](/images/agent-pai.png)

Personal Discord assistant for Kyle. Long-lived Discord bot, runs as
a K8s Deployment (`infra/ai-agents/pai-responder/`) with the
`kpericak/ai-agent-runtime` image. Auth: Claude Max OAuth via Vault.

## Identity

- **Animal totem**: Octopus — multi-armed coordinator, curious, adaptive
- **Model**: Sonnet (claude-sonnet-4-6)
- **Discord bot**: Pai (App ID `1485425671554596995`)
- **MCP**: `pai-discord` (custom, in pai-responder ConfigMap)
- **Invocation**: `claude --agent pai`

## Tools

| Tool group | What it covers |
|---|---|
| Read, Glob, Grep, WebSearch, WebFetch | Codebase + wiki + web reading |
| `pai-discord` MCP | Discord operations (send, read, threads, embeds, reactions, edit, delete) |
| `pai-memory` MCP v2 | Markdown-backed memory (save/search/recall/get/list, commitment lifecycle, daily-note promotion) |
| `playwright` MCP | Headless browser (navigate, snapshot, screenshot, click, evaluate) |
| `linear-server` MCP | Linear issues, projects, teams, comments |

Pai does **not** have Bash, Write, Edit, or Agent tools. It is read-only
on the repo. The only place it writes is its own memory (PVC at /data/).

## Memory

Three markdown files on the pai-responder PVC:

- `/data/MEMORY.md` — durable, sectioned by `##` headers
- `/data/daily/YYYY-MM-DD.md` — daily notes with timestamps
- `/data/COMMITMENTS.md` — YAML-fenced blocks for follow-ups

Pre-reply active recall: `pai-recaller` (separate Sonnet sub-agent)
searches memory and returns either `NONE` or a 2-3 line digest. The
digest gets prepended to Pai's main turn as an `<active_memory>` block.

## Commitment scheduler

`gateway.py` runs `_commitment_tick` every 60 seconds. Reads
`COMMITMENTS.md`, finds entries where `status=pending AND due<=now`,
spawns `claude --agent pai` to deliver each via Discord, then marks
delivered.

## Discord behavior

- Reads from any channel when asked
- Posts concise messages (1-3 sentences)
- Always replies in threads, never in main channel
- Uses embeds for structured updates
- Never posts confidential data

## Refs

- [Design doc — Pai Improvements (v2)](/wiki/design-docs/pai-improvements.html)
- [Org chart](/wiki/agent-team/org-chart.html)
- Source map: `apps/pai/README.md`
- Agent definition: `.claude/agents/pai.md`
- Recaller: `.claude/agents/pai-recaller.md`
- Bot infra: `infra/ai-agents/pai-responder/`
