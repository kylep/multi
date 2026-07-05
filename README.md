# multi

Kyle's personal monorepo for **maintained** projects and the
infrastructure that runs them. This repo is treated as production:
changes go through PRs to `main`, dependencies stay at zero known
vulnerabilities, and the docs are kept accurate.

Experiments, half-baked ideas, and retired projects live in
[kylep/multi-sandbox](https://github.com/kylep/multi-sandbox) instead —
nothing there is maintained. When a project here stops earning its
keep, it migrates to the sandbox (content moves; its history stays in
this repo's git history).

## Projects

| Project | Description | Tech |
|---------|-------------|------|
| [blog](apps/blog/) | Static blog + wiki for [kyle.pericak.com](https://kyle.pericak.com), including the agent-facing wiki | Next.js (static export), Tailwind, Playwright |
| [kytrade](apps/kytrade/) | Personal trading tools: API + CLI + React front-end | Python/Flask/Poetry, CRA, PostgreSQL, Helm |
| [robot-battle](apps/games/robot-battle/) | Web robot-battle game built with Oliver | TypeScript, Vite, Vitest |
| [llm-client](apps/llm-client/) | Browser chat UI for llama-server / OpenRouter, live at kyle.pericak.com/apps/llm-client | Next.js 16, Tailwind v4, pnpm |
| [mods](apps/mods/) | Stellaris mods (3x Bigger Worlds, Multi-Megastructures) and a HOI4 mod, published on Steam Workshop | Paradox script, Python build tooling |
| [xmasblocks](apps/xmasblocks/) | Find funny word combos from scrambled Christmas letter blocks | Python, OpenAI API |
| [mcp-servers](apps/mcp-servers/) | 8 MCP servers wired into local Claude Code config (bitwarden, cc-usage, discord, google-news, google-search-console, openobserve, openrouter, screenshot) | TypeScript + Python |
| [pai](apps/pai/) | Docs, backup and Terraform for the Pai agent system | Terraform, Markdown |

## Infrastructure

The Rancher Desktop cluster on the Mac laptop is the runtime for the
agent system. `infra/` holds what deploys to it, plus supporting images:

| Directory | What it is |
|-----------|------------|
| [infra/local-k8s](infra/local-k8s/) | Local cluster bootstrap (Vault etc.) |
| [infra/ai-agents](infra/ai-agents/) | Agent workloads: ai-agent-runtime image, cronjob Helm charts (journalist, pai-morning), agent-controller (Go) |
| [infra/ai-security-toolkit-1](infra/ai-security-toolkit-1/) | semgrep + trivy + gitleaks scan image used by this repo's pre-PR checks |
| [infra/containers](infra/containers/) | Shared base image (kytrade builds FROM it) |

Also: `bin/` (scripts used by agents, e.g. `github-trending.py` for the
journalist cronjob), `.claude/agents/` (the Claude Code agent team),
`.ruler/` (sources that generate CLAUDE.md/AGENTS.md via `ruler apply`),
and `secrets/` (gitignored real secrets; tracked `.SAMPLE` templates).

## Dev environment setup

### Secrets

Copy `secrets/export-kytrade.sh.SAMPLE`, remove the `.SAMPLE` suffix,
fill in the values, then source it:

```bash
source secrets/export-kytrade.sh
```

### Pre-commit hooks

Runs [gitleaks](https://gitleaks.io/) on commit and push to detect secrets
(plus ruff, biome, and semgrep on commit).

```bash
pre-commit install --hook-type pre-commit --hook-type pre-push
```

### Per-project setup

Each project has its own README. The short version:

- **blog**: `npm install` in `apps/blog/blog` — see [apps/blog/README.md](apps/blog/README.md)
- **kytrade**: `docker-compose up` from the kytrade dir — see [apps/kytrade/README.md](apps/kytrade/README.md)
- **robot-battle**: `npm install && npm run dev` — see [apps/games/robot-battle/](apps/games/robot-battle/)
- **llm-client**: `pnpm install && pnpm dev` — see [apps/llm-client/README.md](apps/llm-client/README.md)
- **mods**: build scripts per mod — see [apps/mods/](apps/mods/)
- **xmasblocks**: `pip install -r requirements.txt` — see [apps/xmasblocks/README.md](apps/xmasblocks/README.md)
