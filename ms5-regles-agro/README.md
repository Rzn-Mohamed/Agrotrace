# 🌾 RèglesAgro - Microservice de Règles Agronomiques

[![Status](https://img.shields.io/badge/status-operational-brightgreen)]()
[![Python](https://img.shields.io/badge/python-3.9-blue)]()
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green)]()

## 📋 Description

Le microservice **RèglesAgro** est un système expert qui traduit les données techniques (prévisions, conditions météo, état du sol) en **recommandations agronomiques concrètes et actionnables** pour les agriculteurs.

### 🎯 Objectif
Transformer les données brutes et prédictions en conseils pratiques basés sur l'expertise agronomique.

### 🧠 Comment ça marche ?

Le système fonctionne comme un **expert agronome automatisé** :

1. **Réception des données** : Le service reçoit les conditions actuelles et prévisions (de PrévisionEau)
2. **Évaluation des règles** : Chaque règle agronomique est vérifiée contre les données
3. **Déclenchement conditionnel** : Si les conditions d'une règle sont remplies, elle génère une recommandation
4. **Priorisation** : Les recommandations sont classées par urgence (CRITICAL > HIGH > MEDIUM > LOW)
5. **Personnalisation** : Les conseils sont adaptés au type de sol, stade de croissance et culture
6. **Réponse** : Liste des actions à entreprendre avec leur priorité et paramètres

### 🔄 Flux de données
```
┌──────────────┐     ┌────────────┐     ┌──────────────┐
│ PrévisionEau │────▶│ RèglesAgro │────▶│ Agriculteur  │
│ (prévisions) │     │  (expert)  │     │  (actions)   │
└──────────────┘     └────────────┘     └──────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ PostgreSQL  │
                    │ (historique)│
                    └─────────────┘
```

### 🎨 Architecture du moteur de règles

```
┌─────────────────────────────────────────────────────┐
│           MOTEUR DE RÈGLES (Rule Engine)            │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ Règle 1  │  │ Règle 2  │  │ Règle N  │         │
│  │IRRIGATION│  │ HUMIDITÉ │  │   ...    │         │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘         │
│       │             │             │                │
│       └─────────────┴─────────────┘                │
│                     │                              │
│              ┌──────▼───────┐                      │
│              │  ÉVALUATION  │                      │
│              │  CONDITIONS  │                      │
│              └──────┬───────┘                      │
│                     │                              │
│              ┌──────▼───────┐                      │
│              │ GÉNÉRATION   │                      │
│              │RECOMMANDATION│                      │
│              └──────┬───────┘                      │
│                     │                              │
│              ┌──────▼───────┐                      │
│              │ PRIORISATION │                      │
│              └──────────────┘                      │
└─────────────────────────────────────────────────────┘
```

## Fonctionnalités

- ✅ **Moteur de règles extensible** : Système modulaire permettant d'ajouter facilement de nouvelles règles
- ✅ **7 règles agronomiques** : Irrigation, humidité, stress hydrique, température, pH, croissance, type de sol
- ✅ **Priorisation automatique** : Tri des recommandations par priorité (critical > high > medium > low)
- ✅ **Référentiels PostgreSQL** : Stockage des informations parcelles et historique des recommandations
- ✅ **API REST complète** : Endpoints pour évaluation, historique et informations parcelles

## Architecture

```
regles-agro/
├── app/
│   ├── config.py              # Configuration centralisée
│   ├── schemas/
│   │   └── rules.py            # Schémas Pydantic (Request/Response)
│   ├── rules/
│   │   └── engine.py          # Moteur de règles + règles individuelles
│   ├── repositories/
│   │   └── postgres.py        # Accès PostgreSQL
│   └── services/
│       └── rule_service.py    # Service d'orchestration
├── tests/
│   ├── test_rule_engine.py    # Tests du moteur
│   └── test_rule_service.py   # Tests du service
├── main.py                     # API FastAPI
├── Dockerfile
└── requirements.txt
```

## 📚 Règles Agronomiques Implémentées

Le système intègre **8 règles** basées sur l'expertise agronomique réelle :

### 🚨 1. IRRIGATION_URGENTE (Priorité : CRITICAL)
**Condition** : Humidité sol < 20% **ET** Température > 30°C  
**Déclenchement** : Situation d'urgence, risque de perte de cultures  
**Action** : Irrigation immédiate requise  
**Exemple** :
```
⚠️ ALERTE CRITIQUE
Humidité du sol très faible (18%) avec température élevée (33°C).
Action : Irriguer immédiatement 15-20mm
Risque : Stress hydrique sévère, dommages aux cultures
```

---

### 🟠 2. HUMIDITE_FAIBLE (Priorité : HIGH)
**Condition** : 20% ≤ Humidité sol < 35%  
**Déclenchement** : Niveau d'humidité préoccupant  
**Action** : Surveiller et planifier irrigation sous 24-48h  
**Exemple** :
```
⚠️ ATTENTION
Humidité du sol faible (28%).
Action : Planifier irrigation dans les 24-48h (8-12mm)
Conseil : Surveiller l'évolution quotidiennement
```

---

### 💧 3. STRESS_HYDRIQUE (Priorité : HIGH)
**Condition** : Stress hydrique prédit > 50%  
**Déclenchement** : Prévision de stress dans les prochains jours  
**Action** : Anticiper et préparer irrigation  
**Exemple** :
```
🔮 PRÉVISION
Stress hydrique élevé prévu (65%) dans les 3 prochains jours.
Action : Planifier irrigation préventive (10-15mm)
Bénéfice : Éviter le stress avant qu'il n'apparaisse
```

---

### 🌡️ 4. TEMPERATURE_CRITIQUE (Priorité : CRITICAL)
**Condition** : Température > 35°C  
**Déclenchement** : Chaleur extrême  
**Action** : Augmenter fréquence d'irrigation, protéger cultures  
**Exemple** :
```
🔥 ALERTE CANICULE
Température critique détectée (37°C).
Action : Augmenter fréquence irrigation, envisager brumisation
Risque : Évapotranspiration excessive
```

---

### 🧪 5. PH_INADEQUAT (Priorité : MEDIUM)
**Condition** : pH < 6.0 **OU** pH > 7.5  
**Déclenchement** : pH hors de la plage optimale  
**Action** : Correction du pH du sol  
**Exemple** :
```
⚗️ CORRECTION SOL
pH du sol inadéquat (5.2, trop acide).
Action : Apporter chaux agricole pour remonter le pH
Objectif : Ramener le pH entre 6.0 et 7.0
```

---

### 🌸 6. CROISSANCE_FLORAISON (Priorité : HIGH)
**Condition** : Stade = "floraison" **ET** Humidité sol < 40%  
**Déclenchement** : Période critique + humidité insuffisante  
**Action** : Irrigation optimale pour soutenir la floraison  
**Exemple** :
```
🌸 STADE CRITIQUE
Culture en floraison avec humidité insuffisante (35%).
Action : Irrigation optimale (12-15mm) pour soutenir formation fruits
Importance : Phase déterminante pour le rendement
```

---

### 🏜️ 7. SOL_SABLEUX (Priorité : MEDIUM)
**Condition** : Type sol = "sableux" **ET** Humidité < 30%  
**Déclenchement** : Sol drainant + faible rétention d'eau  
**Action** : Irrigation fréquente en petites quantités  
**Exemple** :
```
🏖️ SOL DRAINANT
Sol sableux retient peu l'eau (humidité 25%).
Action : Irrigations fréquentes (5-8mm) plutôt qu'une grosse irrigation
Conseil : 2-3 fois par semaine en petites doses
```

---

### 🧱 8. SOL_ARGILEUX (Priorité : LOW)
**Condition** : Type sol = "argileux" **ET** Humidité > 70%  
**Déclenchement** : Sol lourd + excès d'eau  
**Action** : Réduire ou arrêter irrigation temporairement  
**Exemple** :
```
💧 EXCÈS D'EAU
Sol argileux saturé (humidité 75%).
Action : Suspendre irrigation, améliorer drainage si nécessaire
Risque : Asphyxie racinaire si excès prolongé
```

---

## 🧪 Tests et Cas d'Usage

### 📝 Cas de Test 1 : Conditions Optimales
**Objectif** : Vérifier qu'aucune alerte n'est déclenchée en conditions normales

**Données d'entrée** :
```json
{
  "parcelle_id": "PARCELLE_001",
  "temperature": 22.5,
  "humidite": 65.0,
  "humidite_sol": 55.0,
  "hydric_stress": 20.0,
  "irrigation_need_mm": 3.0,
  "ph_sol": 6.5,
  "soil_type": "limoneux",
  "growth_stage": "croissance"
}
```

**Résultat attendu** :
```json
{
  "recommendations": [],
  "triggered_rules_count": 0,
  "evaluation_timestamp": "2025-12-02T10:30:00"
}
```
✅ **Interprétation** : Tout est optimal, aucune action requise

---

### 🔴 Cas de Test 2 : Conditions Critiques Multiples
**Objectif** : Tester la détection de plusieurs problèmes simultanés

**Données d'entrée** :
```json
{
  "parcelle_id": "PARCELLE_CRITIQUE",
  "temperature": 38.0,
  "humidite": 30.0,
  "humidite_sol": 15.0,
  "hydric_stress": 75.0,
  "irrigation_need_mm": 20.0,
  "ph_sol": 5.0,
  "soil_type": "sableux",
  "growth_stage": "floraison"
}
```

**Résultat attendu** :
```json
{
  "recommendations": [
    {
      "rule_id": "IRRIGATION_URGENTE",
      "priority": "critical",
      "title": "⚠️ Irrigation urgente requise",
      "message": "L'humidité du sol est critique (15%) avec température élevée (38°C)...",
      "action": "irriguer_immediatement"
    },
    {
      "rule_id": "TEMPERATURE_CRITIQUE",
      "priority": "critical",
      "title": "🔥 Température critique détectée",
      "message": "Température excessive (38°C)...",
      "action": "augmenter_frequence_irrigation"
    },
    {
      "rule_id": "STRESS_HYDRIQUE",
      "priority": "high",
      "title": "💧 Stress hydrique sévère prévu",
      "message": "Stress hydrique élevé détecté (75%)...",
      "action": "irrigation_preventive"
    },
    {
      "rule_id": "CROISSANCE_FLORAISON",
      "priority": "high",
      "title": "🌸 Phase floraison critique",
      "message": "Culture en floraison avec humidité insuffisante...",
      "action": "irrigation_optimale_floraison"
    },
    {
      "rule_id": "PH_INADEQUAT",
      "priority": "medium",
      "title": "⚗️ pH du sol inadéquat",
      "message": "pH trop acide (5.0)...",
      "action": "corriger_ph_sol"
    }
  ],
  "triggered_rules_count": 5
}
```
🚨 **Interprétation** : Situation d'urgence majeure, 5 actions critiques requises

**Commande de test** :

**Bash/Linux** :
```bash
curl -X POST http://localhost:8003/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "parcelle_id": "PARCELLE_CRITIQUE",
    "temperature": 38.0,
    "humidite": 30.0,
    "humidite_sol": 15.0,
    "hydric_stress": 75.0,
    "irrigation_need_mm": 20.0,
    "ph_sol": 5.0,
    "soil_type": "sableux",
    "growth_stage": "floraison"
  }'
```

**PowerShell/Windows** :
```powershell
$body = @'
{
  "parcelle_id": "PARCELLE_CRITIQUE",
  "temperature": 38.0,
  "humidite": 30.0,
  "humidite_sol": 15.0,
  "hydric_stress": 75.0,
  "irrigation_need_mm": 20.0,
  "ph_sol": 5.0,
  "soil_type": "sableux",
  "growth_stage": "floraison"
}
'@
Invoke-RestMethod -Uri 'http://localhost:8003/evaluate' -Method Post -Body $body -ContentType 'application/json'
```

---

### 🌡️ Cas de Test 3 : Sol Sableux en Été
**Objectif** : Tester les recommandations spécifiques au type de sol

**Données d'entrée** :
```json
{
  "parcelle_id": "PARCELLE_SABLE",
  "temperature": 28.0,
  "humidite": 50.0,
  "humidite_sol": 25.0,
  "hydric_stress": 40.0,
  "irrigation_need_mm": 8.0,
  "soil_type": "sableux",
  "growth_stage": "croissance"
}
```

**Résultat attendu** :
- ✅ 1-2 recommandations déclenchées
- ✅ Focus sur irrigation fréquente (sol drainant)
- ✅ Priorité MEDIUM-HIGH

---

### 🌸 Cas de Test 4 : Floraison Sensible
**Objectif** : Tester la détection des périodes critiques

**Données d'entrée** :
```json
{
  "parcelle_id": "PARCELLE_FLORAISON",
  "temperature": 26.0,
  "humidite": 55.0,
  "humidite_sol": 35.0,
  "hydric_stress": 45.0,
  "irrigation_need_mm": 10.0,
  "soil_type": "limoneux",
  "growth_stage": "floraison"
}
```

**Résultat attendu** :
- ✅ Recommandation "CROISSANCE_FLORAISON" déclenchée
- ✅ Priorité HIGH
- ✅ Conseil irrigation optimale pour soutenir la floraison

---

### 📊 Cas de Test 5 : Intégration avec PrévisionEau
**Objectif** : Tester le flux complet PrévisionEau → RèglesAgro

**Étape 1** : Appeler PrévisionEau
```bash
curl -X POST http://localhost:8002/forecasts/with-recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "capteur_id": "CAPT001",
    "parcelle_id": "PARCELLE_001",
    "horizon_days": 5,
    "model": "prophet"
  }'
```

**Étape 2** : PrévisionEau appelle automatiquement RèglesAgro

**Résultat attendu** :
```json
{
  "capteur_id": "CAPT001",
  "forecasts": [...],
  "recommendations": [
    {
      "rule_id": "HUMIDITE_FAIBLE",
      "priority": "high",
      "title": "Humidité du sol faible",
      "message": "...",
      "action": "planifier_irrigation"
    }
  ],
  "triggered_rules_count": 1,
  "regles_agro_available": true
}
```
✅ **Interprétation** : Intégration réussie, prévisions + recommandations

---

### 🧪 Tests Automatisés

**Tests unitaires du moteur de règles** :
```bash
# Activer l'environnement virtuel
.venv\Scripts\activate

# Lancer les tests
pytest tests/test_rule_engine.py -v

# Résultat attendu : 8/8 règles testées ✅
```

**Tests du service complet** :
```bash
pytest tests/test_rule_service.py -v

# Tests inclus :
# ✅ Évaluation avec 0 règles déclenchées
# ✅ Évaluation avec plusieurs règles
# ✅ Priorisation correcte
# ✅ Format de réponse valide
# ✅ Gestion des erreurs
```

**Tests d'intégration** :
```bash
# Démarrer RèglesAgro
uvicorn main:app --port 8003

# Dans un autre terminal
python test_integration.py

# Tests inclus :
# ✅ Health check
# ✅ Évaluation conditions normales
# ✅ Évaluation conditions critiques
# ✅ Historique des recommandations
# ✅ Informations parcelles
```

---

## Installation

### Prérequis

- Python 3.9+
- PostgreSQL (ou TimescaleDB partagée)
- Docker (optionnel)

### Installation locale

```bash
cd regles-agro
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

### Configuration

Créer un fichier `.env` :

```env
REGLES_AGRO_DB_HOST=localhost
REGLES_AGRO_DB_PORT=5432
REGLES_AGRO_DB_NAME=agrotrace_db
REGLES_AGRO_DB_USER=admin
REGLES_AGRO_DB_PASSWORD=password
REGLES_AGRO_ENVIRONMENT=dev

# Seuils configurables
REGLES_AGRO_SOIL_MOISTURE_CRITICAL=20.0
REGLES_AGRO_SOIL_MOISTURE_LOW=35.0
REGLES_AGRO_TEMPERATURE_HIGH=30.0
REGLES_AGRO_TEMPERATURE_CRITICAL=35.0
REGLES_AGRO_HYDRIC_STRESS_THRESHOLD=50.0
REGLES_AGRO_PH_MIN=6.0
REGLES_AGRO_PH_MAX=7.5
```

### Démarrage

```bash
uvicorn main:app --host 0.0.0.0 --port 8003
```

L'API sera accessible sur `http://localhost:8003`

## API

### Documentation interactive

- **Swagger UI** : `http://localhost:8003/docs`
- **ReDoc** : `http://localhost:8003/redoc`

### Endpoints principaux

#### 1. Évaluer les règles

```http
POST /evaluate
Content-Type: application/json

{
  "parcelle_id": "PARCELLE_001",
  "temperature": 32.5,
  "humidite": 45.0,
  "humidite_sol": 18.0,
  "hydric_stress": 65.0,
  "irrigation_need_mm": 18.0,
  "soil_type": "sableux",
  "growth_stage": "floraison",
  "ph_sol": 6.5
}
```

**Valeurs valides pour `growth_stage`** :
- `germination` : Début du cycle, émergence des plantules
- `levee` : Sortie de terre, premières feuilles
- `croissance` : Développement végétatif actif
- `floraison` : Formation des fleurs (période critique ⚠️)
- `fructification` : Formation et développement des fruits
- `maturation` : Maturation des fruits/grains
- `recolte` : Période de récolte

**Types de sol valides** :
- `sableux` : Sol léger, drainant
- `limoneux` : Sol équilibré (idéal)
- `argileux` : Sol lourd, retient l'eau

#### 2. Historique des recommandations

```http
GET /parcelles/{parcelle_id}/recommandations?limit=10
```

#### 3. Informations parcelle

```http
GET /parcelles/{parcelle_id}/info
```

#### 4. Health check

```http
GET /health
```

## Tests

```bash
# Activer l'environnement virtuel
.venv\Scripts\activate  # Windows

# Lancer les tests
pytest tests/

# Avec couverture
pytest tests/ --cov=app --cov-report=html
```

## Docker

### Build

```bash
docker build -t regles-agro .
```

### Run

```bash
docker run -p 8003:8003 \
  -e REGLES_AGRO_DB_HOST=timescaledb \
  -e REGLES_AGRO_DB_PASSWORD=password \
  regles-agro
```

## Intégration avec les autres microservices

Le microservice RèglesAgro peut être appelé par :

1. **PrévisionEau** : Après génération des prévisions, envoyer les données à RèglesAgro pour obtenir des recommandations
2. **RecoIrrigation** : Consommer les recommandations pour générer un plan d'irrigation détaillé
3. **DashboardSIG** : Afficher les recommandations sur la carte interactive

### Exemple d'intégration

```python
import requests

# Depuis PrévisionEau ou un autre service
forecast_data = {
    "parcelle_id": "PARCELLE_001",
    "temperature": 32.5,
    "humidite": 45.0,
    "humidite_sol": 18.0,
    "hydric_stress": 65.0,
    "irrigation_need_mm": 18.0,
}

response = requests.post(
    "http://regles-agro:8003/evaluate",
    json=forecast_data
)
recommendations = response.json()
```

## ⚠️ Erreurs Courantes et Solutions

### Erreur 422 : "JSON decode error - Extra data"

**Cause** : JSON mal formaté, accolades manquantes

**Exemple incorrect** :
```bash
# ❌ ERREUR : Pas d'accolades
curl -X POST http://localhost:8003/evaluate \
  -H "Content-Type: application/json" \
  -d '"parcelle_id": "PARCELLE_001", "temperature": 22.5'
```

**Solution** :
```bash
# ✅ CORRECT : JSON complet avec accolades
curl -X POST http://localhost:8003/evaluate \
  -H "Content-Type: application/json" \
  -d '{"parcelle_id": "PARCELLE_001", "temperature": 22.5, ...}'
```

**Pour PowerShell, utilisez** :
```powershell
# ✅ Format PowerShell correct
$body = @'
{
  "parcelle_id": "PARCELLE_001",
  "temperature": 22.5
}
'@
Invoke-RestMethod -Uri 'http://localhost:8003/evaluate' -Method Post -Body $body -ContentType 'application/json'
```

---

### Erreur 422 : "Input should be 'germination', 'levee'..."

**Cause** : Valeur invalide pour `growth_stage`

**Solution** : Utiliser une valeur valide parmi :
- `germination`, `levee`, `croissance`, `floraison`, `fructification`, `maturation`, `recolte`

---

### Erreur : Connexion refusée

**Vérifications** :
1. Le service est-il démarré ?
   ```bash
   uvicorn main:app --port 8003
   ```

2. Le port 8003 est-il libre ?
   ```powershell
   netstat -an | findstr 8003
   ```

---

## Ajouter une nouvelle règle

1. Créer une fonction dans `app/rules/engine.py` :

```python
def ma_nouvelle_regle(request: RuleEvaluationRequest, settings: Settings) -> Optional[Recommendation]:
    """Description de la règle."""
    if condition:
        return Recommendation(
            rule_id="MA_NOUVELLE_REGLE",
            priority="high",
            title="Titre de la recommandation",
            message="Message détaillé...",
            action="action_recommandee",
            parameters={...}
        )
    return None
```

2. Enregistrer la règle dans `initialize_rule_engine()` :

```python
engine.register_rule(ma_nouvelle_regle)
```

## Base de données

Le microservice crée automatiquement les tables suivantes :

- `parcelles` : Informations des parcelles (type de sol, culture, stade)
- `recommandations_historique` : Historique de toutes les recommandations générées

## Licence

MIT

