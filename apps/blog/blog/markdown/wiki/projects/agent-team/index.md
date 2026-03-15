---
title: "Agent Team"
summary: "AI agent team with 7 focused roles: Publisher, Analyst, Synthesizer, Researcher, Reviewer, QA, and Security Auditor."
keywords:
  - agent-team
  - ai-agents
  - publisher
  - researcher
  - reviewer
  - qa
  - security-auditor
  - analyst
  - content-pipeline
related:
  - wiki/ai-tools/claude-code
  - wiki/mcp
  - wiki/projects
  - wiki/history
scope: "Overview of the agent team: mission, org chart, coordination model, and invocation."
last_verified: 2026-03-13
---

An AI agent team with 7 focused roles, each backed by real tools
and invocable on demand via Claude Code.

## Mission

Help Kyle and the online community learn interesting and useful things.

## Org Chart

```mermaid
graph TD
    Kyle["Kyle"]
    Publisher["Publisher — Content Pipeline (Opus)"]
    Analyst["Analyst — Research Ingestion + System Improvement (Opus)"]
    Synthesizer["Synthesizer — Cross-Source Synthesis (Opus)"]
    Researcher["Researcher — Sourced Facts (Sonnet)"]
    Reviewer["Reviewer — Style + Substance + Sourcing (Opus)"]
    QA["QA — Build + Render + Links (Sonnet)"]
    Security["Security Auditor — OWASP + Privacy (Opus)"]

    Kyle --> Publisher
    Kyle --> Analyst
    Kyle --> Synthesizer
    Publisher --> Researcher
    Publisher --> Reviewer
    Publisher --> QA
    Publisher --> Security
```

See the dedicated [Org Chart](/wiki/projects/agent-team/org-chart.html)
page for a bot-friendly YAML version.

## Coordination

Agents coordinate through two existing systems:

- **Git** — shared state. Subagents write reports to files; the
  publisher reads those files. All artifacts live in the repo.
- **Claude Code memory** — cross-session context. Persistent notes
  about user preferences, project state, and feedback.

No shared wiki layer, no event log, no separate task tracker for
agents. Keep it simple.

## Roles

| Role | Model | Goal |
|------|-------|------|
| Publisher | Opus | Orchestrate content pipeline, write blog posts |
| Analyst | Opus | Ingest research, validate claims, propose system improvements |
| Synthesizer | Opus | Compare and contrast Deep Research reports |
| Researcher | Sonnet | Gather sourced facts, return research brief |
| Reviewer | Opus | Check style, substance, frontmatter, and sourcing |
| QA | Sonnet | Build, render, and link verification |
| Security Auditor | Opus | Confidential data, prompt injection, OWASP LLM checks |

## Invocation

```bash
claude --agent publisher
claude --agent analyst
claude --agent synthesizer
claude --agent researcher
claude --agent reviewer
claude --agent qa
claude --agent security-auditor
```

## Design principles

- **Start simple**: 7 agents, not 17. Add agents only when the
  workload clearly requires it.
- **Deny-by-default**: agents are read-only unless they need to write.
  Only Publisher (writes posts) and QA (runs builds) have write/execute
  tools.
- **Route by risk**: Opus for judgment (review, security, editorial),
  Sonnet for mechanical work (research, QA).
- **Artifacts not pass-through**: files as intermediate state between
  agents, not large context passed through prompts.

## History

See [History](/wiki/history.html) for the changelog of architectural
transitions, including the v1 → v2 migration rationale.
