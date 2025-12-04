# 🚀 Guide de Test Rapide - Microservices AgroTrace

## ✅ Les deux microservices sont prêts !

### 📁 Structure propre
- ✅ **PrévisionEau** : 21 fichiers essentiels
- ✅ **RèglesAgro** : 18 fichiers essentiels
- ✅ Cache Python supprimé
- ✅ Tests temporaires supprimés
- ✅ .gitignore ajouté à chaque service
- ✅ README détaillés avec cas de test

---

## 🧪 Tests Rapides

### Test 1 : RèglesAgro - Conditions Normales ✅

**PowerShell** :
```powershell
$body = @{
    parcelle_id='PARCELLE_001'
    temperature=22.5
    humidite=65.0
    humidite_sol=55.0
    hydric_stress=20.0
    irrigation_need_mm=3.0
    ph_sol=6.5
    soil_type='limoneux'
    growth_stage='croissance'
} | ConvertTo-Json

Invoke-RestMethod -Uri 'http://localhost:8003/evaluate' -Method Post -Body $body -ContentType 'application/json'
```

**Résultat attendu** :
```
triggered_rules_count : 0
recommendations       : {}
```
✅ Tout est optimal, aucune alerte !

---

### Test 2 : RèglesAgro - Conditions Critiques 🚨

**PowerShell** :
```powershell
$bodyCritique = @{
    parcelle_id='PARCELLE_CRITIQUE'
    temperature=38.0
    humidite=30.0
    humidite_sol=15.0
    hydric_stress=75.0
    irrigation_need_mm=20.0
    ph_sol=5.0
    soil_type='sableux'
    growth_stage='floraison'
} | ConvertTo-Json

$result = Invoke-RestMethod -Uri 'http://localhost:8003/evaluate' -Method Post -Body $bodyCritique -ContentType 'application/json'

Write-Host "`n=== RESULTATS ===" -ForegroundColor Cyan
Write-Host "Regles declenchees: $($result.triggered_rules_count)" -ForegroundColor Yellow
Write-Host "`nRecommandations:" -ForegroundColor Green
$result.recommendations | ForEach-Object {
    Write-Host "  [$($_.priority)] $($_.rule_id) - $($_.title)" -ForegroundColor White
}
```

**Résultat attendu** :
```
Regles declenchees: 5-6

Recommandations:
  [critical] IRRIGATION_URGENTE - Irrigation urgente requise
  [critical] TEMPERATURE_CRITIQUE - Température critique
  [high] HUMIDITE_FAIBLE - Humidité du sol faible
  [high] STRESS_HYDRIQUE - Stress hydrique détecté
  [high] CROISSANCE_FLORAISON - Irrigation recommandée en période de floraison
  [medium] SOL_SABLEUX - Sol sableux - irrigation fréquente
```
🚨 Situation d'urgence détectée !

---

### Test 3 : PrévisionEau + RèglesAgro (Intégration)

**PowerShell** :
```powershell
# Activer l'environnement virtuel
cd "c:\Users\chaimae el kabil\Ingestion-pipeline-Agrotrace\prevision-eau"
.\.venv\Scripts\Activate.ps1

# Lancer le test d'intégration
python test_integration_complete.py
```

**Résultat attendu** :
```
✅ Test 1/5 : Health Check réussi
✅ Test 2/5 : Prévisions Prophet générées (5 jours)
✅ Test 3/5 : Prévisions LSTM générées (3 jours)
✅ Test 4/5 : Prévisions Blending générées (5 jours)
✅ Test 5/5 : Intégration avec RèglesAgro réussie

🎉 VALIDATION COMPLETE : 5/5 tests réussis
```

---

## 📊 Valeurs Valides

### Stades de Croissance (`growth_stage`)
| Valeur | Description |
|--------|-------------|
| `germination` | Début du cycle, émergence des plantules |
| `levee` | Sortie de terre, premières feuilles |
| `croissance` | Développement végétatif actif |
| `floraison` | Formation des fleurs (période critique ⚠️) |
| `fructification` | Formation et développement des fruits |
| `maturation` | Maturation des fruits/grains |
| `recolte` | Période de récolte |

### Types de Sol (`soil_type`)
| Valeur | Description |
|--------|-------------|
| `sableux` | Sol léger, drainant rapidement |
| `limoneux` | Sol équilibré, texture idéale |
| `argileux` | Sol lourd, retient l'eau |

---

## 🐛 Erreurs Courantes

### Erreur 422 : "JSON decode error - Extra data"

**Cause** : JSON mal formaté dans la commande curl (accolades manquantes)

**Exemple d'erreur** :
```bash
# ❌ INCORRECT : Pas d'accolades autour du JSON
curl -d '"parcelle_id": "PARCELLE_001", "temperature": 22.5'
```

**Solution** : Toujours utiliser un JSON complet
```bash
# ✅ CORRECT : JSON valide avec accolades
curl -d '{"parcelle_id": "PARCELLE_001", "temperature": 22.5}'
```

**Pour PowerShell** : Utilisez la syntaxe here-string `@' ... '@`
```powershell
# ✅ CORRECT pour PowerShell
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

**Solution** : Utiliser l'une des valeurs valides listées ci-dessus

**Exemple** :
```json
// ❌ INCORRECT
"growth_stage": "vegetatif"

// ✅ CORRECT
"growth_stage": "croissance"
```

---

### Erreur : Service non accessible

**Vérifications** :
1. Le service est-il démarré ?
   ```powershell
   # Démarrer RèglesAgro
   cd regles-agro
   .venv\Scripts\activate
   uvicorn main:app --port 8003
   ```

2. Le port est-il disponible ?
   ```powershell
   netstat -an | findstr 8003
   ```

---

## 📚 Documentation Complète

### PrévisionEau
- **README** : `prevision-eau/README.md`
- **Tests** : `prevision-eau/test_integration_complete.py`
- **API** : http://localhost:8002/docs

### RèglesAgro
- **README** : `regles-agro/README.md`
- **Tests** : `regles-agro/tests/`
- **API** : http://localhost:8003/docs

---

## ✅ Checklist de Partage

Avant de partager avec votre équipe :

- [x] ✅ Code propre (cache supprimé)
- [x] ✅ Structure organisée
- [x] ✅ README détaillés avec exemples
- [x] ✅ Cas de test documentés
- [x] ✅ .gitignore configurés
- [x] ✅ Tests fonctionnels validés
- [x] ✅ Valeurs valides documentées
- [ ] ⏳ Prêt à commit/push

---

## 🎯 Prochaines Étapes

1. **Tester localement** : Suivre les tests ci-dessus
2. **Vérifier la documentation** : Lire les README
3. **Partager avec l'équipe** : Les dossiers sont propres
4. **Intégrer dans Docker Compose** : Si nécessaire
5. **Connecter à TimescaleDB réel** : Pour données de production

---

## 📞 Support

En cas de problème :
1. Consulter les README détaillés
2. Vérifier les logs : `docker logs [service-name]`
3. Tester les endpoints avec Swagger UI
4. Utiliser les exemples PowerShell fournis

---

**Status** : ✅ **Prêt pour le partage et la collaboration !**
