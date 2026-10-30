import os

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool

SQLALCHEMY_DATABASE_URL = os.getenv("LOGISTICS_DATABASE_URL") or os.getenv(
    "DATABASE_URL"
)
if not SQLALCHEMY_DATABASE_URL:
    if os.getenv("VERCEL"):
        raise RuntimeError(
            "Set LOGISTICS_DATABASE_URL to a persistent PostgreSQL database on Vercel."
        )
    SQLALCHEMY_DATABASE_URL = "sqlite:///./logistics.db"
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace(
        "postgres://", "postgresql+psycopg://", 1
    )
elif SQLALCHEMY_DATABASE_URL.startswith("postgresql://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace(
        "postgresql://", "postgresql+psycopg://", 1
    )

engine_options = (
    {"connect_args": {"check_same_thread": False}}
    if SQLALCHEMY_DATABASE_URL.startswith("sqlite")
    else {}
)
if os.getenv("VERCEL"):
    engine_options["poolclass"] = NullPool
engine = create_engine(SQLALCHEMY_DATABASE_URL, **engine_options)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def initialize_database():
    Base.metadata.create_all(bind=engine)
    if "owner_id" not in {
        column["name"] for column in inspect(engine).get_columns("shipments")
    }:
        with engine.begin() as connection:
            connection.execute(
                text(
                    "ALTER TABLE shipments ADD COLUMN owner_id "
                    "INTEGER REFERENCES users(id)"
                )
            )


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()