"""Environment-driven settings, read lazily so imports never require env vars."""

import os
from dataclasses import dataclass
from functools import cache


class MissingEnvVar(Exception):
    """A required environment variable is not set."""


def _require(name: str) -> str:
    try:
        return os.environ[name]
    except KeyError as err:
        raise MissingEnvVar(f"{name} must be set") from err


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
        driver=os.environ.get("SQLA_DRIVER", "postgresql+psycopg"),
        host=os.environ.get("POSTGRES_HOST", "127.0.0.1"),
        port=int(os.environ.get("POSTGRES_PORT", "5432")),
        user=os.environ.get("POSTGRES_USER", "kytrade"),
        password=_require("POSTGRES_PASSWORD"),
        database=os.environ.get("DATABASE_NAME", "kytrade"),
        echo_sql=os.environ.get("SQLA_ECHO", "").lower() == "true",
    )
