import logging
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from typing import Optional

import numpy as np
import pandas as pd
import psycopg2
from psycopg2.extras import RealDictCursor

from app.config import Settings

logger = logging.getLogger(__name__)


class SensorDataRepository:
    """Gestion des lectures TimescaleDB pour les données nettoyées."""

    def __init__(self, settings: Settings):
        self._settings = settings

    @contextmanager
    def _get_connection(self):
        conn = None
        try:
            conn = psycopg2.connect(self._settings.build_timescale_dsn())
            yield conn
        finally:
            if conn:
                conn.close()

    def fetch_clean_series(
        self,
        capteur_id: str,
        history_days: Optional[int] = None,
    ) -> pd.DataFrame:
        """Récupère les mesures nettoyées pour un capteur."""

        window = history_days or self._settings.history_window_days
        query = """
            SELECT
                timestamp,
                temperature,
                humidite,
                humidite_sol,
                niveau_ph,
                luminosite
            FROM clean_sensor_data
            WHERE capteur_id = %s
              AND timestamp >= NOW() AT TIME ZONE 'UTC' - (%s * INTERVAL '1 day')
            ORDER BY timestamp ASC;
        """

        try:
            with self._get_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    cursor.execute(query, (capteur_id, window))
                    rows = cursor.fetchall()
            df = pd.DataFrame(rows)
            if not df.empty:
                df["timestamp"] = pd.to_datetime(df["timestamp"], utc=True)
            logger.info(
                "PrévisionEau :: %s lignes chargées depuis Timescale pour %s",
                len(df),
                capteur_id,
            )
            return df
        except psycopg2.Error as exc:
            logger.warning(
                "PrévisionEau :: impossible de joindre Timescale (%s). "
                "Utilisation d'une série synthétique.",
                exc,
            )
            return pd.DataFrame()

    def generate_fallback_dataframe(
        self,
        capteur_id: str,
        rows: Optional[int] = None,
    ) -> pd.DataFrame:
        """Produit une série synthétique (utile en développement/démo)."""

        rng = np.random.default_rng(self._settings.fallback_seed)
        total_rows = rows or self._settings.fallback_rows
        now = datetime.now(timezone.utc)
        timestamps = [now - timedelta(hours=i) for i in reversed(range(total_rows))]

        base_temp = 24 + 4 * np.sin(np.linspace(0, 3.14, total_rows))
        humidite = 60 + 10 * np.cos(np.linspace(0, 6.28, total_rows))
        humidite_sol = 45 + 15 * rng.normal(0, 0.5, size=total_rows).cumsum() / total_rows
        humidite_sol = np.clip(humidite_sol + 10, 15, 85)
        luminosite = np.clip(500 + 200 * np.sin(np.linspace(0, 12.56, total_rows)), 100, 900)

        df = pd.DataFrame(
            {
                "capteur_id": capteur_id,
                "timestamp": pd.to_datetime(timestamps),
                "temperature": base_temp,
                "humidite": humidite,
                "humidite_sol": humidite_sol,
                "niveau_ph": rng.normal(6.5, 0.2, size=total_rows),
                "luminosite": luminosite,
            }
        )
        logger.info(
            "PrévisionEau :: série fallback générée (%s points) pour %s",
            total_rows,
            capteur_id,
        )
        return df

