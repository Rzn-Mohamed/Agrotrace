import torch
import torch.nn as nn
import torch.nn.functional as F
import torchvision.transforms as transforms
from torchvision.models import resnet50, ResNet50_Weights
from torchvision.models.segmentation import deeplabv3_resnet101, DeepLabV3_ResNet101_Weights
from PIL import Image, ImageFilter
import io
import os
import numpy as np
import cv2
import json

class UNet(nn.Module):
    """U-Net for pixel-wise segmentation of diseased areas"""
    def __init__(self, n_channels=3, n_classes=1):
        super(UNet, self).__init__()
        
        # Encoder (downsampling)
        self.enc1 = self.conv_block(n_channels, 64)
        self.enc2 = self.conv_block(64, 128)
        self.enc3 = self.conv_block(128, 256)
        self.enc4 = self.conv_block(256, 512)
        
        # Bottleneck
        self.bottleneck = self.conv_block(512, 1024)
        
        # Decoder (upsampling)
        self.up4 = nn.ConvTranspose2d(1024, 512, kernel_size=2, stride=2)
        self.dec4 = self.conv_block(1024, 512)
        
        self.up3 = nn.ConvTranspose2d(512, 256, kernel_size=2, stride=2)
        self.dec3 = self.conv_block(512, 256)
        
        self.up2 = nn.ConvTranspose2d(256, 128, kernel_size=2, stride=2)
        self.dec2 = self.conv_block(256, 128)
        
        self.up1 = nn.ConvTranspose2d(128, 64, kernel_size=2, stride=2)
        self.dec1 = self.conv_block(128, 64)
        
        # Output layer
        self.out = nn.Conv2d(64, n_classes, kernel_size=1)
        
        self.pool = nn.MaxPool2d(kernel_size=2, stride=2)
        
    def conv_block(self, in_channels, out_channels):
        return nn.Sequential(
            nn.Conv2d(in_channels, out_channels, kernel_size=3, padding=1),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_channels, out_channels, kernel_size=3, padding=1),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True)
        )
    
    def forward(self, x):
        # Encoder
        e1 = self.enc1(x)
        e2 = self.enc2(self.pool(e1))
        e3 = self.enc3(self.pool(e2))
        e4 = self.enc4(self.pool(e3))
        
        # Bottleneck
        b = self.bottleneck(self.pool(e4))
        
        # Decoder with skip connections
        d4 = self.up4(b)
        d4 = torch.cat([d4, e4], dim=1)
        d4 = self.dec4(d4)
        
        d3 = self.up3(d4)
        d3 = torch.cat([d3, e3], dim=1)
        d3 = self.dec3(d3)
        
        d2 = self.up2(d3)
        d2 = torch.cat([d2, e2], dim=1)
        d2 = self.dec2(d2)
        
        d1 = self.up1(d2)
        d1 = torch.cat([d1, e1], dim=1)
        d1 = self.dec1(d1)
        
        out = torch.sigmoid(self.out(d1))
        return out

class SimpleViT(nn.Module):
    """Simplified Vision Transformer for image classification"""
    def __init__(self, image_size=224, patch_size=16, num_classes=2, dim=768, depth=6, heads=12, mlp_dim=3072):
        super(SimpleViT, self).__init__()
        
        assert image_size % patch_size == 0
        num_patches = (image_size // patch_size) ** 2
        patch_dim = 3 * patch_size * patch_size
        
        self.patch_size = patch_size
        self.patch_embedding = nn.Linear(patch_dim, dim)
        self.pos_embedding = nn.Parameter(torch.randn(1, num_patches + 1, dim))
        self.cls_token = nn.Parameter(torch.randn(1, 1, dim))
        
        # Transformer encoder
        encoder_layer = nn.TransformerEncoderLayer(d_model=dim, nhead=heads, dim_feedforward=mlp_dim, batch_first=True)
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=depth)
        
        # Classification head
        self.mlp_head = nn.Sequential(
            nn.LayerNorm(dim),
            nn.Linear(dim, num_classes)
        )
    
    def forward(self, x):
        B, C, H, W = x.shape
        
        # Create patches
        x = x.unfold(2, self.patch_size, self.patch_size).unfold(3, self.patch_size, self.patch_size)
        x = x.contiguous().view(B, C, -1, self.patch_size, self.patch_size)
        x = x.permute(0, 2, 1, 3, 4).contiguous().view(B, -1, C * self.patch_size * self.patch_size)
        
        # Patch embedding
        x = self.patch_embedding(x)
        
        # Add cls token
        cls_tokens = self.cls_token.expand(B, -1, -1)
        x = torch.cat([cls_tokens, x], dim=1)
        
        # Add positional embedding
        x = x + self.pos_embedding
        
        # Transformer
        x = self.transformer(x)
        
        # Classification from cls token
        x = x[:, 0]
        x = self.mlp_head(x)
        return x

