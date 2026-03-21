from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime
from app.models.user import UserRole


class PortfolioItemOut(BaseModel):
    id: UUID
    image_url: str
    category: Optional[str] = None
    order_index: int = 0

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: UserRole = UserRole.client


class UserOut(BaseModel):
    id: UUID
    email: str
    name: str
    role: UserRole
    slug: Optional[str] = None
    commission_pct: float = 0.5
    theme_json: Optional[Dict[str, Any]] = None
    bio: Optional[str] = None
    styles: Optional[List[str]] = None
    avatar_url: Optional[str] = None
    banner_url: Optional[str] = None
    social_links: Optional[Dict[str, Any]] = None
    is_active: bool = True
    created_at: datetime
    portfolio_items: List[PortfolioItemOut] = []

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    styles: Optional[List[str]] = None
    avatar_url: Optional[str] = None
    banner_url: Optional[str] = None
    social_links: Optional[Dict[str, Any]] = None
    commission_pct: Optional[float] = None
    theme_json: Optional[Dict[str, Any]] = None
    slug: Optional[str] = None
    is_active: Optional[bool] = None


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: str
    role: str
