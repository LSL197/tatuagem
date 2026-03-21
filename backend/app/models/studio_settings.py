import uuid
from sqlalchemy import Column, String, JSON, DateTime, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import enum
from app.database import Base


class AIProviderType(str, enum.Enum):
    anthropic = "anthropic"
    openai = "openai"
    groq = "groq"


class StudioSettings(Base):
    __tablename__ = "studio_settings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, default="Estúdio de Tatuagem")
    logo_url = Column(String, nullable=True)
    theme = Column(JSON, default=dict)
    ai_provider = Column(SAEnum(AIProviderType), default=AIProviderType.anthropic)
    ai_api_key = Column(String, nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
