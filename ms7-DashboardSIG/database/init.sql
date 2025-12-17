-- ============================================================================
-- Script d'initialisation PostGIS pour DashboardSIG - AgroTrace-MS
-- ============================================================================
-- Ce script initialise la base de données spatiale avec l'extension PostGIS
-- et crée les tables nécessaires pour la gestion des parcelles agricoles
-- ============================================================================

-- Activation de l'extension PostGIS pour les fonctionnalités géospatiales
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================================
-- TABLE: parcelles
-- Description: Stocke les parcelles agricoles avec leurs géométries (polygones)
-- SRID 4326: Système de coordonnées WGS84 (GPS standard)
-- ============================================================================
CREATE TABLE IF NOT EXISTS parcelles (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    culture VARCHAR(100) NOT NULL,
    superficie_ha DECIMAL(10, 2),
    date_semis DATE,
    geometry GEOMETRY(Polygon, 4326) NOT NULL,
    stress_hydrique VARCHAR(20) DEFAULT 'OK', -- OK, MODERE, CRITIQUE
    niveau_stress DECIMAL(3, 2) DEFAULT 0.0, -- 0.0 à 1.0
    besoin_eau_mm DECIMAL(5, 2) DEFAULT 0.0,
    derniere_irrigation DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index spatial pour optimiser les requêtes géographiques
CREATE INDEX IF NOT EXISTS idx_parcelles_geometry ON parcelles USING GIST (geometry);

-- ============================================================================
-- TABLE: alertes_maladies
-- Description: Alertes issues du service VisionPlante (détection par IA)
-- ============================================================================
CREATE TABLE IF NOT EXISTS alertes_maladies (
    id SERIAL PRIMARY KEY,
    parcelle_id INTEGER REFERENCES parcelles(id) ON DELETE CASCADE,
    type_maladie VARCHAR(100) NOT NULL,
    severite VARCHAR(20) NOT NULL, -- FAIBLE, MOYENNE, ELEVEE
    confiance DECIMAL(3, 2), -- Score de confiance de l'IA (0.0 à 1.0)
    date_detection TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    zone_affectee GEOMETRY(Polygon, 4326),
    description TEXT
);

CREATE INDEX IF NOT EXISTS idx_alertes_parcelle ON alertes_maladies(parcelle_id);

-- ============================================================================
-- TABLE: recommandations_irrigation
-- Description: Recommandations du service RecoIrrigation
-- ============================================================================
CREATE TABLE IF NOT EXISTS recommandations_irrigation (
    id SERIAL PRIMARY KEY,
    parcelle_id INTEGER REFERENCES parcelles(id) ON DELETE CASCADE,
    volume_mm DECIMAL(5, 2) NOT NULL,
    duree_minutes INTEGER,
    heure_optimale TIME,
    priorite VARCHAR(20), -- BASSE, NORMALE, HAUTE, URGENTE
    date_recommandation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    appliquee BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_reco_parcelle ON recommandations_irrigation(parcelle_id);

-- ============================================================================
-- DONNÉES DE DÉMONSTRATION - Région du Gharb, Maroc
-- Zone agricole céréalière autour de [34.251, -6.561]
-- ============================================================================

-- Parcelle 1: Canne à Sucre - Secteur A (Bon état - végétation luxuriante)
INSERT INTO parcelles (nom, culture, superficie_ha, date_semis, geometry, stress_hydrique, niveau_stress, besoin_eau_mm)
VALUES (
    'Secteur A - Canne à Sucre',
    'Canne à Sucre',
    45.0,
    '2024-10-01',
    ST_GeomFromGeoJSON('{
        "type": "Polygon",
        "coordinates": [[
            [-6.0180, 34.2890],
            [-6.0140, 34.2890],
            [-6.0140, 34.2930],
            [-6.0180, 34.2930],
            [-6.0180, 34.2890]
        ]]
    }'),
    'OK',
    0.15,
    12.00
);

-- Parcelle 2: Agrumes - Secteur B (Stress modéré)
INSERT INTO parcelles (nom, culture, superficie_ha, date_semis, geometry, stress_hydrique, niveau_stress, besoin_eau_mm)
VALUES (
    'Secteur B - Agrumes',
    'Orangers',
    22.0,
    '2023-02-15',
    ST_GeomFromGeoJSON('{
        "type": "Polygon",
        "coordinates": [[
            [-6.0180, 34.2840],
            [-6.0150, 34.2840],
            [-6.0150, 34.2880],
            [-6.0180, 34.2880],
            [-6.0180, 34.2840]
        ]]
    }'),
    'MODERE',
    0.48,
    32.00
);

-- Parcelle 3: Tomates Industrielles - Zone C Maraîchage (État critique)
INSERT INTO parcelles (nom, culture, superficie_ha, date_semis, geometry, stress_hydrique, niveau_stress, besoin_eau_mm)
VALUES (
    'Zone C - Maraîchage',
    'Tomates Industrielles',
    15.0,
    '2025-04-05',
    ST_GeomFromGeoJSON('{
        "type": "Polygon",
        "coordinates": [[
            [-6.0130, 34.2885],
            [-6.0110, 34.2885],
            [-6.0110, 34.2910],
            [-6.0130, 34.2910],
            [-6.0130, 34.2885]
        ]]
    }'),
    'CRITIQUE',
    0.82,
    58.00
);

-- ============================================================================
-- Alertes maladies (Démonstration)
-- ============================================================================
INSERT INTO alertes_maladies (parcelle_id, type_maladie, severite, confiance, description)
VALUES 
(1, 'Mildiou', 'MOYENNE', 0.78, 'Détection de taches caractéristiques sur les feuilles inférieures'),
(3, 'Oïdium', 'ELEVEE', 0.92, 'Forte présence de poudre blanche sur les feuilles - traitement urgent requis');

-- ============================================================================
-- Recommandations d'irrigation (Démonstration)
-- ============================================================================
INSERT INTO recommandations_irrigation (parcelle_id, volume_mm, duree_minutes, heure_optimale, priorite)
VALUES 
(1, 35.0, 120, '21:00:00', 'NORMALE'),
(3, 60.0, 180, '20:30:00', 'URGENTE'),
(4, 28.0, 95, '22:00:00', 'NORMALE');

-- ============================================================================
-- VUES UTILES
-- ============================================================================

-- Vue simplifiée: parcelles_simple (pour compatibilité avec le backend)
CREATE OR REPLACE VIEW parcelles_simple AS
SELECT 
    id,
    nom,
    culture,
    superficie_ha,
    date_semis,
    geometry,
    stress_hydrique,
    niveau_stress,
    besoin_eau_mm,
    derniere_irrigation,
    created_at,
    updated_at
FROM parcelles;

-- Vue: Parcelles avec leurs alertes actives
CREATE OR REPLACE VIEW v_parcelles_alertes AS
SELECT 
    p.id,
    p.nom,
    p.culture,
    p.stress_hydrique,
    p.niveau_stress,
    COUNT(a.id) as nb_alertes,
    MAX(a.severite) as severite_max
FROM parcelles p
LEFT JOIN alertes_maladies a ON p.id = a.parcelle_id
GROUP BY p.id, p.nom, p.culture, p.stress_hydrique, p.niveau_stress;

-- Vue: Dashboard complet avec recommandations
CREATE OR REPLACE VIEW v_dashboard_complet AS
SELECT 
    p.id,
    p.nom,
    p.culture,
    p.superficie_ha,
    p.stress_hydrique,
    p.niveau_stress,
    p.besoin_eau_mm,
    ST_AsGeoJSON(p.geometry) as geojson,
    COUNT(DISTINCT a.id) as nb_alertes,
    COUNT(DISTINCT r.id) as nb_recommandations,
    MAX(r.priorite) as priorite_max
FROM parcelles p
LEFT JOIN alertes_maladies a ON p.id = a.parcelle_id
LEFT JOIN recommandations_irrigation r ON p.id = r.parcelle_id
GROUP BY p.id, p.nom, p.culture, p.superficie_ha, p.stress_hydrique, p.niveau_stress, p.besoin_eau_mm, p.geometry;

-- ============================================================================
-- Fonction utilitaire: Calculer le centre d'une parcelle
-- ============================================================================
CREATE OR REPLACE FUNCTION get_parcelle_center(parcelle_id INTEGER)
RETURNS JSON AS $$
DECLARE
    center_point GEOMETRY;
    result JSON;
BEGIN
    SELECT ST_Centroid(geometry) INTO center_point
    FROM parcelles
    WHERE id = parcelle_id;
    
    SELECT json_build_object(
        'lat', ST_Y(center_point),
        'lng', ST_X(center_point)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FIN DU SCRIPT D'INITIALISATION
-- ============================================================================
