from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models.ai_conversation import AIConversation, ConversationChannel, ConversationStatus
from app.models.lead import Lead, LeadSource
from app.services.sdr import get_or_create_conversation, get_sdr_response, apply_intent
import logging

router = APIRouter(prefix="/api/v1", tags=["chat"])
logger = logging.getLogger(__name__)


class ChatRequest(BaseModel):
    session_id: str   # UUID gerado pelo frontend, salvo no localStorage
    message: str


class ChatResponse(BaseModel):
    response: str
    intent: str


def get_or_create_web_lead(session_id: str, db: Session) -> Lead:
    """
    Para o canal web, usa o session_id como identificador.
    Cria um lead com source=link_bio se não existir.
    """
    lead = db.query(Lead).filter(Lead.phone == session_id).first()
    if not lead:
        lead = Lead(
            name=session_id,
            phone=session_id,
            source=LeadSource.link_bio,
            tags=[],
        )
        db.add(lead)
        db.flush()
    return lead


@router.post("/chat", response_model=ChatResponse)
async def web_chat(body: ChatRequest, db: Session = Depends(get_db)):
    """
    Endpoint de chat web — mesmo agente SDR do WhatsApp, canal web.
    Recebe mensagem do visitante e retorna a resposta da Ink diretamente.
    Não exige autenticação (público).
    """
    if not body.message.strip():
        return ChatResponse(response="", intent="INFORMACAO")

    try:
        lead = get_or_create_web_lead(body.session_id, db)

        # Busca/cria conversa no canal web
        conversation = db.query(AIConversation).filter(
            AIConversation.lead_id == lead.id,
            AIConversation.channel == ConversationChannel.web,
            AIConversation.status == ConversationStatus.active,
        ).order_by(AIConversation.created_at.desc()).first()

        if not conversation:
            conversation = AIConversation(
                lead_id=lead.id,
                phone=body.session_id,
                channel=ConversationChannel.web,
                messages=[],
                status=ConversationStatus.active,
                awaiting_handoff=False,
            )
            db.add(conversation)
            db.flush()

        # Append mensagem do usuário
        messages_history = list(conversation.messages or [])
        messages_history.append({"role": "user", "content": body.message.strip()})
        conversation.messages = messages_history
        db.add(conversation)
        db.add(lead)
        db.commit()

        # Chama o SDR
        intent, clean_response = await get_sdr_response(conversation, db)

        # Append resposta da IA
        messages_history.append({"role": "assistant", "content": clean_response})
        conversation.messages = messages_history
        apply_intent(intent, lead, conversation, db)
        db.add(conversation)
        db.add(lead)
        db.commit()

        return ChatResponse(response=clean_response, intent=intent)

    except Exception as e:
        logger.error(f"Erro no chat web: {e}", exc_info=True)
        return ChatResponse(
            response="Oi! Tivemos um probleminha aqui. Pode tentar novamente? 🖤",
            intent="INFORMACAO",
        )
