import uuid
from sqlalchemy import Column, String, Boolean, Float, JSON, ARRAY, Text, DateTime, ForeignKey, Integer, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class UserRole(str, enum.Enum):
    admin = "admin"
    artist = "artist"
    receptionist = "receptionist"
    client = "client"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(SAEnum(UserRole), nullable=False, default=UserRole.client)
    slug = Column(String, unique=True, nullable=True, index=True)
    commission_pct = Column(Float, default=0.5)
    theme_json = Column(JSON, default=dict)
    bio = Column(Text, nullable=True)
    styles = Column(ARRAY(String), default=list)
    avatar_url = Column(String, nullable=True)
    banner_url = Column(String, nullable=True)
    social_links = Column(JSON, default=dict)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    portfolio_items = relationship("PortfolioItem", back_populates="artist", cascade="all, delete-orphan")


class PortfolioItem(Base):
    __tablename__ = "portfolio_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    image_url = Column(String, nullable=False)
    public_id = Column(String, nullable=True)
    category = Column(String, nullable=True)
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    artist = relationship("User", back_populates="portfolio_items")
