---
title: "AI Agent Runtime"
summary: "Docker image with Claude Code CLI, Playwright, and Discord hooks for running autonomous AI agents in K8s."
keywords:
  - docker
  - agent-runtime
  - claude-code
  - opencode
  - kubernetes
  - mcp
  - playwright
  - hooks
related:
  - wiki/custom-tools/docker-images/index.html
  - wiki/devops/agent-controller.html
  - wiki/design-docs/autonomous-publisher/index.html
scope: "ai-agent-runtime Docker image: contents, K8s usage, hooks, and agent execution."
last_verified: 2026-03-17
---

**Image:** `kpericak/ai-agent-runtime:0.4`
**Source:** `infra/ai-agent-runtime/`
**Base:** `mcr.microsoft.com/playwright:v1.58.2-noble` (Ubuntu, glibc)

Runtime environment for autonomous AI agent pods. Used by the
agent controller to run Claude Code agents in Kubernetes Jobs.

## Version history

| Tag | Base | Key changes |
|-----|------|-------------|
| 0.2 | Node 22 Alpine | Initial: Claude Code + OpenCode |
| 0.3 | Playwright noble | Switched to glibc for Chromium/Playwright support |
| 0.4 | Playwright noble | Added jq, baked in Claude Code hooks + settings.json |

## Tools

| Tool | Version | Purpose |
|------|---------|---------|
| Claude Code CLI | latest (npm) | Anthropic agent CLI |
| OpenCode | 0.0.55 | Alternative agent CLI |
| Playwright MCP | latest (npm) | Browser automation for QA |
| jq | system | JSON parsing in hooks |
| gh | latest | GitHub CLI |
| mcp[cli], httpx | pip | Python MCP server deps (Discord) |
| git | system | Version control |
| python3 | system | Script execution + MCP servers |
| bash, curl, openssh-client | system | Shell utilities |

Runs as non-root `pwuser` (UID 1001, from Playwright base).

## Claude Code hooks

The image bakes in a PostToolUse hook at
`/home/pwuser/.claude/hooks/discord-log.sh` that posts tool call
summaries to Discord #log. Configured in
`/home/pwuser/.claude/settings.json`.

**What gets posted:** Write, Edit, Bash, Agent, and MCP tool calls
with a truncated param preview. Read/Glob/Grep are skipped (too noisy).

**Rate limiting:** File-based throttle at 1.2s between posts. Discord
allows 5 messages per 5 seconds per channel.

**Env vars needed:** `DISCORD_BOT_TOKEN`, `DISCORD_LOG_CHANNEL_ID`,
`RUN_ID` (injected by controller).

The settings.json also includes wide permissions (`Bash(*)`,
`Edit`, `Write`, etc.) to prevent permission prompts in headless
mode. The container is already sandboxed by K8s SecurityContext.

## Headless execution

Claude Code `.claude.json` with `{"hasCompletedOnboarding": true}`
is baked into the image at `/home/pwuser/.claude.json` to skip the
interactive onboarding in headless mode.

## MCP server dependencies

**Python deps** (Discord MCP server) are installed in the image via pip:
`mcp[cli]>=1.2.0` and `httpx>=0.27.0`.

**Node.js deps** (google-news MCP server) are no longer used by the
controller. The journalist agent uses WebSearch instead.

## K8s usage

The agent controller creates Jobs with this image. An init container
(`alpine/git`) clones the repo and chowns the workspace to UID 1001,
then the agent runs in this container.

The publisher agent uses `apps/blog/bin/run-publisher.sh` which creates
a branch, runs `claude --agent publisher` with `--output-format
stream-json --verbose --include-partial-messages`, and reports the
result. The `--include-partial-messages` flag surfaces subagent events
(researcher, reviewer, QA) in the parent's stream for full visibility.

## Environment variables

The controller injects these via a K8s Secret:

| Variable | Purpose |
|----------|---------|
| `CLAUDE_CODE_OAUTH_TOKEN` | Claude Max OAuth token (publisher) |
| `ANTHROPIC_BASE_URL` | OpenRouter API endpoint (journalist) |
| `ANTHROPIC_AUTH_TOKEN` | OpenRouter API key (journalist) |
| `DISCORD_BOT_TOKEN` | Discord bot token for MCP + hooks |
| `DISCORD_GUILD_ID` | Default Discord guild ID |
| `DISCORD_LOG_CHANNEL_ID` | Discord #log channel for hook posts |
| `RUN_ID` | UUID prefix for correlating Discord messages |
| `REPO_URL` | Git repo URL for init container |
| `REPO_BRANCH` | Branch to checkout (default: `main`) |

## QA in containers: static server, not next dev

The QA subagent needs a running web server to verify blog post rendering
with Playwright. `next dev` compiles pages on first request and is too
resource-heavy for K8s pods (hangs or OOMKills on a 4GB node).

Instead, the QA agent uses `apps/blog/bin/start-static-server.sh`:
1. Builds static files via `bin/build-blog-files.sh` (`next build` → `out/`)
2. Serves `out/` with `python3 -m http.server 3000`
3. Responds instantly (0.005s vs never for `next dev`)

The `qa.md` agent definition includes instructions to detect the
container environment and choose the right server.

## Key files

- `infra/ai-agent-runtime/Dockerfile`
- `infra/ai-agent-runtime/hooks/discord-log.sh` — PostToolUse hook
- `infra/ai-agent-runtime/claude-settings.json` — Permissions + hook config
- `apps/blog/bin/start-static-server.sh` — Container-friendly QA server
