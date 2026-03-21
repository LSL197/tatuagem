"""
Seed inicial: cria admin + 1 tatuador de exemplo.
Rode com: python seed.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine, Base
from app.models import *
from app.models.user import User, UserRole
from app.services.auth import hash_password

Base.metadata.create_all(bind=engine)

db = SessionLocal()

def create_if_not_exists(email, name, role, slug=None, styles=None, bio=None, commission_pct=0.5):
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        print(f"  já existe: {email}")
        return existing
    user = User(
        email=email,
        password_hash=hash_password("senha123"),
        name=name,
        role=role,
        slug=slug,
        styles=styles or [],
        bio=bio,
        commission_pct=commission_pct,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    print(f"  criado: {email}")
    return user

print("Criando usuários...")
create_if_not_exists(
    email="admin@estudio.com",
    name="Admin",
    role=UserRole.admin,
)
create_if_not_exists(
    email="joao@estudio.com",
    name="João Silva",
    role=UserRole.artist,
    slug="joao-silva",
    styles=["Blackwork", "Geométrico", "Minimalista"],
    bio="Especialista em blackwork e geometria sagrada. 8 anos de experiência.",
    commission_pct=0.6,
)
create_if_not_exists(
    email="ana@estudio.com",
    name="Ana Costa",
    role=UserRole.artist,
    slug="ana-costa",
    styles=["Realismo", "Aquarela", "Retrato"],
    bio="Apaixonada por realismo e aquarela. Referência em retratos.",
    commission_pct=0.6,
)

db.close()
print("\nSeed concluído!")
print("Login admin: admin@estudio.com / senha123")
print("Login artista: joao@estudio.com / senha123")
