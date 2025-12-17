-- ============================================================================
-- AgroTrace - Unified Database Initialization Script
-- TimescaleDB + PostGIS Integration
-- ============================================================================
-- This script creates a unified database for all microservices:
-- - Time-series data (sensor readings, forecasts)
-- - Geospatial data (parcels with PostGIS)
-- - Recommendations and alerts
-- ============================================================================

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

-- Enable TimescaleDB for time-series optimization
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Enable PostGIS for geospatial data
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================================
-- TABLE: parcelles (Geospatial + Agricultural Metadata)
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

-- Spatial index for geo queries
CREATE INDEX IF NOT EXISTS idx_parcelles_geometry ON parcelles USING GIST (geometry);

-- ============================================================================
-- TABLE: sensor_data (Time-series - MS1)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sensor_data (
    time TIMESTAMPTZ NOT NULL,
    parcelle_id INTEGER REFERENCES parcelles(id) ON DELETE CASCADE,
    sensor_id VARCHAR(50) NOT NULL,
    temperature DOUBLE PRECISION,
    humidity DOUBLE PRECISION,
    soil_moisture DOUBLE PRECISION,
    light_intensity DOUBLE PRECISION,
    metadata JSONB
);

-- Convert to hypertable for time-series optimization
SELECT create_hypertable('sensor_data', 'time', if_not_exists => TRUE);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_sensor_parcelle ON sensor_data (parcelle_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_id ON sensor_data (sensor_id, time DESC);

-- ============================================================================
-- TABLE: water_forecasts (Time-series - MS4)
-- ============================================================================
CREATE TABLE IF NOT EXISTS water_forecasts (
    time TIMESTAMPTZ NOT NULL,
    parcelle_id INTEGER REFERENCES parcelles(id) ON DELETE CASCADE,
    forecast_date DATE NOT NULL,
    predicted_water_need_mm DOUBLE PRECISION,
    confidence_score DOUBLE PRECISION,
    weather_temp_c DOUBLE PRECISION,
    weather_humidity DOUBLE PRECISION,
    evapotranspiration_mm DOUBLE PRECISION,
    model_version VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Convert to hypertable
SELECT create_hypertable('water_forecasts', 'time', if_not_exists => TRUE);

-- Index for parcelle lookups
CREATE INDEX IF NOT EXISTS idx_forecast_parcelle ON water_forecasts (parcelle_id, forecast_date);

-- ============================================================================
-- TABLE: irrigation_recommendations (MS6 - AI Recommendations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS irrigation_recommendations (
    id SERIAL PRIMARY KEY,
    parcelle_id INTEGER REFERENCES parcelles(id) ON DELETE CASCADE,
    recommendation_date TIMESTAMPTZ DEFAULT NOW(),
    
    -- AI-generated values
    volume_mm DECIMAL(5, 2) NOT NULL,
    duration_minutes INTEGER,
    optimal_time TIME,
    priority VARCHAR(20) NOT NULL, -- LOW, MEDIUM, HIGH, URGENT
    
    -- Input context
    current_soil_moisture DECIMAL(5, 2),
    predicted_water_need DECIMAL(5, 2),
    weather_forecast JSONB,
    
    -- AI model info
    model_used VARCHAR(50),
    confidence_score DECIMAL(3, 2),
    reasoning TEXT,
    
    -- Status
    applied BOOLEAN DEFAULT FALSE,
    applied_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_irrigation_reco_parcelle ON irrigation_recommendations (parcelle_id, recommendation_date DESC);
CREATE INDEX IF NOT EXISTS idx_irrigation_reco_priority ON irrigation_recommendations (priority, applied) WHERE NOT applied;

-- ============================================================================
-- TABLE: alertes_maladies (MS3 - Plant Disease Detection)
-- ============================================================================
CREATE TABLE IF NOT EXISTS alertes_maladies (
    id SERIAL PRIMARY KEY,
    parcelle_id INTEGER REFERENCES parcelles(id) ON DELETE CASCADE,
    type_maladie VARCHAR(100) NOT NULL,
    severite VARCHAR(20) NOT NULL, -- FAIBLE, MOYENNE, ELEVEE
    confiance DECIMAL(3, 2), -- AI confidence score (0.0 à 1.0)
    date_detection TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    zone_affectee GEOMETRY(Polygon, 4326),
    description TEXT,
    image_url TEXT,
    model_version VARCHAR(50)
);

CREATE INDEX IF NOT EXISTS idx_alertes_parcelle ON alertes_maladies(parcelle_id);
CREATE INDEX IF NOT EXISTS idx_alertes_zone ON alertes_maladies USING GIST (zone_affectee);

-- ============================================================================
-- TABLE: agro_rules_execution (MS5 - Rule Engine Logs)
-- ============================================================================
CREATE TABLE IF NOT EXISTS agro_rules_execution (
    id SERIAL PRIMARY KEY,
    parcelle_id INTEGER REFERENCES parcelles(id) ON DELETE CASCADE,
    rule_name VARCHAR(100) NOT NULL,
    rule_type VARCHAR(50), -- IRRIGATION, FERTILIZATION, PEST_CONTROL
    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    conditions_met JSONB,
    actions_recommended JSONB,
    severity VARCHAR(20)
);

CREATE INDEX IF NOT EXISTS idx_rules_parcelle ON agro_rules_execution (parcelle_id, triggered_at DESC);

-- ============================================================================
-- DEMO DATA - Région du Gharb, Maroc
-- ============================================================================

-- Parcelle 1: Canne à Sucre - Good state
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
) ON CONFLICT DO NOTHING;

-- Parcelle 2: Agrumes - Moderate stress
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
) ON CONFLICT DO NOTHING;

-- Parcelle 3: Tomates - Critical stress
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
) ON CONFLICT DO NOTHING;

-- Parcelle 300: Dynamic Test Field (for integration testing)
INSERT INTO parcelles (id, nom, culture, superficie_ha, date_semis, geometry, stress_hydrique, niveau_stress, besoin_eau_mm)
VALUES (
    300,
    'Dynamic Field (Live AI)',
    'Wheat',
    4.0,
    '2023-11-01',
    ST_GeomFromGeoJSON('{
        "type": "Polygon",
        "coordinates": [[
            [-7.58, 33.58],
            [-7.57, 33.58],
            [-7.57, 33.57],
            [-7.58, 33.57],
            [-7.58, 33.58]
        ]]
    }'),
    'CRITIQUE',
    0.85,
    0.0
) ON CONFLICT (id) DO UPDATE SET
    nom = EXCLUDED.nom,
    culture = EXCLUDED.culture,
    stress_hydrique = EXCLUDED.stress_hydrique,
    niveau_stress = EXCLUDED.niveau_stress;

-- ============================================================================
-- DEMO: Disease Alerts
-- ============================================================================
INSERT INTO alertes_maladies (parcelle_id, type_maladie, severite, confiance, description)
VALUES 
(1, 'Mildiou', 'MOYENNE', 0.78, 'Détection de taches caractéristiques sur les feuilles inférieures'),
(3, 'Oïdium', 'ELEVEE', 0.92, 'Forte présence de poudre blanche sur les feuilles - traitement urgent requis')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- DEMO: Irrigation Recommendations
-- ============================================================================
INSERT INTO irrigation_recommendations (parcelle_id, volume_mm, duration_minutes, optimal_time, priority, reasoning)
VALUES 
(1, 35.0, 120, '21:00:00', 'MEDIUM', 'Regular maintenance irrigation based on crop cycle'),
(3, 60.0, 180, '20:30:00', 'URGENT', 'Critical water stress detected - immediate irrigation required')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VIEWS FOR DASHBOARD
-- ============================================================================

-- View: Simplified parcels view (for backend compatibility)
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

-- View: Parcels with active alerts
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

-- View: Complete dashboard with recommendations
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
    MAX(r.priority) as priorite_max
FROM parcelles p
LEFT JOIN alertes_maladies a ON p.id = a.parcelle_id
LEFT JOIN irrigation_recommendations r ON p.id = r.parcelle_id AND r.applied = false
GROUP BY p.id, p.nom, p.culture, p.superficie_ha, p.stress_hydrique, p.niveau_stress, p.besoin_eau_mm, p.geometry;

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function: Get parcel center coordinates
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

-- Function: Get latest sensor reading for a parcel
CREATE OR REPLACE FUNCTION get_latest_sensor_data(parcelle_id INTEGER)
RETURNS JSON AS $$
BEGIN
    RETURN (
        SELECT json_build_object(
            'temperature', temperature,
            'humidity', humidity,
            'soil_moisture', soil_moisture,
            'light_intensity', light_intensity,
            'timestamp', time
        )
        FROM sensor_data
        WHERE sensor_data.parcelle_id = get_latest_sensor_data.parcelle_id
        ORDER BY time DESC
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PERMISSIONS (Production: create dedicated users)
-- ============================================================================

-- Grant permissions to the main user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO agrotrace_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO agrotrace_admin;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO agrotrace_admin;

-- ============================================================================
-- END OF UNIFIED INITIALIZATION SCRIPT
-- ============================================================================
