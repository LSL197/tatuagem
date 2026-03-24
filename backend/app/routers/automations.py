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
from app.services.sdr import get_or_create_lead, get_or_create_conversation, get_sdr_response, apply_intent
from app.services.whatsapp import send_message
from app.services.whisper import transcribe_whatsapp_audio

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
    """
    Endpoint de entrada para todas as mensagens WhatsApp via Meta Cloud API.

    Fluxo:
    1. Parse do payload Meta
    2. Filtragem por tipo (aceita text e audio, ignora o resto)
    3. Transcrição de áudio se necessário
    4. Busca/criação de Lead e AIConversation
    5. Append da mensagem ao histórico
    6. Chamada ao SDR service
    7. Aplicação do intent detectado
    8. Persistência e envio da resposta

    Retorna 200 OK sempre (Meta exige isso — erros são logados, não propagados)
    """
    try:
        payload = await request.json()
    except Exception:
        return {"status": "ok"}

    try:
        entry = payload.get("entry", [{}])[0]
        changes = entry.get("changes", [{}])[0].get("value", {})
        messages = changes.get("messages", [])

        for message in messages:
            message_type = message.get("type", "")
            phone = message.get("from", "")

            if not phone:
                continue

            # --- Extração do texto da mensagem ---
            text_body: str = ""

            if message_type == "text":
                text_body = message.get("text", {}).get("body", "").strip()

            elif message_type == "audio":
                # Áudio: transcreve via Whisper antes de processar
                media_id = message.get("audio", {}).get("id", "")
                if media_id and settings.whatsapp_token:
                    text_body = await transcribe_whatsapp_audio(media_id, settings.whatsapp_token)
                if not text_body:
                    # Transcrição falhou ou sem conteúdo — ignora silenciosamente
                    continue

            else:
                # Stickers, documentos, localização, etc — ignora
                continue

            if not text_body:
                continue

            # --- Lead e conversa ---
            lead = get_or_create_lead(phone, db)
            conversation = get_or_create_conversation(lead, phone, db)

            # Append da mensagem do usuário ao histórico
            messages_history = list(conversation.messages or [])
            messages_history.append({"role": "user", "content": text_body})
            conversation.messages = messages_history

            # Persiste lead e mensagem do usuário antes de chamar a IA
            # (garante que o contato fica salvo mesmo se a IA falhar)
            db.add(conversation)
            db.add(lead)
            db.commit()

            # --- Chamada ao SDR ---
            intent, clean_response = await get_sdr_response(conversation, db)

            # Append da resposta da IA ao histórico
            messages_history.append({"role": "assistant", "content": clean_response})
            conversation.messages = messages_history

            # Aplica efeitos colaterais do intent (tags no lead, flag handoff)
            apply_intent(intent, lead, conversation, db)

            # Persiste resposta da IA e intents
            db.add(conversation)
            db.add(lead)
            db.commit()

            # Envia resposta ao cliente
            await send_message(phone, clean_response)

    except Exception as e:
        # Loga o erro mas retorna 200 para o Meta não retentar
        import logging
        logging.getLogger(__name__).error(f"Erro no webhook WhatsApp: {e}", exc_info=True)

    return {"status": "ok"}
