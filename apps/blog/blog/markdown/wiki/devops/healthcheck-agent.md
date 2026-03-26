---
title: "Health Check Agent"
summary: "Automated K8s cluster health checking with Linear bug filing and deduplication."
keywords:
  - health-check
  - kubernetes
  - openobserve
  - linear
  - agent
related:
  - wiki/devops/openobserve.html
  - wiki/mcp-servers/openobserve.html
  - wiki/agent-team/index.html
scope: "How the health check agent works, what it checks, and how it files bugs."
last_verified: 2026-03-25
---

## Overview

The health check agent (`claude --agent healthcheck`) runs a systematic
check of every workload in the pai-m1 K8s cluster. It uses kubectl for
pod/app status, the OpenObserve MCP for log error scanning, and the
Linear MCP for bug filing with deduplication.

Source: `.claude/agents/healthcheck.md`

## Usage

```bash
claude --agent healthcheck
```

No arguments needed. The agent runs all checks and outputs a summary table.

## What It Checks

| Check | Method | Pass Condition |
|-------|--------|---------------|
| Pod health | `kubectl get pods -A` | All pods Running/Completed |
| ArgoCD sync | `kubectl get applications -n argocd` | All apps Synced + Healthy |
| CronJob health | `kubectl get jobs -n ai-agents` | Latest run per CronJob succeeded |
| Log errors | `o2_error_summary` (1h) | No error-level logs |
| Vault status | `vault status` | sealed=false, initialized=true |
| Log ingestion | `o2_list_streams` | k8s_logs stream has recent docs |

## Linear Integration

When issues are found, the agent:

1. Searches open Linear issues labeled `health-check`
2. If an existing issue matches, adds a comment instead of duplicating
3. If a similar resolved issue exists, creates new issue referencing it
4. New issues use title format: `[health-check] namespace/workload: description`
5. Max 5 issues per run — related errors are batched

## Expected Workloads

The agent knows what should be running and flags missing workloads:

- **argocd**: server, repo-server, redis, applicationset-controller
- **ai-agents**: pai-responder, journalist cronjobs, pai-morning cronjob
- **openobserve**: openobserve-standalone, vector
- **vault**: vault, vault-agent-injector
- **cloudflared**: cloudflared
- **kube-system**: coredns, traefik, local-path-provisioner

## Future: Scheduled Runs

Currently manual. Plan is to run as a K8s CronJob (like the journalist)
on a schedule, posting results to Discord and filing bugs automatically.
