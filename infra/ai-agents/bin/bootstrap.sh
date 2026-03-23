#!/usr/bin/env bash
set -euo pipefail
# Bootstrap the AI agent K8s stack from bare K3s.
# Idempotent — safe to re-run on an already-running cluster.
#
# After bootstrap, ArgoCD owns all ongoing syncs. Changes merged to main
# are automatically applied to each registered cluster within ~3 minutes.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INFRA_DIR="$SCRIPT_DIR/.."

# 0. Restore secret files from env vars if available
if [ -n "${GCP_CREDENTIALS_B64:-}" ] || [ -n "${GITHUB_APP_PRIVATE_KEY_B64:-}" ]; then
  echo "Restoring secrets from base64 env vars..."
  bash "$SCRIPT_DIR/restore-secrets.sh"
fi

# 1. Check prerequisites
for cmd in kubectl helm docker; do
  command -v "$cmd" >/dev/null || { echo "Error: $cmd not found"; exit 1; }
done

# 2. Install ArgoCD (idempotent)
echo "Installing ArgoCD..."
helm repo add argo https://argoproj.github.io/argo-helm 2>/dev/null || true
helm repo update argo
helm upgrade --install argocd argo/argo-cd \
  --namespace argocd \
  --create-namespace \
  --set "configs.params.server\.insecure=true" \
  --wait --timeout 5m

# 3. Deploy Vault via helmfile (needed before ArgoCD can inject secrets into other pods)
echo "Deploying Vault via helmfile..."
command -v helmfile >/dev/null || { echo "Error: helmfile not found"; exit 1; }
helmfile -f "$INFRA_DIR/helmfile.yaml" -e "${CLUSTER_ENV:-default}" apply \
  --selector name=vault

# 4. Wait for Vault pod ready
echo "Waiting for vault-0..."
kubectl wait --for=condition=Ready pod/vault-0 -n vault --timeout=120s

# 5. If vault not initialized, print manual steps
INITIALIZED=$(kubectl exec -n vault vault-0 -- vault status -format=json 2>/dev/null \
  | jq -r '.initialized' 2>/dev/null || echo "false")
if [ "$INITIALIZED" = "false" ]; then
  echo ""
  echo "=== Manual Vault setup required ==="
  echo "1. kubectl exec -n vault vault-0 -- vault operator init -format=json > ~/.vault-init && chmod 600 ~/.vault-init"
  echo "2. bash $SCRIPT_DIR/configure-vault-auth.sh"
  echo "3. bash $SCRIPT_DIR/store-secrets.sh"
  echo ""
else
  echo "Vault already initialized."
  bash "$SCRIPT_DIR/configure-vault-auth.sh"
fi

# 6. Apply ArgoCD ApplicationSets (ArgoCD takes over all releases from here)
echo "Applying ArgoCD ApplicationSets..."
kubectl apply -f "$INFRA_DIR/argocd/"

# 7. Register this cluster in ArgoCD and label it for the cluster generator
# Requires: argocd CLI and ArgoCD server accessible
ARGOCD_SERVER="${ARGOCD_SERVER:-localhost:8080}"
if command -v argocd >/dev/null; then
  echo "Registering this cluster in ArgoCD as 'm1'..."
  ARGOCD_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret \
    -o jsonpath='{.data.password}' | base64 -d)
  argocd login "$ARGOCD_SERVER" --username admin --password "$ARGOCD_PASSWORD" \
    --insecure --grpc-web 2>/dev/null || true
  argocd cluster add "$(kubectl config current-context)" --name m1 --yes \
    --insecure 2>/dev/null || echo "Cluster 'm1' already registered (or argocd login failed — label manually)"
  # Label the cluster secret so the ApplicationSet generator picks it up
  kubectl label secret -n argocd \
    -l "argocd.argoproj.io/secret-type=cluster" \
    cluster-role=ai-agents --overwrite 2>/dev/null || true
else
  echo ""
  echo "=== argocd CLI not found — complete cluster registration manually ==="
  echo "   argocd cluster add \$(kubectl config current-context) --name m1"
  echo "   kubectl label secret -n argocd -l argocd.argoproj.io/secret-type=cluster cluster-role=ai-agents"
fi

# 8. Report status
echo ""
echo "=== Status ==="
kubectl get pods -n argocd
kubectl get pods -n vault
kubectl get pods -n ai-agents 2>/dev/null || true
echo ""
echo "ArgoCD initial admin password:"
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath='{.data.password}' | base64 -d && echo
echo ""
echo "=== Next steps ==="
echo "1. If Vault not initialized: complete the manual steps above"
echo "2. Access ArgoCD UI: kubectl port-forward svc/argocd-server -n argocd 8080:80"
echo ""
echo "=== To register M2 (run from a machine with both kubecontexts) ==="
echo "   argocd cluster add <m2-context> --name m2"
echo "   kubectl label secret -n argocd -l argocd.argoproj.io/secret-type=cluster cluster-role=ai-agents --overwrite"
echo "   (Then bootstrap.sh on M2 for Vault — or point M2 at M1's Vault if on same network)"
echo ""
echo "Done. ArgoCD will auto-sync all releases on every push to main."
