# Guide de Développement - DashboardSIG

## 🏗️ Architecture Technique Détaillée

### Vue d'ensemble des composants

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                      │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ MapComponent│  │   Sidebar    │  │ ParcellePopup│       │
│  │  (Leaflet)  │  │ (Dashboard)  │  │   (Details)  │       │
│  └──────┬──────┘  └──────┬───────┘  └──────────────┘       │
│         │                │                                   │
│         └────────────────┴────────► API Service (Axios)     │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP REST
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND (Node.js/Express)                │
│  ┌────────────────┐  ┌─────────────────────────────────┐   │
│  │   Routes API   │  │   Controllers (Business Logic)  │   │
│  └────────┬───────┘  └─────────────┬───────────────────┘   │
│           │                         │                        │
│           └─────────────────────────┴──► Database Config    │
└──────────────────────────┬──────────────────────────────────┘
                           │ SQL Queries
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              PostgreSQL 16 + PostGIS 3.4                     │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐       │
│  │  parcelles   │  │   alertes   │  │recommandations│       │
│  │ (GEOMETRY)   │  │  _maladies  │  │  _irrigation  │       │
│  └──────────────┘  └─────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## 🎨 Frontend Architecture

### Composants React

#### MapComponent.jsx
**Responsabilités:**
- Rendu de la carte Leaflet
- Affichage des parcelles (GeoJSON)
- Gestion des événements (hover, click)
- Styling dynamique selon stress hydrique

**Props:**
- `onParcelleSelect`: Callback lors de la sélection d'une parcelle

**State:**
- `geojsonData`: Données GeoJSON des parcelles
- `selectedParcelle`: Parcelle actuellement sélectionnée
- `loading`: État de chargement
- `error`: Gestion des erreurs

**Hooks utilisés:**
- `useEffect`: Chargement initial des données
- `useState`: Gestion du state local

#### ParcellePopup.jsx
**Responsabilités:**
- Affichage modal des détails d'une parcelle
- Visualisation des alertes maladies
- Affichage des recommandations d'irrigation

**Props:**
- `parcelle`: Objet parcelle complet
- `onClose`: Callback de fermeture

#### Sidebar.jsx
**Responsabilités:**
- Affichage des statistiques globales
- Liste des alertes actives
- Recommandations en attente
- Bouton d'export PDF

**Props:**
- `selectedParcelle`: Parcelle sélectionnée (optionnel)

### Services

#### api.js
Centralise toutes les requêtes HTTP vers le backend.

**Fonctions principales:**
```javascript
getParcelles()              // GET /api/parcelles
getParcelleById(id)         // GET /api/parcelles/:id
getEtatHydrique()           // GET /api/etat-hydrique
getAlertes()                // GET /api/alertes
getRecommandations()        // GET /api/recommandations
getStats()                  // GET /api/stats
appliquerRecommandation(id) // POST /api/recommandations/:id/appliquer
```

### Utilitaires

#### pdfExport.js
Génère des rapports PDF avec jsPDF.

**Fonction principale:**
```javascript
exportToPDF(stats, alertes, recommandations, selectedParcelle)
```

**Sections du PDF:**
1. Header avec logo et date
2. Statistiques globales
3. Détails parcelle (si sélectionnée)
4. Alertes maladies
5. Recommandations d'irrigation
6. Footer avec pagination

## 🔧 Backend Architecture

### Structure MVC

```
backend/src/
├── config/
│   └── database.js         # Pool PostgreSQL + helpers
├── controllers/
│   └── parcelleController.js   # Logique métier
├── routes/
│   └── api.js              # Définition des routes
└── server.js               # Point d'entrée Express
```

### Controllers

#### parcelleController.js

**Fonctions exportées:**

1. **getParcelles()**
   - Retourne GeoJSON de toutes les parcelles
   - JOIN avec alertes et recommandations
   - Format: FeatureCollection

2. **getParcelleById(id)**
   - Détails complets d'une parcelle
   - Inclut alertes et recommandations

3. **getEtatHydrique()**
   - Mock des données IoT/Drones
   - Simule: humidité sol, NDVI, NDWI, température

4. **getAlertes()**
   - Liste des alertes maladies actives
   - Tri par date décroissante

5. **getRecommandations()**
   - Recommandations non appliquées
   - Tri par priorité

6. **getStats()**
   - Statistiques agrégées
   - Compte par état hydrique

7. **appliquerRecommandation(id)**
   - Marque une recommandation comme appliquée
   - UPDATE SQL

## 🗄️ Schéma Base de Données

### Table: parcelles

```sql
CREATE TABLE parcelles (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    culture VARCHAR(100) NOT NULL,
    superficie_ha DECIMAL(10, 2),
    date_semis DATE,
    geometry GEOMETRY(Polygon, 4326) NOT NULL, -- IMPORTANT: PostGIS
    stress_hydrique VARCHAR(20) DEFAULT 'OK',
    niveau_stress DECIMAL(3, 2) DEFAULT 0.0,
    besoin_eau_mm DECIMAL(5, 2) DEFAULT 0.0,
    derniere_irrigation DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index spatial OBLIGATOIRE pour performances
CREATE INDEX idx_parcelles_geometry ON parcelles USING GIST (geometry);
```

**SRID 4326 = WGS84**: Système de coordonnées GPS standard (latitude/longitude)

### Table: alertes_maladies

```sql
CREATE TABLE alertes_maladies (
    id SERIAL PRIMARY KEY,
    parcelle_id INTEGER REFERENCES parcelles(id) ON DELETE CASCADE,
    type_maladie VARCHAR(100) NOT NULL,
    severite VARCHAR(20) NOT NULL, -- FAIBLE, MOYENNE, ELEVEE
    confiance DECIMAL(3, 2),       -- Score IA (0.0 à 1.0)
    date_detection TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    zone_affectee GEOMETRY(Polygon, 4326),
    description TEXT
);
```

