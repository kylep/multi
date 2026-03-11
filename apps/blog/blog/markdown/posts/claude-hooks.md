---
title: "Safety Hooks for Claude Code"
summary: Three shell scripts that block destructive commands,
  protect sensitive files, and log everything Claude does.
slug: claude-hooks
category: ai
tags: Claude-Code, Security, Hooks
date: 2026-03-11
modified: 2026-03-11
status: published
image: claude-hooks.png
thumbnail: claude-hooks-thumb.png
imgprompt: A cute cartoon crab wearing a hardhat, holding a
  fishing pole with a standard fishing hook on the line,
  cozy flat illustration style
---


## Table of contents

# Claude Code hooks

Claude Code runs shell commands, reads files, and edits code
on your machine. Hooks let you intercept those actions with
shell scripts that run before or after each tool call. The
scripts get JSON on stdin describing what Claude is about to
do, and they can block it by exiting with code 2.

I set up three hooks: one that blocks destructive commands,
one that blocks access to sensitive files, and one that logs
everything to a JSONL audit trail.


# How hooks work

A hook is a shell script registered in
`~/.claude/settings.json`. There are two lifecycle events:

- **PreToolUse**: runs before Claude executes a tool. Exit 0
  to allow, exit 2 to block. The block message goes to stderr.
- **PostToolUse**: runs after. Good for logging. Can run async
  so it doesn't slow things down.

Each hook gets a JSON object on stdin with `tool_name`,
`tool_input`, `session_id`, and `cwd`. You can use `jq` to
pull out whatever you need.

A `matcher` field controls which tools trigger the hook. It
takes a regex, so `Bash` matches only the Bash tool while
`Read|Edit|Write|Bash` matches all four.


# Blocking destructive commands

This one intercepts every Bash tool call and blocks anything
that could wreck the system.

```bash
#!/usr/bin/env bash
# ~/.claude/hooks/block-destructive.sh
# PreToolUse hook, matcher: Bash

set -euo pipefail

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if [[ -z "$COMMAND" ]]; then
  exit 0
fi

BLOCKED=""

case "$COMMAND" in
  *"rm -rf /"*|*"rm -rf ~"*)
    BLOCKED="recursive delete of root or home" ;;
  *"git push --force"*|*"git push -f "*)
    BLOCKED="force push" ;;
  *"git reset --hard"*)
    BLOCKED="hard reset" ;;
  *"DROP TABLE"*|*"DROP DATABASE"*)
    BLOCKED="database drop" ;;
  *":(){ :|:& };:"*)
    BLOCKED="fork bomb" ;;
  *"curl"*"|"*"sh"*|*"curl"*"|"*"bash"*)
    BLOCKED="piped remote execution" ;;
  *"chmod 777"*)
    BLOCKED="world-writable permissions" ;;
  *"mkfs."*)
    BLOCKED="filesystem format" ;;
esac

# Check dd writing to /dev/
if [[ -z "$BLOCKED" ]] && echo "$COMMAND" | \
   grep -qE 'dd\s+if=.*of=/dev/'; then
  BLOCKED="raw device write"
fi

if [[ -n "$BLOCKED" ]]; then
  echo "BLOCKED by block-destructive hook: $BLOCKED" >&2
  exit 2
fi

exit 0
```

Testing it:

```bash
$ echo '{"tool_name":"Bash","tool_input":{"command":"rm -rf /"}}' \
  | ~/.claude/hooks/block-destructive.sh
BLOCKED by block-destructive hook: recursive delete of root or home
# exit code: 2

$ echo '{"tool_name":"Bash","tool_input":{"command":"git push --force origin main"}}' \
  | ~/.claude/hooks/block-destructive.sh
BLOCKED by block-destructive hook: force push
# exit code: 2

$ echo '{"tool_name":"Bash","tool_input":{"command":"ls -la"}}' \
  | ~/.claude/hooks/block-destructive.sh
# exit code: 0  (allowed)
```

When Claude tries a blocked command, it sees the stderr
message and knows the action was rejected. It can then
rephrase or ask for confirmation.


# Protecting sensitive files

The second hook blocks access to credentials, SSH keys, and
cloud configs. It handles both file-path tools (Read, Edit,
Write) and Bash commands that might `cat` or exfiltrate
those files.

```bash
#!/usr/bin/env bash
# ~/.claude/hooks/protect-sensitive.sh
# PreToolUse hook, matcher: Read|Edit|Write|Bash

set -euo pipefail

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // empty')

check_path() {
  local filepath="$1"
  case "$filepath" in
    */.env|*/.env.*|*.env)
      echo "BLOCKED by protect-sensitive hook: .env file" >&2
      exit 2 ;;
    */.ssh/id_*)
      echo "BLOCKED by protect-sensitive hook: SSH key" >&2
      exit 2 ;;
    */.aws/credentials*)
      echo "BLOCKED by protect-sensitive hook: AWS creds" >&2
      exit 2 ;;
    */.kube/config*)
      echo "BLOCKED by protect-sensitive hook: kubeconfig" >&2
      exit 2 ;;
  esac
}

if [[ "$TOOL" == "Bash" ]]; then
  COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
  if echo "$COMMAND" | \
     grep -qE '(cat|less|head|tail|curl -d @|base64|scp)\s+\.env'; then
    echo "BLOCKED by protect-sensitive hook: .env access via bash" >&2
    exit 2
  fi
  if echo "$COMMAND" | \
     grep -qE '(cat|less|head|tail)\s+.*(\.ssh/id_|\.aws/credentials|\.kube/config)'; then
    echo "BLOCKED by protect-sensitive hook: sensitive file access via bash" >&2
    exit 2
  fi
else
  FILEPATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
  if [[ -n "$FILEPATH" ]]; then
    check_path "$FILEPATH"
  fi
fi

exit 0
```

