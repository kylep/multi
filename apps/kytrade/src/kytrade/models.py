"""Response models shared by the analysis/ops layer, the API, and the CLI."""

from pydantic import BaseModel


class Performance(BaseModel):
    """Window performance for one symbol."""

    symbol: str
    days: int
    start_date: str
    end_date: str
    start_close: float
    end_close: float
    return_pct: float
    high: float
    low: float
    avg_volume: int


class ComparisonEntry(BaseModel):
    """One symbol's line in a comparison."""

    symbol: str
    return_pct: float
    start_close: float
    end_close: float


class Comparison(BaseModel):
    """Window returns for several symbols, best first."""

    days: int
    entries: list[ComparisonEntry]


class Movers(BaseModel):
    """Best and worst window returns across the known universe."""

    days: int
    gainers: list[ComparisonEntry]
    losers: list[ComparisonEntry]
    universe: int


class SectorPerformance(BaseModel):
    """Average member return for one sector."""

    sector: str
    return_pct: float
    symbols: int


class SectorReport(BaseModel):
    """Sector performance over a window, best first."""

    days: int
    sectors: list[SectorPerformance]


class ExtremeHit(BaseModel):
    """A symbol trading near its lookback extreme."""

    symbol: str
    close: float
    extreme: float
    distance_pct: float


class ScreenerReport(BaseModel):
    """Symbols within threshold of their lookback high or low."""

    kind: str
    threshold_pct: float
    lookback_days: int
    hits: list[ExtremeHit]
    universe: int


class VolatilityWindow(BaseModel):
    """A dated window with its daily-return standard deviation."""

    start_date: str
    end_date: str
    daily_stddev_pct: float


class VolatilityReport(BaseModel):
    """Volatility for one symbol: overall and the worst rolling window."""

    symbol: str
    window_days: int
    overall_daily_stddev_pct: float
    worst_window: VolatilityWindow


class Staleness(BaseModel):
    """How fresh the stored price data is, by symbol count."""

    today: int
    week: int
    older: int
    never: int


class StatusReport(BaseModel):
    """Health of the toolkit."""

    db_ok: bool
    tables_ok: bool
    documents: int
    symbols: int
    priced_symbols: int
    staleness: Staleness


class RefreshReport(BaseModel):
    """Result of a staleness-aware refresh."""

    pulled: int
    skipped: int
    failed: list[str]
    new_days: int


class MembershipDiff(BaseModel):
    """Symbols that joined or left an index during a membership load."""

    index: str
    added: list[str]
    removed: list[str]
    total: int


class MembershipLogEntry(BaseModel):
    """One dated membership change."""

    date: str
    added: list[str]
    removed: list[str]


class BootstrapReport(BaseModel):
    """Result of bootstrapping the toolkit."""

    env_file: str
    password_generated: bool
    db_ok: bool
    tables_created: bool
    symbols_loaded: int
