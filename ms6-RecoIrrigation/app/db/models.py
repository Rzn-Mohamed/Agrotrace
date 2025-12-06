# app/db/models.py
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, Numeric, Time
from sqlalchemy.sql import func
from .database import Base

class IrrigationRecommendation(Base):
    """
    Unified table for irrigation recommendations (MS6).
    Matches the schema in database/init_unified.sql
    """
    __tablename__ = "irrigation_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    parcelle_id = Column(Integer, index=True, nullable=False)
    recommendation_date = Column(DateTime(timezone=True), server_default=func.now())
    
    # AI-generated values
    volume_mm = Column(Numeric(5, 2), nullable=False)
    duration_minutes = Column(Integer)
    optimal_time = Column(Time)
    priority = Column(String(20), nullable=False)  # LOW, MEDIUM, HIGH, URGENT
    
    # Input context
    current_soil_moisture = Column(Numeric(5, 2))
    predicted_water_need = Column(Numeric(5, 2))
    weather_forecast = Column(Text)  # JSON stored as text
    
    # AI model info
    model_used = Column(String(50))
    confidence_score = Column(Numeric(3, 2))
    reasoning = Column(Text)
    
    # Status
    applied = Column(Boolean, default=False)
    applied_at = Column(DateTime(timezone=True))
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

# Keep legacy model for backward compatibility (if needed)
class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer, index=True)
    recommendation_id = Column(String, unique=True, index=True) # UUID unique
    
    # Données agronomiques calculées
    volume_eau_m3 = Column(Float)
    duree_minutes = Column(Integer)
    horaire_debut = Column(DateTime)
    instruction_textuelle = Column(String)
    
    status = Column(String, default="GENERATED")
    
    # Audit (date de création automatique)
    created_at = Column(DateTime(timezone=True), server_default=func.now())