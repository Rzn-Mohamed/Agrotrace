# 🎨 Frontend Integration Guide

## You're Ready to Display Microservices Data!

The backend integration is **complete and working**. Here's how to use it in your React dashboard:

## ✅ What's Available

### New API Functions (Already Added to `services/api.js`)

```javascript
import { 
  getEnrichedParcel,      // Get all microservices data at once
  getWaterForecast,       // MS4 - Water predictions
  getAgroRules,           // MS5 - Agro rules
  getAIRecommendations,   // MS6 - AI irrigation
  getIrrigationHistory,   // MS6 - History
  getSensorHistory,       // MS4 - Sensor data
  getMicroservicesHealth  // Check all services
} from './services/api';
```

### React Components (Already Created!)

I've created three ready-to-use panel components:
- ✅ `WaterForecastPanel.jsx` - Displays 7-day water stress forecast from MS4
- ✅ `AIRecommendationsPanel.jsx` - Shows AI irrigation recommendations from MS6
- ✅ `AgroRulesPanel.jsx` - Displays agronomic rules evaluation from MS5

## 🚀 Quick Integration Example

### Option 1: Use Individual Panels

```jsx
import WaterForecastPanel from './components/ParcelDetails/panels/WaterForecastPanel';
import AIRecommendationsPanel from './components/ParcelDetails/panels/AIRecommendationsPanel';
import AgroRulesPanel from './components/ParcelDetails/panels/AgroRulesPanel';

function ParcelDetails({ parcelId }) {
  return (
    <div className="space-y-4">
      <h2>Parcelle #{parcelId}</h2>
      
      {/* Water Forecast from MS4 */}
      <section>
        <h3>Prévisions Hydriques</h3>
        <WaterForecastPanel parcelId={parcelId} />
      </section>
      
      {/* AI Recommendations from MS6 */}
      <section>
        <h3>Recommandations IA</h3>
        <AIRecommendationsPanel parcelId={parcelId} />
      </section>
      
      {/* Agronomic Rules from MS5 */}
      <section>
        <h3>Règles Agronomiques</h3>
        <AgroRulesPanel parcelId={parcelId} />
      </section>
    </div>
  );
}
```

### Option 2: Use Enriched Endpoint (All Data at Once)

```jsx
import { useState, useEffect } from 'react';
import { getEnrichedParcel } from './services/api';

function EnrichedParcelView({ parcelId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const enriched = await getEnrichedParcel(parcelId);
        setData(enriched);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [parcelId]);

  if (loading) return <div>Chargement...</div>;

  return (
    <div>
      <h2>{data.nom} - {data.culture}</h2>
      <p>Stress hydrique: {data.stress_hydrique}</p>
      
      {/* Access microservices data */}
      {data.upstream_data?.water_prediction && (
        <div>
          <h3>Prévision (MS4)</h3>
          <p>Tendance: {data.forecast_stress_trend}</p>
        </div>
      )}
      
      {data.upstream_data?.ai_recommendations && (
        <div>
          <h3>Recommandation IA (MS6)</h3>
          <p>Volume: {data.ai_irrigation_volume} m³</p>
          <p>Durée: {data.ai_irrigation_duration} min</p>
        </div>
      )}
      
      {data.upstream_data?.agro_rules && (
        <div>
          <h3>Règles Agro (MS5)</h3>
          <p>Priorité: {data.rules_priority}</p>
        </div>
      )}
    </div>
  );
}
```

## 📊 Example: Update Parcel Popup

Update your `ParcellePopup.jsx` to include microservices data:

```jsx
import { useState } from 'react';
import WaterForecastPanel from './panels/WaterForecastPanel';
import AIRecommendationsPanel from './panels/AIRecommendationsPanel';

function ParcellePopup({ parcelle }) {
  const [activeTab, setActiveTab] = useState('info');

  return (
    <div className="parcel-popup">
      {/* Tabs */}
      <div className="tabs">
        <button onClick={() => setActiveTab('info')}>Info</button>
        <button onClick={() => setActiveTab('forecast')}>Prévisions</button>
        <button onClick={() => setActiveTab('ai')}>IA</button>
      </div>

      {/* Content */}
      {activeTab === 'info' && (
        <div>
          <h3>{parcelle.nom}</h3>
          <p>Culture: {parcelle.culture}</p>
          <p>Superficie: {parcelle.superficie_ha} ha</p>
        </div>
      )}

      {activeTab === 'forecast' && (
        <WaterForecastPanel parcelId={parcelle.id} />
      )}

      {activeTab === 'ai' && (
        <AIRecommendationsPanel parcelId={parcelle.id} />
      )}
    </div>
  );
}
```

## 🔍 Testing in Browser

1. **Rebuild Frontend:**
   ```bash
   docker-compose up -d --build ms7-frontend
   ```

2. **Open Dashboard:**
   ```
   http://localhost:8080
   ```

3. **Click on a parcel** (ID 100 or 101)

4. **View microservices data** in the panels!

## 📡 API Endpoints Available

| Endpoint | What it does |
|----------|--------------|
| `/api/parcelles/100/enriched` | All data from all services |
| `/api/parcelles/100/forecast` | MS4 water forecast only |
| `/api/parcelles/100/ai-recommendations` | MS6 AI recommendations only |
| `/api/parcelles/100/rules-evaluation` | MS5 agro rules only |
| `/api/microservices/health` | Check all services status |

## 🎯 Next Steps

1. **Import the panels** where you need them (e.g., in ParcelDetails or Sidebar)
2. **Pass the `parcelId` prop** to each panel
3. **Rebuild the frontend** container
4. **See the data live!** 🎉

The data is flowing from:
```
Database → Dashboard Backend → Microservices (MS4, MS5, MS6) → Your React Components
```

Everything is set up and ready to display! 🚀
