#!/bin/bash

# ==============================================================================
# Test Microservices Integration with Dashboard
# ==============================================================================
# This script tests the integration between MS7 (Dashboard) and upstream
# microservices (MS3, MS4, MS5, MS6)
# ==============================================================================

set -e

BASE_URL="${BASE_URL:-http://localhost:8006}"
PARCEL_ID="${PARCEL_ID:-1}"
SENSOR_ID="${SENSOR_ID:-sensor_p1}"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     🧪 Testing Microservices Integration - MS7             ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║  Base URL: $BASE_URL"
echo "║  Parcel ID: $PARCEL_ID"
echo "║  Sensor ID: $SENSOR_ID"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# ==============================================================================
# Test 1: Check Dashboard Health
# ==============================================================================
echo "📍 Test 1: Checking Dashboard API Health..."
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/health")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
    echo "✅ Dashboard API is healthy"
    echo "$body" | jq '.'
else
    echo "❌ Dashboard API health check failed (HTTP $http_code)"
    exit 1
fi
echo ""

# ==============================================================================
# Test 2: Check All Microservices Health
# ==============================================================================
echo "📍 Test 2: Checking All Microservices Health..."
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/microservices/health")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
    echo "✅ Microservices health check successful"
    echo "$body" | jq '.'
    
    # Check if all services are healthy
    all_healthy=$(echo "$body" | jq -r '.allHealthy')
    if [ "$all_healthy" = "true" ]; then
        echo "✅ All microservices are healthy"
    else
        echo "⚠️  Some microservices are unavailable"
        echo "$body" | jq -r '.services[] | select(.status != "healthy") | "\(.name): \(.status)"'
    fi
else
    echo "❌ Microservices health check failed (HTTP $http_code)"
fi
echo ""

# ==============================================================================
# Test 3: Get Basic Parcel Data
# ==============================================================================
echo "📍 Test 3: Fetching Basic Parcel Data..."
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/parcelles/$PARCEL_ID")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
    echo "✅ Basic parcel data retrieved"
    echo "$body" | jq '{id, nom, culture, superficie_ha, stress_hydrique}'
else
    echo "❌ Failed to get parcel data (HTTP $http_code)"
fi
echo ""

# ==============================================================================
# Test 4: Get Enriched Parcel Data
# ==============================================================================
echo "📍 Test 4: Fetching Enriched Parcel Data (with microservices)..."
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/parcelles/$PARCEL_ID/enriched")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
    echo "✅ Enriched parcel data retrieved"
    echo "$body" | jq '{
        id, 
        nom, 
        culture,
        ai_irrigation_volume,
        ai_irrigation_duration,
        forecast_stress_trend,
        rules_priority,
        upstream_data: {
            vision: .upstream_data.vision.status,
            water_prediction: (.upstream_data.water_prediction != null),
            agro_rules: (.upstream_data.agro_rules != null),
            ai_recommendations: (.upstream_data.ai_recommendations != null)
        }
    }'
else
    echo "❌ Failed to get enriched parcel data (HTTP $http_code)"
fi
echo ""

# ==============================================================================
# Test 5: Get Water Forecast from MS4
# ==============================================================================
echo "📍 Test 5: Fetching Water Forecast from MS4..."
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/parcelles/$PARCEL_ID/forecast")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
    echo "✅ Water forecast retrieved from MS4"
    echo "$body" | jq 'if .forecast then {forecast: .forecast | keys} else . end'
elif [ "$http_code" -eq 503 ]; then
    echo "⚠️  MS4 (Water Prediction) service unavailable"
    echo "$body" | jq '.'
else
    echo "❌ Failed to get water forecast (HTTP $http_code)"
fi
echo ""

# ==============================================================================
# Test 6: Get Agro Rules Evaluation from MS5
# ==============================================================================
echo "📍 Test 6: Fetching Agro Rules Evaluation from MS5..."
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/parcelles/$PARCEL_ID/rules-evaluation")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
    echo "✅ Agro rules evaluation retrieved from MS5"
    echo "$body" | jq 'if .recommandations then {recommandations: (.recommandations | length)} else . end'
elif [ "$http_code" -eq 503 ]; then
    echo "⚠️  MS5 (Agro Rules) service unavailable"
    echo "$body" | jq '.'
else
    echo "❌ Failed to get agro rules evaluation (HTTP $http_code)"
fi
echo ""

# ==============================================================================
# Test 7: Get AI Recommendations from MS6
# ==============================================================================
echo "📍 Test 7: Fetching AI Recommendations from MS6..."
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/parcelles/$PARCEL_ID/ai-recommendations")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
    echo "✅ AI recommendations retrieved from MS6"
    echo "$body" | jq '{volume_eau_m3, duree_minutes, horaire_debut, status}'
elif [ "$http_code" -eq 503 ]; then
    echo "⚠️  MS6 (AI Recommendations) service unavailable"
    echo "$body" | jq '.'
else
    echo "❌ Failed to get AI recommendations (HTTP $http_code)"
fi
echo ""

# ==============================================================================
# Test 8: Get Irrigation History from MS6
# ==============================================================================
echo "📍 Test 8: Fetching Irrigation History from MS6..."
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/parcelles/$PARCEL_ID/irrigation-history")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
    echo "✅ Irrigation history retrieved from MS6"
    count=$(echo "$body" | jq 'length')
    echo "Found $count irrigation records"
    echo "$body" | jq 'if length > 0 then .[0] else "No records" end'
elif [ "$http_code" -eq 503 ]; then
    echo "⚠️  MS6 service unavailable"
    echo "$body" | jq '.'
else
    echo "❌ Failed to get irrigation history (HTTP $http_code)"
fi
echo ""

# ==============================================================================
# Test 9: Get Sensor History from MS4
# ==============================================================================
echo "📍 Test 9: Fetching Sensor History from MS4..."
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/sensors/$SENSOR_ID/history?days=7")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
    echo "✅ Sensor history retrieved from MS4"
    count=$(echo "$body" | jq 'length')
    echo "Found $count sensor readings"
    echo "$body" | jq 'if length > 0 then .[0] else "No readings" end'
elif [ "$http_code" -eq 503 ]; then
    echo "⚠️  MS4 service unavailable"
    echo "$body" | jq '.'
else
    echo "❌ Failed to get sensor history (HTTP $http_code)"
fi
echo ""

# ==============================================================================
# Summary
# ==============================================================================
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    🎉 Tests Complete                       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "To run tests with custom parameters:"
echo "  BASE_URL=http://localhost:8006 PARCEL_ID=2 ./test_dashboard_integration.sh"
echo ""
