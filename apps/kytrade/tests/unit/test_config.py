"""Tests for kytrade.config."""

import pytest

from kytrade import config


@pytest.fixture(autouse=True)
def clear_settings_cache(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("KT_ENV_FILE", "/nonexistent/.env")
    config.reset_cache()
    yield
    config.reset_cache()


def test_settings_requires_postgres_password(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.delenv("POSTGRES_PASSWORD", raising=False)
    with pytest.raises(config.MissingEnvVar):
        config.settings()


def test_settings_defaults(monkeypatch: pytest.MonkeyPatch):
    for name in (
        "SQLA_DRIVER",
        "POSTGRES_HOST",
        "POSTGRES_PORT",
        "POSTGRES_USER",
        "DATABASE_NAME",
        "SQLA_ECHO",
    ):
        monkeypatch.delenv(name, raising=False)
    monkeypatch.setenv("POSTGRES_PASSWORD", "hunter2")
    settings = config.settings()
    assert (
        settings.db_url == "postgresql+psycopg://kytrade:hunter2@127.0.0.1:5432/kytrade"
    )
    assert settings.echo_sql is False


def test_settings_reads_env_overrides(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("POSTGRES_PASSWORD", "pw")
    monkeypatch.setenv("POSTGRES_HOST", "db.example.com")
    monkeypatch.setenv("POSTGRES_PORT", "5433")
    monkeypatch.setenv("POSTGRES_USER", "trader")
    monkeypatch.setenv("DATABASE_NAME", "prices")
    monkeypatch.setenv("SQLA_ECHO", "true")
    settings = config.settings()
    assert (
        settings.db_url == "postgresql+psycopg://trader:pw@db.example.com:5433/prices"
    )
    assert settings.echo_sql is True


def test_settings_falls_back_to_env_file(tmp_path, monkeypatch: pytest.MonkeyPatch):
    env_file = tmp_path / ".env"
    env_file.write_text("POSTGRES_PASSWORD=from-file\n# comment\nPOSTGRES_HOST='fh'\n")
    monkeypatch.delenv("POSTGRES_PASSWORD", raising=False)
    monkeypatch.delenv("POSTGRES_HOST", raising=False)
    monkeypatch.setenv("KT_ENV_FILE", str(env_file))
    config.reset_cache()
    settings = config.settings()
    assert settings.password == "from-file"
    assert settings.host == "fh"
    config.reset_cache()


def test_environ_beats_env_file(tmp_path, monkeypatch: pytest.MonkeyPatch):
    env_file = tmp_path / ".env"
    env_file.write_text("POSTGRES_PASSWORD=from-file\n")
    monkeypatch.setenv("POSTGRES_PASSWORD", "from-env")
    monkeypatch.setenv("KT_ENV_FILE", str(env_file))
    config.reset_cache()
    assert config.settings().password == "from-env"
    config.reset_cache()


def test_importing_kytrade_needs_no_env_vars(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.delenv("POSTGRES_PASSWORD", raising=False)
    import kytrade
    import kytrade.cli.main
    import kytrade.stocks

    assert kytrade.__version__
