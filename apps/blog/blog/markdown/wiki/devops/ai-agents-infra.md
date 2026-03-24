---
title: "AI Agents Infrastructure"
summary: "How the infra/ai-agents/ stack is organized, deployed, and kept in sync across the M1 and M2 Mac clusters via ArgoCD GitOps."
keywords:
  - kubernetes
  - argocd
  - gitops
  - helm
  - helmfile
  - vault
  - rancher
  - m1
  - m2
  - multi-cluster
  - cronjob
  - pai-responder
related:
  - wiki/devops/agent-controller
  - wiki/devops/bootstrap
  - wiki/agent-team/pai
scope: "Covers the infra/ai-agents/ directory structure, Helm charts, ArgoCD GitOps setup, per-cluster configuration, and cluster registration. Does not cover agent definitions or the blog content pipeline."
last_verified: 2026-03-23
---


Everything that runs inside Rancher on the Mac machines lives in
`infra/ai-agents/`. Two machines are in scope:

| Machine | Role | Rancher |
|---------|------|---------|
| **M1** | Always-on server — Pai's dedicated AI workstation | Always up |
| **M2** | Gaming laptop — development and ad-hoc testing | Rancher sometimes off |

ArgoCD (running on M1) watches the `main` branch and auto-syncs both
clusters on every push. When M2 is offline its apps show as Unknown —
no action needed.

## Directory layout

```
infra/ai-agents/
├── argocd/                  ← ArgoCD ApplicationSet manifests
├── agent-controller/        ← Go controller (deprecated, not deployed)
├── ai-agent-runtime/        ← Runtime Docker image (Claude Code + Playwright)
├── cronjobs/helm/           ← Native K8s CronJobs (journalist, pai-morning)
├── pai-responder/           ← Discord polling bot Helm chart
├── vault/                   ← HashiCorp Vault Helm values + network policy
├── environments/
│   ├── default.yaml         ← Fallback for manual helmfile runs
│   ├── m1.yaml              ← M1-specific values (all agents enabled)
│   └── m2.yaml              ← M2-specific values (all agents disabled)
├── bin/                     ← bootstrap.sh, configure-vault-auth.sh, store-secrets.sh
└── helmfile.yaml            ← Orchestration (used by bootstrap + ArgoCD fallback)
```

## Helm releases

Three Helm releases make up the active stack:

| Release | Chart | Purpose |
|---------|-------|---------|
| `vault` | `hashicorp/vault` | Secret store with GCP KMS auto-unseal |
| `cronjobs` | `./cronjobs/helm` | Native K8s CronJobs for scheduled agents |
| `pai-responder` | `./pai-responder/helm` | Discord polling bot (M1 only) |

Vault is a hard dependency — CronJob pods and pai-responder both use
Vault Agent Injector to mount secrets at pod startup. The `cronjobs`
chart also manages the `ai-agents` namespace, ServiceAccount, NetworkPolicy,
and ResourceQuota (previously owned by the agent-controller).

## Scheduled agents (CronJobs)

Each scheduled agent runs as a native K8s CronJob in `ai-agents` namespace.
`suspend: true/false` controls whether the schedule fires:

| CronJob | Agent | Schedule (UTC) | M1 | M2 |
|---------|-------|---------------|----|----|
| `journalist` | journalist | 0 12 * * * (8am ET) | enabled | suspended |
| `pai-morning` | pai | 30 12 * * * (8:30am ET) | enabled | suspended |

CronJob pods follow this pattern:
1. **Vault init container** (injected by Vault Agent Injector) — writes secrets to `/vault/secrets/config`
2. **github-token init container** (journalist only) — generates a GitHub App installation token, writes to `/shared/github-token.sh`
3. **Agent container** — sources Vault secrets, clones repo, runs `claude --agent <name>`, pushes if needed
4. **Vault sidecar** — keeps secrets refreshed (auto-injected)

The journalist posts Discord start/done notifications to `#log` and
pushes its commit after the agent succeeds. The pai-morning just sends
a greeting to `#general` with no git writes.

## Per-cluster configuration

`environments/m1.yaml` and `environments/m2.yaml` control what runs:

```yaml
# environments/m1.yaml — M1 gets all scheduled agents + pai-responder
paiResponder:
  enabled: true

cronjobs:
  journalist:
    enabled: true
    schedule: "0 12 * * *"
  paiMorning:
    enabled: true
    schedule: "30 12 * * *"
```

```yaml
# environments/m2.yaml — M2 gets the stack but no active workloads
paiResponder:
  enabled: false

cronjobs:
  journalist:
    enabled: false
    schedule: "0 12 * * *"
  paiMorning:
    enabled: false
    schedule: "30 12 * * *"
```

To enable a CronJob on M1, flip `enabled: true` in `m1.yaml` and
merge to `main` — ArgoCD syncs within ~3 minutes.

## ArgoCD GitOps

ArgoCD is installed on M1 (Helm, `argocd` namespace). It manages all
releases across all registered clusters via **ApplicationSets**.

