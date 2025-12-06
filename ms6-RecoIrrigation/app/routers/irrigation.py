from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..schemas import plan
from ..core.logic import IrrigationEngine
from ..core.config import settings
from ..db.database import get_db
from ..db import models
from ..services.ai_service import get_ai_service
import uuid
import httpx
import json
from datetime import datetime, time

router = APIRouter()

def save_to_unified_table(db: Session, parcel_id: int, volume_mm: float, duration_min: int, 
                          priority: str, reasoning: str, confidence: float = 0.85, 
                          model_used: str = "hybrid", optimal_time_str: str = "21:00:00"):
    """
    Save recommendation to the unified irrigation_recommendations table.
    This table is shared between MS6 and MS7 Dashboard.
    """
    # Parse optimal time
    try:
        optimal_hour = time.fromisoformat(optimal_time_str)
    except:
        optimal_hour = time(21, 0, 0)  # Default to 9 PM
    
    db_record = models.IrrigationRecommendation(
        parcelle_id=parcel_id,
        volume_mm=volume_mm,
        duration_minutes=duration_min,
        optimal_time=optimal_hour,
        priority=priority,
        reasoning=reasoning,
        model_used=model_used,
        confidence_score=confidence,
        applied=False
    )
    
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    
    return db_record

@router.post("/calculer", response_model=plan.IrrigationResponse)
def create_recommendation(request: plan.IrrigationRequest, db: Session = Depends(get_db)):
    
    # 1. Appel au moteur de calcul (Traitement données)
    resultat = IrrigationEngine.generer_plan(request)
    
    # 2. Création de l'objet réponse
    response = plan.IrrigationResponse(
        zone_id=request.zone_id,
        recommendation_id=str(uuid.uuid4()),
        volume_eau_m3=resultat["volume_eau_m3"],
        duree_minutes=resultat["duree_minutes"],
        horaire_debut=resultat["horaire_debut"],
        instruction_textuelle=resultat["instruction"],
        status="PLANIFIE"
    )
    
    # 3. Persistance (PostgreSQL) [cite: 61]
    # Création de l'enregistrement en base de données
    db_record = models.Recommendation(
        zone_id=response.zone_id,
        recommendation_id=response.recommendation_id,
        volume_eau_m3=response.volume_eau_m3,
        duree_minutes=response.duree_minutes,
        horaire_debut=response.horaire_debut,
        instruction_textuelle=response.instruction_textuelle,
        status=response.status
    )
    
    db.add(db_record)  # Prépare l'ajout
    db.commit()        # Valide l'écriture dans le disque dur <--- CRUCIAL
    db.refresh(db_record)
    
    return response

@router.get("/historique", response_model=List[plan.IrrigationResponse])
def get_irrigation_history(
    zone_id: Optional[int] = Query(None, description="Filtrer par zone_id"),
    limit: int = Query(50, description="Nombre maximum de résultats", ge=1, le=1000),
    offset: int = Query(0, description="Nombre d'éléments à ignorer", ge=0),
    db: Session = Depends(get_db)
):
    """
    Récupère l'historique des recommandations d'irrigation.
    
    - **zone_id**: Optionnel - Filtrer par une zone spécifique
    - **limit**: Nombre maximum de résultats (défaut: 50, max: 1000)
    - **offset**: Pagination - nombre d'éléments à ignorer (défaut: 0)
    """
    query = db.query(models.Recommendation)
    
    # Filtrer par zone_id si fourni
    if zone_id is not None:
        query = query.filter(models.Recommendation.zone_id == zone_id)
    
    # Trier par date de création décroissante (plus récent en premier)
    query = query.order_by(models.Recommendation.created_at.desc())
    
    # Pagination
    recommendations = query.offset(offset).limit(limit).all()
    
    # Convertir les modèles SQLAlchemy en schémas Pydantic
    response_list = []
    for rec in recommendations:
        response_list.append(plan.IrrigationResponse(
            zone_id=rec.zone_id,
            recommendation_id=rec.recommendation_id,
            volume_eau_m3=rec.volume_eau_m3,
            duree_minutes=rec.duree_minutes,
            horaire_debut=rec.horaire_debut,
            instruction_textuelle=rec.instruction_textuelle,
            status=rec.status
        ))
    
    return response_list


