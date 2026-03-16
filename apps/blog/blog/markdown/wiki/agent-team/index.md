---
title: "Agent Team"
summary: "AI agent team with 8 roles defined in .claude/agents/."
keywords:
  - agent-team
  - ai-agents
  - publisher
  - researcher
  - reviewer
  - qa
  - security-auditor
  - analyst
  - journalist
  - synthesizer
related:
  - wiki/history
scope: "Source of truth for the agent team: roles, models, tools, coordination, and invocation."
last_verified: 2026-03-15
---

Eight Claude Code agents defined in `.claude/agents/`.

## Roles

| Role | Model | Tools | Purpose |
|------|-------|-------|---------|
| [Publisher](/wiki/agent-team/publisher.html) | Opus | Read, Write, Edit, Bash, Glob, Grep, Agent | Orchestrate content pipeline, write blog posts |
| [Analyst](/wiki/agent-team/analyst.html) | Opus | Read, Glob, Grep, WebSearch, WebFetch | Ingest research, validate claims, propose system improvements |
| [Synthesizer](/wiki/agent-team/synthesizer.html) | Opus | Read, Edit, Glob, Grep, Agent | Compare and contrast Deep Research reports |
| [Journalist](/wiki/agent-team/journalist.html) | Haiku | Read, Write, Bash, Glob, Grep, WebFetch, WebSearch | Daily AI news digests to wiki journal |
| [Researcher](/wiki/agent-team/researcher.html) | Sonnet | Read, Glob, Grep, WebFetch, WebSearch | Gather sourced facts, return research brief |
| [Reviewer](/wiki/agent-team/reviewer.html) | Opus | Read, Glob, Grep | Check style, substance, frontmatter, sourcing |
| [QA](/wiki/agent-team/qa.html) | Sonnet | Bash, Read, Glob, Grep, Playwright MCP | Build, render, and link verification |
| [Security Auditor](/wiki/agent-team/security-auditor.html) | Opus | Read, Glob, Grep | Confidential data, prompt injection, OWASP LLM checks |

## Top-level vs subagent

Publisher, Analyst, Synthesizer, and Journalist are invoked directly.
Researcher, Reviewer, QA, and Security Auditor are subagents called
by Publisher during its pipeline.

## Invocation

```bash
claude --agent publisher
claude --agent analyst
claude --agent synthesizer
claude --agent journalist
```

## Coordination

- **Git** — shared state. Subagents write reports to files; the
  publisher reads those files. All artifacts live in the repo.
- **Claude Code memory** — cross-session context. Persistent notes
  about user preferences, project state, and feedback.

## Design principles

- **Deny-by-default**: agents are read-only unless they need to write.
- **Route by risk**: Opus for judgment, Sonnet for mechanical work,
  Haiku for high-frequency low-complexity tasks.
- **Artifacts not pass-through**: files as intermediate state between
  agents, not large context passed through prompts.

## History

See [History](/wiki/history.html) for the changelog of architectural
transitions.
