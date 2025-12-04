/**
 * Serveur Express pour DashboardSIG
 * AgroTrace-MS - Microservice 7
 * Backend API pour la gestion des données géospatiales
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.js';

// Chargement des variables d'environnement
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================================
// MIDDLEWARES
// ============================================================================

// Sécurité HTTP headers
app.use(helmet());

// Compression des réponses
app.use(compression());

// CORS - Configuration pour le développement
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parser JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging des requêtes
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `${new Date().toISOString()} | ${req.method} ${req.originalUrl} | ${res.statusCode} | ${duration}ms`
    );
  });
  next();
});

// ============================================================================
// ROUTES
// ============================================================================

// Route racine
app.get('/', (req, res) => {
  res.json({
    service: 'DashboardSIG API',
    version: '1.0.0',
    description: 'API Backend pour le microservice DashboardSIG - AgroTrace-MS',
    endpoints: {
      health: '/api/health',
      parcelles: '/api/parcelles',
      etatHydrique: '/api/etat-hydrique',
      alertes: '/api/alertes',
      recommandations: '/api/recommandations',
      stats: '/api/stats'
    },
    documentation: 'https://github.com/AgroTrace/DashboardSIG'
  });
});

// Routes API
app.use('/api', apiRoutes);

// ============================================================================
// GESTION DES ERREURS
// ============================================================================

// Route 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Route non trouvée',
    path: req.originalUrl,
    method: req.method
  });
});

// Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  
  res.status(err.status || 500).json({
    error: err.message || 'Erreur interne du serveur',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================================================
// DÉMARRAGE DU SERVEUR
// ============================================================================

app.listen(PORT, () => {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         🌾 DashboardSIG API - AgroTrace-MS 🌾            ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║  🚀 Serveur démarré sur le port ${PORT.toString().padEnd(26)}║`);
  console.log(`║  🌍 Environnement: ${(process.env.NODE_ENV || 'development').padEnd(36)}║`);
  console.log(`║  📡 URL API: http://localhost:${PORT.toString().padEnd(30)}║`);
  console.log('╚════════════════════════════════════════════════════════════╝\n');
});

// Gestion de l'arrêt propre
process.on('SIGTERM', () => {
  console.log('SIGTERM reçu. Arrêt du serveur...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT reçu. Arrêt du serveur...');
  process.exit(0);
});

export default app;
