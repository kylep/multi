---
title: "OpenObserve: Observability on K8s"
summary: "How OpenObserve is deployed to the pai-m1 K8s cluster — Helm chart, Vault-backed credentials, Traefik IngressRoute at pai.pericak.com/obs."
tags:
  - devops
  - observability
  - kubernetes
  - openobserve
---

# OpenObserve: Observability on K8s

OpenObserve is an observability platform for logs, metrics, and traces. It runs on the `pai-m1` cluster as a standalone deployment (single-replica, local disk storage), accessible at `pai.pericak.com/obs` behind the existing Cloudflare Access gate.

## Architecture

```
Internet → pai.pericak.com/obs → Cloudflare Access (pericak-family) → Cloudflare Tunnel (pai-m1) → Traefik → openobserve svc
```

OpenObserve is configured with `ZO_BASE_URI=/obs` so it serves the UI correctly under the path prefix. Do not use a strip-prefix middleware — OpenObserve expects to receive the full `/obs` path (same pattern as ArgoCD with `server.rootpath`).

No new Cloudflare tunnel hostname or Access application is needed — `pai.pericak.com` already covers it.

---

## IaC overview

| Component | Location |
|-----------|----------|
| Helm release | `infra/ai-agents/helmfile.yaml` — `openobserve/openobserve-standalone` chart |
| Helm values | `infra/ai-agents/openobserve/values.yaml` |
| Environment flag | `environments/pai-m1.yaml` — `openobserve.enabled: true` |
| K8s secret | Created by `bootstrap.sh` from Vault (`secret/ai-agents/openobserve`) |
| IngressRoute | `infra/ai-agents/traefik/openobserve-ingress.yaml` (synced by traefik-routes ArgoCD ApplicationSet) |

---

## Secrets

Admin credentials are stored in Vault and exposed as a K8s secret.

### Store in Vault

```bash
source apps/blog/exports.sh
# Set OPENOBSERVE_ADMIN_EMAIL and OPENOBSERVE_ADMIN_PASSWORD in exports.sh first
OPENOBSERVE_ADMIN_EMAIL="$OPENOBSERVE_ADMIN_EMAIL" \
OPENOBSERVE_ADMIN_PASSWORD="$OPENOBSERVE_ADMIN_PASSWORD" \
  infra/ai-agents/bin/store-secrets.sh
```

Vault path: `secret/ai-agents/openobserve`
Keys: `root_user_email`, `root_user_password`

### Create K8s secret (bootstrap.sh)

`bootstrap.sh` reads from Vault and creates the `openobserve-credentials` secret in the `openobserve` namespace. Re-run bootstrap.sh after storing the credentials:

```bash
infra/ai-agents/bin/bootstrap.sh
```

The Helm chart reads credentials from this secret via:
```yaml
auth:
  existingRootUserSecret:
    name: openobserve-credentials
    emailKey: ZO_ROOT_USER_EMAIL
    passwordKey: ZO_ROOT_USER_PASSWORD
```

---

## Deployment

```bash
# Store credentials in Vault first (see above), then:
helmfile -f infra/ai-agents/helmfile.yaml -e pai-m1 apply --selector name=openobserve
```

OpenObserve is disabled on all other environments via `openobserve.enabled: false` in `environments/default.yaml`.

Storage: 10Gi PVC on `local-path` StorageClass (K3s default).

---

## Verification

```bash
# Check pod and PVC
kubectl get pods -n openobserve
kubectl get pvc -n openobserve

# Check IngressRoute is loaded by Traefik
kubectl get ingressroute -n openobserve

# Verify remote access (should 302 to Cloudflare Access login if not authenticated)
curl -I https://pai.pericak.com/obs

# Port-forward for local access (bypasses Cloudflare)
kubectl port-forward svc/openobserve-openobserve-standalone -n openobserve 5080:5080
# Then open http://localhost:5080/obs
```

---

## Future: Log ingestion

To ship K8s pod logs to OpenObserve, deploy a log forwarder as a DaemonSet. Options:
- **Vector** — lightweight, native OpenObserve HTTP ingest support
- **Fluent Bit** — widely used, HTTP output plugin works with OpenObserve

HTTP ingest endpoint (in-cluster):
`http://openobserve-openobserve-standalone.openobserve.svc.cluster.local:5080/api/default/default/_json`
