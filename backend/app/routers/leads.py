from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from app.database import get_db
from app.models.lead import Lead, LeadSource
from app.models.user import User, UserRole
from app.schemas.lead import LeadCreate, LeadOut, LeadUpdate
from app.middleware.rbac import require_role

router = APIRouter(prefix="/api/v1/leads", tags=["leads"])


@router.get("/", response_model=List[LeadOut])
def list_leads(
    source: Optional[LeadSource] = None,
    tag: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    q = db.query(Lead)
    if source:
        q = q.filter(Lead.source == source)
    if tag:
        q = q.filter(Lead.tags.contains([tag]))
    return q.order_by(Lead.created_at.desc()).all()


@router.post("/", response_model=LeadOut, status_code=201)
def create_lead(data: LeadCreate, db: Session = Depends(get_db)):
    lead = Lead(**data.model_dump())
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


@router.get("/{lead_id}", response_model=LeadOut)
def get_lead(
    lead_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead não encontrado")
    return lead


@router.put("/{lead_id}", response_model=LeadOut)
def update_lead(
    lead_id: UUID,
    data: LeadUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead não encontrado")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(lead, field, value)
    db.commit()
    db.refresh(lead)
    return lead
