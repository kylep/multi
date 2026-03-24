#!/usr/bin/env bash
set -euo pipefail
# Store ai-agents secrets in Vault, split by concern.
# Usage: ./store-secrets.sh                     (interactive prompts)
#        CLAUDE_TOKEN=x DISCORD_TOKEN=y ./store-secrets.sh  (env vars, skip prompts)
#
# Supported env vars (set any subset, unset vars prompt interactively):
#   CLAUDE_TOKEN, OPENROUTER_KEY,
#   GITHUB_TOKEN, GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY_B64 or GITHUB_APP_KEY_FILE, GITHUB_INSTALL_ID, REPO_URL,
#   DISCORD_TOKEN, DISCORD_GUILD, DISCORD_LOG_CH,
#   PAI_DISCORD_TOKEN, PAI_CLAUDE_TOKEN, LINEAR_API_KEY,
#   WEBHOOK_TOKEN
#
# Note: secrets passed as env/args to kubectl exec, visible in process listings.
# Acceptable for single-node dev. See configure-vault-auth.sh header.

VAULT_CREDS="$HOME/.vault-init"
if [ ! -f "$VAULT_CREDS" ]; then
  echo "Error: $VAULT_CREDS not found."
  exit 1
fi

# Support both key=value format and JSON format from vault operator init
if grep -q '"root_token"' "$VAULT_CREDS" 2>/dev/null; then
  ROOT_TOKEN=$(jq -r '.root_token' "$VAULT_CREDS")
else
  ROOT_TOKEN=$(grep ROOT_TOKEN "$VAULT_CREDS" | cut -d= -f2)
fi

# Bail if Vault is sealed
SEALED=$(kubectl exec -n vault vault-0 -- vault status -format=json 2>/dev/null \
  | jq -r '.sealed' 2>/dev/null || echo "true")
if [ "$SEALED" = "true" ]; then
  echo "Error: Vault is sealed. Run bin/unseal.sh first."
  exit 1
fi

get_existing() {
  kubectl exec -n vault vault-0 -- env "VAULT_TOKEN=$ROOT_TOKEN" \
    vault kv get -format=json "secret/ai-agents/$1" 2>/dev/null \
    | jq -r '.data.data // {} | keys[]' 2>/dev/null || true
}

already_set() {
  local path=$1 key=$2
  echo "$path" | grep -qx "$key" && echo " [Already set]" || echo ""
}

kv_store() {
  local subpath=$1; shift
  # shellcheck disable=SC2068
  kubectl exec -n vault vault-0 -- env "VAULT_TOKEN=$ROOT_TOKEN" \
    vault kv patch "secret/ai-agents/$subpath" $@ 2>/dev/null \
    || kubectl exec -n vault vault-0 -- env "VAULT_TOKEN=$ROOT_TOKEN" \
      vault kv put "secret/ai-agents/$subpath" $@
}

# prompt_or_env VAR_NAME PROMPT_TEXT [secret]
# Uses the env var if set, otherwise prompts interactively.
# Pass "secret" as third arg to hide input.
# If stdin is not a terminal, skips the prompt (treats as empty/skip).
prompt_or_env() {
  local var_name=$1 prompt_text=$2 is_secret=${3:-}
  local current_val="${!var_name:-}"
  if [ -n "$current_val" ]; then
    echo "$prompt_text (from env)"
    return
  fi
  if [ ! -t 0 ]; then
    echo "$prompt_text: (skipped, no tty)"
    return
  fi
  if [ "$is_secret" = "secret" ]; then
    printf "%s: " "$prompt_text"
    read -sp "" "$var_name"; echo ""
  else
    printf "%s: " "$prompt_text"
    read -rp "" "$var_name"
  fi
}

echo "=== Anthropic / Claude Code ==="
EXISTING_ANTHROPIC=$(get_existing anthropic)
prompt_or_env CLAUDE_TOKEN "Claude Code OAuth token$(already_set "$EXISTING_ANTHROPIC" claude_oauth_token)" secret
[ -n "${CLAUDE_TOKEN:-}" ] && kv_store anthropic "claude_oauth_token=$CLAUDE_TOKEN"

