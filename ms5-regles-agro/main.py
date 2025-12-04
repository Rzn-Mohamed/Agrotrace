import logging
from typing import List

from fastapi import FastAPI, HTTPException, Query

from app.config import get_settings
from app.repositories.postgres import AgriculturalRepository
from app.rules.engine import initialize_rule_engine
from app.schemas.rules import RuleEvaluationRequest, RuleEvaluationResponse
from app.services.rule_service import RuleService

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

settings = get_settings()
repository = AgriculturalRepository(settings)
rule_engine = initialize_rule_engine(settings)
rule_service = RuleService(rule_engine, repository)

# Initialiser le schéma de base de données au démarrage (non bloquant)
def init_db_schema():
    """Initialise le schéma de base de données de manière asynchrone."""
    try:
        repository.initialize_schema()
        logging.info("Schéma de base de données initialisé avec succès")
    except Exception as e:
        logging.warning(f"Impossible d'initialiser le schéma de base de données: {e}")
        logging.info("Le service fonctionnera en mode dégradé (sans persistance)")

# Initialiser en arrière-plan (non bloquant)
import threading
threading.Thread(target=init_db_schema, daemon=True).start()

app = FastAPI(
    title=settings.app_name,
    description="Service de règles agronomiques pour AgroTrace.",
    version="0.1.0",
)


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.app_name,
        "environment": settings.environment,
    }


@app.post("/evaluate", response_model=RuleEvaluationResponse)
def evaluate_rules(request: RuleEvaluationRequest) -> RuleEvaluationResponse:
    """Évalue les règles agronomiques pour une parcelle."""
    try:
        result = rule_service.evaluate_rules(request)
        return result
    except Exception as e:
        logging.error(f"Erreur lors de l'évaluation des règles: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur interne: {str(e)}")


@app.get("/parcelles/{parcelle_id}/recommandations")
def get_recommendations_history(
    parcelle_id: str,
    limit: int = Query(default=10, ge=1, le=100),
) -> List[dict]:
    """Récupère l'historique des recommandations pour une parcelle."""
    recommendations = repository.get_recent_recommendations(parcelle_id, limit)
    return recommendations


@app.get("/parcelles/{parcelle_id}/info")
def get_parcelle_info(parcelle_id: str) -> dict:
    """Récupère les informations d'une parcelle."""
    info = repository.get_parcelle_info(parcelle_id)
    if not info:
        raise HTTPException(status_code=404, detail="Parcelle non trouvée")
    return info

