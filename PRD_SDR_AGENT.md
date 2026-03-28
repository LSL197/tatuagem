# PRD — Agente SDR Conversacional WhatsApp
## Projeto: Império Ink | Implementação sobre stack existente

**Versão:** 1.0  
**Data:** 2026-03-24  
**Status:** Pronto para implementação  
**Destinado a:** Claude Code  

---

## 0. Instruções de leitura para o Claude Code

Antes de implementar qualquer coisa:

1. Leia este documento completo
2. Execute `ls backend/app/routers/ backend/app/models/ backend/app/services/ backend/app/workers/` para confirmar o que existe
3. Leia os arquivos que serão modificados (listados em cada fase)
4. Implemente exatamente o que está descrito — sem adicionar abstrações não solicitadas, sem remover código existente que não está na lista de modificações
5. Nunca deixe `pass`, `TODO`, `...` ou funções incompletas
6. Após cada fase, confirme que o Docker Compose ainda sobe sem erros antes de prosseguir

Quando todas as fases estiverem concluídas, output: `<promise>SDR AGENT COMPLETO</promise>`

---

## 1. Contexto do projeto

### 1.1 O que já existe (não reescrever)

O projeto `tatuagem/` é uma plataforma de gestão para estúdio de tatuagem com:

- **FastAPI backend** (`backend/app/`) com routers, models, services e workers já implementados
- **PostgreSQL** com schema completo via Alembic (`backend/alembic/versions/0001_initial.py`)
- **Redis + Celery** configurados (`backend/app/workers/celery_app.py`)
- **AIProvider abstrato** (`backend/app/services/ai_provider.py`) suportando Anthropic, OpenAI e Groq
- **Webhook WhatsApp** básico já existe em `POST /api/v1/webhooks/whatsapp` dentro de `backend/app/routers/automations.py`
- **Tabela `ai_conversations`** já no banco com campos: `id`, `lead_id`, `channel`, `messages (JSON[])`, `brief (JSON)`, `status`, `created_at`
- **Tabela `leads`** com campos: `id`, `name`, `phone`, `source`, `tags`, `appointment_id`, `created_at`, `updated_at`
- **Tabela `studio_settings`** com `ai_provider` e `ai_api_key` configuráveis pelo admin
- **`send_message(phone, text)`** em `backend/app/services/whatsapp.py` via WhatsApp Cloud API (Meta)
- **`QUALIFICATION_PROMPT`** e **`CONSULTANT_PROMPT`** em `backend/app/services/prompts.py`

### 1.2 O problema a resolver

O webhook atual (`receive_webhook` em `automations.py`) é **stateless e limitado**:

```python
# COMPORTAMENTO ATUAL — problemático:
# 1. Só processa type == "text" (ignora 70%+ das msgs brasileiras que são áudio)
# 2. Só dispara se houver keyword match numa Automation cadastrada
# 3. AIAgentNode chama IA com apenas a mensagem atual, sem histórico
# 4. Não usa a tabela ai_conversations para nada
# 5. Não cria Lead automaticamente ao primeiro contato
# 6. Não detecta intent (agendamento, qualificação, handoff)
```

O resultado: leads que mandam áudio ou que não usam a keyword exata são silenciosamente ignorados.

### 1.3 O que será construído

Um **loop conversacional completo** sobre a infra existente:

```
WhatsApp → Meta Webhook → FastAPI → [memória PostgreSQL] → AIProvider → resposta WhatsApp
```

Com suporte a:
- Qualquer mensagem de texto (sem necessidade de keyword)
- Áudios transcritos via Whisper API
- Memória persistente de conversa via `ai_conversations`
- Criação automática de Lead no primeiro contato
- Detecção de intent via tags no retorno da IA
- Agendamento de lembretes via Celery Beat
- Handoff para humano via flag na conversa

---

## 2. Arquitetura da solução

### 2.1 Fluxo completo de uma mensagem

