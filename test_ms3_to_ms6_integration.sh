#!/bin/bash

PARCEL_ID=500
NAME="Champs Patates (Drone Alert)"

echo "=================================================="
echo "🛡️ TEST INTEGRATION MS3 (Vision) -> MS6 (Reco)"
echo "   Cible : Section 'Recommandations' du Dashboard"
echo "=================================================="

# 1. SIMULATION DU RESULTAT MS3 (Vision Plante)
# Imaginons que le drone a volé et a détecté un début de maladie
DRONE_RESULT="Fungi_Risk_High"
echo "[1/4] MS3 (Vision) : Analyse d'image terminée -> Risque détecté : $DRONE_RESULT"

# 2. SIMULATION DU RESULTAT MS4 (Prévision Eau)
# L'IA prédit un besoin fort car la plante est malade et a soif
WATER_PRED=35.5
echo "[2/4] MS4 (IA Prévision) : Calcul du déficit hydrique -> $WATER_PRED mm"

# 3. SIMULATION DU RESULTAT MS5 (Règles Agro)
# Règle : Si Maladie + Stress Hydrique = PRIORITÉ ABSOLUE
PRIORITY="CRITICAL"
REASON="Traitement Curatif + Irrigation (Alerte Drone MS3)"
echo "[3/4] MS5 (Règles) : Application règle sanitaire -> Priorité $PRIORITY"

# 4. GENERATION ET ENVOI A MS7 (DASHBOARD)
# C'est ici qu'on remplit la section <section 3> de ton HTML
echo "[4/4] MS6 -> MS7 : Envoi de la recommandation au Dashboard..."

curl -s -X POST 'http://localhost:8006/api/parcels' \
  -H 'Content-Type: application/json' \
  -d "{
    \"id\": $PARCEL_ID,
    \"name\": \"$NAME\",
    \"crop_type\": \"Pomme de Terre\",
    \"status\": \"CRITICAL\", 
    \"area\": 3.5,
    \"planting_date\": \"2023-09-20\",
    \"last_irrigation\": \"2023-10-20\",
    
    \"metrics\": {
       \"stress_index\": 90,
       \"water_need_mm\": $WATER_PRED,
       \"soil_humidity\": 15,
       \"temperature\": 29
    },

    \"geojson\": {
      \"type\": \"Polygon\",
      \"coordinates\": [[[-7.592, 33.582], [-7.582, 33.582], [-7.582, 33.572], [-7.592, 33.572], [-7.592, 33.582]]]
    },

    \"recommendations\": [
      {
        \"id\": \"REC-DRONE-001\",
        \"type\": \"TRAITEMENT_PHYTOSANITAIRE\",
        \"priority\": \"$PRIORITY\",
        \"volume_mm\": $WATER_PRED,
        \"duration_min\": 60,
        \"date\": \"$(date -u +"%Y-%m-%d")\",
        \"reason\": \"$REASON\"
      },
      {
        \"id\": \"REC-AUTO-002\",
        \"type\": \"SURVEILLANCE\",
        \"priority\": \"HIGH\",
        \"volume_mm\": 0,
        \"duration_min\": 0,
        \"date\": \"$(date -u -v+1d +"%Y-%m-%d")\",
        \"reason\": \"Suivi évolution maladie (MS3)\"
      }
    ]
  }" > /dev/null

echo ""
echo "✅ DONNÉES ENVOYÉES !"
echo "👉 Va sur http://localhost:8080"
echo "👉 Clique sur la parcelle ROUGE (Champs Patates)"
echo "👉 Regarde la section 'Recommandations' en bas du popup."
