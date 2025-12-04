# ⚡ Quickstart - DashboardSIG

Guide rapide pour démarrer le projet en 2 minutes.

## 🚀 Démarrage Ultra-Rapide

```bash
# 1. Naviguer dans le projet
cd /Users/Aeztic/Documents/MicroServices/DashboardSIG

# 2. Démarrer tous les services (production)
./start.sh prod

# 3. Accéder à l'application
# Frontend: http://localhost:5173
# Backend:  http://localhost:3001/api
```

C'est tout ! 🎉

## 📋 Commandes Essentielles

### Gestion des Services

```bash
# Démarrer en mode développement (voir les logs)
./start.sh dev

# Démarrer en mode production (arrière-plan)
./start.sh prod

# Arrêter tous les services
./start.sh stop

# Voir les logs en temps réel
./start.sh logs

# Nettoyage complet (⚠️ supprime les données)
./start.sh clean
```

### Alternative avec Docker Compose

```bash
# Démarrer
docker-compose up -d

# Arrêter
docker-compose down

# Voir les logs
docker-compose logs -f

# Rebuild après modification
docker-compose up -d --build
```

## 🧪 Tests de l'API

```bash
# Charger les fonctions de test
source api_tests.sh

# Tester la santé de l'API
test_health

# Récupérer toutes les parcelles
test_get_parcelles

# Lancer tous les tests
run_all_tests
```

### Tests manuels avec curl

```bash
# Health check
curl http://localhost:3001/api/health | jq

# Liste des parcelles (GeoJSON)
curl http://localhost:3001/api/parcelles | jq

# Détails d'une parcelle
curl http://localhost:3001/api/parcelles/1 | jq

# État hydrique
curl http://localhost:3001/api/etat-hydrique | jq

# Statistiques
curl http://localhost:3001/api/stats | jq
```

## 🗄️ Base de Données

### Accès à PostgreSQL/PostGIS

```bash
# Via Docker
docker-compose exec postgis psql -U postgres -d agrotrace_sig

# Depuis la machine locale (si psql installé)
psql -h localhost -U postgres -d agrotrace_sig
```

### Requêtes SQL Utiles

```sql
-- Compter les parcelles
SELECT COUNT(*) FROM parcelles;

-- Voir toutes les parcelles
SELECT id, nom, culture, stress_hydrique FROM parcelles;

-- Parcelles en état critique
SELECT nom, culture, niveau_stress, besoin_eau_mm 
FROM parcelles 
WHERE stress_hydrique = 'CRITIQUE';

-- Alertes actives
SELECT p.nom, a.type_maladie, a.severite 
FROM alertes_maladies a
JOIN parcelles p ON a.parcelle_id = p.id;
```

## 🐛 Troubleshooting Rapide

### Les services ne démarrent pas

```bash
# Vérifier les logs
docker-compose logs

# Rebuild complet
docker-compose down
docker-compose up --build
```

### Le frontend ne charge pas les données

```bash
# Vérifier que le backend est accessible
curl http://localhost:3001/api/health

# Vérifier les logs backend
docker-compose logs backend
```

### Erreur de connexion à la base de données

```bash
# Vérifier que PostGIS est démarré
docker-compose ps postgis

# Réinitialiser la base
docker-compose down -v
docker-compose up -d
```

## 📊 Vérification de l'Installation

Checklist après le premier démarrage :

- [ ] Frontend accessible sur http://localhost:5173
- [ ] Backend répond sur http://localhost:3001/api/health
- [ ] Carte affiche 4 parcelles
- [ ] Click sur une parcelle ouvre une popup
- [ ] Sidebar affiche les statistiques
- [ ] Export PDF fonctionne
- [ ] Base de données contient des données

### Script de vérification automatique

```bash
#!/bin/bash

echo "🔍 Vérification de l'installation..."

# Test Frontend
if curl -s http://localhost:5173 > /dev/null; then
    echo "✅ Frontend OK"
else
    echo "❌ Frontend KO"
fi

# Test Backend
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ Backend OK"
else
    echo "❌ Backend KO"
fi

# Test Database
if docker-compose exec -T postgis psql -U postgres -d agrotrace_sig -c "SELECT COUNT(*) FROM parcelles;" > /dev/null 2>&1; then
    echo "✅ Database OK"
else
    echo "❌ Database KO"
fi
```

## 🎯 Prochaines Étapes

1. **Exploration de l'interface**
   - Cliquez sur les parcelles colorées
   - Consultez les alertes et recommandations
   - Exportez un rapport PDF

2. **Personnalisation**
   - Modifiez les données dans `database/init.sql`
   - Ajustez les couleurs dans les fichiers CSS
   - Configurez les variables d'environnement

3. **Développement**
   - Consultez `DEVELOPMENT.md` pour l'architecture
   - Ajoutez de nouvelles fonctionnalités
   - Connectez-vous aux vrais services IoT/Drones

## 📚 Documentation Complète

- `README.md` - Guide complet du projet
- `DEVELOPMENT.md` - Architecture et développement
- `api_tests.sh` - Tests de l'API

## 🆘 Support

En cas de problème :

1. Vérifier les logs : `docker-compose logs`
2. Consulter le troubleshooting dans README.md
3. Relancer avec rebuild : `docker-compose up --build`

---

**Happy coding! 🌾**
