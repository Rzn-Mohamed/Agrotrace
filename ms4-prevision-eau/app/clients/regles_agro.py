"""Client HTTP pour le microservice RèglesAgro."""

import logging
from typing import Dict, List, Optional

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

logger = logging.getLogger(__name__)


class ReglesAgroClient:
    """Client pour communiquer avec le microservice RèglesAgro."""

    def __init__(self, base_url: str, timeout: int = 10):
        """
        Initialise le client RèglesAgro.

        Args:
            base_url: URL de base du microservice RèglesAgro (ex: http://localhost:8003)
            timeout: Timeout en secondes pour les requêtes HTTP
        """
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

        # Configuration de retry pour la résilience
        retry_strategy = Retry(
            total=3,
            backoff_factor=0.5,
            status_forcelist=[500, 502, 503, 504],
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session = requests.Session()
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)

    def evaluate_rules(
        self,
        parcelle_id: str,
        capteur_id: str,
        temperature: float,
        humidite: float,
        humidite_sol: float,
        hydric_stress: Optional[float] = None,
        irrigation_need_mm: Optional[float] = None,
        niveau_ph: Optional[float] = None,
        luminosite: Optional[float] = None,
        soil_type: Optional[str] = None,
        growth_stage: Optional[str] = None,
        crop_type: Optional[str] = None,
    ) -> Optional[Dict]:
        """
        Évalue les règles agronomiques pour une parcelle.

        Args:
            parcelle_id: Identifiant de la parcelle
            capteur_id: Identifiant du capteur
            temperature: Température en °C
            humidite: Humidité de l'air en %
            humidite_sol: Humidité du sol en %
            hydric_stress: Stress hydrique prédit (%)
            irrigation_need_mm: Besoin d'irrigation en mm
            niveau_ph: pH du sol (optionnel)
            luminosite: Luminosité en lux (optionnel)
            soil_type: Type de sol (optionnel)
            growth_stage: Stade de croissance (optionnel)
            crop_type: Type de culture (optionnel)

        Returns:
            Dictionnaire avec les recommandations ou None en cas d'erreur
        """
        url = f"{self.base_url}/evaluate"

        payload = {
            "parcelle_id": parcelle_id,
            "capteur_id": capteur_id,
            "temperature": temperature,
            "humidite": humidite,
            "humidite_sol": humidite_sol,
        }

        # Ajouter les champs optionnels s'ils sont fournis
        if hydric_stress is not None:
            payload["hydric_stress"] = hydric_stress
        if irrigation_need_mm is not None:
            payload["irrigation_need_mm"] = irrigation_need_mm
        if niveau_ph is not None:
            payload["niveau_ph"] = niveau_ph
        if luminosite is not None:
            payload["luminosite"] = luminosite
        if soil_type:
            payload["soil_type"] = soil_type
        if growth_stage:
            payload["growth_stage"] = growth_stage
        if crop_type:
            payload["crop_type"] = crop_type

        try:
            response = self.session.post(
                url,
                json=payload,
                timeout=self.timeout,
                headers={"Content-Type": "application/json"},
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.warning(f"Impossible de contacter RèglesAgro ({url}): {e}")
            return None

    def health_check(self) -> bool:
        """Vérifie que le service RèglesAgro est accessible."""
        try:
            response = self.session.get(
                f"{self.base_url}/health",
                timeout=5,
            )
            return response.status_code == 200
        except requests.exceptions.RequestException:
            return False


