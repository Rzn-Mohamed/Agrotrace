# 🚀 Quick Start: Dashboard Microservices Integration

## What's New?

The DashboardSIG (MS7) now integrates with all upstream microservices to provide:
- 📊 **Real-time water stress forecasts** from MS4
- 🌱 **Agronomic rules evaluation** from MS5
- 🤖 **AI-powered irrigation recommendations** from MS6
- 📈 **Sensor historical data** from MS1/MS4
- 🔍 **Plant disease detection** (MS3 - placeholder for future image integration)

## Quick Test

### 1. Start All Services
```bash
docker-compose up -d
```

### 2. Check Services Health
```bash
curl http://localhost:8006/api/microservices/health | jq
```

### 3. Get Enriched Parcel Data
```bash
curl http://localhost:8006/api/parcelles/1/enriched | jq
```

### 4. Run Full Integration Tests
```bash
./test_dashboard_integration.sh
```

## New API Endpoints

| Endpoint | Description | Example |
|----------|-------------|---------|
| `GET /api/microservices/health` | Check all services status | `curl localhost:8006/api/microservices/health` |
| `GET /api/parcelles/:id/enriched` | Get parcel with all microservices data | `curl localhost:8006/api/parcelles/1/enriched` |
| `GET /api/parcelles/:id/forecast` | Water stress forecast (MS4) | `curl localhost:8006/api/parcelles/1/forecast` |
| `GET /api/parcelles/:id/rules-evaluation` | Agro rules (MS5) | `curl localhost:8006/api/parcelles/1/rules-evaluation` |
| `GET /api/parcelles/:id/ai-recommendations` | AI irrigation (MS6) | `curl localhost:8006/api/parcelles/1/ai-recommendations` |
| `GET /api/parcelles/:id/irrigation-history` | History (MS6) | `curl localhost:8006/api/parcelles/1/irrigation-history` |
| `GET /api/sensors/:id/history?days=7` | Sensor data (MS4) | `curl localhost:8006/api/sensors/sensor_p1/history` |

## Architecture

```
Dashboard (MS7)
    ├── MS3 - Vision Plante (Port 8002)
    ├── MS4 - Prévision Eau (Port 8003)
    ├── MS5 - Règles Agro (Port 8004)
    └── MS6 - Reco IA (Port 8005)
```

## Environment Configuration

The dashboard backend now includes microservices URLs in `docker-compose.yml`:

```yaml
environment:
  MS3_URL: http://ms3-vision:8002
  MS4_URL: http://ms4-prevision:8003
  MS5_URL: http://ms5-regles:8004
  MS6_URL: http://ms6-reco:8005
```

## Usage in Frontend

### Get Basic Parcel Data
```javascript
const response = await fetch('/api/parcelles/1');
const parcel = await response.json();
```

### Get Enriched Data with Microservices
```javascript
const response = await fetch('/api/parcelles/1/enriched');
const parcel = await response.json();

// Access data from different services
console.log('AI Recommendation:', parcel.upstream_data.ai_recommendations);
console.log('Water Forecast:', parcel.upstream_data.water_prediction);
console.log('Agro Rules:', parcel.upstream_data.agro_rules);
```

### Query Parameter for Enrichment
```javascript
// Option 1: Use dedicated enriched endpoint
const enriched = await fetch('/api/parcelles/1/enriched');

// Option 2: Use query parameter on standard endpoint
const withEnrich = await fetch('/api/parcelles/1?enrich=true');
```

## Data Flow

1. **Frontend** requests parcel data
2. **Dashboard Backend** queries database for base parcel info
3. **Parallel API calls** to MS4, MS5, and MS6
4. **Merge responses** with base parcel data
5. **Return enriched JSON** to frontend

## Error Handling

The integration is resilient:
- ✅ **Graceful degradation**: Dashboard works even if microservices are down
- ⏱️ **Timeouts**: 10-second timeout per service
- 📝 **Logging**: Warnings logged for unavailable services
- 🔄 **Fallbacks**: Returns `null` for unavailable service data

## Troubleshooting

### Services Not Responding?
```bash
# Check if all services are running
docker ps

# Check specific service logs
docker logs agrotrace-ms4-prevision
docker logs agrotrace-ms5-regles
docker logs agrotrace-ms6-reco

# Restart a specific service
docker-compose restart ms4-prevision
```

### Network Issues?
```bash
# Verify services are on the same network
docker network inspect agro-net

# Test connectivity from dashboard to MS4
docker exec agrotrace-ms7-backend curl http://ms4-prevision:8003/health
```

## Files Modified

1. ✅ `ms7-DashboardSIG/backend/src/services/microservicesIntegration.js` - Updated with correct endpoints
2. ✅ `ms7-DashboardSIG/backend/src/routes/api.js` - Added new integration routes
3. ✅ `ms7-DashboardSIG/backend/src/controllers/parcelleController.js` - Added enrichment support
4. ✅ `docker-compose.yml` - Added microservices environment variables
5. ✅ `test_dashboard_integration.sh` - Integration test script
6. ✅ `ms7-DashboardSIG/MICROSERVICES_INTEGRATION.md` - Full documentation

## Next Steps

1. **Test the Integration**: Run `./test_dashboard_integration.sh`
2. **Update Frontend**: Use new enriched endpoints in React components
3. **Monitor Performance**: Check response times and add caching if needed
4. **Add Visualizations**: Display forecasts and recommendations in UI

## Documentation

- 📖 [Full Integration Guide](./ms7-DashboardSIG/MICROSERVICES_INTEGRATION.md)
- 🏗️ [Architecture Overview](./ms7-DashboardSIG/ARCHITECTURE.md)
- 🔧 [Development Guide](./ms7-DashboardSIG/DEVELOPMENT.md)

---

**Ready to deploy?** Run `docker-compose up -d` and test with `./test_dashboard_integration.sh`
