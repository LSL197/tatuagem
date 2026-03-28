import re
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from app.models.ai_conversation import AIConversation, ConversationChannel, ConversationStatus
from app.models.lead import Lead, LeadSource
from app.models.studio_settings import StudioSettings
from app.services.ai_provider import get_ai_provider
from app.services.prompts import SDR_PROMPT


# Regex para capturar a tag de intent no final da resposta da IA
INTENT_PATTERN = re.compile(r"\[(INFORMACAO|QUALIFICADO|AGENDAMENTO|HUMANO)\]", re.IGNORECASE)

# Quantas mensagens do histórico enviar ao LLM (últimos N pares user/assistant)
# Mantém contexto sem explodir o context window
MAX_HISTORY_MESSAGES = 20


def get_or_create_lead(phone: str, db: Session) -> Lead:
    """
    Busca lead pelo telefone. Se não existir, cria com source=whatsapp.
    O name é preenchido como o próprio phone temporariamente — será atualizado
    quando a IA coletar o nome do cliente durante a conversa.
    """
    lead = db.query(Lead).filter(Lead.phone == phone).first()
    if not lead:
        lead = Lead(
            name=phone,  # placeholder até a IA coletar o nome real
            phone=phone,
            source=LeadSource.whatsapp,
            tags=[],
        )
        db.add(lead)
        db.flush()  # garante que lead.id existe antes de criar a conversa
    return lead


def get_or_create_conversation(lead: Lead, phone: str, db: Session) -> AIConversation:
    """
    Busca conversa ativa para este lead no canal WhatsApp.
    Se não existir ou a última estiver completed/abandoned, cria uma nova.
    Conversas com awaiting_handoff=True são retornadas normalmente —
    a IA continuará respondendo mesmo em modo handoff (o humano pode assumir
    lendo o Chatwoot, mas a IA não para).
    """
    conversation = db.query(AIConversation).filter(
        AIConversation.lead_id == lead.id,
        AIConversation.channel == ConversationChannel.whatsapp,
        AIConversation.status == ConversationStatus.active,
    ).order_by(AIConversation.created_at.desc()).first()

    if not conversation:
        conversation = AIConversation(
            lead_id=lead.id,
            phone=phone,
            channel=ConversationChannel.whatsapp,
            messages=[],
            status=ConversationStatus.active,
            awaiting_handoff=False,
        )
        db.add(conversation)
        db.flush()

    return conversation


def extract_intent(response_text: str) -> Tuple[str, str]:
    """
    Extrai a tag de intent da resposta da IA.
    Retorna (intent, clean_response) onde clean_response é o texto
    sem a tag e sem linhas em branco extras no final.
    """
    match = INTENT_PATTERN.search(response_text)
    intent = match.group(1).upper() if match else "INFORMACAO"
    # Remove a tag e limpa espaços em branco ao redor
    clean = INTENT_PATTERN.sub("", response_text).strip()
    return intent, clean


def apply_intent(intent: str, lead: Lead, conversation: AIConversation, db: Session) -> None:
    """
    Aplica efeitos colaterais baseados na intenção detectada.
    Modifica lead e conversation in-place (o caller faz o commit).
    """
    if intent == "QUALIFICADO":
        tags = list(lead.tags or [])
        if "qualificado" not in tags:
            tags.append("qualificado")
            lead.tags = tags

    elif intent == "AGENDAMENTO":
        tags = list(lead.tags or [])
        if "qualificado" not in tags:
            tags.append("qualificado")
        if "interesse_agendamento" not in tags:
            tags.append("interesse_agendamento")
        lead.tags = tags

    elif intent == "HUMANO":
        conversation.awaiting_handoff = True
        tags = list(lead.tags or [])
        if "aguardando_humano" not in tags:
            tags.append("aguardando_humano")
        lead.tags = tags


def get_ai_provider_from_settings(db: Session):
    """
    Lê o provedor de IA configurado nas StudioSettings.
    Fallback para Anthropic com a chave do ambiente se não houver config no banco.
    """
    from app.config import settings as app_settings
    studio = db.query(StudioSettings).first()
    if studio and studio.ai_api_key:
        return get_ai_provider(studio.ai_provider.value, studio.ai_api_key)
    # Fallback: usa a primeira chave disponível no .env
    if app_settings.groq_api_key:
        return get_ai_provider("groq", app_settings.groq_api_key)
    if app_settings.openai_api_key:
        return get_ai_provider("openai", app_settings.openai_api_key)
    return get_ai_provider("anthropic", app_settings.anthropic_api_key)


async def get_sdr_response(
    conversation: AIConversation,
    db: Session,
) -> Tuple[str, str]:
    """
    Ponto de entrada principal do SDR.
    Recebe a conversa (já com a nova mensagem do usuário appendada),
    chama o LLM e retorna (intent, clean_response).

    O histórico enviado ao LLM são os últimos MAX_HISTORY_MESSAGES itens
    de conversation.messages, que já estão no formato {role, content}.
    """
    messages = list(conversation.messages or [])
    # Envia apenas as últimas N mensagens para não explodir o context window
    history = messages[-MAX_HISTORY_MESSAGES:]

    provider = get_ai_provider_from_settings(db)
    raw_response = await provider.chat(history, SDR_PROMPT)

    intent, clean_response = extract_intent(raw_response)
    return intent, clean_response
