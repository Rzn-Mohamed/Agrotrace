# Intelligence Hybride - Documentation d'utilisation

## Vue d'ensemble

L'endpoint `/recommandation-ia` combine le calcul scientifique traditionnel avec une analyse qualitative générée par un LLM (Large Language Model) pour fournir des recommandations d'irrigation enrichies.

## Configuration

### Variables d'environnement requises

```bash
# Clé API du LLM (Gemini ou OpenAI)
LLM_API_KEY=votre_cle_api_ici

# Modèle LLM à utiliser
LLM_MODEL=gemini-1.5-flash
# Options supportées:
# - gemini-1.5-flash (recommandé - rapide et économique)
# - gemini-1.5-pro (plus puissant mais plus lent)
# - gpt-4o (OpenAI - nécessite une clé OpenAI)
# - gpt-4o-mini (OpenAI - version économique)
```

### Installation des dépendances

```bash
pip install -r requirements.txt
```

Les nouvelles dépendances ajoutées :
- `httpx==0.27.2` : Client HTTP asynchrone pour les appels API

## Endpoint

### POST `/api/v1/irrigation/recommandation-ia`

Génère une recommandation d'irrigation enrichie par l'IA.

#### Exemple de requête

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

#### Exemple de réponse

```json
{
  "recommendation_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "zone_id": 1,
  "volume_eau_m3": 45.2,
  "duree_minutes": 120,
  "horaire_debut": "2025-11-28T22:00:00",
  "instruction_textuelle": "Irrigation planifiée pour la nuit.",
  "status": "PLANIFIE_IA",
  "analyse_contextuelle": "Avec une évapotranspiration élevée de 6.8 mm/jour et un stress hydrique important (0.75), les conditions sont défavorables. La température maximale de 32.5°C demain accentuera les besoins en eau.",
  "justification_agronomique": "Le stade de floraison de la tomate est critique et nécessite une irrigation optimale. Le volume de 45.2 m³ calculé est adapté pour maintenir l'humidité nécessaire sans créer de stress supplémentaire.",
  "conseils_additionnels": [
    "Vérifier l'état des buses et filtres avant irrigation",
    "Surveiller l'humidité du sol après irrigation",
    "Appliquer un engrais potassique pour soutenir la floraison",
    "Éviter tout stress hydrique pendant cette phase critique"
  ],
  "score_confiance": 87,
  "genere_par": "gemini-1.5-flash",
  "raw_input": {
    "context": {
      "zone_id": 1,
      "culture_type": "Tomate",
      "et0": 6.8,
      "temp_max": 32.5,
      "probabilite_pluie": 15.0,
      "stress_index": 0.75,
      "priorite": "ELEVEE",
      "stade_culture": "Floraison",
      "contrainte_hydrique": "Interdiction d'arroser entre 12h et 16h"
    },
    "scientific_result": {
      "volume_eau_m3": 45.2,
      "duree_minutes": 120,
      "horaire_debut": "2025-11-28T22:00:00",
      "instruction": "Irrigation planifiée pour la nuit."
    }
  }
}
```

## Fonctionnement

### 1. Calcul Scientifique
Le système effectue d'abord un calcul déterministe basé sur :
- L'évapotranspiration (ET0)
- Le coefficient cultural (Kc)
- L'index de stress hydrique
- Les règles agronomiques

### 2. Analyse IA
Le LLM reçoit :
- Les données contextuelles (météo, culture, stade)
- Le résultat du calcul scientifique
- Un prompt structuré d'agronome expert

Il génère :
- Une analyse contextuelle du climat
- Une justification agronomique
- Des conseils pratiques
- Un score de confiance

### 3. Mode Fallback
Si le LLM échoue (timeout, erreur API, etc.), le système retourne automatiquement :
- Le calcul scientifique (toujours disponible)
- Une analyse par défaut
- Un score de confiance réduit (50)
- L'indication "mode fallback"

## Architecture

```
app/
├── schemas/
│   └── plan.py                    # AIRecommendationResponse
├── services/
│   └── ai_service.py             # AIService (async)
├── routers/
│   └── irrigation.py             # POST /recommandation-ia
└── core/
    ├── config.py                 # LLM_API_KEY, LLM_MODEL
    └── logic.py                  # IrrigationEngine (inchangé)
```

## Différences avec l'endpoint standard

| Aspect | `/calculer` | `/recommandation-ia` |
|--------|-------------|---------------------|
| Calcul scientifique | ✅ | ✅ |
| Analyse IA | ❌ | ✅ |
| Justification agronomique | ❌ | ✅ |
| Conseils additionnels | ❌ | ✅ |
| Score de confiance | ❌ | ✅ |
| Requiert LLM API | ❌ | ✅ |
| Temps de réponse | ~100ms | ~2-5s |
| Coût | Gratuit | Minime (API LLM) |

## Gestion des erreurs

Le système gère automatiquement :
- **API Key manquante** : HTTP 503 avec message explicite
- **Timeout LLM** : Fallback automatique (30s max)
- **Erreur parsing JSON** : Fallback automatique
- **Erreur réseau** : Fallback automatique

## Tests avec curl

```bash
# Installer httpx d'abord
pip install httpx

# Tester l'endpoint (avec serveur lancé sur http://localhost:8000)
curl -X POST "http://localhost:8000/irrigation/recommandation-ia" \
  -H "Content-Type: application/json" \
  -d '{
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
      "contrainte_hydrique": "Interdiction d arroser entre 12h et 16h"
    }
  }'
```

## Coûts estimés (Google Gemini)

Avec Gemini 1.5 Flash :
- **Input** : ~500 tokens @ $0.075/1M tokens
- **Output** : ~300 tokens @ $0.30/1M tokens
- **Coût par requête** : ~$0.0001 (0.01 centime)
- **1000 requêtes** : ~$0.10

## Limitations connues

1. Le modèle de base de données actuel ne stocke pas tous les champs IA
2. Les recommandations IA ne sont pas versionnées
3. Pas de cache des réponses LLM identiques
4. Timeout fixe à 30 secondes

## Évolutions futures

- [ ] Ajouter un cache Redis pour les réponses similaires
- [ ] Étendre le modèle DB pour stocker l'analyse complète
- [ ] Ajouter un endpoint de feedback sur la qualité des recommandations
- [ ] Implémenter un mode "apprentissage" avec historique
- [ ] Support multi-langues pour les analyses
