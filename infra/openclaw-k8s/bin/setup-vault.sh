#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VAULT_DIR="$SCRIPT_DIR/../vault"

echo "=== Installing Vault via Helm ==="
helm repo add hashicorp https://helm.releases.hashicorp.com
helm repo update

helm install vault hashicorp/vault \
  --namespace vault --create-namespace \
  -f "$VAULT_DIR/vault-values.yaml"

echo ""
echo "=== Waiting for vault-0 pod ==="
kubectl wait --for=condition=Ready pod/vault-0 \
  -n vault --timeout=120s 2>/dev/null || true

# Wait for the pod to be running (it won't be Ready until unsealed)
echo "Waiting for vault-0 to be running..."
kubectl wait --for=jsonpath='{.status.phase}'=Running pod/vault-0 \
  -n vault --timeout=120s

echo ""
echo "=== Initializing Vault ==="
INIT_OUTPUT=$(kubectl exec -n vault vault-0 -- \
  vault operator init -key-shares=1 -key-threshold=1 -format=json)

UNSEAL_KEY=$(echo "$INIT_OUTPUT" | jq -r '.unseal_keys_b64[0]')
ROOT_TOKEN=$(echo "$INIT_OUTPUT" | jq -r '.root_token')

# Save credentials locally (NOT in git)
VAULT_CREDS="$HOME/.vault-init"
cat > "$VAULT_CREDS" <<EOF
VAULT_UNSEAL_KEY=$UNSEAL_KEY
VAULT_ROOT_TOKEN=$ROOT_TOKEN
EOF
chmod 600 "$VAULT_CREDS"
echo "Vault credentials saved to $VAULT_CREDS"

echo ""
echo "=== Unsealing Vault ==="
kubectl exec -n vault vault-0 -- \
  vault operator unseal "$UNSEAL_KEY"

echo ""
echo "=== Enabling KV v2 secrets engine ==="
kubectl exec -n vault vault-0 -- \
  sh -c "VAULT_TOKEN=$ROOT_TOKEN vault secrets enable -path=secret kv-v2"

echo ""
echo "=== Writing Vault policy ==="
kubectl cp "$VAULT_DIR/vault-policy.hcl" vault/vault-0:/tmp/openclaw-policy.hcl
kubectl exec -n vault vault-0 -- \
  sh -c "VAULT_TOKEN=$ROOT_TOKEN vault policy write openclaw-read /tmp/openclaw-policy.hcl"

echo ""
echo "=== Enabling Kubernetes auth ==="
kubectl exec -n vault vault-0 -- \
  sh -c "VAULT_TOKEN=$ROOT_TOKEN vault auth enable kubernetes"

kubectl exec -n vault vault-0 -- \
  sh -c "VAULT_TOKEN=$ROOT_TOKEN vault write auth/kubernetes/config \
    kubernetes_host=https://\$KUBERNETES_SERVICE_HOST:\$KUBERNETES_SERVICE_PORT"

echo ""
echo "=== Creating Kubernetes auth role ==="
kubectl exec -n vault vault-0 -- \
  sh -c "VAULT_TOKEN=$ROOT_TOKEN vault write auth/kubernetes/role/openclaw \
    bound_service_account_names=openclaw \
    bound_service_account_namespaces=openclaw \
    policies=openclaw-read \
    ttl=1h"

echo ""
echo "=== Enabling audit logging ==="
kubectl exec -n vault vault-0 -- \
  sh -c "VAULT_TOKEN=$ROOT_TOKEN vault audit enable file \
  file_path=stdout"

echo ""
echo "=== Applying Vault NetworkPolicy ==="
kubectl apply -f "$VAULT_DIR/network-policy.yaml"

echo ""
echo "=== Vault setup complete ==="
echo ""
echo "To store secrets, run: bin/store-secrets.sh"
