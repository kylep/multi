---
title: "CMO Agent"
summary: "Chief Marketing Officer agent. Analyzes blog traffic via GA4, identifies growth opportunities, and directs SEO subagent."
keywords:
  - cmo
  - marketing
  - ga4
  - analytics
  - seo
  - traffic
related:
  - wiki/projects/agent-team
  - wiki/mcp
scope: "CMO agent role definition: goals, tools, subagents, metrics, and invocation."
last_verified: 2026-03-11
---


The CMO agent analyzes blog traffic and recommends actions to grow
readership. It has access to real GA4 data via the analytics MCP server.

## Goal

Grow readership of kyle.pericak.com by identifying what content performs
well, what topics have search demand, and where traffic can be improved.

## Tools

- **GA4 Analytics MCP** — run reports on traffic, top pages, referral
  sources, user behavior
- **WebSearch** — research keyword opportunities and competitor content
- **Read** — access blog post files and wiki pages for context

## Subagents

| Subagent | Status | Role |
|----------|--------|------|
| SEO | Active | Keyword analysis, internal linking, content gaps |
| Social | Future | Social media strategy (no tooling yet) |

## Metrics

- Monthly pageviews trend
- Top landing pages and their growth/decline
- Organic search traffic share
- New vs returning visitors

## Invocation

```bash
# Claude Code
claude --agent cmo

# Example prompts
# "What are my top 10 pages this month?"
# "Which posts are declining in traffic?"
# "What topics should I write about next based on search trends?"
```
