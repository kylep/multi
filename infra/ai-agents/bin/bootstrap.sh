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

# 6. Create cloudflared-token K8s secret from Vault (idempotent)
VAULT_CREDS="$HOME/.vault-init"
if [ -f "$VAULT_CREDS" ]; then
  if grep -q '"root_token"' "$VAULT_CREDS" 2>/dev/null; then
    ROOT_TOKEN=$(jq -r '.root_token' "$VAULT_CREDS")
  else
    ROOT_TOKEN=$(grep ROOT_TOKEN "$VAULT_CREDS" | cut -d= -f2)
  fi
  SEALED=$(kubectl exec -n vault vault-0 -- vault status -format=json 2>/dev/null \
    | jq -r '.sealed' 2>/dev/null || echo "true")
  if [ "$SEALED" = "false" ]; then
    TUNNEL_TOKEN=$(kubectl exec -n vault vault-0 -- \
      env "VAULT_TOKEN=$ROOT_TOKEN" \
      vault kv get -field=tunnel_token secret/ai-agents/cloudflare 2>/dev/null || echo "")
    if [ -n "$TUNNEL_TOKEN" ]; then
      echo "Creating cloudflared-token K8s secret..."
      kubectl create namespace cloudflared --dry-run=client -o yaml | kubectl apply -f -
      kubectl create secret generic cloudflared-token \
        --from-literal=tunnelToken="$TUNNEL_TOKEN" \
        -n cloudflared \
        --dry-run=client -o yaml | kubectl apply -f -
    else
      echo "Cloudflare tunnel token not in Vault — run store-secrets.sh then re-run bootstrap.sh."
    fi
  fi
fi

# 7. Apply ArgoCD ApplicationSets (ArgoCD takes over all releases from here)
echo "Applying ArgoCD ApplicationSets..."
kubectl apply -f "$INFRA_DIR/argocd/"

# 8. Register this cluster in ArgoCD and label it for the cluster generator
# Requires: argocd CLI and ArgoCD server accessible
ARGOCD_SERVER="${ARGOCD_SERVER:-localhost:8080}"
if command -v argocd >/dev/null; then
  echo "Registering this cluster in ArgoCD as 'pai-m1'..."
  ARGOCD_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret \
    -o jsonpath='{.data.password}' | base64 -d)
  argocd login "$ARGOCD_SERVER" --username admin --password "$ARGOCD_PASSWORD" \
    --insecure --grpc-web 2>/dev/null || true
  argocd cluster add "$(kubectl config current-context)" --name pai-m1 --yes \
    --insecure 2>/dev/null || echo "Cluster 'pai-m1' already registered (or argocd login failed — label manually)"
  # Label the cluster secret so the ApplicationSet generators pick it up
  # cluster-role=ai-agents: all workloads (cronjobs, traefik, pai-responder)
  # cloudflare-tunnel=true: cloudflared deployment (pai-m1 only — each cluster needs its own token)
  kubectl label secret -n argocd \
    -l "argocd.argoproj.io/secret-type=cluster" \
    cluster-role=ai-agents cloudflare-tunnel=true --overwrite 2>/dev/null || true
else
  echo ""
  echo "=== argocd CLI not found — complete cluster registration manually ==="
  echo "   argocd cluster add \$(kubectl config current-context) --name pai-m1"
  echo "   kubectl label secret -n argocd -l argocd.argoproj.io/secret-type=cluster cluster-role=ai-agents cloudflare-tunnel=true"
fi

# 9. Report status
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
echo "=== To register kyle-m2 (run from a machine with both kubecontexts) ==="
echo "   argocd cluster add <kyle-m2-context> --name kyle-m2"
echo "   kubectl label secret -n argocd -l argocd.argoproj.io/secret-type=cluster cluster-role=ai-agents --overwrite"
echo "   (Then bootstrap.sh on kyle-m2 for Vault — or point kyle-m2 at M1's Vault if on same network)"
echo ""
echo "Done. ArgoCD will auto-sync all releases on every push to main."
