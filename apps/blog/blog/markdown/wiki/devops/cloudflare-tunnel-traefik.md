---
title: "Cloudflare Tunnel + Traefik: Remote Access Setup"
summary: "How to set up a Cloudflare Tunnel into the K8s cluster, with Traefik as a reverse proxy and Cloudflare Access for auth. Enables remote access to ArgoCD, webhooks, and other internal services via pai.pericak.com."
tags:
  - devops
  - cloudflare
  - traefik
  - kubernetes
  - networking
---

# Cloudflare Tunnel + Traefik: Remote Access Setup

## Architecture

```
Internet
  → Cloudflare Access (auth gate — One-time PIN)
  → Cloudflare Tunnel (cloudflared pod in K8s, outbound-only)
  → Traefik (in-cluster reverse proxy — routes by path)
  → Target service (ArgoCD, webhooks, etc.)
```

- **Domain**: `pai.pericak.com` (single hostname for all services)
- **Cloudflare Tunnel**: outbound-only connection from the cluster to Cloudflare's edge. No inbound firewall rules needed.
- **Traefik**: in-cluster reverse proxy. One tunnel entry point, many backends routed by path prefix.
- **Cloudflare Access**: zero-trust auth at the Cloudflare edge. Requests are rejected before reaching the cluster unless authenticated. Auth method: **One-time PIN** (email-based — used because Google OAuth requires mandatory 2-step verification as of March 2026).

Allowed users: `kyle.pericak@gmail.com`, `kyle@pericak.com`, `kara@pericak.com`
Bypass (no auth): `/webhooks/*` paths

---

## Part 0: Zero Trust First-Time Setup

If this is the first time using Zero Trust on this account, Cloudflare will show an onboarding screen.