```
[Cliente envia msg no WhatsApp]
         ↓
[Meta Cloud API → POST /api/v1/webhooks/whatsapp]
         ↓
[receive_webhook — novo código]
    ├── Extrai: phone, message_type, body
    ├── IF message_type == "audio": baixa mídia → Whisper → texto
    ├── IF message_type != "text" e != "audio": ignora silenciosamente
    ├── Busca ou cria Lead pelo phone
    ├── Busca ou cria AIConversation ativa pelo lead_id
    ├── Appenda mensagem ao conversation.messages
    ├── Chama get_sdr_response(conversation, db) [nova função em services/sdr.py]
    │       ├── Monta historico dos últimos 20 pares (role/content)
    │       ├── Busca StudioSettings para pegar ai_provider e ai_api_key
    │       ├── Chama AIProvider.chat(historico, SDR_PROMPT)
    │       ├── Detecta tags no response_text
    │       │       ├── [AGENDAMENTO:<slug>] → cria task Celery notify_artist
    │       │       ├── [HUMANO] → seta conversation.awaiting_handoff = True
    │       │       └── [QUALIFICADO] → adiciona tag "qualificado" ao Lead
    │       └── Retorna response_text limpo (sem tags)
    ├── Appenda resposta ao conversation.messages
    ├── Salva conversation no banco
    └── send_message(phone, response_text)
```

### 2.2 Arquivos que serão criados (novos)

| Arquivo | Descrição |
|---|---|
| `backend/app/services/sdr.py` | Lógica central do agente SDR |
| `backend/app/services/whisper.py` | Transcrição de áudio via OpenAI Whisper |
| `backend/app/workers/reminders.py` | Tasks Celery para lembretes e reativação |
| `backend/alembic/versions/0002_sdr_fields.py` | Migration para novos campos no banco |

### 2.3 Arquivos que serão modificados (existentes)

| Arquivo | O que muda |
|---|---|
| `backend/app/routers/automations.py` | `receive_webhook` reescrito completamente |
| `backend/app/services/prompts.py` | Adiciona `SDR_PROMPT` específico para tatuagem |
| `backend/app/models/ai_conversation.py` | Adiciona campo `phone` e `awaiting_handoff` |
| `backend/app/workers/celery_app.py` | Adiciona configuração do Celery Beat |
| `backend/app/config.py` | Adiciona `openai_api_key` para Whisper e `whatsapp_api_version` |
| `backend/requirements.txt` | Nenhuma adição necessária (openai já está) |
| `backend/.env.example` (raiz) | Adiciona `OPENAI_API_KEY` se não estiver |

---

## 3. Especificação técnica por fase

---

### FASE 1 — Migration do banco de dados

**Arquivo a criar:** `backend/alembic/versions/0002_sdr_fields.py`

**Por quê:** a tabela `ai_conversations` precisa de dois campos novos para suportar o loop conversacional. A tabela `leads` precisa de índice no phone para busca rápida.

**Implementação exata:**

```python
"""sdr agent fields

Revision ID: 0002
Revises: 0001
Create Date: 2026-03-24
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Adiciona phone na ai_conversations para lookup direto sem join com leads
    op.add_column(
        "ai_conversations",
        sa.Column("phone", sa.String(), nullable=True),
    )
    # Flag para indicar que a IA pediu intervenção humana
    op.add_column(
        "ai_conversations",
        sa.Column("awaiting_handoff", sa.Boolean(), server_default="false", nullable=False),
    )
    # Adiciona updated_at para controle de inatividade (reativação)
    op.add_column(
        "ai_conversations",
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), onupdate=sa.text("now()")),
    )
    # Índice no phone da ai_conversations para lookup O(log n)
    op.create_index("ix_ai_conversations_phone", "ai_conversations", ["phone"])
    # Índice no phone dos leads (pode não existir)
    op.create_index("ix_leads_phone", "leads", ["phone"], if_not_exists=True)


def downgrade() -> None:
    op.drop_index("ix_leads_phone", table_name="leads")
    op.drop_index("ix_ai_conversations_phone", table_name="ai_conversations")
    op.drop_column("ai_conversations", "updated_at")
    op.drop_column("ai_conversations", "awaiting_handoff")
    op.drop_column("ai_conversations", "phone")
```

**Após criar o arquivo**, rodar:
```bash
cd backend && alembic upgrade head
```

---

### FASE 2 — Atualizar o model AIConversation

**Arquivo a modificar:** `backend/app/models/ai_conversation.py`

