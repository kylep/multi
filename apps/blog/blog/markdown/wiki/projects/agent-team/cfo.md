---
title: "CFO Agent"
summary: "Chief Financial Officer agent. Analyzes AI token spend via OpenRouter, identifies cost optimization opportunities."
keywords:
  - cfo
  - cost
  - openrouter
  - token-spend
  - budget
related:
  - wiki/projects/agent-team
  - wiki/mcp
scope: "CFO agent role definition: goals, tools, subagents, metrics, and invocation."
last_verified: 2026-03-11
---


The CFO agent analyzes AI token spend and recommends optimizations.
It connects to OpenRouter's MCP server for real usage and pricing data.

## Goal

Optimize AI spend by tracking token usage across models, identifying
expensive patterns, and recommending model or workflow changes that
reduce cost without sacrificing quality.

## Tools

- **OpenRouter MCP** — usage data (tokens, cost per model) and model
  pricing information
- **Read** — access project files and wiki for context

## Subagents

| Subagent | Status | Role |
|----------|--------|------|
| Cost Tracker | Active | Produce spend reports, flag anomalies |

## Metrics

- Daily/weekly/monthly token spend by model
- Cost per task type (blog writing, code review, research)
- Model pricing changes that affect the budget
- Spend anomalies (unexpected spikes)

## Invocation

```bash
# Claude Code
claude --agent cfo

# Example prompts
# "What did I spend on AI this week?"
# "Which model is costing me the most per token?"
# "Are there cheaper models I could use for research tasks?"
```
