import httpx
import json

# Test 1: Liste des modèles disponibles
api_key = 'AIzaSyBMf05_6F3iO_5nHoZxuuKERrqslqw1XT8'
list_url = f'https://generativelanguage.googleapis.com/v1beta/models?key={api_key}'

print("=" * 80)
print("LISTE DES MODÈLES GEMINI DISPONIBLES:")
print("=" * 80)

response = httpx.get(list_url, timeout=10)
if response.status_code == 200:
    models = response.json()
    for model in models.get('models', []):
        if 'generateContent' in model.get('supportedGenerationMethods', []):
            print(f"✅ {model['name']}")
else:
    print("Erreur:", response.status_code)
    print(response.text[:500])

