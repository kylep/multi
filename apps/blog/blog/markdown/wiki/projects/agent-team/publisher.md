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
last_verified: 2026-03-12
---


The Publisher agent orchestrates the blog content pipeline. It chains
four subagents through a linear pipeline: research, write, fact-check,
review. Like Pai for the C-suite, the Publisher coordinates content
agents and bridges context between stateless sessions.

The Publisher owns editorial quality, not just pipeline execution. A
post that passes all style rules but has no point of view is still a
failure.

## Goal

Produce publication-ready blog posts by orchestrating the content
pipeline end to end — including editorial gates that ensure every post
has a genuine point of view before writing begins.

## Tools

- **Read / Glob / Grep / Write** — direct file access
- **Bash** — invoke subagents

## Subagents

| Subagent | Status | Role | Model |
|----------|--------|------|-------|
| Researcher | Active | Gather sourced facts, return research brief | Haiku |
| Writer | Active | Draft blog post from research brief + editorial brief | Sonnet |
| Fact Checker | Active | Verify claims against primary sources | Haiku |
| Reviewer | Active | Check style, substance, and frontmatter | Haiku |

## Pipeline

```mermaid
graph LR
    R["Researcher"] --> SG["Substance Gate"]
    SG -->|pass| W["Writer"]
    SG -->|fail| Stop["Return to caller"]
    W --> FC["Fact Checker"]
    FC --> Rev["Reviewer"]
    Rev -->|needs revision| W
```

1. **Researcher** gathers sourced facts on a topic (read-only, web search)
2. **Substance gate** — Publisher checks three questions before writing begins (see below)
3. **Writer** drafts a blog post from the research brief AND the editorial brief
4. **Fact Checker** verifies every claim against sources
5. **Reviewer** checks style, substance, and frontmatter against the style guide
6. If issues are flagged, the Writer revises and the cycle repeats (up to 3 rounds)

## Substance gate

Before invoking the Writer, Publisher must answer all three:

1. **Perspective**: does this topic have a point of view — something the reader will learn or a conclusion to argue?
2. **Reader value**: would a reader who already knows the tool learn something new?
3. **Source substance**: is the research brief rich enough for a full post, or is it a log file / README comment?

If any answer is no, Publisher stops and returns to the caller with a specific ask for more angle, more substance, or a format reduction (shorter note, list post, code snippet).

## Editorial brief

Every Writer invocation must include an editorial brief alongside the research brief:

1. **Angle** — one sentence: what the reader will learn or take away
2. **Target reader** — who this is for and what they already know
3. **What this post is NOT** — explicit scope boundary to prevent drift

## Frontmatter checklist

Before declaring the pipeline done, Publisher reads the draft and verifies all required frontmatter fields are present:

| Field | Required |
|-------|----------|
| `title` | Yes |
| `summary` | Yes |
| `slug` | Yes |
| `tags` | Yes |
| `status` | Yes (`draft` or `published`) |
| `image` or `imgprompt` | At least one |

If any are missing, Publisher returns the draft to the Writer with a specific list of what is missing.

Canonical frontmatter reference: `apps/blog/blog/markdown/posts/agent-org-chart.md`

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
