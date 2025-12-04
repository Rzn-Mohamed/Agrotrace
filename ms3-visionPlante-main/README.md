# 🌱 VisionPlante - Microservice de Détection de Maladies

Ce microservice est responsable de l'analyse d'images de drones (UAV) pour détecter les maladies des plantes en utilisant l'intelligence artificielle (Deep Learning).

## 🏗️ Architecture

- **Framework** : FastAPI
- **IA / ML** : PyTorch (U-Net)
- **Stockage** : MinIO (Compatible S3)

## 🚀 Démarrage

Ce service est intégré au `docker-compose.yml` principal du projet.

```bash
# Démarrer tout le projet
docker-compose up -d --build

# Démarrer uniquement ce service et ses dépendances
docker-compose up -d --build vision-plante minio
```

## 🔌 API Endpoints

L'API est accessible sur le port **8002**.

- **Documentation Swagger** : http://localhost:8002/docs

### 1. Analyse Directe (Upload)
`POST /api/v1/upload-and-analyze`
- Envoie une image locale.
- Retourne le masque de segmentation et le score de maladie.

### 2. Analyse via MinIO
`POST /api/v1/analyze`
- Traite une image déjà stockée dans le bucket MinIO.
- Payload : `{"image_key": "chemin/vers/image.jpg"}`

## 🗄️ Stockage (MinIO)

- **Console MinIO** : http://localhost:9002
- **User** : `minioadmin`
- **Password** : `minioadmin`
- **Buckets créés automatiquement** :
  - `uav-images` : Images brutes
  - `vision-results` : Masques de segmentation générés

## 🧠 Modèle IA

Le modèle actuel est une architecture **U-Net** simplifiée (`app/models/unet.py`).
Pour la production, remplacez les poids par un modèle entraîné sur un dataset réel (ex: PlantVillage).
