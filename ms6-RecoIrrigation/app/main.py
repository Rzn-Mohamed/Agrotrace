# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import irrigation
from .db import models, database
from .core.config import settings

# Création automatique des tables au démarrage (pour le dev)
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Microservice 6 : Calcul et planification d'irrigation"
)

# Configuration CORS (Autoriser le Dashboard React)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En prod, mettre l'URL du dashboard
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusion des routes
app.include_router(irrigation.router, prefix="/api/v1/irrigation", tags=["Irrigation"])

@app.get("/")
def root():
    return {"message": "AgroTrace RecoIrrigation Service is running"}

@app.get("/health")
def health_check():
    """Health check endpoint for container orchestration."""
    return {
        "status": "healthy",
        "service": "ms6-reco-irrigation",
        "version": settings.VERSION
    }