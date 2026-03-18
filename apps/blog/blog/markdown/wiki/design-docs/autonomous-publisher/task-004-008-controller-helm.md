---
title: "TASK-004–008: Controller + Helm Changes for Publisher"
status: complete
date: 2026-03-17
---

# TASK-004/005/006/007/008: Controller + Helm Changes for Publisher

**Status:** Complete (code written, not yet deployed)
**Date:** 2026-03-17

## Summary

Batched implementation of all controller and Helm infrastructure needed to
launch publisher jobs in K8s with Playwright MCP, shared memory, network
isolation, and new secrets.

## TASK-004: Publisher routing in `buildCommand()`

**File:** `infra/ai-agents/agent-controller/pkg/controller/controller.go`

`buildCommand()` now branches on `task.Spec.Agent == "publisher"`:

- **Publisher path:** MCP config includes `playwright` server alongside
  discord + google-news. Invokes `apps/blog/bin/run-publisher.sh` (TASK-003
  entrypoint script) instead of `claude` directly. No `--allowedTools`
  passed — the entrypoint script handles Claude invocation internally.
- **Default path:** Unchanged. Journalist and other agents use the existing
  discord + google-news MCP config and direct `claude` invocation.

Publisher MCP config adds:
```json
"playwright": {
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@playwright/mcp@latest", "--headless"]
}
```

## TASK-005: Pod spec for Chromium

**File:** `infra/ai-agents/agent-controller/pkg/controller/controller.go`

Publisher-specific pod changes:

| Feature | Implementation |
|---------|---------------|
| `/dev/shm` | emptyDir volume, `medium: Memory`, `sizeLimit: 1Gi` |
| Zombie reaping | `shareProcessNamespace: true` on pod spec |
| UID | Init container chowns to 1001:1001 (Playwright's `pwuser`); non-publisher stays at 1000 |
| Security context | `allowPrivilegeEscalation: false`, `capabilities: drop: [ALL]` (applied to all agents) |

## TASK-006: Helm secrets

**Files:** `helm/templates/secret.yaml`, `helm/values.yaml`

New secret keys (lookup-preserve pattern):
- `CLAUDE_CODE_OAUTH_TOKEN` — Claude Max OAuth token
- `GITHUB_TOKEN` — PAT for `gh pr create`
- `DISCORD_WEBHOOK_URL` — webhook for publisher notifications

Runtime image tag bumped from `0.2` to `0.3` in values.yaml.

## TASK-007: NetworkPolicy

**File:** `helm/templates/networkpolicy.yaml` (new)

Non-RFC1918 egress policy (OpenClaw pattern):
- Selects pods with `agents.kyle.pericak.com/agent` label (Exists operator)
- Denies all ingress
- Allows DNS (UDP+TCP 53) to kube-system
- Allows HTTP (80) + HTTPS (443) to `0.0.0.0/0` except `10.0.0.0/8`,
  `172.16.0.0/12`, `192.168.0.0/16`

## TASK-008: Publisher sample

**File:** `config/samples/publisher-manual.yaml` (new)

Minimal AgentTask: `agent: publisher`, `trigger: manual`, `readOnly: false`.
Placeholder prompt for Kyle to replace per run. No `allowedTools` — the
entrypoint script manages Claude invocation.

## Verification

| Check | Result |
|-------|--------|
| `go build ./...` | Clean |
| `go test ./...` | No test files (pre-existing) |
| `helm template` | All templates render correctly |
| `helm lint` | Passed (advisory: missing icon) |
| Non-publisher unchanged | Default `buildCommand()` path untouched |

## Deferred to TASK-009

- Build and push `ai-agent-runtime:0.3` and `agent-controller:0.6`
- `helm upgrade` deployment
- End-to-end test (publisher run, PR creation, Discord notification)
- In-pod verification (UID, /dev/shm, network policy, security context)
- Journalist regression test
