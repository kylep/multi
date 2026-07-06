"""Fixtures for integration tests: a real postgres via docker compose.

Tests truncate the documents table, so they refuse to run against
anything but a *_test database — bin/integration-test.sh sets one up.
"""

import pytest
import sqlalchemy

from kytrade import config, db, ops


@pytest.fixture(scope="session", autouse=True)
def require_test_db():
    try:
        database = config.settings().database
    except config.MissingEnvVar:
        pytest.skip("no database credentials — run bin/integration-test.sh")
    if not database.endswith("_test"):
        pytest.skip(
            f"refusing to truncate {database!r} — integration tests only run "
            "against a *_test database (use bin/integration-test.sh)"
        )
    if not ops._db_reachable():
        pytest.skip("postgres unreachable — run bin/integration-test.sh")


@pytest.fixture
def clean_db():
    db.init_tables()
    with db.engine().connect() as connection:
        connection.execute(sqlalchemy.text("TRUNCATE documents"))
        connection.commit()
    yield
