---
title: "Agent Controller"
summary: "K8s custom controller that orchestrated AI agent runs via AgentTask CRDs. Deprecated — replaced by native K8s CronJobs. Kept in the repo as a reference project."
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
  - wiki/devops/ai-agents-infra
scope: "Covers the agent controller architecture, CRD spec, Helm deployment, runtime image, debugging, and operational procedures. Does not cover agent definitions or blog content pipeline."
last_verified: 2026-03-23
---

> **Deprecated.** The agent-controller is no longer deployed. Scheduled agents now run as
> native K8s CronJobs (`infra/ai-agents/cronjobs/`). The Go source and Helm chart remain
> in the repo as a reference project. See [AI Agents Infra](/wiki/devops/ai-agents-infra.html)
> for the current architecture.

Custom K8s controller that watches `AgentTask` CRDs and creates Jobs
to run AI agents. Lives in `infra/ai-agents/agent-controller/`.

Supports two agent types:
- **journalist** — daily AI news digest (scheduled, OpenRouter auth)
- **publisher** — autonomous blog post pipeline (webhook-triggered, Claude Max OAuth)

## Architecture

The system has two images:

| Image | Purpose | Source |
|-------|---------|--------|
| `kpericak/ai-agent-runtime:0.4` | Claude Code + Playwright + hooks | `infra/ai-agents/ai-agent-runtime/` |
| `kpericak/agent-controller:0.8` | Go controller binary | `infra/ai-agents/agent-controller/` |

The controller runs as a Deployment (2/2 pods — controller + Vault
sidecar), watching `AgentTask` resources. When a task is due, it
creates a Job with:
1. **Vault init container** — injected by Vault Agent Injector, writes secrets to `/vault/secrets/config`
2. **Init container** (`alpine/git`) — clones/updates the repo, chowns to UID 1001
3. **Main container** (`ai-agent-runtime`) — sources env vars from `/vault/secrets/config`, runs the agent CLI
4. **Vault sidecar** — keeps secrets refreshed (auto-injected)
5. All containers run PSS restricted: `seccompProfile: RuntimeDefault` (pod level),
   `capabilities.drop: ALL`, `allowPrivilegeEscalation: false`, `runAsNonRoot: true` (UID 1001)

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

## Workspace Volumes (per agent type)

Write agents (`publisher`, `qa`, `journalist`) get a fresh `emptyDir`
volume per job. Since write agents push all work to GitHub before the pod
terminates, the ephemeral workspace is safe. This also satisfies PSS
restricted — `emptyDir` is writable by UID 1001 without any hostPath
ownership workarounds.

- **Write agents:** `emptyDir` (auto-cleaned when pod terminates)
- **Read-only agents:** shared `agent-workspace` PVC at `/workspace`
- **Shared PVC hostPath:** `/tmp/agent-workspace` on Lima VM, must be
  mode `1777` for UID 1001 write access (set by `rdctl shell -- sudo
  chmod 1777 /tmp/agent-workspace`)

The previous per-branch PV/PVC creation pattern was removed in
controller v0.7 in favour of emptyDir for write agents.

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
bash infra/ai-agents/bin/bootstrap.sh
```

This runs `helmfile sync` to install Vault and the agent controller,
applies CRDs and sample AgentTask manifests, then prints manual Vault
setup steps if this is a first-time install.

After bootstrap, configure Vault auth and store secrets:

```bash
bash infra/ai-agents/bin/configure-vault-auth.sh
bash infra/ai-agents/bin/store-secrets.sh
```

See the [Bootstrap & Recovery](/wiki/devops/bootstrap.html) guide for
the full walkthrough including Vault init, secret structure, and
troubleshooting.

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
# Via helmfile (preferred — handles Vault dependency)
helmfile -f infra/ai-agents/helmfile.yaml apply

# Or direct helm upgrade
helm upgrade agent-controller infra/ai-agents/agent-controller/helm/ \
  -n ai-agents -f infra/ai-agents/agent-controller/helm/values.yaml
```

