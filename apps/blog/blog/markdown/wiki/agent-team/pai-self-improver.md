---
title: "Pai Self-Improver"
summary: "Daily cron that mines OpenObserve for recurring failures and proposes memory or config changes for human approval. The 'dreaming' loop for Pai."
keywords:
  - pai-self-improver
  - agent
  - openobserve
  - dreaming
  - self-improvement
  - cron
related:
  - wiki/agent-team/pai.html
  - wiki/agent-team/index.html
  - wiki/devops/openobserve.html
  - wiki/mcp-servers/openobserve.html
  - wiki/devops/healthcheck-agent.html
scope: "Pai-self-improver agent: role, schedule, signal sources, approval flow, threshold rules."
last_verified: 2026-05-10
---

## Role

Daily diagnostic loop for Pai and the cron agents. Pulls 24 hours of
container logs from OpenObserve, finds recurring tool failures and
gateway errors, clusters them by normalized signature, and posts
proposals for memory updates to Discord and Linear. Human approves
each proposal; nothing applies automatically.

This is the openclaw "dreaming" pattern adapted to a K8s CronJob —
score short-term signals, surface thresholded items, leave a
review trail. It replaces the older `healthcheck` cron, which posted
state-change deltas that were noisier than they were useful.

## Identity

- **Model**: Sonnet
- **Invocation**: `claude --agent pai-self-improver` (cron) or ad-hoc
- **Source**: `.claude/agents/pai-self-improver.md`
- **CronJob**: `infra/ai-agents/cronjobs/helm/templates/pai-self-improver.yaml`

## Schedule

`0 9 * * *` — daily at 09:00 UTC (5am EDT). Runs before paiMorning so
any proposals are ready for the day.

## Signal sources in O2

Pulls from the `k8s_logs` stream:

| Source | Field of interest |
|---|---|
| `pai-responder/*` audit log | `is_error: true` entries from PostToolUse hook |
| `pai-responder/*` gateway log | `log_level: error` Python logs (claude rc, recall fails) |
| `ai-agents/autolearn-*` | container stdout, error level |
| `ai-agents/journalist-*` | container stdout, error level |
| `ai-agents/seo-bot-*` | container stdout, error level |

The audit hook (`PostToolUse` in `.claude/hooks/audit-log.sh`) writes
JSON with `is_error` and `error_excerpt` fields per tool call. That's
the high-signal feed.

## Threshold

Three or more occurrences of the same normalized signature in 24
hours. One-off failures are noise.

Normalization redacts timestamps, paths under `/tmp`, hex digests,
and PIDs from the error excerpt before clustering.

## Output

Per run, at most:

- **One Linear issue**: title `[pai-self-improver] N proposals from
  YYYY-MM-DD`, label `pai-self-improver`. Description lists each
  proposal in count-descending order with sample, affected agents,
  proposed change, and rationale.
- **One Discord summary** to `#status-updates`: top 3 patterns by
  count, plus link to the Linear issue.

If nothing crosses threshold, posts nothing.

Cap is 5 proposals per run. Anything beyond gets footer-noted
("N more patterns truncated") and waits for the next run.

## Approval flow

Proposals are read-only against `MEMORY.md`. The agent never calls
`memory_save` directly. Two paths to apply:

1. Reply to the Linear issue with `apply` (or `apply 1,3` for
   subsets). Pai (the responder) reads the comment on her next
   mention and applies via `memory_save`. *(Application
   automation lives in the responder; if it's not wired yet, paste
   bullets into MEMORY.md manually.)*
2. Edit `MEMORY.md` by hand and close the issue.

Either way, the issue gets a `status: done` (or rejected) so the
agent doesn't propose the same thing twice.

## Why not a hook-driven local loop

Pai runs in K8s, and Vector already ships every container's stdout
to OpenObserve. The data needed for self-improvement was already
sitting in the warehouse. A separate hook-driven log file would be
a second source of truth.

The PostToolUse hook (`audit-log.sh`) was extended in the same
branch to add `is_error` and `error_excerpt` fields so the agent can
filter at SQL level instead of regex-grepping log lines.

## Why not pai-responder runtime

Tempting to add OpenObserve MCP to `pai-responder`'s full MCP config
so Pai could answer log questions in chat. Decided against it — every
MCP server is cold-start cost on the mention hot path. Recent gateway
work shaved that latency; not eager to give it back. The cron has its
own short-lived MCP config that goes away after the run.

If a conversational diagnostic surface ever feels needed, a slim
"pai-diagnostics" sub-agent (modeled on `pai-recaller`) is the right
shape — load O2 MCP only when invoked, exit fast.
