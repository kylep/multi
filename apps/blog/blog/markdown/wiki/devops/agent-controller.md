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
  - debugging
  - runbook
related:
  - wiki/agent-team
  - wiki/journal
  - wiki/security/claude-code-write-pattern-bug
scope: "Covers the agent controller architecture, CRD spec, Helm deployment, runtime image, debugging, and operational procedures. Does not cover agent definitions or blog content pipeline."
last_verified: 2026-03-16
---


Custom K8s controller that watches `AgentTask` CRDs and creates Jobs
to run AI agents. Lives in `infra/agent-controller/`.

Primary use case: daily AI news digest written to the wiki journal
by the `journalist` agent at 8am ET (12:00 UTC).

## Architecture

The system has two images:

| Image | Purpose | Source |
|-------|---------|--------|
| `kpericak/ai-agent-runtime:0.2` | Claude Code + OpenCode CLI + MCP deps | `infra/ai-agent-runtime/` |
| `kpericak/agent-controller:0.5` | Go controller binary | `infra/agent-controller/` |

The controller runs as a Deployment, watching `AgentTask` resources.
When a task is due, it creates a Job with:
1. **Init container** (`alpine/git`) — clones/updates the repo
2. **Main container** (`ai-agent-runtime`) — installs MCP deps, writes
   MCP config, runs the agent CLI

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

**Known bug:** Path-restricted patterns like `Write(apps/**)` silently
fail in Claude Code headless mode (`-p` flag). Use bare tool names
instead (e.g. `Write` not `Write(path/**)`). See
[claude-code-write-pattern-bug](/wiki/security/claude-code-write-pattern-bug.html).

`Bash` patterns (e.g. `Bash(git commit *)`) work correctly.

## MCP Servers

The controller configures two MCP servers for each Claude run:

| Server | Command | Deps |
|--------|---------|------|
| Discord | `python3 apps/mcp-servers/discord/server.py` | `mcp[cli]`, `httpx` (in runtime image) |
| google-news | `node apps/mcp-servers/google-news/build/index.js` | `@modelcontextprotocol/sdk`, `zod` (npm install at job start) |

The controller writes `/tmp/mcp.json` and passes `--mcp-config /tmp/mcp.json`
to Claude Code. Discord Python deps are baked into the runtime image.
Google-news Node deps are installed at job startup via
`cd apps/mcp-servers/google-news && npm install --omit=dev`.

MCP servers must be committed to git — the init container clones
the repo, so untracked files won't exist in the container.

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
  --set secrets.openrouterApiKey=sk-or-... \
  --set secrets.discordBotToken=... \
  --set secrets.discordGuildId=... \
  --set secrets.webhookToken=...
```

Uses a hostPath PV on single-node Rancher Desktop. Not suitable for
multi-node clusters.

### Secrets

The helm chart's `secret.yaml` uses `lookup` to preserve existing
secret values on `helm upgrade`. Only a fresh `helm install` reads
from `values.yaml`. This prevents `helm upgrade` from wiping
credentials with empty defaults.

To set or rotate a secret after initial install, patch directly:

```bash
kubectl patch secret agent-secrets -n ai-agents --type=merge \
  -p "{\"data\":{\"ANTHROPIC_AUTH_TOKEN\":\"$(echo -n $OPENROUTER_API_KEY | base64)\",\"OPENROUTER_API_KEY\":\"$(echo -n $OPENROUTER_API_KEY | base64)\",\"DISCORD_BOT_TOKEN\":\"$(echo -n $DISCORD_BOT_TOKEN | base64)\",\"DISCORD_GUILD_ID\":\"$(echo -n $DISCORD_GUILD_ID | base64)\",\"AI_WEBHOOK_TOKEN\":\"$(echo -n $AI_WEBHOOK_TOKEN | base64)\"}}"
```

Required env vars for this command: `OPENROUTER_API_KEY`,
`DISCORD_BOT_TOKEN`, `DISCORD_GUILD_ID`, `AI_WEBHOOK_TOKEN`.

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

- `infra/agent-controller/main.go` — Controller entrypoint + webhook
- `infra/agent-controller/pkg/controller/controller.go` — Reconcile loop + job creation + command building
- `infra/agent-controller/pkg/crd/types.go` — AgentTask Go types
- `infra/agent-controller/config/crd/agenttask.yaml` — CRD definition
- `infra/agent-controller/config/samples/daily-ai-news.yaml` — Primary scheduled task
- `infra/agent-controller/helm/` — Helm chart (values.yaml has image tags)
- `infra/ai-agent-runtime/Dockerfile` — Runtime image
- `.claude/agents/journalist.md` — Journalist agent definition

## Related

- [Daily AI News Digest in K8s](/cron-event-triggered-ai-agents-k8s.html):
  build walkthrough and architecture decisions
- [Write pattern bug](/wiki/security/claude-code-write-pattern-bug.html):
  upstream Claude Code bug affecting headless permissions
