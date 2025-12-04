/**
 * Configuration de la connexion PostgreSQL/PostGIS
 * DashboardSIG - AgroTrace-MS
 */

import pg from 'pg';
const { Pool } = pg;

// Configuration de la connexion avec variables d'environnement
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'agrotrace_sig',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20, // Nombre maximum de connexions dans le pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Gestion des erreurs de connexion
pool.on('error', (err, client) => {
  console.error('Erreur inattendue sur le client PostgreSQL:', err);
  process.exit(-1);
});

// Test de connexion au démarrage
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Erreur de connexion à PostgreSQL:', err);
  } else {
    console.log('✅ Connexion PostgreSQL établie:', res.rows[0].now);
  }
});

// Fonction helper pour les requêtes
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Requête exécutée:', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Erreur lors de la requête:', error);
    throw error;
  }
};

// Fonction pour obtenir un client du pool (pour les transactions)
export const getClient = () => pool.connect();

export default pool;