**Adicionar** os três novos campos ao model (para refletir a migration):

```python
# Adicionar dentro da classe AIConversation, após o campo 'created_at':
phone = Column(String, nullable=True, index=True)
awaiting_handoff = Column(Boolean, default=False)
updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
```

**Não remover** nenhum campo ou relacionamento existente.

---

### FASE 3 — Whisper service

**Arquivo a criar:** `backend/app/services/whisper.py`

Este serviço recebe a URL de um arquivo de áudio do WhatsApp, baixa o conteúdo binário e transcreve via OpenAI Whisper API.

**Implementação completa:**

```python
import httpx
import tempfile
import os
from app.config import settings


async def transcribe_whatsapp_audio(media_id: str, whatsapp_token: str) -> str:
    """
    Dado um media_id de uma mensagem de áudio do WhatsApp Cloud API,
    baixa o arquivo e transcreve via OpenAI Whisper.
    Retorna o texto transcrito ou string vazia em caso de falha.
    """
    # Passo 1: obter a URL de download a partir do media_id
    media_url_endpoint = f"https://graph.facebook.com/v18.0/{media_id}"
    headers = {"Authorization": f"Bearer {whatsapp_token}"}

    async with httpx.AsyncClient(timeout=30.0) as client:
        # Busca metadados da mídia (retorna url, mime_type, file_size)
        meta_response = await client.get(media_url_endpoint, headers=headers)
        if meta_response.status_code != 200:
            return ""
        media_info = meta_response.json()
        download_url = media_info.get("url", "")
        if not download_url:
            return ""

        # Passo 2: baixar o binário do áudio
        audio_response = await client.get(download_url, headers=headers)
        if audio_response.status_code != 200:
            return ""
        audio_bytes = audio_response.content

    # Passo 3: salvar temporariamente e enviar ao Whisper
    # WhatsApp envia áudio em formato ogg/opus — Whisper aceita ogg
    suffix = ".ogg"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        from openai import OpenAI
        client_oai = OpenAI(api_key=settings.openai_api_key)
        with open(tmp_path, "rb") as audio_file:
            transcript = client_oai.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                language="pt",  # força português para reduzir erros
            )
        return transcript.text.strip()
    except Exception:
        return ""
    finally:
        os.unlink(tmp_path)
```

**Dependência:** `settings.openai_api_key` já existe em `config.py`. Confirmar que `OPENAI_API_KEY` está no `.env`.

---

### FASE 4 — SDR prompt específico para tatuagem

**Arquivo a modificar:** `backend/app/services/prompts.py`

**Adicionar** o `SDR_PROMPT` ao final do arquivo. Não remover `CONSULTANT_PROMPT` nem `QUALIFICATION_PROMPT`.