### Table: recommandations_irrigation

```sql
CREATE TABLE recommandations_irrigation (
    id SERIAL PRIMARY KEY,
    parcelle_id INTEGER REFERENCES parcelles(id) ON DELETE CASCADE,
    volume_mm DECIMAL(5, 2) NOT NULL,
    duree_minutes INTEGER,
    heure_optimale TIME,
    priorite VARCHAR(20),   -- BASSE, NORMALE, HAUTE, URGENTE
    date_recommandation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    appliquee BOOLEAN DEFAULT FALSE
);
```

## 🔄 Flux de Données

### 1. Chargement Initial (Frontend)

```
User loads app
    └─► MapComponent.useEffect()
        └─► api.getParcelles()
            └─► Backend: GET /api/parcelles
                └─► SQL: SELECT avec ST_AsGeoJSON()
                    └─► Retour GeoJSON
                        └─► Render Leaflet layers
```

### 2. Click sur Parcelle

```
User clicks parcelle
    └─► onEachFeature.click()
        └─► api.getParcelleById(id)
            └─► Backend: GET /api/parcelles/:id
                └─► SQL: JOIN avec alertes + recommandations
                    └─► Retour objet complet
                        └─► setSelectedParcelle()
                            └─► <ParcellePopup> s'affiche
```

### 3. Export PDF

```
User clicks Export PDF
    └─► Sidebar.handleExport()
        └─► exportToPDF(stats, alertes, recommandations)
            └─► jsPDF génère document
                └─► autoTable pour tableaux
                    └─► doc.save() télécharge PDF
```

## 🧪 Tests Recommandés

### Tests Backend

```javascript
// tests/api.test.js
describe('GET /api/parcelles', () => {
  it('devrait retourner un GeoJSON valide', async () => {
    const res = await request(app).get('/api/parcelles');
    expect(res.status).toBe(200);
    expect(res.body.type).toBe('FeatureCollection');
    expect(res.body.features).toBeInstanceOf(Array);
  });
});

describe('GET /api/parcelles/:id', () => {
  it('devrait retourner une parcelle complète', async () => {
    const res = await request(app).get('/api/parcelles/1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('alertes');
    expect(res.body).toHaveProperty('recommandations');
  });
});
```

### Tests Frontend

```javascript
// tests/MapComponent.test.jsx
import { render, screen } from '@testing-library/react';
import MapComponent from './MapComponent';

test('affiche le loader pendant le chargement', () => {
  render(<MapComponent />);
  expect(screen.getByText(/chargement/i)).toBeInTheDocument();
});

test('affiche une erreur si l\'API échoue', async () => {
  // Mock API failure
  jest.spyOn(api, 'getParcelles').mockRejectedValue(new Error('Network error'));
  
  render(<MapComponent />);
  
  await waitFor(() => {
    expect(screen.getByText(/impossible de charger/i)).toBeInTheDocument();
  });
});
```

## 🚀 Performances

### Optimisations PostGIS

1. **Index GIST obligatoire**
```sql
CREATE INDEX idx_parcelles_geometry ON parcelles USING GIST (geometry);
```

2. **Simplification de géométries pour le rendu**
```sql
SELECT ST_Simplify(geometry, 0.001) -- Réduire le nombre de points
```

3. **Bounding Box pour filtrer**
```sql
WHERE geometry && ST_MakeEnvelope(lon_min, lat_min, lon_max, lat_max, 4326)
```

### Optimisations Frontend

1. **Lazy loading des composants**
```javascript
const ParcellePopup = lazy(() => import('./ParcellePopup'));
```

2. **Debounce sur les événements hover**
```javascript
const debouncedHover = debounce(handleHover, 200);
```

3. **Mémorisation avec useMemo**
```javascript
const geojsonLayer = useMemo(() => (
  <GeoJSON data={geojsonData} style={parcelleStyle} />
), [geojsonData]);
```

## 🔐 Sécurité Production

### Backend

1. **Rate limiting**
```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // max 100 requêtes par IP
});

app.use('/api/', limiter);
```

2. **Validation des entrées**
```javascript
import { body, validationResult } from 'express-validator';

app.post('/api/parcelles', [
  body('nom').trim().isLength({ min: 3, max: 100 }),
  body('culture').trim().notEmpty(),
  // ...
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // ...
});
```

3. **Connexion DB sécurisée**
```javascript
// Utiliser SSL en production
const pool = new Pool({
  // ...
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});
```

### Frontend

1. **Sanitization des inputs**
```javascript
import DOMPurify from 'dompurify';

const cleanHTML = DOMPurify.sanitize(userInput);
```

2. **Content Security Policy**
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';">
```

## 📊 Monitoring & Logs

### Logs structurés (Winston)

```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Usage
logger.info('Parcelle créée', { parcelleId: 123 });
logger.error('Erreur DB', { error: err.message });
```

### Métriques (Prometheus)

```javascript
import promClient from 'prom-client';

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

// Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration.observe(
      { method: req.method, route: req.route?.path, status_code: res.statusCode },
      duration
    );
  });
  next();
});
```

## 🔄 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: cd backend && npm ci
      - run: cd backend && npm test

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: cd frontend && npm ci
      - run: cd frontend && npm run build

  docker-build:
    needs: [test-backend, test-frontend]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build images
        run: docker-compose build
```

## 📚 Ressources Additionnelles

- [PostGIS Documentation](https://postgis.net/documentation/)
- [Leaflet API Reference](https://leafletjs.com/reference.html)
- [React Best Practices](https://react.dev/learn)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

**Maintenu par l'équipe AgroTrace-MS**
