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
last_verified: 2026-04-01
---

## Languages and runtimes

- **Go**: Agent controller (deprecated, not deployed), planned for future orchestration
- **TypeScript / JavaScript**: Blog (Next.js 14 static export), blog tooling
- **Python**: Wiki-RAG tool, utility scripts (always use `apps/blog/.venv/bin/python`)
- **Bash**: Glue scripts, CronJob entrypoints, bootstrap automation
- **Swift**: iOS app (sillyapp, inactive)
- **Java**: Minecraft mods (inactive)

## Kubernetes

- **Distribution**: K3s via Rancher Desktop on 2 Mac machines
- **Clusters**: pai-m1 (always-on server), kyle-m2 (gaming laptop, sometimes off)
- **Namespace**: `ai-agents` for all agent workloads
- **Security**: Pod Security Standards enforced, NetworkPolicy in place, ResourceQuota set
- **Sandbox isolation**: gVisor planned but not yet deployed

## GitOps and deployment

- **ArgoCD**: Runs on pai-m1, watches `main` branch, auto-syncs both clusters
- **ApplicationSets**: Cluster generator creates one Application per cluster per release
- **Helm releases**: vault, cronjobs, pai-responder
- **Helmfile**: Used for bootstrap and ArgoCD fallback, not primary deploy method
- **CI/CD**: Minimal — only auto-merge-wiki GitHub Actions workflow. No image build pipeline.
- **Production deploys**: Manual, Kyle only. Never automated.
- **Docker images**: Built and pushed manually. Runtime image: `kpericak/ai-agent-runtime`

## Secrets

- **Vault**: HashiCorp Vault with GCP KMS auto-unseal
- **Delivery**: Vault Agent Injector writes secrets to in-memory tmpfs at `/vault/secrets/`
- **No plain-text K8s Secrets** — everything goes through Vault
- **Secret paths**: `secret/ai-agents/{discord,github,anthropic,pai,openrouter}`

## Observability

- **Logs**: OpenObserve deployed on pai-m1 (standalone, 10Gi PVC). Log ingestion incomplete (DaemonSet not yet deployed).
- **Agent activity**: Discord #log channel — agents post tool call summaries via PostToolUse hook
- **Health checks**: Healthcheck agent CronJob queries pod status and OpenObserve
- **Metrics**: No Prometheus or Grafana. No application-level metrics instrumentation.
- **Alerting**: Not configured.

## Agent runtime

- **Image**: `kpericak/ai-agent-runtime` (Playwright base, Claude Code CLI, Python, Git, kubectl)
- **Execution model**: CronJob pods — Vault init → optional GitHub token init → agent container → push
- **Scheduled agents**: journalist (daily 8am ET), pai-morning (daily 8:30am ET)
- **Long-running**: pai-responder (Discord polling Deployment, pai-m1 only)
- **Agent definitions**: `.claude/agents/*.md` (12 agents: publisher, analyst, researcher, reviewer, qa, security-auditor, synthesizer, prd-writer, design-doc-writer, pai, journalist, healthcheck)

## Blog platform

- **Framework**: Next.js 14, static HTML export
- **Hosting**: Google Cloud Storage, served via GCS website
- **Content**: Markdown posts in `apps/blog/blog/markdown/posts/`
- **Wiki**: Markdown in `apps/blog/blog/markdown/wiki/` (119 pages, 15 sections)
- **Internal links**: Must end in `.html`
- **Dev server**: `npm run dev` on port 3000

## Networking

- **Ingress**: Cloudflare Tunnel → Traefik → K8s services
- **Domains**: kyle.pericak.com (blog), pai.pericak.com (internal services)
- **Cloudflare Access**: Protects internal services (OpenObserve, ArgoCD)

## Conventions

- **Git**: Branch protection on `main`, all changes through PRs, assign to kylep
- **Branch naming**: `kyle/<linear-id>-short-description` or `kyle/descriptive-name`
- **Testing**: Test before merging (kubectl apply, helm template, docker build, agent runs). No merge-to-test.
- **Security scanning**: semgrep, trivy, gitleaks via `kpericak/ai-security-toolkit-1` Docker image
- **Pre-commit**: gitleaks hook for secret detection
- **Monorepo**: Each directory in `apps/` and `games/` is independent. No cross-project imports.