1. Log in to [dash.cloudflare.com](https://dash.cloudflare.com)
2. In the left sidebar under **Protect & Connect**, click **Zero Trust**
3. Click **Get started**
4. **Choose your team name** — this becomes `<team>.cloudflareaccess.com` (the auth portal URL). Enter `pericak` → click **Next**
5. Select the **Free** plan → click **Proceed**
6. You'll land on the Zero Trust dashboard

> This onboarding only runs once.

---

## Part 1: Create the Cloudflare Tunnel (Dashboard — Imperative)

### 1.1 Navigate to Networks → Tunnels

1. In the Zero Trust sidebar, click **Networks** → **Tunnels**
2. Click **+ Create a tunnel**

### 1.2 Configure the tunnel

1. Select **Cloudflared** as the connector type → click **Next**
2. Name the tunnel: `pai-m1` → click **Save tunnel**
3. Cloudflare generates a tunnel token — the install command shown is:
   ```
   sudo cloudflared service install eyJ...
   ```
   The **actual token** is everything after `install ` (just the JWT, starting with `eyJ`).
4. Store the token in `exports.sh` as `CLOUDFLARE_TUNNEL_TOKEN` (JWT only, no command prefix).

### 1.3 Configure public hostnames

Add a route for the `pai` entry point:

| Field | Value |
|-------|-------|
| Subdomain | `pai` |
| Domain | `pericak.com` |
| Type | `HTTP` |
| URL | `traefik.traefik.svc.cluster.local:80` |

> Traefik handles path-based routing internally. The tunnel always points to Traefik.

Click **Save hostname**, then **Done**.

---

## Part 2: Cloudflare Access — Auth Gate (Dashboard — Imperative)

### 2.1 Set up One-time PIN identity provider

One-time PIN is built-in to Cloudflare Access — no external IdP setup needed. It sends a numeric code to the user's email address. The email does not need to be a Gmail address.

1. Zero Trust sidebar → **Settings** → **Authentication**
2. Under **Login methods**, confirm **One-time PIN** is listed (it is enabled by default)

### 2.2 Create the Access application

1. Zero Trust sidebar → **Access controls** → **Applications**
2. Click **Add an application**
3. Select **Self-hosted**
4. Fill in:
   - **Application name**: `pai`
   - **Application domain**: subdomain `pai`, domain `pericak.com` → full domain: `pai.pericak.com`
5. Click through **Experience settings** and **Advanced settings** with defaults
6. Click **Save**

### 2.3 Create the Allow policy

1. In the Zero Trust sidebar, go to **Access controls** → **Policies**
2. Click **Add a policy**
3. **Policy name**: `pericak-family`
4. **Action**: Allow
5. Under **Include**, add one rule with selector **Emails** and enter all three addresses:
   - `kyle.pericak@gmail.com`
   - `kyle@pericak.com`
   - `kara@pericak.com`
   (Type each and press Enter to add as a chip)
6. Click **Save**

### 2.4 Assign the policy to the Access application

1. Go to **Access controls** → **Applications** → click **pai** → **Configure**
2. Click the **Policies** tab
3. Click **Select existing policies**
4. Check `pericak-family` → click **Confirm**
5. Click **Save application**

### 2.5 Webhook bypass — free plan limitation

The Cloudflare free plan does not support path-scoped Access policies. You cannot restrict a Bypass policy to `/webhooks/*` only — it would bypass auth for **all** traffic to the application.

**Current state**: The `webhooks-bypass` policy (Action: Bypass, Everyone) exists as a reusable policy but is **not assigned** to the `pai` application. Webhook callers must authenticate via Cloudflare Access, or webhook auth must be implemented at the application level (e.g., verify a shared secret header in the webhook handler).

If on a paid plan and want to add path-scoped bypass:
1. **Access controls** → **Applications** → **pai** → **Configure** → **Policies**
2. **Select existing policies** → check `webhooks-bypass` → **Confirm**
3. Set path scope to `/webhooks/*`
4. In the Policies tab, ensure Bypass is ordered above Allow
5. **Save application**

---

## Part 3: Deploy Traefik in K8s (IaC)

Traefik is deployed via ArgoCD (`infra/ai-agents/argocd/traefik.yaml`) and helmfile (`infra/ai-agents/helmfile.yaml`).

Key files:
- `infra/ai-agents/traefik/values.yaml` — ClusterIP service, port 80, no LoadBalancer
- `infra/ai-agents/argocd/traefik.yaml` — ApplicationSet targeting `cluster-role=ai-agents` clusters

Manual deploy (if needed before ArgoCD):

```bash
helm repo add traefik https://traefik.github.io/charts
helmfile -e pai-m1 apply --selector name=traefik
```

---

## Part 4: Deploy cloudflared in K8s (IaC)

### 4.1 Store tunnel token in Vault

```bash
# After unlocking Vault and sourcing exports.sh:
source apps/blog/exports.sh
# Then run store-secrets.sh — it prompts for CLOUDFLARE_TUNNEL_TOKEN
infra/ai-agents/bin/store-secrets.sh
# Or pass as env var:
CLOUDFLARE_TUNNEL_TOKEN="$CLOUDFLARE_TUNNEL_TOKEN" infra/ai-agents/bin/store-secrets.sh
```

The token is the JWT from the Cloudflare dashboard (Zero Trust → Networks → Connectors → pai-m1). It starts with `eyJ`. Do not include the `sudo cloudflared service install ` prefix.

### 4.2 Create K8s secret (bootstrap.sh)

`bootstrap.sh` reads the token from Vault and creates the `cloudflared-token` K8s secret automatically. Re-run bootstrap.sh after storing the token:

```bash
infra/ai-agents/bin/bootstrap.sh
```

### 4.3 ArgoCD deploys cloudflared

The `infra/ai-agents/argocd/cloudflared.yaml` ApplicationSet deploys cloudflared to clusters labeled `cloudflare-tunnel=true`. This label is applied by bootstrap.sh during cluster registration.

The local chart is at `infra/ai-agents/cloudflared/helm/`. It runs `cloudflare/cloudflared:latest` with 2 replicas, reading the tunnel token from the `cloudflared-token` K8s secret.

---

## Part 5: Traefik IngressRoutes (IaC)

IngressRoutes are managed by ArgoCD via `infra/ai-agents/argocd/traefik-routes.yaml`, which deploys `infra/ai-agents/traefik/argocd-ingress.yaml`.

The ArgoCD IngressRoute exposes ArgoCD at `pai.pericak.com/argocd`. ArgoCD must be configured with `server.rootpath: /argocd` for the UI to work under a path prefix (this is already set in the ArgoCD helm release via `configs.params.server\.insecure=true`; rootpath requires an additional param).

---

## Adding new routes

To expose a new service:

1. Add a path-based `IngressRoute` for `pai.pericak.com` in the relevant namespace (or add to `traefik/argocd-ingress.yaml`)
2. For webhook endpoints: Cloudflare Access will still challenge the request (see Section 2.5 — free plan limitation). Implement webhook auth at the application level using a shared secret header.
3. For authenticated services: protected automatically by the existing `pai.pericak.com` Access application (`pericak-family` Allow policy)

---

## Verification

```bash
# Tunnel should show as healthy in Cloudflare dashboard
# Zero Trust → Networks → Tunnels → pai-m1 → status: Active

# Locally verify Traefik is up
kubectl get pods -n traefik

# Verify cloudflared is connected
kubectl logs -n cloudflared deploy/cloudflared | grep -i "connection"

# Hit ArgoCD remotely (requires Access auth)
curl -I https://pai.pericak.com/argocd
```
