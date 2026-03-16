---
title: "Researcher"
summary: "Gathers sourced facts on a topic and returns a structured research brief."
keywords:
  - researcher
  - agent
  - research
  - facts
related:
  - wiki/agent-team/index.html
scope: "Researcher agent: role, search strategy, output format."
last_verified: 2026-03-15
---

## Role

The Researcher gathers accurate, sourced information on a given topic.
Read-only. Returns findings to the calling agent (usually Publisher)
but does not write files.

## Identity

![Researcher avatar](/images/agent-researcher.png)

- **Model**: Sonnet
- **Animal totem**: Bloodhound (relentless pursuit, nose for details)

## Search strategy

1. Broad first: general queries to understand the landscape
2. Map the landscape: identify subtopics, competing approaches, primary sources
3. Narrow progressively: drill into specific claims and numbers
4. Cross-reference: note agreement or disagreement across sources

## Output

A structured research brief grouped by subtopic. Each fact includes
a clear statement, source URL, and confidence level (verified, likely,
uncertain). Gaps are listed explicitly.

## Invocation

Subagent only. Called by Publisher via the Agent tool:

```
Agent(subagent_type="researcher", prompt="...", description="...")
```

## Agent definition

Source: `.claude/agents/researcher.md`
