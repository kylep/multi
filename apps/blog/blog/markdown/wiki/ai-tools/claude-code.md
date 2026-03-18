---
title: "Claude Code"
summary: "Anthropic's CLI for Claude — agentic coding assistant used across this project."
keywords:
  - claude
  - anthropic
  - cli
  - coding-assistant
last_verified: 2026-03-17
---

Claude Code is Anthropic's official CLI for Claude, used as the primary coding assistant across this project.

## Key Features

- Agentic task execution with tool use (read, edit, bash, search)
- Subagent delegation via the Agent tool
- Hook system for pre/post tool events
- MCP server integration
- Persistent memory via file-based memory system

## Hooks

Claude Code hooks are shell commands wired to lifecycle events in `~/.claude/settings.json`. Four hooks are active globally:

| Hook | Event | Purpose |
|------|-------|---------|
| `block-destructive` | `PreToolUse` | Blocks destructive shell commands (e.g. `rm -rf`, `DROP TABLE`) |
| `protect-sensitive` | `PreToolUse` | Prevents reads/writes to credential files and `.env` paths |
| `audit-log` | `PostToolUse` | Appends every completed tool call to an audit log |
| `permission-requests` | `PermissionRequest` | Logs every permission prompt for allowlist tuning |

### PermissionRequest hook — allowlist tuning

The `PermissionRequest` hook fires whenever Claude Code is about to show a permission prompt to the user. It logs the event to `~/.claude/permission-requests.log` as a tab-separated line:

```
<ISO-8601 timestamp>\t<tool_name>\t<tool_input JSON>
```

Example entry:

```
2026-03-17T14:22:05Z	Bash	{"command":"docker build -t myimage ."}
```

**Why:** Over time the log accumulates the full set of commands that hit permission prompts. Review it periodically to identify patterns and promote frequently-approved commands into the `allow` list in `settings.json`, reducing interruptions without sacrificing auditability.
