# 🌾 DashboardSIG - AgroTrace-MS Microservice 7

**Système d'Information Géographique pour l'Agriculture de Précision**

## 📋 Description

DashboardSIG est le microservice 7 de l'architecture AgroTrace-MS. Il fournit une interface web interactive permettant de visualiser les données consolidées des autres microservices (IoT, Drones, IA) sur une carte géospatiale pour aider les agriculteurs à prendre des décisions éclairées.

## 🏗️ Architecture

```
DashboardSIG/
├── backend/          # API Node.js/Express + PostGIS
├── frontend/         # Application React/Vite + Leaflet
├── database/         # Scripts SQL d'initialisation
└── docker-compose.yml
```

### Stack Technique

**Frontend:**
- React 18 avec Vite
- Leaflet / react-leaflet (cartographie)
- Axios (API client)
- jsPDF (export PDF)
- Lucide React (icônes)

**Backend:**
- Node.js 20 + Express
- PostgreSQL 16 + PostGIS 3.4
- Architecture MVC

**Infrastructure:**
- Docker & Docker Compose
- Nginx (reverse proxy frontend)

## 🚀 Démarrage Rapide

### Prérequis

- Docker 24+
- Docker Compose 2.20+
- (Optionnel) Node.js 20+ pour développement local

### Installation et Démarrage

1. **Cloner le projet**
```bash
cd /Users/Aeztic/Documents/MicroServices/DashboardSIG
```

2. **Créer les fichiers d'environnement**
```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

3. **Démarrer avec Docker Compose**
```bash
docker-compose up -d
```

4. **Vérifier le statut des services**
```bash
docker-compose ps
```

5. **Accéder à l'application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api
- PostGIS: localhost:5432

### Arrêt et Nettoyage

```bash
# Arrêter les services
docker-compose down

# Arrêter et supprimer les volumes (⚠️ supprime les données)
docker-compose down -v
```

## 📊 Fonctionnalités

### Visualisation Cartographique
- ✅ Affichage des parcelles agricoles (polygones)
- ✅ Coloration selon le stress hydrique (Rouge/Orange/Vert)
- ✅ Tooltips informatifs au survol
- ✅ Popup détaillée au clic sur une parcelle

### Indicateurs Visuels
- ✅ Alertes maladies (issues du service VisionPlante - mockées)
- ✅ Stress hydrique en temps réel
- ✅ Recommandations d'irrigation (service RecoIrrigation - mockées)

### Tableau de Bord
- ✅ Statistiques globales (nombre de parcelles, superficie, etc.)
- ✅ Répartition des parcelles par état
- ✅ Liste des alertes actives
- ✅ Recommandations en attente

### Export
- ✅ Export PDF complet avec statistiques, alertes et recommandations
- ✅ Rapport détaillé par parcelle

## 🗄️ Base de Données

### Modèle PostGIS

**Table principale: `parcelles`**
- Géométrie: POLYGON (SRID 4326 - WGS84)
- Métadonnées: culture, superficie, dates
- État hydrique: stress_hydrique, niveau_stress, besoin_eau_mm

**Tables associées:**
- `alertes_maladies`: Détection IA de maladies
- `recommandations_irrigation`: Actions suggérées

**Données de démonstration:**
4 parcelles pré-chargées avec différents états hydriques

## 🔌 API Endpoints

### Parcelles
- `GET /api/parcelles` - Liste des parcelles (GeoJSON)
- `GET /api/parcelles/:id` - Détails d'une parcelle

### Monitoring
- `GET /api/etat-hydrique` - État hydrique de toutes les parcelles (mock IoT/Drone)
- `GET /api/alertes` - Alertes maladies actives
- `GET /api/recommandations` - Recommandations d'irrigation

### Statistiques
- `GET /api/stats` - Statistiques globales
- `GET /api/health` - Health check

### Actions
- `POST /api/recommandations/:id/appliquer` - Marquer une recommandation comme appliquée

## 💻 Développement Local

### Backend

```bash
cd backend
npm install
cp .env.example .env

