# database.py

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base  # Импортируем Base из models.py
from app.config import SQLALCHEMY_DATABASE_URI

engine = create_engine(SQLALCHEMY_DATABASE_URI)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    Base.metadata.create_all(bind=engine)
