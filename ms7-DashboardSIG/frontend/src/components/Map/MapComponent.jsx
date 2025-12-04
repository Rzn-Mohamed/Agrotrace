/**
 * Composant MapComponent - Carte interactive avec Leaflet
 * DashboardSIG - AgroTrace-MS
 * 
 * Affiche les parcelles agricoles avec:
 * - Coloration selon le stress hydrique
 * - Popup interactive au clic
 * - Intégration des alertes et recommandations
 */

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getParcelles, getParcelleById } from '../../services/api';
import ParcellePopup from './ParcellePopup';
import './MapComponent.css';

// Fix pour les icônes Leaflet avec Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/**
 * Détermine la couleur de la parcelle selon le niveau de stress hydrique
 */
const getColorByStress = (stressHydrique, niveauStress) => {
  switch (stressHydrique) {
    case 'CRITIQUE':
      return '#e74c3c'; // Rouge
    case 'MODERE':
      return '#f39c12'; // Orange
    case 'OK':
      return '#27ae60'; // Vert
    default:
      return '#95a5a6'; // Gris (inconnu)
  }
};

/**
 * Style des parcelles sur la carte
 */
const parcelleStyle = (feature) => {
  const { stress_hydrique, niveau_stress } = feature.properties;
  
  return {
    fillColor: getColorByStress(stress_hydrique, niveau_stress),
    fillOpacity: 0.6,
    color: '#2c3e50',
    weight: 2,
    opacity: 0.8,
  };
};

/**
 * Style au survol de la parcelle
 */
const highlightStyle = {
  fillOpacity: 0.85,
  weight: 3,
  color: '#ffffff',
};

/**
 * Composant pour ajuster la vue de la carte aux limites des parcelles
 */
const FitBounds = ({ geojsonData }) => {
  const map = useMap();

  useEffect(() => {
    if (geojsonData && geojsonData.features && geojsonData.features.length > 0) {
      const geoJsonLayer = L.geoJSON(geojsonData);
      const bounds = geoJsonLayer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [geojsonData, map]);

  return null;
};

/**
 * Composant principal de la carte
 */
const MapComponent = ({ onParcelleSelect }) => {
  const [geojsonData, setGeojsonData] = useState(null);
  const [selectedParcelle, setSelectedParcelle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredFeature, setHoveredFeature] = useState(null);

  // Chargement des parcelles au montage du composant
  useEffect(() => {
    loadParcelles();
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
   * Gestionnaire d'événements pour chaque parcelle
   */
  const onEachFeature = (feature, layer) => {
    const { id, nom, culture, stress_hydrique } = feature.properties;

    // Tooltip au survol
    layer.bindTooltip(
      `<div class="parcelle-tooltip">
        <strong>${nom}</strong><br/>
        ${culture}<br/>
        <span class="stress-${stress_hydrique.toLowerCase()}">${stress_hydrique}</span>
      </div>`,
      {
        permanent: false,
        direction: 'top',
        className: 'custom-tooltip'
      }
    );

    // Événements de survol
    layer.on({
      mouseover: (e) => {
        const layer = e.target;
        layer.setStyle(highlightStyle);
        setHoveredFeature(feature);
      },
      mouseout: (e) => {
        const layer = e.target;
        layer.setStyle(parcelleStyle(feature));
        setHoveredFeature(null);
      },
      click: async (e) => {
        try {
          // Récupère les détails complets de la parcelle
          const parcelleDetails = await getParcelleById(id);
          setSelectedParcelle(parcelleDetails);
          
          // Notifie le composant parent
          if (onParcelleSelect) {
            onParcelleSelect(parcelleDetails);
          }

          // Centre la carte sur la parcelle
          const bounds = e.target.getBounds();
          e.target._map.fitBounds(bounds, { 
            padding: [100, 100],
            maxZoom: 16
          });
        } catch (err) {
          console.error('Erreur lors de la récupération des détails:', err);
          alert('Impossible de charger les détails de cette parcelle');
        }
      }
    });
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

  // Position par défaut - Zone agricole de Sidi Slimane, Maroc (irrigation intensive)
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
        {/* Fond de carte - Imagerie Satellite (Esri World Imagery) */}
        <TileLayer
          attribution='Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maxZoom={19}
        />

        {/* Labels optionnels (noms de lieux sur la vue satellite) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          opacity={0}
        />

        {/* Couche GeoJSON des parcelles */}
        {geojsonData && (
          <>
            <GeoJSON
              data={geojsonData}
              style={parcelleStyle}
              onEachFeature={onEachFeature}
            />
            <FitBounds geojsonData={geojsonData} />
          </>
        )}
      </MapContainer>

      {/* Légende */}
      <div className="map-legend">
        <h4>État Hydrique</h4>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#27ae60' }}></span>
          <span>OK - Bon état</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#f39c12' }}></span>
          <span>Modéré - Surveillance</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#e74c3c' }}></span>
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
