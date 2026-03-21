from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.models.appointment import AppointmentStatus


class AppointmentCreate(BaseModel):
    artist_id: UUID
    client_name: str
    client_phone: str
    service: str
    datetime: datetime
    duration_minutes: int = 60
    notes: Optional[str] = None


class AppointmentUpdate(BaseModel):
    status: Optional[AppointmentStatus] = None
    notes: Optional[str] = None
    price: Optional[float] = None
    datetime: Optional[datetime] = None
    service: Optional[str] = None


class AppointmentOut(BaseModel):
    id: UUID
    artist_id: Optional[UUID]
    client_name: str
    client_phone: str
    service: str
    datetime: datetime
    duration_minutes: int
    status: AppointmentStatus
    notes: Optional[str]
    price: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True


class AvailabilityCreate(BaseModel):
    day_of_week: int
    start_time: str
    end_time: str
    slot_duration_minutes: int = 60


class AvailabilityOut(BaseModel):
    id: UUID
    artist_id: UUID
    day_of_week: int
    start_time: str
    end_time: str
    slot_duration_minutes: int

    class Config:
        from_attributes = True
