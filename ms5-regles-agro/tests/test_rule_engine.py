"""Tests pour le moteur de règles."""

import pytest
from app.config import Settings
from app.rules.engine import RuleEngine, initialize_rule_engine
from app.schemas.rules import (
    CropType,
    GrowthStage,
    RuleEvaluationRequest,
    SoilType,
)


def test_rule_engine_initialization():
    """Test que le moteur de règles s'initialise correctement."""
    settings = Settings()
    engine = initialize_rule_engine(settings)
    assert len(engine._rules) > 0


def test_irrigation_urgente_rule():
    """Test de la règle d'irrigation urgente."""
    settings = Settings()
    engine = initialize_rule_engine(settings)

    # Cas critique: humidité très faible + température élevée
    request = RuleEvaluationRequest(
        parcelle_id="TEST_001",
        temperature=32.0,
        humidite=50.0,
        humidite_sol=15.0,  # < seuil critique (20%)
        irrigation_need_mm=20.0,
    )

    recommendations = engine.evaluate(request)
    assert len(recommendations) > 0
    assert any(r.rule_id == "IRRIGATION_URGENTE" for r in recommendations)
    assert any(r.priority == "critical" for r in recommendations)


def test_humidite_faible_rule():
    """Test de la règle d'humidité faible."""
    settings = Settings()
    engine = initialize_rule_engine(settings)

    request = RuleEvaluationRequest(
        parcelle_id="TEST_002",
        temperature=25.0,
        humidite=60.0,
        humidite_sol=30.0,  # < seuil bas (35%)
    )

    recommendations = engine.evaluate(request)
    assert any(r.rule_id == "HUMIDITE_FAIBLE" for r in recommendations)


def test_stress_hydrique_rule():
    """Test de la règle de stress hydrique."""
    settings = Settings()
    engine = initialize_rule_engine(settings)

    request = RuleEvaluationRequest(
        parcelle_id="TEST_003",
        temperature=25.0,
        humidite=60.0,
        humidite_sol=45.0,
        hydric_stress=65.0,  # > seuil (50%)
        irrigation_need_mm=12.0,
    )

    recommendations = engine.evaluate(request)
    assert any(r.rule_id == "STRESS_HYDRIQUE" for r in recommendations)


def test_temperature_critique_rule():
    """Test de la règle de température critique."""
    settings = Settings()
    engine = initialize_rule_engine(settings)

    request = RuleEvaluationRequest(
        parcelle_id="TEST_004",
        temperature=38.0,  # > seuil critique (35°C)
        humidite=40.0,
        humidite_sol=50.0,
    )

    recommendations = engine.evaluate(request)
    assert any(r.rule_id == "TEMPERATURE_CRITIQUE" for r in recommendations)
    assert any(r.priority == "critical" for r in recommendations)


def test_ph_inadequat_rule():
    """Test de la règle de pH inadéquat."""
    settings = Settings()
    engine = initialize_rule_engine(settings)

    # pH trop bas
    request = RuleEvaluationRequest(
        parcelle_id="TEST_005",
        temperature=25.0,
        humidite=60.0,
        humidite_sol=50.0,
        niveau_ph=5.5,  # < seuil min (6.0)
    )

    recommendations = engine.evaluate(request)
    assert any(r.rule_id == "PH_INADEGUAT" for r in recommendations)

    # pH trop haut
    request2 = RuleEvaluationRequest(
        parcelle_id="TEST_006",
        temperature=25.0,
        humidite=60.0,
        humidite_sol=50.0,
        niveau_ph=8.0,  # > seuil max (7.5)
    )

    recommendations2 = engine.evaluate(request2)
    assert any(r.rule_id == "PH_INADEGUAT" for r in recommendations2)


def test_croissance_floraison_rule():
    """Test de la règle de croissance en floraison."""
    settings = Settings()
    engine = initialize_rule_engine(settings)

    request = RuleEvaluationRequest(
        parcelle_id="TEST_007",
        temperature=25.0,
        humidite=60.0,
        humidite_sol=35.0,  # < 40%
        growth_stage=GrowthStage.FLORAISON,
    )

    recommendations = engine.evaluate(request)
    assert any(r.rule_id == "CROISSANCE_FLORAISON" for r in recommendations)


def test_sol_sableux_rule():
    """Test de la règle pour sol sableux."""
    settings = Settings()
    engine = initialize_rule_engine(settings)

    request = RuleEvaluationRequest(
        parcelle_id="TEST_008",
        temperature=25.0,
        humidite=60.0,
        humidite_sol=25.0,  # < 30%
        soil_type=SoilType.SABLEUX,
    )

    recommendations = engine.evaluate(request)
    assert any(r.rule_id == "SOL_SABLEUX" for r in recommendations)


