"""Fixtures for integration tests: a real (disposable) postgres via docker compose."""

import pytest
import sqlalchemy

from kytrade import db, ops


@pytest.fixture(scope="session", autouse=True)
def require_db():
    if not ops._db_reachable():
        pytest.skip("postgres unreachable — run bin/integration-test.sh")


@pytest.fixture
def clean_db():
    db.init_tables()
    with db.engine().connect() as connection:
        connection.execute(sqlalchemy.text("TRUNCATE documents"))
        connection.commit()
    yield
