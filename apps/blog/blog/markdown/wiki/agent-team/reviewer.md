---
title: "Reviewer"
summary: "Checks blog post style, substance, frontmatter, and sourcing against the style guide."
keywords:
  - reviewer
  - agent
  - style
  - quality
related:
  - wiki/agent-team/index.html
scope: "Reviewer agent: role, what it checks, output format."
last_verified: 2026-03-15
---

## Role

The Reviewer checks blog post drafts for style, substance, frontmatter,
and sourcing. Read-only. Returns a review report but does not edit files.

Operates with context isolation: reviews the draft and style guide only,
never reads the research brief or editorial context that informed the
draft.

## Identity

![Reviewer avatar](/images/agent-reviewer.png)

- **Model**: Opus
- **Animal totem**: Hawk (piercing eye, catches what others miss)

## What it checks

- **Style**: AI writing tells, em-dashes, kill-list words, uniform
  paragraph size, missing contractions, fabricated author voice
- **Voice**: does it sound like Kyle wrote it? Blunt framing, code-dominant,
  dry humor, abrupt closings
- **Substance**: does the post have a point of view or is it narrating output?
- **Frontmatter**: required fields present and correct
- **Sourcing**: every factual claim has a source, unverified first-person
  claims are flagged

## Output

A structured review report with per-issue quotes, problems, and
suggestions. Verdict is APPROVED or NEEDS REVISION.

## Invocation

Subagent only. Called by Publisher via the Agent tool:

```
Agent(subagent_type="reviewer", prompt="...", description="...")
```

## Agent definition

Source: `.claude/agents/reviewer.md`
