---
title: "Phase 2 — Async Architecture"
summary: "Future architecture for event-driven and scheduled agent execution: cron triggers, OpenClaw orchestration, and automated reporting."
keywords:
  - phase-2
  - async
  - cron
  - openclaw
  - event-driven
  - automation
related:
  - wiki/projects/agent-team
  - wiki/ai-tools/claude-code
scope: "Future-state design for async agent execution. Not yet implemented."
last_verified: 2026-03-11
---


Phase 2 moves from on-demand invocation to scheduled and event-driven
agent execution. This page documents the target architecture.

**Status: Not yet implemented.** This is a design document.

## Goals

- Agents run on schedules without manual invocation
- Events (new PR, traffic spike, spend anomaly) trigger agent actions
- Reports are generated and delivered automatically

## Scheduled Agents

| Agent | Schedule | Output |
|-------|----------|--------|
| CMO | Weekly | Traffic report (top pages, trends, recommendations) |
| CFO | Weekly | Spend report (cost by model, anomalies, optimization tips) |
| CTO | Daily | Blocked/stale issue summary |
| SEO | Monthly | Content gap analysis and internal linking audit |

## Event Triggers

| Event | Agent | Action |
|-------|-------|--------|
| New PR opened | CTO | Review scope, check for related Linear issues |
| Traffic spike on a post | CMO | Analyze referral source, recommend follow-up content |
| Spend spike | CFO | Alert with breakdown of what caused the increase |
| New blog post published | SEO | Check internal linking, suggest related posts |

## Orchestration Options

**Claude Code cron tasks:** Claude Code supports cron-style task
scheduling. Simplest option for Phase 2 — define tasks that run agents
on a schedule.

**OpenClaw:** Multi-agent orchestration framework. Could coordinate
cross-agent workflows (e.g., CMO identifies topic, content team
produces post). Adds complexity — only worth it if single-agent
cron isn't sufficient.

**GitHub Actions:** For CI-adjacent triggers (PR opened, push to main).
Can invoke Claude Code or API calls as workflow steps.

## Prerequisites

- Phase 1 agents must be stable and producing useful output
- Need a delivery mechanism for reports (email, Slack, or PR comments)
- Cost guardrails to prevent runaway spend from automated invocations
