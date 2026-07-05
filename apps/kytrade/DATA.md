# Data model

Everything lives in one Postgres table, `documents` (`name` → JSON `data`).
It's a deliberate stop-gap: simple until there's enough data that range
scans hurt, then the relational migration tracked in the
[roadmap](../blog/blog/markdown/wiki/design-docs/kytrade-modernization.md)
kicks in.

Inspect any of these with `kt db get <name>`.

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
re-downloads within the same day.

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

Sector name → sorted list of member tickers.

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
