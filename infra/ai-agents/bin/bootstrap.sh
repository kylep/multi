#!/usr/bin/env bash
set -euo pipefail
# Bootstrap the AI agent K8s stack from bare K3s.
# Idempotent — safe to re-run on an already-running cluster.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INFRA_DIR="$SCRIPT_DIR/.."

# 1. Check prerequisites
for cmd in kubectl helm helmfile docker; do
  command -v "$cmd" >/dev/null || { echo "Error: $cmd not found"; exit 1; }
done

# 2. Apply CRDs (before helmfile, since controller needs them)
echo "Applying CRDs..."
kubectl apply -f "$INFRA_DIR/agent-controller/config/crd/"

# 3. Helmfile sync (creates vault + ai-agents namespaces, deploys charts)
echo "Running helmfile sync..."
helmfile -f "$INFRA_DIR/helmfile.yaml" sync

# 4. Wait for Vault pod ready
echo "Waiting for vault-0..."
kubectl wait --for=condition=Ready pod/vault-0 -n vault --timeout=120s

# 5. If vault not initialized, print manual steps
INITIALIZED=$(kubectl exec -n vault vault-0 -- vault status -format=json 2>/dev/null \
  | jq -r '.initialized' 2>/dev/null || echo "false")
if [ "$INITIALIZED" = "false" ]; then
  echo ""
  echo "=== Manual Vault setup required ==="
  echo "1. kubectl exec -n vault vault-0 -- vault operator init -format=json > ~/.vault-init"
  echo "2. bash $SCRIPT_DIR/configure-vault-auth.sh"
  echo "3. bash $SCRIPT_DIR/store-secrets.sh"
  echo ""
  echo "Then restart the controller:"
  echo "   kubectl rollout restart deploy/agent-controller -n ai-agents"
else
  echo "Vault already initialized."
  # Run auth config idempotently
  bash "$SCRIPT_DIR/configure-vault-auth.sh"
fi

# 6. Apply sample AgentTask manifests
echo "Applying sample AgentTasks..."
kubectl apply -f "$INFRA_DIR/agent-controller/config/samples/"

# 7. Report status
echo ""
echo "=== Status ==="
kubectl get pods -n vault
kubectl get pods -n ai-agents
echo ""
echo "Done. If this is a fresh install, complete the manual Vault steps above."
