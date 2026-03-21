from celery import Celery
from app.config import settings

celery_app = Celery(
    "tatuagem",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.workers.flow_engine"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="America/Sao_Paulo",
    enable_utc=True,
)
