from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from pydantic import BaseModel
from app.database import get_db
from app.models.ai_conversation import AIConversation, AppointmentBrief, ConversationChannel, ConversationStatus
from app.models.studio_settings import StudioSettings
from app.models.user import User
from app.middleware.rbac import get_current_user
from app.services.ai_provider import get_ai_provider
from app.services.prompts import CONSULTANT_PROMPT, QUALIFICATION_PROMPT
from app.config import settings
import json
import re

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])


class ConversationCreate(BaseModel):
    lead_id: UUID = None
    channel: ConversationChannel = ConversationChannel.web
    mode: str = "consultant"


class MessageCreate(BaseModel):
    content: str


class ConversationOut(BaseModel):
    id: UUID
    channel: ConversationChannel
    messages: list
    brief: dict = None
    status: ConversationStatus

    class Config:
        from_attributes = True


def get_provider(db: Session):
    studio = db.query(StudioSettings).first()
    if studio and studio.ai_api_key:
        return get_ai_provider(studio.ai_provider.value, studio.ai_api_key)
    return get_ai_provider("anthropic", settings.anthropic_api_key)


@router.post("/conversations/", response_model=ConversationOut, status_code=201)
def start_conversation(data: ConversationCreate, db: Session = Depends(get_db)):
    conversation = AIConversation(
        lead_id=data.lead_id,
        channel=data.channel,
        messages=[],
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation


@router.post("/conversations/{conversation_id}/message", response_model=ConversationOut)
async def send_message(
    conversation_id: UUID,
    message: MessageCreate,
    db: Session = Depends(get_db),
):
    conversation = db.query(AIConversation).filter(AIConversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversa não encontrada")
    if conversation.status != ConversationStatus.active:
        raise HTTPException(status_code=400, detail="Conversa encerrada")

    messages = list(conversation.messages or [])
    messages.append({"role": "user", "content": message.content})

    provider = get_provider(db)
    response_text = await provider.chat(messages, CONSULTANT_PROMPT)

    messages.append({"role": "assistant", "content": response_text})
    conversation.messages = messages

    brief_match = re.search(r"<brief>(.*?)</brief>", response_text, re.DOTALL)
    if brief_match:
        try:
            brief_json = json.loads(brief_match.group(1).strip())
            conversation.brief = brief_json
            conversation.status = ConversationStatus.completed
        except json.JSONDecodeError:
            pass

    db.commit()
    db.refresh(conversation)
    return conversation


@router.get("/conversations/{conversation_id}", response_model=ConversationOut)
def get_conversation(conversation_id: UUID, db: Session = Depends(get_db)):
    conversation = db.query(AIConversation).filter(AIConversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversa não encontrada")
    return conversation


@router.post("/conversations/{conversation_id}/generate-brief", response_model=ConversationOut)
async def generate_brief(conversation_id: UUID, db: Session = Depends(get_db)):
    conversation = db.query(AIConversation).filter(AIConversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversa não encontrada")

    messages = list(conversation.messages or [])
    messages.append({"role": "user", "content": "Por favor, gere o brief final da tatuagem com base na nossa conversa."})

    provider = get_provider(db)
    response_text = await provider.chat(messages, CONSULTANT_PROMPT)
    messages.append({"role": "assistant", "content": response_text})

    brief_match = re.search(r"<brief>(.*?)</brief>", response_text, re.DOTALL)
    if brief_match:
        try:
            conversation.brief = json.loads(brief_match.group(1).strip())
            conversation.status = ConversationStatus.completed
        except json.JSONDecodeError:
            pass

    conversation.messages = messages
    db.commit()
    db.refresh(conversation)
    return conversation
