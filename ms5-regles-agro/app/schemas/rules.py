from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class SoilType(str, Enum):
    """Types de sol agricole."""

    ARGILEUX = "argileux"
    SABLEUX = "sableux"
    LIMONEUX = "limoneux"
    LOAMEUX = "loameux"


class GrowthStage(str, Enum):
    """Stades de croissance des cultures."""

    GERMINATION = "germination"
    LEVEE = "levee"
    CROISSANCE = "croissance"
    FLORAISON = "floraison"
    FRUCTIFICATION = "fructification"
    MATURATION = "maturation"
    RECOLTE = "recolte"


class CropType(str, Enum):
    """Types de cultures."""

    CEREALE = "cereale"
    LEGUMINEUSE = "legumineuse"
    MARAICHERE = "maraichere"
    ARBORICULTURE = "arboriculture"
    VITICULTURE = "viticulture"


class RuleEvaluationRequest(BaseModel):
    """Requête pour l'évaluation de règles agronomiques."""

    parcelle_id: str = Field(..., description="Identifiant de la parcelle")
    capteur_id: Optional[str] = Field(None, description="Identifiant du capteur")
    
    # Données environnementales actuelles
    temperature: float = Field(..., ge=-10, le=50, description="Température en °C")
    humidite: float = Field(..., ge=0, le=100, description="Humidité de l'air en %")
    humidite_sol: float = Field(..., ge=0, le=100, description="Humidité du sol en %")
    niveau_ph: Optional[float] = Field(None, ge=0, le=14, description="Niveau de pH du sol")
    luminosite: Optional[float] = Field(None, ge=0, description="Luminosité en lux")
    
    # Données prédictives (depuis PrévisionEau)
    hydric_stress: Optional[float] = Field(None, ge=0, le=100, description="Stress hydrique prédit (%)")
    irrigation_need_mm: Optional[float] = Field(None, ge=0, description="Besoin d'irrigation en mm")
    
    # Contexte agronomique
    soil_type: Optional[SoilType] = Field(None, description="Type de sol")
    growth_stage: Optional[GrowthStage] = Field(None, description="Stade de croissance")
    crop_type: Optional[CropType] = Field(None, description="Type de culture")


class Recommendation(BaseModel):
    """Recommandation agronomique générée par une règle."""

    rule_id: str = Field(..., description="Identifiant de la règle déclenchée")
    priority: str = Field(..., description="Priorité: critical, high, medium, low")
    title: str = Field(..., description="Titre de la recommandation")
    message: str = Field(..., description="Message de recommandation détaillé")
    action: Optional[str] = Field(None, description="Action recommandée")
    parameters: Optional[dict] = Field(None, description="Paramètres additionnels")


class RuleEvaluationResponse(BaseModel):
    """Réponse de l'évaluation des règles."""

    parcelle_id: str
    capteur_id: Optional[str]
    evaluated_at: datetime = Field(default_factory=datetime.utcnow)
    recommendations: List[Recommendation] = Field(default_factory=list)
    triggered_rules_count: int = Field(default=0)
    context: dict = Field(default_factory=dict)

