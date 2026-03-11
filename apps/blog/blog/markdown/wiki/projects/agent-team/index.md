---
title: "Agent Team"
summary: "AI agent organization with named C-suite roles and subagents. Mission: help Kyle and the online community learn interesting and useful things."
keywords:
  - agent-org-chart
  - ai-agents
  - cmo
  - cfo
  - cto
  - subagents
related:
  - wiki/ai-tools/claude-code
  - wiki/ai-tools/opencode
  - wiki/mcp
  - wiki/projects
scope: "Overview of the agent team project: mission, org chart, phase plan, and links to individual role pages."
last_verified: 2026-03-11
---


An AI agent organization with named roles, each backed by real tools
and invocable on demand via Claude Code or OpenCode.

## Mission

Help Kyle and the online community learn interesting and useful things.

## Org Chart

```mermaid
graph TD
    Mission["Mission: Help Kyle & community learn"]
    CMO["CMO — Grow Readership"]
    CFO["CFO — Optimize Spend"]
    CTO["CTO — Delivery"]
    Content["Content Team"]

    SEO["SEO Subagent"]
    Social["Social Subagent (future)"]
    CostTracker["Cost Tracker"]
    DeliveryBot["Delivery Bot (future)"]

    Researcher["Researcher"]
    Writer["Writer"]
    FactChecker["Fact Checker"]
    Reviewer["Reviewer"]

    Mission --> CMO
    Mission --> CFO
    Mission --> CTO
    Mission --> Content

    CMO --> SEO
    CMO --> Social
    CFO --> CostTracker
    CTO --> DeliveryBot

    Content --> Researcher
    Content --> Writer
    Content --> FactChecker
    Content --> Reviewer
```

## Phases

**Phase 1 (current):** On-demand invocation. Each agent is a Claude Code
or OpenCode agent definition you run manually. Real tools, real data.

**Phase 2 (future):** Async and event-driven. Cron-triggered reports,
event-based analysis, automated pipelines. See
[Phase 2 Architecture](/wiki/projects/agent-team/phase-2.html).

## Roles

| Role | Goal | Page |
|------|------|------|
| CMO | Grow readership via analytics and SEO | [CMO](/wiki/projects/agent-team/cmo.html) |
| CFO | Optimize AI token spend | [CFO](/wiki/projects/agent-team/cfo.html) |
| CTO | Track delivery, flag blockers | [CTO](/wiki/projects/agent-team/cto.html) |
| Content Team | Research, write, verify, review blog posts | [Content Team](/wiki/projects/agent-team/content-team.html) |

## Invocation

Claude Code:
```bash
claude --agent cmo
claude --agent cfo
claude --agent cto
```

OpenCode: use the agent picker to select from the `org/` group.

## Tools

Each agent connects to real MCP servers and tools. No mocks.

- **GA4 Analytics MCP** — traffic data for CMO/SEO
- **OpenRouter MCP** — usage and pricing data for CFO
- **Linear MCP** — project tracking for CTO
- **Playwright MCP** — browser verification (content team)
