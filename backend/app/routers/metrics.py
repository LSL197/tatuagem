from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, timedelta
from typing import List
from app.database import get_db
from app.models.lead import Lead
from app.models.appointment import Appointment, AppointmentStatus
from app.models.financial import FinancialRecord, RecordType
from app.models.automation import FlowExecution
from app.models.user import User, UserRole
from app.schemas.metrics import KPIMetrics, TimeSeriesPoint, RevenuePoint, SourceCount, HeatmapCell, ArtistRanking
from app.middleware.rbac import require_role

router = APIRouter(prefix="/api/v1/metrics", tags=["metrics"])


def get_date_range(period: str):
    now = datetime.utcnow()
    if period == "today":
        start = now.replace(hour=0, minute=0, second=0)
    elif period == "week":
        start = now - timedelta(days=7)
    elif period == "month":
        start = now - timedelta(days=30)
    elif period == "quarter":
        start = now - timedelta(days=90)
    else:
        start = now - timedelta(days=30)
    return start, now


@router.get("/kpis", response_model=KPIMetrics)
def get_kpis(
    period: str = "month",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    start, end = get_date_range(period)
    leads = db.query(Lead).filter(Lead.created_at >= start).count()
    appointments = db.query(Appointment).filter(
        Appointment.created_at >= start,
        Appointment.status == AppointmentStatus.confirmed,
    ).count()
    avg_result = db.query(func.avg(Appointment.price)).filter(
        Appointment.created_at >= start,
        Appointment.status == AppointmentStatus.completed,
        Appointment.price.isnot(None),
    ).scalar()
    flows = db.query(FlowExecution).filter(FlowExecution.started_at >= start).count()
    return KPIMetrics(
        leads=leads,
        appointments=appointments,
        avg_ticket=round(avg_result or 0, 2),
        flows_triggered=flows,
    )


@router.get("/leads-over-time", response_model=List[TimeSeriesPoint])
def leads_over_time(
    period: str = "month",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    start, end = get_date_range(period)
    leads = db.query(Lead).filter(Lead.created_at >= start).all()
    result = []
    for lead in leads:
        result.append(TimeSeriesPoint(
            date=lead.created_at.date().isoformat(),
            value=1,
            channel=lead.source.value,
        ))
    return result


@router.get("/revenue", response_model=List[RevenuePoint])
def revenue_over_time(
    period: str = "month",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    start, end = get_date_range(period)
    records = db.query(FinancialRecord).filter(FinancialRecord.date >= start.date()).all()
    by_week = {}
    for r in records:
        week = r.date.strftime("%Y-W%U")
        if week not in by_week:
            by_week[week] = {"revenue": 0, "expenses": 0, "commissions": 0}
        if r.type == RecordType.income:
            by_week[week]["revenue"] += r.amount
        elif r.type == RecordType.expense:
            by_week[week]["expenses"] += r.amount
        elif r.type == RecordType.commission:
            by_week[week]["commissions"] += r.amount
    return [
        RevenuePoint(
            period=week,
            revenue=v["revenue"],
            profit=v["revenue"] - v["expenses"] - v["commissions"],
        )
        for week, v in sorted(by_week.items())
    ]


@router.get("/leads-by-source", response_model=List[SourceCount])
def leads_by_source(
    period: str = "month",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    start, _ = get_date_range(period)
    results = db.query(Lead.source, func.count(Lead.id)).filter(
        Lead.created_at >= start
    ).group_by(Lead.source).all()
    return [SourceCount(source=r[0].value, count=r[1]) for r in results]


@router.get("/booking-heatmap", response_model=List[HeatmapCell])
def booking_heatmap(
    period: str = "month",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    start, _ = get_date_range(period)
    appointments = db.query(Appointment).filter(Appointment.created_at >= start).all()
    counts = {}
    for a in appointments:
        key = (a.datetime.weekday(), a.datetime.hour)
        counts[key] = counts.get(key, 0) + 1
    return [HeatmapCell(day=k[0], hour=k[1], count=v) for k, v in counts.items()]


@router.get("/top-artists", response_model=List[ArtistRanking])
def top_artists(
    period: str = "month",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    start, _ = get_date_range(period)
    artists = db.query(User).filter(User.role == UserRole.artist).all()
    ranking = []
    for artist in artists:
        records = db.query(FinancialRecord).filter(
            FinancialRecord.artist_id == artist.id,
            FinancialRecord.type == RecordType.income,
            FinancialRecord.date >= start.date(),
        ).all()
        if not records:
            continue
        revenue = sum(r.amount for r in records)
        sessions = len(records)
        ranking.append(ArtistRanking(
            artist_id=str(artist.id),
            name=artist.name,
            revenue=revenue,
            sessions=sessions,
            avg_ticket=round(revenue / sessions, 2),
        ))
    return sorted(ranking, key=lambda x: x.revenue, reverse=True)
