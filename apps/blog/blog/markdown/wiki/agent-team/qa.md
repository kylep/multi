---
title: "QA"
summary: "Verifies blog posts are technically production-ready: build, render, frontmatter, and links."
keywords:
  - qa
  - agent
  - testing
  - build
related:
  - wiki/agent-team/index.html
scope: "QA agent: role, what it checks, output format."
last_verified: 2026-03-15
---

## Role

The QA agent verifies that a blog post is technically production-ready.
It does not review content quality, style, or factual accuracy. It
reports issues but does not fix them.

## Identity

![QA avatar](/images/agent-qa.png)

- **Model**: Sonnet
- **Animal totem**: Beaver (meticulous builder, structural integrity)

## What it checks

1. **Frontmatter**: required fields present, correct format
2. **Build**: runs `bin/build-blog-files.sh`, checks for clean exit
3. **Render**: starts dev server, navigates with Playwright, takes screenshot
4. **Internal links**: all end in `.html`, target files exist
5. **External links**: spot-check with HEAD requests, flag 4xx/5xx

## Output

A structured QA report with pass/fail per check. Verdict is
PRODUCTION READY or BLOCKED.

## Invocation

Subagent only. Called by Publisher via the Agent tool:

```
Agent(subagent_type="qa", prompt="...", description="...")
```

## Agent definition

Source: `.claude/agents/qa.md`
