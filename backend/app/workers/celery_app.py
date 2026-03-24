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
