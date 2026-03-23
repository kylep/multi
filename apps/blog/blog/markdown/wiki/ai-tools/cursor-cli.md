---
title: "Cursor CLI (Agent)"
summary: "Cursor's headless CLI for running AI coding agents from the terminal, comparable to Claude Code's `claude -p`."
keywords:
  - cursor
  - cli
  - agent
  - headless
  - coding-assistant
related:
  - wiki/ai-tools/claude-code.html
  - wiki/ai-tools/index.html
scope: "Cursor Agent CLI: installation, authentication, headless usage, and model selection."
last_verified: 2026-03-22
---

Cursor's official CLI, invoked as `agent`, runs AI coding agents from the terminal
without opening the Cursor IDE. Released August 2025, it supports headless/print
mode for scripting, comparable to `claude -p` in Claude Code.

## Installation

```bash
curl https://cursor.com/install -fsS -o /tmp/cursor-install.sh
bash /tmp/cursor-install.sh
```

Binary installs to `~/.local/bin/agent` (symlinked from
`~/.local/share/cursor-agent/versions/<version>/cursor-agent`).

Ensure `~/.local/bin` is in your `PATH`.

## Authentication

Generate an API key at **cursor.com/dashboard/cloud-agents** under
**User API Keys > New API Key**.

Set the key as an environment variable:

```bash
export CURSOR_API_KEY="crsr_..."
```

Or pass inline:

```bash
agent --api-key "crsr_..." -p "your prompt"
```

The key is stored in `apps/blog/exports.sh` alongside other API keys.

## Headless mode

The `-p` / `--print` flag runs the agent non-interactively, printing output
to stdout — the direct equivalent of `claude -p`:

```bash
agent -p "list all TODO items in this repo"
```

### Key flags

| Flag | Purpose |
|------|---------|
| `-p` / `--print` | Non-interactive mode (required for headless) |
| `--trust` | Skip workspace trust prompt |
| `-f` / `--force` / `--yolo` | Auto-approve file writes and shell commands |
| `--model <id>` | Choose a specific model |
| `--mode plan` | Read-only planning mode (no edits) |
| `--mode ask` | Q&A mode (read-only) |
| `--workspace <path>` | Set the working directory |
| `--output-format json` | JSON output for scripting |
| `--output-format stream-json` | NDJSON streaming output |
| `--resume [chatId]` | Resume a previous session |
| `--continue` | Continue the most recent session |
| `-w` / `--worktree` | Run in an isolated git worktree |

### Examples

Ask a question without making changes:

```bash
agent -p --mode ask "explain the authentication flow in this codebase"
```

Run a task with auto-approval:

```bash
agent -p --force "add input validation to the signup form"
```

Use a specific model:

```bash
agent -p --model claude-4.6-sonnet-medium "refactor this function"
```

Get JSON output for piping:

```bash
agent -p --output-format json "list all API endpoints" | jq '.response'
```

## Available models

Run `agent --list-models` to see all available models. Notable options on the
Pro plan:

| Model ID | Description |
|----------|-------------|
| `auto` | Auto-select (default) |
| `claude-4.6-opus-high-thinking` | Opus 4.6 1M Thinking |
| `claude-4.6-sonnet-medium` | Sonnet 4.6 1M |
| `claude-4.6-opus-high` | Opus 4.6 1M |
| `gpt-5.4-medium` | GPT-5.4 1M |
| `gemini-3.1-pro` | Gemini 3.1 Pro |

## Comparison with Claude Code

| Feature | Claude Code | Cursor CLI |
|---------|------------|------------|
| Headless flag | `claude -p "prompt"` | `agent -p "prompt"` |
| Agent definitions | `.claude/agents/*.md` | `.cursor/rules` |
| Named agents | `claude --agent foo -p "..."` | Not supported (use rules) |
| Auto-approve | `--dangerously-skip-permissions` | `--force` / `--yolo` |
| MCP support | Yes | Yes |
| Session resume | `--resume` / `--continue` | `--resume` / `--continue` |
| Worktrees | Yes | Yes (`-w`) |
| Model selection | `--model` | `--model` |

## Cloud Agents (remote)

Cloud Agents run in Cursor's cloud VMs and require:

- Privacy Mode disabled (incompatible with Legacy Privacy Mode)
- GitHub or GitLab connected
- On-demand usage enabled with a spend limit

REST API at `https://api.cursor.com/v0/agents` — see
[Cloud Agents API docs](https://cursor.com/docs/cloud-agent/api/overview).

Currently not usable on this account due to Legacy Privacy Mode.

## Limitations

- No named agent definitions like Claude Code's `--agent <name>` — use
  `.cursor/rules` files for per-repo instructions instead.
- Cloud Agents require Privacy Mode off, which this account has enabled.
- The CLI is still in beta.
- Pro plan quota applies to CLI usage.
