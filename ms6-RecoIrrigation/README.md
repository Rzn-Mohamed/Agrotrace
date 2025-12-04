# RecoIrrigation

Microservice de calcul intelligent de plans d'irrigation pour l'agriculture de précision.

## 🚀 Fonctionnalités

### Calcul Scientifique Standard
- Calcul déterministe basé sur l'évapotranspiration (ET0)
- Coefficient cultural (Kc) selon le type de culture
- Prise en compte du stress hydrique et des règles agronomiques
- Planification automatique des horaires d'irrigation

### 🧠 Intelligence Hybride (Nouveau!)
- **Analyse contextuelle** générée par IA (Gemini/GPT)
- **Justification agronomique** détaillée
- **Conseils pratiques** personnalisés
- **Score de confiance** de l'analyse IA
- Fallback automatique en cas d'indisponibilité de l'IA

## 📋 Prérequis

- Python 3.9+
- PostgreSQL (ou SQLite pour le développement)
- Clé API Gemini ou OpenAI (pour l'Intelligence Hybride)

## 🔧 Installation

1. Cloner le dépôt
```bash
git clone https://github.com/Ghita-Takouit/RecoIrrigation.git
cd RecoIrrigation
```

2. Créer un environnement virtuel
```bash
python -m venv venv
source venv/bin/activate  # Sur macOS/Linux
# ou
venv\Scripts\activate  # Sur Windows
```

3. Installer les dépendances
```bash
pip install -r requirements.txt
```

4. Configuration
```bash
cp .env.example .env
# Éditer .env avec vos paramètres
```

Variables d'environnement essentielles :
- `LLM_API_KEY` : Clé API pour Gemini ou OpenAI
- `LLM_MODEL` : Modèle à utiliser (défaut: `gemini-1.5-flash`)
- `POSTGRES_*` : Paramètres de connexion PostgreSQL

5. Lancer le serveur
```bash
uvicorn app.main:app --reload
```

Le serveur démarrera sur `http://localhost:8000`

## 📡 Endpoints

### 1. Calcul Standard
**POST** `/irrigation/calculer`

Calcul scientifique traditionnel sans IA.

### 2. Intelligence Hybride ⭐
**POST** `/irrigation/recommandation-ia`

Combinaison du calcul scientifique avec analyse IA.

#### Exemple de requête :
```json
{
  "zone_id": 1,
  "culture_type": "Tomate",
  "prediction": {
    "stress_index": 0.75,
    "temp_max_demain": 32.5,
    "probabilite_pluie": 15.0,
    "evapotranspiration_et0": 6.8
  },
  "regles": {
    "priorite": "ELEVEE",
    "stade_culture": "Floraison",
    "contrainte_hydrique": "Interdiction d'arroser entre 12h et 16h"
  }
}
```

#### Exemple de réponse :
```json
{
  "recommendation_id": "uuid",
  "zone_id": 1,
  "volume_eau_m3": 45.2,
  "duree_minutes": 120,
  "horaire_debut": "2025-11-28T22:00:00",
  "status": "PLANIFIE_IA",
  "analyse_contextuelle": "Analyse du contexte climatique...",
  "justification_agronomique": "Justification scientifique...",
  "conseils_additionnels": [
    "Vérifier les buses",
    "Apport d'engrais recommandé"
  ],
  "score_confiance": 87,
  "genere_par": "gemini-1.5-flash"
}
```

### 3. Historique
**GET** `/irrigation/historique?zone_id=1&limit=50`

Récupère l'historique des recommandations.

## 📚 Documentation

- **API Documentation** : `http://localhost:8000/docs` (Swagger UI)
- **Intelligence Hybride** : Voir [docs/INTELLIGENCE_HYBRIDE.md](docs/INTELLIGENCE_HYBRIDE.md)

## 🧪 Tests

Lancer les tests de l'endpoint IA :

```bash
python tests/test_ai_endpoint.py
```

## 🏗️ Architecture

```
app/
├── core/
│   ├── config.py          # Configuration (LLM_API_KEY)
│   └── logic.py           # Moteur de calcul scientifique
├── services/
│   └── ai_service.py      # Service IA (async)
├── routers/
│   └── irrigation.py      # Routes API
├── schemas/
│   └── plan.py            # Modèles Pydantic
└── db/
    ├── database.py        # Connexion DB
    └── models.py          # Modèles SQLAlchemy
```

## 🔐 Sécurité

- Ne jamais commiter le fichier `.env`
- Stocker les clés API dans des variables d'environnement
- Utiliser des secrets manager en production

## 🌐 Stack Technique

- **Framework** : FastAPI
- **Validation** : Pydantic
- **ORM** : SQLAlchemy
- **Database** : PostgreSQL / SQLite
- **IA** : Google Gemini / OpenAI GPT
- **HTTP Client** : httpx (async)

## 📊 Coûts IA

Avec Gemini 1.5 Flash :
- ~$0.0001 par requête
- 1000 requêtes : ~$0.10

## 🤝 Contribution

Les contributions sont les bienvenues ! Voir [CONTRIBUTING.md](CONTRIBUTING.md)

## 📝 Licence

MIT License

## 👥 Auteur

Ghita Takouit - [GitHub](https://github.com/Ghita-Takouit)
