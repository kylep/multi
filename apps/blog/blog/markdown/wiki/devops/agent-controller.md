---
title: "Agent Controller"
summary: "K8s custom controller that orchestrates AI agent runs via AgentTask CRDs. Includes debugging runbook, known issues, and operational procedures."
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
  - publisher
  - debugging
  - runbook
  - discord
related:
  - wiki/agent-team
  - wiki/journal
  - wiki/security/claude-code-write-pattern-bug
  - wiki/design-docs/autonomous-publisher/index
scope: "Covers the agent controller architecture, CRD spec, Helm deployment, runtime image, debugging, and operational procedures. Does not cover agent definitions or blog content pipeline."
last_verified: 2026-03-17
---


Custom K8s controller that watches `AgentTask` CRDs and creates Jobs
to run AI agents. Lives in `infra/agent-controller/`.

Supports two agent types:
- **journalist** — daily AI news digest (scheduled, OpenRouter auth)
- **publisher** — autonomous blog post pipeline (webhook-triggered, Claude Max OAuth)

## Architecture

The system has two images:

| Image | Purpose | Source |
|-------|---------|--------|
| `kpericak/ai-agent-runtime:0.4` | Claude Code + Playwright + hooks | `infra/ai-agent-runtime/` |
| `kpericak/agent-controller:0.6` | Go controller binary | `infra/agent-controller/` |

The controller runs as a Deployment, watching `AgentTask` resources.
When a task is due, it creates a Job with:
1. **Init container** (`alpine/git`) — clones/updates the repo, chowns to UID 1001
2. **Main container** (`ai-agent-runtime`) — writes MCP config, runs the agent CLI

## Discord #log observability

The controller posts to Discord #log channel on:
- **Job start:** run ID (UUID), agent name, prompt preview
- **Job completion/failure:** run ID, status

The runtime image also has a PostToolUse hook that posts individual
tool calls to Discord (Write, Edit, Bash, Agent, MCP calls).

Stream-json with `--include-partial-messages` surfaces subagent events
(researcher, reviewer, QA) in real time via pod logs.

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
  schedule: "0 12 * * *"     # cron in UTC (8am ET)
  trigger: scheduled          # scheduled | manual | webhook
  readOnly: false
  allowedTools: "WebSearch,WebFetch,Read,Write,Bash(git commit *)"