echo ""
echo "=== OpenRouter ==="
EXISTING_OPENROUTER=$(get_existing openrouter)
prompt_or_env OPENROUTER_KEY "OpenRouter API key$(already_set "$EXISTING_OPENROUTER" openrouter_api_key)" secret
[ -n "${OPENROUTER_KEY:-}" ] && kv_store openrouter "openrouter_api_key=$OPENROUTER_KEY"

echo ""
echo "=== GitHub ==="
EXISTING_GITHUB=$(get_existing github)
prompt_or_env GITHUB_TOKEN "GitHub PAT$(already_set "$EXISTING_GITHUB" github_token)" secret
prompt_or_env GITHUB_APP_ID "GitHub App ID$(already_set "$EXISTING_GITHUB" github_app_id)"
# Resolve PEM: prefer base64 env var, fall back to file path
GITHUB_APP_KEY=""
GITHUB_APP_KEY_TMPFILE=""
if [ -n "${GITHUB_APP_PRIVATE_KEY_B64:-}" ]; then
  echo "GitHub App private key (from base64 env)"
  GITHUB_APP_KEY_TMPFILE=$(mktemp)
  echo "$GITHUB_APP_PRIVATE_KEY_B64" | base64 -d > "$GITHUB_APP_KEY_TMPFILE"
  GITHUB_APP_KEY="set"
elif [ -n "${GITHUB_APP_KEY_FILE:-}" ]; then
  echo "GitHub App private key (from file path env)"
  GITHUB_APP_KEY_TMPFILE="$GITHUB_APP_KEY_FILE"
  GITHUB_APP_KEY="set"
else
  prompt_or_env GITHUB_APP_KEY_FILE "GitHub App private key file path$(already_set "$EXISTING_GITHUB" github_app_private_key)"
  if [ -n "${GITHUB_APP_KEY_FILE:-}" ]; then
    GITHUB_APP_KEY_TMPFILE="$GITHUB_APP_KEY_FILE"
    GITHUB_APP_KEY="set"
  fi
fi
prompt_or_env GITHUB_INSTALL_ID "GitHub App install ID$(already_set "$EXISTING_GITHUB" github_install_id)"
prompt_or_env REPO_URL "Repo URL$(already_set "$EXISTING_GITHUB" repo_url)"
GITHUB_ARGS=""
[ -n "${GITHUB_TOKEN:-}" ]      && GITHUB_ARGS="$GITHUB_ARGS github_token=$GITHUB_TOKEN"
[ -n "${GITHUB_APP_ID:-}" ]     && GITHUB_ARGS="$GITHUB_ARGS github_app_id=$GITHUB_APP_ID"
[ -n "${GITHUB_INSTALL_ID:-}" ] && GITHUB_ARGS="$GITHUB_ARGS github_install_id=$GITHUB_INSTALL_ID"
[ -n "${REPO_URL:-}" ]          && GITHUB_ARGS="$GITHUB_ARGS repo_url=$REPO_URL"
# shellcheck disable=SC2086
[ -n "$GITHUB_ARGS" ]           && kv_store github $GITHUB_ARGS
# Store private key separately (multiline PEM can't be passed inline)
# Copy PEM into the pod as a temp file, then use @/path for Vault
if [ -n "$GITHUB_APP_KEY" ]; then
  # Ensure cleanup of PEM material on all exit paths
  cleanup_pem() {
    kubectl exec -n vault vault-0 -- rm -f /tmp/github-app-key.pem 2>/dev/null || true
    if [ -n "${GITHUB_APP_PRIVATE_KEY_B64:-}" ] && [ -n "$GITHUB_APP_KEY_TMPFILE" ]; then
      rm -f "$GITHUB_APP_KEY_TMPFILE"
    fi
  }
  trap cleanup_pem EXIT
  kubectl cp "$GITHUB_APP_KEY_TMPFILE" vault/vault-0:/tmp/github-app-key.pem
  kubectl exec -n vault vault-0 -- env "VAULT_TOKEN=$ROOT_TOKEN" \
    vault kv patch secret/ai-agents/github github_app_private_key=@/tmp/github-app-key.pem 2>/dev/null \
  || kubectl exec -n vault vault-0 -- env "VAULT_TOKEN=$ROOT_TOKEN" \
    vault kv put secret/ai-agents/github github_app_private_key=@/tmp/github-app-key.pem
  cleanup_pem
  trap - EXIT
