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
  → pai.pericak.com → Cloudflare Access (One-time PIN auth) → Cloudflare Tunnel → Traefik → service
  → wh.pericak.com  → Cloudflare Tunnel (no Access) → Traefik → webhook handler
```

- **Cloudflare Tunnel**: outbound-only connection from the cluster to Cloudflare's edge. No inbound firewall rules needed. One tunnel (`pai-m1`), two public hostnames.
- **Traefik**: in-cluster reverse proxy. Routes by hostname + path prefix.
- **Cloudflare Access** (pai.pericak.com only): zero-trust auth at the Cloudflare edge. Auth method: **One-time PIN** (email-based — Google OAuth requires mandatory 2-step verification as of March 2026, which is unusable for family members).
- **wh.pericak.com**: open to internet — no Cloudflare Access. Webhook handlers must verify a shared secret.

Allowed users (`pai.pericak.com`): `kyle.pericak@gmail.com`, `kyle@pericak.com`, `kara@pericak.com`

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

Add two routes — both point to Traefik:

**Route 1 — authenticated services:**

| Field | Value |
|-------|-------|
| Subdomain | `pai` |
| Domain | `pericak.com` |
| Type | `HTTP` |
| URL | `traefik.traefik.svc.cluster.local:80` |

**Route 2 — webhooks (no Access protection):**

| Field | Value |
|-------|-------|
| Subdomain | `wh` |
| Domain | `pericak.com` |
| Type | `HTTP` |
| URL | `traefik.traefik.svc.cluster.local:80` |

> Traefik handles hostname + path routing internally. The tunnel always points to Traefik for both hostnames.

Click **Save hostname** after each, then **Done**.

---

## Tunnel Hostnames Summary

| Hostname | Access protection | Purpose |
|----------|------------------|---------|
| `pai.pericak.com` | `pericak-family` Allow policy (One-time PIN) | ArgoCD UI and other authenticated services |
| `wh.pericak.com` | None — open to internet | Webhooks (GitHub, etc.); application-level secret auth required |

Both hostnames point to `traefik.traefik.svc.cluster.local:80`. Traefik routes by hostname + path internally.

> `wh.pericak.com` has no Cloudflare Access application. Anyone can reach it. Webhook handlers **must** verify a shared secret (e.g., `X-Hub-Signature-256` for GitHub) at the application level.

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

### 2.5 Webhook bypass — free plan limitation and workaround

The Cloudflare free plan does not support path-scoped Access policies. You cannot restrict a Bypass policy to `/webhooks/*` only — it would bypass auth for **all** traffic to the application.

**Solution**: Use a second tunnel hostname (`wh.pericak.com`) with **no Access application**. Webhook senders call `wh.pericak.com`; Traefik routes by hostname. No Cloudflare Access challenge is triggered for `wh.pericak.com` because there is no Access application protecting it.

**Security**: `wh.pericak.com` is open to the internet. Webhook handlers **must** verify a shared secret at the application level (e.g., verify `X-Hub-Signature-256` for GitHub webhooks).

The `webhooks-bypass` policy (Action: Bypass, Everyone) exists as a reusable policy but is **not assigned** to any application — it's kept as a reference in case of a paid plan upgrade.

If on a paid plan and want to consolidate to a single hostname with path-scoped bypass:
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

**Authenticated service** (user-facing, requires login):
1. Add an `IngressRoute` matching `Host(`pai.pericak.com`) && PathPrefix(`/your-path`)` in the target namespace
2. Protected automatically by the existing `pai.pericak.com` Access application (`pericak-family` Allow policy)

**Webhook endpoint** (machine-to-machine, no Cloudflare Access):
1. Add an `IngressRoute` matching `Host(`wh.pericak.com`) && PathPrefix(`/your-webhook`)` in the target namespace
2. No Cloudflare Access challenge — traffic reaches the pod directly
3. **Must** verify a shared secret at the application level (e.g., `X-Hub-Signature-256` for GitHub)

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
