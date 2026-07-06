"""Shared fixtures for unit tests."""

import pytest

from kytrade import db


@pytest.fixture
def fake_store(monkeypatch: pytest.MonkeyPatch) -> dict:
    """Replace the document store with an in-memory dict."""
    store: dict = {}
    monkeypatch.setattr(db, "get_document", store.get)
    monkeypatch.setattr(db, "set_document", store.__setitem__)
    monkeypatch.setattr(db, "list_documents", lambda: sorted(store))
    monkeypatch.setattr(
        db,
        "get_documents",
        lambda prefix: {
            name: data for name, data in store.items() if name.startswith(prefix)
        },
    )
    return store
