---
title: "Publisher Agent"
summary: "Publisher agent. Orchestrates the content pipeline: researcher, writer, fact-checker, reviewer."
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
  - wiki/projects/agent-team/pai
scope: "Publisher agent role definition: goals, tools, subagents, pipeline, and invocation."
last_verified: 2026-03-11
---


The Publisher agent orchestrates the blog content pipeline. It chains
four subagents through a linear pipeline: research, write, fact-check,
review. Like Pai for the C-suite, the Publisher coordinates content
agents and bridges context between stateless sessions.

## Goal

Produce publication-ready blog posts by orchestrating the content
pipeline end to end.

## Tools

- **Read / Glob / Grep / Write** — direct file access
- **Bash** — invoke subagents

## Subagents

| Subagent | Status | Role | Model |
|----------|--------|------|-------|
| Researcher | Active | Gather sourced facts, return research brief | Haiku |
| Writer | Active | Draft blog post from research brief | Sonnet |
| Fact Checker | Active | Verify claims against primary sources | Haiku |
| Reviewer | Active | Check style and structure against style guide | Haiku |

## Pipeline

```mermaid
graph LR
    R["Researcher"] --> W["Writer"]
    W --> FC["Fact Checker"]
    FC --> Rev["Reviewer"]
    Rev -->|needs revision| W
```

1. **Researcher** gathers sourced facts on a topic (read-only, web search)
2. **Writer** drafts a blog post from the research brief (reads style guide first)
3. **Fact Checker** verifies every claim against sources
4. **Reviewer** checks style and structure against the style guide
5. If issues are flagged, the Writer revises and the cycle repeats (up to 3 rounds)

## Dual definitions

Content agents exist in both Claude Code and OpenCode:

| Agent | Claude Code | OpenCode |
|-------|------------|----------|
| Researcher | `.claude/agents/researcher.md` | `.opencode/agents/blog/researcher.md` |
| Writer | `.claude/agents/writer.md` | `.opencode/agents/blog/writer.md` |
| Fact Checker | `.claude/agents/fact-checker.md` | `.opencode/agents/blog/fact-checker.md` |
| Reviewer | `.claude/agents/reviewer.md` | `.opencode/agents/blog/reviewer.md` |

## Invocation

```bash
# Claude Code
claude --agent publisher
claude --agent researcher
claude --agent writer
claude --agent fact-checker
claude --agent reviewer

# Example prompts
# "Write a blog post about building MCP servers in Python"
# "Research the current state of AI code review tools"
# "Fact-check the draft at apps/blog/blog/markdown/posts/my-post.md"
# "Review the draft at apps/blog/blog/markdown/posts/my-post.md"
```
