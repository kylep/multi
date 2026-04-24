---
title: "Claude Code Cheat-Sheet"
summary: A dense reference for the Claude Code CLI. Flags, slash commands,
  keyboard shortcuts, hook events, subagents, MCP, skills, settings.json
  patterns, and the gotchas the docs don't highlight.
slug: claude-code-cheat-sheet
category: ai
tags: Claude-Code, AI, reference, CLI
date: 2026-04-19
modified: 2026-04-19
status: published
image: claude-code-cheat-sheet.png
thumbnail: claude-code-cheat-sheet-thumb.png
imgprompt: A cute cartoon sea otter at a desk holding a laminated cheat-sheet
  card with code symbols on it, cozy flat illustration style, solid pastel
  colors
keywords:
  - claude code cheat sheet
  - claude code slash commands reference
  - claude code cli flags
  - claude code hooks events
  - claude code permissions syntax
  - claude code settings json
---


## Table of contents


# Terminology

Useful to know what these are

| Term | What it means |
|------|---------------|
| Turn | One back-and-forth with the model. Claude generates a response (possibly with tool calls), reads the results, then generates again. Each of those generation steps counts as a turn. |
| Context (or context window) | The running transcript the model can see on a given turn: your messages, its messages, tool calls, tool results, system prompt, `CLAUDE.md`, loaded skills. Finite size, measured in tokens. |
| Compaction | When the context window fills up, Claude Code summarizes older history in-place to free space. Triggered automatically or via `/compact`. |
| Headless / print mode | Running `claude -p "prompt"` so it answers and exits instead of opening the TUI. The entry point for scripts and CI. |
| Frontmatter | The YAML block between `---` markers at the top of a markdown file. Carries config like `name`, `description`, `tools`. |
| Hook | A shell command Claude Code runs at a lifecycle event (tool use, session start, etc.) to allow, block, or modify the action. Deterministic, not LLM-based. |
| Subagent | A child agent spawned from the main conversation. Runs in its own context window with its own tools and system prompt. Returns a summary. |
| Plan mode | Read-only exploration mode. Claude can search and read but cannot edit or run shell commands. |


# Operating the Claude Code CLI

## Launch Claude in Kubernetes

Install it in a Dockerfile.

Collect the value for `CLAUDE_CODE_OAUTH_TOKEN`.
```bash
claude setup-token
```

Run the container in k8s with `CLAUDE_CODE_OAUTH_TOKEN` env var set. Execute the
`claude` command in prompt mode.

```bash
claude \
  --output-format json \
  --m opus \
  -p $CLAUDE_PROMPT

```

You'll probably also want to use `--permission-mode auto` or `--dangerously-skip-permissions`
too so it doesn't freeze on permission requests.

| Flag | What it does |
|------|--------------|
| `-p`, `--print` | Non-interactive mode: print the response and exit. The SDK / CI entry point. |
| `--output-format <text\|json\|stream-json>` | Print-mode output format. |
| `--input-format <text\|stream-json>` | Print-mode input format. |
| `-m`, `--model <alias\|id>` | Pick model for this session (`sonnet`, `opus`, `haiku`, or a full ID like `claude-opus-4-7`). |
| `--effort <level>` | `low`, `medium`, `high`, `xhigh`, `max`. Works on Opus 4.7, Opus 4.6, Sonnet 4.6. |
| `--mcp-config <path\|json>` | Load MCP servers from file(s) or a JSON string. Repeatable. |
| `--strict-mcp-config` | Only use servers from `--mcp-config`, ignore project/user configs. |
| `--json-schema '<schema>'` | Constrain print-mode output to match a JSON Schema. |
| `--max-turns <n>` | Cap agentic turns in print mode. Exits with error when hit. |
| `--max-budget-usd <amount>` | Cap API spend in print mode. |
| `--no-session-persistence` | Don't write session to disk. Print mode only. |
| `--system-prompt "text"` | Replace the default system prompt. |
| `--append-system-prompt "text"` | Append to the default system prompt. |
| `--system-prompt-file <path>` | Same, from a file. Paired `--append-system-prompt-file` exists. |
| `--verbose` | Full turn-by-turn output. |
| `--debug [categories]` | Debug mode, optional filter like `"api,hooks"` or `"!statsig"`. |

Note: `--system-prompt` and `--system-prompt-file` are mutually exclusive;
`--append-*` variants compose with either.

Then run it, for example



## Deciding to use Skills vs Agents

Skills are procedures, agents are workers.

A skill is a directory containing a `SKILL.md` prompt, plus any scripts,
templates, or reference docs it ships alongside. When the skill triggers,
only `SKILL.md` gets injected into your current conversation as an extra
message. Claude sees it alongside everything else already in the chat,
and the skill's instructions apply for the rest of the session. The
supporting files sit in the skill directory and don't enter context
unless `SKILL.md` tells Claude to read them with the Read tool or run
them via Bash.

An agent runs in its own context window with its own system prompt, tool
allowlist, model, and permissions. It works independently and returns
only a summary. Only the agent's name and description sit in the parent
conversation's context. The body stays out until the agent actually
runs, and even then it only shows up in the agent's own window.

Rule of thumb:

