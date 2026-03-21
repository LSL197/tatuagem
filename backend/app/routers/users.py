from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.database import get_db
from app.models.user import User, UserRole, PortfolioItem
from app.schemas.user import UserOut, UserUpdate, PortfolioItemOut
from app.middleware.rbac import get_current_user, require_role
from app.services.cloudinary import upload_image, delete_image

router = APIRouter(tags=["users"])


@router.get("/api/v1/users/", response_model=List[UserOut])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    return db.query(User).all()


@router.get("/api/v1/users/{user_id}", response_model=UserOut)
def get_user(user_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return user


@router.put("/api/v1/users/{user_id}", response_model=UserOut)
def update_user(
    user_id: UUID,
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.admin and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Acesso negado")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/api/v1/users/{user_id}", status_code=204)
def deactivate_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    user.is_active = False
    db.commit()


@router.get("/api/v1/artists/", response_model=List[UserOut])
def list_artists(db: Session = Depends(get_db)):
    return db.query(User).filter(User.role == UserRole.artist, User.is_active == True).all()


@router.get("/api/v1/artists/{slug}", response_model=UserOut)
def get_artist_by_slug(slug: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.slug == slug, User.role == UserRole.artist, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=404, detail="Tatuador não encontrado")
    return user


@router.post("/api/v1/artists/{artist_id}/portfolio", response_model=PortfolioItemOut)
async def add_portfolio_item(
    artist_id: UUID,
    file: UploadFile = File(...),
    category: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.admin and current_user.id != artist_id:
        raise HTTPException(status_code=403, detail="Acesso negado")
    result = await upload_image(file)
    last = db.query(PortfolioItem).filter(PortfolioItem.user_id == artist_id).count()
    item = PortfolioItem(
        user_id=artist_id,
        image_url=result["url"],
        public_id=result["public_id"],
        category=category,
        order_index=last,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/api/v1/artists/{artist_id}/portfolio/{item_id}", status_code=204)
def delete_portfolio_item(
    artist_id: UUID,
    item_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.admin and current_user.id != artist_id:
        raise HTTPException(status_code=403, detail="Acesso negado")
    item = db.query(PortfolioItem).filter(PortfolioItem.id == item_id, PortfolioItem.user_id == artist_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    if item.public_id:
        delete_image(item.public_id)
    db.delete(item)
    db.commit()


@router.put("/api/v1/artists/{artist_id}/portfolio/reorder", status_code=200)
def reorder_portfolio(
    artist_id: UUID,
    order: List[dict],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.admin and current_user.id != artist_id:
        raise HTTPException(status_code=403, detail="Acesso negado")
    for entry in order:
        db.query(PortfolioItem).filter(
            PortfolioItem.id == entry["id"],
            PortfolioItem.user_id == artist_id,
        ).update({"order_index": entry["order_index"]})
    db.commit()
    return {"ok": True}


@router.put("/api/v1/artists/{artist_id}/theme", response_model=UserOut)
def update_theme(
    artist_id: UUID,
    theme: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.admin and current_user.id != artist_id:
        raise HTTPException(status_code=403, detail="Acesso negado")
    user = db.query(User).filter(User.id == artist_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    user.theme_json = theme
    db.commit()
    db.refresh(user)
    return user


@router.post("/api/v1/upload/image")
async def upload_generic_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    result = await upload_image(file)
    return result
