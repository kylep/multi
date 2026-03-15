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
| `kpericak/ai-agent-runtime:0.1` | Claude Code + OpenCode CLI | `infra/ai-agent-runtime/` |
| `kpericak/agent-controller:0.1` | Go controller binary | `infra/agent-controller/` |

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
No auth for MVP.

## Deployment

```bash
helm install agent-controller ./helm \
  -n ai-agents --create-namespace \
  --set secrets.anthropicApiKey=sk-ant-... \
  --set secrets.openrouterApiKey=sk-or-...
```

Uses a hostPath PV on single-node Rancher Desktop. Not suitable for
multi-node clusters.

## Shared Volume

All agent Jobs mount the same PVC at `/workspace`. The init container
runs `git pull` before each agent run. Agents commit locally but do
not push. The user reviews and pushes from outside the cluster.

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

- [Daily AI News Digest in K8s](/k8s-autonomous-agents-mvp.html):
  build walkthrough and architecture decisions
