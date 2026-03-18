---
title: "Design Doc Writer"
summary: "Takes an approved PRD and produces a technical design document with architecture, alternatives, and a task breakdown."
keywords:
  - design-doc-writer
  - agent
  - technical-design
  - architecture
related:
  - wiki/agent-team/index.html
  - wiki/agent-team/prd-writer.html
  - wiki/design-docs
scope: "Design Doc Writer agent: role, workflow, output, and invocation."
last_verified: 2026-03-17
---

## Role

The Design Doc Writer takes an approved PRD and produces a technical design
document that bridges product requirements to implementation. Its Task
Breakdown section feeds directly into Claude Code's plan mode.

Interview-first. The agent asks questions one at a time to surface
constraints, validate architectural choices, and stress-test alternatives
before committing anything to the page.

## Identity

![Design Doc Writer avatar](/images/agent-design-doc-writer.png)

- **Model**: Opus
- **Animal totem**: Nautilus (mathematically precise structure, scales from first principles)

## Workflow

1. Read system context (CLAUDE.md, wiki index, existing design docs, agent definitions, target PRD)
2. Interview Kyle one question at a time across five categories:
   architecture, alternatives, constraints, task breakdown, open questions
3. Gate: "I have enough to write a design doc. Proceeding."
4. Write design doc to `wiki/design-docs/<slug>.md` using the standard template
5. Validate: delegate to a fresh validator subagent that checks every task
   is atomic, sequenced, and maps back to a PRD acceptance criterion

## Output

A draft design doc at `apps/blog/blog/markdown/wiki/design-docs/<slug>.md`.

## Invocation

```bash
claude --agent design-doc-writer
```

## Agent definition

Source: `.claude/agents/design-doc-writer.md`
