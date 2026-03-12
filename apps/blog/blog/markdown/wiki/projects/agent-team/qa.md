---
title: "QA Agent"
summary: "QA agent. Verifies blog posts are technically production-ready: frontmatter, build, render, and links."
keywords:
  - qa
  - quality-assurance
  - build-verification
  - playwright
  - frontmatter
  - link-checking
  - production-readiness
related:
  - wiki/projects/agent-team
  - wiki/projects/agent-team/publisher
  - wiki/projects/agent-team/reviewer
scope: "QA agent role definition: goals, tools, checks performed, and invocation."
last_verified: 2026-03-11
---


The QA agent is the technical production gate for blog posts. Where the
Reviewer checks content quality and the Fact Checker checks accuracy,
QA checks that the post can actually be built, rendered, and linked
without errors. It runs after the Reviewer in the content pipeline and
before a post is merged to main.

## Goal

Verify that a blog post is safe to deploy: clean frontmatter, passing
build, visible render in the browser, and no broken links.

## Tools

- **Bash** — run builds, start the dev server, curl external links
- **Read / Glob / Grep** — validate frontmatter and scan for links
- **Playwright MCP** — navigate to the post, take a screenshot, verify
  the page renders correctly

## Checks performed

| Check | What it looks for | Blocking? |
|-------|-------------------|-----------|
| Frontmatter validation | Required fields present, date format, slug format | Yes |
| Build verification | `bin/build-blog-files.sh` exits cleanly | Yes |
| Visual render | Post title visible, no blank page or stack trace | Yes |
| Internal link validation | `.html` extensions, target files exist | Yes |
| External link spot-check | HEAD request returns non-4xx/5xx | Warning only |

## Position in the content pipeline

QA sits at the end of the Publisher pipeline, after the Reviewer:

```
Researcher → Writer → Fact Checker → Reviewer → QA
```

If QA returns BLOCKED, the issue is reported to the Publisher and
Kyle. QA does not fix issues — it only reports them.

## Invocation

```bash
# Claude Code
claude --agent qa

# Example prompts
# "QA check the post at apps/blog/blog/markdown/posts/my-post.md"
# "Run a full production readiness check on the agent-org-chart post"
```