Uses a hostPath PV on single-node Rancher Desktop. Not suitable for
multi-node clusters.

### Secrets (Vault)

All secrets are injected via Vault Agent Injector — there is no K8s
Secret for agent credentials. The Vault sidecar writes secrets to an
in-memory tmpfs at `/vault/secrets/config`, which the controller and
agent Jobs source as environment variables.

To update secrets in Vault:

```bash
bash infra/ai-agents/bin/store-secrets.sh
```

Then restart the controller to pick up changes:

```bash
kubectl rollout restart deploy/agent-controller -n ai-agents
```

See [Bootstrap & Recovery](/wiki/devops/bootstrap.html) for the full
secret structure and Vault paths.

## Workspace Volumes

See [Per-Agent Workspace Volumes](#workspace-volumes-per-agent-type) above for the full breakdown. Key points:

The init container runs `git clone` (write agents, fresh emptyDir) or
`git fetch` + `git reset --hard` (read-only agents, shared PVC) before
each run, then `chown -R 1001:1001 /workspace/repo`.

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

The `ai-agents` namespace enforces PSS restricted, so the debug pod must
include a compliant security context or it will be rejected at admission.

```bash
kubectl -n ai-agents run debug --rm -it --restart=Never \
  --image=kpericak/ai-agent-runtime:0.4 \
  --overrides='{
    "spec": {
      "securityContext": {
        "runAsNonRoot": true,
        "runAsUser": 1001,
        "fsGroup": 1001,
        "seccompProfile": {"type": "RuntimeDefault"}
      },
      "containers": [{
        "name": "debug",
        "image": "kpericak/ai-agent-runtime:0.4",
        "command": ["tail", "-f", "/dev/null"],
        "workingDir": "/workspace/repo",
        "securityContext": {
          "allowPrivilegeEscalation": false,
          "capabilities": {"drop": ["ALL"]}
        },
        "volumeMounts": [{"name": "ws", "mountPath": "/workspace"}]
      }],
      "volumes": [{"name": "ws", "persistentVolumeClaim": {"claimName": "agent-workspace"}}]
    }
  }' -- unused
```

## Operations

### Force a re-trigger

The controller fires a scheduled job when `lastRunTime` is before
the most recent scheduled time. To force an immediate trigger, backdate
`lastRunTime` and set phase to `Pending`:

```bash
kubectl patch agenttask daily-ai-news -n ai-agents \
  --type=merge --subresource=status \
  -p '{"status":{"phase":"Pending","lastRunTime":"2025-01-01T00:00:00Z","jobName":""}}'
```

The controller reconciles every ~1-2 minutes and will create a new Job
on the next pass if the schedule says it's time.

### Temporarily change the schedule

Edit the YAML and apply. No controller restart needed — the reconcile
loop reads the schedule from the CRD each cycle.

```bash
# Edit schedule field, then:
kubectl apply -f infra/agent-controller/config/samples/daily-ai-news.yaml
```

### Kill a stuck job

```bash
# Find the job name
kubectl get jobs -n ai-agents

# Delete it — controller will mark the AgentTask as Failed
kubectl delete job <job-name> -n ai-agents
```

### Rebuild and deploy the controller

```bash
cd infra/agent-controller
docker build -t kpericak/agent-controller:0.X .
docker push kpericak/agent-controller:0.X

# Update helm/values.yaml with new tag, then:
helm upgrade agent-controller ./helm -n ai-agents -f ./helm/values.yaml
```

If helm upgrade fails with a Secret conflict:
```bash
kubectl get secret agent-secrets -n ai-agents -o jsonpath='{.metadata.managedFields[*].manager}'
# Remove the conflicting manager (usually kubectl-patch):
kubectl patch secret agent-secrets -n ai-agents --type=json \
  -p='[{"op":"remove","path":"/metadata/managedFields/1"}]'
# Retry helm upgrade
```

## Debugging

### Zero logs from agent pod

Claude Code with `--output-format text` buffers all output until
completion. Zero logs does NOT mean the agent is stuck — it may be
actively working. Check for activity:

```bash
# Check if claude process is running
kubectl exec -n ai-agents <pod> -c agent -- ps aux

# Check conversation log size (grows as agent works)
kubectl exec -n ai-agents <pod> -c agent -- \
  find /home/node/.claude/projects -name "*.jsonl" -exec wc -l {} \;

# Check which tools are being called
kubectl exec -n ai-agents <pod> -c agent -- \
  grep -o '"name":"[^"]*"' /home/node/.claude/projects/-workspace-repo/*.jsonl \
  | sort | uniq -c | sort -rn
```

### Check for permission denials

```bash
kubectl exec -n ai-agents <pod> -c agent -- \
  grep 'is_error.*true' /home/node/.claude/projects/-workspace-repo/*.jsonl
```

Common errors:
- `"Claude requested permissions to write..."` — allowedTools pattern
  not matching. Use bare `Write` not `Write(path/**)`
  ([known bug](/wiki/security/claude-code-write-pattern-bug.html))
- `"No such tool available: mcp__google-news__..."` — MCP server
  failed to start. Check if npm deps are installed (see below)

### Debug pod on workspace PVC

When the agent pod is gone (completed/deleted), use a debug pod to
inspect the workspace:

```bash
kubectl run debug-agent --image=kpericak/ai-agent-runtime:0.2 \
  -n ai-agents \
  --overrides='{
    "spec":{
      "containers":[{
        "name":"debug",
        "image":"kpericak/ai-agent-runtime:0.2",
        "command":["tail","-f","/dev/null"],
        "workingDir":"/workspace/repo",
        "volumeMounts":[{"name":"workspace","mountPath":"/workspace"}]
      }],
      "volumes":[{
        "name":"workspace",
        "persistentVolumeClaim":{"claimName":"agent-workspace"}
      }]
    }
  }'

# Inspect workspace
kubectl exec -n ai-agents debug-agent -- git -C /workspace/repo log --oneline -5
kubectl exec -n ai-agents debug-agent -- ls /workspace/repo/apps/blog/blog/markdown/wiki/journal/

# Test MCP server startup
kubectl exec -n ai-agents debug-agent -- node /workspace/repo/apps/mcp-servers/google-news/build/index.js
kubectl exec -n ai-agents debug-agent -- python3 /workspace/repo/apps/mcp-servers/discord/server.py

# Clean up
kubectl delete pod debug-agent -n ai-agents
```

Note: Claude's conversation logs live in `/home/node/.claude/projects/`
which is on the container's ephemeral filesystem, NOT the PVC. Logs are
lost when the pod is deleted.

### Verify a run succeeded

Checklist after a job completes:

1. **Journal file exists:**
   `kubectl exec debug-agent -- ls /workspace/repo/apps/blog/blog/markdown/wiki/journal/YYYY-MM-DD/`

2. **Commit was made:**
   `kubectl exec debug-agent -- git -C /workspace/repo log --oneline -3`

3. **Discord message posted:**
   Check `#news` channel — the journalist posts a formatted digest

4. **Controller logged completion:**
   `kubectl logs -n ai-agents -l app.kubernetes.io/name=agent-controller --tail=20`

## Key Files

- `infra/ai-agents/agent-controller/main.go` — Controller entrypoint + webhook
- `infra/ai-agents/agent-controller/pkg/controller/controller.go` — Reconcile loop + job creation
- `infra/ai-agents/agent-controller/pkg/discord/discord.go` — Discord #log notifier
- `infra/ai-agents/agent-controller/pkg/crd/types.go` — AgentTask Go types
- `infra/ai-agents/agent-controller/helm/` — Helm chart
- `apps/blog/bin/run-publisher.sh` — Publisher entrypoint script
- `.claude/agents/publisher.md` — Publisher agent definition
- `.claude/agents/journalist.md` — Journalist agent definition
