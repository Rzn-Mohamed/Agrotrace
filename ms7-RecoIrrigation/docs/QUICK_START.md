# 🚀 Guide de Démarrage Rapide - Intelligence Hybride

## Étape 1 : Configuration

### 1.1 Obtenir une clé API Gemini (Gratuit)

1. Aller sur [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Se connecter avec un compte Google
3. Cliquer sur "Create API Key"
4. Copier la clé générée

### 1.2 Configurer le fichier .env

```bash
# Éditer le fichier .env
nano .env

# Ajouter votre clé API
LLM_API_KEY=votre_cle_api_ici
LLM_MODEL=gemini-1.5-flash
```

## Étape 2 : Lancer le serveur

```bash
# Activer l'environnement virtuel
source venv/bin/activate

# Lancer le serveur
uvicorn app.main:app --reload
```

Le serveur démarre sur `http://localhost:8000`

## Étape 3 : Tester l'endpoint

### Option 1 : Interface Swagger (Recommandé)

1. Ouvrir `http://localhost:8000/docs` dans votre navigateur
2. Trouver l'endpoint `POST /irrigation/recommandation-ia`
3. Cliquer sur "Try it out"
4. Utiliser cet exemple :

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

5. Cliquer sur "Execute"
6. Observer la réponse avec l'analyse IA !

### Option 2 : Script Python

```bash
# Dans un nouveau terminal
python tests/test_ai_endpoint.py
```

### Option 3 : curl

```bash
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

## Étape 4 : Analyser la réponse

Vous devriez recevoir une réponse comme :

```json
{
  "recommendation_id": "uuid-v4",
  "zone_id": 1,
  "volume_eau_m3": 51.3,
  "duree_minutes": 769,
  "horaire_debut": "2025-11-28T22:00:00",
  "instruction_textuelle": "Irrigation planifiée pour la nuit.",
  "status": "PLANIFIE_IA",
  "analyse_contextuelle": "Avec une évapotranspiration élevée de 6.8 mm/jour et un stress hydrique de 0.75, les conditions sont défavorables...",
  "justification_agronomique": "Le stade de floraison nécessite une irrigation optimale. Le volume calculé maintient l'humidité nécessaire...",
  "conseils_additionnels": [
    "Vérifier l'état des buses avant irrigation",
    "Surveiller l'humidité du sol après irrigation",
    "Apport d'engrais potassique recommandé"
  ],
  "score_confiance": 87,
  "genere_par": "gemini-1.5-flash"
}
```

## 🎯 Points d'attention

### ✅ Ce qui fonctionne
- Calcul scientifique fiable (ET0, Kc)
- Analyse contextuelle par IA
- Justification agronomique détaillée
- Conseils pratiques personnalisés
- Fallback automatique si l'IA échoue

### ⚠️ Limitations connues
- Temps de réponse : 2-5 secondes (vs <100ms sans IA)
- Nécessite une connexion internet
- Coût minime par requête (~0.01 centime)

## 🔧 Dépannage

### Erreur 503 "Service IA non configuré"
➡️ Vérifier que `LLM_API_KEY` est défini dans `.env`

### Timeout
➡️ Vérifier votre connexion internet
➡️ Le timeout par défaut est 30 secondes

### Réponse en mode fallback
➡️ L'IA n'est pas disponible mais le calcul scientifique fonctionne
➡️ Vérifier la clé API et le quota

### Import Error httpx
➡️ Exécuter : `pip install httpx`

## 📊 Comparaison avec l'endpoint standard

| Critère | `/calculer` | `/recommandation-ia` |
|---------|-------------|---------------------|
| Calcul volume | ✅ | ✅ |
| Analyse IA | ❌ | ✅ |
| Justification | ❌ | ✅ |
| Conseils | ❌ | ✅ |
| Temps réponse | ~100ms | ~2-5s |
| Coût | Gratuit | ~$0.0001 |

## 🎓 Prochaines étapes

1. Tester avec différents types de cultures (Blé, Maïs)
2. Varier les paramètres météo
3. Explorer les différentes priorités (CRITIQUE, ELEVEE, NORMALE, BASSE)
4. Comparer les résultats avec l'endpoint standard
5. Intégrer dans votre application

## 📚 Documentation complète

- [Intelligence Hybride - Guide complet](INTELLIGENCE_HYBRIDE.md)
- [API Documentation](http://localhost:8000/docs)
- [Redoc](http://localhost:8000/redoc)

## 💡 Cas d'usage

### Urgence (Priorité CRITIQUE)
```json
{
  "regles": {
    "priorite": "CRITIQUE",
    "stade_culture": "Fructification"
  }
}
```
➡️ Irrigation immédiate recommandée

### Risque de pluie
```json
{
  "prediction": {
    "probabilite_pluie": 80.0
  }
}
```
➡️ L'IA peut recommander de reporter l'irrigation

### Stade sensible
```json
{
  "regles": {
    "stade_culture": "Floraison"
  }
}
```
➡️ Conseils spécifiques au stade de développement

---

🎉 **Félicitations !** Vous utilisez maintenant l'Intelligence Hybride pour vos recommandations d'irrigation.
