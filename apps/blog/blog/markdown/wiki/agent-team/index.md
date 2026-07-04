---
title: "Agent Team"
summary: "AI agent team with 16 active roles (plus one deprecated) defined in .claude/agents/."
keywords:
  - agent-team
  - ai-agents
  - pai
  - pai-self-improver
  - publisher
  - researcher
  - reviewer
  - qa
  - security-auditor
  - analyst
  - journalist
  - synthesizer
  - prd-writer
  - design-doc-writer
related:
  - wiki/history
scope: "Source of truth for the agent team: roles, models, tools, coordination, and invocation."
last_verified: 2026-07-04
---

Seventeen Claude Code agent definitions in `.claude/agents/` — sixteen
active plus the deprecated healthcheck.

## Roles

| Role | Model | Tools | Purpose |
|------|-------|-------|---------|
| [Pai](/wiki/agent-team/pai.html) | Sonnet | Read, Glob, Grep, WebSearch, WebFetch, pai-discord, pai-memory, playwright, linear | Executive assistant, Discord comms, persistent memory |
| [Pai Self-Improver](/wiki/agent-team/pai-self-improver.html) | Sonnet | Read, Glob, Grep, Bash, openobserve, pai-discord, linear | Daily diagnostic cron — mines O2, proposes memory updates |
| [Publisher](/wiki/agent-team/publisher.html) | Opus | Read, Write, Edit, Bash, Glob, Grep, Agent | Orchestrate content pipeline, write blog posts |
| [Analyst](/wiki/agent-team/analyst.html) | Opus | Read, Glob, Grep, WebSearch, WebFetch | Ingest research, validate claims, propose system improvements |
| [Synthesizer](/wiki/agent-team/synthesizer.html) | Opus | Read, Edit, Glob, Grep, Agent | Compare and contrast Deep Research reports |
| [PRD Writer](/wiki/agent-team/prd-writer.html) | Opus | Read, Write, Edit, Glob, Grep, WebSearch, WebFetch, Agent | Interview, research, write PRDs |
| [Design Doc Writer](/wiki/agent-team/design-doc-writer.html) | Opus | Read, Write, Edit, Glob, Grep, WebSearch, WebFetch, Agent | Interview, architect, write design docs from PRDs |
| [Journalist](/wiki/agent-team/journalist.html) | Sonnet | Read, Write, Glob, Grep, WebFetch, WebSearch, google-news, discord | Daily AI news digests to wiki journal |
| Autolearn | Opus | Read, Write, Edit, Glob, Grep, Bash, WebSearch, WebFetch, Agent | Linear-driven SDLC loop: writes PRDs, design docs, implements issues |
| Seo-Bot | Sonnet | Read, Write, Edit, Bash, gsc, analytics, linear, discord | Nightly SEO optimizer: GSC/GA4 data → one improvement → PR |
| Interviewee | Sonnet | Read, Glob, Grep | Answers PRD/design-doc interview questions from repo context |
| Pai Recaller | Sonnet | pai-memory | Pre-reply active memory recall for Pai (subagent) |
| Healthcheck (deprecated) | Sonnet | Bash, Read, openobserve, linear | Superseded by Pai Self-Improver; kept for ad-hoc runs |
| [Researcher](/wiki/agent-team/researcher.html) | Sonnet | Read, Glob, Grep, WebFetch, WebSearch | Gather sourced facts, return research brief |
| [Reviewer](/wiki/agent-team/reviewer.html) | Opus | Read, Glob, Grep | Check style, substance, frontmatter, sourcing |
| [QA](/wiki/agent-team/qa.html) | Sonnet | Bash, Read, Glob, Grep, Playwright MCP | Build, render, and link verification |
| [Security Auditor](/wiki/agent-team/security-auditor.html) | Opus | Read, Glob, Grep | Confidential data, prompt injection, OWASP LLM checks |

## Top-level vs subagent

Pai, Publisher, Analyst, Synthesizer, Journalist, PRD Writer, Design Doc
Writer, Autolearn, Seo-Bot, and Pai Self-Improver are invoked directly
(interactively or by CronJob). Researcher, Reviewer, QA, and Security
Auditor are subagents called by Publisher during its pipeline;
Interviewee serves the PRD/design-doc writers; Pai Recaller serves Pai.

## Invocation

```bash
claude --agent pai
claude --agent publisher
claude --agent analyst
claude --agent synthesizer
claude --agent journalist
claude --agent prd-writer
claude --agent design-doc-writer
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

## Adding a new agent

1. Define the agent in `.claude/agents/<name>.md`
2. Create a wiki page at `wiki/agent-team/<name>.md` (copy `prd-writer.md` as a template)
3. Add a row to the Roles table above and update the count in the summary
4. Generate the avatar image:
   ```bash
   cd apps/blog/blog
   OPENAI_API_KEY=<key> node scripts/generate-agent-image.mjs agent-<name>.png "<subject description>"
   ```
   The script saves to `public/images/` and matches the existing avatar style
   (geometric flat design, dark navy background, bold colors).
5. Reference the image in the wiki page: `![<Name> avatar](/images/agent-<name>.png)`
6. Add the agent to the invocation block if it's a top-level agent

## History

See [History](/wiki/history.html) for the changelog of architectural
transitions.
