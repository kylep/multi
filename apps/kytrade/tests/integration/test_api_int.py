"""API integration tests: FastAPI routes over real postgres."""

import pytest
from fastapi.testclient import TestClient

from kytrade import stocks
from kytrade.api.app import app

pytestmark = pytest.mark.integration

client = TestClient(app)


def test_status_route_reports_real_db(clean_db):
    report = client.get("/status").json()
    assert report["db_ok"] is True
    assert report["tables_ok"] is True


def test_document_routes_roundtrip(clean_db):
    client.put("/db/documents/config/x", json={"data": [1, 2, 3]})
    assert client.get("/db/documents/config/x").json() == [1, 2, 3]


def test_prices_and_performance_routes(clean_db):
    stocks.set_prices(
        "AAPL",
        {
            "2026-06-01": {
                "open": 100.0,
                "high": 101.0,
                "low": 99.0,
                "close": 100.0,
                "volume": 10,
            },
            "2026-07-01": {
                "open": 110.0,
                "high": 111.0,
                "low": 109.0,
                "close": 110.0,
                "volume": 10,
            },
        },
    )
    assert list(client.get("/data/prices/AAPL", params={"tail": 1}).json()) == [
        "2026-07-01"
    ]
    performance = client.get("/analysis/performance/AAPL", params={"days": 90}).json()
    assert performance["return_pct"] == 10.0