```

Status fields: `phase` (Pending/Running/Succeeded/Failed),
`lastRunTime`, `jobName`.

### allowedTools

Controls which Claude Code tools the agent can use. Passed as
individual `--allowedTools` flags to the CLI.

**Important:** The runtime image's `settings.json` grants wide
permissions (`Bash(*)`, `Edit`, `Write`, etc.) to prevent permission
prompts in headless mode. The `allowedTools` CRD field provides
additional granularity for the journalist; the publisher uses the
entrypoint script which doesn't pass `--allowedTools` (relies on
the agent definition's `tools:` frontmatter instead).

**Known bug:** Path-restricted patterns like `Write(apps/**)` silently
fail in Claude Code headless mode (`-p` flag). Use bare tool names
instead (e.g. `Write` not `Write(path/**)`). See
[claude-code-write-pattern-bug](/wiki/security/claude-code-write-pattern-bug.html).

## Publisher pipeline

The publisher uses `apps/blog/bin/run-publisher.sh` as its entrypoint:
1. Creates branch `agent/publisher-<timestamp>`
2. Unsets OpenRouter env vars (prevents auth conflict with OAuth)
3. Runs `claude --agent publisher` with stream-json output
4. On success: pushes branch, creates PR via `gh pr create`
5. Falls back to local-only if `GITHUB_TOKEN` is not set

The controller detects `agent == "publisher"` and routes to the
entrypoint script instead of inline command construction. It also
adds a `/dev/shm` emptyDir volume for Chromium and enables
`shareProcessNamespace` for zombie process cleanup.

## MCP Servers

The controller configures MCP servers per agent type:

**Publisher:** Discord + Playwright
**Journalist/default:** Discord only

Google-news MCP server was removed — agents use WebSearch instead.

## Per-Branch PVCs

Write agents (`publisher`, `qa`, `journalist`) get dedicated PV/PVC
pairs per job run (`agent-ws-<jobName>`) instead of sharing a single
PVC. This eliminates stale state leakage between runs and enables
parallel write-agent execution.

- **PV/PVC name:** `agent-ws-<jobName>` (jobName = `<taskName>-<timestamp>`)
- **hostPath:** `/tmp/agent-workspace/branches/<jobName>/`
- **Cleanup:** controller deletes PV+PVC after job completes or fails
- **Read-only agents** still use the shared `agent-workspace` PVC

The previous `canRunWrite()` serialization was removed since
per-branch PVCs eliminate the need for write serialization.

## GitHub App Auth

The `PericakAI` GitHub App (ID 3100834, installed on kylep/multi
only) provides scoped auth for write agents. The controller:

1. Generates a JWT signed with the App's private key
2. Exchanges it for a short-lived installation token (1 hour)
3. Injects it as `GITHUB_TOKEN` on write agent pods

The git-sync init container uses the token-authenticated URL for
clone. `run-publisher.sh` uses the same token for `git push` and
`gh pr create`.

**Setup:**
1. Get installation ID from https://github.com/settings/installations
2. Patch secrets (see Secrets section below or use `setup.sh`)
3. Required App permissions: Contents (R/W) + Pull requests (R/W)
4. Create branch protection ruleset on main (prevent direct pushes)

## Setup from Scratch

Use the bootstrap script to deploy from a fresh cluster:

```bash
# 1. Copy and populate secrets
cp secrets/export-agent-controller.sh.SAMPLE secrets/export-agent-controller.sh
# edit the file, fill in values

# 2. Run setup (optionally build images first)
infra/agent-controller/bin/setup.sh --build-images

# Or without building images (if they're already pushed):
infra/agent-controller/bin/setup.sh
```

**Prerequisites:** kubectl, helm, docker on PATH; cluster reachable
via `kubectl cluster-info`.

The script handles namespace creation, helm install, and secret
patching. See `secrets/export-agent-controller.sh.SAMPLE` for the
full list of required env vars.

## Webhook

The controller exposes `POST :8080/webhook` accepting:

```json
{
  "agent": "publisher",
  "prompt": "Write a blog post about ...",
  "runtime": "claude",
  "allowedTools": "WebSearch,Read,Write,..."
}
```

This creates an AgentTask CRD, which the reconcile loop picks up
(30-second poll interval).

Requires a bearer token when `AI_WEBHOOK_TOKEN` is set:

```bash
kubectl port-forward -n ai-agents deployment/agent-controller 8080:8080
curl -X POST http://localhost:8080/webhook \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"agent": "publisher", "prompt": "Write a blog post about ..."}'
```

## Deployment

```bash
helm upgrade agent-controller infra/agent-controller/helm/ \
  -n ai-agents -f infra/agent-controller/helm/values.yaml
```

Uses a hostPath PV on single-node Rancher Desktop. Not suitable for
multi-node clusters.

### Secrets

The helm chart's `secret.yaml` uses `lookup` to preserve existing
secret values on `helm upgrade`.

**Gotcha:** `helm upgrade` with explicit `-f values.yaml` will reset
secret values to empty defaults if the secret was previously deleted
(field manager conflicts). Always restore secrets after a
delete-and-recreate cycle:

```bash
# Source the OAuth token
source apps/blog/exports.sh

# Patch secrets
kubectl -n ai-agents patch secret agent-secrets --type merge -p "{
  \"stringData\": {
    \"CLAUDE_CODE_OAUTH_TOKEN\": \"$CLAUDE_CODE_OAUTH_TOKEN\",
    \"DISCORD_LOG_CHANNEL_ID\": \"1483433712296398942\",
    \"REPO_BRANCH\": \"main\"
  }
}"
```

### Field manager conflicts

If `helm upgrade` fails with "conflicts with kubectl-patch", delete
the secret and re-create via helm, then re-patch values:

```bash
kubectl -n ai-agents delete secret agent-secrets
helm upgrade agent-controller infra/agent-controller/helm/ \
  -n ai-agents -f infra/agent-controller/helm/values.yaml
# Then re-patch secrets as above
```

## Workspace Volumes

Write agents get per-branch PVCs (see above). Read-only agents share
a single `agent-workspace` PVC at `/workspace`.

The init container runs `git clone` (per-branch) or `git fetch` +
`git reset --hard` (shared) before each run, then
`chown -R 1001:1001 /workspace/repo`.

**UID 1001:** The Playwright-based runtime image runs as `pwuser`
(UID 1001). All agents use this UID regardless of type.

## Job limits

- **activeDeadlineSeconds: 1800** — 30 minute hard ceiling on all jobs
- **backoffLimit: 0** — no retries on failure
- **TTLSecondsAfterFinished: 3600** — auto-cleanup after 1 hour

## Operations

### Watch a run in real time

```bash
kubectl -n ai-agents logs -f <pod-name> -c agent
```

With `stream-json --include-partial-messages`, you'll see every tool
call from both the parent agent and its subagents. Subagent events
have `parent_tool_use_id` set.

### Force a re-trigger

```bash
kubectl patch agenttask daily-ai-news -n ai-agents \
  --type=merge --subresource=status \
  -p '{"status":{"phase":"Pending","lastRunTime":"2025-01-01T00:00:00Z","jobName":""}}'
```

### Kill a stuck job

```bash
kubectl -n ai-agents delete job <job-name>
```

The controller marks the AgentTask as Failed on next reconcile.

### Clean up old tasks

```bash
kubectl -n ai-agents delete agenttask <name1> <name2> ...
```

### Debug pod on workspace PVC

```bash
kubectl -n ai-agents run debug --rm -it --restart=Never \
  --image=kpericak/ai-agent-runtime:0.4 \
  --overrides='{"spec":{"containers":[{
    "name":"debug",
    "image":"kpericak/ai-agent-runtime:0.4",
    "command":["tail","-f","/dev/null"],
    "workingDir":"/workspace/repo",
    "volumeMounts":[{"name":"ws","mountPath":"/workspace"}]
  }],"volumes":[{
    "name":"ws",
    "persistentVolumeClaim":{"claimName":"agent-workspace"}
  }]}}' -- unused
```

## Key Files

- `infra/agent-controller/main.go` — Controller entrypoint + webhook
- `infra/agent-controller/pkg/controller/controller.go` — Reconcile loop + job creation
- `infra/agent-controller/pkg/discord/discord.go` — Discord #log notifier
- `infra/agent-controller/pkg/crd/types.go` — AgentTask Go types
- `infra/agent-controller/helm/` — Helm chart
- `apps/blog/bin/run-publisher.sh` — Publisher entrypoint script
- `.claude/agents/publisher.md` — Publisher agent definition
- `.claude/agents/journalist.md` — Journalist agent definition
