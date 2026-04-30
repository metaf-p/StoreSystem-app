import uuid
from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Chat(Base):  # Таблица чатов
    __tablename__ = "chats"

    id = Column(UUID(as_uuid=True), primary_key=True,
                default=uuid.uuid4, index=True)
    name = Column(String, nullable=True)  # Для групповых чатов
    is_group = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    participants = relationship(
        "ChatParticipant", back_populates="chat", cascade="all, delete")
    messages = relationship(
        "Message", back_populates="chat", cascade="all, delete")


class ChatParticipant(Base):  # Таблица участников чатов
    __tablename__ = "chat_participants"

    id = Column(UUID(as_uuid=True), primary_key=True,
                default=uuid.uuid4, index=True)
    chat_id = Column(UUID(as_uuid=True), ForeignKey(
        "chats.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    joined_at = Column(DateTime, default=datetime.utcnow)

    chat = relationship("Chat", back_populates="participants")


class Message(Base):  # Таблица сообщений
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True,
                default=uuid.uuid4, index=True)
    chat_id = Column(UUID(as_uuid=True), ForeignKey(
        "chats.id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    chat = relationship("Chat", back_populates="messages")