fi

echo ""
echo "=== Discord ==="
EXISTING_DISCORD=$(get_existing discord)
prompt_or_env DISCORD_TOKEN "Discord bot token$(already_set "$EXISTING_DISCORD" discord_bot_token)" secret
prompt_or_env DISCORD_GUILD "Discord guild ID$(already_set "$EXISTING_DISCORD" discord_guild_id)"
prompt_or_env DISCORD_LOG_CH "Discord log channel ID$(already_set "$EXISTING_DISCORD" discord_log_channel_id)"
DISCORD_ARGS=""
[ -n "${DISCORD_TOKEN:-}" ]   && DISCORD_ARGS="$DISCORD_ARGS discord_bot_token=$DISCORD_TOKEN"
[ -n "${DISCORD_GUILD:-}" ]   && DISCORD_ARGS="$DISCORD_ARGS discord_guild_id=$DISCORD_GUILD"
[ -n "${DISCORD_LOG_CH:-}" ]  && DISCORD_ARGS="$DISCORD_ARGS discord_log_channel_id=$DISCORD_LOG_CH"
# shellcheck disable=SC2086
[ -n "$DISCORD_ARGS" ]        && kv_store discord $DISCORD_ARGS

echo ""
echo "=== Pai ==="
EXISTING_PAI=$(get_existing pai)
prompt_or_env PAI_DISCORD_TOKEN "Pai Discord bot token$(already_set "$EXISTING_PAI" discord_bot_token)" secret
prompt_or_env PAI_CLAUDE_TOKEN "Pai Claude OAuth token (leave blank to reuse anthropic secret)$(already_set "$EXISTING_PAI" claude_oauth_token)" secret
prompt_or_env LINEAR_API_KEY "Linear API key$(already_set "$EXISTING_PAI" linear_api_key)" secret
# Fall back to the shared Claude token if not set separately
if [ -z "${PAI_CLAUDE_TOKEN:-}" ] && [ -n "${CLAUDE_TOKEN:-}" ]; then
  PAI_CLAUDE_TOKEN="$CLAUDE_TOKEN"
fi
PAI_ARGS=""
[ -n "${PAI_DISCORD_TOKEN:-}" ] && PAI_ARGS="$PAI_ARGS discord_bot_token=$PAI_DISCORD_TOKEN"
[ -n "${PAI_CLAUDE_TOKEN:-}" ]  && PAI_ARGS="$PAI_ARGS claude_oauth_token=$PAI_CLAUDE_TOKEN"
[ -n "${LINEAR_API_KEY:-}" ]    && PAI_ARGS="$PAI_ARGS linear_api_key=$LINEAR_API_KEY"
# shellcheck disable=SC2086
[ -n "$PAI_ARGS" ]              && kv_store pai $PAI_ARGS

echo ""
echo "=== Webhook ==="
EXISTING_WEBHOOK=$(get_existing webhook)
prompt_or_env WEBHOOK_TOKEN "Webhook bearer token$(already_set "$EXISTING_WEBHOOK" webhook_token)" secret
[ -n "${WEBHOOK_TOKEN:-}" ] && kv_store webhook "webhook_token=$WEBHOOK_TOKEN"

echo ""
echo "Secrets stored. Paths: secret/ai-agents/{anthropic,openrouter,github,discord,pai,webhook}"
echo "  pai: discord_bot_token, claude_oauth_token, linear_api_key"
