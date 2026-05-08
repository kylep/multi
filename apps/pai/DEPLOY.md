# Pai v2 — Deploy Runbook

> **Audience:** future Claude on the M1 (Kyle's K8s host). Picks up after
> the worktree-openclaw-features branch was pushed from M2. The branch
> contains all the code; this file gets it onto the live cluster.
>
> **Status when this was written:** branch is pushed, PR is open, all 44
> unit tests pass on M2, helm template renders cleanly. **Nothing has
> been applied to the cluster yet.**

## Prerequisites

You're on the M1. Rancher Desktop is running. The `ai-agents` namespace
already has Vault, the existing v1 pai-responder, and the cronjob
ecosystem.

**Branch and worktree:**

```bash
cd /Users/kp/gh/multi   # M1 repo root, NOT a worktree
git fetch origin
git checkout worktree-openclaw-features
git pull --ff-only
```

If `git pull` reports diverged history, stop — something pushed after
the M2 work. Diagnose before continuing.

**Vault has the right secrets.** v1 pai-responder already uses
`secret/ai-agents/pai`; v2 reuses the same path. Spot-check:

```bash
infra/ai-agents/bin/vault-cmd.sh kv get secret/ai-agents/pai 2>&1 | \
  grep -E '(claude_oauth_token|discord_bot_token|linear_api_key)'
```

Expected: three matching lines. If any are missing, the deploy will
work but Pai will fail to authenticate.

**Quick-look at the v1 pod's PVC contents** (so you can verify
migration ran later):

```bash
kubectl exec -n ai-agents deploy/pai-responder -c pai-responder -- ls /data/
```

Note whether `memory.json` exists. If it does, migrate.py will convert
it on the next pod start.

## Deploy

### 1. Render the chart

```bash
helm template infra/ai-agents/pai-responder/helm > /tmp/pai-rendered.yaml
echo "rendered $(wc -l < /tmp/pai-rendered.yaml) lines"
```

Expected: ~2050 lines. Quickly verify it includes the new init
containers and `MEMORY_DATA_DIR`:

```bash
grep -E '(initContainers|workingDir|MEMORY_DATA_DIR|migrate-memory|clone-repo)' /tmp/pai-rendered.yaml | head
```

Expected: at least 5 matching lines covering both init containers and
the new env var.

### 2. Apply the manifest

```bash
kubectl apply -f /tmp/pai-rendered.yaml -n ai-agents
```

This will:
- Replace the existing `pai-responder` Deployment (strategy: Recreate)
- Update the `pai-responder-script` ConfigMap (memory_mcp.py is
  rewritten, memory_store.py removed, migrate.py added)
- Leave the PVC `pai-responder-state` untouched

Expect the existing pod to terminate and a new one to come up. Watch
it:

```bash
kubectl get pods -n ai-agents -l app.kubernetes.io/name=pai-responder -w
```

Expected sequence: `Init:0/2` → `Init:1/2` → `Init:2/2` → `Pending` →
`Running 2/2`. The two init containers must complete before the main
container starts.

### 3. If a pod gets stuck

If the pod stays in `Init:0/2` for more than 30 seconds, the git-clone
init is failing (likely network or the public repo is unreachable from
the cluster):

```bash
kubectl logs -n ai-agents -l app.kubernetes.io/name=pai-responder \
  -c clone-repo --tail=50
```

If `Init:1/2` is stuck, migrate-memory failed:

```bash
kubectl logs -n ai-agents -l app.kubernetes.io/name=pai-responder \
  -c migrate-memory --tail=50
```

Common causes:
- `migrate.py` import error → the runtime image's `mcp` package is
  missing (shouldn't happen on `kpericak/ai-agent-runtime:0.6`, but
  worth checking with `kubectl exec ... -- python3 -c 'import mcp'`)
