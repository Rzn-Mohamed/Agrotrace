# 🔗 Microservices Integration Guide - DashboardSIG

## Overview

The DashboardSIG (MS7) integrates with multiple upstream microservices to provide a comprehensive view of agricultural data, predictions, rules, and AI-powered recommendations.

## Integrated Microservices

### MS3 - Vision Plante (Plant Vision)
- **Base URL**: `http://ms3-vision:8002`
- **Purpose**: Plant disease detection using computer vision
- **Status**: Image-based analysis (requires image upload)
- **Integration**: Placeholder for future parcel-image linking

### MS4 - Prévision Eau (Water Prediction)
- **Base URL**: `http://ms4-prevision:8003`
- **Purpose**: Water stress forecasting and hydric predictions
- **Endpoints Used**:
  - `POST /forecasts/with-recommendations` - Get 7-day water stress forecast
  - `GET /capteurs/{capteur_id}/history` - Get sensor historical data
- **Data Required**: `capteur_id`, `horizon_days`, `model`

### MS5 - Règles Agro (Agronomic Rules)
- **Base URL**: `http://ms5-regles:8004`
- **Purpose**: Rule-based agronomic evaluations
- **Endpoints Used**:
  - `POST /evaluate` - Evaluate agronomic rules for a parcel
- **Data Required**: Parcel info, culture type, hydric stress, weather data

### MS6 - Recommandations IA (AI Recommendations)
- **Base URL**: `http://ms6-reco:8005`
- **Purpose**: AI-powered irrigation recommendations
- **Endpoints Used**:
  - `POST /api/v1/irrigation/recommandation-ia` - Generate AI recommendation
  - `GET /api/v1/irrigation/historique` - Get irrigation history
- **Data Required**: Zone ID, culture type, weather prediction, agronomic rules

## Dashboard API Endpoints

### Health Check
```http
GET /api/microservices/health
```
Returns the health status of all upstream microservices.

**Response:**
```json
{
  "timestamp": "2025-12-06T...",
  "services": [
    {
      "name": "MS3-Vision",
      "status": "healthy|degraded|unavailable",
      "statusCode": 200,
      "data": {...}
    },
    ...
  ],
  "allHealthy": true
}
```

### Enriched Parcel Data
```http
GET /api/parcelles/:id/enriched
```
Returns parcel data enriched with data from all microservices.

**Response:**
```json
{
  "id": 1,
  "nom": "Parcelle A1",
  "culture": "Ble",
  "superficie_ha": 12.5,
  "stress_hydrique": "MODERE",
  "niveau_stress": 0.45,
  "upstream_data": {
    "vision": {...},
    "water_prediction": {
      "forecast": {...},
      "recommendations": [...]
    },
    "agro_rules": {
      "priorite_irrigation": "moyenne",
      "recommandations": [...]
    },
    "ai_recommendations": {
      "volume_eau_m3": 125.5,
      "duree_minutes": 180,
      "analyse": {...}
    }
  },
  "ai_irrigation_volume": 125.5,
  "ai_irrigation_duration": 180,
  "ai_reasoning": "...",
  "forecast_stress_trend": "increasing",
  "rules_priority": "moyenne"
}
```

### Water Forecast
```http
GET /api/parcelles/:id/forecast
```
Returns water stress forecast from MS4.

### Agronomic Rules Evaluation
```http
GET /api/parcelles/:id/rules-evaluation
```
Returns agronomic rules evaluation from MS5.

### AI Recommendations
```http
GET /api/parcelles/:id/ai-recommendations
```
Returns AI-powered irrigation recommendations from MS6.

### Irrigation History
```http
GET /api/parcelles/:id/irrigation-history
```
Returns irrigation history for a parcel from MS6.

### Sensor Data
```http
GET /api/sensors/:sensorId/history?days=7
```
Returns sensor historical data from MS4.

**Parameters:**
- `sensorId`: Sensor identifier
- `days`: Number of days of history (default: 7)

## Environment Variables

Configure these in `docker-compose.yml` or `.env`:

```bash
# Microservices URLs
MS3_URL=http://ms3-vision:8002
MS4_URL=http://ms4-prevision:8003
MS5_URL=http://ms5-regles:8004
MS6_URL=http://ms6-reco:8005

# Dashboard URLs
MS7_BACKEND_PORT=8006
MS7_FRONTEND_PORT=8080
```

