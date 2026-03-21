import uuid
from sqlalchemy import Column, String, ForeignKey, ARRAY, Enum as SAEnum, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class LeadSource(str, enum.Enum):
    instagram = "instagram"
    whatsapp = "whatsapp"
    link_bio = "link_bio"
    manual = "manual"


class Lead(Base):
    __tablename__ = "leads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    email = Column(String, nullable=True)
    source = Column(SAEnum(LeadSource), default=LeadSource.manual)
    tags = Column(ARRAY(String), default=list)
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("appointments.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    appointment = relationship("Appointment", foreign_keys=[appointment_id])
    ai_conversations = relationship("AIConversation", back_populates="lead")