```python
SDR_PROMPT = """Você é a assistente virtual do Império Ink, um estúdio de tatuagem premium em Belém do Pará.
Seu nome é Ink. Você é especialista em tatuagem, atenciosa, empolgante e usa linguagem informal mas profissional.

## Sobre o estúdio

**Império Ink** — estúdio de tatuagem em Belém, PA.
Atendimento: segunda a sábado, 10h às 20h.
Agendamento online: disponível 24h pelo link /book

## Seu objetivo como SDR

Qualificar leads e converter interesse em agendamento. Siga esta ordem:

1. Cumprimente pelo nome se souber, seja calorosa
2. Entenda o interesse (estilo, ideia, tamanho, local no corpo)
3. Apresente o tatuador mais adequado ao estilo de interesse
4. Direcione para o agendamento online

## Regras de comportamento

- Faça UMA pergunta por vez. Nunca faça múltiplas perguntas na mesma mensagem.
- Respostas curtas: máximo 3 frases. Não escreva parágrafos longos.
- Use emojis com moderação (1-2 por mensagem no máximo).
- Nunca invente informações sobre preços ou disponibilidade.
- Se perguntarem sobre preço, diga: "Os preços variam por tamanho e complexidade — a consulta inicial é gratuita! Quer agendar para o artista te dar um orçamento personalizado?"
- Nunca ignore uma mensagem. Se não souber responder, diga que vai verificar e sugira o agendamento.
- Se o cliente estiver irritado ou reclamando, use: [HUMANO] no final da sua resposta para pedir intervenção humana.

## Detecção de intenção — OBRIGATÓRIO

No final de CADA resposta, inclua exatamente UMA das tags abaixo (a tag não aparece para o cliente):

- [INFORMACAO] — cliente está só perguntando, ainda não demonstrou interesse em agendar
- [QUALIFICADO] — cliente demonstrou interesse claro em fazer uma tatuagem
- [AGENDAMENTO] — cliente quer agendar ou confirmou que quer marcar
- [HUMANO] — cliente pediu falar com pessoa, está irritado, ou a situação exige julgamento humano

## Exemplos de respostas corretas

Cliente: "oi, vi o insta de vocês"
Ink: "Oi! Bem-vindo ao Império Ink 🖤 Vi que nos achou pelo Instagram! Você já tem alguma ideia de tatuagem em mente ou ainda está explorando?"
[INFORMACAO]

Cliente: "quero fazer uma tatuagem de lobo"
Ink: "Que escolha incrível! Lobo fica lindo em vários estilos. Você prefere algo mais realista ou mais estilizado, tipo blackwork?"
[QUALIFICADO]

Cliente: "quero marcar uma sessão"
Ink: "Perfeito! Você pode agendar direto pelo nosso link e já escolher o tatuador e o horário: /book 🗓️ Tem alguma dúvida antes de agendar?"
[AGENDAMENTO]

## Formato OBRIGATÓRIO da resposta

A resposta deve ter:
1. O texto da mensagem para o cliente (sem a tag)
2. Uma linha em branco
3. A tag de intent entre colchetes

Exemplo:
Oi! Que ideia massa, lobo fica incrível! Você prefere estilo realista ou mais geométrico?

[QUALIFICADO]
"""
```

---

### FASE 5 — SDR service (núcleo da lógica)

**Arquivo a criar:** `backend/app/services/sdr.py`

Este é o arquivo mais importante. Contém toda a lógica de orquestração do agente.

```python
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
    # Fallback: usa Anthropic com chave do .env
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
```

---

### FASE 6 — Reescrever receive_webhook em automations.py

**Arquivo a modificar:** `backend/app/routers/automations.py`

**Substituir** a função `receive_webhook` existente pela versão abaixo. Manter todos os outros endpoints do arquivo intactos (`list_automations`, `create_automation`, `update_automation`, `delete_automation`, `toggle_automation`, `verify_webhook`).

**Adicionar** os imports necessários no topo do arquivo:

```python
# Adicionar aos imports existentes:
from app.services.sdr import get_or_create_lead, get_or_create_conversation, get_sdr_response, apply_intent
from app.services.whatsapp import send_message
from app.services.whisper import transcribe_whatsapp_audio
```

**Substituir** a função `receive_webhook` por:

```python
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

            # --- Chamada ao SDR ---
            intent, clean_response = await get_sdr_response(conversation, db)

            # Append da resposta da IA ao histórico
            messages_history.append({"role": "assistant", "content": clean_response})
            conversation.messages = messages_history

            # Aplica efeitos colaterais do intent (tags no lead, flag handoff)
            apply_intent(intent, lead, conversation, db)

            # Persiste tudo
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
```

**Importante:** manter o endpoint `GET /api/v1/webhooks/whatsapp` de verificação do webhook intacto — apenas `POST` é reescrito.

---

### FASE 7 — Celery Beat: lembretes e reativação

**Arquivo a criar:** `backend/app/workers/reminders.py`

