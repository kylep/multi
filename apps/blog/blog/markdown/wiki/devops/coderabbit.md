---
title: "CodeRabbit"
summary: "AI code review tool. Reviews PRs on GitHub automatically, runs locally via CLI and Claude Code plugin, configured with .coderabbit.yaml."
keywords:
  - coderabbit
  - code-review
  - ai
  - github
  - pull-request
related:
  - wiki/devops/ruler
  - claude-code-coderabbit
  - claude-hooks
scope: "Covers CodeRabbit setup, CLI usage, Claude Code plugin, .coderabbit.yaml configuration, and false positive management. Does not cover other code review tools."
last_verified: 2026-03-11
---


CodeRabbit reviews pull requests with AI. It runs automatically on
GitHub PRs and can also run locally via CLI before you push.


## Install

CLI:

```bash
curl -fsSL https://cli.coderabbit.ai/install.sh | sh
coderabbit auth login
```

Claude Code plugin:

```bash
claude plugin install coderabbit
```


## Local review workflow

Run a review inside Claude Code before opening a PR:

```text
/coderabbit:review uncommitted
```

Or from the terminal:

```bash
coderabbit review --plain
```

Fix issues, re-run, iterate until clean. Then push knowing the
automated PR review will be quiet.


## Configuration

`.coderabbit.yaml` at the repo root controls review behavior.

Key settings:

- `reviews.profile`: `chill` reduces comment volume, default is
  more aggressive
- `reviews.path_filters`: glob patterns to skip (lock files,
  build artifacts, node_modules)
- `reviews.path_instructions`: per-path AI instructions that
  tell CodeRabbit what to focus on or ignore

CodeRabbit also reads `CLAUDE.md` files automatically and treats
them as code guidelines during review.


## Handling false positives

Two approaches:

1. **Inline on the PR**: reply `@coderabbitai` on the comment
   explaining why it's wrong. CodeRabbit stores these as
   "learnings" and applies them to future reviews.

2. **path_instructions in .coderabbit.yaml**: add permanent
   instructions for specific paths. More durable since it's
   checked into the repo.

Example from this repo: blog frontmatter uses comma-separated
tags on one line. CodeRabbit kept suggesting YAML list format.
Fixed by adding to the blog posts path instruction:

```yaml
- path: "apps/blog/blog/markdown/posts/**"
  instructions: >
    Frontmatter tags use comma-separated values on a single
    line. Do not suggest converting to YAML list format.
```


## Related Blog Posts

- [Claude Code + CodeRabbit](/claude-code-coderabbit.html):
  full setup walkthrough and .coderabbit.yaml config
- [Safety Hooks for Claude Code](/claude-hooks.html):
  hooks that run before/after tool calls, reviewed by CodeRabbit
