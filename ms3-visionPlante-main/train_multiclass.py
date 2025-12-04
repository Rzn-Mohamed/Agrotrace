"""
Entraînement multi-classe pour identifier les maladies spécifiques
39 classes: différentes maladies + plantes saines
"""
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
from torchvision.models import resnet50, ResNet50_Weights
import argparse
from tqdm import tqdm
import json

def create_multiclass_model(num_classes=39):
    """Créer ResNet50 pour classification multi-classe"""
    model = resnet50(weights=ResNet50_Weights.IMAGENET1K_V2)
    model.fc = nn.Sequential(
        nn.Linear(2048, 512),
        nn.ReLU(),
        nn.Dropout(0.3),
        nn.Linear(512, num_classes)
    )
    return model

def get_dataloaders(data_dir, batch_size=16):
    """Préparer les dataloaders"""
    import os
    from PIL import Image
    from pathlib import Path
    
    # Dataset personnalisé compatible avec les extensions en majuscules
    class PlantDiseaseDataset(torch.utils.data.Dataset):
        def __init__(self, root_dir, transform=None):
            self.root_dir = Path(root_dir)
            self.transform = transform
            self.samples = []
            self.classes = []
            self.class_to_idx = {}
            
            # Scanner les dossiers de classes
            class_dirs = sorted([d for d in self.root_dir.iterdir() if d.is_dir()])
            for idx, class_dir in enumerate(class_dirs):
                class_name = class_dir.name
                self.classes.append(class_name)
                self.class_to_idx[class_name] = idx
                
                # Scanner les images (insensible à la casse)
                image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tif', '.tiff'}
                for img_path in class_dir.iterdir():
                    if img_path.suffix.lower() in image_extensions:
                        self.samples.append((str(img_path), idx))
            
            print(f"  - Chargé {len(self.samples)} images depuis {len(self.classes)} classes")
        
        def __len__(self):
            return len(self.samples)
        
        def __getitem__(self, idx):
            img_path, label = self.samples[idx]
            image = Image.open(img_path).convert('RGB')
            if self.transform:
                image = self.transform(image)
            return image, label
    
    train_transform = transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.RandomCrop(224),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(10),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    val_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    train_dataset = PlantDiseaseDataset(
        root_dir=os.path.join(data_dir, "train"),
        transform=train_transform
    )
    val_dataset = PlantDiseaseDataset(
        root_dir=os.path.join(data_dir, "val"),
        transform=val_transform
    )
    
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=0)
    
    return train_loader, val_loader, train_dataset.classes

def train_epoch(model, dataloader, criterion, optimizer, device):
    """Entraîner pour une epoch"""
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0
    
    pbar = tqdm(dataloader, desc="Training")
    for inputs, labels in pbar:
        inputs, labels = inputs.to(device), labels.to(device)
        
        optimizer.zero_grad()
        outputs = model(inputs)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        
        running_loss += loss.item()
        _, predicted = outputs.max(1)
        total += labels.size(0)
        correct += predicted.eq(labels).sum().item()
        
        acc = 100. * correct / total
        pbar.set_postfix({'loss': f'{loss.item():.3f}', 'acc': f'{acc:.1f}%'})
    
    return running_loss / len(dataloader), 100. * correct / total

def validate(model, dataloader, criterion, device):
    """Valider le modèle"""
    model.eval()
    running_loss = 0.0
    correct = 0
    total = 0
    
    with torch.no_grad():
        pbar = tqdm(dataloader, desc="Validation")
        for inputs, labels in pbar:
            inputs, labels = inputs.to(device), labels.to(device)
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            
            running_loss += loss.item()
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()
            
            acc = 100. * correct / total
            pbar.set_postfix({'loss': f'{loss.item():.3f}', 'acc': f'{acc:.1f}%'})
    
    return running_loss / len(dataloader), 100. * correct / total

def main():
    parser = argparse.ArgumentParser(description='Entraînement multi-classe pour identification des maladies')
    parser.add_argument('--data-dir', type=str, default='data', help='Dossier du dataset')
    parser.add_argument('--epochs', type=int, default=5, help='Nombre d\'époques')
    parser.add_argument('--batch-size', type=int, default=16, help='Taille des batchs')
    parser.add_argument('--lr', type=float, default=0.001, help='Learning rate')
    args = parser.parse_args()
    
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")
    
    print("\n" + "="*70)
    print("CHARGEMENT DU DATASET")
    print("="*70)
    train_loader, val_loader, class_names = get_dataloaders(args.data_dir, args.batch_size)
    num_classes = len(class_names)
    
    print(f"\n✓ Dataset chargé:")
    print(f"  - {num_classes} classes de maladies")
    print(f"  - {len(train_loader.dataset)} images train")
    print(f"  - {len(val_loader.dataset)} images validation")
    
    # Sauvegarder les noms de classes
    with open('class_names.json', 'w') as f:
        json.dump(class_names, f, indent=2)
    print(f"\n✓ Classes sauvegardées dans class_names.json")
    
    print("\n" + "="*70)
    print("CRÉATION DU MODÈLE")
    print("="*70)
    model = create_multiclass_model(num_classes).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=args.lr)
    
    print(f"✓ ResNet50 configuré pour {num_classes} classes")
    print(f"✓ Optimizer: Adam (lr={args.lr})")
    
    print("\n" + "="*70)
    print("ENTRAÎNEMENT")
    print("="*70)
    
    best_val_acc = 0.0
    
    for epoch in range(args.epochs):
        print(f"\n📊 Epoch {epoch+1}/{args.epochs}")
        print("-" * 70)
        
        train_loss, train_acc = train_epoch(model, train_loader, criterion, optimizer, device)
        val_loss, val_acc = validate(model, val_loader, criterion, device)
        
        print(f"\n  Train - Loss: {train_loss:.4f} | Acc: {train_acc:.2f}%")
        print(f"  Val   - Loss: {val_loss:.4f} | Acc: {val_acc:.2f}%")
        
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save({
                'model_state_dict': model.state_dict(),
                'optimizer_state_dict': optimizer.state_dict(),
                'epoch': epoch,
                'val_acc': val_acc,
                'num_classes': num_classes,
                'class_names': class_names
            }, 'disease_multiclass_best.pth')
            print(f"  ✓ Meilleur modèle sauvegardé (acc: {val_acc:.2f}%)")
    
    print("\n" + "="*70)
    print("ENTRAÎNEMENT TERMINÉ")
    print("="*70)
    print(f"✓ Meilleure précision: {best_val_acc:.2f}%")
    print(f"✓ Modèle sauvegardé: disease_multiclass_best.pth")
    print(f"✓ Classes sauvegardées: class_names.json")
    print("\n📋 Le modèle peut maintenant identifier:")
    for i, name in enumerate(class_names[:10]):
        print(f"  {i+1}. {name}")
    if len(class_names) > 10:
        print(f"  ... et {len(class_names)-10} autres classes")

if __name__ == "__main__":
    main()
