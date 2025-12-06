/**
 * Routes API pour DashboardSIG
 * AgroTrace-MS - Microservice 7
 */

import express from 'express';
import pool from '../config/database.js';
import {
  getParcelles,
  getParcelleById,
  getEtatHydrique,
  getAlertes,
  getRecommandations,
  getStats,
  appliquerRecommandation
} from '../controllers/parcelleController.js';
import { 
  checkMicroservicesHealth,
  enrichParcelWithMicroservicesData,
  getWaterPrediction,
  getAgroRulesEvaluation,
  getAIRecommendations,
  getIrrigationHistoryFromMS6,
  getSensorHistory
} from '../services/microservicesIntegration.js';

const router = express.Router();

// ============================================================================
// ROUTES GÉOSPATIALES
// ============================================================================

/**
 * @route   GET /api/parcelles
 * @desc    Récupère toutes les parcelles au format GeoJSON
 * @access  Public
 */
router.get('/parcelles', getParcelles);

/**
 * @route   GET /api/parcelles/:id
 * @desc    Récupère une parcelle spécifique avec tous ses détails
 * @access  Public
 */
router.get('/parcelles/:id', getParcelleById);

// ============================================================================
// ROUTES DONNÉES TEMPS RÉEL (IoT/Drones)
// ============================================================================

/**
 * @route   GET /api/etat-hydrique
 * @desc    Récupère l'état hydrique de toutes les parcelles
 * @access  Public
 */
router.get('/etat-hydrique', getEtatHydrique);

// ============================================================================
// ROUTES ALERTES & RECOMMANDATIONS
// ============================================================================

/**
 * @route   GET /api/alertes
 * @desc    Récupère toutes les alertes maladies actives
 * @access  Public
 */
router.get('/alertes', getAlertes);

/**
 * @route   GET /api/recommandations
 * @desc    Récupère toutes les recommandations d'irrigation non appliquées
 * @access  Public
 */
router.get('/recommandations', getRecommandations);

/**
 * @route   POST /api/recommandations/:id/appliquer
 * @desc    Marque une recommandation comme appliquée
 * @access  Public
 */
router.post('/recommandations/:id/appliquer', appliquerRecommandation);

// ============================================================================
// ROUTES STATISTIQUES
// ============================================================================

/**
 * @route   GET /api/stats
 * @desc    Récupère les statistiques globales du système
 * @access  Public
 */
router.get('/stats', getStats);

// ============================================================================
// ROUTE DE SANTÉ
// ============================================================================

/**
 * @route   GET /api/health
 * @desc    Vérifie l'état de santé de l'API
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'DashboardSIG-API',
    version: '1.0.0'
  });
});

// ============================================================================
// ALIAS & INTEGRATION ENDPOINTS
// ============================================================================

/**
 * @route   GET /api/parcels
 * @desc    Alias anglais pour /api/parcelles (compatibilité scripts)
 * @access  Public
 */
router.get('/parcels', getParcelles);

/**
 * @route   POST /api/parcels
 * @desc    Reçoit les données de parcelles depuis les microservices upstream
 * @access  Public
 */
