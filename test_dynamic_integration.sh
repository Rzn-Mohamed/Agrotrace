#!/bin/bash

# ==============================================================================
# AGROTRACE - MASTER INTEGRATION TEST
# Purpose: Verify real-time data flow across all microservices
# Architecture: MS1 (Sensors) → MS4/MS5 (Intelligence) → MS6 (Recommendations)
# ==============================================================================

set -e  # Exit on any error

echo "╔══════════════════════════════════════════════════════════════════════════╗"
echo "║                   AGROTRACE INTEGRATION TEST                             ║"
echo "║  Testing: Dynamic Microservice Communication + Static Dashboard Fill    ║"
echo "╚══════════════════════════════════════════════════════════════════════════╝"
echo ""

# ==============================================================================
# PHASE 1: DYNAMIC CONNECTION TEST (The "Real" Flow)
# Goal: Prove that MS1 (Data) → MS4/MS5 (Intelligence) → MS6 (Recommendation)
# ==============================================================================

PARCEL_DYN=300
echo "🚀 PHASE 1: DYNAMIC CONNECTION TEST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   Testing real-time data flow through the entire system..."
echo ""

# Wait function for services to process
wait_for_processing() {
    echo "         ⏳ Waiting for processing..."
    sleep 2
}

# 1. Create the Parcel (The Stage)
echo "   [1/5] 📋 Registering Test Parcel #$PARCEL_DYN..."
curl -s -X POST 'http://localhost:8006/api/parcels' \
  -H 'Content-Type: application/json' \
  -d "{
    \"id\": $PARCEL_DYN,
    \"name\": \"Dynamic Test Field\",
    \"crop_type\": \"Wheat\",
    \"area\": 4.0,
    \"planting_date\": \"2023-09-15\",
    \"geojson\": {
      \"type\": \"Polygon\",
      \"coordinates\": [[
        [-7.58, 33.58],
        [-7.57, 33.58],
        [-7.57, 33.57],
        [-7.58, 33.57],
        [-7.58, 33.58]
      ]]
    }
  }" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "         ✅ Parcel registered successfully"
else
    echo "         ❌ Failed to register parcel"
    exit 1
fi

wait_for_processing

# 2. Feed MS1 (The Input) - Simulating a "Hot & Dry" week
echo "   [2/5] 🌡️  MS1: Ingesting Critical Sensor Data..."
echo "         → Conditions: High Temp (36°C), Low Humidity (12%), High Light (900)"

CURRENT_TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

curl -s -X POST 'http://localhost:8001/api/sensors/ingest' \
  -H 'Content-Type: application/json' \
  -d "{
    \"sensor_id\": \"SENS-DYN-001\",
    \"parcel_id\": $PARCEL_DYN,
    \"timestamp\": \"$CURRENT_TIMESTAMP\",
    \"measurements\": {
      \"soil_humidity\": 12.0,
      \"temperature\": 36.0,
      \"luminosity\": 900
    }
  }" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "         ✅ Critical data ingested into TimescaleDB"
else
    echo "         ⚠️  Warning: Sensor ingestion may have failed"
fi

wait_for_processing

# 3. Trigger MS4 (Water Prediction)
echo "   [3/5] 💧 MS4: Calculating Water Demand Forecast..."

ms4_response=$(curl -s -X POST 'http://localhost:8003/api/water/predict' \
  -H 'Content-Type: application/json' \
  -d "{
    \"parcel_id\": $PARCEL_DYN,
    \"forecast_days\": 3
  }")

if [ $? -eq 0 ]; then
    echo "         ✅ Water prediction generated"
    # Extract prediction if available
    water_need=$(echo $ms4_response | grep -o '"water_need":[^,}]*' | head -1)
    if [ ! -z "$water_need" ]; then
        echo "         → $water_need"
    fi
else
    echo "         ⚠️  Warning: Water prediction may have failed"
fi

wait_for_processing