```python
"""
Tasks Celery para comunicação proativa com clientes:
- Lembrete 24h antes do agendamento
- Reativação de leads inativos há 90+ dias
"""
from celery import shared_task
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.appointment import Appointment, AppointmentStatus
from app.models.ai_conversation import AIConversation, ConversationStatus, ConversationChannel
from app.models.lead import Lead
import asyncio
import logging

logger = logging.getLogger(__name__)


def _run_async(coro):
    """Helper para rodar coroutines dentro de tasks Celery síncronas."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@shared_task(name="app.workers.reminders.send_appointment_reminders")
def send_appointment_reminders():
    """
    Executada uma vez por hora pelo Celery Beat.
    Busca agendamentos confirmados com datetime entre 23h e 25h a partir de agora
    e envia lembrete via WhatsApp.
    
    Usa uma janela de 2 horas (23h-25h) para evitar reenvio se a task rodar
    com pequena variação de horário.
    """
    from app.services.whatsapp import send_message
    db: Session = SessionLocal()
    try:
        now = datetime.utcnow()
        window_start = now + timedelta(hours=23)
        window_end = now + timedelta(hours=25)

        upcoming = db.query(Appointment).filter(
            Appointment.status == AppointmentStatus.confirmed,
            Appointment.datetime >= window_start,
            Appointment.datetime <= window_end,
        ).all()

        for appointment in upcoming:
            artist = appointment.artist
            artist_name = artist.name if artist else "seu tatuador"
            date_str = appointment.datetime.strftime("%d/%m/%Y às %H:%M")
            msg = (
                f"Oi! Lembrando que você tem uma sessão amanhã no Império Ink 🖤\n\n"
                f"📅 {date_str}\n"
                f"🎨 Tatuador: {artist_name}\n"
                f"📍 Estúdio: Belém, PA\n\n"
                f"Qualquer dúvida, é só responder aqui!"
            )
            try:
                _run_async(send_message(appointment.client_phone, msg))
                logger.info(f"Lembrete enviado para {appointment.client_phone} (appointment {appointment.id})")
            except Exception as e:
                logger.error(f"Falha ao enviar lembrete para {appointment.client_phone}: {e}")

    finally:
        db.close()


@shared_task(name="app.workers.reminders.reactivate_inactive_leads")
def reactivate_inactive_leads():
    """
    Executada uma vez por dia pelo Celery Beat (às 10h horário de Brasília).
    Busca leads que:
    - Tiveram conversa WhatsApp ativa
    - Última interação há mais de 90 dias
    - Não têm agendamento futuro confirmado
    - Não têm tag "reativado" (para não reativar repetidamente)
    
    Envia mensagem de reativação e adiciona tag "reativado" ao lead.
    """
    from app.services.whatsapp import send_message
    db: Session = SessionLocal()
    try:
        cutoff = datetime.utcnow() - timedelta(days=90)

        # Busca conversas whatsapp inativas há mais de 90 dias
        inactive_conversations = db.query(AIConversation).filter(
            AIConversation.channel == ConversationChannel.whatsapp,
            AIConversation.status == ConversationStatus.active,
            AIConversation.updated_at <= cutoff,
            AIConversation.phone.isnot(None),
        ).all()

        for conv in inactive_conversations:
            lead = conv.lead
            if not lead:
                continue

            # Não reativar se já tem tag de reativação recente
            if "reativado" in (lead.tags or []):
                continue

            # Não reativar se tem agendamento futuro confirmado
            future_appointment = db.query(Appointment).filter(
                Appointment.client_phone == conv.phone,
                Appointment.status == AppointmentStatus.confirmed,
                Appointment.datetime >= datetime.utcnow(),
            ).first()
            if future_appointment:
                continue

            msg = (
                f"Oi! Faz um tempinho que não nos falamos 🖤\n\n"
                f"O Império Ink está com novidades! Temos novos artistas e estilos. "
                f"Ainda está pensando naquela tatuagem? "
                f"Pode agendar uma consulta gratuita quando quiser: /book"
            )

            try:
                _run_async(send_message(conv.phone, msg))
                # Marca como reativado para não enviar novamente
                tags = list(lead.tags or [])
                tags.append("reativado")
                lead.tags = tags
                # Encerra a conversa antiga para que a próxima msg inicie uma nova
                conv.status = ConversationStatus.abandoned
                db.add(lead)
                db.add(conv)
                logger.info(f"Reativação enviada para {conv.phone} (lead {lead.id})")
            except Exception as e:
                logger.error(f"Falha ao reativar lead {lead.id}: {e}")

        db.commit()

    finally:
        db.close()
```

---

### FASE 8 — Configurar Celery Beat

**Arquivo a modificar:** `backend/app/workers/celery_app.py`

**Substituir** o conteúdo atual por:

