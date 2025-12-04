import requests
import random
import time
import json

# URL de TON microservice local
URL = "http://localhost:8000/api/v1/irrigation/calculer"

CULTURES = ["Ble", "Mais", "Tomate", "Vigne"]
STADES = ["Croissance", "Floraison", "Recolte"]

def generate_mock_data():
    """Simule la sortie combinée des services PrevisionEau + ReglesAgro"""
    return {
        "zone_id": random.randint(1, 50),
        "culture_type": random.choice(CULTURES),
        "prediction": {
            "stress_index": round(random.uniform(0.1, 0.9), 2),
            "temp_max_demain": round(random.uniform(20.0, 35.0), 1),
            "probabilite_pluie": random.randint(0, 100),
            "evapotranspiration_et0": round(random.uniform(3.0, 7.0), 2)
        },
        "regles": {
            "priorite": random.choice(["NORMALE", "ELEVEE", "CRITIQUE"]),
            "stade_culture": random.choice(STADES),
            "contrainte_hydrique": "Aucune"
        }
    }

if __name__ == "__main__":
    print(" Démarrage de la simulation des services amont...")
    while True:
        data = generate_mock_data()
        try:
            response = requests.post(URL, json=data)
            if response.status_code == 200:
                rec = response.json()
                print(f"[OK] Zone {data['zone_id']} -> {rec['volume_eau_m3']}m3 ({rec['instruction_textuelle']})")
            else:
                print(f"[ERREUR] {response.status_code} : {response.text}")
        except Exception as e:
            print(f"[CONNEXION ECHOUEE] Ton microservice est-il lancé ? {e}")
        
        time.sleep(2) # Envoie une requête toutes les 2 secondes