import logging
from typing import List

from fastapi import FastAPI, HTTPException, Query

from app.config import get_settings
from app.repositories.timescale import SensorDataRepository
from app.schemas.forecast import (
    ForecastRequest,
    ForecastResponse,
    ForecastWithRecommendationsResponse,
)
from app.services.feature_engineering import HydricStressEngineer
from app.services.forecasting import ForecastService
from app.services.integration_service import IntegrationService


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

settings = get_settings()
repository = SensorDataRepository(settings)
engineer = HydricStressEngineer(settings)
forecast_service = ForecastService(settings, repository, engineer)
integration_service = IntegrationService(settings, repository)

app = FastAPI(
    title=settings.app_name,
    description="Service de prévision du stress hydrique pour AgroTrace.",
    version="0.1.0",
)


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.app_name,
        "environment": settings.environment,
    }


@app.get("/capteurs/{capteur_id}/history")
def get_history(
    capteur_id: str,
    days: int = Query(
        default=settings.min_history_days,
        ge=settings.min_history_days,
        le=settings.history_window_days,
    ),
) -> List[dict]:
    df = repository.fetch_clean_series(capteur_id, history_days=days)
    if df.empty:
        df = repository.generate_fallback_dataframe(capteur_id)
    if df.empty:
        raise HTTPException(status_code=404, detail="Aucune donnée disponible pour ce capteur.")
    return df.tail(500).to_dict(orient="records")


@app.post("/forecasts", response_model=ForecastResponse)
def create_forecast(payload: ForecastRequest):
    """Crée une prévision sans recommandations agronomiques."""
    result = forecast_service.forecast(
        capteur_id=payload.capteur_id,
        horizon_days=payload.horizon_days,
        model=payload.model,
    )
    return result


@app.post("/forecasts/with-recommendations", response_model=ForecastWithRecommendationsResponse)
def create_forecast_with_recommendations(payload: ForecastRequest):
    """
    Crée une prévision enrichie avec les recommandations agronomiques de RèglesAgro.
    
    Cette endpoint combine les prévisions de stress hydrique avec les recommandations
    agronomiques basées sur les règles métier.
    """
    try:
        # Générer la prévision
        forecast_result = forecast_service.forecast(
            capteur_id=payload.capteur_id,
            horizon_days=payload.horizon_days,
            model=payload.model,
        )
        
        # Enrichir avec les recommandations
        enriched_result = integration_service.enrich_forecast_with_recommendations(
            forecast_result=forecast_result,
            capteur_id=payload.capteur_id,
        )
        
        return enriched_result
    except Exception as e:
        logging.error(f"Erreur lors de la création de prévision avec recommandations: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Erreur interne: {str(e)}"
        )