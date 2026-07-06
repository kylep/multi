"""Operational functions: health, refresh, and bootstrap (including secrets)."""

import logging
import os
import secrets
from datetime import date, timedelta
from pathlib import Path

import sqlalchemy

from kytrade import config, db, sp500, stocks
from kytrade.models import BootstrapReport, RefreshReport, Staleness, StatusReport

logger = logging.getLogger(__name__)

BUNDLED_SNAPSHOT = Path("raw-data/indexes/spy-oct17-2022.xlsx")


def _db_reachable() -> bool:
    try:
        with db.engine().connect() as connection:
            connection.execute(sqlalchemy.text("SELECT 1"))
        return True
    except (sqlalchemy.exc.OperationalError, config.MissingEnvVar):
        return False


def _tables_exist() -> bool:
    return sqlalchemy.inspect(db.engine()).has_table(db.Document.__tablename__)


def status() -> StatusReport:
    """Report toolkit health: database, tables, and data staleness."""
    if not _db_reachable():
        return StatusReport(
            db_ok=False,
            tables_ok=False,
            documents=0,
            symbols=0,
            priced_symbols=0,
            staleness=Staleness(today=0, week=0, older=0, never=0),
        )
    if not _tables_exist():
        return StatusReport(
            db_ok=True,
            tables_ok=False,
            documents=0,
            symbols=0,
            priced_symbols=0,
            staleness=Staleness(today=0, week=0, older=0, never=0),
        )
    symbols = stocks.get_symbols()
    today = date.today()
    week_ago = (today - timedelta(days=7)).isoformat()
    staleness = Staleness(today=0, week=0, older=0, never=0)
    for metadata in symbols.values():
        updated = metadata.get("last_updated")
        if updated is None:
            staleness.never += 1
        elif updated == today.isoformat():
            staleness.today += 1
        elif updated >= week_ago:
            staleness.week += 1
        else:
            staleness.older += 1
    return StatusReport(
        db_ok=True,
        tables_ok=True,
        documents=len(db.list_documents()),
        symbols=len(symbols),
        priced_symbols=len(db.get_documents(f"{stocks.PRICES_DOC_PREFIX}/")),
        staleness=staleness,
    )


def refresh(full: bool = False) -> RefreshReport:
    """Pull every known symbol that isn't already fresh today."""
    symbols = stocks.get_symbols()
    today = date.today().isoformat()
    pulled, skipped, new_days, failed = 0, 0, 0, []
    for i, symbol in enumerate(sorted(symbols), start=1):
        if not full and symbols[symbol]["last_updated"] == today:
            skipped += 1
            continue
        logger.info("%d/%d %s", i, len(symbols), symbol)
        try:
            new_days += stocks.pull_price_history(symbol, full=full, symbols=symbols)
            pulled += 1
        except Exception:
            logger.exception("failed to refresh %s", symbol)
            failed.append(symbol)
    return RefreshReport(
        pulled=pulled, skipped=skipped, failed=failed, new_days=new_days
    )


def ensure_env(path: Path | None = None) -> tuple[Path, bool]:
    """Ensure POSTGRES_PASSWORD exists, generating an .env file if needed.

    Returns the env-file path and whether a password was generated. An
    existing password (environment or .env) is never overwritten.
    """
    path = path or Path(os.environ.get("KT_ENV_FILE", ".env"))
    if config.has("POSTGRES_PASSWORD"):
        return path, False
    password = secrets.token_urlsafe(24)
    existing = path.read_text() if path.is_file() else ""
    with path.open("a") as env_file:
        if existing and not existing.endswith("\n"):
            env_file.write("\n")
        env_file.write(f"POSTGRES_PASSWORD={password}\n")
    path.chmod(0o600)
    config.reset_cache()
    logger.info("initialized env file at %s", path)
    return path, True


def bootstrap() -> BootstrapReport:
    """Prepare the toolkit: secrets, tables, and S&P 500 membership.

    Requires a reachable Postgres (docker compose up -d postgres). Prices
    are not pulled here — run a refresh afterwards.
    """
    env_path, generated = ensure_env()
    db.engine.cache_clear()
    if not _db_reachable():
        return BootstrapReport(
            env_file=str(env_path),
            password_generated=generated,
            db_ok=False,
            tables_created=False,
            symbols_loaded=0,
        )
    db.init_tables()
    symbols_loaded = 0
    if not stocks.get_symbols():
        try:
            members = sp500.fetch_membership()
        except Exception:
            logger.exception("live membership fetch failed, using bundled snapshot")
            members = sp500.load_membership_from_excel(BUNDLED_SNAPSHOT)
        symbols_loaded = sp500.apply_membership(members).total
    return BootstrapReport(
        env_file=str(env_path),
        password_generated=generated,
        db_ok=True,
        tables_created=True,
        symbols_loaded=symbols_loaded,
    )
