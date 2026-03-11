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
  - wiki/ai-tools/claude-code
  - wiki/ai-tools/opencode
  - ruler-cross-tool-ai-rules
scope: "Covers Ruler setup and rule authoring. Does not cover individual tool configuration formats."
last_verified: 2026-03-10
---

# Ruler

Ruler solves the problem of maintaining AI assistant instructions across
multiple tools. Write rules once in `.ruler/` markdown files, then
generate tool-specific config files.

## How It Works

1. Author rules in `.ruler/*.md` files (markdown with frontmatter)
2. Run `ruler apply` to generate:
   - `CLAUDE.md` for Claude Code
   - `.cursorrules` for Cursor
   - Other tool-specific formats
3. Rules are injected into the appropriate config file format

## Rule Structure

Rules are markdown files with scope metadata. They can target specific
directories, file types, or project areas.

## Related Blog Posts

- [Cross-Tool AI Rules with Ruler](/ruler-cross-tool-ai-rules.html):
  setup and workflow
