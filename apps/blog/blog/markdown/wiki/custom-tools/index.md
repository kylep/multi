---
title: "Custom Tools"
summary: "Custom-built MCP servers, OpenClaw skills, and Docker images that extend agent capabilities."
keywords:
  - mcp
  - tools
  - docker
  - openclaw
  - discord
  - openrouter
related:
  - wiki/agent-team/index.html
  - wiki/devops/index.html
scope: "Index of custom tools: MCP servers, skills, and container images built for the agent team."
last_verified: 2026-03-15
---

Custom tools that extend what the agent team can do. MCP servers
expose external APIs as tools. OpenClaw skills give agents
step-by-step playbooks. Docker images package runtimes and scanners.

## MCP Servers

Source: `apps/mcp-servers/`

| Server | Language | Tools | Purpose |
|--------|----------|-------|---------|
| [Discord](/wiki/custom-tools/discord-mcp.html) | Python | 13 | Read/write Discord messages, threads, reactions |
| [OpenRouter](/wiki/custom-tools/openrouter-mcp.html) | TypeScript | 2 | Check API usage and model pricing |
| [Google News](/wiki/custom-tools/google-news-mcp.html) | TypeScript | 2 | Search news via GNews API (journalist agent) |

## Skills

Source: `apps/openclaw-skills/`

| Skill | Requires | Purpose |
|-------|----------|---------|
| [Linear](/wiki/custom-tools/openclaw-linear-skill.html) | curl, LINEAR_API_KEY | Manage Linear issues, projects, comments via GraphQL |

## Docker Images

Source: `infra/` — [full index](/wiki/custom-tools/docker-images.html)

| Image | Tag | Purpose |
|-------|-----|---------|
| [ai-security-toolkit-1](/wiki/custom-tools/docker-images/ai-security-toolkit.html) | 0.2 | semgrep, trivy, gitleaks |
| [ai-agent-runtime](/wiki/custom-tools/docker-images/ai-agent-runtime.html) | 0.1 | Claude Code CLI, OpenCode |
| [ai-lint-toolkit](/wiki/custom-tools/docker-images/ai-lint-toolkit.html) | 0.1 | hadolint, tflint, ruff, biome |
| [agent-controller](/wiki/custom-tools/docker-images/agent-controller.html) | 0.1 | K8s AgentTask CRD controller |
