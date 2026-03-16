---
title: "Agent Controller"
summary: "K8s custom controller that orchestrates AI agent runs via AgentTask CRDs. Primary use case: daily AI news digest via the journalist agent."
keywords:
  - kubernetes
  - controller
  - crd
  - agents
  - claude-code
  - opencode
  - helm
  - automation
  - journalist
related:
  - wiki/agent-team
  - wiki/journal
scope: "Covers the agent controller architecture, CRD spec, Helm deployment, and runtime image. Does not cover agent definitions or blog content pipeline."
last_verified: 2026-03-15
---


Custom K8s controller that watches `AgentTask` CRDs and creates Jobs
to run AI agents. Lives in `infra/agent-controller/`.

Primary use case: daily AI news digest written to the wiki journal
by the `journalist` agent at 8am.

## Architecture

The system has two images:

| Image | Purpose | Source |
|-------|---------|--------|
| `kpericak/ai-agent-runtime:0.2` | Claude Code + OpenCode CLI + MCP deps | `infra/ai-agent-runtime/` |
| `kpericak/agent-controller:0.2` | Go controller binary | `infra/agent-controller/` |

The controller runs as a Deployment, watching `AgentTask` resources.
When a task is due, it creates a Job with an init container that does
`git pull` and a main container that runs the agent CLI.

## AgentTask CRD

```yaml
apiVersion: agents.kyle.pericak.com/v1alpha1
kind: AgentTask
metadata:
  name: daily-ai-news
spec:
  agent: journalist
  runtime: claude
  prompt: "Search for yesterday's AI news..."
  schedule: "0 8 * * *"
  trigger: scheduled
  readOnly: false
```

Status fields: `phase` (Pending/Running/Succeeded/Failed),
`lastRunTime`, `jobName`.

## Write Serialization

Agents that modify the repo (`publisher`, `qa`, `journalist`) are
serialized. Only one write-agent Job runs at a time. Read-only
agents run concurrently.

## Webhook

The controller exposes `POST :8080/webhook` accepting:

```json
{"agent": "journalist", "prompt": "Write a news digest", "runtime": "claude"}
```

This creates an AgentTask CRD, which the reconcile loop picks up.

Requires a bearer token when `AI_WEBHOOK_TOKEN` is set:

```bash
curl -X POST :8080/webhook \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"agent": "journalist", "prompt": "Write a news digest"}'
```

If `AI_WEBHOOK_TOKEN` is empty (local dev), auth is skipped.
`/healthz` is always unauthenticated.

## Deployment

```bash
helm install agent-controller ./helm \
  -n ai-agents --create-namespace \
  --set secrets.anthropicApiKey=sk-ant-... \
  --set secrets.openrouterApiKey=sk-or-...
```

Uses a hostPath PV on single-node Rancher Desktop. Not suitable for
multi-node clusters.

## MCP Servers

The controller writes `/tmp/mcp.json` before each Claude run and
passes `--mcp-config /tmp/mcp.json` so Claude Code can discover
MCP tools. Currently configured: Discord MCP server (`python3
apps/mcp-servers/discord/server.py`). The `DISCORD_BOT_TOKEN` and
`DISCORD_GUILD_ID` env vars are injected via the `agent-secrets`
Secret.

MCP servers must be committed to git — the init container clones
the repo, so untracked files won't exist in the container.

## Shared Volume

All agent Jobs mount the same PVC at `/workspace`. The init container
runs `git fetch` + `git reset --hard origin/<branch>` before each
agent run. This replaces `git pull --ff-only` which fails when
branches diverge (e.g. an agent committed locally but the remote
also advanced).

**safe.directory:** Git refuses to operate on `/workspace/repo`
when the init container (root) owns files but git runs as a
different user. The init container runs
`git config --global --add safe.directory /workspace/repo` first.

Agents commit locally but do not push. The user reviews and pushes
from outside the cluster.

## Key Files

- `infra/agent-controller/main.go` — Controller entrypoint + webhook
- `infra/agent-controller/pkg/controller/controller.go` — Reconcile loop
- `infra/agent-controller/pkg/crd/types.go` — AgentTask Go types
- `infra/agent-controller/config/crd/agenttask.yaml` — CRD definition
- `infra/agent-controller/config/samples/daily-ai-news.yaml` — Primary sample
- `infra/agent-controller/helm/` — Helm chart
- `infra/ai-agent-runtime/Dockerfile` — Runtime image
- `.claude/agents/journalist.md` — Journalist agent definition

## Related Blog Posts

- [Daily AI News Digest in K8s](/cron-event-triggered-ai-agents-k8s.html):
  build walkthrough and architecture decisions
