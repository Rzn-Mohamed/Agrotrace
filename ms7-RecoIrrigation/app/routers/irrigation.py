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

router = APIRouter()

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