- `MEMORY.md` permissions → the PVC root might be 777 root-owned (the
  same gotcha documented in
  `wiki/devops/agent-controller.md`). Fix with
  `kubectl exec ... -- chmod 1777 /data` OR rdctl-shell `chmod 1777
  /tmp/pai-state` on the Lima VM.

If the main container is `CrashLoopBackOff`:

```bash
kubectl logs -n ai-agents -l app.kubernetes.io/name=pai-responder \
  -c pai-responder --tail=100 --previous
```

The most likely cause is gateway.py failing to find the agent
definition (`claude --agent pai`). Fix: verify the clone-repo init
landed `.claude/agents/pai.md` at `/workspace/repo/.claude/agents/pai.md`:

```bash
kubectl exec -n ai-agents deploy/pai-responder -c pai-responder -- \
  ls /workspace/repo/.claude/agents/
```

### 4. Verify migration ran

After the pod is `Running 2/2`:

```bash
kubectl exec -n ai-agents deploy/pai-responder -c pai-responder -- ls -la /data/
```

Expected:
- `MEMORY.md` exists (might be empty if there was no v1 data)
- `memory.json.bak.<timestamp>` exists if there was a v1 file
- `daily/` directory exists or will exist after first daily write
- `state.json`, `transcripts/`, `thread_bindings.json` preserved

### 5. Verify gateway started cleanly

```bash
kubectl logs -n ai-agents -l app.kubernetes.io/name=pai-responder \
  -c pai-responder --tail=50
```

Expected lines:
- `Pai bot ready as Pai (id=...)`
- `Catchup complete, seeded N message IDs`
- `Health server listening on :8080`

