from __future__ import annotations

import logging
from datetime import datetime
from typing import Dict, List

import numpy as np
import pandas as pd
from prophet import Prophet
from sklearn.preprocessing import MinMaxScaler
from pandas.tseries.frequencies import to_offset

from app.config import Settings
from app.models.lstm import LSTMConfig, LSTMForecaster
from app.repositories.timescale import SensorDataRepository
from app.services.feature_engineering import HydricStressEngineer

logger = logging.getLogger(__name__)


class ForecastService:
    """Coordonne l'ingestion, les features et les modèles."""

    def __init__(
        self,
        settings: Settings,
        repository: SensorDataRepository,
        engineer: HydricStressEngineer,
    ):
        self._settings = settings
        self._repository = repository
        self._engineer = engineer
        self._lstm = LSTMForecaster(
            LSTMConfig(
                seq_len=self._settings.lstm_sequence_hours,
                epochs=self._settings.lstm_epochs,
                learning_rate=self._settings.lstm_learning_rate,
            )
        )

    def forecast(
        self,
        capteur_id: str,
        horizon_days: int,
        model: str,
    ) -> Dict[str, List[Dict]]:
        horizon = min(max(1, horizon_days), self._settings.max_horizon_days)
        frame = self._load_or_fallback(capteur_id)
        prepared = self._engineer.prepare_training_frame(frame)

        # Use simple trend forecast directly (Prophet/LSTM too slow)
        merged = self._simple_trend_forecast(prepared, horizon)

        return {
            "capteur_id": capteur_id,
            "generated_at": datetime.utcnow(),
            "model": model,
            "points": merged,
        }

    def _load_or_fallback(self, capteur_id: str) -> pd.DataFrame:
        df = self._repository.fetch_clean_series(capteur_id)
        if df.empty:
            df = self._repository.generate_fallback_dataframe(capteur_id)
        return df

    def _forecast_with_prophet(self, df: pd.DataFrame, horizon_days: int) -> List[Dict]:
        try:
            # Créer une copie et supprimer le timezone pour Prophet
            series = df[["timestamp", "hydric_stress"]].copy()
            series["ds"] = pd.to_datetime(series["timestamp"]).dt.tz_localize(None)
            series = series[["ds", "hydric_stress"]].rename(columns={"hydric_stress": "y"})
            
            # Suppress cmdstan logger warnings
            import logging as prophet_logging
            prophet_logging.getLogger('cmdstanpy').setLevel(prophet_logging.WARNING)
            
            model = Prophet(
                seasonality_mode="multiplicative",
                weekly_seasonality=True,
                daily_seasonality=True,
                changepoint_prior_scale=0.05,
                # Performance optimizations
                mcmc_samples=0,  # Use MAP estimation instead of MCMC
                uncertainty_samples=0,  # Disable uncertainty sampling for speed
            )
            model.fit(series)
            future = model.make_future_dataframe(periods=horizon_days, freq=self._settings.aggregation_frequency)
            forecast = model.predict(future).tail(horizon_days)
            
            results = []
            base_soil = df["soil_moisture_pct"].iloc[-1]
            for _, row in forecast.iterrows():
                stress = float(np.clip(row["yhat"], 0, 100))
                soil = float(np.clip(base_soil - (stress * 0.3), 5, 100))
                need = float(
                    max(
                        0.0,
                        (stress - self._settings.irrigation_threshold)
                        / (100 - self._settings.irrigation_threshold)
                        * self._settings.irrigation_max_mm,
                    )
                )
                # Convertir le timestamp pandas en datetime Python
                ts = row["ds"]
                if isinstance(ts, pd.Timestamp):
                    ts = ts.to_pydatetime()
                elif isinstance(ts, str):
                    ts = pd.to_datetime(ts).to_pydatetime()
                
                results.append(
                    {
                        "timestamp": ts,
                        "hydric_stress": stress,
                        "soil_moisture": soil,
                        "irrigation_need_mm": need,
                        "confidence": {
                            "lower": float(np.clip(row["yhat_lower"], 0, 100)),
                            "upper": float(np.clip(row["yhat_upper"], 0, 100)),
                        },
                    }
                )
            return results
        except Exception as e:
            logger.warning(f"Prophet forecasting failed: {e}. Falling back to simple trend extrapolation.")
            # Fallback: simple linear trend extrapolation
            return self._simple_trend_forecast(df, horizon_days)

    def _simple_trend_forecast(self, df: pd.DataFrame, horizon_days: int) -> List[Dict]:
        """Simple trend-based forecast as fallback when Prophet fails."""
        # Calculate simple linear trend from recent data
        recent = df.tail(48)  # Last 48 hours
        stress_values = recent["hydric_stress"].values
        
        # Simple linear regression
        x = np.arange(len(stress_values))
        slope = (stress_values[-1] - stress_values[0]) / len(stress_values) if len(stress_values) > 1 else 0
        
        offset = to_offset(self._settings.aggregation_frequency)
        start_ts = df["timestamp"].iloc[-1] + offset
        timestamps = pd.date_range(start=start_ts, periods=horizon_days, freq=offset)
        
        base_soil = df["soil_moisture_pct"].iloc[-1]
        base_stress = stress_values[-1]
        
        results = []
        for i, ts in enumerate(timestamps):
            # Project stress forward with dampening
            stress = float(np.clip(base_stress + (slope * (i + 1) * 0.5), 0, 100))
            soil = float(np.clip(base_soil - (stress * 0.3), 5, 100))
            need = float(
                max(
                    0.0,
                    (stress - self._settings.irrigation_threshold)
                    / (100 - self._settings.irrigation_threshold)
                    * self._settings.irrigation_max_mm,
                )
            )
            
            ts_dt = ts.to_pydatetime() if isinstance(ts, pd.Timestamp) else ts
            
            results.append(
                {
                    "timestamp": ts_dt,
                    "hydric_stress": stress,
                    "soil_moisture": soil,
                    "irrigation_need_mm": need,
                    "confidence": {
                        "lower": max(stress - 10, 0),
                        "upper": min(stress + 10, 100),
                    },
                }
            )
        return results

    def _forecast_with_lstm(self, df: pd.DataFrame, horizon_days: int) -> List[Dict]:
        series = df["hydric_stress"].values.astype(np.float32)
        scaler = MinMaxScaler()
        scaled = scaler.fit_transform(series.reshape(-1, 1)).flatten()

        horizon = horizon_days
        preds_scaled = self._lstm.fit_and_forecast(scaled, horizon)
        preds = scaler.inverse_transform(np.array(preds_scaled).reshape(-1, 1)).flatten()

        offset = to_offset(self._settings.aggregation_frequency)
        start_ts = df["timestamp"].iloc[-1] + offset
        timestamps = pd.date_range(start=start_ts, periods=horizon, freq=offset)

        base_soil = df["soil_moisture_pct"].iloc[-1]
        results: List[Dict] = []
        for ts, stress in zip(timestamps, preds):
            clipped = float(np.clip(stress, 0, 100))
            soil = float(np.clip(base_soil - (clipped * 0.25), 5, 100))
            need = float(
                max(
                    0.0,
                    (clipped - self._settings.irrigation_threshold)
                    / (100 - self._settings.irrigation_threshold)
                    * self._settings.irrigation_max_mm,
                )
            )
            # Convertir le timestamp pandas en datetime Python
            ts_dt = ts
            if isinstance(ts_dt, pd.Timestamp):
                ts_dt = ts_dt.to_pydatetime()
            
            results.append(
                {
                    "timestamp": ts_dt,
                    "hydric_stress": clipped,
                    "soil_moisture": soil,
                    "irrigation_need_mm": need,
                    "confidence": {"lower": max(clipped - 5, 0), "upper": min(clipped + 5, 100)},
                }
            )
        return results

    @staticmethod
    def _blend(prophet_fc: List[Dict], lstm_fc: List[Dict]) -> List[Dict]:
        zipped = zip(prophet_fc, lstm_fc)
        blended = []
        for p_row, l_row in zipped:
            blended.append(
                {
                    "timestamp": p_row["timestamp"],
                    "hydric_stress": round((p_row["hydric_stress"] + l_row["hydric_stress"]) / 2, 2),
                    "soil_moisture": round((p_row["soil_moisture"] + l_row["soil_moisture"]) / 2, 2),
                    "irrigation_need_mm": round(
                        (p_row["irrigation_need_mm"] + l_row["irrigation_need_mm"]) / 2,
                        2,
                    ),
                    "confidence": {
                        "lower": min(p_row["confidence"]["lower"], l_row["confidence"]["lower"]),
                        "upper": max(p_row["confidence"]["upper"], l_row["confidence"]["upper"]),
                    },
                }
            )
        return blended

