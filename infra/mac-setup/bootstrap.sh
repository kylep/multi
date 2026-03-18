#!/usr/bin/env bash
set -euo pipefail
# Bootstrap a factory-reset Mac to "ready for secrets and K8s".
# Idempotent — safe to re-run at any stage.
#
# Usage (factory reset):
#   source exports.sh   # must be available — contains GitHub App credentials
#   bash -c "$(curl -fsSL https://raw.githubusercontent.com/kylep/multi/main/infra/mac-setup/bootstrap.sh)"
#
# Usage (repo already cloned):
#   source ~/gh/multi/apps/blog/exports.sh
#   bash ~/gh/multi/infra/mac-setup/bootstrap.sh
#
# What this does:
#   1. Installs Xcode CLI tools (if missing)
#   2. Installs Homebrew (if missing)
#   3. Installs Ansible + Git + gh via Homebrew
#   4. Authenticates gh as GitHub App (from exports.sh env vars)
#   5. Clones the repo (if not already present)
#   6. Runs the Ansible playbook to install everything else

REPO_URL="https://github.com/kpericak/multi.git"
REPO_DIR="$HOME/gh/multi"
PLAYBOOK="infra/mac-setup/playbook.yml"

echo "=== Mac Bootstrap ==="
echo ""

# --- 1. Xcode Command Line Tools ---
if ! xcode-select -p &>/dev/null; then
  echo "Installing Xcode Command Line Tools..."
  xcode-select --install
  echo ""
  echo "Xcode CLI tools installer launched."
  echo "Complete the installation dialog, then re-run this script."
  exit 0
else
  echo "[ok] Xcode CLI tools"
fi

# --- 2. Homebrew ---
if ! command -v brew &>/dev/null; then
  echo "Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  # Add to path for the rest of this script (Apple Silicon)
  if [ -f /opt/homebrew/bin/brew ]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
  fi
else
  echo "[ok] Homebrew"
fi

# --- 3. Ansible + Git ---
if ! command -v ansible-playbook &>/dev/null; then
  echo "Installing Ansible..."
  brew install ansible
else
  echo "[ok] Ansible"
fi

if ! command -v git &>/dev/null; then
  echo "Installing Git..."
  brew install git
else
  echo "[ok] Git"
fi

# --- 4. GitHub auth + clone ---
if ! command -v gh &>/dev/null; then
  echo "Installing GitHub CLI..."
  brew install gh
else
  echo "[ok] GitHub CLI"
fi

# Authenticate gh using GitHub App installation token (from exports.sh).
# Generates a short-lived token and sets GH_TOKEN for the rest of the script.
# Falls back to interactive login if App credentials aren't available.
if ! gh auth status &>/dev/null 2>&1; then
  if [ -n "${GITHUB_APP_ID:-}" ] && [ -n "${GITHUB_INSTALL_ID:-}" ] && [ -n "${GITHUB_APP_PRIVATE_KEY_B64:-}" ]; then
    echo "Generating GitHub App installation token..."
    _pem_file=$(mktemp)
    echo "$GITHUB_APP_PRIVATE_KEY_B64" | base64 -d > "$_pem_file"

    # Build a JWT: header.payload signed with the App's private key
    _header=$(printf '{"alg":"RS256","typ":"JWT"}' | openssl base64 -e -A | tr '+/' '-_' | tr -d '=')
    _now=$(date +%s)
    _iat=$((_now - 60))
    _exp=$((_now + 300))
    _payload=$(printf '{"iss":"%s","iat":%d,"exp":%d}' "$GITHUB_APP_ID" "$_iat" "$_exp" \
      | openssl base64 -e -A | tr '+/' '-_' | tr -d '=')
    _sig=$(printf '%s.%s' "$_header" "$_payload" \
      | openssl dgst -sha256 -sign "$_pem_file" -binary \
      | openssl base64 -e -A | tr '+/' '-_' | tr -d '=')
    _jwt="${_header}.${_payload}.${_sig}"
    rm -f "$_pem_file"

    # Exchange JWT for an installation access token
    _token_json=$(curl -sf -X POST \
      -H "Authorization: Bearer ${_jwt}" \
      -H "Accept: application/vnd.github+json" \
      "https://api.github.com/app/installations/${GITHUB_INSTALL_ID}/access_tokens")
    _token=$(echo "$_token_json" | tr -d '\n ' | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')

    if [ -n "$_token" ]; then
      export GH_TOKEN="$_token"
      echo "[ok] GitHub CLI authenticated as App (via GH_TOKEN)"
    else
      echo "WARNING: Failed to get installation token."
      echo "Falling back to interactive login..."
      gh auth login
    fi
  else
    echo ""
    echo "No GitHub App credentials found. Running interactive gh auth login..."
    gh auth login
  fi
fi

if [ ! -d "$REPO_DIR" ]; then
  echo "Cloning repo to $REPO_DIR..."
  mkdir -p "$(dirname "$REPO_DIR")"
  gh repo clone kpericak/multi "$REPO_DIR"
else
  echo "[ok] Repo exists at $REPO_DIR"
fi

# --- 5. Run Ansible ---
echo ""
echo "Running Ansible playbook..."
ansible-playbook "$REPO_DIR/$PLAYBOOK"

echo ""
echo "=== Bootstrap complete ==="
echo ""
echo "Next steps:"
echo "  1. Transfer exports.sh from your old machine"
echo "  2. source ~/gh/multi/apps/blog/exports.sh"
echo "  3. claude setup-token"
echo "  4. bash ~/gh/multi/infra/ai-agents/bin/bootstrap.sh"
echo ""
