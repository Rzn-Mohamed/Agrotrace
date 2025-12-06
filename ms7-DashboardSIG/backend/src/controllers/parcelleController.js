/**
 * Contrôleur pour la gestion des parcelles et données géospatiales
 * DashboardSIG - AgroTrace-MS
 */

import { query } from '../config/database.js';
import { enrichParcelWithMicroservicesData } from '../services/microservicesIntegration.js';

/**
 * GET /api/parcelles
 * Retourne toutes les parcelles au format GeoJSON avec leurs métadonnées
 */
export const getParcelles = async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        json_build_object(
          'type', 'FeatureCollection',
          'features', COALESCE(json_agg(
            json_build_object(
              'type', 'Feature',
              'id', parcelle_data.id,
              'geometry', parcelle_data.geometry_json::json,
              'properties', json_build_object(
                'id', parcelle_data.id,
                'nom', parcelle_data.nom,
                'culture', parcelle_data.culture,
                'superficie_ha', parcelle_data.superficie_ha,
                'date_semis', parcelle_data.date_semis,
                'stress_hydrique', parcelle_data.stress_hydrique,
                'niveau_stress', parcelle_data.niveau_stress,
                'besoin_eau_mm', parcelle_data.besoin_eau_mm,
                'derniere_irrigation', parcelle_data.derniere_irrigation,
                'nb_alertes', parcelle_data.nb_alertes,
                'nb_recommandations', parcelle_data.nb_reco
              )
            )
          ), '[]'::json)
        ) as geojson
      FROM (
        SELECT 
          p.id,
          p.nom,
          p.culture,
          p.superficie_ha,
          p.date_semis,
          p.stress_hydrique,
          p.niveau_stress,
          p.besoin_eau_mm,
          p.derniere_irrigation,
          p.geometry_json,
          0 as nb_alertes,
          0 as nb_reco
        FROM parcelles_simple p
      ) parcelle_data
    `);

    res.json(result.rows[0].geojson);
  } catch (error) {
    console.error('Erreur lors de la récupération des parcelles:', error);
    res.status(500).json({ 
      error: 'Erreur serveur', 
      message: error.message 
    });
  }
};

/**
 * GET /api/parcelles/:id
 * Retourne une parcelle spécifique avec tous ses détails
 * Optionally enriches with microservices data if ?enrich=true
 */
export const getParcelleById = async (req, res) => {
  const { id } = req.params;
  const { enrich } = req.query;

  try {
    const result = await query(`
      SELECT 
        p.id,
        p.nom,
        p.culture,
        p.superficie_ha,
        p.date_semis,
        p.stress_hydrique,
        p.niveau_stress,
        p.besoin_eau_mm,
        p.derniere_irrigation,
        p.geometry_json::json as geometry,
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'id', a.id,
              'type_maladie', a.type_maladie,
              'severite', a.severite,
              'confiance', a.confiance,
              'date_detection', a.date_detection,
              'description', a.description
            )
          ) FROM alertes_maladies a WHERE a.parcelle_id = p.id),
          '[]'::json
        ) as alertes,
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'id', r.id,
              'volume_mm', r.volume_mm,
              'duration_minutes', r.duration_minutes,
              'optimal_time', r.optimal_time,
              'priority', r.priority,
              'recommendation_date', r.recommendation_date,
              'applied', r.applied
            )
          ) FROM irrigation_recommendations r WHERE r.parcelle_id = p.id AND r.applied = false),
          '[]'::json
        ) as recommandations
      FROM parcelles_simple p
      WHERE p.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Parcelle non trouvée' });
    }

    let parcelData = result.rows[0];
    
    // Enrich with microservices data if requested
    if (enrich === 'true') {
      parcelData = await enrichParcelWithMicroservicesData(parcelData);
    }

    res.json(parcelData);
  } catch (error) {
    console.error('Erreur lors de la récupération de la parcelle:', error);
    res.status(500).json({ 
      error: 'Erreur serveur', 
      message: error.message 
    });
  }
};

/**
 * GET /api/etat-hydrique
 * Retourne l'état hydrique de toutes les parcelles
 * (Simule les données venant des services IoT/Drones)
 */
