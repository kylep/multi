---
title: "AI Agent Runtime"
summary: "Docker image with Claude Code CLI and OpenCode for running autonomous AI agents in K8s."
keywords:
  - docker
  - agent-runtime
  - claude-code
  - opencode
  - kubernetes
related:
  - wiki/custom-tools/docker-images/index.html
  - wiki/devops/agent-controller.html
scope: "ai-agent-runtime Docker image: contents, K8s usage, and agent execution."
last_verified: 2026-03-15
---

**Image:** `kpericak/ai-agent-runtime:0.2`
**Source:** `infra/ai-agent-runtime/`
**Base:** Node 22 Alpine

Runtime environment for autonomous AI agent pods. Used by the
agent controller to run Claude Code and OpenCode agents in
Kubernetes Jobs.

## Tools

| Tool | Version | Purpose |
|------|---------|---------|
| Claude Code CLI | latest (npm) | Anthropic agent CLI |
| OpenCode | 0.0.55 | Alternative agent CLI |
| mcp[cli], httpx | pip | Python MCP server deps (Discord) |
| git | Alpine default | Version control |
| python3 | Alpine default | Script execution + MCP servers |
| bash, curl, openssh-client | Alpine default | Shell utilities |

Runs as non-root `node` user (UID 1000).

## K8s usage

The agent controller creates Jobs with this image as the main
container. An init container (`alpine/git`) clones the repo
and chowns the workspace to uid 1000, then the agent runs in
this container.

```yaml
containers:
  - name: agent
    image: kpericak/ai-agent-runtime:0.2
    command: ["sh", "-c"]
    args:
      - >-
        claude --agent journalist -p "..."
        --allowedTools WebSearch
        --allowedTools Write
```

## Environment variables

The controller injects these via a K8s Secret:

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_BASE_URL` | OpenRouter API endpoint |
| `ANTHROPIC_AUTH_TOKEN` | OpenRouter API key |
| `ANTHROPIC_API_KEY` | Must be empty when using OpenRouter |
| `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` | Set to `1` |
| `DISCORD_BOT_TOKEN` | Discord bot token for MCP server |
| `DISCORD_GUILD_ID` | Default Discord guild ID |
