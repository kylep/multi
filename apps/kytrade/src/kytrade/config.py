"""Environment-driven settings, read lazily so imports never require env vars.

Values resolve from the process environment first, then from a local
`.env` file (KT_ENV_FILE overrides the path), then defaults.
"""

import os
from dataclasses import dataclass
from functools import cache
from pathlib import Path


class MissingEnvVar(Exception):
    """A required environment variable is not set."""


@cache
def env_file_values() -> dict[str, str]:
    """Parse KEY=VALUE lines from the .env file, if present."""
    path = Path(os.environ.get("KT_ENV_FILE", ".env"))
    if not path.is_file():
        return {}
    values: dict[str, str] = {}
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        values[key.strip()] = value.strip().strip("'\"")
    return values


def _env(name: str, default: str) -> str:
    return os.environ.get(name, env_file_values().get(name, default))


def has(name: str) -> bool:
    """True if a value for name is available from the env or the .env file."""
    return os.environ.get(name, env_file_values().get(name)) is not None


def _require(name: str) -> str:
    value = os.environ.get(name, env_file_values().get(name))
    if value is None:
        raise MissingEnvVar(f"{name} must be set (env var or .env file)")
    return value


@dataclass(frozen=True, slots=True)
class Settings:
    """Database connection settings."""

    driver: str = "postgresql+psycopg"
    host: str = "127.0.0.1"
    port: int = 5432
    user: str = "kytrade"
    password: str = ""
    database: str = "kytrade"
    echo_sql: bool = False

    @property
    def db_url(self) -> str:
        return (
            f"{self.driver}://{self.user}:{self.password}"
            f"@{self.host}:{self.port}/{self.database}"
        )


@cache
def settings() -> Settings:
    """Build Settings from the environment; only POSTGRES_PASSWORD is required."""
    return Settings(
        driver=_env("SQLA_DRIVER", "postgresql+psycopg"),
        host=_env("POSTGRES_HOST", "127.0.0.1"),
        port=int(_env("POSTGRES_PORT", "5432")),
        user=_env("POSTGRES_USER", "kytrade"),
        password=_require("POSTGRES_PASSWORD"),
        database=_env("DATABASE_NAME", "kytrade"),
        echo_sql=_env("SQLA_ECHO", "").lower() == "true",
    )


def reset_cache() -> None:
    """Forget cached settings and .env values (after bootstrap writes .env)."""
    settings.cache_clear()
    env_file_values.cache_clear()
