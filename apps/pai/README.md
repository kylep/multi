# Pai

Personal Discord assistant for Kyle. Long-lived Claude Code agent
running in K8s.

> **Why does this directory exist?** Just this README, intentionally.
> The implementation lives in `infra/ai-agents/pai-responder/` (the
> Deployment) and `.claude/agents/pai.md` + `.claude/agents/pai-recaller.md`
> (agent definitions). This file documents how it all fits.

## Architecture

Discord guild WS connects to gateway.py (running in the pai-responder pod).
On each mention or thread reply, gateway.py spawns `claude --agent pai-recaller`
to query memory; the recaller returns either NONE or a 2-3 line digest, which
gateway.py prepends to the main pai prompt as an `<active_memory>` block.
Then `claude --agent pai` runs with Discord, Linear, pai-memory v2, and
Playwright MCPs. Memory lives as plain markdown on the pod's PVC.

In parallel, gateway.py runs `_commitment_tick` every 60 seconds, which reads
COMMITMENTS.md, finds entries due, and spawns Pai to deliver them via Discord.

## Where things live

| Concern | Location |
|---|---|
| Agent definition (main) | `.claude/agents/pai.md` |
| Agent definition (recaller) | `.claude/agents/pai-recaller.md` |
| Long-lived bot (Deployment + gateway.py) | `infra/ai-agents/pai-responder/` |
| Memory MCP server source | `infra/ai-agents/pai-responder/helm/files/memory_mcp.py` |
| Memory MCP tests | `infra/ai-agents/pai-responder/tests/` |
| Migration script | `infra/ai-agents/pai-responder/helm/files/migrate.py` |
| Scheduled tasks (pai-morning, etc.) | `infra/ai-agents/cronjobs/helm/templates/` |
| Wiki page (overview) | `wiki/agent-team/pai.md` |
| Design doc | `wiki/design-docs/pai-improvements.md` |

## Memory model

Three plain-markdown files in the pai-responder PVC at `/data/`:

- `MEMORY.md` -- durable. `## Section` headers, `- bullet` entries.
- `daily/YYYY-MM-DD.md` -- rolling daily notes. Auto-created.
- `COMMITMENTS.md` -- YAML-fenced blocks for inferred and explicit
  follow-ups. Status: `pending` | `delivered`.

Pai writes to these via the `pai-memory` MCP. Pre-reply, the
pai-recaller sub-agent searches them and either returns `NONE` or a
digest that gateway.py prepends to the main turn as an
`<active_memory>` block.

## Running tests

```bash
cd infra/ai-agents/pai-responder
python3 -m venv .venv
.venv/bin/pip install pytest "mcp[cli]"
.venv/bin/pytest tests/ -v
```

## Adding a scheduled task

Scheduled tasks live as per-task K8s CronJobs in
`infra/ai-agents/cronjobs/helm/templates/`. To add one (e.g.
`pai-evening`):

1. Copy `pai-morning.yaml` to `pai-evening.yaml`.
2. Edit the prompt, `--allowedTools`, and the values entry name.
3. Add the schedule to `infra/ai-agents/cronjobs/helm/values.yaml`
   under `cronjobs.<name>` with `enabled: false` (the default).
4. Per-cluster overrides in `environments/<name>.yaml` enable it.
5. `helmfile sync` to apply.

This pattern is intentionally per-task rather than a single tick that
walks a `SCHEDULES.md`. It matches the existing pattern in the repo
(`journalist-morning`, `seo-bot`, `autolearn`, etc.) and each schedule
is visible and inspectable in its own YAML.

## Commitment delivery

For *precise* one-off reminders (e.g. "remind me in 20 minutes"), Pai
inscribes a commitment via `memory_save(scope="commitment", ...)`. The
`_commitment_tick` task in gateway.py polls every 60 seconds and
spawns Pai to deliver due ones.

For *recurring* scheduled work (daily summaries, weekly reviews), use
the CronJob pattern above instead. Commitments are for one-shot
follow-ups; CronJobs are for repeating schedules.

## How to deploy a change

Per `CLAUDE.md` rules, do not rely on merge-and-deploy. Iterate via
`kubectl apply` against the rendered chart:

```bash
helm template infra/ai-agents/pai-responder/helm > /tmp/pai-rendered.yaml
kubectl apply -f /tmp/pai-rendered.yaml -n ai-agents
kubectl logs -n ai-agents -l app.kubernetes.io/name=pai-responder -f
```

When happy, open a PR with the manifest changes.

## Refs

- Design doc (WHAT + WHY for the v2 work):
  `apps/blog/blog/markdown/wiki/design-docs/pai-improvements.md`
- OpenClaw inventory (the source of borrowed ideas):
  `apps/blog/blog/markdown/wiki/tool-research/openclaw.md`
- Brainstorming spec:
  `docs/superpowers/specs/2026-05-08-pai-improvements-design.md`
- Implementation plan:
  `docs/superpowers/plans/2026-05-08-pai-improvements.md`
- Code companion (where copy-paste implementations live):
  `docs/superpowers/plans/2026-05-08-pai-improvements-code.md`
