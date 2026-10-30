from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from datetime import datetime

if __package__:
    from .database import Base
else:
    from database import Base


class UserModel(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class AuthSessionModel(Base):
    __tablename__ = "auth_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    token_hash = Column(String, unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)


class ShipmentModel(Base):
    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True, index=True)
    tracking_number = Column(String, unique=True, index=True)
    recipient_name = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    weight = Column(Float, nullable=False)
    status = Column(String, default="Pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)