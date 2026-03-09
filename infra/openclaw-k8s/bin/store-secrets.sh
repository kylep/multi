#!/usr/bin/env bash
set -euo pipefail

# Store OpenClaw secrets in Vault
# Usage: ./store-secrets.sh

VAULT_CREDS="$HOME/.vault-init"
if [ ! -f "$VAULT_CREDS" ]; then
  echo "Error: $VAULT_CREDS not found. Run setup-vault.sh first."
  exit 1
fi

ROOT_TOKEN=$(grep ROOT_TOKEN "$VAULT_CREDS" | cut -d= -f2)

echo "Enter your secrets (leave blank to skip):"
echo ""

read -sp "Gemini API key: " GEMINI_KEY
echo ""
read -sp "Telegram bot token: " TELEGRAM_TOKEN
echo ""

# Use kv patch to merge with existing values (won't erase
# keys you skip). Falls back to kv put on first run when
# there's nothing to patch yet.
CMD="VAULT_TOKEN=$ROOT_TOKEN vault kv patch secret/openclaw"
FALLBACK_CMD="VAULT_TOKEN=$ROOT_TOKEN vault kv put secret/openclaw"
HAS_KEYS=false

if [ -n "$GEMINI_KEY" ]; then
  CMD="$CMD gemini_api_key=$GEMINI_KEY"
  FALLBACK_CMD="$FALLBACK_CMD gemini_api_key=$GEMINI_KEY"
  HAS_KEYS=true
fi
if [ -n "$TELEGRAM_TOKEN" ]; then
  CMD="$CMD telegram_bot_token=$TELEGRAM_TOKEN"
  FALLBACK_CMD="$FALLBACK_CMD telegram_bot_token=$TELEGRAM_TOKEN"
  HAS_KEYS=true
fi

if [ "$HAS_KEYS" = false ]; then
  echo "No secrets entered, nothing to do."
  exit 0
fi

# Try patch first (merges), fall back to put (creates)
kubectl exec -n vault vault-0 -- sh -c "$CMD" 2>/dev/null \
  || kubectl exec -n vault vault-0 -- sh -c "$FALLBACK_CMD"

echo ""
echo "Secrets stored in Vault."

echo "Restarting openclaw pod to pick up new secrets..."
kubectl delete pod -n openclaw -l app.kubernetes.io/name=openclaw
echo "Waiting for new pod to schedule..."
sleep 5
kubectl wait --for=condition=Ready pod -l app.kubernetes.io/name=openclaw \
  -n openclaw --timeout=120s
echo "Pod restarted and ready."
