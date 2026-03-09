#!/usr/bin/env bash
set -euo pipefail

echo "=== Tearing down OpenClaw ==="

echo "Deleting openclaw namespace (and all resources in it)..."
kubectl delete namespace openclaw --ignore-not-found

echo ""
read -p "Also remove Vault? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Uninstalling Vault Helm release..."
  helm uninstall vault -n vault 2>/dev/null || true
  echo "Deleting vault namespace..."
  kubectl delete namespace vault --ignore-not-found
  echo "Removing local Vault credentials..."
  rm -f "$HOME/.vault-init"
fi

echo ""
echo "=== Teardown complete ==="
