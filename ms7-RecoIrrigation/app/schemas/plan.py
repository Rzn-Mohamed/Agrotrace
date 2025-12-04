from pydantic import BaseModel, Field
from typing import Literal, Optional
from datetime import datetime

# Simulation de l'entrée venant de "PrévisionEau" (Service 4) 
class PredictionData(BaseModel):
    stress_index: float = Field(..., ge=0, le=1, description="0=Humide, 1=Sec")
    temp_max_demain: float
    probabilite_pluie: float
    evapotranspiration_et0: float # Donnée scientifique clé pour l'irrigation

# Simulation de l'entrée venant de "RèglesAgro" (Service 5) 
class RuleData(BaseModel):
    priorite: Literal["CRITIQUE", "ELEVEE", "NORMALE", "BASSE"]
    stade_culture: str # ex: "Floraison", "Maturation"
    contrainte_hydrique: str # ex: "Interdiction d'arroser entre 12h et 16h"

# L'entrée globale que ton API reçoit
class IrrigationRequest(BaseModel):
    zone_id: int
    culture_type: str
    prediction: PredictionData
    regles: RuleData

# La sortie "Plan d'action" pour le Dashboard (Service 7) 
class IrrigationResponse(BaseModel):
    zone_id: int
    recommendation_id: str
    volume_eau_m3: float        # Plus précis que des litres
    duree_minutes: int
    horaire_debut: datetime
    instruction_textuelle: str
    status: str

# Réponse enrichie avec analyse IA
class AIRecommendationResponse(IrrigationResponse):
    analyse_contextuelle: str = Field(..., description="Analyse du contexte météorologique et agronomique")
    justification_agronomique: str = Field(..., description="Justification scientifique de la recommandation")
    conseils_additionnels: list[str] = Field(default_factory=list, description="Conseils pratiques supplémentaires")
    score_confiance: int = Field(..., ge=0, le=100, description="Score de confiance de l'IA (0-100)")
    genere_par: str = Field(..., description="Nom du modèle LLM utilisé")
    raw_input: Optional[dict] = Field(None, description="Données brutes pour le debug")