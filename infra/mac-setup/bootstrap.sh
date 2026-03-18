#!/usr/bin/env bash
set -euo pipefail
# Bootstrap a factory-reset Mac to "ready for secrets and K8s".
# Idempotent — safe to re-run at any stage.
#
# Usage:
#   curl -fsSL https://kyle.pericak.com/mac-bootstrap.sh | bash
#   — or —
#   bash infra/mac-setup/bootstrap.sh
#
# What this does:
#   1. Installs Xcode CLI tools (if missing)
#   2. Installs Homebrew (if missing)
#   3. Installs Ansible + Git via Homebrew
#   4. Clones the repo (if not already present)
#   5. Runs the Ansible playbook to install everything else

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

if ! gh auth status &>/dev/null 2>&1; then
  echo ""
  echo "GitHub CLI not authenticated. Running gh auth login..."
  gh auth login
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
ansible-playbook "$REPO_DIR/$PLAYBOOK" --ask-become-pass

echo ""
echo "=== Bootstrap complete ==="
echo ""
echo "Next steps:"
echo "  1. Transfer exports.sh from your old machine"
echo "  2. source ~/gh/multi/apps/blog/exports.sh"
echo "  3. claude setup-token"
echo "  4. bash ~/gh/multi/infra/ai-agents/bin/bootstrap.sh"
echo ""