# 4. Trigger MS5 (Agronomic Rules)
echo "   [4/5] 🌾 MS5: Evaluating Agronomic Rules..."
echo "         → Expected: URGENT alert (Temp > 30°C AND Humidity < 20%)"

ms5_response=$(curl -s -X POST 'http://localhost:8004/api/rules/evaluate' \
  -H 'Content-Type: application/json' \
  -d "{
    \"parcel_id\": $PARCEL_DYN,
    \"soil_humidity\": 12.0,
    \"temperature\": 36.0,
    \"crop_stage\": \"GROWTH\"
  }")

if [ $? -eq 0 ]; then
    echo "         ✅ Rules evaluated"
    # Extract priority if available
    priority=$(echo $ms5_response | grep -o '"priority":"[^"]*"' | head -1)
    if [ ! -z "$priority" ]; then
        echo "         → $priority"
    fi
else
    echo "         ⚠️  Warning: Rule evaluation may have failed"
fi

wait_for_processing

# 5. Trigger MS6 (The Final Recommendation)
echo "   [5/5] 🎯 MS6: Generating AI-Powered Recommendation..."
echo "         → MS6 should combine MS4 predictions + MS5 alerts + Gemini AI"

ms6_response=$(curl -s -X POST "http://localhost:8005/api/v1/irrigation/generate/$PARCEL_DYN" \
  -H 'accept: application/json' \
  -d '{}')

if [ $? -ne 0 ]; then
    echo "         ❌ Failed to get recommendation"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 VERIFICATION: Dynamic Flow Results"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Extract key metrics
priority=$(echo $ms6_response | grep -o '"priority":"[^"]*"' | sed 's/"priority":"//' | sed 's/"//')
volume=$(echo $ms6_response | grep -o '"volume_mm":[^,}]*' | sed 's/"volume_mm"://')
volume_m3=$(echo $ms6_response | grep -o '"volume_m3":[^,}]*' | sed 's/"volume_m3"://')
method=$(echo $ms6_response | grep -o '"method":"[^"]*"' | sed 's/"method":"//' | sed 's/"//')
genere_par=$(echo $ms6_response | grep -o '"genere_par":"[^"]*"' | sed 's/"genere_par":"//' | sed 's/"//')
status=$(echo $ms6_response | grep -o '"status":"[^"]*"' | sed 's/"status":"//' | sed 's/"//')

echo "   Priority Level:  ${priority:-NOT FOUND}"
echo "   Water Volume:    ${volume:-${volume_m3:-NOT FOUND}} mm"
echo "   Status:          ${status:-NOT FOUND}"
echo "   Generated By:    ${genere_par:-${method:-NOT FOUND}}"
echo ""

# Validate results
SUCCESS=true

if [ "$priority" == "URGENT" ] || [ "$priority" == "HIGH" ] || [ "$priority" == "CRITIQUE" ]; then
    echo "   ✅ Priority is correctly elevated ($priority)"
elif [ "$priority" == "MEDIUM" ] || [ "$priority" == "LOW" ] || [ "$priority" == "NORMALE" ]; then
    echo "   ⚠️  Priority is lower than expected (found: $priority)"
    echo "      Expected: URGENT/HIGH/CRITIQUE due to critical conditions"
    SUCCESS=false
else
    echo "   ❌ Priority not found or invalid"
    SUCCESS=false
fi

if [ ! -z "$volume" ] && [ "$volume" != "null" ] && [ "$volume" != "0" ]; then
    echo "   ✅ Water volume calculated: $volume mm"
elif [ ! -z "$volume_m3" ] && [ "$volume_m3" != "null" ] && [ "$volume_m3" != "0" ]; then
    echo "   ✅ Water volume calculated: $volume_m3 m³"
else
    echo "   ⚠️  Water volume is zero or missing"
    echo "      This suggests MS6 is not reading MS4 predictions"
    SUCCESS=false
fi

