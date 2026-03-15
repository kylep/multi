---
title: "MVP: Cron/Event-Triggered AI Agents on K8s"
summary: Building a K8s controller that runs a Claude Code agent
  every morning to search the web for AI news and write a digest
  to the wiki. Also triggerable on demand via webhook.
slug: k8s-autonomous-agents-mvp
category: ai
tags: AI, kubernetes, agents, Claude-Code, automation, Go
date: 2026-03-15
modified: 2026-03-15
status: published
image: k8s-autonomous-agents-mvp.png
thumbnail: k8s-autonomous-agents-mvp-thumb.png
imgprompt: A cute robot crab with clocks for eyes and the
  Kubernetes logo on its stomach, flat vector illustration,
  pastel colors, clean geometric shapes on a plain background
---


## Table of contents

- [The goal](#the-goal)
- [The journalist agent](#the-journalist-agent)
- [The runtime image](#the-runtime-image)
- [AgentTask CRD](#agenttask-crd)
- [The Go controller](#the-go-controller)
- [Webhook: trigger on demand](#webhook-trigger-on-demand)
- [Helm chart and deployment](#helm-chart-and-deployment)


## The goal

I want AI agents that run autonomously on a cron schedule or
in response to events, managed by Kubernetes. This is the MVP
proving that concept works.

The demo task is a daily AI news digest. Every morning at 8am,
an agent searches the web for yesterday's AI news, writes a
digest to the wiki, and commits. It's also triggerable on demand
via webhook.

K8s handles the scheduling. A custom controller watches a CRD and
creates Jobs. The agent runs in a container, writes to a shared
volume, and the controller tracks the result. Agents commit
locally but don't push. I review and push manually. I don't trust
autonomous agents to push to main unsupervised yet.


## The journalist agent

I wrote a new Claude Code agent for this task, the
[journalist](https://github.com/kylep/multi/blob/main/.claude/agents/journalist.md).
It uses Sonnet (cheaper, good enough for search-and-summarize)
with web search tools. The agent searches for yesterday's AI news,
writes a digest to `wiki/journal/YYYY-MM-DD/ai-news.md` with
source URLs for every item, and commits.


## The runtime image

The
[runtime image](https://github.com/kylep/multi/tree/main/infra/ai-agent-runtime)
is an Alpine container with Claude Code and OpenCode installed.
The entrypoint is `sh` so the controller can inject the actual
command as Job args.


## AgentTask CRD

The custom resource definition gives me `kubectl get agenttasks`
for free. Here's the daily news task:

```yaml
apiVersion: agents.kyle.pericak.com/v1alpha1
kind: AgentTask
metadata:
  name: daily-ai-news
spec:
  agent: journalist
  runtime: claude
  prompt: >-
    Search for yesterday's most notable AI news,
    announcements, and releases. Write a digest to
    the wiki journal. Determine today's date, create
    the directory, and write ai-news.md there with
    proper wiki frontmatter. Include source URLs for
    every item. Commit with message
    'journal: AI news digest for YYYY-MM-DD'.
  schedule: "0 8 * * *"
  trigger: scheduled
  readOnly: false
```

The spec fields:

| Field | Purpose |
|-------|---------|
| `agent` | Name from `.claude/agents/` |
| `runtime` | `claude` or `opencode` |
| `prompt` | The `-p` argument |
| `schedule` | Cron expression (empty = one-shot) |
| `trigger` | `manual`, `scheduled`, or `webhook` |
| `readOnly` | Whether this agent modifies the repo |

The agent resolves dates at runtime. No date templating in the
controller. The status subresource tracks phase, last run time,
and job name. Printer columns make the output useful:

```
NAME             AGENT       TRIGGER    PHASE      LAST RUN
daily-ai-news    journalist  scheduled  Succeeded  8h ago
```

Source: [agenttask.yaml](https://github.com/kylep/multi/blob/main/infra/agent-controller/config/crd/agenttask.yaml)


## The Go controller

The [controller](https://github.com/kylep/multi/tree/main/infra/agent-controller/pkg/controller)
is a reconcile loop that lists all AgentTasks every 30 seconds.
For scheduled tasks, it compares `lastRunTime` against the cron
expression and creates a Job when it's time. For manual and
webhook tasks, it creates a Job immediately when phase is
`Pending`.

Write agents (publisher, qa, journalist) are serialized so two
don't commit at the same time. Read-only agents run concurrently.


## Webhook: trigger on demand

The controller exposes `:8080/webhook` for on-demand runs:

```bash
curl -X POST http://localhost:8080/webhook \
  -H "Content-Type: application/json" \
  -d '{"agent":"journalist","prompt":"Search for today AI news and write a digest to the wiki journal."}'
```

The handler creates an AgentTask CR, which the reconcile loop
picks up on the next cycle. No authentication for MVP, fine on a
local Rancher Desktop cluster.


## Helm chart and deployment

The [Helm chart](https://github.com/kylep/multi/tree/main/infra/agent-controller/helm)
packages everything: CRD, controller Deployment, ServiceAccount,
RBAC, Secrets, and PVC. The PVC uses a hostPath volume, so it's
tied to a single node. Fine for Rancher Desktop on my Mac.

```bash
helm install agent-controller ./helm \
  -n ai-agents --create-namespace \
  --set secrets.anthropicApiKey=$ANTHROPIC_API_KEY \
  --set secrets.openrouterApiKey=$OPENROUTER_API_KEY
```
