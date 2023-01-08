"""SQLAlchemy database models"""
from sqlalchemy.orm import declarative_base
from sqlalchemy import (
    Column,
    String,
    Integer,
    Date,
    Float,
    UniqueConstraint,
    TEXT,
    JSON,
)


Base = declarative_base()


def model_string_representation(clazz: object):
    """Print a usable constructor as the model representation"""
    keys = [
        key
        for key in clazz.__dict__.keys()
        if (not key.startswith("_") and key != "metad")
    ]
    val_str = ", ".join([f"{key}={getattr(clazz, key)!r}" for key in keys])
    return f"{clazz.__class__.__name__}({val_str})"


class Document(Base):
    """Documents"""

    __tablename__ = "documents"
    __table_args__ = (UniqueConstraint("name"),)
    id = Column(Integer, primary_key=True)
    name = Column(String(512))
    data = Column(JSON)

    def __repr__(self) -> str:
        return model_string_representation(self)
