#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MANIFEST_DIR="$SCRIPT_DIR/.."

echo "=== Deploying OpenClaw to K8s ==="

echo "Creating namespace..."
kubectl apply -f "$MANIFEST_DIR/namespace.yaml"

echo "Applying network policy..."
kubectl apply -f "$MANIFEST_DIR/network-policy.yaml"

echo "Creating service account..."
kubectl apply -f "$MANIFEST_DIR/serviceaccount.yaml"

echo "Creating PVC..."
kubectl apply -f "$MANIFEST_DIR/pvc.yaml"

echo "Creating ConfigMap..."
kubectl apply -f "$MANIFEST_DIR/configmap.yaml"

echo "Creating Service..."
kubectl apply -f "$MANIFEST_DIR/service.yaml"

echo "Applying resource quota..."
kubectl apply -f "$MANIFEST_DIR/resource-quota.yaml"

echo "Deploying StatefulSet..."
kubectl apply -f "$MANIFEST_DIR/statefulset.yaml"

echo ""
echo "=== Waiting for pod ==="
kubectl wait --for=condition=Ready pod -l app.kubernetes.io/name=openclaw \
  -n openclaw --timeout=120s

echo ""
echo "=== Deployment complete ==="
kubectl get pods -n openclaw