@router.post("/recommandation-ia", response_model=plan.AIRecommendationResponse)
async def create_ai_recommendation(request: plan.IrrigationRequest, db: Session = Depends(get_db)):
    """
    Génère une recommandation d'irrigation enrichie par l'Intelligence Artificielle.
    
    Combine le calcul scientifique traditionnel avec une analyse qualitative 
    générée par un LLM (Gemini Flash ou GPT-4o).
    
    - **zone_id**: Identifiant de la zone à irriguer
    - **culture_type**: Type de culture (ex: "Ble", "Mais", "Tomate")
    - **prediction**: Données météorologiques (ET0, température, etc.)
    - **regles**: Règles agronomiques (priorité, stade de culture, contraintes)
    
    Returns:
        Recommandation complète avec analyse IA incluant:
        - Volume et durée d'irrigation (calcul scientifique)
        - Analyse contextuelle du climat
        - Justification agronomique
        - Conseils pratiques additionnels
        - Score de confiance de l'IA
    """
    # Vérification de la configuration LLM
    if not settings.LLM_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="Service IA non configuré. Veuillez définir LLM_API_KEY dans les variables d'environnement."
        )
    
    # 1. Calcul scientifique (moteur déterministe)
    resultat_scientifique = IrrigationEngine.generer_plan(request)
    
    # 2. Préparation du contexte pour l'IA
    context_data = {
        "zone_id": request.zone_id,
        "culture_type": request.culture_type,
        "et0": request.prediction.evapotranspiration_et0,
        "temp_max": request.prediction.temp_max_demain,
        "probabilite_pluie": request.prediction.probabilite_pluie,
        "stress_index": request.prediction.stress_index,
        "priorite": request.regles.priorite,
        "stade_culture": request.regles.stade_culture,
        "contrainte_hydrique": request.regles.contrainte_hydrique
    }
    
    # 3. Appel au service IA
    ai_service = get_ai_service(
        api_key=settings.LLM_API_KEY,
        model=settings.LLM_MODEL
    )
    
    ai_analysis = await ai_service.generate_irrigation_advice(
        context_data=context_data,
        scientific_result=resultat_scientifique
    )
    
    # 4. Construction de la réponse enrichie
    recommendation_id = str(uuid.uuid4())
    
    response = plan.AIRecommendationResponse(
        zone_id=request.zone_id,
        recommendation_id=recommendation_id,
        volume_eau_m3=resultat_scientifique["volume_eau_m3"],
        duree_minutes=resultat_scientifique["duree_minutes"],
        horaire_debut=resultat_scientifique["horaire_debut"],
        instruction_textuelle=resultat_scientifique["instruction"],
        status="PLANIFIE_IA",
        analyse_contextuelle=ai_analysis.get("analyse_contextuelle", "N/A"),
        justification_agronomique=ai_analysis.get("justification_agronomique", "N/A"),
        conseils_additionnels=ai_analysis.get("conseils_additionnels", []),
        score_confiance=ai_analysis.get("score_confiance", 0),
        genere_par=ai_analysis.get("genere_par", settings.LLM_MODEL),
        raw_input={
            "context": context_data,
            "scientific_result": resultat_scientifique
        }
    )
    
    # 5. Persistance en base de données (optionnel - pour l'historique)
    # Note: Le modèle DB actuel ne supporte pas tous les champs IA
    # Vous pouvez soit étendre le modèle, soit stocker uniquement les données de base
    db_record = models.Recommendation(
        zone_id=response.zone_id,
        recommendation_id=response.recommendation_id,
        volume_eau_m3=response.volume_eau_m3,
        duree_minutes=response.duree_minutes,
        horaire_debut=response.horaire_debut,
        instruction_textuelle=f"[IA] {response.analyse_contextuelle[:100]}...",
        status=response.status
    )
    
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    
    return response


