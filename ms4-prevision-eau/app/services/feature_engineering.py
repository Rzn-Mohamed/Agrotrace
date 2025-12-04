from __future__ import annotations

import logging
from typing import Tuple

import numpy as np
import pandas as pd

from app.config import Settings

logger = logging.getLogger(__name__)


class HydricStressEngineer:
    """Prépare les features nécessaires aux modèles de prévision."""

    def __init__(self, settings: Settings):
        self._settings = settings

    def prepare_training_frame(self, df: pd.DataFrame) -> pd.DataFrame:
        """Nettoie et enrichit une série temporelle capteur."""

        if df is None or df.empty:
            raise ValueError("Aucune donnée disponible pour l'entraînement")

        # Exclure les colonnes non numériques avant le resample
        # Garder timestamp et toutes les colonnes numériques
        cols_to_keep = ["timestamp"]
        for col in df.columns:
            if col != "timestamp" and col != "capteur_id" and pd.api.types.is_numeric_dtype(df[col]):
                cols_to_keep.append(col)
        
        # Créer un DataFrame avec seulement les colonnes numériques + timestamp
        df_numeric = df[cols_to_keep].copy()
        
        working_df = (
            df_numeric.set_index("timestamp")
            .sort_index()
            .resample(self._settings.resample_frequency)
            .mean()
            .interpolate(method="time")
            .ffill()
            .bfill()
        )

        working_df["dew_point"] = self._dew_point(
            working_df["temperature"], working_df["humidite"]
        )
        working_df["vpd"] = self._vapor_pressure_deficit(working_df)
        working_df["soil_moisture_pct"] = working_df["humidite_sol"].clip(0, 100)

        working_df["hydric_stress"] = self._hydric_stress_index(working_df)
        working_df["rolling_stress"] = working_df["hydric_stress"].rolling(24, min_periods=6).mean()
        working_df["rolling_moisture"] = working_df["soil_moisture_pct"].rolling(24, min_periods=6).mean()
        working_df["irrigation_need_mm"] = self._irrigation_need(working_df["hydric_stress"])

        result = working_df.reset_index().rename(columns={"index": "timestamp"}).ffill().bfill()
        logger.debug(
            "PrévisionEau :: frame entraînement générée (%s lignes, %s colonnes)",
            result.shape[0],
            result.shape[1],
        )
        return result

    @staticmethod
    def _dew_point(temperature: pd.Series, humidite: pd.Series) -> pd.Series:
        """Approximation du point de rosée."""

        a, b = 17.27, 237.7
        alpha = ((a * temperature) / (b + temperature)) + np.log(humidite / 100.0)
        return (b * alpha) / (a - alpha)

    @staticmethod
    def _vapor_pressure_deficit(df: pd.DataFrame) -> pd.Series:
        """Calcul simplifié du déficit de pression de vapeur."""

        temp = df["temperature"]
        dew = df["dew_point"]
        es = 0.6108 * np.exp((17.27 * temp) / (temp + 237.3))
        ea = 0.6108 * np.exp((17.27 * dew) / (dew + 237.3))
        return (es - ea).clip(lower=0)

    def _hydric_stress_index(self, df: pd.DataFrame) -> pd.Series:
        """Indice empiriquement pondéré de stress hydrique."""

        soil_deficit = (100 - df["soil_moisture_pct"]).clip(lower=0, upper=100)
        heat_penalty = (df["temperature"] - 25).clip(lower=0, upper=20)
        vpd_penalty = (df["vpd"] * 15).clip(0, 30)
        stress = 0.6 * soil_deficit + 0.25 * heat_penalty + 0.15 * vpd_penalty
        return stress.clip(0, 100)

    def _irrigation_need(self, hydric_stress: pd.Series) -> pd.Series:
        """Traduit le stress en besoin d'irrigation (mm)."""

        surplus = (hydric_stress - self._settings.irrigation_threshold).clip(lower=0)
        return (surplus / (100 - self._settings.irrigation_threshold)) * self._settings.irrigation_max_mm

    def split_features_targets(
        self, df: pd.DataFrame
    ) -> Tuple[pd.DataFrame, pd.Series]:
        """Sépare features et cible pour les modèles ML."""

        features = df[
            [
                "temperature",
                "humidite",
                "soil_moisture_pct",
                "vpd",
                "rolling_stress",
                "rolling_moisture",
            ]
        ]
        target = df["hydric_stress"]
        return features, target

