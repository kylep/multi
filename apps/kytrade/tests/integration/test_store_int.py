"""Document-store integration tests against real postgres."""

import pytest

from kytrade import db

pytestmark = pytest.mark.integration


def test_document_roundtrip(clean_db):
    db.set_document("config/test", {"nested": {"values": [1, 2.5, None, "α"]}})
    assert db.get_document("config/test") == {"nested": {"values": [1, 2.5, None, "α"]}}


def test_document_update_overwrites(clean_db):
    db.set_document("config/test", {"v": 1})
    db.set_document("config/test", {"v": 2})
    assert db.get_document("config/test") == {"v": 2}
    assert db.list_documents() == ["config/test"]


def test_missing_document_is_none(clean_db):
    assert db.get_document("nope") is None


def test_get_documents_by_prefix(clean_db):
    db.set_document("stock/prices/AAPL", {"2026-01-02": {"close": 1.0}})
    db.set_document("stock/prices/MSFT", {"2026-01-02": {"close": 2.0}})
    db.set_document("stock/symbols", {})
    docs = db.get_documents("stock/prices/")
    assert sorted(docs) == ["stock/prices/AAPL", "stock/prices/MSFT"]
