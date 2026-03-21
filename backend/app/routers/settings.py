from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models.studio_settings import StudioSettings, AIProviderType
from app.models.user import User, UserRole
from app.middleware.rbac import require_role
from app.services.cloudinary import upload_image

router = APIRouter(prefix="/api/v1/settings", tags=["settings"])


class SettingsUpdate(BaseModel):
    name: Optional[str] = None
    logo_url: Optional[str] = None
    ai_provider: Optional[AIProviderType] = None
    ai_api_key: Optional[str] = None
    theme: Optional[dict] = None


class SettingsOut(BaseModel):
    id: str
    name: str
    logo_url: Optional[str]
    ai_provider: AIProviderType
    theme: dict

    class Config:
        from_attributes = True


def get_or_create_settings(db: Session) -> StudioSettings:
    settings = db.query(StudioSettings).first()
    if not settings:
        settings = StudioSettings(name="Estúdio de Tatuagem")
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


@router.get("/", response_model=SettingsOut)
def get_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    return get_or_create_settings(db)


@router.put("/", response_model=SettingsOut)
def update_settings(
    data: SettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    studio = get_or_create_settings(db)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(studio, field, value)
    db.commit()
    db.refresh(studio)
    return studio
