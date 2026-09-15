import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Defaults to a local SQLite file so the app runs with zero setup.
# To use PostgreSQL instead, set an environment variable, e.g.:
#   export DATABASE_URL="postgresql://user:password@localhost:5432/finance_dashboard"
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./finance.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
