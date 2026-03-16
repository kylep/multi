---
title: "Ruler"
summary: "Cross-tool AI rule management. Maintains a single source of truth for AI assistant instructions, generating tool-specific config files for Claude Code, Cursor, and others."
keywords:
  - ruler
  - ai-rules
  - claude-md
  - cursor-rules
  - configuration
related:
  - ruler-cross-tool-ai-rules
scope: "Covers Ruler setup, rule authoring, and current rule inventory. Does not cover individual tool configuration formats."
last_verified: 2026-03-11
---


Ruler solves the problem of maintaining AI assistant instructions across
multiple tools. Write rules once in `.ruler/` markdown files, then
generate tool-specific config files.

## How It Works

1. Author rules in `.ruler/*.md` files (plain markdown)
2. Run `ruler apply` to generate:
   - `CLAUDE.md` for Claude Code
   - `.cursorrules` for Cursor
3. Rules are injected with `<!-- Source: .ruler/filename.md -->` comments

## Configuration

`ruler.toml` in each `.ruler/` directory controls which agents get output:

```toml
default_agents = ["claude", "cursor"]
```

## Rule Inventory

Root rules (`.ruler/`):

| File | Purpose |
|------|---------|
| `branching.md` | Branch naming (Linear format for auto-linking), PR workflow |
| `monorepo.md` | Sub-project isolation, no cross-project imports |
| `security.md` | Security scanning commands (semgrep, trivy, gitleaks) |
| `blog-dev.md` | Dev server, Playwright verify loop, pre-PR checklist |

Sub-project rules:

| File | Purpose |
|------|---------|
| `apps/blog/blog/markdown/posts/.ruler/style.md` | Blog post writing style and formatting |
| `apps/blog/blog/tests/.ruler/testing.md` | Playwright test conventions |
| `infra/ai-security-toolkit-1/.ruler/versioning.md` | Toolkit image versioning |
| `apps/games/kid-bot-battle-sim/features/.ruler/interfaces.md` | Game interface contracts |
| `apps/games/sillyapp/.ruler/build.md` | SillyApp build rules |

## Usage

```bash
# Apply all rules (from repo root)
ruler apply

# Ruler reads .ruler/*.md and writes CLAUDE.md, .cursorrules, etc.
```

## Related Blog Posts

- [Cross-Tool AI Rules with Ruler](/ruler-cross-tool-ai-rules.html):
  setup and workflow
