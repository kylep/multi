"""FastAPI ingress. Routes are thin wrappers over the function layer;
the CLI exposes the same functions with the same argument types.
"""

from typing import Annotated, Any, Literal

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel

import kytrade
from kytrade import analysis, db, indexes, ops, stocks
from kytrade.models import (
    BootstrapReport,
    Comparison,
    MembershipDiff,
    MembershipLogEntry,
    Movers,
    Performance,
    RefreshReport,
    ScreenerReport,
    SectorReport,
    StatusReport,
    VolatilityReport,
)
from kytrade.providers import DailyPrices

app = FastAPI(
    title="kytrade",
    version=kytrade.__version__,
    description="Personal trading toolkit: prices, S&P 500 membership, and analysis "
    "over a Postgres document store. The kt CLI is a twin of this API.",
)


class VersionOut(BaseModel):
    version: str


class PullIn(BaseModel):
    symbol: str | None = None
    all_symbols: bool = False
    full: bool = False


class PullOut(BaseModel):
    symbol: str | None
    new_days: int | None


class DocumentIn(BaseModel):
    data: Any


@app.get("/_live")
def live() -> dict[str, str]:
    """Liveness probe."""
    return {"status": "OK"}


@app.get("/version")
def version() -> VersionOut:
    """Installed kytrade version."""
    return VersionOut(version=kytrade.__version__)


@app.get("/status")
def status() -> StatusReport:
    """Toolkit health: database, tables, and data staleness."""
    return ops.status()


@app.post("/refresh")
def refresh(full: bool = False) -> RefreshReport:
    """Pull every known symbol that isn't already fresh today."""
    return ops.refresh(full=full)


@app.post("/bootstrap")
def bootstrap() -> BootstrapReport:
    """Prepare the toolkit: secrets, tables, and S&P 500 membership."""
    return ops.bootstrap()


@app.post("/data/pull")
def pull(body: PullIn) -> PullOut:
    """Pull daily history for one symbol, or all symbols (incremental by default)."""
    if body.all_symbols == bool(body.symbol):
        raise HTTPException(422, "provide exactly one of symbol or all_symbols")
    try:
        if body.all_symbols:
            stocks.pull_all_price_histories(full=body.full)
            return PullOut(symbol=None, new_days=None)
        return PullOut(
            symbol=body.symbol,
            new_days=stocks.pull_price_history(body.symbol, full=body.full),
        )
    except Exception as err:
        raise HTTPException(502, f"price provider error: {err}") from err


@app.get("/data/prices/{symbol}")
def prices(symbol: str, tail: Annotated[int, Query(ge=0)] = 0) -> DailyPrices:
    """Stored daily prices for a symbol, oldest first."""
    history = dict(sorted(stocks.get_prices(symbol).items()))
    if tail:
        history = dict(list(history.items())[-tail:])
    return history


@app.get("/data/symbols")
def symbols() -> dict[str, Any]:
    """Every known symbol and its metadata."""
    return stocks.get_symbols()


class TrackEtfIn(BaseModel):
    ticker: str
    currency: str | None = None


class TrackEtfOut(BaseModel):
    ticker: str
    created: bool


@app.post("/membership/load/{index}")
def load_index(index: Literal["sp500", "tsx60", "all"]) -> list[MembershipDiff]:
    """Load current index membership from Wikipedia and reconcile."""
    specs = (
        list(indexes.INDEXES.values()) if index == "all" else [indexes.INDEXES[index]]
    )
    diffs = []
    for spec in specs:
        try:
            members = indexes.fetch_membership(spec)
        except Exception as err:
            raise HTTPException(502, f"membership fetch failed: {err}") from err
        diffs.append(indexes.apply_membership(spec, members))
    return diffs


@app.post("/data/track-etf")
def track_etf(body: TrackEtfIn) -> TrackEtfOut:
    """Track an ETF's prices like any symbol."""
    created = indexes.track_etf(body.ticker, body.currency)
    return TrackEtfOut(ticker=body.ticker.strip().upper(), created=created)


@app.get("/membership/log")
def membership_log() -> list[MembershipLogEntry]:
    """Dated membership changes recorded by past loads."""
    return indexes.membership_log()


@app.get("/analysis/performance/{symbol}")
def performance(symbol: str, days: Annotated[int, Query(gt=0)] = 90) -> Performance:
    """Window performance for one symbol."""
    try:
        return analysis.performance(symbol, days=days)
    except analysis.NotEnoughData as err:
        raise HTTPException(404, str(err)) from err


@app.get("/analysis/compare")
def compare(
    symbols: Annotated[list[str], Query(min_length=2)],
    days: Annotated[int, Query(gt=0)] = 365,
) -> Comparison:
    """Window returns for several symbols, best first."""
    try:
        return analysis.compare(symbols, days=days)
    except analysis.NotEnoughData as err:
        raise HTTPException(404, str(err)) from err


@app.get("/analysis/movers")
def movers(
    days: Annotated[int, Query(gt=0)] = 30, top: Annotated[int, Query(gt=0)] = 10
) -> Movers:
    """Best and worst window returns across the stored universe."""
    return analysis.movers(days=days, top=top)


@app.get("/analysis/sectors")
def sectors(days: Annotated[int, Query(gt=0)] = 90) -> SectorReport:
    """Average member return per sector, best first."""
    return analysis.sector_performance(days=days)


@app.get("/analysis/near-extreme")
def near_extreme(
    kind: Literal["high", "low"] = "high",
    threshold_pct: Annotated[float, Query(ge=0)] = 5.0,
    lookback_days: Annotated[int, Query(gt=0)] = 365,
) -> ScreenerReport:
    """Symbols trading within threshold of their lookback high or low."""
    return analysis.near_extreme(
        kind=kind, threshold_pct=threshold_pct, lookback_days=lookback_days
    )


@app.get("/analysis/volatility/{symbol}")
def volatility(
    symbol: str, window_days: Annotated[int, Query(gt=1)] = 21
) -> VolatilityReport:
    """Daily-return volatility and the worst rolling window."""
    try:
        return analysis.volatility(symbol, window_days=window_days)
    except analysis.NotEnoughData as err:
        raise HTTPException(404, str(err)) from err


@app.get("/db/documents")
def documents() -> list[str]:
    """Stored document names."""
    return db.list_documents()


@app.get("/db/documents/{name:path}")
def get_document(name: str) -> Any:
    """One document's data."""
    data = db.get_document(name)
    if data is None:
        raise HTTPException(404, f"no document named {name!r}")
    return data


RESERVED_DOC_PREFIX = "stock/"


@app.put("/db/documents/{name:path}")
def set_document(name: str, body: DocumentIn) -> Any:
    """Insert or replace a document outside the reserved stock/ namespace.

    Stock documents carry invariants the data/membership routes enforce;
    raw writes to them are CLI-only (`kt db set`, a local operator tool).
    """
    if name.startswith(RESERVED_DOC_PREFIX):
        raise HTTPException(
            403, f"{RESERVED_DOC_PREFIX}* documents are managed by the data routes"
        )
    db.set_document(name, body.data)
    return db.get_document(name)
