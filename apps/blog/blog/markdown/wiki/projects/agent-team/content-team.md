---
title: "Publisher / Content Team"
summary: "Publisher agent and blog content pipeline: researcher, writer, fact-checker, reviewer. Defined in both Claude Code and OpenCode."
keywords:
  - publisher
  - content-pipeline
  - blog-pipeline
  - researcher
  - writer
  - fact-checker
  - reviewer
related:
  - wiki/projects/agent-team
  - wiki/projects/agent-team/publisher
  - wiki/blog-architecture
scope: "Maps the blog content pipeline agents across Claude Code and OpenCode definitions."
last_verified: 2026-03-11
---


The Publisher orchestrates the blog post production pipeline. Four
subagents handle research, writing, fact-checking, and review.

This page covers the agent definitions. For the Publisher's role in the
org chart, pipeline diagram, and invocation examples, see the
[Publisher wiki page](/wiki/projects/agent-team/publisher.html).

## Pipeline

```mermaid
graph LR
    R["Researcher"] --> W["Writer"]
    W --> FC["Fact Checker"]
    FC --> Rev["Reviewer"]
```

1. **Researcher** gathers sourced facts on a topic (read-only, web search)
2. **Writer** drafts a blog post from the research brief
3. **Fact Checker** verifies every claim against sources
4. **Reviewer** checks style, structure, and readiness for publication

## Agent Definitions

Agents are defined in both Claude Code and OpenCode:

| Agent | Claude Code | OpenCode |
|-------|------------|----------|
| Publisher | `.claude/agents/publisher.md` (Sonnet) | — |
| Researcher | `.claude/agents/researcher.md` (Haiku) | `.opencode/agents/blog/researcher.md` (Gemini Flash) |
| Writer | `.claude/agents/writer.md` (Sonnet) | `.opencode/agents/blog/writer.md` (Big Pickle) |
| Fact Checker | `.claude/agents/fact-checker.md` (Haiku) | `.opencode/agents/blog/fact-checker.md` (Gemini Flash) |
| Reviewer | `.claude/agents/reviewer.md` (Haiku) | `.opencode/agents/blog/reviewer.md` (Big Pickle) |

The Claude Code agents reference the style guide at
`apps/blog/blog/markdown/posts/.ruler/style.md` at runtime rather than
duplicating rules inline.

## Relationship to Org Chart

The Publisher reports to the mission directly, not to any C-suite
role. The CMO may direct what topics to write about, but the
Publisher's pipeline is independent.

## Invocation

Claude Code:
```bash
claude --agent publisher
claude --agent researcher
claude --agent writer
claude --agent fact-checker
claude --agent reviewer
```

OpenCode: use the agent picker to select from the `blog/` group.
