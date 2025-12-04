# 📦 Package de Documentation - Projet Ingestion Pipeline Agrotrace

**Date de création** : 2 décembre 2025  
**Statut** : ✅ Prêt pour partage équipe

---

## 📋 Contenu du Package

Ce dossier contient toute la documentation essentielle pour comprendre et utiliser les microservices **PrévisionEau** et **RèglesAgro**.

### 📁 Fichiers et Dossiers Inclus

| Élément | Description | Priorité |
|---------|-------------|----------|
| 📄 `README.md` | Documentation générale du projet | 🔴 ESSENTIEL |
| 📄 `GUIDE_TEST_RAPIDE.md` | Guide de test avec commandes PowerShell | 🟠 IMPORTANT |
| 📁 `prevision-eau/` | Code complet microservice PrévisionEau (21 fichiers) | 🔴 ESSENTIEL |
| 📁 `regles-agro/` | Code complet microservice RèglesAgro (18 fichiers) | 🔴 ESSENTIEL |
| 📄 `docker-compose.yml` | Configuration Docker | 🟠 IMPORTANT |

**Note** : Les README détaillés de chaque microservice se trouvent dans leurs dossiers respectifs :
- `prevision-eau/README.md`
- `regles-agro/README.md`

---

## 🚀 Par où commencer ?

### 1️⃣ Comprendre le Projet (5 min)
Lire : `README.md`
- Vue d'ensemble du pipeline d'ingestion
- Architecture globale
- Technologies utilisées

### 2️⃣ Comprendre PrévisionEau (10 min)
Lire : `prevision-eau/README.md`
- Prévision de stress hydrique
- Modèles Prophet et LSTM
- API et intégration TimescaleDB

### 3️⃣ Comprendre RèglesAgro (10 min)
Lire : `regles-agro/README.md`
- 8 règles agronomiques
- Moteur de recommandations
- Cas de test validés ✅

### 4️⃣ Tester Rapidement (15 min)
Suivre : `GUIDE_TEST_RAPIDE.md`
- Démarrer les services
- Tester avec PowerShell
- Valider les 2 scénarios (normal + critique)

---

## 🧪 Tests Validés

### ✅ PrévisionEau (Port 8002)
- Health check fonctionnel
- Modèles Prophet & LSTM opérationnels
- Intégration TimescaleDB testée

### ✅ RèglesAgro (Port 8003)
- **Test 1** : Conditions normales → 0 recommandation ✅
- **Test 2** : Conditions critiques → 6 recommandations ✅
  - 2 CRITICAL (irrigation urgente, température critique)
  - 3 HIGH (humidité faible, stress hydrique, floraison)
  - 1 MEDIUM (sol sableux)

---

## 🎯 Points Clés à Retenir

### PrévisionEau
- **Technologie** : Prophet (Meta) + LSTM (PyTorch)
- **Fonction** : Prévoir le stress hydrique sur 1-7 jours
- **Base de données** : TimescaleDB (séries temporelles)

### RèglesAgro
- **Technologie** : Moteur de règles Python
- **Fonction** : Traduire prévisions → recommandations actionnables
- **Base de données** : PostgreSQL (historique)

### Intégration
```
Capteurs → PrévisionEau (stress hydrique) → RèglesAgro (recommandations) → Agriculteur
```

---

## 📞 Support

**Documentation complète** : Consultez les README respectifs  
**Tests** : Suivez le GUIDE_TEST_RAPIDE.md  
**Erreurs courantes** : Section dédiée dans REGLES_AGRO_README.md

---

## 🔧 Valeurs Importantes

### Stades de Croissance Valides
- `germination`, `levee`, `croissance`, `floraison`, `fructification`, `maturation`, `recolte`

### Types de Sol Valides
- `sableux` (drainant), `limoneux` (équilibré), `argileux` (retient eau)

### Niveaux de Priorité
- `CRITICAL` : Action immédiate requise
- `HIGH` : Action dans 24-48h
- `MEDIUM` : Surveillance recommandée
- `LOW` : Information

---

## 📦 Déploiement

```powershell
# Démarrer tous les services
docker-compose up -d

# Vérifier le statut
docker-compose ps

# Voir les logs
docker-compose logs -f prevision-eau
docker-compose logs -f regles-agro
```

---

**Bonne lecture ! 📚**
