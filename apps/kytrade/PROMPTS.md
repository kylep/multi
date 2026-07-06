# Prompts

Kytrade is developed prompt-first: a feature exists so that a prompt
like these works against real stored data. Each supported prompt maps
to one function in the business layer, exposed identically by the
`kt` CLI and the FastAPI ingress ([openapi.json](openapi.json)).

## Supported

| # | Prompt | CLI | API |
|---|--------|-----|-----|
| 1 | "How has AAPL performed over the last 90 days?" | `kt analyze performance AAPL --days 90` | `GET /analysis/performance/AAPL?days=90` |
| 2 | "Compare MSFT, GOOGL, and AMZN year-to-date" | `kt analyze compare MSFT GOOGL AMZN --days 365` | `GET /analysis/compare?symbols=MSFT&symbols=GOOGL&symbols=AMZN` |
| 3 | "Show me the biggest S&P 500 gainers and losers this month" | `kt analyze movers --days 30 --top 10` | `GET /analysis/movers?days=30&top=10` |
| 4 | "Which sector performed best this quarter?" | `kt analyze sectors --days 90` | `GET /analysis/sectors?days=90` |
| 5 | "Find stocks within 5% of their 52-week high" | `kt analyze near-extreme --kind high --threshold-pct 5` | `GET /analysis/near-extreme?kind=high&threshold_pct=5` |
| 6 | "What was TSLA's most volatile month last year?" | `kt analyze volatility TSLA --window-days 21` | `GET /analysis/volatility/TSLA?window_days=21` |
| 7 | "Refresh my market data" | `kt refresh` | `POST /refresh` |
| 8 | "Who joined or left the S&P 500 since my last update?" | `kt data load-sp500 --json` (returns the diff) | `POST /membership/load-sp500` |
| 9 | "Is kytrade healthy? How stale is my data?" | `kt status` | `GET /status` |
| 10 | "Set up kytrade from scratch on this machine" | `kt bootstrap` (generates a `.env` password if none is configured) | `POST /bootstrap` |

Past changes from prompt 8 accumulate in a dated history:
`kt data membership-log` / `GET /membership/log`.

Every read command takes `--json`; every route returns the same
pydantic model the CLI prints. Prompts compose: "which Energy stock
near its 52-week low had the calmest month" is a `near-extreme` call
filtered by `sectors` membership plus `volatility` calls.

## Roadmap

Wanted next, in no particular order. Each becomes a function + CLI
command + API route + skill recipe when built (phases in the
[roadmap](../blog/blog/markdown/wiki/design-docs/kytrade-modernization.md)).

| # | Prompt | Needs |
|---|--------|-------|
| 11 | "Backtest buying equal-weight FAANG in Jan 2020 and holding until today" | Backtest runner, portfolio math |
| 12 | "Test a 50/200-day moving-average crossover on SPY over 10 years" | Strategy protocol |
| 13 | "Compare that strategy against buy-and-hold with CAGR, max drawdown, Sharpe" | Metrics engine |
| 14 | "Rerun my momentum experiment with a 2% stop-loss and diff the results" | Persisted, parameterized experiments |
| 15 | "Start a paper portfolio: buy 10 AAPL and 5 MSFT at today's close" | Positions, orders, lots |
| 16 | "What's my paper portfolio worth and its return since inception?" | Portfolio valuation |
| 17 | "Watch NVDA, AMD, INTC — flag anything that moves more than 5% in a day" | Watchlists, signal checks |
| 18 | "Message me on Discord when a watched stock hits its signal" | Notifications (Discord bot infra) |
| 19 | "Pull fresh data every weekday evening automatically" | k8s CronJob + container image |
| 20 | "Write a blog-ready market recap for this month using only real numbers from my database" | Content-generation skill over the analysis API |