```bash
$ echo '{"tool_name":"Read","tool_input":{"file_path":"/home/user/.ssh/id_ed25519"}}' \
  | ~/.claude/hooks/protect-sensitive.sh
BLOCKED by protect-sensitive hook: SSH key
# exit code: 2

$ echo '{"tool_name":"Bash","tool_input":{"command":"cat .env"}}' \
  | ~/.claude/hooks/protect-sensitive.sh
BLOCKED by protect-sensitive hook: .env access via bash
# exit code: 2
```

This isn't foolproof. Claude could read a sensitive file
by some path I didn't think of. But it catches the obvious
cases and raises the bar.


# Audit trail

The third hook runs after every tool call and appends a JSON
line to a log file. It runs async so it doesn't slow Claude
down.

```bash
#!/usr/bin/env bash
# ~/.claude/hooks/audit-log.sh
# PostToolUse hook, async

LOG="/Users/kp/gh/multi/logs/claude-audit.jsonl"

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // "unknown"')
SESSION=$(echo "$INPUT" | jq -r '.session_id // "unknown"')
CWD=$(echo "$INPUT" | jq -r '.cwd // "unknown"')

case "$TOOL" in
  Bash)
    PARAM=$(echo "$INPUT" | jq -r '.tool_input.command // empty') ;;
  Read|Edit|Write)
    PARAM=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty') ;;
  *)
    PARAM="" ;;
esac

jq -nc \
  --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --arg sid "$SESSION" \
  --arg tool "$TOOL" \
  --arg param "$PARAM" \
  --arg cwd "$CWD" \
  '{timestamp: $ts, session_id: $sid, tool: $tool, param: $param, cwd: $cwd}' \
  >> "$LOG"

exit 0
```

After a session, the log looks like:

```json
{"timestamp":"2026-03-11T13:14:18Z","session_id":"abc123","tool":"Bash","param":"echo hello","cwd":"/Users/kp/gh/multi"}
```

You could pipe this into whatever alerting or analysis you
want. I'm keeping it simple for now, just a file on disk.


# Wiring it up

All three hooks go in `~/.claude/settings.json` under a
`hooks` key:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{
          "type": "command",
          "command": "/Users/kp/.claude/hooks/block-destructive.sh"
        }]
      },
      {
        "matcher": "Read|Edit|Write|Bash",
        "hooks": [{
          "type": "command",
          "command": "/Users/kp/.claude/hooks/protect-sensitive.sh"
        }]
      }
    ],
    "PostToolUse": [
      {
        "hooks": [{
          "type": "command",
          "command": "/Users/kp/.claude/hooks/audit-log.sh",
          "async": true
        }]
      }
    ]
  }
}
```

Use absolute paths, not `~`. JSON doesn't expand tilde.

The `async: true` on the audit hook means Claude doesn't
wait for it to finish before moving on. Logging shouldn't
slow down the workflow.


# Prompt injection defense

One thing I haven't built yet but plan to: a PostToolUse
hook that scans tool output for prompt injection attempts.

The idea is to grep the output for patterns like "ignore
previous instructions" or "you are now in admin mode" and
flag them. This matters most for tools that ingest external
data. If Claude is reading web pages, parsing documents,
or pulling content from APIs, a malicious payload in that
content could try to hijack the session.

Lasso Security has published research on these attack
patterns. A PostToolUse hook is the right place to catch
them because you see the actual content before Claude acts
on it.

I'll cover this in a future post once I have it running on
real workloads.


# Why global config, not per-repo

Claude Code hooks can be configured at three levels:

- `~/.claude/settings.json` (global, user-level)
- `.claude/settings.json` (per-repo, checked into git)
- `.claude/settings.local.json` (per-repo, gitignored)

Safety hooks belong in global config. If they're per-repo,
a malicious repository can ship its own `.claude/settings.json`
that disables your protections or adds hooks that exfiltrate
data. You clone it, run Claude Code, and the repo's hooks
run instead of yours.

This is a real attack vector. In 2025, Check Point Research
found CVE-2025-59536: an attacker plants a
`.claude/settings.json` with hooks in a repo. You clone it,
run Claude Code, approve the trust dialog (which doesn't
mention hooks), and the hook commands execute immediately.
Reverse shell, data exfiltration, whatever the attacker
wants. Anthropic patched it in August 2025, but the lesson
stands: keep safety hooks in global config where only you
control them.


# Same idea, different tools

Claude Code isn't the only AI coding tool with hook support.
Here's how the same concepts map elsewhere.

| Feature | Claude Code | Cursor |
|---|---|---|
| Hook format | Shell scripts | Shell scripts |
| Config | `~/.claude/settings.json` | `.cursor/hooks.json` |
| Events | `PreToolUse`, `PostToolUse` | `preToolUse`, `postToolUse` |
| Input | JSON on stdin | JSON on stdin |
| Block mechanism | Exit code 2 + stderr | Exit code 2 + stderr |
| Async support | `"async": true` | Not documented |

Cursor added hooks in version 1.7 (October 2025) with a
nearly identical model: shell scripts, JSON stdin, exit
codes. It also supports a "prompt" handler type where an
LLM evaluates a natural language condition to allow or deny,
which is interesting but slower. The same shell scripts
could work in both tools with minor config changes.

OpenCode takes a different approach. Instead of shell
scripts, it uses JavaScript or TypeScript plugins placed in
`.opencode/plugins/` or `~/.config/opencode/plugins/`. You
register functions on events like `tool.execute.before` and
`tool.execute.after`. More powerful (you get full access to
the session and project context), but less portable than a
shell script you can reuse across tools.