router.post('/parcels', async (req, res) => {
  try {
    // Pour l'instant, on acknowledge simplement la réception
    // TODO: Implémenter la logique de stockage/mise à jour
    console.log('[MS6->MS7] Received parcel data:', JSON.stringify(req.body, null, 2));
    res.status(200).json({ 
      status: 'received',
      message: 'Parcel data received successfully',
      id: req.body.id 
    });
  } catch (error) {
    console.error('Error receiving parcel data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// MICROSERVICES INTEGRATION ROUTES
// ============================================================================

/**
 * @route   GET /api/microservices/health
 * @desc    Check health status of all upstream microservices
 * @access  Public
 */
router.get('/microservices/health', async (req, res) => {
  try {
    const healthStatus = await checkMicroservicesHealth();
    res.json(healthStatus);
  } catch (error) {
    console.error('Error checking microservices health:', error);
    res.status(500).json({ error: 'Failed to check microservices health' });
  }
});

/**
 * @route   GET /api/parcelles/:id/enriched
 * @desc    Get parcel data enriched with all microservices data
 * @access  Public
 */
router.get('/parcelles/:id/enriched', async (req, res) => {
  try {
    const { id } = req.params;
    // First get base parcel data
    const { query } = await import('../config/database.js');
    const result = await query(`
      SELECT 
        p.id, p.nom, p.culture, p.superficie_ha, p.date_semis,
        p.stress_hydrique, p.niveau_stress, p.besoin_eau_mm,
        p.derniere_irrigation, p.geometry_json::json as geometry
      FROM parcelles_simple p
      WHERE p.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Parcelle non trouvée' });
    }
    
    const baseParcel = result.rows[0];
    const enrichedParcel = await enrichParcelWithMicroservicesData(baseParcel);
    res.json(enrichedParcel);
  } catch (error) {
    console.error('Error getting enriched parcel:', error);
    res.status(500).json({ error: 'Failed to enrich parcel data' });
  }
});

/**
 * @route   GET /api/parcelles/:id/forecast
 * @desc    Get water stress forecast for a specific parcel from MS4
 * @access  Public
 */
router.get('/parcelles/:id/forecast', async (req, res) => {
  try {
    const { id } = req.params;
    const forecastData = await getWaterPrediction(id);
    
    if (!forecastData) {
      return res.status(503).json({ 
        error: 'Forecast service unavailable',
        message: 'MS4 (Water Prediction) is not responding'
      });
    }
    
    res.json(forecastData);
  } catch (error) {
    console.error('Error getting forecast:', error);
    res.status(500).json({ error: 'Failed to get forecast data' });
  }
});

/**
 * @route   GET /api/parcelles/:id/rules-evaluation
 * @desc    Get agronomic rules evaluation for a specific parcel from MS5
 * @access  Public
 */
router.get('/parcelles/:id/rules-evaluation', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Fetch real parcel data from database
    const parcelResult = await pool.query(
      'SELECT culture, superficie_ha, niveau_stress, date_semis, derniere_irrigation FROM parcelles_simple WHERE id = $1',
      [id]
    );
    
    if (parcelResult.rows.length === 0) {
      return res.status(404).json({ error: 'Parcel not found' });
    }
    
    const parcel = parcelResult.rows[0];
    const joursDepuisIrrigation = parcel.derniere_irrigation 
      ? Math.floor((new Date() - new Date(parcel.derniere_irrigation)) / (1000 * 60 * 60 * 24))
      : 5;
    
    const parcelData = {
      culture: parcel.culture || 'Ble',
      superficie_ha: parcel.superficie_ha || 10.0,
      stress_hydrique: parcel.niveau_stress || 0.5,
      stade_culture: 'croissance',
      jours_depuis_irrigation: joursDepuisIrrigation
    };
    
    const rulesData = await getAgroRulesEvaluation(id, parcelData);
    
    if (!rulesData) {
      return res.status(503).json({ 
        error: 'Rules service unavailable',
        message: 'MS5 (Agro Rules) is not responding'
      });
    }
    
    res.json(rulesData);
  } catch (error) {
    console.error('Error getting rules evaluation:', error);
    res.status(500).json({ error: 'Failed to get rules evaluation' });
  }
});

/**
 * @route   GET /api/parcelles/:id/ai-recommendations
 * @desc    Get AI-based irrigation recommendations for a specific parcel from MS6
 * @access  Public
 */
router.get('/parcelles/:id/ai-recommendations', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Fetch real parcel data from database
    const parcelResult = await pool.query(
      'SELECT culture, superficie_ha, niveau_stress, stress_hydrique, date_semis, derniere_irrigation FROM parcelles_simple WHERE id = $1',
      [id]
    );
    
    if (parcelResult.rows.length === 0) {
      return res.status(404).json({ error: 'Parcel not found' });
    }
    
    const parcel = parcelResult.rows[0];
    const joursDepuisIrrigation = parcel.derniere_irrigation 
      ? Math.floor((new Date() - new Date(parcel.derniere_irrigation)) / (1000 * 60 * 60 * 24))
      : 5;
    
    // Map stress level to priority
    const stressLevel = parcel.niveau_stress || 0.5;
    const priorite = stressLevel >= 0.7 ? 'haute' : stressLevel >= 0.4 ? 'moyenne' : 'basse';
    
    const parcelData = {
      culture: parcel.culture || 'Ble',
      superficie_ha: parcel.superficie_ha || 10.0,
      stress_hydrique: parcel.niveau_stress || 0.5,
      stade_culture: 'croissance',
      jours_depuis_irrigation: joursDepuisIrrigation,
      priorite: priorite
    };
    
    const aiRecoData = await getAIRecommendations(id, parcelData);
    
    if (!aiRecoData) {
      return res.status(503).json({ 
        error: 'AI recommendation service unavailable',
        message: 'MS6 (AI Recommendations) is not responding'
      });
    }
    
    res.json(aiRecoData);
  } catch (error) {
    console.error('Error getting AI recommendations:', error);
    res.status(500).json({ error: 'Failed to get AI recommendations' });
  }
});

/**
 * @route   GET /api/parcelles/:id/irrigation-history
 * @desc    Get irrigation history for a specific parcel from MS6
 * @access  Public
 */
router.get('/parcelles/:id/irrigation-history', async (req, res) => {
  try {
    const { id } = req.params;
    const historyData = await getIrrigationHistoryFromMS6(id);
    
    if (!historyData) {
      return res.status(503).json({ 
        error: 'Irrigation history service unavailable',
        message: 'MS6 is not responding'
      });
    }
    
    res.json(historyData);
  } catch (error) {
    console.error('Error getting irrigation history:', error);
    res.status(500).json({ error: 'Failed to get irrigation history' });
  }
});

/**
 * @route   GET /api/sensors/:sensorId/history
 * @desc    Get sensor data history from MS4
 * @access  Public
 */
router.get('/sensors/:sensorId/history', async (req, res) => {
  try {
    const { sensorId } = req.params;
    const { days = 7 } = req.query;
    const sensorData = await getSensorHistory(sensorId, parseInt(days));
    
    if (!sensorData) {
      return res.status(503).json({ 
        error: 'Sensor data service unavailable',
        message: 'MS4 is not responding'
      });
    }
    
    res.json(sensorData);
  } catch (error) {
    console.error('Error getting sensor history:', error);
    res.status(500).json({ error: 'Failed to get sensor history' });
  }
});

export default router;
