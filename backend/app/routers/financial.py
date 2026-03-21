from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import List, Optional
from uuid import UUID
from datetime import date
from app.database import get_db
from app.models.financial import FinancialRecord, RecordType
from app.models.appointment import Appointment, AppointmentStatus
from app.models.user import User, UserRole
from app.schemas.financial import FinancialRecordCreate, FinancialRecordOut, FinancialReport, ArtistFinancialSummary
from app.middleware.rbac import require_role

router = APIRouter(prefix="/api/v1/financial", tags=["financial"])


@router.get("/", response_model=List[FinancialRecordOut])
def list_records(
    type: Optional[RecordType] = None,
    artist_id: Optional[UUID] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    q = db.query(FinancialRecord)
    if type:
        q = q.filter(FinancialRecord.type == type)
    if artist_id:
        q = q.filter(FinancialRecord.artist_id == artist_id)
    if start_date:
        q = q.filter(FinancialRecord.date >= start_date)
    if end_date:
        q = q.filter(FinancialRecord.date <= end_date)
    return q.order_by(FinancialRecord.date.desc()).all()


@router.post("/", response_model=FinancialRecordOut, status_code=201)
def create_record(
    data: FinancialRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    record = FinancialRecord(**data.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.put("/{record_id}", response_model=FinancialRecordOut)
def update_record(
    record_id: UUID,
    data: FinancialRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    record = db.query(FinancialRecord).filter(FinancialRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Registro não encontrado")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(record, field, value)
    db.commit()
    db.refresh(record)
    return record


@router.get("/report", response_model=FinancialReport)
def get_report(
    period: str = Query("month"),
    date_str: str = Query(None, alias="date"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    q = db.query(FinancialRecord)

    if date_str:
        try:
            year, month = map(int, date_str.split("-"))
            q = q.filter(
                extract("year", FinancialRecord.date) == year,
                extract("month", FinancialRecord.date) == month,
            )
        except ValueError:
            pass

    records = q.all()
    revenue = sum(r.amount for r in records if r.type == RecordType.income)
    commissions = sum(r.amount for r in records if r.type == RecordType.commission)
    expenses = sum(r.amount for r in records if r.type == RecordType.expense)
    profit = revenue - commissions - expenses

    artists = db.query(User).filter(User.role == UserRole.artist).all()
    by_artist = []
    for artist in artists:
        artist_records = [r for r in records if str(r.artist_id) == str(artist.id)]
        artist_income = sum(r.amount for r in artist_records if r.type == RecordType.income)
        artist_commission = sum(r.amount for r in artist_records if r.type == RecordType.commission)
        sessions = len([r for r in artist_records if r.type == RecordType.income])
        if sessions > 0:
            by_artist.append(ArtistFinancialSummary(
                artist_id=str(artist.id),
                name=artist.name,
                sessions=sessions,
                revenue=artist_income,
                commission=artist_commission,
            ))

    return FinancialReport(
        revenue=revenue,
        commissions=commissions,
        expenses=expenses,
        profit=profit,
        by_artist=by_artist,
    )