Should NOT see:
- `claude: command not found` (would mean image issue)
- `ImportError` (would mean memory_mcp or other dependency issue)
- `agent pai not found` (would mean the cloned repo path isn't right)

## Smoke tests

### Test A: Active recall

Seed a memory entry, then ask Pai about it:

```bash
kubectl exec -n ai-agents deploy/pai-responder -c pai-responder -- \
  python3 -c \
  'import os, sys; sys.path.insert(0, "/opt/pai"); \
   os.environ["MEMORY_DATA_DIR"] = "/data"; \
   from memory_mcp import MemoryStore; \
   MemoryStore().save(scope="long", key="Kyle", \
     content="prefers TypeScript over JavaScript"); \
   print("seeded")'
```

In a personal Discord channel, send: `@Pai what language do I prefer?`

While the reply is pending:

```bash
kubectl logs -n ai-agents -l app.kubernetes.io/name=pai-responder \
  -c pai-responder -f
```

Expected: a log line about pai-recaller running, then the main `pai`
invocation completing. The Discord reply should mention TypeScript.

**If the reply doesn't reference TypeScript**, the recall path isn't
working. Likely cause: pai-recaller agent not findable. Check:

```bash
kubectl exec -n ai-agents deploy/pai-responder -c pai-responder -- \
  cat /workspace/repo/.claude/agents/pai-recaller.md | head -5
```

If that shows the recaller frontmatter, the issue is more subtle —
add `--verbose` to the `recall_for` command in gateway.py and
redeploy.

### Test B: Commitment delivery

In Discord: `@Pai please remind me in 2 minutes to test the commitment system, post in this channel`

Pai should:
1. Acknowledge in Discord (reply or thread)
2. Save a commitment via `memory_save(scope="commitment", ...)` —
   verify with:
   ```bash
   kubectl exec -n ai-agents deploy/pai-responder -c pai-responder -- \
     cat /data/COMMITMENTS.md
   ```
   Expected: a YAML-fenced block with `status: pending` and a `due`
   ~2 min in the future.

3. Within 60 seconds of the due time, the `_commitment_tick` task
   should fire. Watch:

   ```bash
   kubectl logs -n ai-agents -l app.kubernetes.io/name=pai-responder \
     -c pai-responder -f | grep -i commitment
   ```

   Expected: `delivered commitment c-XXXXXXXX` log line, plus a new
   message in the Discord channel from Pai with the reminder content.

4. After delivery, the commitment in `/data/COMMITMENTS.md` should
   have `status: delivered`.

**If the commitment never delivers**, the `_commitment_tick` task may
have crashed. Check the pod logs for an exception trace.

### Test C: Playwright

In Discord: `@Pai grab the title of https://example.com`

Pai should use `mcp__playwright__browser_navigate` +
`mcp__playwright__browser_evaluate` (or `browser_snapshot`) and reply
with "Example Domain" or similar.

**If Playwright fails** — common in K8s because of chromium sandbox
restrictions — gate it and file a Tier 2 task:

1. Edit `.claude/agents/pai.md`, remove the six `mcp__playwright__*`
   tool entries.
2. Commit:
   ```bash
   git add .claude/agents/pai.md
   git commit -m "pai: gate Playwright until chromium sidecar (Tier 2)"
   ```
3. Re-render and re-apply:
   ```bash
   helm template infra/ai-agents/pai-responder/helm > /tmp/pai-rendered.yaml
   kubectl apply -f /tmp/pai-rendered.yaml -n ai-agents
   ```
4. Add a comment to the PR describing the gate and the Tier 2
   follow-up (chromium sidecar pattern from
   `wiki/tool-research/openclaw.md`).

## Wrap up

### If all three smoke tests passed

Add a comment to the PR with the test outcomes:

```bash
gh pr comment <PR-number> --body "Deployed and smoke-tested on M1:

- Recall: Pai used <active_memory> block for the seeded TypeScript entry, replied correctly
- Commitments: 2-min reminder fired within 60s of due time, status=delivered
- Playwright: <result>

Migration log: <one-line summary from migrate-memory init container>

Ready to merge."
```

Then **stop and ask the user before merging**. Branch protection
requires explicit approval. Don't auto-merge.

### If any smoke test failed

Don't merge. Fix in place on the branch:

1. Diagnose using the troubleshooting steps in this file or the
   design doc (`wiki/design-docs/pai-improvements.md`).
2. Make code changes, commit on the same branch.
3. Re-render the chart, `kubectl apply` again.
4. Re-run the failing smoke test.
5. Push the new commits.
6. Add a PR comment summarising the fix.

If you can't fix it autonomously after one or two attempts, **stop and
ask the user**. Don't keep iterating without checking in — that's how
infra cleanups eat days.

### Rollback (if you need to back out entirely)

The previous v1 manifest can be restored by checking out main and
re-applying:

```bash
git checkout main
helm template infra/ai-agents/pai-responder/helm > /tmp/pai-v1.yaml
kubectl apply -f /tmp/pai-v1.yaml -n ai-agents
```

The v1 pai-responder will replace the v2 deployment. The PVC's
`MEMORY.md` will be ignored by v1 but won't be deleted; v1 will keep
using `memory.json.bak.<ts>` (you'd need to rename it back to
`memory.json` to restore v1 memory state).

## Notes for the operator (Kyle, when you're back)

- **Whether to merge** is your call. The smoke tests are the gate, but
  the strategic call ("does this version of Pai work for me") is
  yours.
- **Lima VM gotcha:** if you blow away the VM, `/tmp/pai-state` (the
  hostPath PVC) gets wiped. The cluster will recreate it but the
  `MEMORY.md` and history are gone. Worth backing up to the repo if
  you really want it durable.
- **What's deferred to Tier 2:**
  - Sub-agent orchestration (Pai gains the `Agent` tool, can
    decompose Discord requests into multi-agent flows).
  - Chromium sidecar (if Playwright in-process is flaky in K8s).
  - Voice (skipped per direction).
  - Unifying the two Discord MCP servers (one in pai-responder
    ConfigMap, one cloned from `apps/mcp-servers/discord/`).
- **Where the design rationale lives:**
  `apps/blog/blog/markdown/wiki/design-docs/pai-improvements.md`
  — has the WHAT and WHY for every architectural decision.
