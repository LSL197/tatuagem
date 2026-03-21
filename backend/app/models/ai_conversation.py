import uuid
from sqlalchemy import Column, String, Boolean, JSON, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class ConversationChannel(str, enum.Enum):
    instagram = "instagram"
    whatsapp = "whatsapp"
    web = "web"


class ConversationStatus(str, enum.Enum):
    active = "active"
    completed = "completed"
    abandoned = "abandoned"


class AIConversation(Base):
    __tablename__ = "ai_conversations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id", ondelete="SET NULL"), nullable=True)
    channel = Column(SAEnum(ConversationChannel), default=ConversationChannel.web)
    messages = Column(JSON, default=list)
    brief = Column(JSON, nullable=True)
    status = Column(SAEnum(ConversationStatus), default=ConversationStatus.active)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    lead = relationship("Lead", back_populates="ai_conversations")
    appointment_briefs = relationship("AppointmentBrief", back_populates="ai_conversation")


class AppointmentBrief(Base):
    __tablename__ = "appointment_briefs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("appointments.id", ondelete="CASCADE"), nullable=False)
    ai_conversation_id = Column(UUID(as_uuid=True), ForeignKey("ai_conversations.id", ondelete="SET NULL"), nullable=True)
    brief = Column(JSON, nullable=False)
    viewed_by_artist = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    ai_conversation = relationship("AIConversation", back_populates="appointment_briefs")
