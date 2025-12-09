/**
 * Composant MapComponent - Carte interactive avec Leaflet
 * DashboardSIG - AgroTrace-MS
 * 
 * Affiche les parcelles agricoles avec:
 * - Layer Switcher (Satellite/Street/Terrain)
 * - Parcel Search avec autocomplete
 * - Indicateurs centrés avec base verte agricole
 * - Popup interactive au clic
 * - Widget Quick Stats overlay
 * - Intégration des alertes et recommandations
 */

import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Rectangle, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getParcelles, getParcelleById, getStats } from '../../services/api';
import ParcellePopup from './ParcellePopup';
import { 
  AlertTriangle, 
  Droplet, 
  MapPin, 
  TrendingUp, 
  Search, 
  Layers, 
  Satellite, 
  Map as MapIcon,
  Mountain,
  X
} from 'lucide-react';

import './MapComponent.css';

// Fix pour les icônes Leaflet avec Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/**
 * Détermine la couleur de l'indicateur selon le niveau de stress hydrique
 */
const getStatusColor = (stressHydrique) => {
  switch (stressHydrique) {
    case 'CRITIQUE':
      return '#ef4444'; // Rouge vif
    case 'MODERE':
      return '#f59e0b'; // Orange
    case 'OK':
      return '#10b981'; // Vert émeraude
    default:
      return '#6b7280'; // Gris (inconnu)
  }
};

/**
 * Custom parcel positions based on user's drawing layout
 * Positions match the agricultural fields visible in the satellite image
 * Arrows in drawing pointed to specific field locations
 */
const FARM_CENTER = { lat: 34.2870, lng: -6.0180 };
const PARCEL_SPACING = 0.004; // Spacing between parcels

// Custom positions matching the user's drawn arrows on the farm fields
const PARCEL_POSITIONS = [
  // Left farm field cluster (main green area)
  { row: 1.5, col: -2 },    // Top-left of left cluster
  { row: 1.5, col: -1 },    // Top-right of left cluster
  { row: 2.5, col: -2.5 },  // Middle-left
  { row: 2.5, col: -1.5 },  // Middle-center
  { row: 2.5, col: -0.5 },  // Middle-right
  { row: 3.5, col: -2 },    // Bottom-left
  { row: 3.5, col: -1 },    // Bottom-right
  
  // Right farm field area (scattered)
  { row: 1, col: 2 },       // Top-right area
  { row: 2, col: 1.5 },     // Middle-right
  { row: 2, col: 2.5 },     // Middle-far-right
  { row: 3, col: 2 },       // Bottom-right
];

/**
 * Get the grid position for a parcel based on its index
 */
const getGridPosition = (index) => {
  const pos = PARCEL_POSITIONS[index % PARCEL_POSITIONS.length];
  return {
    lat: FARM_CENTER.lat - (pos.row * PARCEL_SPACING),
    lng: FARM_CENTER.lng + (pos.col * PARCEL_SPACING)
  };
};

/**
 * Calcule le centroïde d'un polygone GeoJSON
 * Uses grid-based positioning for cohesive farm layout
 */
const getCentroid = (geometry, index = 0) => {
  return getGridPosition(index);
};

/**
 * Layer Switcher Component
 */
