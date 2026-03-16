---
title: "Bug: Claude Code Write/Edit Path Patterns Ignored in Headless Mode"
summary: "Path-restricted allowedTools patterns (e.g. Write(apps/**)) silently fail in non-interactive mode (-p flag). Only bare tool names work. Known upstream bug."
keywords:
  - claude-code
  - bug
  - allowedTools
  - headless
  - permissions
  - security
  - owasp
  - excessive-agency
related:
  - wiki/security/owasp-llm-top-10
  - wiki/devops/agent-controller
scope: "Documents an upstream Claude Code bug affecting K8s agent permissions. Includes reproduction steps, workaround, and security implications."
last_verified: 2026-03-16
---

## Summary

When Claude Code runs in non-interactive/headless mode (`-p` flag with `--output-format text` or `--output-format json`), **path-restricted patterns** in `--allowedTools` and `.claude/settings.json` are silently ignored.

- `--allowedTools 'Write'` — works (bare tool name)
- `--allowedTools 'Write(apps/blog/**)'` — **does not work** (permission denied)
- `--allowedTools 'Write(//workspace/repo/apps/**)'` — **does not work** (absolute path)
- `.claude/settings.json` with `Write(apps/**)` — **does not work**

`Bash` patterns (e.g. `Bash(git commit *)`) work correctly in headless mode. The bug is specific to file-based tools (`Write`, `Edit`).

## Upstream Issues

- [anthropics/claude-code#1188](https://github.com/anthropics/claude-code/issues/1188) — original report (auto-closed)
- [anthropics/claude-code#6194](https://github.com/anthropics/claude-code/issues/6194) — follow-up with Anthropic engineer assigned

## Reproduction

From inside a K8s pod running `kpericak/ai-agent-runtime:0.2`:

```bash
# This FAILS — path pattern ignored
claude -p 'Write hello to test.md' \
  --output-format json \
  --allowedTools 'Write(apps/**)' \
  --max-turns 3

# This WORKS — bare tool name
claude -p 'Write hello to test.md' \
  --output-format json \
  --allowedTools 'Write' \
  --max-turns 3
```

Confirmed on Claude Code version **2.1.76** (March 2026).

## Workaround

Use bare tool names in `--allowedTools`:

```yaml
allowedTools: >-
  Read,Glob,Grep,Write,
  Bash(git commit *),Bash(date *),
  mcp__discord__send_message
```

This grants unrestricted Write access to the agent, which is a known trade-off.

## Security Implications (OWASP LLM06: Excessive Agency)

Without path-restricted Write, agents can write to any file in the workspace. Mitigations:

1. **Prompt-level restriction** — agent instructions specify which directories to write to
2. **Git-based guardrails** — workspace is reset to a clean branch before each run; only committed changes persist
3. **Bash restrictions still work** — `Bash(git add apps/blog/*)` limits which files can be staged
4. **Review on commit** — human reviews PRs before merge to main
5. **Pre-tool hooks** (future) — when Claude Code fixes path patterns or adds hook support in headless mode, re-enable path restrictions

## When to Remove This Workaround

Monitor [anthropics/claude-code#6194](https://github.com/anthropics/claude-code/issues/6194). When the fix ships, update `daily-ai-news.yaml` to use `Write(apps/blog/blog/markdown/wiki/journal/**)` instead of bare `Write`.
