import uuid
from sqlalchemy import Column, String, Boolean, JSON, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class TriggerType(str, enum.Enum):
    keyword_instagram = "keyword_instagram"
    keyword_whatsapp = "keyword_whatsapp"


class ExecutionStatus(str, enum.Enum):
    running = "running"
    completed = "completed"
    failed = "failed"


class Automation(Base):
    __tablename__ = "automations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    trigger_type = Column(SAEnum(TriggerType), nullable=False)
    trigger_config = Column(JSON, default=dict)
    flow_json = Column(JSON, default=dict)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    executions = relationship("FlowExecution", back_populates="automation")


class FlowExecution(Base):
    __tablename__ = "flow_executions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    automation_id = Column(UUID(as_uuid=True), ForeignKey("automations.id", ondelete="CASCADE"), nullable=False)
    triggered_by = Column(String, nullable=True)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(SAEnum(ExecutionStatus), default=ExecutionStatus.running)
    logs = Column(JSON, default=list)

    automation = relationship("Automation", back_populates="executions")
