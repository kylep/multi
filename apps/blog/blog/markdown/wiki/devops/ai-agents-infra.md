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
  - agent-controller
  - pai-responder
  - agent-tasks
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
├── agent-controller/        ← K8s controller Helm chart + Go source
├── agent-tasks/helm/        ← AgentTask CRs as Helm templates
├── ai-agent-runtime/        ← Runtime Docker image (Claude Code + Playwright)
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

Four Helm releases make up the stack:

| Release | Chart | Purpose |
|---------|-------|---------|
| `vault` | `hashicorp/vault` | Secret store with GCP KMS auto-unseal |
| `agent-controller` | `./agent-controller/helm` | CRD controller that runs AgentTask Jobs |
| `pai-responder` | `./pai-responder/helm` | Discord polling bot (M1 only) |
| `agent-tasks` | `./agent-tasks/helm` | AgentTask CR objects, enabled per cluster |

Vault is a hard dependency — `agent-controller` and `pai-responder`
both use Vault Agent Injector to mount secrets into pods at runtime.

## Per-cluster configuration

`environments/m1.yaml` and `environments/m2.yaml` are Helm values
files that control what runs on each machine:

```yaml
# environments/m1.yaml — M1 gets everything
paiResponder:
  enabled: true        # pai-responder Deployment, PVC, ConfigMap
tasks:
  journalist:
    enabled: true      # daily-ai-news AgentTask
  paiMorning:
    enabled: true      # pai-morning-greeting AgentTask
  publisher:
    enabled: false     # manual-only; enable here to deploy the CR
  analyst:
    enabled: false
```

```yaml
# environments/m2.yaml — M2 gets the stack but no active workloads
paiResponder:
  enabled: false       # avoid duplicate Discord listener; M2 unreliable
tasks:
  journalist:
    enabled: false
  paiMorning:
    enabled: false
  publisher:
    enabled: false
  analyst:
    enabled: false
```

To promote a scheduled task from M2-only to M1, or to enable a manual
task on a specific cluster, flip the flag and merge to `main` — ArgoCD
picks it up within ~3 minutes.

## ArgoCD GitOps

ArgoCD is installed on M1 (Helm, `argocd` namespace). It manages all
four releases across all registered clusters via **ApplicationSets**.

### How ApplicationSets work

Each release has one ApplicationSet manifest in `infra/ai-agents/argocd/`.
The **cluster generator** selects every ArgoCD-registered cluster
labeled `cluster-role=ai-agents` and generates one Application per cluster:

```
argocd/vault.yaml          → vault-m1, vault-m2
argocd/agent-controller.yaml → agent-controller-m1, agent-controller-m2
argocd/pai-responder.yaml  → pai-responder-m1, pai-responder-m2
argocd/agent-tasks.yaml    → agent-tasks-m1, agent-tasks-m2
```

The cluster name (`{{name}}`) selects the matching values file:

```yaml
helm:
  valueFiles:
    - ../../../infra/ai-agents/environments/{{name}}.yaml
```

Adding a third machine is: register it in ArgoCD, label it, done.
No YAML changes required.

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

Requires ArgoCD v2.6+.

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
7. Prints instructions for Vault manual setup and M2 registration

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
disables all tasks and pai-responder, the cluster gets the full
infrastructure (Vault, agent-controller) but runs no scheduled workloads.

## Day-to-day operations

**Watch ArgoCD sync status:**
```bash
kubectl port-forward svc/argocd-server -n argocd 8080:80
# open http://localhost:8080
```

**Enable a task on M1:**
Edit `environments/m1.yaml`, flip the flag, merge to `main`.

**Force immediate sync:**
```bash
argocd app sync agent-tasks-m1
```

**See what's running:**
```bash
kubectl get agenttasks -n ai-agents
kubectl get pods -n ai-agents
```

For agent-controller operations (triggering, debugging, webhook),
see [Agent Controller](/wiki/devops/agent-controller.html).
