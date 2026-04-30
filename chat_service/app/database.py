# database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import SQLALCHEMY_DATABASE_URI
import redis
import os

DATABASE_URL = SQLALCHEMY_DATABASE_URI


REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = os.getenv("REDIS_PORT", "6379")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


redis_client = redis.Redis(
    host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)


# Функция для получения сессии БД
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():  # Функция инициализации базы данных
    from app import models  # Важно импортировать модели перед вызовом create_all()
    Base.metadata.create_all(bind=engine)
