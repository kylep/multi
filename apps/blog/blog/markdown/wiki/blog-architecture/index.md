---
title: "Blog Architecture"
summary: "Technical architecture of kyle.pericak.com: Next.js 14 static export, markdown-to-HTML pipeline, Playwright testing, and deployment."
keywords:
  - blog
  - nextjs
  - static-site
  - architecture
  - markdown
related:
  - wiki/devops
  - wiki/mcp/playwright
scope: "Covers the blog's technical implementation. Does not cover blog content or writing style."
last_verified: 2026-03-10
---


kyle.pericak.com is a statically exported Next.js 14 site. Markdown
files are processed at build time into HTML pages. The site is deployed
as static files with no server-side rendering at runtime.

## Key Characteristics

- Static HTML export (no Node.js server in production)
- All internal links end in `.html`
- Material-UI (MUI) for components and responsive layout
- Responsive breakpoint at 600px (mobile/desktop)
- Sidebar with categories and tags on desktop, below content on mobile


## Hosting

The site is hosted as static files in a Google Cloud Storage bucket
(`gs://kyle.pericak.com`). There's no application server in production.
Cloudflare sits in front as a CDN and handles HTTPS termination and
DNS proxy.

The GCP project is `kylepericak` in `northamerica-northeast1`.

### How the GCS bucket maps to the domain

GCS supports serving a bucket as a static website when the bucket name
matches the domain name exactly. The setup has three layers:

1. **GCS bucket (`gs://kyle.pericak.com`).** The bucket name must match
   the fully qualified domain. GCS automatically serves `index.html` as
   the default page for the bucket root and for directories. The bucket
   is configured for static website hosting with `MainPageSuffix` set to
   `index.html`. GCS serves the content over plain HTTP on
   `http://c.storage.googleapis.com/kyle.pericak.com/` (or via the
   CNAME-compatible endpoint `http://kyle.pericak.com.storage.googleapis.com`).

2. **DNS (Cloudflare).** A CNAME record in Cloudflare points
   `kyle.pericak.com` to `c.storage.googleapis.com`. Cloudflare's DNS
   proxy mode is enabled (orange cloud), so requests hit Cloudflare's
   edge first rather than going directly to GCS.

3. **Cloudflare CDN / HTTPS.** Because the DNS proxy is enabled,
   Cloudflare terminates TLS (provides the HTTPS certificate
   automatically), caches responses at the edge, and forwards
   cache-miss requests to GCS over HTTP. The `Cache-Control` headers
   set during deployment (`no-cache,no-store,must-revalidate` on changed
   files) tell Cloudflare to revalidate on every request, so updates
   appear immediately after a deploy without a manual cache purge.

### Replicating this for a new site

To spin up another static site using the same mechanism:

1. **Create a GCS bucket** named exactly as the target domain (e.g.
   `gs://other.example.com`). Enable static website hosting:
   ```bash
   gsutil mb -p kylepericak -l northamerica-northeast1 gs://other.example.com
   gsutil web set -m index.html -e 404.html gs://other.example.com
   ```
2. **Make the bucket publicly readable:**
   ```bash
   gsutil iam ch allUsers:objectViewer gs://other.example.com
   ```
3. **Verify domain ownership** in Google Search Console for the domain.
   GCS requires this before it will let you create a bucket whose name
   is a domain. You can verify via a DNS TXT record.
4. **Add a CNAME in Cloudflare** (or your DNS provider) pointing the
   domain to `c.storage.googleapis.com`. If using Cloudflare, enable
   the proxy (orange cloud) for automatic HTTPS and caching.
5. **Deploy static files** using `gsutil rsync` (same pattern as
   `bin/prod-deploy.sh`).
6. **Optional: automate** with a Cloud Build trigger that fires on
   pushes to your branch, mirroring the `cloudbuild.yaml` pattern.


## Deployment

Deployment happens two ways: automated via Cloud Build, or manually
via `bin/prod-deploy.sh`.

### Cloud Build (automated)

A Cloud Build trigger (`apps-blog-trigger`) fires on pushes to `main`
that touch `apps/blog/**`. The pipeline is defined in
`apps/blog/cloudbuild.yaml` and managed by Terraform in
`apps/blog/tf/cloudbuild.tf`.

The pipeline has three steps:

1. **Docker build.** Builds the blog's Docker image
   (`gcr.io/$PROJECT_ID/kylepericakdotcom`) from `apps/blog/Dockerfile`.
   The image is Ubuntu Noble with Node.js and npm. It copies the blog
   source and `.git` directory (needed for the git ref in the footer),
   then runs `npm install`.
2. **Static export.** Runs `bin/build-blog-files.sh` inside the
   container to produce the static HTML output.
3. **Upload.** Uses `gsutil -m rsync -r -c -d` to sync the built
   output to `gs://kyle.pericak.com`. The `-d` flag deletes files in
   the bucket that aren't in the build output.

### Manual deploy

`bin/prod-deploy.sh` does the same `gsutil rsync` from a local build.
It checks that `blog/out/index.html` exists first, runs a dry-run to
identify changed files, syncs them, then sets `Cache-Control:
no-cache,no-store,must-revalidate` on changed files so Cloudflare
picks up updates immediately.

Only Kyle runs manual deploys.
