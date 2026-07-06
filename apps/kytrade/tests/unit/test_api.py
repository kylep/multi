"""Tests for the FastAPI ingress."""

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

import kytrade
from kytrade import ops, stocks
from kytrade.api.app import app
from kytrade.models import RefreshReport

client = TestClient(app)


def seed_prices(store: dict, symbol: str, closes: dict[str, float]) -> None:
    store[f"{stocks.PRICES_DOC_PREFIX}/{symbol}"] = {
        day: {
            "open": close,
            "high": close,
            "low": close,
            "close": close,
            "volume": 10,
        }
        for day, close in closes.items()
    }


def test_live_and_version():
    assert client.get("/_live").json() == {"status": "OK"}
    assert client.get("/version").json() == {"version": kytrade.__version__}


def test_openapi_spec_is_committed_and_current():
    committed = json.loads((Path(__file__).parents[2] / "openapi.json").read_text())
    assert committed == json.loads(
        json.dumps(app.openapi(), indent=2, sort_keys=True)
    ), "openapi.json is stale — run bin/export-openapi.sh"


def test_prices_tail(fake_store: dict):
    seed_prices(
        fake_store,
        "AAPL",
        {"2026-01-02": 1.0, "2026-01-03": 2.0, "2026-01-04": 3.0},
    )
    response = client.get("/data/prices/AAPL", params={"tail": 2})
    assert response.status_code == 200
    assert list(response.json()) == ["2026-01-03", "2026-01-04"]


def test_pull_validates_arguments():
    assert client.post("/data/pull", json={}).status_code == 422
    assert (
        client.post(
            "/data/pull", json={"symbol": "AAPL", "all_symbols": True}
        ).status_code
        == 422
    )


def test_pull_single_symbol(fake_store: dict, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(
        stocks, "pull_price_history", lambda symbol, full=False, **kwargs: 7
    )
    response = client.post("/data/pull", json={"symbol": "AAPL"})
    assert response.json() == {"symbol": "AAPL", "new_days": 7}


def test_performance_route(fake_store: dict):
    seed_prices(fake_store, "AAPL", {"2026-06-01": 100.0, "2026-07-01": 110.0})
    response = client.get("/analysis/performance/AAPL", params={"days": 90})
    assert response.status_code == 200
    assert response.json()["return_pct"] == 10.0


def test_performance_404_when_no_data(fake_store: dict):
    assert client.get("/analysis/performance/NOPE").status_code == 404


def test_compare_route(fake_store: dict):
    seed_prices(fake_store, "AAA", {"2026-06-01": 100.0, "2026-07-01": 105.0})
    seed_prices(fake_store, "BBB", {"2026-06-01": 100.0, "2026-07-01": 120.0})
    response = client.get(
        "/analysis/compare", params={"symbols": ["AAA", "BBB"], "days": 90}
    )
    entries = response.json()["entries"]
    assert [entry["symbol"] for entry in entries] == ["BBB", "AAA"]


def test_near_extreme_rejects_bad_kind(fake_store: dict):
    assert (
        client.get("/analysis/near-extreme", params={"kind": "up"}).status_code == 422
    )


def test_refresh_route(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(
        ops,
        "refresh",
        lambda full=False: RefreshReport(pulled=1, skipped=2, failed=[], new_days=3),
    )
    assert client.post("/refresh").json()["new_days"] == 3


def test_document_routes(fake_store: dict):
    put = client.put("/db/documents/config/greeting", json={"data": {"hi": "there"}})
    assert put.status_code == 200
    assert client.get("/db/documents/config/greeting").json() == {"hi": "there"}
    assert client.get("/db/documents").json() == ["config/greeting"]
    assert client.get("/db/documents/missing").status_code == 404


def test_status_route(monkeypatch: pytest.MonkeyPatch, fake_store: dict):
    monkeypatch.setattr(ops, "_db_reachable", lambda: True)
    monkeypatch.setattr(ops, "_tables_exist", lambda: True)
    response = client.get("/status")
    assert response.status_code == 200
    assert response.json()["db_ok"] is True
