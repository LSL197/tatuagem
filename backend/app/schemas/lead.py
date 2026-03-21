from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from app.models.lead import LeadSource


class LeadCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    source: LeadSource = LeadSource.manual
    tags: List[str] = []
    appointment_id: Optional[UUID] = None


class LeadUpdate(BaseModel):
    tags: Optional[List[str]] = None
    email: Optional[str] = None


class LeadOut(BaseModel):
    id: UUID
    name: str
    phone: str
    email: Optional[str]
    source: LeadSource
    tags: List[str]
    appointment_id: Optional[UUID]
    created_at: datetime

    class Config:
        from_attributes = True
