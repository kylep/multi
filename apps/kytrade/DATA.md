# Data model

Everything lives in one Postgres table, `documents` (`name` → JSON `data`).
It's a deliberate stop-gap: simple until there's enough data that range
scans hurt, then the relational migration tracked in the
[roadmap](../blog/blog/markdown/wiki/design-docs/kytrade-modernization.md)
kicks in.

Inspect any of these with `kt db get <name>`.

The store assumes a single writer: reconciliation and ETF tracking are
read-modify-write over whole documents, so concurrent membership loads
can drop each other's updates. Fine for a one-operator toolkit; a
transactional story arrives with the relational migration below.

## stock/symbols

Ticker → metadata for every known symbol.

```json
{
  "AAPL": {
    "indexes": ["S&P 500"],
    "etfs": ["SPY"],
    "sectors": ["Information Technology"],
    "currency": "USD",
    "last_updated": "2026-07-04"
  }
}
```

`last_updated` is the date price history was last saved, used to skip
re-downloads within the same day (`--full` ignores it).

Data written before kytrade 3.x uses an incompatible shape
(`ETFs` key, sector→metadata sectors document) — rerun
`bin/hydrate-db.sh` instead of migrating.

## stock/indexes

Sorted list of known index names.

```json
["S&P 500"]
```

## stock/etfs

Sorted list of known ETF tickers.

```json
["SPY"]
```

## stock/sectors

Sector name → sorted list of member tickers. Rebuilt from the current
membership on every `kt data load-index`; symbols that leave an index
also lose their `S&P 500`/`SPY` tags in `stock/symbols` (their price
history is kept).

```json
{
  "Energy": ["CVX", "XOM"],
  "Information Technology": ["AAPL", "MSFT"]
}
```

## stock/prices/&lt;symbol&gt;

Date → OHLCV for one symbol, oldest date first. Values are
JSON-safe: floats (or null where Yahoo had no data), volume is an
integer, and all-null rows are dropped at ingest.

`kt data pull` extends this incrementally (only dates after the newest
stored row). Prices are auto-adjusted, so history drifts after splits
and dividends — an occasional `kt data pull --all --full` re-baselines.

```json
{
  "2026-07-03": {
    "open": 212.15,
    "high": 214.65,
    "low": 211.81,
    "close": 213.55,
    "volume": 34955800
  }
}
```
