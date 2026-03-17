---
title: "TASK-002: Rebuild Runtime Image with Playwright Base"
status: complete
date: 2026-03-16
---

# TASK-002: Rebuild Runtime Image with Playwright Base

**Status:** Complete (local build verified)
**Date:** 2026-03-16
**Image:** `kpericak/ai-agent-runtime:0.3`

## What changed

Rewrote `infra/ai-agent-runtime/Dockerfile` from `node:22-alpine` to
`mcr.microsoft.com/playwright:v1.58.2-noble` (Ubuntu 24.04 LTS). This gives
the QA subagent access to Chromium for browser-based verification.

### New capabilities
- **Playwright MCP** (`@playwright/mcp`) — installed globally via npm
- **GitHub CLI** (`gh`) — installed from official APT repo
- **Onboarding bypass** — `.claude.json` baked into image at `/home/pwuser/.claude.json`

### Key details
- Base image includes Node v24.13.0 (bundled by Playwright noble image)
- Default user: `pwuser` (UID 1001, GID 1001)
- System packages: git, python3, python3-pip, bash, curl, openssh-client
- Python deps: `mcp[cli]>=1.2.0`, `httpx>=0.27.0`
- OpenCode v0.0.55 retained for backward compatibility

## Smoke test results

| Test | Result |
|------|--------|
| `claude --version` | 2.1.77 |
| `npx @playwright/mcp --help` | OK |
| `gh --version` | 2.88.1 |
| `python3 -c 'import mcp'` | OK |
| `whoami` | pwuser |
| `cat /home/pwuser/.claude.json` | `{"hasCompletedOnboarding":true}` |
| `node --version` | v24.13.0 |

## Follow-up needed

- `infra/agent-controller/main.go:64` still references `ai-agent-runtime:0.1` —
  update when the new image is pushed to Docker Hub
- Docker Hub push is Kyle's responsibility (no automated push)