class DiseaseDetector:
    def __init__(self, model_path: str = None):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        print(f"Using device: {self.device}")
        
        # Charger les noms de classes (39 maladies)
        class_names_path = "/app/class_names.json"
        self.class_names = ["Unknown"]
        self.num_classes = 39
        
        if os.path.exists(class_names_path):
            try:
                with open(class_names_path, 'r') as f:
                    self.class_names = json.load(f)
                    self.num_classes = len(self.class_names)
                print(f"✓ Loaded {self.num_classes} disease classes")
            except Exception as e:
                print(f"⚠ Could not load class names: {e}")
        
        # Model 1: ResNet50 (CNN) for multi-class disease classification
        print("Loading ResNet50 (CNN) for multi-class disease detection...")
        self.cnn_classifier = resnet50(weights=ResNet50_Weights.IMAGENET1K_V2)
        self.cnn_classifier.fc = nn.Sequential(
            nn.Linear(2048, 512),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(512, self.num_classes)  # 39 classes (maladies + saines)
        )
        self.cnn_classifier.to(self.device)
        self.cnn_classifier.eval()
        
        # Model 2: U-Net for pixel-wise segmentation
        print("Loading U-Net for segmentation...")
        self.unet = UNet(n_channels=3, n_classes=1)
        self.unet.to(self.device)
        self.unet.eval()
        
        # Model 3: Vision Transformer (ViT) for fine-grained classification
        print("Loading Vision Transformer (ViT)...")
        self.vit_classifier = SimpleViT(
            image_size=224,
            patch_size=16,
            num_classes=2,
            dim=384,      # Smaller for efficiency
            depth=6,
            heads=6,
            mlp_dim=1536
        )
        self.vit_classifier.to(self.device)
        self.vit_classifier.eval()
        
        # Load custom weights if provided or from default path
        if not model_path:
            model_path = "/app/disease_multiclass_best.pth"
        
        if model_path and os.path.exists(model_path):
            try:
                checkpoint = torch.load(model_path, map_location=self.device)
                # Charger le modèle multi-classe
                if 'model_state_dict' in checkpoint:
                    self.cnn_classifier.load_state_dict(checkpoint['model_state_dict'])
                    val_acc = checkpoint.get('val_acc', 0)
                    print(f"✓ Loaded trained multi-class CNN (accuracy: {val_acc:.1f}%)")
                elif 'cnn_classifier' in checkpoint:
                    self.cnn_classifier.load_state_dict(checkpoint['cnn_classifier'])
                    print(f"✓ Loaded multi-class CNN classifier")
                
                # U-Net et ViT pour segmentation et analyse complémentaire
                print("⚠ U-Net and ViT using initialized weights (not trained)")
            except Exception as e:
                print(f"⚠ Could not load custom weights ({e}). Using color-based detection.")
        else:
            print(f"⚠ No model found at {model_path}. Using color-based detection only.")
        
        # Transforms
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        
        self.unet_transform = transforms.Compose([
            transforms.Resize((256, 256)),
            transforms.ToTensor()
        ])

    def predict(self, image_bytes: bytes):
        """
        Multi-class disease detection with specific disease identification
        Returns: (mask_bytes, probability_score, disease_name)
        """
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        original_size = image.size
        img_array = np.array(image)
        
        # Prepare inputs
        input_tensor = self.transform(image).unsqueeze(0).to(self.device)
        unet_input = self.unet_transform(image).unsqueeze(0).to(self.device)
        
        # === CLASSIFICATION MULTI-CLASSE ===
        disease_name = "Unknown"
        disease_confidence = 0.0
        top_3_diseases = []
        
        with torch.no_grad():
            # Prédiction CNN multi-classe (39 maladies)
            cnn_logits = self.cnn_classifier(input_tensor)
            cnn_probs = torch.softmax(cnn_logits, dim=1)[0]
            
            # Top 3 prédictions
            top_probs, top_indices = torch.topk(cnn_probs, k=min(3, self.num_classes))
            
            for prob, idx in zip(top_probs, top_indices):
                class_name = self.class_names[idx.item()]
                confidence = prob.item()
                top_3_diseases.append((class_name, confidence))
            
            # Maladie la plus probable
            disease_name = top_3_diseases[0][0]
            disease_confidence = top_3_diseases[0][1]
            
            # Segmentation U-Net
            unet_output = self.unet(unet_input)
            unet_mask = torch.sigmoid(unet_output).squeeze().cpu().numpy()
        
        # === ANALYSE COULEUR (pour validation) ===
        red = img_array[:,:,0].astype(np.float32)
        green = img_array[:,:,1].astype(np.float32)
        blue = img_array[:,:,2].astype(np.float32)
        
        healthy_mask = (green > red + 10) & (green > blue + 10) & (green > 70)
        healthy_ratio = np.sum(healthy_mask) / healthy_mask.size
        
        brown_mask = (red > 100) & (red > green + 20) & (green > 40) & (green < 140) & (blue < 100)
        yellow_mask = (red > 150) & (green > 150) & (blue < 110) & (np.abs(red - green) < 30)
        dark_mask = (red < 50) & (green < 50) & (blue < 50)
        white_spots = (red > 200) & (green > 200) & (blue > 200)
        
        # === DÉCISION FINALE ===
        # Si la plante contient "healthy" dans le nom de maladie, c'est une plante saine
        is_healthy = "healthy" in disease_name.lower()
        
        if is_healthy and healthy_ratio > 0.65:
            # Plante saine confirmée par CNN + couleur
            final_probability = 0.0
            disease_name = disease_name  # Garde le nom complet (e.g., "Tomato___healthy")
            print(f"✓ [Plante Saine] {disease_name} (conf: {disease_confidence:.1%}, vert: {healthy_ratio:.1%})")
        elif is_healthy:
            # CNN dit saine mais couleur suspecte
            final_probability = disease_confidence * 0.3
            print(f"⚠ [Saine avec zones suspectes] {disease_name} (conf: {disease_confidence:.1%})")
        else:
            # Maladie détectée par CNN
            final_probability = disease_confidence
            print(f"✗ [Maladie Détectée] {disease_name} (conf: {disease_confidence:.1%})")
            print(f"   Top 3: {', '.join([f'{n}({p:.0%})' for n, p in top_3_diseases])}")
        
        # Cap final probability
        final_probability = min(final_probability, 0.95)
        final_probability = max(final_probability, 0.0)
        
        # Generate segmentation mask
        # Resize U-Net output to match image size
        unet_mask_resized = cv2.resize(unet_mask, (img_array.shape[1], img_array.shape[0]))
        
        # Combine U-Net mask with color-based masks
        color_mask = np.zeros(img_array.shape[:2], dtype=np.float32)
        color_mask[brown_mask] = 1.0
        color_mask[dark_mask] = 0.85
        color_mask[yellow_mask] = 0.7
        
        # Weighted combination
        combined_mask = 0.6 * unet_mask_resized + 0.4 * color_mask
        combined_mask = np.clip(combined_mask, 0, 1)
        
        # Post-process mask
        kernel = np.ones((5,5), np.uint8)
        mask_uint8 = (combined_mask * 255).astype(np.uint8)
        mask_uint8 = cv2.morphologyEx(mask_uint8, cv2.MORPH_CLOSE, kernel)
        mask_uint8 = cv2.GaussianBlur(mask_uint8, (7, 7), 1.5)
        
        # Create visualization
        mask_colored = cv2.applyColorMap(mask_uint8, cv2.COLORMAP_JET)
        mask_colored = cv2.cvtColor(mask_colored, cv2.COLOR_BGR2RGB)
        
        # Blend with original (70% original, 30% mask)
        blended = cv2.addWeighted(img_array, 0.7, mask_colored, 0.3, 0)
        
        # Resize to original size
        mask_final = cv2.resize(blended, original_size)
        mask_img = Image.fromarray(mask_final.astype(np.uint8))
        
        output_buffer = io.BytesIO()
        mask_img.save(output_buffer, format="PNG")
        
        return output_buffer.getvalue(), float(final_probability), disease_name

# Singleton instance
detector = DiseaseDetector()
