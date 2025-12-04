from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class ForecastPoint(BaseModel):
    timestamp: datetime
    hydric_stress: float = Field(ge=0, le=100)
    soil_moisture: float = Field(ge=0, le=100)
    irrigation_need_mm: float = Field(ge=0)
    confidence: Optional[dict] = None


class ForecastRequest(BaseModel):
    capteur_id: str = Field(..., min_length=3, example="PARCELLE_001")
    horizon_days: int = Field(default=5, ge=1, le=14)
    model: Literal["prophet", "lstm", "ensemble"] = "ensemble"


class ForecastResponse(BaseModel):
    capteur_id: str
    generated_at: datetime
    model: str
    points: List[ForecastPoint]


class Recommendation(BaseModel):
    """Recommandation agronomique depuis RèglesAgro."""
    rule_id: str
    priority: str
    title: str
    message: str
    action: Optional[str] = None
    parameters: Optional[dict] = None


class ForecastWithRecommendationsResponse(BaseModel):
    """Réponse combinant prévisions et recommandations agronomiques."""
    capteur_id: str
    generated_at: datetime
    model: str
    points: List[ForecastPoint]
    recommendations: List[Recommendation] = []
    triggered_rules_count: int = 0
    regles_agro_available: bool = True

