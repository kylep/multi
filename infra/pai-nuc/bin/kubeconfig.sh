#!/usr/bin/env bash
set -euo pipefail
# Pull the pai NUC's kubeconfig to this Mac as a standalone file.
# Usage: bin/kubeconfig.sh   then   export KUBECONFIG=~/.kube/pai-nuc.yaml

SSH_HOST="pai"
OUT="$HOME/.kube/pai-nuc.yaml"

mkdir -p "$HOME/.kube"
ssh "$SSH_HOST" 'cat /etc/rancher/k3s/k3s.yaml' \
  | sed "s/127.0.0.1/$SSH_HOST/" \
  | sed 's/: default/: pai-nuc/' \
  > "$OUT"
chmod 600 "$OUT"

echo "Wrote $OUT"
echo "Use it with:  export KUBECONFIG=$OUT"
kubectl --kubeconfig "$OUT" get nodes
