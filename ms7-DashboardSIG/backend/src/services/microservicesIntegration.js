/**
 * Microservices Integration Service
 * Handles communication with upstream microservices (MS3, MS4, MS5, MS6)
 */

import axios from 'axios';

// Microservice endpoints from environment variables
const MS3_URL = process.env.MS3_URL || 'http://ms3-vision:8002';
const MS4_URL = process.env.MS4_URL || 'http://ms4-prevision:8003';
const MS5_URL = process.env.MS5_URL || 'http://ms5-regles:8004';
const MS6_URL = process.env.MS6_URL || 'http://ms6-reco:8005';

// Timeout configuration
const API_TIMEOUT = 10000; // 10 seconds

/**
 * Fetch plant health analysis from MS3 (Vision Plante)
 * Note: MS3 works with image uploads, not parcel IDs directly
 * This is a placeholder for future integration when images are linked to parcels
 * @param {number} parcelId - Parcel ID
 * @returns {Promise<Object|null>} Vision analysis result or null on error
 */
export async function getPlantVisionAnalysis(parcelId) {
  try {
    // MS3 doesn't have a direct parcel endpoint yet
    // It requires image upload via /analyze or /upload-and-analyze
    // For now, return mock data structure
    console.log(`[MS3] Vision analysis requested for parcel ${parcelId} (mock data)`);
    return {
      status: 'no_data',
      message: 'Vision analysis requires image upload',
      parcelId: parcelId
    };
  } catch (error) {
    console.warn(`[MS3] Vision service unavailable for parcel ${parcelId}:`, error.message);
    return null;
  }
}

/**
 * Fetch water prediction from MS4 (Prévision Eau)
 * MS4 uses capteur_id, we'll need to map parcelId to capteur_id
 * @param {number} parcelId - Parcel ID
 * @param {string} capteurId - Sensor ID (optional, will use parcel mapping if not provided)
 * @returns {Promise<Object|null>} Water prediction or null on error
 */
export async function getWaterPrediction(parcelId, capteurId = null) {
  try {
    // Map parcel ID to capteur ID (you may need to adjust this mapping)
    const sensorId = capteurId || `sensor_p${parcelId}`;
    
    const response = await axios.post(`${MS4_URL}/forecasts/with-recommendations`, {
      capteur_id: sensorId,
      horizon_days: 7,
      model: 'ensemble'
    }, {
      timeout: API_TIMEOUT,
      validateStatus: (status) => status < 500
    });
    
    if (response.status === 200) {
      return response.data;
    }
    return null;
  } catch (error) {
    console.warn(`[MS4] Water prediction service unavailable for parcel ${parcelId}:`, error.message);
    return null;
  }
}

/**
 * Fetch agronomic rules evaluation from MS5 (Règles Agro)
 * @param {number} parcelId - Parcel ID
 * @param {Object} parcelData - Parcel data for evaluation
 * @returns {Promise<Object|null>} Rules evaluation or null on error
 */
export async function getAgroRulesEvaluation(parcelId, parcelData = {}) {
  try {
    // MS5 uses POST /evaluate with request body
    const evaluationRequest = {
      parcelle_id: String(parcelId),
      culture_type: parcelData.culture || 'Ble',
      superficie_ha: parcelData.superficie_ha || 10.0,
      stress_hydrique_actuel: parcelData.stress_hydrique || 0.5,
      derniere_irrigation_jours: parcelData.jours_depuis_irrigation || 3,
      stade_culture: parcelData.stade_culture || 'croissance',
      meteo_prevision: {
        temperature_moy: 25.0,
        precipitation_mm: 0.0,
        et0_mm: 4.5
      }
    };
    
    const response = await axios.post(`${MS5_URL}/evaluate`, evaluationRequest, {
      timeout: API_TIMEOUT,
      validateStatus: (status) => status < 500
    });
    
    if (response.status === 200) {
      return response.data;
    }
    return null;
  } catch (error) {
    console.warn(`[MS5] Agro rules service unavailable for parcel ${parcelId}:`, error.message);
    return null;
  }
}

/**
 * Fetch AI recommendations from MS6 (Recommandations IA)
 * @param {number} parcelId - Parcel ID
 * @param {Object} parcelData - Parcel data for recommendation
 * @returns {Promise<Object|null>} AI recommendations or null on error
 */
export async function getAIRecommendations(parcelId, parcelData = {}) {
  try {
    // MS6 uses POST /api/v1/irrigation/recommandation-ia
    const irrigationRequest = {
      zone_id: parcelId,
      culture_type: parcelData.culture || 'Ble',
      prediction: {
        et0_mm_jour: 4.5,
        temperature_celsius: 25.0,
        humidite_pourcentage: 60.0,
        precipitation_mm: 0.0
      },
      regles: {
        priorite: parcelData.priorite || 'haute',
        stade_culture: parcelData.stade_culture || 'croissance',
        contraintes: []
      }
    };
    
    const response = await axios.post(
      `${MS6_URL}/api/v1/irrigation/recommandation-ia`, 
      irrigationRequest,
      {
        timeout: API_TIMEOUT,
        validateStatus: (status) => status < 500
      }
    );
    
    if (response.status === 200) {
      return response.data;
    }
    return null;
  } catch (error) {
    console.warn(`[MS6] AI recommendation service unavailable for parcel ${parcelId}:`, error.message);
    return null;
  }
}

