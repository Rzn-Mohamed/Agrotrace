"""Moteur de règles agronomiques."""

import logging
from typing import Dict, List, Optional

from app.config import Settings
from app.schemas.rules import (
    CropType,
    GrowthStage,
    Recommendation,
    RuleEvaluationRequest,
    SoilType,
)

logger = logging.getLogger(__name__)


class RuleEngine:
    """Moteur d'évaluation des règles agronomiques."""

    def __init__(self, settings: Settings):
        self._settings = settings
        self._rules: List[callable] = []

    def register_rule(self, rule_func: callable):
        """Enregistre une règle dans le moteur."""
        self._rules.append(rule_func)
        logger.debug(f"Règle enregistrée: {rule_func.__name__}")

    def evaluate(self, request: RuleEvaluationRequest) -> List[Recommendation]:
        """Évalue toutes les règles et retourne les recommandations."""
        recommendations: List[Recommendation] = []

        for rule_func in self._rules:
            try:
                rec = rule_func(request, self._settings)
                if rec:
                    if isinstance(rec, list):
                        recommendations.extend(rec)
                    else:
                        recommendations.append(rec)
            except Exception as e:
                logger.warning(f"Erreur lors de l'évaluation de la règle {rule_func.__name__}: {e}")

        # Trier par priorité (critical > high > medium > low)
        priority_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        recommendations.sort(key=lambda r: priority_order.get(r.priority, 99))

        return recommendations


# Règles agronomiques individuelles

def rule_irrigation_urgente(request: RuleEvaluationRequest, settings: Settings) -> Optional[Recommendation]:
    """Règle: Irrigation urgente si humidité < seuil critique et température élevée."""
    if (
        request.humidite_sol < settings.soil_moisture_critical
        and request.temperature > settings.temperature_high
    ):
        return Recommendation(
            rule_id="IRRIGATION_URGENTE",
            priority="critical",
            title="Irrigation urgente requise",
            message=(
                f"L'humidité du sol est critique ({request.humidite_sol:.1f}%) "
                f"et la température est élevée ({request.temperature:.1f}°C). "
                "Une irrigation immédiate est nécessaire pour éviter le stress hydrique."
            ),
            action="irriguer_immediatement",
            parameters={
                "humidite_sol": request.humidite_sol,
                "temperature": request.temperature,
                "irrigation_recommended_mm": max(15.0, request.irrigation_need_mm or 15.0),
            },
        )
    return None


def rule_humidite_faible(request: RuleEvaluationRequest, settings: Settings) -> Optional[Recommendation]:
    """Règle: Alerte si humidité du sol < seuil bas."""
    if request.humidite_sol < settings.soil_moisture_low:
        return Recommendation(
            rule_id="HUMIDITE_FAIBLE",
            priority="high",
            title="Humidité du sol faible",
            message=(
                f"L'humidité du sol est faible ({request.humidite_sol:.1f}%). "
                "Surveillez l'évolution et préparez une irrigation si nécessaire."
            ),
            action="surveiller_et_preparer_irrigation",
            parameters={"humidite_sol": request.humidite_sol},
        )
    return None


def rule_stress_hydrique(request: RuleEvaluationRequest, settings: Settings) -> Optional[Recommendation]:
    """Règle: Alerte si stress hydrique prédit > seuil."""
    if request.hydric_stress and request.hydric_stress > settings.hydric_stress_threshold:
        return Recommendation(
            rule_id="STRESS_HYDRIQUE",
            priority="high",
            title="Stress hydrique détecté",
            message=(
                f"Le stress hydrique prédit est élevé ({request.hydric_stress:.1f}%). "
                f"Besoin d'irrigation estimé: {request.irrigation_need_mm or 0:.1f} mm."
            ),
            action="planifier_irrigation",
            parameters={
                "hydric_stress": request.hydric_stress,
                "irrigation_need_mm": request.irrigation_need_mm,
            },
        )
    return None