| If the work... | Lean |
|----------------|------|
| Is a repeatable recipe (commit style, how to run a migration) | Skill |
| Produces a lot of intermediate output you won't reference again | Agent |
| Needs to read what's already in the conversation | Skill |
| Should run on a different model (Haiku for cost, Opus for brains) | Agent |
| Needs a tighter tool or permission scope than the parent | Agent |
| Bundles shell scripts, templates, or reference files | Skill |
| Iterates autonomously over many turns before returning | Agent |
| Is one short instruction block that could live in `CLAUDE.md` | Skill |

Default to a skill. If it keeps dumping logs or file contents into your
main window, promote it to an agent. The cost of a skill that should have
been an agent is a bloated parent context. The cost of an agent that
should have been a skill is an extra round trip and less visibility into
what actually happened.



## Defining Claude Agents

Agents, in this context, are just .md files with a special spec. You can find them in two places:
 - Project (repo): `.claude/agents/<name>.md`
 - Personal (global): `~/.claude/agents/<name>.md`

An agent file is just some YAML frontmatter metadata props and a markdown body containing the prompt.
Only `name` and `description` are required.

Parent conversations load each available subagent's name and description so the orchestrator can decide when to delegate.

```yaml
---
# Required
name: code-reviewer                 # lowercase + hyphens, unique
description: Reviews diffs for bugs, style, and security. Use after any code change.

# Tool and capability gates
tools: [Read, Grep, Bash]           # omit to inherit everything
disallowedTools: [Bash(rm *)]       # subtractive, applied after `tools`
mcpServers: [slack]                 # server name, or inline MCP config
skills: [code-review]               # full skill content gets injected at startup

# Model and execution
model: sonnet                       # sonnet|opus|haiku|<full-id>|inherit (default: inherit)
effort: medium                      # low|medium|high|xhigh|max
maxTurns: 20                        # agentic turn cap
background: false                   # true = always run as a background task
isolation: worktree                 # runs in a throwaway git worktree

# Permissions and lifecycle
permissionMode: acceptEdits         # default|acceptEdits|auto|dontAsk|bypassPermissions|plan
hooks:                              # PreToolUse | PostToolUse | Stop, scoped to this agent
  PreToolUse:
    - matcher: Bash
      command: ./scripts/log-tool-use.sh
memory: project                     # user|project|local persistent memory

# UX
color: blue                         # red|blue|green|yellow|purple|orange|pink|cyan
initialPrompt: "Start by listing changed files."  # auto-submitted when run via --agent
---

You are a code reviewer. Read the diff, then...
```

Scope precedence, highest to lowest: managed org settings, `--agents` CLI
flag, `.claude/agents/` (project), `~/.claude/agents/` (personal), plugin
agents.


You can call agents from within claude conversationally, or from the command-line
as entrypoints with `claude --agent <name>`.


## Managing Permissions

Permission prompts can slow you down. For a while I tried to grant permissions to every
litle thing, feels best-practice, but its so slow. I mostly just use permission-mode
auto now.

| Flag | What it does |
|------|--------------|
| `--permission-mode <mode>` | `default`, `acceptEdits`, `plan`, `auto`, `dontAsk`, `bypassPermissions`. |
| `--dangerously-skip-permissions` | Equivalent to starting in `bypassPermissions`. Read the name. |
| `--allowedTools "Bash(git log *)" Read` | Tools that run without prompting. Space-separated list. |
| `--disallowedTools "Bash(curl *)"` | Tools removed from context entirely. Applied before allow. |
| `--tools "Bash,Edit,Read"` | Restrict the built-in tools Claude can see. `""` disables all of them. |
| `--add-dir <path>` | Grant file access to an additional directory outside CWD. |


## Worktrees

