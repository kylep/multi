---
title: "Bootstrap & Recovery"
summary: "From factory-reset Mac to running AI agent K8s stack — single-command bootstrap, Vault secret management, and post-reboot recovery."
keywords:
  - bootstrap
  - vault
  - kubernetes
  - helm
  - helmfile
  - recovery
  - ansible
  - mac-setup
related:
  - wiki/devops/agent-controller
  - wiki/design-docs/hardened-iac-bootstrap
scope: "Covers full Mac setup from factory reset, K8s stack bootstrapping, Vault init/auth/secrets, post-reboot recovery, and troubleshooting."
last_verified: 2026-03-18
---


## From factory reset to running stack

On a factory-reset Mac, two things are needed: this bootstrap script
and `exports.sh` from the old machine (USB drive, AirDrop, etc.).

### 1. Run the Mac bootstrap

```bash
source exports.sh
sudo bash -c "$(curl -fsSL https://raw.githubusercontent.com/kylep/multi/main/infra/mac-setup/bootstrap.sh)"
```

Or if the repo is already cloned:

```bash
source ~/gh/multi/apps/blog/exports.sh
sudo bash ~/gh/multi/infra/mac-setup/bootstrap.sh
```

This installs (idempotent — safe to re-run):
- Xcode CLI tools, Homebrew
- Git, GitHub CLI, Node.js, Python, jq, helm, helmfile, pre-commit
- Rancher Desktop (K3s + Docker)
- Claude Code (`@anthropic-ai/claude-code`)
- SSH key, git config, pre-commit hooks, blog npm deps
- Lima VM workspace directories for agent pods

Uses Ansible under the hood (`infra/mac-setup/playbook.yml`) so
state is tracked and runs are idempotent.

### 2. Transfer secrets and authenticate

```bash
# Copy exports.sh from old machine, then:
source ~/gh/multi/apps/blog/exports.sh
claude setup-token
```

`exports.sh` is the single portable secret file — it contains all
API keys plus base64-encoded GCP credentials and GitHub App PEM.

### 3. Bootstrap the K8s stack

```bash
bash ~/gh/multi/infra/ai-agents/bin/bootstrap.sh
```

This decodes secrets from env vars, deploys Vault + agent-controller
via helmfile, and configures Vault auth. See the detailed walkthrough
below for first-time Vault initialization.

---

## K8s stack details

## Prerequisites

- `kubectl` — cluster reachable via `kubectl cluster-info`
- `helm` — v3+
- `helmfile` — v0.150+
- `docker` — images pre-built and pushed (or use `--build-images`)
- `jq` — used by bootstrap and Vault scripts

## Quick start

```bash
bash infra/ai-agents/bin/bootstrap.sh
```

On a fresh cluster, the script prints manual Vault steps after helmfile
sync completes. On an existing cluster it's idempotent — safe to re-run.

## Fresh install walkthrough

### 0. Prepare secrets

**If you have `exports.sh` from a prior machine**, `source` it and skip to
step 1 — `bootstrap.sh` detects the base64 env vars (`GCP_CREDENTIALS_B64`,
`GITHUB_APP_PRIVATE_KEY_B64`), decodes the files, and creates the GCP
credentials K8s Secret automatically.

```bash
source apps/blog/exports.sh
```

`exports.sh` is the single file to back up and transfer between machines.
The only machine-specific secret is the Claude Code OAuth token — run
`claude setup-token` on the new machine.

**If starting from scratch** (no `exports.sh`), generate the GCP
credentials manually:

```bash
gcloud iam service-accounts keys create \
  infra/ai-agents/vault/gcp-credentials.json \
  --iam-account=vault-unseal-ai-agents@kylepericak.iam.gserviceaccount.com \
  --project=kylepericak
```

Then create the namespace and K8s Secret:

```bash
kubectl create namespace vault
kubectl create secret generic gcp-credentials \
  --from-file=gcp-credentials.json=infra/ai-agents/vault/gcp-credentials.json \
  --namespace=vault
```

You can also run `restore-secrets.sh` standalone after populating
the env vars:

```bash
bash infra/ai-agents/bin/restore-secrets.sh
```

### 1. Run bootstrap.sh

```bash
bash infra/ai-agents/bin/bootstrap.sh
```

This does:
1. Checks prerequisites (kubectl, helm, helmfile, docker)
2. Runs `helmfile sync` — installs Vault (in `vault` namespace) and
   agent-controller (in `ai-agents` namespace) with dependency ordering
   (CRDs are managed by the Helm chart)
