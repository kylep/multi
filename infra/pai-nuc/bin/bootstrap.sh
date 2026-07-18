#!/usr/bin/env bash
set -euo pipefail
# Bootstrap k3s on the pai NUC from this Mac, over SSH.
# Idempotent — safe to re-run; re-syncs config and manifests each time.
#
# Prereqs: `ssh pai` works passwordless (key + ~/.ssh/config alias) and the
# pai user has passwordless sudo.

K3S_VERSION="v1.36.2+k3s1"
SSH_HOST="pai"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INFRA_DIR="$SCRIPT_DIR/.."

echo "==> Syncing k3s config"
scp -q "$INFRA_DIR/k3s-config.yaml" "$SSH_HOST:/tmp/k3s-config.yaml"
ssh "$SSH_HOST" 'sudo mkdir -p /etc/rancher/k3s && sudo mv /tmp/k3s-config.yaml /etc/rancher/k3s/config.yaml'

echo "==> Installing k3s $K3S_VERSION (no-op if already at this version)"
ssh "$SSH_HOST" "curl -sfL https://get.k3s.io | INSTALL_K3S_VERSION=$K3S_VERSION sh -"

echo "==> Syncing auto-deploy manifests"
scp -q "$INFRA_DIR"/manifests/*.yaml "$SSH_HOST:/tmp/"
for f in "$INFRA_DIR"/manifests/*.yaml; do
  base="$(basename "$f")"
  ssh "$SSH_HOST" "sudo mv /tmp/$base /var/lib/rancher/k3s/server/manifests/$base"
done

echo "==> Waiting for node Ready"
ssh "$SSH_HOST" 'sudo k3s kubectl wait --for=condition=Ready node/pai --timeout=120s'

echo "==> Done. Fetch a local kubeconfig with bin/kubeconfig.sh"
