---
title: "Claude Code CLI Cheat-Sheet"
summary: A deeper look into CLI flags, slash commands, keyboard shortcuts, hooks, custom agents and skills.
slug: claude-code-cheat-sheet
category: ai
tags: Claude-Code, AI, reference, CLI
date: 2026-04-19
modified: 2026-04-19
status: published
image: claude-code-cheat-sheet.png
thumbnail: claude-code-cheat-sheet-thumb.png
imgprompt: A cute upright cartoon sea otter holding a paper with code on it, wearing black aviators with matrix style text scrolling along them
keywords:
  - claude code cheat sheet
  - claude code slash commands reference
  - claude code cli flags
  - claude code hooks events
  - claude code permissions syntax
  - claude code settings json
---

This post is about using the actual `claude` CLI tool itself, not about using the
best prompt techniques or plugins or whatever. I'll maybe do a plugins post later.

## Table of contents


# Terminology

Useful to know what these are

| Term | What it means |
|------|---------------|
| Turn | One back-and-forth with the model. Claude generates a response (possibly with tool calls), reads the results, then generates again. Each of those generation steps counts as a turn. |
| Context (or context window) | The running transcript the model can see on a given turn: your messages, its messages, tool calls, tool results, system prompt, `CLAUDE.md`, loaded skills. Measured in tokens. |
| Compaction | When the context window fills up, Claude Code summarizes older history in-place to free space. Triggered automatically or via `/compact`. |
| Headless / print mode | Running `claude -p "prompt"` so it answers and exits instead of opening the TUI. The entry point for scripts and CI. |
| Frontmatter | The YAML block between `---` markers at the top of a markdown file. Carries config like `name`, `description`, `tools`. |
| Hook | A shell command Claude Code runs at a lifecycle event (tool use, session start, etc.) to allow, block, or modify the action. Deterministic, not LLM-based. |
| Subagent | A child agent spawned from the main conversation. Runs in its own context window with its own tools and system prompt. Returns a summary. |
| Plan mode | Read-only exploration mode. Claude can search and read but cannot edit or run shell commands. |



# Launch headless Claude, ex in Kubernetes cron jobs

Install it in a Dockerfile. I like to launch it from k8s in a CronJob from there.


`vi Dockerfile`
```dockerfile
FROM node:22-slim
RUN npm i -g @anthropic-ai/claude-code
```


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
too so it doesn't freeze on permission requests. Consider some of these launch flags:

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

Then run it. Another example:

```bash
claude \
  -p "$CLAUDE_PROMPT" \
  --model sonnet \
  --output-format json \
  --permission-mode bypassPermissions \
  --max-turns 10 \
  --max-budget-usd 2.00 \
  --no-session-persistence
```

This'd give you JSON output for parsing (datadog etc), a hard cap on agentic
turns, a dollar ceiling so a runaway job can't drain your account, and
no session file written to disk. Drop the `--max-*` flags if you trust
the prompt, swap `bypassPermissions` for `auto` if you want the
auto-mode classifier to gate risky calls.

---

# Skills & Agents

## When to use Skills vs Agents

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


## Built-in agents/subagents

I use the term "agent" and "subagent" pretty interchangeably with Claude, and I think
I'm doing that right. If there's one different, a subagent is called within a conversation
where an agent is called as a launch arg with `--agent`.

| Name | Model | Tools | Purpose |
|------|-------|-------|---------|
| `Explore` | Haiku | read-only | File discovery, code search |
| `Plan` | inherit | read-only | Codebase research during plan mode |
| `general-purpose` | inherit | all | Multi-step tasks |
| `statusline-setup` | Sonnet | n/a | Used by `/statusline` |
| `Claude Code Guide` | Haiku | n/a | Answers feature questions |

## Built-in skills


| Command | What it does |
|---------|--------------|
| `/simplify [focus]` | Review changed files and fix quality/efficiency issues. |
| `/batch <instruction>` | Orchestrate large-scale parallel changes across the codebase. |
| `/debug [description]` | Enable debug logging and troubleshoot. |
| `/loop [interval] [prompt]` (alias `/proactive`) | Run a prompt repeatedly. |
| `/claude-api` | Load Claude API reference for the session's language. |
| `/fewer-permission-prompts` | Scan transcripts and propose allowlist entries. |


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


## Creating custom Skills

Skills are the native Claude Code way to package reusable workflows. They
replaced `.claude/commands/*.md` (legacy commands still work but skills
take precedence on name collision).

### Where they live