# Démarrer PostGIS séparément
docker run -d -p 5432:5432 \
  -e POSTGRES_DB=agrotrace_sig \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  postgis/postgis:16-3.4-alpine

# Initialiser la DB
psql -h localhost -U postgres -d agrotrace_sig -f ../database/init.sql

# Démarrer le serveur
npm run dev
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env

# Démarrer le serveur de dev
npm run dev
```

## 🧪 Tests

### Test Backend
```bash
curl http://localhost:3001/api/health
curl http://localhost:3001/api/parcelles
```

### Test Frontend
Ouvrir http://localhost:5173 dans le navigateur

## 📁 Structure Détaillée

```
DashboardSIG/
├── backend/
│   ├── src/
│   │   ├── config/database.js       # Connexion PostGIS
│   │   ├── controllers/             # Logique métier
│   │   ├── routes/api.js            # Routes Express
│   │   └── server.js                # Point d'entrée
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Map/                 # Composants carte
│   │   │   │   ├── MapComponent.jsx
│   │   │   │   └── ParcellePopup.jsx
│   │   │   └── Sidebar/             # Panneau latéral
│   │   │       └── Sidebar.jsx
│   │   ├── services/api.js          # Client API
│   │   ├── utils/pdfExport.js       # Export PDF
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── Dockerfile
│   ├── nginx.conf
│   └── .env.example
├── database/
│   └── init.sql                     # Schéma + données démo
├── docker-compose.yml
└── README.md
```

## 🔐 Sécurité

- ✅ Headers HTTP sécurisés (Helmet.js)
- ✅ CORS configuré
- ✅ Utilisateurs non-root dans les conteneurs
- ✅ Health checks pour tous les services
- ✅ Validation des entrées (à améliorer en production)

## 🚧 Roadmap / Améliorations

### À Court Terme
- [ ] Authentification JWT
- [ ] Tests unitaires et d'intégration
- [ ] CI/CD avec GitHub Actions
- [ ] Monitoring avec Prometheus/Grafana

### À Moyen Terme
- [ ] Connexion réelle aux services IoT/Drones/IA
- [ ] WebSocket pour mises à jour en temps réel
- [ ] Mode hors-ligne (PWA)
- [ ] Export CSV et Excel

### À Long Terme
- [ ] Machine Learning pour prédictions
- [ ] Support multi-tenant
- [ ] Application mobile (React Native)

## 🤝 Intégration avec AgroTrace-MS

Ce microservice est conçu pour s'intégrer avec:

1. **Service IoT**: Données capteurs (humidité sol, température)
2. **Service Drone**: Imagerie NDVI/NDWI
3. **VisionPlante (IA)**: Détection de maladies
4. **RecoIrrigation (IA)**: Recommandations d'irrigation

*Note: Actuellement, ces services sont mockés dans `/api/etat-hydrique`*

## 📝 Logs

```bash
# Logs en temps réel
docker-compose logs -f

# Logs d'un service spécifique
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgis
```

## 🐛 Troubleshooting

### Problème: Les parcelles ne s'affichent pas
```bash
# Vérifier que PostGIS est bien initialisé
docker-compose exec postgis psql -U postgres -d agrotrace_sig -c "SELECT COUNT(*) FROM parcelles;"
```

### Problème: Erreur de connexion Backend <-> PostGIS
```bash
# Vérifier le réseau Docker
docker network inspect agrotrace-network

# Recréer les services
docker-compose down && docker-compose up -d
```

### Problème: Frontend ne peut pas joindre le Backend
- Vérifier que `VITE_API_URL` dans `.env` pointe vers `http://localhost:3001/api`
- Vérifier les logs backend: `docker-compose logs backend`

## 📄 Licence

MIT License - AgroTrace Team

## 👥 Auteurs

- **Architecture & Développement**: Équipe AgroTrace-MS
- **Microservice 7 - DashboardSIG**: Expert Développeur Fullstack SIG

## 📞 Support

Pour toute question ou problème:
- Issues GitHub: [github.com/AgroTrace/DashboardSIG](https://github.com/AgroTrace/DashboardSIG)
- Email: support@agrotrace.com

---

**⚡ Built with ❤️ for Precision Agriculture**
