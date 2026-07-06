# kytrade

Personal trading toolkit: the platform I build trading software in —
run experiments, explore transaction decisions, test and eventually
automate strategies. Open source, but built for me; talk to me before
using it.

Development is **prompt-first**: features exist so that the prompts in
[PROMPTS.md](PROMPTS.md) work against real stored data. Business logic
lives in plain functions with their own integration tests; the Typer
CLI (`kt`) and the FastAPI ingress are thin twins over those functions
with identical arguments. Claude operates it through the `kytrade`
skills in [kylep/claude-plugins](https://github.com/kylep/claude-plugins).

The long-term plan lives in the wiki:
[Kytrade Modernization Roadmap](../blog/blog/markdown/wiki/design-docs/kytrade-modernization.md).

## Quickstart

```bash
docker compose up -d postgres   # uses .env, created next if missing
uv sync
uv run kt bootstrap             # secrets, tables, live S&P 500 membership
uv run kt refresh               # pull daily history for all 503 symbols
uv run kt analyze movers --days 30
```

`kt bootstrap` generates a `POSTGRES_PASSWORD` into a git-ignored
`.env` (mode 600) if none is configured; docker compose and the CLI
both read it. Bring your own via the environment or `.env` to skip
generation.

## CLI features

`kt --help` is the source of truth; every read command takes `--json`.

- `kt status` — health: database, tables, document counts, data staleness
- `kt bootstrap` — secrets + tables + live S&P 500 membership, idempotent
- `kt refresh [--full]` — staleness-aware incremental pull of every symbol
- `kt data pull -s SYMBOL | --all [--full]` — incremental price pull
- `kt data prices SYMBOL [--tail N]` — stored daily OHLCV
- `kt data symbols` — known symbols and metadata
- `kt data load-sp500 [--file xlsx]` — reconcile membership (Wikipedia live)
- `kt data membership-log` — dated joins/leaves recorded by past loads
- `kt data backfill-sp500` — membership + full history pull
- `kt analyze performance SYMBOL [--days N]` — window return, high/low, volume
- `kt analyze compare SYM SYM... [--days N]` — multi-symbol returns, best first
- `kt analyze movers [--days N] [--top N]` — gainers/losers across the universe
- `kt analyze sectors [--days N]` — average member return per sector
- `kt analyze near-extreme [--kind high|low] [--threshold-pct X]` — 52-week screener
- `kt analyze volatility SYMBOL [--window-days N]` — stddev + worst window
- `kt db init | list | get KEY | set KEY FILE` — raw document access
- `kt version`

## API

Same functions, same arguments, over HTTP:

```bash
bin/start-api.sh                      # uvicorn on :8000, /docs for Swagger UI
curl 'localhost:8000/analysis/movers?days=30&top=5'
```

The OpenAPI spec is committed at [openapi.json](openapi.json) and
drift-guarded by a unit test; regenerate with `bin/export-openapi.sh`.
The API is currently for local/cluster use — auth arrives with the
k8s deployment phase (Cloudflare Access, not app-level auth).

## Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `POSTGRES_PASSWORD` | (required; `kt bootstrap` generates one) | Database password |
| `POSTGRES_HOST` | `127.0.0.1` | Database host |
| `POSTGRES_PORT` | `5432` | Database port |
| `POSTGRES_USER` | `kytrade` | Database user |
| `DATABASE_NAME` | `kytrade` | Database name |
| `SQLA_DRIVER` | `postgresql+psycopg` | SQLAlchemy driver string |
| `SQLA_ECHO` | `false` | Log SQL statements |
| `KT_DEBUG` | `false` | Debug logging |
| `KT_ENV_FILE` | `.env` | Alternate env-file path |

Nothing is read at import time. The process environment wins over the
`.env` file.

## Tests

```bash
uv run pytest              # unit: no database, no network
bin/integration-test.sh    # function layer + API against docker-compose postgres
```

## Layout

```text
src/kytrade/         config, db, stocks, sp500, analysis, ops, models
src/kytrade/providers/   PriceProvider protocol + YahooProvider
src/kytrade/api/     FastAPI ingress (thin routes)
src/kytrade/cli/     Typer CLI (thin commands)
tests/unit/          pytest suite, no database needed
tests/integration/   marked `integration`, real postgres
bin/                 bootstrap-adjacent scripts (hydrate, api, openapi, itests)
raw-data/            offline fallback (S&P 500 holdings snapshot, Oct 2022)
docker-compose.yml   local postgres
helmfile.yaml        postgres on the k8s cluster
```

Data model: [DATA.md](DATA.md). Conventions for agents: [CLAUDE.md](CLAUDE.md).
