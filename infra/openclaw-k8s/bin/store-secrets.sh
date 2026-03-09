#!/usr/bin/env bash
set -euo pipefail

# Store OpenClaw secrets in Vault
# Usage: ./store-secrets.sh
# Note: secrets passed via sh -c args, visible in process listings.
# Acceptable for single-node dev. See setup-vault.sh header.

VAULT_CREDS="$HOME/.vault-init"
if [ ! -f "$VAULT_CREDS" ]; then
  echo "Error: $VAULT_CREDS not found. Run setup-vault.sh first."
  exit 1
fi

ROOT_TOKEN=$(grep ROOT_TOKEN "$VAULT_CREDS" | cut -d= -f2)

# Bail if Vault is sealed
SEALED=$(kubectl exec -n vault vault-0 -- vault status -format=json 2>/dev/null \
  | jq -r '.sealed' 2>/dev/null || echo "true")
if [ "$SEALED" = "true" ]; then
  echo "Error: Vault is sealed. Unseal it first:"
  echo "  source ~/.vault-init && kubectl exec -n vault vault-0 -- vault operator unseal \"\$VAULT_UNSEAL_KEY\""
  exit 1
fi

# Check which secrets are already set in Vault
EXISTING=$(kubectl exec -n vault vault-0 -- sh -c \
  "VAULT_TOKEN=$ROOT_TOKEN vault kv get -format=json secret/openclaw" 2>/dev/null \
  | jq -r '.data.data // {} | keys[]' 2>/dev/null || true)

show_status() {
  if echo "$EXISTING" | grep -qx "$1"; then
    echo " [Already set]"
  else
    echo ""
  fi
}

echo "Enter your secrets (leave blank to skip):"
echo ""

printf "Gemini API key%s: " "$(show_status gemini_api_key)"
read -sp "" GEMINI_KEY
echo ""
printf "Telegram bot token%s: " "$(show_status telegram_bot_token)"
read -sp "" TELEGRAM_TOKEN
echo ""
printf "Linear API key%s: " "$(show_status linear_api_key)"
read -sp "" LINEAR_KEY
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
if [ -n "$LINEAR_KEY" ]; then
  CMD="$CMD linear_api_key=$LINEAR_KEY"
  FALLBACK_CMD="$FALLBACK_CMD linear_api_key=$LINEAR_KEY"
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
