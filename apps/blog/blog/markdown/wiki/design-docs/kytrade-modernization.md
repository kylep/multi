---
title: "Kytrade Modernization Roadmap"
summary: "Phased, prompt-first rebuild of kytrade: purged 2022 WIP, hardened data layer, twin FastAPI+CLI interfaces with Claude skills; backtesting, k8s deploy, and web UI ahead."
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

## Vision (Kyle, 2026-07-04; scope expanded 2026-07-05)

Kytrade is the personal trading toolkit: the platform for building
trading software — run experiments, explore transaction decisions,
test and eventually automate strategies. Runs in the local k8s
cluster like everything else; the API layer may move to serverless
(Lambda / Cloud Run) later if auth is squared away.

Development is **prompt-first** (Kyle, 2026-07-05): a feature is a
prompt that works. `apps/kytrade/PROMPTS.md` is the feature spec —
Supported prompts map 1:1 to business-layer functions; Roadmap
prompts queue future phases. The interfaces are thin twins: a FastAPI
ingress (committed OpenAPI spec) and the Typer CLI accept the same
argument types and call the same functions; business logic lives in
its own modules with unit and integration tests. Claude operates the
toolkit through `kytrade` skills published in kylep/claude-plugins.

## Decisions locked (2026-07-04)

- **CRA front-end: deleted.** The eventual web UI is a fresh build in
  its own phase (Vite or Next, matching the other apps).
- **Slack: dropped.** Discord notifications come later via the
  existing bot infrastructure.
- **Data store: keep the Postgres JSON-document store for now.** No
  new infra. The relational migration is tracked below, not built.
- **Toolchain: Python 3.14 + uv** (Poetry retired), src layout,
  PEP 621 metadata, ruff-clean at the repo root config.
- **Prompt-first development (2026-07-05).** PROMPTS.md is the feature
  spec; a feature ships when its prompt works end to end.
- **Twin interfaces (2026-07-05).** FastAPI + Typer over one function
  layer, identical argument types, no business logic in either; the
  OpenAPI spec is committed and drift-guarded.
- **Claude access: skills in kylep/claude-plugins** operating through
  the CLI/API (supersedes the repo-local-skill plan; still no MCP).

## Phases (one branch + PR each)

### Phase 1 — Purge & foundation (done 2026-07-05)
Deleted: `front-end/`, Slack, Reddit, the empty Flask app +
gunicorn/helm chart/Dockerfile (a real API returned in Phase 3), Alembic
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

### Phase 2 — Data layer hardening (done 2026-07-05)
`PriceProvider` protocol (`providers/base.py`) with `YahooProvider`
behind it; `kt data pull` with incremental fetch (only dates newer
than stored; `--full` re-downloads, needed occasionally because
auto-adjusted history drifts on splits/dividends); live S&P 500
membership from Wikipedia (`kt data load-sp500`, bs4 parser, tickers
normalized to Yahoo style; the 2022 xlsx stays as `--file` offline
fallback); `kt data backfill-sp500`. CLI consolidated: `stock`/`etl`
groups retired into `data`. The daily-pull k8s CronJob was deferred to
Phase 5 — it needs a container image and the deploy story lives there.
Also in this PR: orphaned `infra/containers` base image removed
(migrated to multi-sandbox).

### Phase 3 — Prompt-driven interfaces (done 2026-07-05)
The scope-change phase. PROMPTS.md written (20 prompts: 10 Supported,
10 Roadmap). Business layer for prompts 1–10: `analysis.py`
(performance, compare, movers, sectors, near-extreme screener,
volatility), `ops.py` (status/staleness, staleness-aware refresh,
bootstrap with `.env` secret generation), membership diff + dated log.
FastAPI ingress with committed `openapi.json` (drift-guarded by a unit
test); CLI extended to exact parity (`kt analyze`, `kt status`,
`kt refresh`, `kt bootstrap`). Integration suite against the
docker-compose postgres (`bin/integration-test.sh`). `kytrade` skills
published to kylep/claude-plugins and installed here. Version 4.0.0.

### Phase 4 — Toolkit core: experiments & backtesting
Prompts 11–16. Portfolio/position/order primitives; a Strategy
protocol (`on_day(date, prices, portfolio)`); a backtest runner over
stored history; metrics (CAGR, max drawdown, Sharpe); experiments
persisted as `experiment/<name>` documents. New functions surface
through both interfaces per the twin rule, plus skill recipes.

### Phase 5 — k8s deploy: API, cron, watchlists, Discord
Prompts 17–19. Container image + helm chart; the API on the local
cluster; the daily-pull CronJob deferred from Phase 2; watchlists and
signal checks with Discord notifications through the existing bot.
API stays Mangum-compatible so a later Lambda/Cloud Run port is a
packaging change. Auth: none cluster-local; when exposed, front with
Cloudflare Access (already in use) instead of building auth.

### Phase 6 — Web UI (later)
Fresh static UI (Vite or Next) against the API through Cloudflare
Access. Only after the API surface stabilizes. Prompt 20 (blog-ready
market recaps) can land any time after Phase 4 as a skill.

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