export const getEtatHydrique = async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        p.id,
        p.nom,
        p.culture,
        p.stress_hydrique,
        p.niveau_stress,
        p.besoin_eau_mm,
        p.derniere_irrigation,
        -- Simulation de données IoT
        json_build_object(
          'humidite_sol', ROUND((RANDOM() * 40 + 30)::numeric, 2),
          'temperature_sol', ROUND((RANDOM() * 10 + 15)::numeric, 2),
          'evapotranspiration', ROUND((RANDOM() * 5 + 2)::numeric, 2),
          'derniere_mesure', NOW() - interval '15 minutes'
        ) as donnees_iot,
        -- Simulation de données Drone
        json_build_object(
          'ndvi', ROUND((1 - p.niveau_stress * 0.5)::numeric, 2),
          'ndwi', ROUND((0.3 + (1 - p.niveau_stress) * 0.4)::numeric, 2),
          'temperature_surface', ROUND((RANDOM() * 8 + 20)::numeric, 2),
          'derniere_acquisition', NOW() - interval '2 hours'
        ) as donnees_drone
      FROM parcelles_simple p
      ORDER BY p.niveau_stress DESC
    `);

    res.json({
      timestamp: new Date().toISOString(),
      count: result.rows.length,
      parcelles: result.rows,
      statistiques: {
        critique: result.rows.filter(p => p.stress_hydrique === 'CRITIQUE').length,
        modere: result.rows.filter(p => p.stress_hydrique === 'MODERE').length,
        ok: result.rows.filter(p => p.stress_hydrique === 'OK').length
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'état hydrique:', error);
    res.status(500).json({ 
      error: 'Erreur serveur', 
      message: error.message 
    });
  }
};

/**
 * GET /api/alertes
 * Retourne toutes les alertes maladies actives
 */
export const getAlertes = async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        a.id,
        a.type_maladie,
        a.severite,
        a.confiance,
        a.date_detection,
        a.description,
        json_build_object(
          'id', p.id,
          'nom', p.nom,
          'culture', p.culture
        ) as parcelle
      FROM alertes_maladies a
      JOIN parcelles p ON a.parcelle_id = p.id
      ORDER BY a.date_detection DESC
    `);

    res.json({
      count: result.rows.length,
      alertes: result.rows
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des alertes:', error);
    res.status(500).json({ 
      error: 'Erreur serveur', 
      message: error.message 
    });
  }
};

/**
 * GET /api/recommandations
 * Retourne toutes les recommandations d'irrigation non appliquées
 */
export const getRecommandations = async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        r.id,
        r.volume_mm,
        r.duration_minutes,
        r.optimal_time,
        r.priority,
        r.recommendation_date,
        json_build_object(
          'id', p.id,
          'nom', p.nom,
          'culture', p.culture,
          'superficie_ha', p.superficie_ha
        ) as parcelle
      FROM irrigation_recommendations r
      JOIN parcelles_simple p ON r.parcelle_id = p.id
      WHERE r.applied = false
      ORDER BY 
        CASE r.priority
          WHEN 'URGENT' THEN 1
          WHEN 'HIGH' THEN 2
          WHEN 'MEDIUM' THEN 3
          WHEN 'LOW' THEN 4
        END,
        r.recommendation_date DESC
    `);

    res.json({
      count: result.rows.length,
      recommandations: result.rows
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des recommandations:', error);
    res.status(500).json({ 
      error: 'Erreur serveur', 
      message: error.message 
    });
  }
};

/**
 * GET /api/stats
 * Retourne les statistiques globales du système
 */
export const getStats = async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        COUNT(*) as total_parcelles,
        SUM(superficie_ha) as superficie_totale,
        COUNT(CASE WHEN stress_hydrique = 'CRITIQUE' THEN 1 END) as parcelles_critiques,
        COUNT(CASE WHEN stress_hydrique = 'MODERE' THEN 1 END) as parcelles_moderees,
        COUNT(CASE WHEN stress_hydrique = 'OK' THEN 1 END) as parcelles_ok,
        ROUND(AVG(niveau_stress)::numeric, 2) as stress_moyen,
        ROUND(SUM(besoin_eau_mm * superficie_ha)::numeric, 2) as volume_eau_total_mm
      FROM parcelles_simple
    `);

    const alertesResult = await query(`
      SELECT COUNT(*) as total_alertes,
        COUNT(CASE WHEN severite = 'ELEVEE' THEN 1 END) as alertes_elevees
      FROM alertes_maladies
    `);

    const recoResult = await query(`
      SELECT COUNT(*) as total_recommandations,
        COUNT(CASE WHEN priority = 'URGENT' THEN 1 END) as reco_urgentes
      FROM irrigation_recommendations
      WHERE applied = false
    `);

    res.json({
      ...result.rows[0],
      ...alertesResult.rows[0],
      ...recoResult.rows[0],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ 
      error: 'Erreur serveur', 
      message: error.message 
    });
  }
};

/**
 * POST /api/recommandations/:id/appliquer
 * Marque une recommandation comme appliquée
 */
export const appliquerRecommandation = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query(`
      UPDATE irrigation_recommendations
      SET applied = true, applied_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recommandation non trouvée' });
    }

    res.json({
      message: 'Recommandation marquée comme appliquée',
      recommandation: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la recommandation:', error);
    res.status(500).json({ 
      error: 'Erreur serveur', 
      message: error.message 
    });
  }
};
