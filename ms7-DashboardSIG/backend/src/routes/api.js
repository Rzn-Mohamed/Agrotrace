/**
 * Routes API pour DashboardSIG
 * AgroTrace-MS - Microservice 7
 */

import express from 'express';
import {
  getParcelles,
  getParcelleById,
  getEtatHydrique,
  getAlertes,
  getRecommandations,
  getStats,
  appliquerRecommandation
} from '../controllers/parcelleController.js';

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

export default router;
