---
title: "CTO Agent"
summary: "Chief Technology Officer agent. Tracks project delivery via Linear, flags blocked or stale work, reviews technical status."
keywords:
  - cto
  - delivery
  - linear
  - project-management
  - git
related:
  - wiki/projects/agent-team
  - wiki/mcp
  - wiki/devops
scope: "CTO agent role definition: goals, tools, subagents, metrics, and invocation."
last_verified: 2026-03-11
---


The CTO agent tracks project delivery and flags issues. It connects to
Linear for project management data and can read git history for context.

## Goal

Keep projects moving. Surface blocked or stale issues, summarize
project status, and flag when delivery timelines are at risk.

## Tools

- **Linear MCP** — list projects, issues, cycles, milestones, and
  their statuses
- **Read** — access project files for context
- **Bash (git read-only)** — check branch status, recent commits, PR state

## Subagents

| Subagent | Status | Role |
|----------|--------|------|
| Delivery Bot | Future | Automated stale-issue detection and notifications |

## Metrics

- Issues in progress vs blocked vs done
- Average cycle time for issue completion
- Stale issues (no activity in 7+ days)
- Project milestone progress

## Invocation

```bash
# Claude Code
claude --agent cto

# Example prompts
# "What's the status of the Agent Org Chart project?"
# "Are there any blocked issues?"
# "What did I ship this week?"
```