```python
from celery import Celery
from celery.schedules import crontab
from app.config import settings

celery_app = Celery(
    "tatuagem",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=[
        "app.workers.flow_engine",
        "app.workers.reminders",  # novo
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="America/Sao_Paulo",
    enable_utc=True,
    beat_schedule={
        # Verifica lembretes a cada hora
        "appointment-reminders-hourly": {
            "task": "app.workers.reminders.send_appointment_reminders",
            "schedule": crontab(minute=0),  # todo início de hora
        },
        # Reativação de inativos às 10h todo dia
        "reactivate-inactive-leads-daily": {
            "task": "app.workers.reminders.reactivate_inactive_leads",
            "schedule": crontab(hour=10, minute=0),
        },
    },
)
```

**Adicionar** ao `docker-compose.yml` o serviço Celery Beat (separado do worker):

```yaml
  celery-beat:
    build: ./backend
    restart: always
    env_file: .env
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./backend:/app
    command: celery -A app.workers.celery_app beat --loglevel=info
```

---

### FASE 9 — Atualizar config.py

**Arquivo a modificar:** `backend/app/config.py`

O `openai_api_key` já existe. Verificar se `whatsapp_token` também existe. Se existir, nenhuma mudança necessária. Se não existir, adicionar:

```python
# Dentro da classe Settings, verificar se estes campos existem:
openai_api_key: str = ""        # já existe — usado para Whisper
whatsapp_token: str = ""        # já existe — token Bearer do WhatsApp Cloud API
whatsapp_phone_id: str = ""     # já existe — Phone Number ID do Meta
meta_verify_token: str = ""     # já existe — para verificação do webhook
```

Confirmar que todos os campos acima existem em `config.py`. Se algum faltar, adicionar dentro da classe `Settings`.

---

### FASE 10 — Verificar .env.example

**Arquivo a verificar:** `.env.example` (raiz do projeto)

Confirmar que as seguintes variáveis estão presentes. Se faltarem, adicionar:

```bash
OPENAI_API_KEY=          # necessário para Whisper (transcrição de áudio)
WHATSAPP_TOKEN=          # Bearer token do WhatsApp Cloud API
WHATSAPP_PHONE_ID=       # Phone Number ID do Meta Business
META_VERIFY_TOKEN=       # token de verificação do webhook Meta
ANTHROPIC_API_KEY=       # para o agente SDR (provedor padrão)
```

---

## 4. Testes de validação

Após implementar todas as fases, executar os seguintes testes manuais:

### 4.1 Teste de migration

```bash
cd backend
alembic upgrade head
# Esperado: "Running upgrade 0001 -> 0002, sdr agent fields"
```

### 4.2 Teste de startup

```bash
docker-compose up --build
# Esperado: todos os serviços healthy, sem erros de import
curl http://localhost:8000/health
# Esperado: {"status": "ok"}
```

### 4.3 Teste do webhook de verificação (GET)

```bash
curl "http://localhost:8000/api/v1/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=SEU_TOKEN&hub.challenge=12345"
# Esperado: 12345
```

### 4.4 Teste do loop conversacional (POST simulado)

```bash
curl -X POST http://localhost:8000/api/v1/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "type": "text",
            "from": "5591999999999",
            "text": {"body": "oi, quero fazer uma tatuagem"}
          }]
        }
      }]
    }]
  }'
# Esperado: {"status": "ok"}
# Verificar no banco:
# SELECT * FROM leads WHERE phone = '5591999999999';
# SELECT messages FROM ai_conversations WHERE phone = '5591999999999';
```

### 4.5 Teste de persistência de contexto (segunda mensagem)

```bash
# Enviar segunda mensagem — deve usar histórico da primeira
curl -X POST http://localhost:8000/api/v1/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "type": "text",
            "from": "5591999999999",
            "text": {"body": "blackwork, quero no antebraço"}
          }]
        }
      }]
    }]
  }'
# Verificar: messages em ai_conversations deve ter 4 entradas (2 user + 2 assistant)
```

### 4.6 Teste de detecção de intent

```bash
# Verificar no banco após troca de mensagens:
SELECT tags FROM leads WHERE phone = '5591999999999';
# Esperado após mensagem de interesse: tags = {qualificado}
# Esperado após mensagem de agendamento: tags = {qualificado, interesse_agendamento}
```