| Location | Scope |
|----------|-------|
| Managed settings | All users in the org |
| `~/.claude/skills/<name>/SKILL.md` | Personal |
| `.claude/skills/<name>/SKILL.md` | Project |
| Plugin `skills/<name>/SKILL.md` | Where the plugin is enabled |

### Frontmatter

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

### Placeholders

- `$ARGUMENTS`: all args passed at invocation.
- `$ARGUMENTS[N]` or `$N`: specific argument, 0-indexed.
- `${CLAUDE_SESSION_ID}`, `${CLAUDE_SKILL_DIR}`.

### Shell injection

`` !`command` `` inside skill content runs the command before the skill
is sent to Claude; the output replaces the placeholder. Multi-line uses
a fenced ` ```! ` block. Turn off globally with
`disableSkillShellExecution: true` in settings.

That has the security implications you'd expect.
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


---

# Slash commands reference

There are a lot of these, here's some good ones.
- `/btw` is great, use it when you think claude is stuck
- I pretty much only use xhigh effort currently
- I personally use `/coderabbit` for PR reviews but `/review` is nice too. It figures out your current PR itself.


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


## Integrations and misc

Some notes from my testing of these:
- `/voice` is novel but way worse than ChatGPT at recognizing what you said. I don't find it very usable.
- `/install-github-app` is neat in that you don't need other infra. See [instructions](https://code.claude.com/docs/en/github-actions).

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

---


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
| `Alt+Y` (after `Ctrl+Y`) | Cycle paste history. Requires "Use Option as Meta Key" in iTerm|
| `Alt+B` / `Alt+F` | Back / forward a word. Requires "Use Option as Meta Key" in iTerm|

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


---

# Worktrees

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


---

# Session Management

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


## Forking sessions
It's like starting claude twice in the same directory, but without using worktrees.
The changes all go to the same branches and locations on the filesystem.
You resume from where the most recent session left off.

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



## When to set Session ID manually

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

---

# Hooks

Hooks are shell commands Claude Code runs at specific lifecycle events.
You define them in `settings.json`. They
receive JSON on stdin (including `session_id`, `tool_name`, arguments),
and their exit code or JSON output can allow, block, or modify the action.

Personally, I care about hooks mostly for security and logging/notifications.

Typical uses:

- Block `rm -rf` or edits to `.env` (`PreToolUse` + exit 2).
- Run `prettier` or `gofmt` after every Edit (`PostToolUse`).
- Inject the current git branch into every prompt (`UserPromptSubmit`).
- Ping Discord when the session finishes (`Stop`).
- Gatekeep a single subagent's tool calls (hook in that agent's frontmatter).

The `/hooks` slash command shows what's registered and where each rule
came from (user, project, managed, or plugin).

I'd originally done like a whole write-up on how to make hooks, but honestly just
ask Claude to make them for you. I might give Hooks their own post.





---

# CLAUDE.md and Rules

## CLAUDE.md file discovery

At launch, Claude Code walks the directory tree from CWD to root and concatenates
`CLAUDE.md` and `CLAUDE.local.md` from each directory. Nothing gets
overridden. It all loads. During the session, when Claude edits a file it'll also
load in nested CLAUDE.md files, like if Claude opens src/api/auth/login.ts, it'll pick
up src/CLAUDE.md, src/api/CLAUDE.md, src/api/auth/CLAUDE.md (if any exist, but only at that moment).

| Location | Scope | Shared |
|----------|-------|--------|
| macOS: `/Library/Application Support/ClaudeCode/CLAUDE.md` | Managed org-wide | deployed by IT |
| Linux/WSL: `/etc/claude-code/CLAUDE.md` | Managed | same |
| Windows: `C:\Program Files\ClaudeCode\CLAUDE.md` | Managed | same |
| `./CLAUDE.md` or `./.claude/CLAUDE.md` | Project | yes (git) |
| `~/.claude/CLAUDE.md` | Personal | no |
| `./CLAUDE.local.md` | Local | no (gitignored) |


## Rules - Conditionally applied CLAUDE.md

`.claude/rules/` is a directory you fill with topic-scoped markdown files instead of
combining everything into one big CLAUDE.md. They behave like CLAUDE.md
(loaded into context at session start, treated as instructions, not enforcement) but
they're organized by file.

- Files without `paths` load unconditionally.
- Personal rules live in `~/.claude/rules/`.

To differentiate these from the usual CLAUDE.md, you need to set which paths they apply
to. Add a `paths` frontmatter field to scope a file to specific globs:

```markdown
---
paths:
  - "src/api/**/*.ts"
---
API-specific rules
foo bar baz
```


