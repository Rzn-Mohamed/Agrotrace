# Entraînement du Modèle Multi-Classe VisionPlante

## 📋 Vue d'ensemble
Ce guide explique comment entraîner le modèle ResNet50 pour identifier **39 maladies de plantes** du dataset PlantVillage.

## 🎯 Objectif
- **Avant**: Détection binaire (saine/malade) avec taux de faux positifs élevé
- **Après**: Classification multi-classe avec identification précise de la maladie

## 📦 Prérequis
Le dataset PlantVillage est déjà téléchargé dans:
```
visionPlante/data/
├── train/  (39 classes, ~19,000 images)
│   ├── Apple___Apple_scab/
│   ├── Apple___Black_rot/
│   ├── Apple___Cedar_apple_rust/
│   ├── Apple___healthy/
│   ├── Tomato___Bacterial_spot/
│   ├── Tomato___Early_blight/
│   ├── Tomato___healthy/
│   └── ... (32 autres classes)
└── val/    (38 classes, ~3,800 images)
```

## 🚀 Entraînement

### Option 1: Entraînement complet (Recommandé)
```powershell
# Depuis le dossier visionPlante
cd visionPlante
python train_multiclass.py --epochs 10 --batch-size 16 --lr 0.001
```

**Durée estimée**: 20-30 minutes par époque sur CPU (3-5 heures total pour 10 époques)

### Option 2: Entraînement rapide (test)
```powershell
python train_multiclass.py --epochs 3 --batch-size 32
```

**Durée estimée**: 45-90 minutes

### Option 3: Entraînement de nuit
```powershell
python train_multiclass.py --epochs 20 --batch-size 8
```

## 📊 Résultats attendus
L'entraînement produira:
- ✅ `disease_multiclass_best.pth` - Modèle entraîné
- ✅ `class_names.json` - Liste des 39 maladies
- ✅ Précision validation: 85-95% (selon nombre d'époques)

## 🐳 Déploiement Docker

### 1. Copier les fichiers entraînés
```powershell
# Depuis le dossier racine
Copy-Item visionPlante\disease_multiclass_best.pth visionPlante\
Copy-Item visionPlante\class_names.json visionPlante\
```

### 2. Modifier le Dockerfile
Le Dockerfile est déjà configuré pour copier ces fichiers:
```dockerfile
COPY disease_multiclass_best.pth /app/disease_multiclass_best.pth
COPY class_names.json /app/class_names.json
```

### 3. Rebuilder le container
```powershell
docker-compose up -d --build vision-plante
```

## 🔍 Vérification

### Tester l'API
```powershell
# Upload une image
curl -X POST http://localhost:8002/api/v1/upload-and-analyze `
  -F "file=@path/to/plant_image.jpg"
```

Réponse attendue:
```json
{
  "original_image_key": "upload_xxx.jpg",
  "mask_key": "mask_xxx.png",
  "disease_probability": 0.87,
  "disease_name": "Tomato___Late_blight",
  "status": "success"
}
```

## 📝 Liste des maladies détectables

Le modèle peut identifier 39 classes:

### 🍎 Apple (Pomme)
- Apple___Apple_scab
- Apple___Black_rot
- Apple___Cedar_apple_rust
- Apple___healthy

### 🌽 Corn (Maïs)
- Corn___Cercospora_leaf_spot Gray_leaf_spot
- Corn___Common_rust
- Corn___Northern_Leaf_Blight
- Corn___healthy

### 🍇 Grape (Raisin)
- Grape___Black_rot
- Grape___Esca_(Black_Measles)
- Grape___Leaf_blight_(Isariopsis_Leaf_Spot)
- Grape___healthy

### 🥔 Potato (Pomme de terre)
- Potato___Early_blight
- Potato___Late_blight
- Potato___healthy

### 🍓 Strawberry (Fraise)
- Strawberry___Leaf_scorch
- Strawberry___healthy

### 🍅 Tomato (Tomate)
- Tomato___Bacterial_spot
- Tomato___Early_blight
- Tomato___Late_blight
- Tomato___Leaf_Mold
- Tomato___Septoria_leaf_spot
- Tomato___Spider_mites Two-spotted_spider_mite
- Tomato___Target_Spot
- Tomato___Tomato_Yellow_Leaf_Curl_Virus
- Tomato___Tomato_mosaic_virus
- Tomato___healthy

### Autres cultures
- Bell_Pepper, Cherry, Orange, Peach, Raspberry, Soybean, Squash

## ⚠️ Notes importantes

1. **Temps d'entraînement**: Ne pas interrompre l'entraînement avec Ctrl+C
2. **Mémoire**: Réduire batch-size si RAM insuffisante
3. **CPU vs GPU**: Sur GPU, l'entraînement sera 10-20x plus rapide
4. **Sauvegarde**: Le meilleur modèle est sauvegardé automatiquement

## 🔧 Dépannage

### Erreur "KeyboardInterrupt"
- Ne pas appuyer sur Ctrl+C pendant l'entraînement
- Laisser tourner en arrière-plan

### Erreur "Out of memory"
```powershell
python train_multiclass.py --batch-size 8  # Réduire batch size
```

### Modèle ne charge pas
```powershell
# Vérifier que les fichiers existent
Test-Path visionPlante\disease_multiclass_best.pth
Test-Path visionPlante\class_names.json

# Vérifier dans le container
docker exec vision-plante ls -la /app/*.pth /app/*.json
```

## 📈 Amélioration de la précision

Pour augmenter la précision:
1. ✅ Augmenter le nombre d'époques (--epochs 20)
2. ✅ Réduire learning rate (--lr 0.0001) après époque 10
3. ✅ Data augmentation (déjà incluse dans train_multiclass.py)
4. ✅ Fine-tuning avec images spécifiques à votre région

## 🎉 Résultat final

Après entraînement et déploiement:
- ✅ **Détecte si la plante est saine** (0% maladie si "healthy" détecté)
- ✅ **Identifie la maladie spécifique** (ex: "Tomato___Late_blight")
- ✅ **Fournit la confiance** (85-95% pour le top-1)
- ✅ **Top-3 des maladies possibles** (logged in console)

---

**Note**: Pour des résultats optimaux, entraîner pendant au moins 10 époques sans interruption.
