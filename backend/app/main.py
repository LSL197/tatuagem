from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import engine, Base
import app.models  # noqa: F401 — imports all models so Base knows them

from app.routers import auth, users, appointments, leads, financial, metrics, automations, ai, settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Tatuagem API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://frontend:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(appointments.router)
app.include_router(leads.router)
app.include_router(financial.router)
app.include_router(metrics.router)
app.include_router(automations.router)
app.include_router(ai.router)
app.include_router(settings.router)


@app.get("/health")
def health():
    return {"status": "ok"}
