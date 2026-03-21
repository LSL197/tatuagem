from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta, time
import calendar
from app.database import get_db
from app.models.appointment import Appointment, AppointmentStatus, Availability
from app.models.user import User, UserRole
from app.models.lead import Lead, LeadSource
from app.models.financial import FinancialRecord, RecordType
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate, AppointmentOut, AvailabilityCreate, AvailabilityOut
from app.middleware.rbac import get_current_user, require_role
from app.services.whatsapp import send_message

router = APIRouter(prefix="/api/v1", tags=["appointments"])


@router.get("/appointments/", response_model=List[AppointmentOut])
def list_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role in [UserRole.admin, UserRole.receptionist]:
        return db.query(Appointment).order_by(Appointment.datetime.desc()).all()
    return db.query(Appointment).filter(Appointment.artist_id == current_user.id).order_by(Appointment.datetime.desc()).all()


@router.post("/appointments/", response_model=AppointmentOut, status_code=201)
async def create_appointment(data: AppointmentCreate, db: Session = Depends(get_db)):
    appointment = Appointment(**data.model_dump())
    db.add(appointment)
    db.flush()

    lead = Lead(
        name=data.client_name,
        phone=data.client_phone,
        source=LeadSource.link_bio,
        appointment_id=appointment.id,
    )
    db.add(lead)
    db.commit()
    db.refresh(appointment)

    confirmation = (
        f"Olá {data.client_name}! Seu agendamento foi recebido para "
        f"{appointment.datetime.strftime('%d/%m/%Y às %H:%M')}. "
        f"Entraremos em contato para confirmar. Obrigado!"
    )
    await send_message(data.client_phone, confirmation)

    return appointment


@router.get("/appointments/availability/{artist_id}")
def get_availability(
    artist_id: UUID,
    date: str = Query(..., description="YYYY-MM"),
    db: Session = Depends(get_db),
):
    try:
        year, month = map(int, date.split("-"))
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de data inválido. Use YYYY-MM")

    availabilities = db.query(Availability).filter(Availability.artist_id == artist_id).all()
    if not availabilities:
        return {"slots": []}

    avail_map = {a.day_of_week: a for a in availabilities}
    _, days_in_month = calendar.monthrange(year, month)

    booked = db.query(Appointment).filter(
        Appointment.artist_id == artist_id,
        Appointment.status.in_([AppointmentStatus.pending, AppointmentStatus.confirmed]),
    ).all()
    booked_datetimes = {a.datetime.replace(tzinfo=None) for a in booked}

    slots = []
    for day in range(1, days_in_month + 1):
        dt = datetime(year, month, day)
        dow = dt.weekday()
        if dow not in avail_map:
            continue
        avail = avail_map[dow]
        current = datetime.combine(dt.date(), avail.start_time)
        end = datetime.combine(dt.date(), avail.end_time)
        while current < end:
            if current not in booked_datetimes:
                slots.append(current.isoformat())
            current += timedelta(minutes=avail.slot_duration_minutes)

    return {"slots": slots}


@router.get("/appointments/{appointment_id}", response_model=AppointmentOut)
def get_appointment(
    appointment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")
    return appointment


@router.put("/appointments/{appointment_id}", response_model=AppointmentOut)
def update_appointment(
    appointment_id: UUID,
    data: AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(appointment, field, value)

    if data.status == AppointmentStatus.completed and appointment.price:
        artist = db.query(User).filter(User.id == appointment.artist_id).first()
        income = FinancialRecord(
            appointment_id=appointment.id,
            artist_id=appointment.artist_id,
            type=RecordType.income,
            amount=appointment.price,
            description=f"Sessão: {appointment.service}",
            date=appointment.datetime.date(),
        )
        db.add(income)
        if artist:
            commission_amount = appointment.price * artist.commission_pct
            commission = FinancialRecord(
                appointment_id=appointment.id,
                artist_id=appointment.artist_id,
                type=RecordType.commission,
                amount=commission_amount,
                description=f"Comissão: {appointment.service}",
                date=appointment.datetime.date(),
            )
            db.add(commission)

    db.commit()
    db.refresh(appointment)
    return appointment


@router.delete("/appointments/{appointment_id}", status_code=204)
def cancel_appointment(
    appointment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")
    appointment.status = AppointmentStatus.cancelled
    db.commit()


@router.put("/artists/{artist_id}/availability", response_model=List[AvailabilityOut])
def set_availability(
    artist_id: UUID,
    slots: List[AvailabilityCreate],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.admin and current_user.id != artist_id:
        raise HTTPException(status_code=403, detail="Acesso negado")
    db.query(Availability).filter(Availability.artist_id == artist_id).delete()
    for slot in slots:
        start = time.fromisoformat(slot.start_time)
        end = time.fromisoformat(slot.end_time)
        av = Availability(
            artist_id=artist_id,
            day_of_week=slot.day_of_week,
            start_time=start,
            end_time=end,
            slot_duration_minutes=slot.slot_duration_minutes,
        )
        db.add(av)
    db.commit()
    return db.query(Availability).filter(Availability.artist_id == artist_id).all()
