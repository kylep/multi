#!/usr/bin/env bash
# Run a vault command inside the vault-0 pod, authenticated with root token.
# Usage: vault-cmd.sh <vault subcommand and args...>
# Example: vault-cmd.sh kv list secret/ai-agents/
# Example: vault-cmd.sh kv get secret/ai-agents/discord
set -euo pipefail

VAULT_CREDS="$HOME/.vault-init"
if [ ! -f "$VAULT_CREDS" ]; then
  echo "Error: $VAULT_CREDS not found." >&2
  exit 1
fi

ROOT_TOKEN=$(grep ROOT_TOKEN "$VAULT_CREDS" | cut -d= -f2)

if [ $# -eq 0 ]; then
  echo "Usage: vault-cmd.sh <vault subcommand and args...>" >&2
  exit 1
fi

kubectl exec -n vault vault-0 -- sh -c "VAULT_TOKEN=$ROOT_TOKEN vault $*"
