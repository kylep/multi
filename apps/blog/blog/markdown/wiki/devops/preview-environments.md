---
title: "Preview Environments: Header-Based Branch Routing"
summary: "Deploy feature branch previews alongside production using Traefik header-based routing and ArgoCD Pull Request generator."
keywords:
  - traefik
  - argocd
  - preview
  - branch-deploy
  - header-routing
related:
  - wiki/devops/cloudflare-tunnel-traefik
  - wiki/devops/ai-agents-infra
scope: "Covers how preview environments work, how to use them, and how to extend the pattern to other apps. Does not cover Traefik or ArgoCD setup from scratch."
last_verified: 2026-03-29
---

# Preview Environments

Preview environments deploy a feature branch alongside the main deployment. Traefik routes traffic based on a custom `X-Branch` header: requests with the header go to the branch deployment, requests without it go to the main deployment as usual.

## How It Works

1. An **ArgoCD ApplicationSet** with a Pull Request generator watches GitHub for PRs with the `preview` label
2. When a matching PR is found, ArgoCD deploys a branch-specific Deployment, Service, and IngressRoute into the `blog-staging` namespace
3. The **Traefik IngressRoute** uses `Headers('X-Branch', '<branch-slug>')` at priority 10 (higher than the main blog's catch-all at priority 1)
4. When the PR is closed, merged, or the label is removed, ArgoCD automatically prunes all branch resources

## Using Preview Environments

### Deploying a Preview

1. Open a pull request on GitHub
2. Add the `preview` label to the PR
3. Wait ~2-3 minutes for ArgoCD to detect the PR and build the branch

The branch slug (used as the header value) is the branch name lowercased with special characters replaced by dashes. For example, `kyle/fix-typo` becomes `kyle-fix-typo`.

### Viewing the Preview

**With curl:**

```bash
curl -H "X-Branch: kyle-fix-typo" https://pai.pericak.com
```

**With a browser (ModHeader Chrome extension):**

1. Install [ModHeader](https://chromewebstore.google.com/detail/modheader/idgpnmonknjnojddfkpgkljpfnnfcklj) from the Chrome Web Store
2. Create a profile and add a request header: `X-Branch` = `kyle-fix-typo`
3. Navigate to `https://pai.pericak.com`
4. Toggle the profile off to switch back to the main deployment

### Cleaning Up

Remove the `preview` label or close/merge the PR. ArgoCD deletes all branch resources automatically within ~30 seconds.

## Architecture

### Traefik Routing

Traefik evaluates IngressRoute rules by priority. The branch IngressRoute has priority 10 and matches on both the hostname and the `X-Branch` header. The main blog IngressRoute has priority 1 and matches only on the hostname. When both match, the higher-priority branch route wins.

```
Request with X-Branch header:
  pai.pericak.com + X-Branch: kyle-fix-typo
    → priority 10: blog-branch IngressRoute (matches)
    → routes to blog-kyle-fix-typo Service

Request without header:
  pai.pericak.com
    → priority 10: blog-branch IngressRoute (no match, header missing)
    → priority 1: blog-staging IngressRoute (matches)
    → routes to blog Service (main)
```

Cloudflare Tunnel passes custom headers through unchanged, so `X-Branch` works end-to-end through the tunnel.

### ArgoCD ApplicationSet

The ApplicationSet uses the `pullRequest` generator, which polls GitHub every 30 seconds for PRs matching the configured label filter. For each matching PR, it templates an ArgoCD Application with the branch name and commit SHA injected as Helm parameters.

Key files:

- `infra/ai-agents/argocd/blog-branches.yaml` — the ApplicationSet definition
- `infra/ai-agents/blog-branch/helm/` — the Helm chart for branch deployments

### Resource Usage

Each branch deployment runs:

- **Init container**: Clones the branch, runs `npm install` and `npm run build` (~2-3 min)
- **Nginx container**: Serves the built static files (minimal resources)

The `preview` label requirement ensures branches only deploy when explicitly requested, keeping resource usage bounded on the homelab cluster.

## Extending to Other Apps

Any app with a K8s Service can use this pattern:

1. Create a `<app>-branch/helm/` chart with parameterized Deployment + Service + IngressRoute
2. The IngressRoute template uses `Headers('X-Branch', '<slug>')` matching
3. Add an ApplicationSet with the PR generator pointing to the new chart
4. Use a different label filter if needed (e.g., `preview-api`)

For apps that use path-prefix routing (like ArgoCD at `/argocd`), add the path to the match rule:

```
Host(`pai.pericak.com`) && PathPrefix(`/myapp`) && Headers(`X-Branch`, `<slug>`)
```