## Integration Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   MS7 - DashboardSIG                     │
│                                                          │
│  ┌────────────────┐          ┌─────────────────────┐   │
│  │   Frontend     │◄────────►│   Backend API       │   │
│  │   (React)      │          │   (Node.js/Express) │   │
│  └────────────────┘          └──────────┬──────────┘   │
│                                          │               │
└──────────────────────────────────────────┼──────────────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
                    ▼                      ▼                      ▼
         ┌──────────────────┐   ┌──────────────────┐   ┌─────────────────┐
         │  MS3 - Vision    │   │ MS4 - Prévision  │   │  MS5 - Règles   │
         │  (Plant Disease) │   │  (Water Stress)  │   │  (Agro Rules)   │
         │   Port: 8002     │   │   Port: 8003     │   │   Port: 8004    │
         └──────────────────┘   └──────────────────┘   └─────────────────┘
                                           │
                                           ▼
                                ┌─────────────────────┐
                                │  MS6 - Reco IA      │
                                │  (AI Irrigation)    │
                                │   Port: 8005        │
                                └─────────────────────┘
```

## Data Flow

### 1. Parcel Data Enrichment Flow
```
User Request → Dashboard API → Fetch Parcel from DB
                              ↓
              ┌───────────────┴────────────────┐
              │                                │
              ▼                                ▼
    Parallel API Calls to:          Database Queries:
    - MS3 (Vision)                  - Alerts
    - MS4 (Forecast)                - Recommendations
    - MS5 (Rules)                   - Geometry
    - MS6 (AI Reco)                 
              │                                │
              └───────────────┬────────────────┘
                              ▼
                    Merge & Return JSON
```

### 2. Parcel-to-Sensor Mapping
The dashboard maps parcel IDs to sensor IDs using the pattern:
```javascript
const sensorId = `sensor_p${parcelId}`;
// Example: parcel 1 → sensor_p1
```

This mapping can be customized based on your sensor naming convention.

## Error Handling

All microservice integration calls include:
- **Timeout**: 10 seconds default
- **Fallback**: Returns `null` on error
- **Logging**: Warnings logged for unavailable services
- **Graceful Degradation**: Dashboard continues to work even if microservices are down

### Example Error Response
```json
{
  "error": "Forecast service unavailable",
  "message": "MS4 (Water Prediction) is not responding"
}
```

## Usage Examples

### Frontend Integration

```javascript
// Fetch enriched parcel data
const response = await fetch('/api/parcelles/1/enriched');
const parcel = await response.json();

// Access microservices data
const aiRecommendation = parcel.upstream_data.ai_recommendations;
const waterForecast = parcel.upstream_data.water_prediction;

// Check microservices health
const health = await fetch('/api/microservices/health');
const status = await health.json();
console.log('All services healthy:', status.allHealthy);
```

### Direct Microservice Calls

```javascript
// Get water forecast only
const forecast = await fetch('/api/parcelles/1/forecast');
const forecastData = await forecast.json();

// Get AI recommendations only
const aiReco = await fetch('/api/parcelles/1/ai-recommendations');
const recoData = await aiReco.json();

// Get sensor history
const sensorData = await fetch('/api/sensors/sensor_p1/history?days=14');
const history = await sensorData.json();
```

## Testing the Integration

### 1. Check Services Health
```bash
curl http://localhost:8006/api/microservices/health
```

### 2. Test Enriched Data
```bash
curl http://localhost:8006/api/parcelles/1/enriched
```

### 3. Test Individual Services
```bash
# Water forecast
curl http://localhost:8006/api/parcelles/1/forecast

# Agro rules
curl http://localhost:8006/api/parcelles/1/rules-evaluation

# AI recommendations
curl http://localhost:8006/api/parcelles/1/ai-recommendations

# Irrigation history
curl http://localhost:8006/api/parcelles/1/irrigation-history
```

## Troubleshooting

### Service Unavailable Errors
If a microservice is unavailable:
1. Check if the service is running: `docker ps`
2. Check service logs: `docker logs agrotrace-ms4-prevision`
3. Verify network connectivity: Services must be on `agro-net` network
4. Check environment variables in `docker-compose.yml`

### Timeout Issues
If requests timeout:
1. Increase timeout in `microservicesIntegration.js`
2. Check service performance with health endpoints
3. Review service logs for slow queries

### Data Mapping Issues
If data doesn't match:
1. Verify parcel-to-sensor ID mapping
2. Check request payload format matches service expectations
3. Review service API documentation

## Future Enhancements

1. **MS3 Integration**: Link images to parcels for disease detection
2. **Caching**: Implement Redis caching for microservices responses
3. **Real-time Updates**: WebSocket integration for live data
4. **Batch Enrichment**: Enrich multiple parcels in parallel
5. **Circuit Breaker**: Implement circuit breaker pattern for resilience

## Related Documentation

- [Architecture Overview](./ARCHITECTURE.md)
- [Development Guide](./DEVELOPMENT.md)
- [API Documentation](./backend/README.md)
- [MS4 Integration](../ms4-prevision-eau/README.md)
- [MS5 Integration](../ms5-regles-agro/README.md)
- [MS6 Integration](../ms6-RecoIrrigation/README.md)

---

**Last Updated**: December 6, 2025
**Version**: 1.0.0