### How ApplicationSets work

Each release has one ApplicationSet in `infra/ai-agents/argocd/`.
The **cluster generator** selects every ArgoCD-registered cluster
labeled `cluster-role=ai-agents` and generates one Application per cluster:

```
argocd/vault.yaml           → vault-m1, vault-m2
argocd/cronjobs.yaml        → ai-agent-cronjobs-m1, ai-agent-cronjobs-m2
argocd/pai-responder.yaml   → pai-responder-m1, pai-responder-m2
```

The cluster name (`{{name}}`) selects the matching values file:

```yaml
helm:
  valueFiles:
    - ../../../infra/ai-agents/environments/{{name}}.yaml
```

Adding a third machine is: register it in ArgoCD, label it, create
an `environments/<name>.yaml`, done.

### Sync policy

All ApplicationSets use:
```yaml
syncPolicy:
  automated:
    prune: true       # removes resources deleted from git
    selfHeal: true    # reverts manual kubectl changes
```

### Vault: multi-source

Vault's chart comes from the HashiCorp Helm repo, but its values file
lives in this git repo. ArgoCD multi-source handles this:

```yaml
sources:
  - repoURL: https://helm.releases.hashicorp.com
    chart: vault
    targetRevision: "0.32.0"
    helm:
      valueFiles:
        - $values/infra/ai-agents/vault/values.yaml
  - repoURL: https://github.com/kylep/multi
    targetRevision: main
    ref: values
```

## Secrets (Vault)

All secrets are injected by Vault Agent Injector. Vault paths:

| Path | Used by | Contents |
|------|---------|----------|
| `secret/ai-agents/discord` | journalist CronJob | discord_bot_token, discord_guild_id, discord_log_channel_id |
| `secret/ai-agents/github` | journalist CronJob | github_app_id, github_app_private_key (PEM), github_install_id |
| `secret/ai-agents/anthropic` | journalist CronJob | claude_oauth_token |
| `secret/ai-agents/pai` | pai-morning CronJob, pai-responder | discord_bot_token (Pai bot), claude_oauth_token, linear_api_key |
| `secret/ai-agents/openrouter` | (reserved) | openrouter_api_key |
| `secret/ai-agents/webhook` | (reserved) | webhook_token |

To update secrets:
```bash
bash infra/ai-agents/bin/store-secrets.sh
```

The Vault K8s auth role binds the `cronjob-agent` ServiceAccount (used
by all CronJob pods and pai-responder) to the `ai-agents-read` policy.

## Bootstrap (first-time setup)

```bash
bash infra/ai-agents/bin/bootstrap.sh
```

The script is idempotent. On a fresh cluster it:

1. Installs ArgoCD via Helm
2. Deploys Vault via helmfile (needed before ArgoCD can inject secrets)
3. Waits for Vault ready; prints manual init steps if uninitialized
4. Applies all ApplicationSets from `argocd/`
5. Registers the local cluster as `m1` in ArgoCD (requires `argocd` CLI)
6. Labels the cluster secret (`cluster-role=ai-agents`)

After bootstrap, Vault must be initialized and secrets stored (one-time):

```bash
kubectl exec -n vault vault-0 -- vault operator init -format=json \
  > ~/.vault-init && chmod 600 ~/.vault-init
bash infra/ai-agents/bin/configure-vault-auth.sh
bash infra/ai-agents/bin/store-secrets.sh
```

See [Bootstrap & Recovery](/wiki/devops/bootstrap.html) for full Vault
walkthrough and secret paths.

## Registering M2

Run once from any machine that has kubeconfig for both clusters:

```bash
argocd cluster add <m2-context-name> --name m2
kubectl label secret -n argocd \
  -l argocd.argoproj.io/secret-type=cluster \
  cluster-role=ai-agents --overwrite
```

ArgoCD will immediately begin syncing M2. Since `environments/m2.yaml`
suspends all CronJobs and disables pai-responder, M2 gets Vault and the
CronJob infrastructure (namespace, ServiceAccount, NetworkPolicy) but
runs no scheduled workloads.

## Day-to-day operations

**Watch ArgoCD sync status:**
```bash
kubectl port-forward svc/argocd-server -n argocd 8080:80
# open http://localhost:8080
```

**Enable a CronJob on M1:**
Edit `environments/m1.yaml`, set `enabled: true`, merge to `main`.

**Force immediate sync:**
```bash
argocd app sync ai-agent-cronjobs-m1
```

**See what's running:**
```bash
kubectl get cronjobs -n ai-agents
kubectl get jobs -n ai-agents
kubectl get pods -n ai-agents
```

**Watch a CronJob run in real time:**
```bash
kubectl -n ai-agents logs -f <pod-name> -c agent
```

**Manually trigger a CronJob:**
```bash
kubectl create job --from=cronjob/journalist journalist-manual -n ai-agents
```

**Kill a stuck job:**
```bash
kubectl delete job <job-name> -n ai-agents
```
