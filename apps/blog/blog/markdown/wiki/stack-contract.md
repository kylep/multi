---
title: "Stack Contract"
summary: "Canonical machine-readable reference for the current tech stack, conventions, and infrastructure. Primary context source for automated agents."
keywords:
  - stack-contract
  - infrastructure
  - conventions
  - tech-stack
  - agent-context
related:
  - wiki/devops/ai-agents-infra
  - wiki/devops/bootstrap
  - wiki/custom-tools
scope: "Single-page summary of the current system. Not a tutorial or runbook — those live in DevOps wiki pages. Updated when the stack changes."
last_verified: 2026-07-04
---

## Repo split (2026-07-04)

- **kylep/multi** — production: only maintained projects (blog, kytrade,
  robot-battle, llm-client, game mods, xmasblocks, mcp-servers,
  pai docs/tf, live infra). Branch protection, PRs to main, zero-vuln
  dependency policy.
- **kylep/multi-sandbox** — experiments and archived projects (retired
  games, Minecraft mod, aws/mac-setup/openclaw infra, attic). Nothing
  there is maintained; commits go straight to main.

## Languages and runtimes

- **TypeScript / JavaScript**: Blog (Next.js 15 static export), llm-client (Next.js 16), robot-battle (Vite), 5 of 8 MCP servers (bitwarden, cc-usage, google-news, openrouter, screenshot)
- **Python**: kytrade api (Poetry/Flask 3), xmasblocks, 3 of 8 MCP servers (discord, google-search-console, openobserve), wiki-RAG and utility scripts (always use `apps/blog/.venv/bin/python`)
- **Go**: agent-controller (in-repo, not deployed)
- **Bash**: Glue scripts, CronJob entrypoints

## Kubernetes (verified 2026-07-04 on the laptop cluster)

- **Distribution**: K3s via Rancher Desktop on the Mac laptop; context `rancher-desktop`
- **Deployed**: Vault (`vault` namespace, agent-injector + statefulset), `ai-agents` namespace with two CronJobs — journalist and pai-morning — both currently **suspended**
- **Not present on this cluster**: ArgoCD, OpenObserve, pai-responder, Traefik ingress
- **pai-m1 (M1 server)**: not reachable from this machine; its state (ArgoCD, OpenObserve, pai-responder described in older wiki pages) is unverified as of 2026-07-04 — treat those pages as historical until re-verified

## Secrets

- **Vault**: HashiCorp Vault with GCP KMS auto-unseal, Vault Agent Injector → tmpfs `/vault/secrets/`
- **No plain-text K8s Secrets**
- **Secret paths**: `secret/ai-agents/{discord,github,anthropic,pai,openrouter}` plus service-specific paths (bluesky, cloudflare, gcs, mastodon, openobserve, twitter, webhook — see `infra/ai-agents` manifests)
- **Repo secrets**: `secrets/` is gitignored except `.SAMPLE` templates

## Agent runtime

- **Image**: `kpericak/ai-agent-runtime` (Playwright base, Claude Code CLI, Python, Git, kubectl), built from `infra/ai-agents/ai-agent-runtime/`
- **Execution model**: CronJob pods — Vault init → optional GitHub token init → agent container → push
- **Agent definitions**: `.claude/agents/*.md` — analyst, autolearn, design-doc-writer, healthcheck (deprecated), interviewee, journalist, pai, pai-recaller, pai-self-improver, prd-writer, publisher, qa, researcher, reviewer, security-auditor, seo-bot, synthesizer

## Blog platform

- **Framework**: Next.js 15, static HTML export; Terminal design system (Tailwind v4, PER-135, merged 2026-06-14)
- **Hosting**: Google Cloud Storage static site
- **Content**: `apps/blog/blog/markdown/posts/`; wiki at `apps/blog/blog/markdown/wiki/`
- **Internal links**: Must end in `.html`
- **Dev server**: `npm run dev` on port 3000; tests: `npx playwright test` from `apps/blog/blog/`

## Conventions

- **Git**: Branch protection on `main`, all changes through PRs, assign to kylep, one PR per effort
- **Branch naming**: `kyle/<linear-id>-short-description` or `kyle/descriptive-name`
- **Testing**: Test before merging (kubectl apply, helm template, docker build, agent runs). No merge-to-test.
- **Security scanning**: semgrep, trivy, gitleaks via `kpericak/ai-security-toolkit-1` image; zero-vuln policy on active projects (achieved 2026-07-04, PR #507)
- **Pre-commit**: gitleaks hook for secret detection
- **Monorepo**: Each directory in `apps/` is independent. No cross-project imports.