@router.post("/generate/{parcel_id}")
async def generate_recommendation_from_parcel(
    parcel_id: int,
    db: Session = Depends(get_db)
):
    """
    Endpoint d'orchestration: Génère une recommandation complète en récupérant
    automatiquement les données de MS4 (prévision eau) et MS5 (règles agro).
    
    Ce endpoint simule le flux réel:
    MS1 (Capteurs) → MS4 (Prévision) & MS5 (Règles) → MS6 (Recommandation)
    
    Args:
        parcel_id: ID de la parcelle pour laquelle générer la recommandation
        
    Returns:
        Recommandation d'irrigation complète avec analyse IA
    """
    
    # Configuration des URLs des microservices
    MS4_URL = "http://localhost:8003"  # MS4: Prévision Eau
    MS5_URL = "http://localhost:8004"  # MS5: Règles Agro
    MS1_URL = "http://localhost:8001"  # MS1: Capteurs (pour données actuelles)
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            
            # 1. Récupérer les dernières données capteurs depuis MS1
            try:
                sensor_response = await client.get(
                    f"{MS1_URL}/api/sensors/latest/{parcel_id}"
                )
                sensor_data = sensor_response.json() if sensor_response.status_code == 200 else {}
            except Exception as e:
                print(f"Erreur récupération MS1: {e}")
                sensor_data = {}
            
            # 2. Appeler MS4 pour obtenir la prévision d'eau
            try:
                ms4_response = await client.post(
                    f"{MS4_URL}/api/water/predict",
                    json={
                        "parcel_id": parcel_id,
                        "forecast_days": 3
                    }
                )
                ms4_data = ms4_response.json() if ms4_response.status_code == 200 else {}
            except Exception as e:
                print(f"Erreur récupération MS4: {e}")
                ms4_data = {}
            
            # 3. Appeler MS5 pour évaluer les règles agronomiques
            soil_humidity = sensor_data.get("measurements", {}).get("soil_humidity", 50.0)
            temperature = sensor_data.get("measurements", {}).get("temperature", 25.0)
            
            try:
                ms5_response = await client.post(
                    f"{MS5_URL}/api/rules/evaluate",
                    json={
                        "parcel_id": parcel_id,
                        "soil_humidity": soil_humidity,
                        "temperature": temperature,
                        "crop_stage": "GROWTH"
                    }
                )
                ms5_data = ms5_response.json() if ms5_response.status_code == 200 else {}
            except Exception as e:
                print(f"Erreur récupération MS5: {e}")
                ms5_data = {}
        
        # 4. Construire la requête pour MS6 avec les données collectées
        # Extraction des données MS4
        et0 = ms4_data.get("evapotranspiration_et0", 5.0)
        water_need = ms4_data.get("water_need_mm", 10.0)
        stress_index = ms4_data.get("stress_index", 0.5)
        
        # Extraction des données MS5
        priority = ms5_data.get("priority", "NORMALE")
        # Mapper la priorité MS5 vers le format attendu
        priority_map = {
            "URGENT": "CRITIQUE",
            "HIGH": "ELEVEE",
            "MEDIUM": "NORMALE",
            "LOW": "BASSE"
        }
        priorite_agro = priority_map.get(priority, "NORMALE")
        
        # 5. Créer la requête d'irrigation
        irrigation_request = plan.IrrigationRequest(
            zone_id=parcel_id,
            culture_type=sensor_data.get("crop_type", "Wheat"),
            prediction=plan.PredictionData(
                stress_index=stress_index,
                temp_max_demain=temperature + 2.0,  # Simulation
                probabilite_pluie=0.2,  # Simulation
                evapotranspiration_et0=et0
            ),
            regles=plan.RuleData(
                priorite=priorite_agro,
                stade_culture="GROWTH",
                contrainte_hydrique="Arrosage recommandé tôt le matin"
            )
        )
        
        # 6. Générer la recommandation avec l'IA si disponible
        if settings.LLM_API_KEY:
            # Utiliser l'endpoint IA
            resultat_scientifique = IrrigationEngine.generer_plan(irrigation_request)
            
            context_data = {
                "zone_id": irrigation_request.zone_id,
                "culture_type": irrigation_request.culture_type,
                "et0": irrigation_request.prediction.evapotranspiration_et0,
                "temp_max": irrigation_request.prediction.temp_max_demain,
                "probabilite_pluie": irrigation_request.prediction.probabilite_pluie,
                "stress_index": irrigation_request.prediction.stress_index,
                "priorite": irrigation_request.regles.priorite,
                "stade_culture": irrigation_request.regles.stade_culture,
                "contrainte_hydrique": irrigation_request.regles.contrainte_hydrique
            }
            
            ai_service = get_ai_service(
                api_key=settings.LLM_API_KEY,
                model=settings.LLM_MODEL
            )
            
            ai_analysis = await ai_service.generate_irrigation_advice(
                context_data=context_data,
                scientific_result=resultat_scientifique
            )
            
            recommendation_id = str(uuid.uuid4())
            
            response = {
                "zone_id": irrigation_request.zone_id,
                "parcel_id": parcel_id,
                "recommendation_id": recommendation_id,
                "priority": priority,
                "volume_mm": water_need,
                "volume_m3": resultat_scientifique["volume_eau_m3"],
                "duree_minutes": resultat_scientifique["duree_minutes"],
                "horaire_debut": resultat_scientifique["horaire_debut"].isoformat(),
                "instruction": resultat_scientifique["instruction"],
                "status": "PLANIFIE_IA",
                "analyse_contextuelle": ai_analysis.get("analyse_contextuelle", "N/A"),
                "justification_agronomique": ai_analysis.get("justification_agronomique", "N/A"),
                "conseils_additionnels": ai_analysis.get("conseils_additionnels", []),
                "score_confiance": ai_analysis.get("score_confiance", 0),
                "genere_par": ai_analysis.get("genere_par", settings.LLM_MODEL),
                "source_data": {
                    "ms4": ms4_data,
                    "ms5": ms5_data,
                    "ms1": sensor_data
                },
                "actions": [{
                    "type": "IRRIGATION",
                    "volume_mm": water_need,
                    "duration_minutes": resultat_scientifique["duree_minutes"],
                    "priority": priority
                }]
            }
            
            # Save to unified table (MS6 + MS7)
            reasoning = f"{ai_analysis.get('analyse_contextuelle', '')} | {ai_analysis.get('justification_agronomique', '')}"
            # Convert confidence from percentage (0-100) to decimal (0-1)
            confidence_raw = ai_analysis.get("score_confiance", 85)
            confidence_decimal = confidence_raw / 100.0 if confidence_raw > 1 else confidence_raw
            
            save_to_unified_table(
                db=db,
                parcel_id=parcel_id,
                volume_mm=water_need,
                duration_min=resultat_scientifique["duree_minutes"],
                priority=priority,
                reasoning=reasoning[:500],  # Truncate if too long
                confidence=confidence_decimal,
                model_used=settings.LLM_MODEL
            )
            
            # Also save to legacy table for backward compatibility
            db_record = models.Recommendation(
                zone_id=parcel_id,
                recommendation_id=recommendation_id,
                volume_eau_m3=resultat_scientifique["volume_eau_m3"],
                duree_minutes=resultat_scientifique["duree_minutes"],
                horaire_debut=resultat_scientifique["horaire_debut"],
                instruction_textuelle=f"[IA] {ai_analysis.get('analyse_contextuelle', '')[:100]}...",
                status="PLANIFIE_IA"
            )
            
            db.add(db_record)
            db.commit()
            
            return response
        else:
            # Mode sans IA - calcul scientifique uniquement
            resultat = IrrigationEngine.generer_plan(irrigation_request)
            recommendation_id = str(uuid.uuid4())
            
            response = {
                "zone_id": parcel_id,
                "parcel_id": parcel_id,
                "recommendation_id": recommendation_id,
                "priority": priority,
                "volume_mm": water_need,
                "volume_m3": resultat["volume_eau_m3"],
                "duree_minutes": resultat["duree_minutes"],
                "horaire_debut": resultat["horaire_debut"].isoformat(),
                "instruction": resultat["instruction"],
                "status": "PLANIFIE",
                "method": "scientific_calculation",
                "source_data": {
                    "ms4": ms4_data,
                    "ms5": ms5_data,
                    "ms1": sensor_data
                },
                "actions": [{
                    "type": "IRRIGATION",
                    "volume_mm": water_need,
                    "duration_minutes": resultat["duree_minutes"],
                    "priority": priority
                }]
            }
            
            # Save to unified table (MS6 + MS7)
            save_to_unified_table(
                db=db,
                parcel_id=parcel_id,
                volume_mm=water_need,
                duration_min=resultat["duree_minutes"],
                priority=priority,
                reasoning=resultat["instruction"],
                confidence=0.75,
                model_used="scientific_calculation"
            )
            
            # Also save to legacy table
            db_record = models.Recommendation(
                zone_id=parcel_id,
                recommendation_id=recommendation_id,
                volume_eau_m3=resultat["volume_eau_m3"],
                duree_minutes=resultat["duree_minutes"],
                horaire_debut=resultat["horaire_debut"],
                instruction_textuelle=resultat["instruction"],
                status="PLANIFIE"
            )
            
            db.add(db_record)
            db.commit()
            
            return response
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la génération de la recommandation: {str(e)}"
        )
