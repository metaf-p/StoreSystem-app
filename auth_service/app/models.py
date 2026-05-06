import uuid
from sqlalchemy import Column, String, Boolean, DateTime
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True,
                default=uuid.uuid4, unique=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="customer", nullable=False, index=True)
    is_superadmin = Column(Boolean, default=False)  # Legacy migration source.


class Token(Base):
    __tablename__ = "tokens"

    refresh_token = Column(String, primary_key=True)
    user_id = Column(String, index=True, nullable=False)
    access_token = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)  # Время истечения access token
    refresh_expires_at = Column(DateTime, nullable=False)  # Время истечения refresh token