A worktree is [git concept](https://git-scm.com/docs/git-worktree),
it basically lets you work on more than one branch at a time. You'll see it saved to `.claude/worktrees/`.
Don't forget to gitignore them.

| Flag | What it does |
|------|--------------|
| `-w`, `--worktree <name>` | Start in a git worktree at `<repo>/.claude/worktrees/<name>`. |
| `--tmux` | Pair with `--worktree` to open in a tmux pane. |

I personally use this with multiple tmux sessions across a single repo so I can work
on more than one thing at a time. You do end up with the usual merge conflict situation,
but claude's pretty good about sorting that out on its own too.

I'm personally a tmux nerd, I'm genuinely just a happier person with tmux running, so
the `--tmux` flag existing is exciting to me. It's kind of janky though, it claims it
should open a pane but at the time of my writing this it opens it into a new session
and puts the original pane you ran it in into a blocking state, so personally I'd
just manage the worktrees myself for now.



## Session Management

Often you need to quit to reload MCP tools or reboot. You might also want to just
revisit an prior conversation. Sessions are saves of where your context left off.

Show current session UUID:
```bash
ls -t ~/.claude/projects/$(pwd | sed 's|/|-|g')/*.jsonl | head -1
```


When you `exit` a claude session it'll often print the `--resume` command for you at
the bottom. If you missed it, you can use `claude --continue` to jump back in:

```bash
claude
> do the thing
> exit
claude --continue
```


| Flag | What it does |
|------|--------------|
| `-c`, `--continue` | Resume the most recently exited conversation in the current directory. Basically -r with the arg pre-filled |
| `-r`, `--resume [name\|id]` | Resume a specific session by name or UUID, or open an interactive picker. |
| `--fork-session` | With `--resume` or `-c`, create a new session ID instead of reusing the old one. Good for branching. |
| `--session-id <uuid>` | Use a specific UUID for the session. |


### Forking sessions
It's like starting claude twice in the same directory, but without using worktrees.
The changes all go to the same branches and locations on the filesystem.
You resume from where the most recent session lefto off.

```bash
claude # or if you plan ahead, "claude --name foobarbaz"
> do the foo
> /rename foobarbaz  # if you didn't set the name ahead of time

... # in another window
claude --fork-session --resume foobarbaz
```

I you just do `--resume` it'll let you pick from session history, and `-c` picks the newest.

**When to use session forking**:
- Comparison experiments. Fork the same checkpoint twice with different --model or --effort flags and see which one handles the task better.
- When you've built up context and want to try different approaches to making plans, then pick the winner to implement
- You need to `/compact` but you're afraid of losing something important
- Setup templating where you want to use the context like you'd use a skill/agent/md file for one-off type templated work



### When to set Session ID manually

Example:
```bash
SESSION=$(uuidgen)
claude --session-id $SESSION
```

- Orchestrating from a script: you generate the UUID yourself, hand it to Claude, and immediately know where the transcript file will land (`~/.claude/projects/<cwd>/<uuid>.jsonl`).
  You can tail -f it, attach a log shipper, or register a webhook against it without polling the filesystem to figure out which file is "yours."
- Well-known session per job: a CI pipeline that wants "the session for PR #123" can hash the PR number into a deterministic UUID. Every job in the pipeline runs claude
  --session-id $uuid -c ... and they're all appending to the same transcript, reviewable in one place.
- Idempotency: if a CronJob retries, passing the same UUID resumes the prior run's conversation instead of starting a fresh one. Without it, a retry creates a brand-new session and
  you lose the cache + continuity.
- Dashboards / cross-system links: external UIs that want to link to a session (e.g., Linear comment → transcript) need the ID at creation time. If Claude picks the UUID, the
  external system has to race to discover it.
- Testing: integration tests that want predictable file paths.








# Slash commands

There are a lot of these, here's some good ones. Special shout-out to `btw`.


| Command | What it does |
|---------|--------------|
| `/clear` (aliases `/reset`, `/new`) | Start a fresh conversation. Previous one is still resumable. |
| `/compact [instructions]` | Summarize to free context. Optional hint focuses the summary. |
| `/context` | Visualize current context usage as a colored grid. |
| `/model [alias]` | Change model. Left/right arrows adjust effort in the picker. |
| `/effort [level]` | `low`/`medium`/`high`/`xhigh`/`max`/`auto`. No arg opens a slider. |
| `/plan [description]` | Enter plan mode. |
| `/agents` | Open subagent manager. Left and right to nav. CRUD or run from here. |
| `/hooks` | View hook configs. |
| `/permissions` (alias `/allowed-tools`) | Manage allow/ask/deny rules. |
| `/memory` | Edit CLAUDE.md files, toggle auto-memory, view auto-memory entries. |
| `/mcp` | Manage MCP server connections and OAuth. |
| `/skills` | List available skills. Press `t` to sort by token count. |
| `/resume` (alias `/continue`) | Resume a conversation by ID/name or via picker. |
| `/rewind` (aliases `/checkpoint`, `/undo`) | Rewind conversation and code to a previous point. |
| `/branch [name]` (alias `/fork`) | Branch current conversation. |
| `/btw <question>` | Ask a side question that doesn't get added to history. |
| `/review [PR]` | Review a PR locally. |
| `/security-review` | Analyze pending branch changes for security issues. |
| `/cost` | Token usage stats. |
| `/usage` | Plan usage limits and rate-limit status. |
| `/doctor` | Diagnose the installation. |

## Setup and environment

| Command | What it does |
|---------|--------------|
| `/init` | Initialize the project with a CLAUDE.md. |
| `/config` (alias `/settings`) | Open the Settings TUI. |
| `/status` | Settings Status tab: version, model, account, connectivity. |
| `/add-dir <path>` | Add a working directory mid-session. |
| `/keybindings` | Open or create the keybindings config file. |
| `/statusline` | Configure the status line. |
| `/terminal-setup` | Install Shift+Enter binding for VS Code / Alacritty / Zed / Warp. |
| `/theme` | Switch theme (auto, light, dark, colorblind, ANSI). |
| `/tui [default\|fullscreen]` | Terminal UI renderer. |
| `/login`, `/logout` | Auth. |
| `/release-notes` | Changelog picker. |

## Session management and viewing

| Command | What it does |
|---------|--------------|
| `/rename [name]` | Rename current session. |
| `/export [filename]` | Export conversation as plain text. |
| `/copy [N]` | Copy the Nth-to-last assistant response to clipboard (0 = last). |
| `/diff` | Interactive diff viewer for uncommitted and per-turn changes. |
| `/tasks` (alias `/bashes`) | Manage background tasks. |
| `/recap` | One-line session summary on demand. |
| `/stats` | Daily usage, session history, streaks. |
| `/insights` | Report analyzing your Claude Code sessions. |
| `/focus` | Toggle focus view (fullscreen renderer only). |
| `/color <name>` | Prompt bar color: `red`, `blue`, `green`, `yellow`, `purple`, `orange`, `pink`, `cyan`. |

## Skills that ship in the box

These are bundled skills, not hard-coded commands. They're prompt-driven
and you can see the source via `/skills`.

| Command | What it does |
|---------|--------------|
| `/simplify [focus]` | Review changed files and fix quality/efficiency issues. |
| `/batch <instruction>` | Orchestrate large-scale parallel changes across the codebase. |
| `/debug [description]` | Enable debug logging and troubleshoot. |
| `/loop [interval] [prompt]` (alias `/proactive`) | Run a prompt repeatedly. |
| `/claude-api` | Load Claude API reference for the session's language. |
| `/fewer-permission-prompts` | Scan transcripts and propose allowlist entries. |

## Integrations and misc

| Command | What it does |
|---------|--------------|
| `/ide` | Manage IDE integrations. |
| `/chrome` | Configure Claude in Chrome. |
| `/desktop` (alias `/app`) | Continue in Claude Code Desktop. |
| `/mobile` (aliases `/ios`, `/android`) | QR code to download the mobile app. |
| `/install-github-app` | Set up Claude GitHub Actions app. |
| `/install-slack-app` | Install Claude Slack app. |
| `/remote-control` (alias `/rc`) | Expose session to remote control. |
| `/teleport` (alias `/tp`) | Pull a web session into this terminal. |
| `/ultraplan <prompt>` | Draft plan in ultraplan session, execute remotely. |
| `/ultrareview [PR]` | Multi-agent cloud code review. |
| `/autofix-pr [prompt]` | Spawn web session to push fixes when CI fails. |
| `/schedule [description]` (alias `/routines`) | Create/list/run routines. |
| `/plugin`, `/reload-plugins` | Plugin management. |
| `/sandbox` | Toggle sandbox mode (supported platforms only). |
| `/voice` | Push-to-talk voice dictation. |

## MCP prompts

Connected MCP servers expose their prompts as `/mcp__<server>__<prompt>`.
These appear dynamically in the `/` menu.

## Removed, so stop typing them

- `/vim`: removed in v2.1.92. Use `/config` → Editor mode.
- `/pr-comments`: removed in v2.1.91. Ask Claude directly.


# Keyboard shortcuts

## General

| Key | Effect |
|-----|--------|
| `Esc` | Cancel the current generation. |
| `Esc` `Esc` | Rewind to a previous checkpoint (conversation and code). |
| `Shift+Tab` (or `Alt+M`) | Cycle permission modes: default → acceptEdits → plan → auto → bypassPermissions. |
| `Ctrl+C` | Cancel current input or generation. |
| `Ctrl+D` | Exit the session. |
| `Ctrl+L` | Clear the prompt input and redraw (keeps history). |
| `Ctrl+R` | Reverse search command history. |
| `Ctrl+O` | Toggle transcript viewer. |
| `Ctrl+B` | Background the running bash task. In tmux, press twice. |
| `Ctrl+T` | Toggle task list in the status area. |
| `Ctrl+X Ctrl+K` | Kill all background agents. Press twice within 3s to confirm. |
| `Ctrl+G` or `Ctrl+X Ctrl+E` | Open the current prompt in `$EDITOR`. |
| `Option+P` / `Alt+P` | Switch model without clearing the prompt. |
| `Option+T` / `Alt+T` | Toggle extended thinking. |
| `Option+O` / `Alt+O` | Toggle fast mode. |

## Input and editing

| Key | Effect |
|-----|--------|
| `Ctrl+A` / `Ctrl+E` | Start / end of line. |
| `Ctrl+K` | Delete to end of line. |
| `Ctrl+U` | Delete to start of line. |
| `Ctrl+W` | Delete previous word. |
| `Ctrl+Y` | Paste last deleted text. |
| `Alt+Y` (after `Ctrl+Y`) | Cycle paste history. |
| `Alt+B` / `Alt+F` | Back / forward a word. |

## Multiline input

| Terminal | Newline binding |
|----------|-----------------|
| Any terminal | `\` then `Enter` |
| macOS default | `Option+Enter` |
| iTerm2, WezTerm, Ghostty, Kitty | `Shift+Enter` (no config needed) |
| VS Code, Alacritty, Zed, Warp | Run `/terminal-setup` to install `Shift+Enter` |
| Control sequence (anywhere) | `Ctrl+J` |

## Prefix triggers

| Prefix | What it does |
|--------|--------------|
| `/` | Slash commands and skills. |
| `!` | Bash mode: run a shell command and add the output to context. |
| `@` | File path autocomplete. |
| Hold `Space` | Push-to-talk dictation (if `/voice` is on). |

Note: On macOS, `Alt+*` bindings require setting Left Option = Esc+ in your
terminal (iTerm2 → Profiles → Keys). Otherwise none of the `Alt+` shortcuts
fire.


# Hooks

Hooks are shell commands Claude Code runs at specific lifecycle events.
Deterministic, not LLM-based. You wire them up in `settings.json`, they
receive JSON on stdin (including `session_id`, `tool_name`, arguments),
and their exit code or JSON output can allow, block, or modify the action.

Typical uses:

- Block `rm -rf` or edits to `.env` (`PreToolUse` + exit 2).
- Run `prettier` or `gofmt` after every Edit (`PostToolUse`).
- Inject the current git branch into every prompt (`UserPromptSubmit`).
- Ping Discord when the session finishes (`Stop`).
- Gatekeep a single subagent's tool calls (hook in that agent's frontmatter).

The `/hooks` slash command shows what's registered and where each rule
came from (user, project, managed, or plugin).

## Events

Every supported hook event, whether it accepts a matcher, and common
matcher values. I've used `PreToolUse` and `SessionStart` the most.

| Event | Matcher | Matcher values (partial) |
|-------|---------|--------------------------|
| `SessionStart` | yes | `startup`, `resume`, `clear`, `compact` |
| `SessionEnd` | yes | `clear`, `resume`, `logout`, `prompt_input_exit`, `bypass_permissions_disabled`, `other` |
| `UserPromptSubmit` | no | n/a |
| `PreToolUse` | yes | tool names (e.g. `Bash`, `Edit`, regex like `^Bash`) |
| `PostToolUse` | yes | tool names |
| `PostToolUseFailure` | yes | tool names |
| `PermissionRequest` | yes | tool names |
| `PermissionDenied` | yes | tool names |
| `Stop` | no | n/a |
| `StopFailure` | yes | `rate_limit`, `authentication_failed`, `billing_error`, `invalid_request`, `server_error`, `max_output_tokens`, `unknown` |
| `SubagentStart` | yes | agent type names |
| `SubagentStop` | yes | agent type names |
| `Notification` | yes | `permission_prompt`, `idle_prompt`, `auth_success`, `elicitation_dialog` |
| `PreCompact` | yes | `manual`, `auto` |
| `PostCompact` | yes | `manual`, `auto` |
| `InstructionsLoaded` | yes | `session_start`, `nested_traversal`, `path_glob_match`, `include`, `compact` |
| `ConfigChange` | yes | `user_settings`, `project_settings`, `local_settings`, `policy_settings`, `skills` |
| `CwdChanged` | no | n/a |
| `FileChanged` | yes | literal filenames |
| `WorktreeCreate`, `WorktreeRemove` | no | n/a |
| `TaskCreated`, `TaskCompleted`, `TeammateIdle` | no | n/a |
| `Elicitation`, `ElicitationResult` | yes | MCP server names |

## Configuration shape

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash ~/.claude/hooks/deny-rm-rf.sh",
            "timeout": 5
          }
        ]
      }
    ]
  },
  "disableAllHooks": false
}
```

Four handler types: `command` (shell), `http` (POST to a URL),
`prompt` (ask Claude, use `$ARGUMENTS`), `agent` (spawn a subagent).
Common fields on any handler: `if` (permission-rule syntax), `timeout`
(seconds), `statusMessage`.

## Matcher syntax

- `"*"`, `""`, or omitted: match all.
- Only `[A-Za-z0-9_|]`: treated as exact string or `|`-separated list
  (`"Edit|Write"`).
- Anything else: treated as a JavaScript regex (`"^Bash"`,
  `"mcp__memory__.*"`).

## Exit codes for `command` hooks

| Exit | Effect |
|------|--------|
| 0 | Success. JSON on stdout is parsed for decisions. |
| 2 | Blocking error. stderr gets fed back to Claude, action blocked. |
| Other | Non-blocking error. Shown in transcript, action continues. |

## JSON output fields

```json
{
  "continue": true,
  "stopReason": "message if continue=false",
  "suppressOutput": false,
  "systemMessage": "shown to user",
  "decision": "block",
  "reason": "why",
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow|deny|ask|defer",
    "updatedInput": {},
    "additionalContext": "..."
  }
}
```

## Env available in hooks

- `$CLAUDE_PROJECT_DIR`: project root.
- `${CLAUDE_PLUGIN_ROOT}`: plugin install dir.
- `${CLAUDE_PLUGIN_DATA}`: plugin persistent data dir.
- `$CLAUDE_ENV_FILE`: for `SessionStart` / `CwdChanged` / `FileChanged`.

For a working set of hooks (deny destructive bash, protect `.env`, log
everything) see [Safety Hooks for Claude Code](/claude-hooks.html).


# Subagents

## Where they live, in order of precedence

1. Managed (organization) settings.
2. `--agents` CLI flag (JSON, session-only).
3. `.claude/agents/<name>.md` (project).
4. `~/.claude/agents/<name>.md` (personal).
5. Plugin `agents/` directory.

## File format

Markdown with YAML frontmatter:

```markdown
---
name: reviewer
description: Reviews blog drafts for style and sourcing. Use when a draft
  needs a style pass before publish.
tools: Read, Grep, Glob
model: inherit
permissionMode: default
---

You are a blog reviewer. Read the draft and check style + sourcing.
Return findings as markdown.
```

## Frontmatter fields

| Field | Notes |
|-------|-------|
| `name` | Required. Lowercase letters and hyphens. |
| `description` | Required. When Claude should delegate here. |
| `tools` | Allowlist. Omit to inherit all parent tools (including MCP). |
| `disallowedTools` | Applied before `tools`. |
| `model` | `sonnet`, `opus`, `haiku`, full ID, or `inherit` (default). |
| `permissionMode` | Standard mode names. |
| `maxTurns` | Cap agentic turns. |
| `skills` | Preload specific skills. Subagents do NOT inherit skills from the parent. |
| `mcpServers` | Inline definitions or references by name. |
| `hooks` | Hooks scoped to this subagent. |
| `memory` | `user`, `project`, or `local` for persistent memory scope. |
| `background` | `true` to always run as a background task. |
| `effort` | Override effort level. |
| `isolation` | `worktree` to run in an isolated git worktree. |
| `color` | Prompt color. |
| `initialPrompt` | Auto-submitted first user turn when run as main session agent. |

## Invocation

```bash
# Session-wide
claude --agent reviewer

# Setting
# .claude/settings.json → "agent": "reviewer"
```

During a conversation:

- Natural language: "Use the reviewer subagent to check this draft."
- @-mention: `@"reviewer (agent)"` forces that specific subagent.

Tool inheritance gotcha: `Agent(worker, researcher)` inside a `tools`
entry restricts which subagents the current agent may spawn. This only
takes effect when the agent runs as the main thread via `--agent`.

## Built-in subagents

| Name | Model | Tools | Purpose |
|------|-------|-------|---------|
| `Explore` | Haiku | read-only | File discovery, code search |
| `Plan` | inherit | read-only | Codebase research during plan mode |
| `general-purpose` | inherit | all | Multi-step tasks |
| `statusline-setup` | Sonnet | n/a | Used by `/statusline` |
| `Claude Code Guide` | Haiku | n/a | Answers feature questions |


# MCP servers

## Adding servers

```bash
# Remote, HTTP (recommended)
claude mcp add --transport http notion https://mcp.notion.com/mcp

# Remote, SSE (deprecated, use HTTP when the server supports it)
claude mcp add --transport sse <name> <url>

# Local, stdio
claude mcp add --env AIRTABLE_API_KEY=YOUR_KEY -- airtable \
  npx -y airtable-mcp-server
```

## Transports

| Transport | When |
|-----------|------|
| `http` (streamable-http) | Remote servers. Recommended. |
| `sse` | Legacy remote. Deprecated. |
| `stdio` | Local process. |
| `ws` | Only when defined inline in `.mcp.json`. |

## File locations

| File | Scope |
|------|-------|
| `~/.claude.json` | User + local scope (under `mcpServers`). |
| `.mcp.json` (project root) | Project scope. |
| `managed-mcp.json` (system dirs) | Org-managed. |

Project MCP servers live in `.mcp.json`, not `settings.json`.

## `.mcp.json` shape

```json
{
  "mcpServers": {
    "airtable": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "airtable-mcp-server"],
      "env": { "AIRTABLE_API_KEY": "..." }
    },
    "notion": {
      "type": "http",
      "url": "https://mcp.notion.com/mcp",
      "headers": { "Authorization": "Bearer ..." }
    }
  }
}
```

## Permission names for MCP tools

```text
mcp__<server>__<tool>        # specific tool
mcp__<server>                # all tools from that server
mcp__<server>__*             # same
mcp__.*__write.*             # regex: all write-ish tools from any server
```

## Gate MCP servers from settings.json

```json
{
  "enableAllProjectMcpServers": true,
  "enabledMcpjsonServers": ["memory", "github"],
  "disabledMcpjsonServers": ["filesystem"]
}
```


# Skills

Skills are the native Claude Code way to package reusable workflows. They
replaced `.claude/commands/*.md` (legacy commands still work but skills
take precedence on name collision).

## Where they live

| Location | Scope |
|----------|-------|
| Managed settings | All users in the org |
| `~/.claude/skills/<name>/SKILL.md` | Personal |
| `.claude/skills/<name>/SKILL.md` | Project |
| Plugin `skills/<name>/SKILL.md` | Where the plugin is enabled |

## Frontmatter

| Field | Notes |
|-------|-------|
| `name` | Slash command name. Defaults to the directory name. |
| `description` | Claude reads this to auto-invoke. Recommended. |
| `when_to_use` | Extra trigger context; appended to description. |
| `argument-hint` | Shown in autocomplete (e.g. `[issue-number]`). |
| `disable-model-invocation` | `true` = user-only; Claude won't auto-load it. |
| `user-invocable` | `false` = hide from the `/` menu. |
| `allowed-tools` | Tools auto-approved while the skill is active. |
| `model`, `effort` | Overrides for this skill. |
| `context` | `fork` to run in an isolated subagent. |
| `agent` | Which subagent when `context: fork`. |
| `hooks` | Hooks scoped to this skill. |
| `paths` | Globs limiting when the skill auto-activates. |
| `shell` | `bash` (default) or `powershell` for `!command` blocks. |

## Placeholders

- `$ARGUMENTS`: all args passed at invocation.
- `$ARGUMENTS[N]` or `$N`: specific argument, 0-indexed.
- `${CLAUDE_SESSION_ID}`, `${CLAUDE_SKILL_DIR}`.

## Shell injection

`` !`command` `` inside skill content runs the command before the skill
is sent to Claude; the output replaces the placeholder. Multi-line uses
a fenced ` ```! ` block. Turn off globally with
`disableSkillShellExecution: true` in settings.


# settings.json patterns

## Where settings.json lives

| File | Scope | Shared |
|------|-------|--------|
| `~/.claude/settings.json` | User | no |
| `.claude/settings.json` | Project | yes (git) |
| `.claude/settings.local.json` | Local project | no (gitignored) |
| `managed-settings.json` in system dirs | Org-managed | yes |

Precedence, highest to lowest: managed → CLI args → local → project → user.

## Top-level keys worth knowing

| Key | Effect |
|-----|--------|
| `agent` | Run the main thread as a named subagent. |
| `model` | Default model. |
| `availableModels` | Restrict which models users can pick. |
| `effortLevel` | Persist effort level across sessions. |
| `permissions` | Allow/ask/deny rules (see below). |
| `hooks` | Hook configuration. |
| `env` | Env vars applied to every session. |
| `disableAllHooks` | Kill switch for hooks. |
| `autoMemoryEnabled` | Auto-memory on/off. Default true. |
| `autoUpdatesChannel` | `"stable"` (1 week old) or `"latest"`. |
| `minimumVersion` | Floor for auto-updates. |
| `cleanupPeriodDays` | Session file retention. Default 30. |
| `defaultShell` | `"bash"` (default) or `"powershell"`. |
| `apiKeyHelper` | Script that produces the value for `X-Api-Key`. |
| `attribution` | Customize git commit / PR attribution. (`includeCoAuthoredBy` is deprecated.) |
| `enableAllProjectMcpServers` | Auto-approve every `.mcp.json` server. |
| `enabledMcpjsonServers` / `disabledMcpjsonServers` | Allow/deny specific MCP servers by name. |
| `statusLine` | Custom status-line config. |
| `tui` | `"default"` or `"fullscreen"`. |
| `viewMode` | `"default"`, `"verbose"`, `"focus"`. |
| `outputStyle` | Output style to tune the system prompt. |
| `language` | Preferred response language. |
| `claudeMdExcludes` | Globs of CLAUDE.md files to skip. Useful in monorepos. |
| `plansDirectory` | Where plans get saved. Default `~/.claude/plans`. |

Add this at the top of any settings.json for VS Code/Cursor autocomplete:

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json"
}
```


# Permissions

## Modes

| Mode | Behaviour |
|------|-----------|
| `default` | Prompts on first use of each tool. |
| `acceptEdits` | Auto-accepts edits and common filesystem commands in CWD. |
| `plan` | Read-only. Cannot modify files or run commands. |
| `auto` | Background classifier reviews commands. Research preview. |
| `dontAsk` | Auto-denies tools unless explicitly allowed. |
| `bypassPermissions` | Skips most prompts. Still prompts for writes to `.git`, `.claude`, `.vscode`, `.idea`, `.husky`. |

Cycle mid-session with `Shift+Tab`.

## Rule syntax

```jsonc
{
  "permissions": {
    "allow": [
      "Bash(npm run *)",
      "Read(~/.zshrc)",
      "Edit(/src/**/*.ts)"
    ],
    "ask":  ["Bash(git push *)"],
    "deny": [
      "WebFetch",
      "Bash(curl *)",
      "Read(./.env)"
    ],
    "additionalDirectories": ["../docs/"],
    "defaultMode": "acceptEdits",
    "disableBypassPermissionsMode": "disable",
    "skipDangerousModePermissionPrompt": true
  }
}
```

Evaluation order: **deny → ask → allow**. First match wins.

## Path prefixes

| Prefix | Resolves to |
|--------|-------------|
| `//path` | Absolute from filesystem root |
| `~/path` | Home directory |
| `/path` | Project root |
| `path` or `./path` | Current directory |

## Glob behaviour

- `*` matches a single path level.
- `**` matches recursively.
- `Bash(ls *)` matches `ls -la` but not `lsof`, because the space
  enforces a word boundary.

## Compound-command gotcha

`Bash(safe-cmd *)` does **not** permit `safe-cmd && other-cmd`.
Recognized separators (`&&`, `||`, `;`, `|`, `|&`, `&`, newlines) each
need their own matching rule. This is the one I trip over most.

## Always-allowed reads

This set bypasses prompts in any mode and isn't configurable: `ls`,
`cat`, `head`, `tail`, `grep`, `find`, `wc`, `diff`, `stat`, `du`, `cd`,
and read-only `git` forms.


# Models

## Aliases (as of 2026-04-19)

| Alias | Resolves to |
|-------|-------------|
| `opus` | `claude-opus-4-7` (needs Claude Code v2.1.111+) |
| `sonnet` | `claude-sonnet-4-6` |
| `haiku` | latest Haiku |
| `sonnet[1m]` | Sonnet with 1M context |
| `opus[1m]` | Opus with 1M context |
| `opusplan` | Opus for planning, auto-swaps to Sonnet for execution |
| `best` | same as `opus` |
| `default` | Plan-dependent (see below). Clears any override. |

On Bedrock / Vertex / Foundry, `opus` resolves to Opus 4.6 and `sonnet`
to Sonnet 4.5.

## Default by plan

| Plan | Default |
|------|---------|
| Max, Team Premium | Opus 4.7 |
| Pro, Team Standard | Sonnet 4.6 |
| Enterprise, API (pay-as-you-go) | Sonnet 4.6 (switches to Opus 4.7 on 2026-04-23 per Anthropic's announced rollover) |
| Bedrock, Vertex, Foundry | Sonnet 4.5 |

## Effort levels

Supported on Opus 4.7, Opus 4.6, Sonnet 4.6. `xhigh` and `max` are the
upper rungs; `max` is session-only on 4.6 models. Opus 4.7 default is
`xhigh`; 4.6 models default to `high` (or `medium` on Pro/Max).

## Priority when picking a model

1. `/model <alias>` during session
2. `claude --model <alias>` at startup
3. `ANTHROPIC_MODEL=<alias>` env
4. `model` key in settings.json


# Memory and CLAUDE.md

## Discovery

Claude Code walks up the directory tree from CWD and concatenates
`CLAUDE.md` and `CLAUDE.local.md` from each directory. Nothing gets
overridden. It all loads.

| Location | Scope | Shared |
|----------|-------|--------|
| macOS: `/Library/Application Support/ClaudeCode/CLAUDE.md` | Managed org-wide | deployed by IT |
| Linux/WSL: `/etc/claude-code/CLAUDE.md` | Managed | same |
| Windows: `C:\Program Files\ClaudeCode\CLAUDE.md` | Managed | same |
| `./CLAUDE.md` or `./.claude/CLAUDE.md` | Project | yes (git) |
| `~/.claude/CLAUDE.md` | Personal | no |
| `./CLAUDE.local.md` | Local | no (gitignored) |

Subdirectory CLAUDE.md files load **lazily**: only when Claude reads a
file in that subtree, not at session start.

## Imports

Use `@path/to/file` inside CLAUDE.md to pull in another file. Paths are
relative to the importing file. Max depth is 5.

```text
See @README for overview. Git workflow rules: @docs/git-rules.md
```

## Rules directories

Drop Markdown files in `.claude/rules/` for modular instructions. Add
a `paths` frontmatter field to scope a file to specific globs:

```markdown
---
paths:
  - "src/api/**/*.ts"
---
# API-specific rules
```

Files without `paths` load unconditionally. Personal rules live in
`~/.claude/rules/`.

## Auto memory

Enabled by default on v2.1.59+. Claude writes to
`~/.claude/projects/<project>/memory/MEMORY.md` when you ask it to
remember something. The first 200 lines or 25KB of MEMORY.md load at
session start.

Disable in settings (`autoMemoryEnabled: false`) or via env
(`CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`).

## `/memory`

Lists every CLAUDE.md, CLAUDE.local.md, and rules file loaded in the
current session, toggles auto-memory, and opens files for editing.

## Exclude CLAUDE.md in monorepos

```json
{ "claudeMdExcludes": ["**/monorepo/CLAUDE.md"] }
```


# Headless and CI usage

`--print` is the entry point. A few flags pair with it often:

```bash
# Pipe stdin, print once, exit.
cat logs.txt | claude -p "Summarize the errors."

# Structured output.
claude -p "List the TODOs in src/" --output-format json

# Cap work and spend.
claude -p "Refactor this module" --max-turns 5 --max-budget-usd 2.00

# Strictly validated JSON.
claude -p "Extract issues" --json-schema '{"type":"array",...}'

# Minimal startup for scripts.
claude --bare -p "Quick question"

# Better prompt-cache reuse across machines.
claude -p "..." --exclude-dynamic-system-prompt-sections

# Skip session persistence in CI.
claude -p "..." --no-session-persistence
```

Auto-compaction kicks in around 95% context capacity. Override with
`CLAUDE_AUTOCOMPACT_PCT_OVERRIDE`.


# Workflow tips that earn their keep

**Worktrees for parallel work.** `claude -w feature-auth` creates
`<repo>/.claude/worktrees/feature-auth` and opens Claude there. Add
`--tmux` to get an iTerm2 or tmux pane. Each worktree is its own
working directory, so sessions don't step on each other.

**Name your sessions.** `claude -n "refactor-auth"` shows up in the
`/resume` picker, in the prompt box, and in the terminal title. Future
you will thank present you.

**Fork before a risky compaction.** `--fork-session` with `--resume`
creates a new session ID. If a `/compact` goes sideways you still have
the original to fall back to.

**Pipe instead of prompting.** For one-shots, `cat file.py | claude -p
"add type hints"` and `gh pr diff | claude -p "summarize"` beat
opening an interactive session.

**`!` is faster than letting Claude run it.** In interactive mode, `!`
at the start of a message runs the command directly and adds the output
to context, without going through Claude's Bash tool path.

**`/btw` for side questions.** Keeps the main conversation clean. Good
for "what does this flag do" without polluting context.

**`Esc Esc` is the save-me shortcut.** Restores code and conversation
to a previous checkpoint. More forgiving than it sounds.


# Gaps and caveats

A few things I couldn't fully verify or that are version-dependent:

- Full model-ID list beyond the aliases lives at
  `platform.claude.com/docs/en/about-claude/models/overview`. The
  aliases above resolve correctly without exact dated IDs.
- `/vim` and `/pr-comments` removal dates (v2.1.92, v2.1.91) are from
  the docs but I haven't independently confirmed my local version.
- The `channels` feature for MCP notifications is in research preview;
  I left it out on purpose.
- `claude mcp add` has additional flags (like scope selection) that
  didn't all come through in the research pass. `claude mcp add --help`
  is the safe source if you need them.

If something here looks wrong in your version, `claude --help` and the
docs at [code.claude.com/docs/en](https://code.claude.com/docs/en) are
the sources of truth.
