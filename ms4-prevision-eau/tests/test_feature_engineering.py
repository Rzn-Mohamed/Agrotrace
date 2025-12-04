from datetime import datetime, timedelta, timezone

import pandas as pd

from app.config import Settings
from app.services.feature_engineering import HydricStressEngineer


def test_prepare_training_frame_generates_expected_columns():
    now = datetime.now(timezone.utc)
    timestamps = [now - timedelta(hours=i) for i in range(48)]
    df = pd.DataFrame(
        {
            "timestamp": timestamps,
            "temperature": [22 + 0.1 * i for i in range(48)],
            "humidite": [60 for _ in range(48)],
            "humidite_sol": [45 for _ in range(48)],
            "niveau_ph": [6.5 for _ in range(48)],
            "luminosite": [400 for _ in range(48)],
        }
    )

    engineer = HydricStressEngineer(Settings())
    result = engineer.prepare_training_frame(df)

    assert "hydric_stress" in result.columns
    assert "irrigation_need_mm" in result.columns
    assert not result["hydric_stress"].isna().any()

