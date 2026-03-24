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
