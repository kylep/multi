#!/usr/bin/env bash
set -euo pipefail
# Configure Vault for the ai-agents stack.
# Vault auto-unseals via GCP KMS (no manual unseal step needed).
# This script is idempotent and safe to re-run after Vault is initialized.
#
# Prerequisites:
#   - vault-0 pod running and unsealed (auto via GCP KMS after init)
#   - ~/.vault-init contains VAULT_ROOT_TOKEN
#   - infra/ai-agents/vault/gcp-credentials.json present (see notes below)
#
# To regenerate gcp-credentials.json on a new machine:
#   gcloud iam service-accounts keys create \
#     infra/ai-agents/vault/gcp-credentials.json \
#     --iam-account=vault-unseal-ai-agents@kylepericak.iam.gserviceaccount.com \
#     --project=kylepericak
#   kubectl create secret generic gcp-credentials \
#     --from-file=gcp-credentials.json=infra/ai-agents/vault/gcp-credentials.json \
#     --namespace=vault --dry-run=client -o yaml | kubectl apply -f -
#
# Note: ROOT_TOKEN passed via sh -c args is visible in process listings.
# Acceptable for single-node dev. For production, use Vault HTTP API or
# kubectl exec --env (K8s 1.30+).

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VAULT_DIR="$SCRIPT_DIR/../vault"
VAULT_CREDS="$HOME/.vault-init"

if [ ! -f "$VAULT_CREDS" ]; then
  echo "Error: $VAULT_CREDS not found. Run vault init and save credentials first."
  exit 1
fi

# Support both key=value format and JSON format from vault operator init
if grep -q '"root_token"' "$VAULT_CREDS" 2>/dev/null; then
  ROOT_TOKEN=$(jq -r '.root_token' "$VAULT_CREDS")
else
  ROOT_TOKEN=$(grep ROOT_TOKEN "$VAULT_CREDS" | cut -d= -f2 | tr -d '\n')
fi

echo "=== Enabling KV v2 secrets engine (idempotent) ==="
kubectl exec -n vault vault-0 -- \
  sh -c "VAULT_TOKEN=$ROOT_TOKEN vault secrets enable -path=secret kv-v2" 2>/dev/null \
  || echo "KV v2 already enabled."

echo ""
echo "=== Enabling Kubernetes auth (idempotent) ==="
kubectl exec -n vault vault-0 -- \
  sh -c "VAULT_TOKEN=$ROOT_TOKEN vault auth enable kubernetes" 2>/dev/null \
  || echo "Kubernetes auth already enabled."

echo ""
echo "=== Configuring Kubernetes auth cluster endpoint ==="
kubectl exec -n vault vault-0 -- \
  sh -c "VAULT_TOKEN=$ROOT_TOKEN vault write auth/kubernetes/config \
    kubernetes_host=https://\$KUBERNETES_SERVICE_HOST:\$KUBERNETES_SERVICE_PORT"

echo ""
echo "=== Writing ai-agents-read Vault policy ==="
kubectl cp "$VAULT_DIR/policy.hcl" vault/vault-0:/tmp/ai-agents-policy.hcl
kubectl exec -n vault vault-0 -- \
  sh -c "VAULT_TOKEN=$ROOT_TOKEN vault policy write ai-agents-read /tmp/ai-agents-policy.hcl"

echo ""
echo "=== Configuring Kubernetes auth role for ai-agents ==="
kubectl exec -n vault vault-0 -- \
  sh -c "VAULT_TOKEN=$ROOT_TOKEN vault write auth/kubernetes/role/ai-agents \
    bound_service_account_names=cronjob-agent \
    bound_service_account_namespaces=ai-agents \
    policies=ai-agents-read \
    ttl=1h"

echo ""
echo "=== Enabling audit logging (idempotent) ==="
kubectl exec -n vault vault-0 -- \
  sh -c "VAULT_TOKEN=$ROOT_TOKEN vault audit enable file file_path=stdout" 2>/dev/null \
  || echo "Audit logging already enabled."

echo ""
echo "=== Vault auth configuration complete ==="
echo "Run bin/store-secrets.sh to populate secrets."
