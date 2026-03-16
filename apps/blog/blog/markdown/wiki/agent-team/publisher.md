---
title: "Publisher"
summary: "Content pipeline orchestrator — writes blog posts using the style guide and delegates to subagents."
keywords:
  - publisher
  - agent
  - content-pipeline
  - blog
related:
  - wiki/agent-team/index.html
scope: "Publisher agent: role, pipeline, subagents, and invocation."
last_verified: 2026-03-15
---

## Role

The Publisher orchestrates the content pipeline and writes blog posts
directly. It calls subagents for research, review, QA, and security
audits, but owns the writing itself.

## Identity

![Publisher avatar](/images/agent-publisher.png)

- **Model**: Opus
- **Animal totem**: Lion (authority, leadership)

## Pipeline

```
Research → Substance Gate → Write → Review → QA → Security Audit
```

The substance gate runs before writing. If the topic lacks a point
of view, reader value, or sufficient source material, the Publisher
stops and escalates.

After writing, the Reviewer evaluates the draft. If issues are flagged,
the Publisher revises and re-submits (max 3 passes).

## Subagents

| Agent | Role |
|-------|------|
| [Researcher](/wiki/agent-team/researcher.html) | Gather sourced facts |
| [Reviewer](/wiki/agent-team/reviewer.html) | Check style, substance, sourcing |
| [QA](/wiki/agent-team/qa.html) | Build, render, link verification |
| [Security Auditor](/wiki/agent-team/security-auditor.html) | Confidential data, OWASP checks |

## Invocation

```bash
claude --agent publisher
```

## Agent definition

Source: `.claude/agents/publisher.md`