const LayerSwitcher = ({ activeLayer, onLayerChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const layers = [
    { id: 'satellite', label: 'Satellite', icon: <Satellite size={16} /> },
    { id: 'streets', label: 'Rues', icon: <MapIcon size={16} /> },
    { id: 'terrain', label: 'Terrain', icon: <Mountain size={16} /> }
  ];

  return (
    <div className={`layer-switcher ${isOpen ? 'open' : ''}`}>
      <button 
        className="layer-switcher-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="Changer le fond de carte"
      >
        <Layers size={18} />
      </button>
      
      {isOpen && (
        <div className="layer-options">
          {layers.map(layer => (
            <button
              key={layer.id}
              className={`layer-option ${activeLayer === layer.id ? 'active' : ''}`}
              onClick={() => {
                onLayerChange(layer.id);
                setIsOpen(false);
              }}
            >
              {layer.icon}
              <span>{layer.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Parcel Search Component
 */
const ParcelSearch = ({ parcelles, onSelect }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (query.length >= 2 && parcelles?.features) {
      const filtered = parcelles.features.filter(f => 
        f.properties.nom?.toLowerCase().includes(query.toLowerCase()) ||
        f.properties.culture?.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered.slice(0, 5));
      setIsOpen(true);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [query, parcelles]);

  const handleSelect = async (feature) => {
    try {
      const details = await getParcelleById(feature.properties.id);
      onSelect(details);
      setQuery('');
      setIsOpen(false);
    } catch (err) {
      console.error('Erreur lors de la sélection:', err);
    }
  };

  return (
    <div className="parcel-search">
      <div className="search-input-wrapper">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Rechercher une parcelle..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
        />
        {query && (
          <button 
            className="search-clear"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>
      
      {isOpen && results.length > 0 && (
        <div className="search-results">
          {results.map((feature, idx) => (
            <button
              key={feature.properties.id || idx}
              className="search-result-item"
              onClick={() => handleSelect(feature)}
            >
              <div className="result-main">
                <span className="result-name">{feature.properties.nom}</span>
                <span className={`result-status status-${feature.properties.stress_hydrique?.toLowerCase()}`}>
                  {feature.properties.stress_hydrique}
                </span>
              </div>
              <span className="result-culture">🌱 {feature.properties.culture}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Composant Quick Stats Widget
 */
const QuickStatsWidget = ({ stats, loading }) => {
  if (loading || !stats) {
    return (
      <div className="quick-stats-widget">
        <div className="quick-stats-loading">
          <div className="spinner-mini"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="quick-stats-widget">
      <div className="quick-stats-header">
        <span className="quick-stats-title">📊 Aperçu</span>
      </div>
      <div className="quick-stats-grid">
        <div className="quick-stat-item">
          <div className="quick-stat-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
            <MapPin size={14} />
          </div>
          <div className="quick-stat-data">
            <span className="quick-stat-value">{stats.total_parcelles || 0}</span>
            <span className="quick-stat-label">Parcelles</span>
          </div>
        </div>
        <div className="quick-stat-item">
          <div className="quick-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <TrendingUp size={14} />
          </div>
          <div className="quick-stat-data">
            <span className="quick-stat-value">{stats.superficie_totale || 0}</span>
            <span className="quick-stat-label">Hectares</span>
          </div>
        </div>
        <div className="quick-stat-item critical">
          <div className="quick-stat-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
            <AlertTriangle size={14} />
          </div>
          <div className="quick-stat-data">
            <span className="quick-stat-value">{stats.parcelles_critiques || 0}</span>
            <span className="quick-stat-label">Critiques</span>
          </div>
        </div>
        <div className="quick-stat-item">
          <div className="quick-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <Droplet size={14} />
          </div>
          <div className="quick-stat-data">
            <span className="quick-stat-value">{stats.stress_moyen || 'N/A'}</span>
            <span className="quick-stat-label">Stress Moy.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Composant pour ajuster la vue de la carte aux limites des parcelles
 */
const FitBounds = ({ geojsonData }) => {
  const map = useMap();

  useEffect(() => {
    if (geojsonData && geojsonData.features && geojsonData.features.length > 0) {
      // Create bounds based on grid layout
      const gridPadding = PARCEL_SPACING * 4;
      const bounds = L.latLngBounds(
        [FARM_CENTER.lat - gridPadding, FARM_CENTER.lng - gridPadding * 4],
        [FARM_CENTER.lat + gridPadding, FARM_CENTER.lng + gridPadding * 3]
      );
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [geojsonData, map]);

  return null;
};

/**
 * Composant Parcel Marker - Indicateur carré avec base agricole
 */
const PARCEL_SIZE = 0.003; // Size of each parcel square (~300m)
const INNER_SIZE = 0.002; // Size of the inner status square

const ParcelMarker = ({ feature, onSelect, parcelIndex }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const { id, nom, culture, stress_hydrique, superficie } = feature.properties;
  const centroid = getCentroid(feature.geometry, parcelIndex);
  
  if (!centroid) return null;
  
  const statusColor = getStatusColor(stress_hydrique);
  const isCritical = stress_hydrique === 'CRITIQUE';
  
  // Calculate square bounds around centroid
  const outerSize = isHovered ? PARCEL_SIZE * 1.15 : PARCEL_SIZE;
  const innerSize = isHovered ? INNER_SIZE * 1.15 : INNER_SIZE;
  
  const outerBounds = [
    [centroid.lat - outerSize / 2, centroid.lng - outerSize / 2],
    [centroid.lat + outerSize / 2, centroid.lng + outerSize / 2]
  ];
  
  const innerBounds = [
    [centroid.lat - innerSize / 2, centroid.lng - innerSize / 2],
    [centroid.lat + innerSize / 2, centroid.lng + innerSize / 2]
  ];
  
  const handleClick = async () => {
    try {
      const parcelleDetails = await getParcelleById(id);
      onSelect(parcelleDetails);
    } catch (err) {
      console.error('Erreur lors de la récupération des détails:', err);
    }
  };

  return (
    <>
      {/* Base verte agricole (carré extérieur) */}
      <Rectangle
        bounds={outerBounds}
        pathOptions={{
          fillColor: '#166534',
          fillOpacity: 0.9,
          color: 'rgba(255, 255, 255, 0.5)',
          weight: 2,
        }}
        eventHandlers={{
          mouseover: () => setIsHovered(true),
          mouseout: () => setIsHovered(false),
          click: handleClick
        }}
      />
      
      {/* Indicateur de statut (carré intérieur) */}
      <Rectangle
        bounds={innerBounds}
        pathOptions={{
          fillColor: statusColor,
          fillOpacity: 1,
          color: 'rgba(255, 255, 255, 0.95)',
          weight: 2,
        }}
        className={isCritical ? 'pulse-critical' : ''}
        eventHandlers={{
          mouseover: () => setIsHovered(true),
          mouseout: () => setIsHovered(false),
          click: handleClick
        }}
      >
        <Tooltip 
          direction="top" 
          offset={[0, -15]} 
          className="parcel-tooltip-modern"
        >
          <div className="tooltip-content">
            <div className="tooltip-header">
              <strong>{nom}</strong>
              <span className={`status-badge status-${stress_hydrique?.toLowerCase()}`}>
                {stress_hydrique}
              </span>
            </div>
            <div className="tooltip-details">
              <span>🌱 {culture}</span>
              {superficie && <span>📐 {superficie} ha</span>}
            </div>
          </div>
        </Tooltip>
      </Rectangle>
    </>
  );
};

/**
 * Tile Layer URLs for different map styles
 */
const TILE_LAYERS = {
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  },
  streets: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors'
  },
  terrain: {
    url: 'https://stamen-tiles.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg',
    attribution: 'Map tiles by Stamen Design, under CC BY 3.0. Data by OpenStreetMap'
  }
};

/**
 * Dynamic Tile Layer Component
 */
const DynamicTileLayer = ({ layerId }) => {
  const layer = TILE_LAYERS[layerId] || TILE_LAYERS.satellite;
  return (
    <TileLayer
      key={layerId}
      attribution={layer.attribution}
      url={layer.url}
      maxZoom={19}
    />
  );
};

/**
 * Composant principal de la carte
 */
const MapComponent = ({ onParcelleSelect }) => {
  const [geojsonData, setGeojsonData] = useState(null);
  const [selectedParcelle, setSelectedParcelle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activeLayer, setActiveLayer] = useState('satellite');

  // Chargement des parcelles et statistiques au montage
  useEffect(() => {
    loadParcelles();
    loadStats();
  }, []);

  /**
   * Charge les données GeoJSON des parcelles depuis l'API
   */
  const loadParcelles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getParcelles();
      setGeojsonData(data);
    } catch (err) {
      console.error('Erreur lors du chargement des parcelles:', err);
      setError('Impossible de charger les parcelles. Vérifiez que le backend est démarré.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Charge les statistiques pour le widget Quick Stats
   */
  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const data = await getStats();
      setStats(data);
    } catch (err) {
      console.error('Erreur lors du chargement des stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  /**
   * Gestionnaire de sélection de parcelle
   */
  const handleParcelSelect = (parcelleDetails) => {
    setSelectedParcelle(parcelleDetails);
    if (onParcelleSelect) {
      onParcelleSelect(parcelleDetails);
    }
  };

  /**
   * Ferme la popup
   */
  const closePopup = () => {
    setSelectedParcelle(null);
    if (onParcelleSelect) {
      onParcelleSelect(null);
    }
  };

  // Liste mémorisée des marqueurs
  const markers = useMemo(() => {
    if (!geojsonData || !geojsonData.features) return [];
    return geojsonData.features.map((feature, idx) => (
      <ParcelMarker 
        key={feature.properties.id || idx} 
        feature={feature} 
        onSelect={handleParcelSelect}
        parcelIndex={idx}
      />
    ));
  }, [geojsonData]);

  // Affichage pendant le chargement
  if (loading) {
    return (
      <div className="map-loading">
        <div className="spinner"></div>
        <p>Chargement des parcelles...</p>
      </div>
    );
  }

  // Affichage en cas d'erreur
  if (error) {
    return (
      <div className="map-error">
        <p>❌ {error}</p>
        <button onClick={loadParcelles} className="retry-button">
          Réessayer
        </button>
      </div>
    );
  }

  // Position par défaut - Zone agricole de Sidi Slimane, Maroc
  const defaultCenter = [34.2885, -6.0150];
  const defaultZoom = 15;

  return (
    <div className="map-container">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        {/* Dynamic Tile Layer */}
        <DynamicTileLayer layerId={activeLayer} />

        {/* Marqueurs des parcelles */}
        {markers}
        
        {/* Ajuste la vue aux limites */}
        {geojsonData && <FitBounds geojsonData={geojsonData} />}
      </MapContainer>

      {/* Parcel Search */}
      <ParcelSearch 
        parcelles={geojsonData} 
        onSelect={handleParcelSelect}
      />

      {/* Quick Stats Widget */}
      <QuickStatsWidget stats={stats} loading={statsLoading} />

      {/* Layer Switcher */}
      <LayerSwitcher 
        activeLayer={activeLayer} 
        onLayerChange={setActiveLayer}
      />

      {/* Légende modernisée */}
      <div className="map-legend">
        <h4>État Hydrique</h4>
        <div className="legend-item">
          <div className="legend-marker">
            <span className="legend-base"></span>
            <span className="legend-status" style={{ backgroundColor: '#10b981' }}></span>
          </div>
          <span>OK - Bon état</span>
        </div>
        <div className="legend-item">
          <div className="legend-marker">
            <span className="legend-base"></span>
            <span className="legend-status" style={{ backgroundColor: '#f59e0b' }}></span>
          </div>
          <span>Modéré - Surveillance</span>
        </div>
        <div className="legend-item">
          <div className="legend-marker">
            <span className="legend-base"></span>
            <span className="legend-status" style={{ backgroundColor: '#ef4444' }}></span>
          </div>
          <span>Critique - Action urgente</span>
        </div>
      </div>

      {/* Popup des détails de la parcelle */}
      {selectedParcelle && (
        <ParcellePopup 
          parcelle={selectedParcelle} 
          onClose={closePopup}
        />
      )}
    </div>
  );
};

export default MapComponent;
