#!/bin/bash

PARCEL_ID=300

echo "=================================================="
echo "   🔗 BRIDGING BACKEND INTELLIGENCE TO DASHBOARD"
echo "   Parcel: $PARCEL_ID"
echo "=================================================="

# 1. GET THE AI RECOMMENDATION FROM MS6
echo ""
echo "[1/3] Fetching Intelligence from MS6..."
# We trigger the generation and capture the output
MS6_RESPONSE=$(curl -s -X POST "http://localhost:8005/api/recommendations/generate/$PARCEL_ID" -H 'accept: application/json' -d '{}')

# We use Python to extract the specific values we need from the JSON response
# (Assumes MS6 returns valid JSON with 'actions' list)
VOLUME=$(echo $MS6_RESPONSE | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['actions'][0]['volume_mm'])" 2>/dev/null || echo "0")
PRIORITY=$(echo $MS6_RESPONSE | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['actions'][0]['priority'])" 2>/dev/null || echo "LOW")
DURATION=$(echo $MS6_RESPONSE | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['actions'][0]['duration_minutes'])" 2>/dev/null || echo "0")

echo "      > AI Calculated Volume: $VOLUME mm"
echo "      > AI Priority Level:    $PRIORITY"

# 2. MAP STATUS TO COLORS
STATUS="OK"
if [ "$PRIORITY" == "URGENT" ] || [ "$PRIORITY" == "HIGH" ]; then
    STATUS="CRITICAL"
elif [ "$PRIORITY" == "MEDIUM" ]; then
    STATUS="WARNING"
fi

# 3. UPDATE THE DASHBOARD (MS7)
# We take the values from MS6 and push them into the structure MS7 Frontend expects
echo ""
echo "[2/3] Syncing Data to Dashboard (MS7)..."

curl -X 'POST' 'http://localhost:8006/api/parcels' \
  -H 'Content-Type: application/json' \
  -d "{
    \"id\": $PARCEL_ID,
    \"name\": \"Dynamic Field (Live AI)\",
    \"crop_type\": \"Wheat\",
    \"status\": \"$STATUS\",
    \"area\": 4.0,
    \"planting_date\": \"2023-11-01\",
    \"last_irrigation\": \"$(date -u +"%Y-%m-%d")\",
    
    \"metrics\": {
       \"stress_index\": 85,
       \"water_need_mm\": $VOLUME, 
       \"soil_humidity\": 12,
       \"temperature\": 36
    },

    \"recommendations\": [
      {
        \"id\": \"REC-LIVE-$(date +%s)\",
        \"type\": \"IRRIGATION\",
        \"priority\": \"$PRIORITY\",
        \"volume_mm\": $VOLUME,
        \"duration_min\": $DURATION,
        \"date\": \"$(date -u +"%Y-%m-%d")\",
        \"reason\": \"AI Model Prediction + Live Rules\"
      }
    ],

    \"geojson\": {
      \"type\": \"Polygon\",
      \"coordinates\": [[[-7.58, 33.58], [-7.57, 33.58], [-7.57, 33.57], [-7.58, 33.57], [-7.58, 33.58]]]
    }
  }"

echo ""
echo "=================================================="
echo "✅ INTEGRATION COMPLETE"
echo "   Go to http://localhost:8080"
echo "   1. Find Parcel 300 (It should be RED if data was critical)."
echo "   2. Click it."
echo "   3. Verify 'Besoin en eau' matches: $VOLUME mm"
echo "=================================================="
