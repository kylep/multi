---
title: "Agent Team"
summary: "AI agent team with 11 roles defined in .claude/agents/."
keywords:
  - agent-team
  - ai-agents
  - pai
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
last_verified: 2026-03-16
---

Eleven Claude Code agents defined in `.claude/agents/`.

## Roles

| Role | Model | Tools | Purpose |
|------|-------|-------|---------|
| [Pai](/wiki/agent-team/pai.html) | Haiku | Read, Write, Bash, Glob, Grep, pai-discord MCP | Executive assistant, Discord comms, agent coordination |
| [Publisher](/wiki/agent-team/publisher.html) | Opus | Read, Write, Edit, Bash, Glob, Grep, Agent | Orchestrate content pipeline, write blog posts |
| [Analyst](/wiki/agent-team/analyst.html) | Opus | Read, Glob, Grep, WebSearch, WebFetch | Ingest research, validate claims, propose system improvements |
| [Synthesizer](/wiki/agent-team/synthesizer.html) | Opus | Read, Edit, Glob, Grep, Agent | Compare and contrast Deep Research reports |
| [PRD Writer](/wiki/agent-team/prd-writer.html) | Opus | Read, Write, Edit, Glob, Grep, WebSearch, WebFetch, Agent | Interview, research, write PRDs |
| [Design Doc Writer](/wiki/agent-team/design-doc-writer.html) | Opus | Read, Write, Edit, Glob, Grep, WebSearch, WebFetch, Agent | Interview, architect, write design docs from PRDs |
| [Journalist](/wiki/agent-team/journalist.html) | Haiku | Read, Write, Bash, Glob, Grep, WebFetch, WebSearch | Daily AI news digests to wiki journal |
| [Researcher](/wiki/agent-team/researcher.html) | Sonnet | Read, Glob, Grep, WebFetch, WebSearch | Gather sourced facts, return research brief |
| [Reviewer](/wiki/agent-team/reviewer.html) | Opus | Read, Glob, Grep | Check style, substance, frontmatter, sourcing |
| [QA](/wiki/agent-team/qa.html) | Sonnet | Bash, Read, Glob, Grep, Playwright MCP | Build, render, and link verification |
| [Security Auditor](/wiki/agent-team/security-auditor.html) | Opus | Read, Glob, Grep | Confidential data, prompt injection, OWASP LLM checks |

## Top-level vs subagent

Pai, Publisher, Analyst, Synthesizer, Journalist, PRD Writer, and Design Doc Writer
are invoked directly. Researcher, Reviewer, QA, and Security Auditor are
subagents called by Publisher during its pipeline.

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