/**
 * Enrich parcel data with upstream microservices data
 * Fetches data from MS3, MS4, MS5, and MS6 in parallel
 * @param {Object} parcel - Base parcel object
 * @returns {Promise<Object>} Enriched parcel with microservices data
 */
export async function enrichParcelWithMicroservicesData(parcel) {
  if (!parcel || !parcel.id) {
    return parcel;
  }

  try {
    // Prepare parcel data for services
    const parcelData = {
      culture: parcel.culture,
      superficie_ha: parcel.superficie_ha,
      stress_hydrique: parcel.niveau_stress,
      stade_culture: parcel.stade_culture || 'croissance',
      jours_depuis_irrigation: parcel.derniere_irrigation ? 
        Math.floor((new Date() - new Date(parcel.derniere_irrigation)) / (1000 * 60 * 60 * 24)) : 3,
      priorite: parcel.niveau_stress > 0.7 ? 'haute' : parcel.niveau_stress > 0.4 ? 'moyenne' : 'basse'
    };

    // Fetch data from all microservices in parallel
    const [visionData, waterData, rulesData, aiRecommendations] = await Promise.all([
      getPlantVisionAnalysis(parcel.id),
      getWaterPrediction(parcel.id, null),
      getAgroRulesEvaluation(parcel.id, parcelData),
      getAIRecommendations(parcel.id, parcelData)
    ]);

    // Merge the data into the parcel object
    const enrichedParcel = {
      ...parcel,
      upstream_data: {
        vision: visionData,
        water_prediction: waterData,
        agro_rules: rulesData,
        ai_recommendations: aiRecommendations
      },
      // Extract key metrics for quick access
      ai_irrigation_volume: aiRecommendations?.volume_eau_m3 || null,
      ai_irrigation_duration: aiRecommendations?.duree_minutes || null,
      ai_reasoning: aiRecommendations?.analyse?.justification || null,
      forecast_stress_trend: waterData?.forecast?.trend || null,
      rules_priority: rulesData?.priorite_irrigation || null
    };

    return enrichedParcel;
  } catch (error) {
    console.error(`[Enrichment] Error enriching parcel ${parcel.id}:`, error.message);
    return parcel; // Return original parcel if enrichment fails
  }
}

/**
 * Health check for all upstream microservices
 * @returns {Promise<Object>} Status of all microservices
 */
export async function checkMicroservicesHealth() {
  const services = [
    { name: 'MS3-Vision', url: `${MS3_URL}/health` },
    { name: 'MS4-Prevision', url: `${MS4_URL}/health` },
    { name: 'MS5-Regles', url: `${MS5_URL}/health` },
    { name: 'MS6-Reco', url: `${MS6_URL}/health` }
  ];

  const healthChecks = await Promise.all(
    services.map(async (service) => {
      try {
        const response = await axios.get(service.url, {
          timeout: 5000,
          validateStatus: (status) => status < 500
        });
        return {
          name: service.name,
          status: response.status === 200 ? 'healthy' : 'degraded',
          statusCode: response.status,
          data: response.data
        };
      } catch (error) {
        return {
          name: service.name,
          status: 'unavailable',
          error: error.message
        };
      }
    })
  );

  return {
    timestamp: new Date().toISOString(),
    services: healthChecks,
    allHealthy: healthChecks.every(s => s.status === 'healthy')
  };
}

// Alias for compatibility with controller
export const checkAllServicesHealth = checkMicroservicesHealth;

/**
 * Generate irrigation recommendation from MS6
 * @param {number} parcelId - Parcel ID
 * @param {Object} parcelData - Parcel data
 * @returns {Promise<Object|null>} Irrigation recommendation or null on error
 */
export async function generateIrrigationRecoFromMS6(parcelId, parcelData = {}) {
  return getAIRecommendations(parcelId, parcelData);
}

/**
 * Get irrigation history from MS6
 * @param {number} parcelId - Parcel ID (zone_id in MS6)
 * @returns {Promise<Array|null>} Irrigation history or null on error
 */
export async function getIrrigationHistoryFromMS6(parcelId) {
  try {
    const response = await axios.get(`${MS6_URL}/api/v1/irrigation/historique`, {
      params: { zone_id: parcelId },
      timeout: API_TIMEOUT,
      validateStatus: (status) => status < 500
    });
    
    if (response.status === 200) {
      return response.data;
    }
    return null;
  } catch (error) {
    console.warn(`[MS6] Irrigation history unavailable for parcel ${parcelId}:`, error.message);
    return null;
  }
}

/**
 * Get sensor data from MS1/TimescaleDB via MS4
 * @param {string} capteurId - Sensor ID
 * @param {number} days - Number of days of history
 * @returns {Promise<Array|null>} Sensor data or null on error
 */
export async function getSensorHistory(capteurId, days = 7) {
  try {
    const response = await axios.get(`${MS4_URL}/capteurs/${capteurId}/history`, {
      params: { days },
      timeout: API_TIMEOUT,
      validateStatus: (status) => status < 500
    });
    
    if (response.status === 200) {
      return response.data;
    }
    return null;
  } catch (error) {
    console.warn(`[MS4] Sensor history unavailable for sensor ${capteurId}:`, error.message);
    return null;
  }
}
