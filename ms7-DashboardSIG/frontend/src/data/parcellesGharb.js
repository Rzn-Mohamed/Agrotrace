/**
 * Données des Parcelles Agricoles - Région de Sidi Slimane (Maroc)
 * Zone d'agriculture intensive irriguée avec végétation luxuriante
 * Coordonnées centrales: [34.2885, -6.0150]
 * 
 * Format GeoJSON compatible avec Leaflet/MapLibre
 */

export const SIDI_SLIMANE_CENTER = {
  lat: 34.2885,
  lng: -6.0150,
  zoom: 15
};

export const parcellesData = [
  {
    id: 1,
    nom: "Secteur A - Canne à Sucre",
    culture: "Canne à sucre",
    superficie_ha: 45.0,
    surface: "45 ha",
    date_semis: "2024-10-01",
    stress_hydrique: "OK",
    niveau_stress: 0.15,
    besoin_eau_mm: 12.0,
    etat: "OK",
    color: "#27ae60", // Vert
    description: "Végétation luxuriante - irrigation intensive fonctionnelle",
    // Grand rectangle vert intense à gauche
    coords: [
      [34.2890, -6.0180],
      [34.2890, -6.0140],
      [34.2930, -6.0140],
      [34.2930, -6.0180],
      [34.2890, -6.0180]
    ],
    geometry: {
      type: "Polygon",
      coordinates: [[
        [-6.0180, 34.2890],
        [-6.0140, 34.2890],
        [-6.0140, 34.2930],
        [-6.0180, 34.2930],
        [-6.0180, 34.2890]
      ]]
    }
  },
  {
    id: 2,
    nom: "Secteur B - Agrumes",
    culture: "Orangers",
    superficie_ha: 22.0,
    surface: "22 ha",
    date_semis: "2023-02-15",
    stress_hydrique: "MODERE",
    niveau_stress: 0.48,
    besoin_eau_mm: 32.0,
    etat: "MODERE",
    color: "#f39c12", // Orange
    description: "Verger d'agrumes nécessitant irrigation d'appoint",
    // Rectangle au sud
    coords: [
      [34.2840, -6.0180],
      [34.2840, -6.0150],
      [34.2880, -6.0150],
      [34.2880, -6.0180],
      [34.2840, -6.0180]
    ],
    geometry: {
      type: "Polygon",
      coordinates: [[
        [-6.0180, 34.2840],
        [-6.0150, 34.2840],
        [-6.0150, 34.2880],
        [-6.0180, 34.2880],
        [-6.0180, 34.2840]
      ]]
    }
  },
  {
    id: 3,
    nom: "Zone C - Maraîchage",
    culture: "Tomates Industrielles",
    superficie_ha: 15.0,
    surface: "15 ha",
    date_semis: "2025-04-05",
    stress_hydrique: "CRITIQUE",
    niveau_stress: 0.82,
    besoin_eau_mm: 58.0,
    etat: "CRITIQUE",
    color: "#e74c3c", // Rouge
    description: "Culture maraîchère en stress hydrique sévère",
    // Petit champ à l'Est
    coords: [
      [34.2885, -6.0130],
      [34.2885, -6.0110],
      [34.2910, -6.0110],
      [34.2910, -6.0130],
      [34.2885, -6.0130]
    ],
    geometry: {
      type: "Polygon",
      coordinates: [[
        [-6.0130, 34.2885],
        [-6.0110, 34.2885],
        [-6.0110, 34.2910],
        [-6.0130, 34.2910],
        [-6.0130, 34.2885]
      ]]
    }
  }
];

/**
 * Convertit les données en FeatureCollection GeoJSON
 */
export const getGeoJSONFeatureCollection = () => {
  return {
    type: "FeatureCollection",
    features: parcellesData.map(parcelle => ({
      type: "Feature",
      properties: {
        id: parcelle.id,
        nom: parcelle.nom,
        culture: parcelle.culture,
        superficie_ha: parcelle.superficie_ha,
        stress_hydrique: parcelle.stress_hydrique,
        niveau_stress: parcelle.niveau_stress,
        besoin_eau_mm: parcelle.besoin_eau_mm,
        date_semis: parcelle.date_semis,
        color: parcelle.color
      },
      geometry: parcelle.geometry
    }))
  };
};

/**
 * Statistiques globales
 */
export const getStats = () => {
  const total = parcellesData.length;
  const superficie_totale = parcellesData.reduce((sum, p) => sum + p.superficie_ha, 0);
  const critiques = parcellesData.filter(p => p.stress_hydrique === "CRITIQUE").length;
  const moderees = parcellesData.filter(p => p.stress_hydrique === "MODERE").length;
  const ok = parcellesData.filter(p => p.stress_hydrique === "OK").length;
  const stress_moyen = parcellesData.reduce((sum, p) => sum + p.niveau_stress, 0) / total;
  const eau_totale = parcellesData.reduce((sum, p) => sum + p.besoin_eau_mm, 0);

  return {
    total_parcelles: total,
    superficie_totale: superficie_totale.toFixed(2),
    parcelles_critiques: critiques,
    parcelles_moderees: moderees,
    parcelles_ok: ok,
    stress_moyen: stress_moyen.toFixed(2),
    besoin_eau_total_mm: eau_totale.toFixed(2)
  };
};

/**
 * Obtenir une parcelle par ID
 */
export const getParcelleById = (id) => {
  return parcellesData.find(p => p.id === id);
};

/**
 * Filtrer les parcelles par état
 */
export const getParcellesByEtat = (etat) => {
  return parcellesData.filter(p => p.stress_hydrique === etat);
};

export default parcellesData;
