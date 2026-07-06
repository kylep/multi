"""Postgres JSON-document store."""

import logging
from functools import cache
from typing import Any

from sqlalchemy import JSON, Engine, String, create_engine, select
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column

from kytrade.config import settings

logger = logging.getLogger(__name__)


class Base(DeclarativeBase):
    """Declarative base for all kytrade tables."""


class Document(Base):
    """A named JSON blob; the whole schema until relational tables are warranted."""

    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(512), unique=True)
    data: Mapped[Any] = mapped_column(JSON)

    def __repr__(self) -> str:
        return f"Document(id={self.id!r}, name={self.name!r})"


@cache
def engine() -> Engine:
    return create_engine(settings().db_url, echo=settings().echo_sql)


def init_tables() -> None:
    """Create all ORM-defined tables."""
    Base.metadata.create_all(engine())


def list_documents() -> list[str]:
    """Return every stored document name."""
    logger.debug("db:list documents")
    with Session(engine()) as session:
        return list(session.scalars(select(Document.name).order_by(Document.name)))


def get_documents(prefix: str) -> dict[str, Any]:
    """Return name → data for every document whose name starts with prefix."""
    logger.debug("db:get prefix %s", prefix)
    with Session(engine()) as session:
        docs = session.scalars(select(Document).where(Document.name.startswith(prefix)))
        return {doc.name: doc.data for doc in docs}


def get_document(name: str) -> Any:
    """Return a document's data, or None if it does not exist."""
    logger.debug("db:get %s", name)
    with Session(engine()) as session:
        doc = session.scalar(select(Document).where(Document.name == name))
        return doc.data if doc else None


def set_document(name: str, data: Any) -> None:
    """Insert or update a document."""
    logger.debug("db:set %s", name)
    with Session(engine()) as session:
        doc = session.scalar(select(Document).where(Document.name == name))
        if doc is None:
            session.add(Document(name=name, data=data))
        else:
            doc.data = data
        session.commit()
