"""Common database functions"""
import sqlalchemy
from sqlalchemy.orm import declarative_base, Session

import kytrade.const as const
import kytrade.lib.db.models as models


ENGINE = sqlalchemy.create_engine(
    const.SQL_CONN_STRING,
    echo=const.SQLA_ECHO,
    future=False,
    pool_size=20,
    max_overflow=0,
)


def init_create_tables():
    """Create the ORM-defined tables"""
    models.BASE.metadata.create_all(ENGINE)


def get_session() -> Session:
    """Get a session for this engine"""
    return Session(bind=ENGINE, expire_on_commit=False)


def commit(orm_object) -> None:
    """Commit an ORM object"""
    session = Session.object_session(orm_object)
    if not session:
        session = get_session()
        session.add(orm_object)
    session.commit()


def delete(orm_object) -> None:
    """Delete an ORM object"""
    session = Session.object_session(orm_object)
    session.delete(orm_object)
    session.commit()


def get_all_documents() -> dict:
    """Fetch all the documents at once!"""
    query = sqlalchemy.select(models.Document)
    session = get_session()
    try:
        result = session.execute(query).all()
    finally:
        session.close()
    documents = {}
    for row in result:
        documents[row[0].name] = row[0].data
    return documents


def get_document(name: str) -> dict:
    """Get a document's data else {}"""
    documents = {}
    query = sqlalchemy.select(models.Document).where(models.Document.name == name)
    session = get_session()
    try:
        result = session.execute(query).one_or_none()
    finally:
        session.close()
    if result:
        return result[0].data
    return {}


def set_document(name: str, data: dict) -> None:
    """Write a document's data"""
    session = get_session()
    try:
        select_query = sqlalchemy.select(models.Document).where(
            models.Document.name == name
        )
        select_result = session.execute(select_query).one_or_none()
        if select_result:
            document = select_result[0]
            document.data = data
        else:
            document = models.Document(name=name, data=data)
        session.add(document)
        session.commit()
    finally:
        session.close()
