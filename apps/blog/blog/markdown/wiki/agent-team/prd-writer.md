---
title: "PRD Writer"
summary: "Takes vague product ideas and produces well-scoped PRDs through structured interview and research."
keywords:
  - prd-writer
  - agent
  - product-requirements
  - interview
related:
  - wiki/agent-team/index.html
  - wiki/prds
scope: "PRD Writer agent: role, workflow, output, and invocation."
last_verified: 2026-03-16
---

## Role

The PRD Writer takes vague product ideas and turns them into well-scoped
PRDs. It conducts a structured interview to force clarity on the problem,
validates the idea through research, then writes a PRD using the standard
template.

Interview-first. The agent asks questions one at a time, pushes back on
contradictions, and refuses to write until all five question categories
are covered.

## Identity

![PRD Writer avatar](/images/agent-prd-writer.png)

- **Model**: Opus
- **Animal totem**: Bowerbird (builds elaborate, purposeful structures)

## Workflow

1. Read system context (CLAUDE.md, wiki index, existing PRDs, agent definitions)
2. Interview Kyle one question at a time across five categories:
   problem clarity, solution validation, success criteria, constraints, strategic fit
3. Gate: "I have enough to write a PRD. Proceeding to research."
4. Research the problem space (delegate to researcher subagent + own reading)
5. Write PRD to `wiki/prds/<slug>.md` using the standard template
6. Validate: delegate to a fresh validator subagent that checks every
   acceptance criterion is testable and contains no implementation details

## Output

A draft PRD file at `apps/blog/blog/markdown/wiki/prds/<slug>.md`.

## Invocation

```bash
claude --agent prd-writer
```

## Agent definition

Source: `.claude/agents/prd-writer.md`
