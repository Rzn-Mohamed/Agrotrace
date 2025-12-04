# 🌍 Configuration Vue Satellite - Région du Gharb

## Modifications Apportées

### 1. Changement de Fond de Carte 🗺️

**Avant :** OpenStreetMap (Plan urbain)
**Après :** Esri World Imagery (Vue satellite)

Le composant `MapComponent.jsx` utilise désormais une imagerie satellite haute résolution qui permet de visualiser :
- ✅ La verdure des cultures
- ✅ Les sillons des champs
- ✅ Les infrastructures agricoles
- ✅ Les variations de végétation

**Fournisseur de tuiles :**
```
https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}
```

### 2. Recentrage Géographique 📍

**Nouvelle position centrale :**
- **Latitude :** 34.251
- **Longitude :** -6.561
- **Région :** Plaine du Gharb, Maroc
- **Zoom initial :** 16 (très zoomé pour voir les détails des parcelles)

**Caractéristiques de la zone :**
- Zone agricole productive majeure du Maroc
- Sol argileux profond (Tirs)
- Système d'irrigation moderne (pivots centraux, aspersion)
- Cultures céréalières et industrielles

### 3. Nouvelles Données de Parcelles 🌾

#### Parcelle 1 - Blé Dur Nord
```json
{
  "nom": "Parcelle Gharb Nord - BLE01",
  "culture": "Blé Dur",
  "superficie_ha": 24.5,
  "stress_hydrique": "OK",
  "coordonnées": "[-6.56250, 34.25200] → [-6.56050, 34.25050]"
}
```

#### Parcelle 2 - Maïs Grain Centre
```json
{
  "nom": "Parcelle Gharb Centre - MAIS02",
  "culture": "Maïs Grain",
  "superficie_ha": 18.3,
  "stress_hydrique": "MODERE",
  "coordonnées": "[-6.56250, 34.25050] → [-6.56050, 34.24900]"
}
```

#### Parcelle 3 - Tournesol Sud
```json
{
  "nom": "Parcelle Gharb Sud - TOUR03",
  "culture": "Tournesol",
  "superficie_ha": 21.7,
  "stress_hydrique": "CRITIQUE",
  "coordonnées": "[-6.56250, 34.24900] → [-6.56050, 34.24750]"
}
```

#### Parcelle 4 - Betterave Sucrière Est
```json
{
  "nom": "Parcelle Gharb Est - BETT04",
  "culture": "Betterave Sucrière",
  "superficie_ha": 16.2,
  "stress_hydrique": "MODERE",
  "coordonnées": "[-6.56050, 34.25200] → [-6.55850, 34.25050]"
}
```

**Total superficie :** 80.7 hectares

## Structure des Polygones

Les parcelles sont organisées en 4 rectangles adjacents simulant une exploitation agricole réaliste :

```
┌─────────────────┬─────────────────┐
│   BLE01 (OK)    │  BETT04 (MOD)  │
│   Blé Dur       │  Betterave     │
│   24.5 ha       │  16.2 ha       │
├─────────────────┴─────────────────┤
│   MAIS02 (MODERE)                 │
│   Maïs Grain - 18.3 ha            │
├───────────────────────────────────┤
│   TOUR03 (CRITIQUE)               │
│   Tournesol - 21.7 ha             │
└───────────────────────────────────┘
```

## Fichiers Modifiés

### Frontend
- ✅ `frontend/src/components/Map/MapComponent.jsx`
  - Changement du TileLayer (OSM → Esri)
  - Modification du `defaultCenter` : `[34.251, -6.561]`
  - Modification du `defaultZoom` : 16
  - Ajout attribution Esri

### Base de Données
- ✅ `database/init.sql`
  - Remplacement des 4 parcelles de démonstration
  - Nouvelles coordonnées GeoJSON pour région Gharb
  - Cultures adaptées (Blé Dur, Maïs Grain, Tournesol, Betterave)
  - Noms de parcelles cohérents avec la zone

### Fichiers Additionnels
- ✅ `database/parcelles_gharb.geojson`
  - Export GeoJSON complet des parcelles
  - Métadonnées de la région
  - Compatible avec QGIS, ArcGIS, Leaflet

## Comment Tester

1. **Démarrer les services :**
   ```bash
   ./start.sh prod
   ```

2. **Ouvrir le navigateur :**
   ```
   http://localhost:5173
   ```

3. **Ce que vous devriez voir :**
   - 🛰️ Vue satellite de champs agricoles
   - 🟢 Parcelle verte (BLE01) : Blé en bon état
   - 🟡 Parcelles orange (MAIS02, BETT04) : Stress modéré
   - 🔴 Parcelle rouge (TOUR03) : Tournesol en stress critique
   - 🔍 Zoom serré permettant de distinguer les détails

4. **Tester les interactions :**
   - Cliquer sur une parcelle pour voir les détails
   - Vérifier les noms conformes à la région Gharb
   - Confirmer que les polygones correspondent aux champs visibles

## API Endpoints (Inchangés)

Les endpoints fonctionnent toujours de la même manière :

```bash
# Liste des parcelles (GeoJSON)
curl http://localhost:3001/api/parcelles

# Détails d'une parcelle
curl http://localhost:3001/api/parcelles/1

# Statistiques globales
curl http://localhost:3001/api/stats
```

## Coordonnées de Référence

**Zone agricole Gharb :**
- **Nord-Ouest :** -6.56250, 34.25200
- **Sud-Est :** -6.55850, 34.24750
- **Bounding Box :** ~2.2 km × 1.8 km

**Système de coordonnées :**
- SRID : 4326 (WGS84)
- Format : Longitude, Latitude (GeoJSON standard)

## Notes Importantes

⚠️ **Données Simulées :** Les coordonnées et polygones sont estimés pour la démonstration. Pour une utilisation en production, utilisez des données cadastrales réelles.

✅ **Vue Satellite Gratuite :** Esri World Imagery est gratuit pour un usage basique. Pour une utilisation intensive en production, consultez les conditions d'utilisation.

🔄 **Changement de Région :** Pour adapter à une autre zone, modifiez :
1. Le `defaultCenter` dans `MapComponent.jsx`
2. Les coordonnées GeoJSON dans `database/init.sql`
3. Les noms de parcelles selon votre zone

## Améliorations Futures

- [ ] Ajouter une couche de labels (noms de lieux) sur la vue satellite
- [ ] Implémenter un basemap switcher (satellite ↔ plan)
- [ ] Intégrer des données cadastrales officielles
- [ ] Ajouter une couche de limites administratives
- [ ] Connecter avec l'API NDVI pour le stress végétatif réel

---

**Date de mise à jour :** 2 décembre 2025  
**Version :** 1.1.0 - Satellite View Gharb  
**Auteur :** AgroTrace Team
