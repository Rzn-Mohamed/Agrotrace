import math
from datetime import datetime, timedelta

class IrrigationEngine:
    """
    Moteur de calcul pour déterminer la dose et le calendrier.
    Basé sur les principes KC (Crop Coefficient) simplifiés.
    """
    
    @staticmethod
    def calculer_besoin_net(et0: float, stress_index: float, culture: str) -> float:
        # Coefficient cultural (Kc) fictif selon le type de plante
        kc_map = {"Ble": 1.1, "Mais": 1.2, "Tomate": 0.9}
        kc = kc_map.get(culture, 1.0)
        
        # Formule simplifiée : (ET0 * Kc) ajusté par le stress actuel
        besoin_mm = (et0 * kc) * stress_index
        return round(besoin_mm, 2)

    @staticmethod
    def generer_plan(request_data) -> dict:
        pred = request_data.prediction
        regles = request_data.regles
        
        # 1. Calcul scientifique du volume (mm d'eau -> m3 pour 1 hectare standard)
        besoin_mm = IrrigationEngine.calculer_besoin_net(
            pred.evapotranspiration_et0, 
            pred.stress_index, 
            request_data.culture_type
        )
        
        # Conversion 1mm/ha = 10 m3
        volume_m3 = besoin_mm * 10 

        # 2. Application des contraintes (RèglesAgro)
        duree = int(volume_m3 * 15) # Hypothèse : débit pompe de 4 m3/h
        
        now = datetime.now()
        
        # Logique de calendrier [cite: 57]
        if regles.priorite == "CRITIQUE":
            # Irrigation immédiate mais hors heures chaudes (règle fictive)
            start_time = now + timedelta(minutes=10)
            instruction = "IRRIGATION D'URGENCE REQUISE"
        elif pred.probabilite_pluie > 70:
            volume_m3 = 0
            duree = 0
            start_time = now
            instruction = "Pluie prévue, irrigation annulée."
        else:
            # Irrigation nocturne par défaut
            start_time = now.replace(hour=22, minute=0, second=0)
            if start_time < now:
                start_time += timedelta(days=1)
            instruction = "Irrigation planifiée pour la nuit."

        return {
            "volume_eau_m3": volume_m3,
            "duree_minutes": duree,
            "horaire_debut": start_time,
            "instruction": instruction
        }