3. Waits for `vault-0` pod to be ready
4. Applies sample AgentTask manifests (journalist cron, publisher manual)

### 2. Initialize Vault (first time only)

If Vault has never been initialized, the bootstrap script prints these
manual steps:

```bash
kubectl exec -n vault vault-0 -- vault operator init -format=json > ~/.vault-init
chmod 600 ~/.vault-init
```

Save `~/.vault-init` securely — it contains the root token and recovery
keys. With GCP KMS auto-unseal, Vault unseals automatically after init.
There are no Shamir unseal keys; instead you get 5 recovery keys
(3-of-5 threshold) used only for root token regeneration.

### 3. Configure Vault auth

```bash
bash infra/ai-agents/bin/configure-vault-auth.sh
```

Reads `VAULT_ROOT_TOKEN` from `~/.vault-init`. Configures:
- KV v2 secrets engine at `secret/`
- Kubernetes auth method pointing at the in-cluster API server
- `ai-agents-read` policy (read on `secret/data/ai-agents/*`)
- `ai-agents` role bound to the `agent-controller` ServiceAccount in
  `ai-agents` namespace
- Audit logging to stdout

### 4. Store secrets

```bash
bash infra/ai-agents/bin/store-secrets.sh
```

Interactive prompts for each secret group. Press Enter to skip a field
(preserves existing value). Secrets needed:

| Group | Fields |
|-------|--------|
| Anthropic | `claude_oauth_token` |
| OpenRouter | `openrouter_api_key` |
| GitHub | `github_token`, `github_app_id`, `github_app_private_key` (file path), `github_install_id`, `repo_url` |
| Discord | `discord_bot_token`, `discord_guild_id`, `discord_log_channel_id` |
| Webhook | `webhook_token` |

The GitHub App private key is copied into the Vault pod as a temp file
and stored via `@/path` syntax to preserve newlines.

#### Where to find each secret

