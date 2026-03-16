---
title: "AI Agent Runtime"
summary: "Docker image with Claude Code CLI and OpenCode for running autonomous AI agents in K8s."
keywords:
  - docker
  - agent-runtime
  - claude-code
  - opencode
  - kubernetes
  - mcp
related:
  - wiki/custom-tools/docker-images/index.html
  - wiki/devops/agent-controller.html
scope: "ai-agent-runtime Docker image: contents, K8s usage, MCP server deps, and agent execution."
last_verified: 2026-03-16
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

## MCP server dependencies

**Python deps** (Discord MCP server) are installed in the image via pip:
`mcp[cli]>=1.2.0` and `httpx>=0.27.0`.

**Node.js deps** (google-news MCP server) are NOT in the image. They
are installed at job startup by the controller's `buildCommand`:
```bash
cd apps/mcp-servers/google-news && npm install --omit=dev --silent
```

This is because the MCP server source lives in the git repo (cloned
at runtime by the init container), so `npm install` must run against
the cloned `package.json`. The required packages are
`@modelcontextprotocol/sdk` and `zod`.

If adding a new Node.js MCP server, its deps also need to be installed
at job startup. Update `buildCommand()` in
`infra/agent-controller/pkg/controller/controller.go`.

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
        cd apps/mcp-servers/google-news && npm install --omit=dev &&
        cd /workspace/repo &&
        printf '{"mcpServers":{...}}' > /tmp/mcp.json &&
        claude --mcp-config /tmp/mcp.json --agent journalist
        -p "..." --output-format text
        --allowedTools Write
        --allowedTools 'Bash(git commit *)'
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
| `REPO_URL` | Git repo URL for init container |
| `REPO_BRANCH` | Branch to checkout (default: `main`) |

## Debugging inside the container

```bash
# Test MCP server startup
node apps/mcp-servers/google-news/build/index.js
# If "Cannot find package @modelcontextprotocol/sdk" → npm install needed
cd apps/mcp-servers/google-news && npm install --omit=dev

python3 apps/mcp-servers/discord/server.py
# If import error → pip deps missing from image, rebuild

# Check Claude Code version
claude --version

# Test a simple headless run
claude -p "echo hello" --output-format json --allowedTools Write --max-turns 3
```
