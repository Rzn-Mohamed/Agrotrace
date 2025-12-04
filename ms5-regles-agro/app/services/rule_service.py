"""Service d'évaluation des règles agronomiques."""

import logging
from typing import Dict

from app.repositories.postgres import AgriculturalRepository
from app.rules.engine import RuleEngine
from app.schemas.rules import RuleEvaluationRequest, RuleEvaluationResponse

logger = logging.getLogger(__name__)


class RuleService:
    """Service principal pour l'évaluation des règles agronomiques."""

    def __init__(
        self,
        rule_engine: RuleEngine,
        repository: AgriculturalRepository,
    ):
        self._engine = rule_engine
        self._repository = repository

    def evaluate_rules(self, request: RuleEvaluationRequest) -> RuleEvaluationResponse:
        """Évalue les règles agronomiques et retourne les recommandations."""
        # Récupérer les informations de la parcelle depuis la base si disponibles
        parcelle_info = self._repository.get_parcelle_info(request.parcelle_id)
        
        # Enrichir la requête avec les données de la parcelle si disponibles
        if parcelle_info:
            if not request.soil_type and parcelle_info.get("soil_type"):
                from app.schemas.rules import SoilType
                try:
                    request.soil_type = SoilType(parcelle_info["soil_type"])
                except ValueError:
                    pass
            
            if not request.crop_type and parcelle_info.get("crop_type"):
                from app.schemas.rules import CropType
                try:
                    request.crop_type = CropType(parcelle_info["crop_type"])
                except ValueError:
                    pass
            
            if not request.growth_stage and parcelle_info.get("growth_stage"):
                from app.schemas.rules import GrowthStage
                try:
                    request.growth_stage = GrowthStage(parcelle_info["growth_stage"])
                except ValueError:
                    pass

        # Évaluer les règles
        recommendations = self._engine.evaluate(request)

        # Sauvegarder les recommandations dans l'historique
        for rec in recommendations:
            self._repository.save_recommendation(
                request.parcelle_id,
                request.capteur_id,
                rec.model_dump(),
            )

        # Construire le contexte
        context = {
            "temperature": request.temperature,
            "humidite": request.humidite,
            "humidite_sol": request.humidite_sol,
            "niveau_ph": request.niveau_ph,
            "hydric_stress": request.hydric_stress,
            "soil_type": request.soil_type.value if request.soil_type else None,
            "crop_type": request.crop_type.value if request.crop_type else None,
            "growth_stage": request.growth_stage.value if request.growth_stage else None,
        }

        return RuleEvaluationResponse(
            parcelle_id=request.parcelle_id,
            capteur_id=request.capteur_id,
            recommendations=recommendations,
            triggered_rules_count=len(recommendations),
            context=context,
        )


