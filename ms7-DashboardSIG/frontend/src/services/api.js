/**
 * Service API pour communiquer avec le backend
 * DashboardSIG - AgroTrace-MS
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Configuration axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour logger les requêtes (développement)
if (import.meta.env.DEV) {
  api.interceptors.request.use(
    (config) => {
      console.log(`📡 API Request: ${config.method.toUpperCase()} ${config.url}`);
      return config;
    },
    (error) => {
      console.error('❌ API Request Error:', error);
      return Promise.reject(error);
    }
  );

  api.interceptors.response.use(
    (response) => {
      console.log(`✅ API Response: ${response.config.url}`, response.data);
      return response;
    },
    (error) => {
      console.error('❌ API Response Error:', error);
      return Promise.reject(error);
    }
  );
}

// ============================================================================
// FONCTIONS API
// ============================================================================

/**
 * Récupère toutes les parcelles au format GeoJSON
 */
export const getParcelles = async () => {
  try {
    const response = await api.get('/parcelles');
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des parcelles:', error);
    throw error;
  }
};

/**
 * Récupère une parcelle spécifique avec tous ses détails
 */
export const getParcelleById = async (id) => {
  try {
    const response = await api.get(`/parcelles/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la récupération de la parcelle ${id}:`, error);
    throw error;
  }
};

/**
 * Récupère l'état hydrique de toutes les parcelles
 */
export const getEtatHydrique = async () => {
  try {
    const response = await api.get('/etat-hydrique');
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'état hydrique:', error);
    throw error;
  }
};

/**
 * Récupère toutes les alertes maladies actives
 */
export const getAlertes = async () => {
  try {
    const response = await api.get('/alertes');
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des alertes:', error);
    throw error;
  }
};

/**
 * Récupère toutes les recommandations d'irrigation
 */
export const getRecommandations = async () => {
  try {
    const response = await api.get('/recommandations');
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des recommandations:', error);
    throw error;
  }
};

/**
 * Récupère les statistiques globales
 */
export const getStats = async () => {
  try {
    const response = await api.get('/stats');
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    throw error;
  }
};

/**
 * Marque une recommandation comme appliquée
 */
export const appliquerRecommandation = async (id) => {
  try {
    const response = await api.post(`/recommandations/${id}/appliquer`);
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de l'application de la recommandation ${id}:`, error);
    throw error;
  }
};

/**
 * Vérifie l'état de santé de l'API
 */
export const checkHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'état de l\'API:', error);
    throw error;
  }
};

// ============================================================================
// MICROSERVICES INTEGRATION
// ============================================================================

/**
 * Vérifie l'état de santé de tous les microservices
 */
export const getMicroservicesHealth = async () => {
  try {
    const response = await api.get('/microservices/health');
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la vérification des microservices:', error);
    throw error;
  }
};

/**
 * Récupère une parcelle enrichie avec toutes les données des microservices
 */
export const getEnrichedParcel = async (id) => {
  try {
    const response = await api.get(`/parcelles/${id}/enriched`);
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la récupération de la parcelle enrichie ${id}:`, error);
    throw error;
  }
};

/**
 * Récupère les prévisions de stress hydrique depuis MS4
 */
export const getWaterForecast = async (parcelId) => {
  try {
    const response = await api.get(`/parcelles/${parcelId}/forecast`);
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la récupération des prévisions pour la parcelle ${parcelId}:`, error);
    throw error;
  }
};

/**
 * Récupère l'évaluation des règles agronomiques depuis MS5
 */
export const getAgroRules = async (parcelId) => {
  try {
    const response = await api.get(`/parcelles/${parcelId}/rules-evaluation`);
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la récupération des règles agro pour la parcelle ${parcelId}:`, error);
    throw error;
  }
};

/**
 * Récupère les recommandations IA depuis MS6
 */
export const getAIRecommendations = async (parcelId) => {
  try {
    const response = await api.get(`/parcelles/${parcelId}/ai-recommendations`);
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la récupération des recommandations IA pour la parcelle ${parcelId}:`, error);
    throw error;
  }
};

/**
 * Récupère l'historique d'irrigation depuis MS6
 */
export const getIrrigationHistory = async (parcelId) => {
  try {
    const response = await api.get(`/parcelles/${parcelId}/irrigation-history`);
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la récupération de l'historique d'irrigation pour la parcelle ${parcelId}:`, error);
    throw error;
  }
};

/**
 * Récupère l'historique des données capteurs depuis MS4
 */
export const getSensorHistory = async (sensorId, days = 7) => {
  try {
    const response = await api.get(`/sensors/${sensorId}/history`, {
      params: { days }
    });
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la récupération de l'historique du capteur ${sensorId}:`, error);
    throw error;
  }
};

export default api;
