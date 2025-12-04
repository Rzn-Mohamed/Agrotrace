from app.services.forecasting import ForecastService
from app.config import Settings
from app.repositories.timescale import SensorDataRepository
from app.services.feature_engineering import HydricStressEngineer


def test_blend_averages_values():
    settings = Settings()
    service = ForecastService(
        settings=settings,
        repository=SensorDataRepository(settings),
        engineer=HydricStressEngineer(settings),
    )

    prophet_points = [
        {
            "timestamp": "2025-01-01T00:00:00Z",
            "hydric_stress": 40.0,
            "soil_moisture": 60.0,
            "irrigation_need_mm": 4.0,
            "confidence": {"lower": 35.0, "upper": 45.0},
        }
    ]
    lstm_points = [
        {
            "timestamp": "2025-01-01T00:00:00Z",
            "hydric_stress": 50.0,
            "soil_moisture": 55.0,
            "irrigation_need_mm": 6.0,
            "confidence": {"lower": 40.0, "upper": 55.0},
        }
    ]

    blended = service._blend(prophet_points, lstm_points)
    point = blended[0]

    assert point["hydric_stress"] == 45.0
    assert point["soil_moisture"] == 57.5
    assert point["irrigation_need_mm"] == 5.0
    assert point["confidence"]["lower"] == 35.0
    assert point["confidence"]["upper"] == 55.0

