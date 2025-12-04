# Configuration du Projet VisionPlante 🌱

## Instructions pour l'équipe de développement

### ⚠️ Fichiers manquants (trop volumineux pour Git)

Les fichiers suivants doivent être récupérés séparément:

1. **Modèle entraîné** (295 MB)
   - Fichier: `disease_multiclass_best.pth`
   - À placer dans: `visionPlante/`
   - [Lien de téléchargement à fournir]

2. **Dataset PlantVillage** (optionnel, pour réentraîner)
   - Taille: ~500 MB
   - À placer dans: `visionPlante/data/PlantVillage/`
   - Source: https://www.kaggle.com/datasets/emmarex/plantdisease
   - Structure attendue:
     ```
     data/PlantVillage/
     ├── train/
     │   ├── Apple___Apple_scab/
     │   ├── Apple___healthy/
     │   └── ... (39 dossiers au total)
     └── val/
         ├── Apple___Apple_scab/
         ├── Apple___healthy/
         └── ... (39 dossiers au total)
     ```

### 🚀 Configuration rapide

```bash
# 1. Cloner le projet
git clone [URL_DU_REPO]
cd visionPlante

# 2. Télécharger le modèle pré-entraîné
# Placer disease_multiclass_best.pth dans visionPlante/

# 3. Vérifier que class_names.json existe (déjà dans le repo)

# 4. Lancer avec Docker
docker-compose up -d vision-plante

# 5. Tester l'API
curl http://localhost:8002/health

# 6. Accéder à l'interface web
http://localhost:8002
```

### 📋 Checklist avant le premier lancement

- [ ] `disease_multiclass_best.pth` présent (295 MB)
- [ ] `class_names.json` présent (1 KB)
- [ ] Docker installé et démarré
- [ ] Port 8002 disponible
- [ ] MinIO configuré (ou utiliser docker-compose)

### 🧪 Tests rapides

```bash
# Vérifier les services
docker ps | grep vision-plante

# Logs du service
docker logs vision-plante --tail 50

# Test API simple
curl http://localhost:8002/health

# Test avec image (PowerShell)
$image = [System.IO.File]::ReadAllBytes("test_image.jpg")
Invoke-RestMethod -Uri "http://localhost:8002/api/v1/upload-and-analyze" -Method POST -Form @{file=$image}
```

### 🔧 Développement local (sans Docker)

```bash
# Installer les dépendances
pip install -r requirements.txt

# Variables d'environnement
$env:MINIO_ENDPOINT="localhost:9000"
$env:MINIO_ACCESS_KEY="minioadmin"
$env:MINIO_SECRET_KEY="minioadmin"

# Lancer l'API
cd app
uvicorn main:app --reload --port 8000
```

### 📊 Réentraîner le modèle (optionnel)

```bash
# Télécharger PlantVillage dataset
# Placer dans: data/PlantVillage/{train,val}/

# Lancer l'entraînement
python train_multiclass.py --data-dir data/PlantVillage --epochs 10 --batch-size 32

# Les nouveaux fichiers générés:
# - disease_multiclass_best.pth (écrase l'ancien)
# - class_names.json (écrase l'ancien)

# Reconstruire le conteneur Docker
docker-compose up -d --build vision-plante
```

### 🐛 Troubleshooting

**Problème: Le modèle ne charge pas**
```bash
# Vérifier que le fichier existe
ls -l disease_multiclass_best.pth

# Vérifier la taille (doit être ~295 MB)
# Si taille incorrecte, retélécharger
```

**Problème: Port 8002 déjà utilisé**
```bash
# Modifier dans docker-compose.yml:
ports:
  - "8003:8000"  # Utiliser 8003 au lieu de 8002
```

**Problème: Erreur MinIO**
```bash
# Vérifier que MinIO est lancé
docker ps | grep minio

# Relancer MinIO
docker-compose up -d minio
```

### 📦 Structure des fichiers importants

```
visionPlante/
├── app/
│   ├── api/
│   │   └── routes.py              # Routes FastAPI
│   ├── models/
│   │   └── unet.py                # Modèles ML
│   ├── static/
│   │   └── index.html             # Interface web
│   └── main.py                    # Point d'entrée
├── disease_multiclass_best.pth    # ⚠️ NON versionné (295 MB)
├── class_names.json               # ✅ Versionné (1 KB)
├── train_multiclass.py            # Script d'entraînement
├── Dockerfile                     # Image Docker
├── requirements.txt               # Dépendances Python
├── .gitignore                     # Exclusions Git
└── README.md                      # Documentation principale
```

### 🔐 Sécurité

- Ne jamais commiter les fichiers `.pth` (trop volumineux)
- Ne jamais commiter les credentials MinIO
- Utiliser `.env` pour les secrets en production

### 👥 Contribution

1. Créer une branche: `git checkout -b feature/ma-fonctionnalite`
2. Développer et tester localement
3. Commit: `git commit -m "Description"`
4. Push: `git push origin feature/ma-fonctionnalite`
5. Créer une Pull Request

### 📞 Contact

Pour toute question sur la configuration:
- Vérifier les logs: `docker logs vision-plante`
- Consulter la doc API: http://localhost:8002/docs
- [Contact de l'équipe]
