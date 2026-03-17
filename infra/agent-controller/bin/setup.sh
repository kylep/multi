#!/bin/bash
set -euo pipefail

# Bootstrap the agent controller on a fresh K8s cluster.
# Prereqs: kubectl, helm, docker on PATH; cluster reachable.

REPO_ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
SECRETS_FILE="${AGENT_SECRETS_FILE:-$REPO_ROOT/secrets/export-agent-controller.sh}"
BUILD_IMAGES=false

usage() {
  echo "Usage: $0 [--build-images]"
  echo
  echo "  --build-images  Build and push controller + runtime Docker images"
  echo
  echo "Secrets are sourced from \$AGENT_SECRETS_FILE or"
  echo "  $REPO_ROOT/secrets/export-agent-controller.sh"
  echo
  echo "See secrets/export-agent-controller.sh.SAMPLE for required vars."
  exit 1
}

for arg in "$@"; do
  case "$arg" in
    --build-images) BUILD_IMAGES=true ;;
    -h|--help) usage ;;
    *) echo "Unknown arg: $arg"; usage ;;
  esac
done

# --- Prereqs ---
echo "==> Checking prerequisites..."
for cmd in kubectl helm docker; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "ERROR: $cmd not found on PATH"
    exit 1
  fi
done

if ! kubectl cluster-info >/dev/null 2>&1; then
  echo "ERROR: kubectl cannot reach a cluster"
  exit 1
fi
echo "    kubectl, helm, docker OK"

# --- Source secrets ---
if [ ! -f "$SECRETS_FILE" ]; then
  echo "ERROR: Secrets file not found: $SECRETS_FILE"
  echo "Copy secrets/export-agent-controller.sh.SAMPLE and populate it."
  exit 1
fi
echo "==> Sourcing secrets from $SECRETS_FILE"
# shellcheck disable=SC1090
source "$SECRETS_FILE"

# --- Optional image builds ---
if [ "$BUILD_IMAGES" = true ]; then
  echo "==> Building runtime image..."
  docker build -t kpericak/ai-agent-runtime:0.4 "$REPO_ROOT/infra/ai-agent-runtime"
  docker push kpericak/ai-agent-runtime:0.4

  echo "==> Building controller image..."
  docker build -t kpericak/agent-controller:0.6 "$REPO_ROOT/infra/agent-controller"
  docker push kpericak/agent-controller:0.6
fi

# --- Namespace ---
echo "==> Creating namespace ai-agents..."
kubectl create ns ai-agents --dry-run=client -o yaml | kubectl apply -f -

# --- Helm install/upgrade ---
echo "==> Running helm upgrade --install..."
helm upgrade --install agent-controller \
  "$REPO_ROOT/infra/agent-controller/helm" \
  -n ai-agents

# --- Patch secrets ---
echo "==> Patching secrets..."

# Simple string values via stringData
kubectl -n ai-agents patch secret agent-secrets --type merge -p "{
  \"stringData\": {
    \"OPENROUTER_API_KEY\": \"${OPENROUTER_API_KEY:-}\",
    \"DISCORD_BOT_TOKEN\": \"${DISCORD_BOT_TOKEN:-}\",
    \"DISCORD_GUILD_ID\": \"${DISCORD_GUILD_ID:-}\",
    \"DISCORD_LOG_CHANNEL_ID\": \"${DISCORD_LOG_CHANNEL_ID:-1483433712296398942}\",
    \"AI_WEBHOOK_TOKEN\": \"${AI_WEBHOOK_TOKEN:-}\",
    \"CLAUDE_CODE_OAUTH_TOKEN\": \"${CLAUDE_CODE_OAUTH_TOKEN:-}\",
    \"GITHUB_APP_ID\": \"${GITHUB_APP_ID:-}\",
    \"GITHUB_INSTALL_ID\": \"${GITHUB_INSTALL_ID:-}\"
  }
}"

# PEM key is base64-encoded (binary-safe)
if [ -n "${GITHUB_APP_PRIVATE_KEY_PATH:-}" ] && [ -f "${GITHUB_APP_PRIVATE_KEY_PATH}" ]; then
  echo "==> Patching GitHub App private key..."
  kubectl -n ai-agents patch secret agent-secrets --type merge -p \
    "{\"data\":{\"GITHUB_APP_PRIVATE_KEY\":\"$(base64 < "$GITHUB_APP_PRIVATE_KEY_PATH")\"}}"
else
  echo "    Skipping GitHub App private key (GITHUB_APP_PRIVATE_KEY_PATH not set or file missing)"
fi

# --- Verify ---
echo
echo "==> Deployment status:"
kubectl -n ai-agents get pods -l app.kubernetes.io/name=agent-controller
echo
echo "==> To trigger a publisher run:"
echo "    kubectl port-forward -n ai-agents deployment/agent-controller 8080:8080"
echo "    curl -X POST http://localhost:8080/webhook \\"
echo "      -H 'Authorization: Bearer <AI_WEBHOOK_TOKEN>' \\"
echo "      -H 'Content-Type: application/json' \\"
echo "      -d '{\"agent\": \"publisher\", \"prompt\": \"Write a post about ...\"}'"
echo
echo "Done."
