"""Service d'intégration avec RèglesAgro."""

import logging
from typing import Dict, List, Optional

import pandas as pd

from app.clients.regles_agro import ReglesAgroClient
from app.config import Settings
from app.repositories.timescale import SensorDataRepository

logger = logging.getLogger(__name__)


class IntegrationService:
    """Service pour intégrer PrévisionEau avec RèglesAgro."""

    def __init__(
        self,
        settings: Settings,
        repository: SensorDataRepository,
        regles_agro_client: Optional[ReglesAgroClient] = None,
    ):
        self._settings = settings
        self._repository = repository
        self._regles_agro_client = regles_agro_client or (
            ReglesAgroClient(
                base_url=settings.regles_agro_url,
                timeout=settings.regles_agro_timeout,
            )
            if settings.regles_agro_enabled
            else None
        )

    def enrich_forecast_with_recommendations(
        self,
        forecast_result: Dict,
        capteur_id: str,
    ) -> Dict:
        """
        Enrichit les prévisions avec les recommandations agronomiques.

        Args:
            forecast_result: Résultat de la prévision (ForecastResponse)
            capteur_id: Identifiant du capteur

        Returns:
            Dictionnaire enrichi avec les recommandations
        """
        if not self._regles_agro_client or not self._settings.regles_agro_enabled:
            logger.debug("RèglesAgro désactivé ou client non disponible")
            return {
                **forecast_result,
                "recommendations": [],
                "triggered_rules_count": 0,
                "regles_agro_available": False,
            }

        # Récupérer les données actuelles du capteur pour le contexte
        df = self._repository.fetch_clean_series(capteur_id, history_days=1)
        if df.empty:
            df = self._repository.generate_fallback_dataframe(capteur_id)

        # Utiliser les dernières valeurs disponibles
        if df.empty:
            logger.warning(f"Aucune donnée disponible pour {capteur_id}, utilisation de valeurs par défaut")
            current_temp = 25.0
            current_humidite = 60.0
            current_humidite_sol = 50.0
            current_ph = None
            current_luminosite = None
        else:
            last_row = df.iloc[-1]
            current_temp = float(last_row.get("temperature", 25.0))
            current_humidite = float(last_row.get("humidite", 60.0))
            current_humidite_sol = float(last_row.get("humidite_sol", 50.0))
            current_ph = float(last_row.get("niveau_ph")) if pd.notna(last_row.get("niveau_ph")) else None
            current_luminosite = float(last_row.get("luminosite")) if pd.notna(last_row.get("luminosite")) else None

        # Utiliser la première prévision pour le stress hydrique et l'irrigation
        points = forecast_result.get("points", [])
        if points:
            first_point = points[0]
            # Extraire les valeurs (toujours un dict dans notre cas)
            if isinstance(first_point, dict):
                hydric_stress = first_point.get("hydric_stress")
                irrigation_need = first_point.get("irrigation_need_mm")
            else:
                # Si c'est un objet ForecastPoint (ne devrait pas arriver)
                hydric_stress = getattr(first_point, "hydric_stress", None)
                irrigation_need = getattr(first_point, "irrigation_need_mm", None)
        else:
            logger.warning(f"Aucun point de prévision disponible pour {capteur_id}")
            hydric_stress = None
            irrigation_need = None

        # Appeler RèglesAgro
        recommendations_response = self._regles_agro_client.evaluate_rules(
            parcelle_id=capteur_id,  # Utiliser capteur_id comme parcelle_id
            capteur_id=capteur_id,
            temperature=current_temp,
            humidite=current_humidite,
            humidite_sol=current_humidite_sol,
            hydric_stress=hydric_stress,
            irrigation_need_mm=irrigation_need,
            niveau_ph=current_ph,
            luminosite=current_luminosite,
        )

        if recommendations_response:
            recommendations = recommendations_response.get("recommendations", [])
            triggered_count = recommendations_response.get("triggered_rules_count", 0)
            logger.info(
                f"Recommandations obtenues pour {capteur_id}: {triggered_count} règles déclenchées"
            )
            return {
                **forecast_result,
                "recommendations": recommendations,
                "triggered_rules_count": triggered_count,
                "regles_agro_available": True,
            }
        else:
            logger.warning(f"Impossible d'obtenir les recommandations pour {capteur_id}")
            return {
                **forecast_result,
                "recommendations": [],
                "triggered_rules_count": 0,
                "regles_agro_available": False,
            }

