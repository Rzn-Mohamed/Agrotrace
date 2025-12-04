"""Tests pour le service de règles."""

import pytest
from app.config import Settings
from app.repositories.postgres import AgriculturalRepository
from app.rules.engine import initialize_rule_engine
from app.schemas.rules import RuleEvaluationRequest
from app.services.rule_service import RuleService


def test_rule_service_evaluation():
    """Test que le service évalue correctement les règles."""
    settings = Settings()
    repository = AgriculturalRepository(settings)
    engine = initialize_rule_engine(settings)
    service = RuleService(engine, repository)

    request = RuleEvaluationRequest(
        parcelle_id="TEST_SERVICE_001",
        temperature=32.0,
        humidite=50.0,
        humidite_sol=18.0,  # Critique
        hydric_stress=70.0,
        irrigation_need_mm=18.0,
    )

    response = service.evaluate_rules(request)
    assert response.parcelle_id == "TEST_SERVICE_001"
    assert len(response.recommendations) > 0
    assert response.triggered_rules_count > 0
    assert "temperature" in response.context
    assert "humidite_sol" in response.context