def rule_temperature_critique(request: RuleEvaluationRequest, settings: Settings) -> Optional[Recommendation]:
    """Règle: Alerte si température > seuil critique."""
    if request.temperature > settings.temperature_critical:
        return Recommendation(
            rule_id="TEMPERATURE_CRITIQUE",
            priority="critical",
            title="Température critique",
            message=(
                f"La température est très élevée ({request.temperature:.1f}°C). "
                "Augmentez la fréquence d'irrigation et surveillez les signes de stress thermique."
            ),
            action="augmenter_frequence_irrigation",
            parameters={"temperature": request.temperature},
        )
    return None


def rule_ph_inadequat(request: RuleEvaluationRequest, settings: Settings) -> Optional[Recommendation]:
    """Règle: Alerte si pH hors des limites acceptables."""
    if request.niveau_ph:
        if request.niveau_ph < settings.ph_min or request.niveau_ph > settings.ph_max:
            return Recommendation(
                rule_id="PH_INADEGUAT",
                priority="medium",
                title="pH du sol inadéquat",
                message=(
                    f"Le pH du sol ({request.niveau_ph:.2f}) est hors des limites optimales "
                    f"({settings.ph_min}-{settings.ph_max}). "
                    "Considérez un amendement du sol."
                ),
                action="corriger_ph_sol",
                parameters={"niveau_ph": request.niveau_ph},
            )
    return None


def rule_croissance_irrigation(request: RuleEvaluationRequest, settings: Settings) -> Optional[Recommendation]:
    """Règle: Besoins d'irrigation selon le stade de croissance."""
    if request.growth_stage == GrowthStage.FLORAISON and request.humidite_sol < 40:
        return Recommendation(
            rule_id="CROISSANCE_FLORAISON",
            priority="high",
            title="Irrigation recommandée en période de floraison",
            message=(
                "La culture est en phase de floraison et nécessite une humidité optimale. "
                f"Humidité actuelle: {request.humidite_sol:.1f}%."
            ),
            action="irriguer_floraison",
            parameters={"growth_stage": request.growth_stage.value, "humidite_sol": request.humidite_sol},
        )
    return None


def rule_type_sol_irrigation(request: RuleEvaluationRequest, settings: Settings) -> Optional[Recommendation]:
    """Règle: Ajustement de l'irrigation selon le type de sol."""
    if request.soil_type:
        if request.soil_type == SoilType.SABLEUX and request.humidite_sol < 30:
            return Recommendation(
                rule_id="SOL_SABLEUX",
                priority="medium",
                title="Sol sableux - irrigation fréquente",
                message=(
                    "Les sols sableux retiennent moins l'eau. "
                    "Irriguez plus fréquemment mais en quantités modérées."
                ),
                action="irriguer_frequemment",
                parameters={"soil_type": request.soil_type.value},
            )
        elif request.soil_type == SoilType.ARGILEUX and request.humidite_sol > 70:
            return Recommendation(
                rule_id="SOL_ARGILEUX",
                priority="low",
                title="Sol argileux - risque de saturation",
                message=(
                    "Les sols argileux retiennent bien l'eau. "
                    "Évitez l'excès d'irrigation pour prévenir la saturation."
                ),
                action="reduire_irrigation",
                parameters={"soil_type": request.soil_type.value},
            )
    return None


def initialize_rule_engine(settings: Settings) -> RuleEngine:
    """Initialise le moteur de règles avec toutes les règles agronomiques."""
    engine = RuleEngine(settings)

    # Enregistrer toutes les règles
    engine.register_rule(rule_irrigation_urgente)
    engine.register_rule(rule_humidite_faible)
    engine.register_rule(rule_stress_hydrique)
    engine.register_rule(rule_temperature_critique)
    engine.register_rule(rule_ph_inadequat)
    engine.register_rule(rule_croissance_irrigation)
    engine.register_rule(rule_type_sol_irrigation)

    logger.info(f"Moteur de règles initialisé avec {len(engine._rules)} règles")
    return engine

