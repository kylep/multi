---
title: "Agent Controller"
summary: "Docker image for the K8s agent controller that managed AgentTask CRDs. Deprecated — controller is no longer deployed; agents now run as native CronJobs."
keywords:
  - docker
  - agent-controller
  - kubernetes
  - go
related:
  - wiki/custom-tools/docker-images/index.html
  - wiki/devops/agent-controller.html
  - wiki/devops/ai-agents-infra.html
scope: "agent-controller Docker image: build, contents, and deployment."
last_verified: 2026-03-23
---

> **Deprecated.** The agent-controller image is no longer deployed. Agents now run as
> native K8s CronJobs using `kpericak/ai-agent-runtime`. The Go source remains in the
> repo as a reference. See [AI Agents Infra](/wiki/devops/ai-agents-infra.html).

**Image:** `kpericak/agent-controller:0.8`
**Source:** `infra/ai-agents/agent-controller/`
**Base:** Alpine 3.21

Go binary that watches `AgentTask` custom resources and creates
K8s Jobs for scheduled and on-demand AI agent runs.

## Build

Multi-stage build. Go 1.24 compiles a static binary, then
copies it into a minimal Alpine image.

```dockerfile
FROM golang:1.24-alpine AS builder
# ... builds static binary

FROM alpine:3.21
COPY --from=builder /app/agent-controller /usr/local/bin/
```

Runs as non-root `controller` user (UID 1000).

## What it does

- Watches `AgentTask` CRDs in the `ai-agents` namespace
- Creates K8s Jobs on cron schedule or manual trigger
- Exposes `:8080/webhook` for on-demand runs
- Issues GitHub App installation tokens for write agent git auth
- Gives write agents (publisher, qa, journalist) dedicated per-branch PVCs
- Tracks job status back on the AgentTask CR

## Secret delivery

All secrets are injected by the Vault Agent sidecar — no plain-text K8s
Secrets are used for agent workloads. The controller pod and each Job pod
both receive `/vault/secrets/config` (a shell-sourceable file) written
by the vault-agent container at startup. The controller entrypoint
sources it before the Go binary starts; Job entrypoints source it before
any git or claude commands run.

Vault paths used:

| Path | Who reads it |
|------|-------------|
| `secret/ai-agents/discord` | controller + all jobs |
| `secret/ai-agents/webhook` | controller |
| `secret/ai-agents/github` | controller (JWT signing) + jobs (REPO_URL) |
| `secret/ai-agents/anthropic` | jobs only |
| `secret/ai-agents/openrouter` | jobs only |

To populate or update secrets: `bash infra/ai-agents/bin/store-secrets.sh`

## Deployment

Deployed via Helmfile at `infra/ai-agents/helmfile.yaml`.

```bash
helmfile -f infra/ai-agents/helmfile.yaml apply
```
