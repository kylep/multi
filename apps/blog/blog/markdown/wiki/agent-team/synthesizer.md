---
title: "Synthesizer"
summary: "Compares and contrasts multiple Deep Research reports into shared findings, unique findings, and contradictions."
keywords:
  - synthesizer
  - agent
  - research
  - synthesis
related:
  - wiki/agent-team/index.html
scope: "Synthesizer agent: role, workflow, output format, and invocation."
last_verified: 2026-03-15
---

## Role

The Synthesizer takes multiple Deep Research reports on the same topic
and produces a structured compare-and-contrast document. It adds nothing
from outside the source material. No opinions, no external knowledge.

## Identity

![Synthesizer avatar](/images/agent-synthesizer.png)

- **Model**: Opus
- **Animal totem**: Octopus (multi-armed, connects many sources)

## Workflow

1. Discover source files in the research directory
2. Spawn one subagent per source to extract findings (parallel)
3. Categorize every point as shared, unique, or contradictory
4. Write the synthesis to the research index page

## Output

Appends a `## Cross-Source Synthesis` section to the research `index.md`
with three subsections: Shared Findings (2+ sources), Unique Findings
(grouped by source), and Contradictions.

## Invocation

```bash
claude --agent synthesizer
```

## Agent definition

Source: `.claude/agents/synthesizer.md`
