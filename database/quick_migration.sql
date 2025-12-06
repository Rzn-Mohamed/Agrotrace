-- Quick migration script to add MS7 tables to existing TimescaleDB
-- Run this to add geospatial capabilities without losing existing data

-- Enable PostGIS (requires timescaledb-ha image or manual PostGIS installation)
-- CREATE EXTENSION IF NOT EXISTS postgis CASCADE;

-- For now, we'll use a simplified approach without full PostGIS
-- Store geometries as JSON/TEXT until we can migrate to PostGIS-enabled image

-- Add parcelles table (simplified without PostGIS for now)
CREATE TABLE IF NOT EXISTS parcelles_simple (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    culture VARCHAR(100) NOT NULL,
    superficie_ha DECIMAL(10, 2),
    date_semis DATE,
    geometry_json TEXT, -- Store GeoJSON as text temporarily
    stress_hydrique VARCHAR(20) DEFAULT 'OK',
    niveau_stress DECIMAL(3, 2) DEFAULT 0.0,
    besoin_eau_mm DECIMAL(5, 2) DEFAULT 0.0,
    derniere_irrigation DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add irrigation_recommendations table
CREATE TABLE IF NOT EXISTS irrigation_recommendations (
    id SERIAL PRIMARY KEY,
    parcelle_id INTEGER, -- No FK constraint for now
    recommendation_date TIMESTAMPTZ DEFAULT NOW(),
    
    -- AI-generated values
    volume_mm DECIMAL(5, 2) NOT NULL,
    duration_minutes INTEGER,
    optimal_time TIME,
    priority VARCHAR(20) NOT NULL,
    
    -- Input context
    current_soil_moisture DECIMAL(5, 2),
    predicted_water_need DECIMAL(5, 2),
    weather_forecast TEXT,
    
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

CREATE INDEX IF NOT EXISTS idx_irrigation_reco_parcelle ON irrigation_recommendations (parcelle_id, recommendation_date DESC);
CREATE INDEX IF NOT EXISTS idx_irrigation_reco_priority ON irrigation_recommendations (priority, applied) WHERE NOT applied;

-- Add alertes_maladies table
CREATE TABLE IF NOT EXISTS alertes_maladies (
    id SERIAL PRIMARY KEY,
    parcelle_id INTEGER,
    type_maladie VARCHAR(100) NOT NULL,
    severite VARCHAR(20) NOT NULL,
    confiance DECIMAL(3, 2),
    date_detection TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    zone_affectee TEXT, -- GeoJSON as text
    description TEXT,
    image_url TEXT,
    model_version VARCHAR(50)
);

CREATE INDEX IF NOT EXISTS idx_alertes_parcelle ON alertes_maladies(parcelle_id);

-- Insert demo data for Parcel 300
INSERT INTO parcelles_simple (id, nom, culture, superficie_ha, date_semis, geometry_json, stress_hydrique, niveau_stress, besoin_eau_mm)
VALUES (
    300,
    'Dynamic Field (Live AI)',
    'Wheat',
    4.0,
    '2023-11-01',
    '{"type":"Polygon","coordinates":[[[-7.58,33.58],[-7.57,33.58],[-7.57,33.57],[-7.58,33.57],[-7.58,33.58]]]}',
    'CRITIQUE',
    0.85,
    0.0
) ON CONFLICT (id) DO UPDATE SET
    nom = EXCLUDED.nom,
    culture = EXCLUDED.culture,
    stress_hydrique = EXCLUDED.stress_hydrique,
    niveau_stress = EXCLUDED.niveau_stress;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO agrotrace_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO agrotrace_admin;