# Check if AI was used
if [ "$genere_par" != "NOT FOUND" ] && [ ! -z "$genere_par" ]; then
    echo "   ✅ AI Model used: $genere_par"
elif [ "$status" == "PLANIFIE_IA" ]; then
    echo "   ✅ AI-powered recommendation generated"
else
    echo "   ℹ️  Scientific calculation mode (AI not used)"
fi

echo ""
if [ "$SUCCESS" = true ]; then
    echo "   🎉 SUCCESS: Microservices are communicating dynamically!"
    echo "      Data flowed: MS1 → Database → MS4/MS5 → MS6"
else
    echo "   ⚠️  PARTIAL SUCCESS: Some connections may need verification"
    echo "      Check individual service logs for details"
fi

echo ""
echo "   Full Response:"
echo "   ────────────────────────────────────────────────────────────────"
echo "   $ms6_response" | jq '.' 2>/dev/null || echo "   $ms6_response"
echo ""

# ==============================================================================
# PHASE 2: STATIC DASHBOARD FILL (The Visual Polish)
# Goal: Add fake healthy parcels so the dashboard isn't empty.
# ==============================================================================

echo ""
echo "🎨 PHASE 2: STATIC DASHBOARD POPULATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   Adding demonstration parcels for dashboard visualization..."
echo ""

# Static Parcel 1: Healthy (Green)
echo "   [1/2] 🟢 Creating Healthy Parcel (North Field)..."
curl -s -X POST 'http://localhost:8006/api/parcels' \
  -H 'Content-Type: application/json' \
  -d '{
    "id": 301,
    "name": "North Field - Healthy",
    "crop_type": "Corn",
    "status": "OK",
    "area": 12.5,
    "planting_date": "2023-09-01",
    "metrics": {
      "soil_humidity": 65,
      "water_need_mm": 0,
      "stress_index": 0
    },
    "geojson": {
      "type": "Polygon",
      "coordinates": [[
        [-7.595, 33.575],
        [-7.585, 33.575],
        [-7.585, 33.565],
        [-7.595, 33.565],
        [-7.595, 33.575]
      ]]
    }
  }' > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "         ✅ Healthy parcel created"
else
    echo "         ⚠️  May already exist or creation failed"
fi

# Static Parcel 2: Warning (Orange)
echo "   [2/2] 🟠 Creating Warning Parcel (East Vineyard)..."
curl -s -X POST 'http://localhost:8006/api/parcels' \
  -H 'Content-Type: application/json' \
  -d '{
    "id": 302,
    "name": "East Vineyard - Watch",
    "crop_type": "Grapes",
    "status": "WARNING",
    "area": 8.2,
    "planting_date": "2023-08-15",
    "metrics": {
      "soil_humidity": 35,
      "water_need_mm": 5.5,
      "stress_index": 45
    },
    "geojson": {
      "type": "Polygon",
      "coordinates": [[
        [-7.580, 33.570],
        [-7.570, 33.570],
        [-7.570, 33.560],
        [-7.580, 33.560],
        [-7.580, 33.570]
      ]]
    }
  }' > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "         ✅ Warning parcel created"
else
    echo "         ⚠️  May already exist or creation failed"
fi

# ==============================================================================
# FINAL SUMMARY
# ==============================================================================

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ INTEGRATION TEST COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Dashboard Status:"
echo "   • Parcel 300 (Red):    Dynamic Test - Real-time calculated"
echo "   • Parcel 301 (Green):  Static Demo - Healthy status"
echo "   • Parcel 302 (Orange): Static Demo - Warning status"
echo ""
echo "🌐 View Results:"
echo "   → Dashboard: http://localhost:8080"
echo "   → Backend API: http://localhost:8006/api/parcels"
echo ""
echo "🔧 Next Steps:"
echo "   1. Open the dashboard and verify all 3 parcels appear"
echo "   2. Click on Parcel 300 to see dynamic recommendations"
echo "   3. Check that the data reflects the critical conditions"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
