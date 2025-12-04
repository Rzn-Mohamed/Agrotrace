"""Repository PostgreSQL pour les référentiels agricoles."""

import json
import logging
from contextlib import contextmanager
from typing import Dict, Optional

import psycopg2
from psycopg2.extras import RealDictCursor

from app.config import Settings

logger = logging.getLogger(__name__)


class AgriculturalRepository:
    """Gestion des référentiels agricoles dans PostgreSQL."""

    def __init__(self, settings: Settings):
        self._settings = settings

    @contextmanager
    def _get_connection(self):
        """Contexte manager pour les connexions PostgreSQL."""
        conn = None
        try:
            conn = psycopg2.connect(self._settings.build_postgres_dsn())
            yield conn
        finally:
            if conn:
                conn.close()

    def initialize_schema(self):
        """Initialise le schéma de base de données pour les référentiels."""
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cursor:
                    # Table des parcelles
                    cursor.execute("""
                        CREATE TABLE IF NOT EXISTS parcelles (
                            parcelle_id VARCHAR(50) PRIMARY KEY,
                            nom VARCHAR(255),
                            surface_ha DOUBLE PRECISION,
                            soil_type VARCHAR(50),
                            crop_type VARCHAR(50),
                            growth_stage VARCHAR(50),
                            created_at TIMESTAMPTZ DEFAULT NOW(),
                            updated_at TIMESTAMPTZ DEFAULT NOW()
                        );
                    """)

                    # Table des recommandations historiques
                    cursor.execute("""
                        CREATE TABLE IF NOT EXISTS recommandations_historique (
                            id SERIAL PRIMARY KEY,
                            parcelle_id VARCHAR(50) NOT NULL,
                            capteur_id VARCHAR(50),
                            rule_id VARCHAR(100) NOT NULL,
                            priority VARCHAR(20) NOT NULL,
                            title VARCHAR(255) NOT NULL,
                            message TEXT NOT NULL,
                            action VARCHAR(100),
                            parameters JSONB,
                            evaluated_at TIMESTAMPTZ DEFAULT NOW(),
                            FOREIGN KEY (parcelle_id) REFERENCES parcelles(parcelle_id)
                        );
                    """)

                    # Index pour les requêtes fréquentes
                    cursor.execute("""
                        CREATE INDEX IF NOT EXISTS idx_reco_parcelle 
                        ON recommandations_historique(parcelle_id, evaluated_at DESC);
                    """)

                    conn.commit()
                    logger.info("Schéma de base de données initialisé")
        except psycopg2.Error as e:
            logger.error(f"Erreur lors de l'initialisation du schéma: {e}")
            raise

    def get_parcelle_info(self, parcelle_id: str) -> Optional[Dict]:
        """Récupère les informations d'une parcelle."""
        try:
            with self._get_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    cursor.execute(
                        "SELECT * FROM parcelles WHERE parcelle_id = %s",
                        (parcelle_id,)
                    )
                    row = cursor.fetchone()
                    if row:
                        return dict(row)
                    return None
        except psycopg2.Error as e:
            logger.warning(f"Erreur lors de la récupération de la parcelle {parcelle_id}: {e}")
            return None

    def save_recommendation(self, parcelle_id: str, capteur_id: Optional[str], recommendation: Dict):
        """Sauvegarde une recommandation dans l'historique."""
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cursor:
                    # Convert parameters dict to JSON string
                    parameters_json = json.dumps(recommendation.get("parameters")) if recommendation.get("parameters") else None
                    
                    cursor.execute("""
                        INSERT INTO recommandations_historique 
                        (parcelle_id, capteur_id, rule_id, priority, title, message, action, parameters)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s::jsonb)
                    """, (
                        parcelle_id,
                        capteur_id,
                        recommendation.get("rule_id"),
                        recommendation.get("priority"),
                        recommendation.get("title"),
                        recommendation.get("message"),
                        recommendation.get("action"),
                        parameters_json,
                    ))
                    conn.commit()
                    logger.debug(f"Recommandation sauvegardée pour {parcelle_id}")
        except psycopg2.Error as e:
            logger.warning(f"Erreur lors de la sauvegarde de la recommandation: {e}")

    def get_recent_recommendations(self, parcelle_id: str, limit: int = 10) -> list:
        """Récupère les recommandations récentes pour une parcelle."""
        try:
            with self._get_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    cursor.execute("""
                        SELECT * FROM recommandations_historique
                        WHERE parcelle_id = %s
                        ORDER BY evaluated_at DESC
                        LIMIT %s
                    """, (parcelle_id, limit))
                    return [dict(row) for row in cursor.fetchall()]
        except psycopg2.Error as e:
            logger.warning(f"Erreur lors de la récupération des recommandations: {e}")
            return []


