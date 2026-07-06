# kytrade

Personal trading toolkit: the platform I build trading software in — run
experiments, explore transaction decisions, test and eventually automate
strategies. Open source, but built for me; talk to me before using it.

The roadmap lives in the wiki:
[Kytrade Modernization Roadmap](../blog/blog/markdown/wiki/design-docs/kytrade-modernization.md).

## Stack

- Python 3.14, managed with [uv](https://docs.astral.sh/uv/)
- Typer CLI (`kt`) — the primary interface, for humans and Claude alike
- Postgres JSON-document store (SQLAlchemy 2 + psycopg 3), schema in
  [DATA.md](DATA.md)
- Price data from Yahoo Finance via yfinance

## Quickstart

Postgres wants credentials in the environment:

```bash
export POSTGRES_PASSWORD=devpassword   # the only required var
```

Start the database and hydrate it:

```bash
docker compose up -d postgres
uv sync
bin/hydrate-db.sh
```

Pull and inspect some prices:

```bash
uv run kt data pull -s AAPL
uv run kt data prices AAPL --tail 10
uv run kt data prices AAPL --tail 10 --json
```

## CLI

`kt --help` is the source of truth. The groups:

- `kt data` — pull daily price history (incremental; `--full` re-downloads),
  read prices, load live S&P 500 membership from Wikipedia
  (`load-sp500`, with `--file` for the offline spreadsheet), and
  `backfill-sp500` to load membership and pull every symbol
- `kt db` — init tables, list/get/set raw documents
- `kt version`

Pulls are incremental: only dates newer than what's stored are fetched.
Run `kt data pull --all --full` occasionally — auto-adjusted historical
prices shift after splits and dividends.

`--debug/-d` (or `KT_DEBUG=true`) enables debug logging. Read commands
take `--json` for machine-readable output.

## Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `POSTGRES_PASSWORD` | (required) | Database password |
| `POSTGRES_HOST` | `127.0.0.1` | Database host |
| `POSTGRES_PORT` | `5432` | Database port |
| `POSTGRES_USER` | `kytrade` | Database user |
| `DATABASE_NAME` | `kytrade` | Database name |
| `SQLA_DRIVER` | `postgresql+psycopg` | SQLAlchemy driver string |
| `SQLA_ECHO` | `false` | Log SQL statements |
| `KT_DEBUG` | `false` | Debug logging |

Nothing is read at import time; a variable is only required by the
commands that use it.

## Tests

```bash
uv run pytest
```

## Layout

```text
src/kytrade/      the package: config, db, stocks, sp500, providers/, cli/
tests/unit/       pytest suite (no database needed)
bin/              hydrate-db.sh, reset-database.sh
raw-data/         offline fallback (S&P 500 holdings snapshot, Oct 2022)
docker-compose.yml   local postgres
helmfile.yaml     postgres on the k8s cluster
```
