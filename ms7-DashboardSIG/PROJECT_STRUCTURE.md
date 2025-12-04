# Structure du Projet DashboardSIG

```
DashboardSIG/
│
├── 📁 database/                          # Configuration Base de Données
│   └── init.sql                          # Script d'initialisation PostGIS
│                                         # • Tables: parcelles, alertes, recommandations
│                                         # • Données de démonstration (4 parcelles)
│                                         # • Vues et fonctions utilitaires
│
├── 📁 backend/                           # API Node.js/Express
│   ├── 📁 src/
│   │   ├── 📁 config/
│   │   │   └── database.js               # Connexion PostgreSQL/PostGIS
│   │   ├── 📁 controllers/
│   │   │   └── parcelleController.js     # Logique métier (8 endpoints)
│   │   ├── 📁 routes/
│   │   │   └── api.js                    # Définition des routes REST
│   │   └── server.js                     # Point d'entrée Express
│   │
│   ├── package.json                      # Dépendances NPM
│   ├── Dockerfile                        # Image Docker multi-stage
│   ├── .dockerignore
│   └── .env.example                      # Variables d'environnement
│
├── 📁 frontend/                          # Application React/Vite
│   ├── 📁 src/
│   │   ├── 📁 components/
│   │   │   ├── 📁 Map/
│   │   │   │   ├── MapComponent.jsx      # Carte Leaflet interactive
│   │   │   │   ├── MapComponent.css      # Styles de la carte
│   │   │   │   ├── ParcellePopup.jsx     # Popup détails parcelle
│   │   │   │   └── ParcellePopup.css     # Styles de la popup
│   │   │   │
│   │   │   └── 📁 Sidebar/
│   │   │       ├── Sidebar.jsx           # Panneau latéral (dashboard)
│   │   │       └── Sidebar.css           # Styles du panneau
│   │   │
│   │   ├── 📁 services/
│   │   │   └── api.js                    # Client API Axios (7 fonctions)
│   │   │
│   │   ├── 📁 utils/
│   │   │   └── pdfExport.js              # Export PDF avec jsPDF
│   │   │
│   │   ├── App.jsx                       # Composant racine
│   │   ├── App.css                       # Styles globaux app
│   │   ├── main.jsx                      # Point d'entrée React
│   │   └── index.css                     # Reset CSS
│   │
│   ├── index.html                        # Template HTML
│   ├── package.json                      # Dépendances NPM
│   ├── vite.config.js                    # Configuration Vite
│   ├── Dockerfile                        # Image Docker multi-stage
│   ├── nginx.conf                        # Config Nginx pour production
│   ├── .dockerignore
│   └── .env.example                      # Variables d'environnement
│
├── 📄 docker-compose.yml                 # Orchestration des 3 services
│                                         # • postgis (PostgreSQL + PostGIS)
│                                         # • backend (API Express)
│                                         # • frontend (React + Nginx)
│
├── 📄 .gitignore                         # Fichiers exclus du versioning
│
├── 📜 start.sh                           # Script de démarrage automatique
│                                         # • dev, prod, stop, clean, logs
│
├── 📜 api_tests.sh                       # Tests automatisés de l'API
│                                         # • Collection de fonctions curl
│                                         # • Génération collection Postman
│
├── 📖 README.md                          # Documentation principale
│                                         # • Installation
│                                         # • Fonctionnalités
│                                         # • API Endpoints
│                                         # • Troubleshooting
│
├── 📖 DEVELOPMENT.md                     # Guide développement avancé
│                                         # • Architecture détaillée
│                                         # • Flux de données
│                                         # • Tests & Optimisations
│                                         # • Sécurité & CI/CD
│
└── 📖 QUICKSTART.md                      # Guide démarrage rapide
                                          # • Commandes essentielles
                                          # • Tests rapides
                                          # • Troubleshooting


════════════════════════════════════════════════════════════════════════════
STATISTIQUES DU PROJET
════════════════════════════════════════════════════════════════════════════

📊 Fichiers générés: 33
   ├── Backend:     8 fichiers
   ├── Frontend:    16 fichiers
   ├── Database:    1 fichier
   ├── Docker:      3 fichiers
   └── Documentation: 5 fichiers

🔧 Stack Technique:
   ├── Frontend:    React 18, Vite 5, Leaflet, Axios, jsPDF
   ├── Backend:     Node.js 20, Express 4, PostgreSQL 16
   ├── Spatial:     PostGIS 3.4
   └── DevOps:      Docker, Docker Compose, Nginx

📦 Lignes de code: ~3,500+
   ├── JavaScript/JSX:  ~2,000
   ├── SQL:             ~400
   ├── CSS:             ~800
   └── Configuration:   ~300

🎯 Fonctionnalités:
   ✅ Carte interactive avec parcelles (Leaflet)
   ✅ Coloration selon stress hydrique (Rouge/Orange/Vert)
   ✅ Popup détaillée au clic sur parcelle
   ✅ Dashboard avec statistiques temps réel
   ✅ Alertes maladies (mock VisionPlante)
   ✅ Recommandations d'irrigation (mock RecoIrrigation)
   ✅ Export PDF complet
   ✅ API REST complète (8 endpoints)
   ✅ Base de données PostGIS avec données démo
   ✅ Architecture microservices (3 conteneurs)
   ✅ Health checks automatiques
   ✅ Scripts de démarrage et tests
   ✅ Documentation complète

════════════════════════════════════════════════════════════════════════════
ENDPOINTS API DISPONIBLES
════════════════════════════════════════════════════════════════════════════

GET    /api/health                           Health check
GET    /api/parcelles                        Liste parcelles (GeoJSON)
GET    /api/parcelles/:id                    Détails parcelle
GET    /api/etat-hydrique                    État hydrique (Mock IoT)
GET    /api/alertes                          Alertes maladies
GET    /api/recommandations                  Recommandations irrigation
POST   /api/recommandations/:id/appliquer    Appliquer recommandation
GET    /api/stats                            Statistiques globales

════════════════════════════════════════════════════════════════════════════
PORTS UTILISÉS
════════════════════════════════════════════════════════════════════════════

🌐 Frontend:   http://localhost:5173
📡 Backend:    http://localhost:3001
🗄️  PostGIS:    localhost:5432

════════════════════════════════════════════════════════════════════════════
```
