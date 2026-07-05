---
title: "Apps"
summary: "Apps in the multi monorepo: blog, llm-client, kytrade, xmasblocks (maintained); cleanup-scan (demoted to multi-sandbox)."
keywords:
  - apps
  - blog
  - llm-client
  - cleanup-scan
scope: "Index of apps hosted or built from this monorepo. Excludes games and agents."
last_verified: 2026-07-04
---

## Maintained (source in kylep/multi)

- [Blog](/wiki/blog-architecture.html) — kyle.pericak.com itself. Next.js 15 static export, GCS + Cloudflare hosting.
- [llm-client](/wiki/apps/llm-client.html) — Browser chat UI for llama-server / OpenRouter. Deploys under the blog bucket; not currently deployed (verified 2026-07-04).
- kytrade — trading tools API + CLI + front-end (`apps/kytrade/`).
- xmasblocks — Christmas letter-block word finder (`apps/xmasblocks/`).

## Demoted to multi-sandbox (2026-07-04)

Source now lives in [kylep/multi-sandbox](https://github.com/kylep/multi-sandbox);
no further maintenance.

- [cleanup-scan](/wiki/apps/cleanup-scan.html) — macOS storage cleanup scanner. Report-only; never deletes.
