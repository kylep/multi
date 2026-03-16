---
title: "Agent Controller"
summary: "Docker image for the K8s agent controller that manages AgentTask CRDs."
keywords:
  - docker
  - agent-controller
  - kubernetes
  - go
related:
  - wiki/custom-tools/docker-images/index.html
  - wiki/devops/agent-controller.html
scope: "agent-controller Docker image: build, contents, and deployment."
last_verified: 2026-03-15
---

**Image:** `kpericak/agent-controller:0.1`
**Source:** `infra/agent-controller/`
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
- Serializes write agents to prevent commit conflicts
- Tracks job status back on the AgentTask CR

## Deployment

Deployed via Helm chart at `infra/agent-controller/helm/`.

```bash
helm install agent-controller ./helm \
  -n ai-agents --create-namespace \
  -f values-override.yaml
```