| Secret | Source |
|--------|--------|
| Claude OAuth token | Run `claude setup-token` on a machine where Claude Code is authenticated |
| OpenRouter API key | [openrouter.ai](https://openrouter.ai) → Account → API Keys |
| GitHub App ID | GitHub → Settings → Developer settings → GitHub Apps → PericakAI |
| GitHub App private key | Same page → Private keys → Generate (one-time download, save the `.pem` file). Stored in `exports.sh` as `GITHUB_APP_PRIVATE_KEY_B64` |
| GitHub Install ID | GitHub → Settings → Applications → Installed GitHub Apps → PericakAI (the URL contains the installation ID) |
| Discord bot token | Discord Developer Portal → Application → Bot → Token (reset if lost) |
| Discord guild/channel IDs | Right-click server or channel in Discord with Developer Mode enabled → Copy ID |
| Webhook token | Self-generated bearer token for internal webhook auth (any strong random string) |

### 5. Restart controller and verify

```bash
kubectl rollout restart deploy/agent-controller -n ai-agents
kubectl get pods -n ai-agents
```

The controller pod should show `2/2 Ready` (controller + Vault sidecar).

### 6. Prepare Lima VM workspace directory

Read-only agents share a hostPath PVC at `/tmp/agent-workspace`. K3s
runs inside a Lima VM (Rancher Desktop), and `HostPathDirectoryOrCreate`
creates directories as `root:root 755` — agent pods running as UID 1001
can't write to them. Set the sticky bit so all UIDs can create
subdirectories:

```bash
rdctl shell -- sudo mkdir -p /tmp/agent-workspace /tmp/agent-workspace/branches
rdctl shell -- sudo chmod 1777 /tmp/agent-workspace /tmp/agent-workspace/branches
```

This is a one-time step per factory reset. Write agents (journalist,
publisher, qa) use `emptyDir` volumes and are not affected.

## Secret structure

Vault KV v2 paths under `secret/ai-agents/`:

| Path | Keys | Used by |
|------|------|---------|
| `secret/ai-agents/anthropic` | `claude_oauth_token` | Controller + agent Jobs |
| `secret/ai-agents/openrouter` | `openrouter_api_key` | Journalist agent Jobs |
| `secret/ai-agents/github` | `github_token`, `github_app_id`, `github_app_private_key`, `github_install_id`, `repo_url` | Controller (JWT signing) + write agent Jobs |
| `secret/ai-agents/discord` | `discord_bot_token`, `discord_guild_id`, `discord_log_channel_id` | Controller + agent Jobs |
| `secret/ai-agents/webhook` | `webhook_token` | Controller (webhook auth) |

All secrets are injected via Vault Agent Injector annotations. The
injector writes to an in-memory tmpfs at `/vault/secrets/` — secrets
never touch etcd.

## Post-reboot recovery

GCP KMS auto-unseal means Vault unseals itself on restart. No manual
unseal step required.

### Verify after reboot

```bash
# Check Vault status
kubectl exec -n vault vault-0 -- vault status

# Check pods
kubectl get pods -n vault
kubectl get pods -n ai-agents
```

Vault should show `Sealed: false`. The controller pod should be `2/2`.

### If controller pods are stuck

If the controller restarted before Vault was ready, the Vault init
container may have failed. Restart the deployment:

```bash
kubectl rollout restart deploy/agent-controller -n ai-agents
```

### GCP credentials

GCP KMS auto-unseal requires a service account key at
`/vault/userconfig/gcp-credentials/gcp-credentials.json` (mounted from
K8s Secret `gcp-credentials` in the `vault` namespace).

To regenerate on a new machine:

```bash
gcloud iam service-accounts keys create \
  infra/ai-agents/vault/gcp-credentials.json \
  --iam-account=vault-unseal-ai-agents@kylepericak.iam.gserviceaccount.com \
  --project=kylepericak
kubectl create secret generic gcp-credentials \
  --from-file=gcp-credentials.json=infra/ai-agents/vault/gcp-credentials.json \
  --namespace=vault --dry-run=client -o yaml | kubectl apply -f -
```

## Troubleshooting

### Vault sealed

Shouldn't happen with GCP KMS auto-unseal. If it does:

1. Check GCP credentials: `kubectl get secret gcp-credentials -n vault`
2. Check Vault logs: `kubectl logs vault-0 -n vault`
3. Look for GCP KMS errors (network, permissions, key disabled)
4. Verify the GCP service account key hasn't expired or been revoked

### Pods pending (quota)

The `ai-agents` namespace has a ResourceQuota (2 CPU requests, 4Gi
memory requests, 8 pods). Completed Jobs hold quota until their
`ttlSecondsAfterFinished` (1 hour) expires.

```bash
kubectl describe resourcequota -n ai-agents
kubectl get jobs -n ai-agents
```

Delete completed jobs to free quota if needed:

```bash
kubectl delete job <job-name> -n ai-agents
```

### Pods rejected (PSS violation)

The `ai-agents` namespace enforces PSS restricted. Pods missing
`seccompProfile: RuntimeDefault`, `capabilities.drop: ALL`, or
`runAsNonRoot: true` will be rejected at admission.

```bash
kubectl get events -n ai-agents --field-selector reason=FailedCreate
```

### Webhook timeout (Vault injector not ready)

Pod creation may timeout if the Vault Agent Injector webhook isn't
reachable. The injector runs in the `vault` namespace.

```bash
kubectl get pods -n vault -l app.kubernetes.io/name=vault-agent-injector
kubectl get mutatingwebhookconfigurations
```

Wait for the injector pod to be ready, then retry pod creation.

### Agent Job quota exhaustion

If Jobs can't schedule, check for accumulated completed pods:

```bash
kubectl get pods -n ai-agents --field-selector=status.phase!=Running
```

Jobs have `ttlSecondsAfterFinished: 3600` — they auto-delete after 1
hour. To clear immediately:

```bash
kubectl delete jobs --field-selector=status.successful=1 -n ai-agents
```

## Key files

| File | Purpose |
|------|---------|
| `infra/mac-setup/bootstrap.sh` | Factory-reset Mac → ready for K8s (curl \| bash entry point) |
| `infra/mac-setup/playbook.yml` | Ansible playbook for Mac system configuration |
| `infra/ai-agents/bin/bootstrap.sh` | K8s stack bootstrap (Vault + agent-controller) |
| `infra/ai-agents/bin/configure-vault-auth.sh` | Vault K8s auth + policy setup |
| `infra/ai-agents/bin/restore-secrets.sh` | Decode base64 env vars to files + create K8s Secret |
| `infra/ai-agents/bin/store-secrets.sh` | Interactive secret storage |
| `infra/ai-agents/bin/vault-cmd.sh` | Vault command helper |
| `infra/ai-agents/helmfile.yaml` | Helmfile with Vault + controller releases |
| `infra/ai-agents/environments/default.yaml` | Environment values (StorageClass, image tags) |
| `infra/ai-agents/vault/values.yaml` | Vault Helm chart values |
| `infra/ai-agents/vault/policy.hcl` | `ai-agents-read` Vault policy |
| `infra/ai-agents/agent-controller/helm/` | Agent controller Helm chart |
