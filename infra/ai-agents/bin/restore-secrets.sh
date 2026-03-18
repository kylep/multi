#!/usr/bin/env bash
set -euo pipefail
# Restore secret files from base64 env vars and create the GCP K8s Secret.
# Usage: source apps/blog/exports.sh && bash infra/ai-agents/bin/restore-secrets.sh
#
# Idempotent — safe to re-run. Skips steps if the relevant env var is empty.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$SCRIPT_DIR/../../.."

GCP_CREDS_FILE="$REPO_ROOT/infra/ai-agents/vault/gcp-credentials.json"
PEM_FILE="$REPO_ROOT/secrets/pericakai.private-key.pem"

# 1. Decode GCP credentials
if [ -n "${GCP_CREDENTIALS_B64:-}" ]; then
  echo "Decoding GCP credentials → $GCP_CREDS_FILE"
  echo "$GCP_CREDENTIALS_B64" | base64 -d > "$GCP_CREDS_FILE"
  chmod 600 "$GCP_CREDS_FILE"
else
  echo "GCP_CREDENTIALS_B64 not set, skipping GCP credentials file"
fi

# 2. Decode GitHub App private key
if [ -n "${GITHUB_APP_PRIVATE_KEY_B64:-}" ]; then
  mkdir -p "$(dirname "$PEM_FILE")"
  echo "Decoding GitHub App private key → $PEM_FILE"
  echo "$GITHUB_APP_PRIVATE_KEY_B64" | base64 -d > "$PEM_FILE"
  chmod 600 "$PEM_FILE"
else
  echo "GITHUB_APP_PRIVATE_KEY_B64 not set, skipping GitHub App private key"
fi

# 3. Create GCP credentials K8s Secret for Vault auto-unseal
if [ -f "$GCP_CREDS_FILE" ]; then
  echo "Creating vault namespace (if not exists)..."
  kubectl create namespace vault 2>/dev/null || true

  echo "Creating/updating gcp-credentials K8s Secret..."
  kubectl create secret generic gcp-credentials \
    --from-file=gcp-credentials.json="$GCP_CREDS_FILE" \
    --namespace=vault \
    --dry-run=client -o yaml | kubectl apply -f -
else
  echo "No GCP credentials file found, skipping K8s Secret creation"
fi

echo "Done."
