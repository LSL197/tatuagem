from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from pydantic import BaseModel
from app.database import get_db
from app.models.automation import Automation, TriggerType
from app.models.user import User, UserRole
from app.middleware.rbac import require_role
from app.config import settings

router = APIRouter(prefix="/api/v1", tags=["automations"])


class AutomationCreate(BaseModel):
    name: str
    trigger_type: TriggerType
    trigger_config: dict = {}
    flow_json: dict = {}
    active: bool = True


class AutomationOut(BaseModel):
    id: UUID
    name: str
    trigger_type: TriggerType
    trigger_config: dict
    flow_json: dict
    active: bool

    class Config:
        from_attributes = True


@router.get("/automations/", response_model=List[AutomationOut])
def list_automations(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    return db.query(Automation).all()


@router.post("/automations/", response_model=AutomationOut, status_code=201)
def create_automation(
    data: AutomationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    automation = Automation(**data.model_dump())
    db.add(automation)
    db.commit()
    db.refresh(automation)
    return automation


@router.put("/automations/{automation_id}", response_model=AutomationOut)
def update_automation(
    automation_id: UUID,
    data: AutomationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    automation = db.query(Automation).filter(Automation.id == automation_id).first()
    if not automation:
        raise HTTPException(status_code=404, detail="Automação não encontrada")
    for field, value in data.model_dump().items():
        setattr(automation, field, value)
    db.commit()
    db.refresh(automation)
    return automation


@router.delete("/automations/{automation_id}", status_code=204)
def delete_automation(
    automation_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    automation = db.query(Automation).filter(Automation.id == automation_id).first()
    if not automation:
        raise HTTPException(status_code=404, detail="Automação não encontrada")
    db.delete(automation)
    db.commit()


@router.post("/automations/{automation_id}/toggle")
def toggle_automation(
    automation_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    automation = db.query(Automation).filter(Automation.id == automation_id).first()
    if not automation:
        raise HTTPException(status_code=404, detail="Automação não encontrada")
    automation.active = not automation.active
    db.commit()
    return {"active": automation.active}


@router.get("/webhooks/whatsapp")
def verify_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
):
    if hub_mode == "subscribe" and hub_verify_token == settings.meta_verify_token:
        return int(hub_challenge)
    raise HTTPException(status_code=403, detail="Verificação falhou")


@router.post("/webhooks/whatsapp")
async def receive_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.json()
    try:
        entry = payload["entry"][0]
        changes = entry["changes"][0]["value"]
        messages = changes.get("messages", [])
        for message in messages:
            if message.get("type") != "text":
                continue
            text = message["text"]["body"].lower().strip()
            phone = message["from"]

            active_automations = db.query(Automation).filter(
                Automation.active == True,
                Automation.trigger_type == TriggerType.keyword_whatsapp,
            ).all()

            for automation in active_automations:
                keyword = automation.trigger_config.get("keyword", "").lower()
                if keyword and keyword in text:
                    from app.workers.celery_app import celery_app
                    celery_app.send_task(
                        "app.workers.flow_engine.run_flow",
                        args=[str(automation.id), {"phone": phone, "message": text}],
                    )
    except (KeyError, IndexError):
        pass
    return {"status": "ok"}
