# app/db/models.py
from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from .database import Base

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