### 4.7 Teste Celery Beat

```bash
docker-compose logs celery-beat
# Esperado: "Scheduler: Sending due task appointment-reminders-hourly"
```

---

## 5. Pontos de atenção para o Claude Code

### 5.1 Não quebrar o que existe

- O endpoint `GET /api/v1/webhooks/whatsapp` (verificação do webhook) deve permanecer idêntico
- Todos os outros endpoints em `automations.py` (CRUD de automações) permanecem intactos
- O `flow_engine.py` não é modificado — o sistema de fluxos visuais continua funcionando independentemente
- `CONSULTANT_PROMPT` e `QUALIFICATION_PROMPT` em `prompts.py` não são removidos — o `SDR_PROMPT` é adicionado

### 5.2 Tratamento de erros no webhook

O Meta WhatsApp exige HTTP 200 sempre. Se o endpoint retornar 4xx ou 5xx, o Meta vai retentar a mensagem em loop. Por isso, o `try/except` externo em `receive_webhook` deve capturar qualquer exceção e retornar `{"status": "ok"}` de qualquer forma. Erros devem ser logados, não propagados.

### 5.3 JSONB mutability (SQLAlchemy)

SQLAlchemy não detecta mudanças in-place em campos JSONB. Ao modificar `conversation.messages`, **sempre** reatribuir a lista inteira:

```python
# ERRADO — SQLAlchemy não vai detectar a mudança:
conversation.messages.append({"role": "user", "content": text})

# CORRETO — reatribuição força detecção de mudança:
messages = list(conversation.messages or [])
messages.append({"role": "user", "content": text})
conversation.messages = messages
```

O mesmo vale para `lead.tags`.

### 5.4 Async no Celery

Celery workers são síncronos por padrão. As tasks em `reminders.py` usam o helper `_run_async()` para chamar `send_message` (que é async). Não usar `asyncio.run()` diretamente pois pode conflitar com loops existentes — usar sempre o helper que cria um loop novo.

### 5.5 Ordem dos imports para evitar circular imports

O `sdr.py` importa de `models`, `services/ai_provider` e `services/prompts`. O `automations.py` importa de `sdr.py`. Nunca importar `automations` de dentro de `sdr.py` — isso causaria import circular.

### 5.6 Alembic down_revision

A migration `0002` deve ter `down_revision = "0001"` exatamente. Verificar o `revision` da migration existente em `0001_initial.py` antes de criar a `0002`.

---

## 6. Estrutura final de arquivos modificados/criados

```
backend/
├── alembic/
│   └── versions/
│       ├── 0001_initial.py          (existente — não modificar)
│       └── 0002_sdr_fields.py       ← CRIAR (Fase 1)
├── app/
│   ├── models/
│   │   └── ai_conversation.py       ← MODIFICAR (Fase 2)
│   ├── routers/
│   │   └── automations.py           ← MODIFICAR receive_webhook (Fase 6)
│   ├── services/
│   │   ├── prompts.py               ← MODIFICAR, adicionar SDR_PROMPT (Fase 4)
│   │   ├── sdr.py                   ← CRIAR (Fase 5)
│   │   └── whisper.py               ← CRIAR (Fase 3)
│   └── workers/
│       ├── celery_app.py            ← MODIFICAR, adicionar beat (Fase 8)
│       └── reminders.py             ← CRIAR (Fase 7)
└── docker-compose.yml               ← MODIFICAR, adicionar celery-beat (Fase 8)
```

Total: 4 arquivos criados, 5 arquivos modificados, 1 migration.

---

## 7. Fora de escopo desta implementação

As seguintes funcionalidades **não fazem parte deste PRD** e não devem ser implementadas agora:

- Painel de monitoramento de conversas no frontend
- Integração com Chatwoot para handoff visual
- Suporte a imagens (GPT-4o Vision) — apenas texto e áudio
- RAG com base de conhecimento vetorizada
- Multi-estúdio / multi-tenant
- Atualização automática do `lead.name` quando a IA coletar o nome do cliente

Estas funcionalidades pertencem a um PRD futuro.

---

*Fim do PRD — Claude Code pode iniciar a implementação pela Fase 1.*
