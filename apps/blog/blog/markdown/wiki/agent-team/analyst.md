---
title: "Analyst"
summary: "Ingests external research, validates claims, and proposes system improvements."
keywords:
  - analyst
  - agent
  - research
  - validation
related:
  - wiki/agent-team/index.html
scope: "Analyst agent: role, workflow, output format, and invocation."
last_verified: 2026-03-15
---

## Role

The Analyst ingests external research documents (Deep Research outputs,
papers, style guides), validates their claims against primary sources,
compares findings against the current system, and proposes specific
improvements with defensible reasoning.

Read-only. Returns an analysis report but does not modify files.

## Identity

![Analyst avatar](/images/agent-analyst.png)

- **Model**: Opus
- **Animal totem**: Fox (curiosity, sharp analysis)

## Workflow

1. Read system state (style guide, agent definitions)
2. Read research document(s), extract every claim
3. Validate each claim via web search, assign status (VERIFIED / PARTIALLY VERIFIED / UNVERIFIED / CONTRADICTED)
4. Check current coverage (COVERED / PARTIAL / GAP)
5. Recommend action (ADOPT / ADAPT / SKIP) with exact proposed text
6. Self-review for bias

## Output

A structured analysis report with item-by-item assessment, cross-references
(if multiple documents), self-review notes, and ready-to-apply proposed
changes with exact text and file placement.

## Invocation

```bash
claude --agent analyst
```

## Agent definition

Source: `.claude/agents/analyst.md`
