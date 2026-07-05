---
title: "Kytrade Modernization Roadmap"
summary: "Phased plan to turn kytrade into Kyle's personal trading toolkit: purge 2022 WIP, harden the data layer, add backtesting, FastAPI on k8s, Claude skill, then web UI."
keywords:
  - kytrade
  - trading
  - roadmap
  - backtesting
  - fastapi
related:
  - wiki/stack-contract
scope: "Architecture and phasing for the kytrade rebuild. Each phase is one branch/PR; detailed TDD implementation plans are written per-phase at execution time."
last_verified: 2026-07-05
---

## Vision (Kyle, 2026-07-04)

Kytrade is the personal trading toolkit: the platform for building
trading software — run experiments, explore transaction decisions,
test and eventually automate strategies. Operated primarily via CLI
(human and Claude), later via a small API and web UI. Runs in the
local k8s cluster like everything else; the API layer may move to
serverless (Lambda / Cloud Run) later if auth is squared away.

## Decisions locked (2026-07-04)

- **CRA front-end: deleted.** The eventual web UI is a fresh build in
  its own phase (Vite or Next, matching the other apps).
- **Slack: dropped.** Discord notifications come later via the
  existing bot infrastructure.
- **Claude access: CLI + Claude Code skills** (pai-tools pattern)
  operating through the CLI/API. No MCP server.
- **Data store: keep the Postgres JSON-document store for now.** No
  new infra. The relational migration is tracked below, not built.
- **Toolchain: Python 3.14 + uv** (Poetry retired), src layout,
  PEP 621 metadata, ruff-clean at the repo root config.

## Phases (one branch + PR each)

### Phase 1 — Purge & foundation (done 2026-07-05)
Deleted: `front-end/`, Slack, Reddit, the empty Flask app +
gunicorn/helm chart/Dockerfile (Phase 4 builds the API fresh), Alembic
(returns with the relational schema), `cli/typermain.py`,
WHERE_I_LEFT_OFF.md (superseded by this doc). Rebuilt on Python 3.14 +
uv with a src layout; SQLAlchemy 2 + psycopg 3. Fixed: import-time
env-var crashes (lazy `config.settings()`), the `Token "NaN" is
invalid` save bug (JSON-safe scrubbing in `yahoo.history_df_to_dict`),
`get_sectorss` typo, the list-merge bug that dropped existing values.
Added: stdlib logging wired to `--debug`, a pytest suite (no DB
needed), `--json` flags on read commands, `kt stock prices`. Docs:
README/DATA.md rewritten, per-project CLAUDE.md with conventions.
Verified: unit tests plus `kt` E2E against docker-compose postgres
(hydrate → save-history → read back).

### Phase 2 — Data layer hardening
Provider interface (`lib/providers/yahoo.py` behind a thin protocol),
`kt data pull <symbol>` with incremental fetch (only missing dates),
S&P 500 backfill command, data-quality scrubbing at the boundary.
Optional: daily-pull CronJob in k8s via the existing helm chart.

### Phase 3 — Toolkit core: experiments & backtesting
Portfolio/position/order primitives; a Strategy protocol
(`on_day(date, prices, portfolio)`); a backtest runner over stored
history; metrics (CAGR, max drawdown, Sharpe); experiments persisted
as `experiment/<name>` documents. CLI: `kt backtest run`,
`kt experiment list|show` — all with `--json`.

### Phase 4 — API: FastAPI on k8s
FastAPI (fresh app; the empty Flask one died in Phase 1) with OpenAPI: prices, symbols,
experiments, backtest trigger. Deployed to the local cluster via the
refreshed helm chart. Written Mangum-compatible so a later
Lambda/Cloud Run port is a packaging change, not a rewrite. Auth:
none needed cluster-local; when exposed, front with Cloudflare Access
(already in use) instead of building auth.

### Phase 5 — Claude skill + Discord notifications
A Claude Code skill (pai-tools style) that teaches agents to operate
kytrade via the JSON CLI and API. Discord notifications for cron
results and strategy signals through the existing bot.

### Phase 6 — Web UI (later)
Fresh static UI (Vite or Next) against the API through Cloudflare
Access. Only after the API surface stabilizes.

## Tracked but deliberately not built now

**Relational price schema.** The documents table (one JSON blob per
symbol under `stock/prices/<symbol>`) stays until it hurts. Migration
plan when triggered: `instruments` (symbol, name, sector, currency,
metadata JSON) + `daily_prices` (instrument_id, date, open, high, low,
close, volume; unique(instrument_id, date), indexed on (instrument_id,
date)) via Alembic; backfill by iterating existing documents; keep
`documents` for loose config and experiment records. Trigger: backtest
range-scans feeling slow, or data beyond a few hundred symbols.

**Kytrade 1 merge.** The old README ambition to merge the original
kytrade CLI is dropped unless Kyle resurrects it.

**Serverless API.** Revisit after Phase 4; Mangum keeps it cheap.
