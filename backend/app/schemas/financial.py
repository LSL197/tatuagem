from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import date, datetime
from app.models.financial import RecordType


class FinancialRecordCreate(BaseModel):
    appointment_id: Optional[UUID] = None
    artist_id: Optional[UUID] = None
    type: RecordType
    amount: float
    description: Optional[str] = None
    date: date


class FinancialRecordOut(BaseModel):
    id: UUID
    appointment_id: Optional[UUID]
    artist_id: Optional[UUID]
    type: RecordType
    amount: float
    description: Optional[str]
    date: date
    created_at: datetime

    class Config:
        from_attributes = True


class ArtistFinancialSummary(BaseModel):
    artist_id: str
    name: str
    sessions: int
    revenue: float
    commission: float


class FinancialReport(BaseModel):
    revenue: float
    commissions: float
    expenses: float
    profit: float
    by_artist: List[ArtistFinancialSummary]
