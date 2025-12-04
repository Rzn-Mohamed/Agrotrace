"""
Script de test pour l'endpoint d'Intelligence Hybride
Teste le nouvel endpoint /recommandation-ia avec des données réalistes
"""
import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
ENDPOINT = f"{BASE_URL}/irrigation/recommandation-ia"

# Données de test
test_cases = [
    {
        "name": "Tomate en floraison - stress élevé",
        "data": {
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
    },
    {
        "name": "Blé en maturation - conditions normales",
        "data": {
            "zone_id": 2,
            "culture_type": "Ble",
            "prediction": {
                "stress_index": 0.45,
                "temp_max_demain": 26.0,
                "probabilite_pluie": 30.0,
                "evapotranspiration_et0": 4.2
            },
            "regles": {
                "priorite": "NORMALE",
                "stade_culture": "Maturation",
                "contrainte_hydrique": "Aucune"
            }
        }
    },
    {
        "name": "Maïs - risque de pluie élevé",
        "data": {
            "zone_id": 3,
            "culture_type": "Mais",
            "prediction": {
                "stress_index": 0.60,
                "temp_max_demain": 28.0,
                "probabilite_pluie": 75.0,
                "evapotranspiration_et0": 5.5
            },
            "regles": {
                "priorite": "BASSE",
                "stade_culture": "Croissance",
                "contrainte_hydrique": "Éviter irrigation si pluie > 70%"
            }
        }
    },
    {
        "name": "Tomate - urgence critique",
        "data": {
            "zone_id": 4,
            "culture_type": "Tomate",
            "prediction": {
                "stress_index": 0.95,
                "temp_max_demain": 38.0,
                "probabilite_pluie": 5.0,
                "evapotranspiration_et0": 8.5
            },
            "regles": {
                "priorite": "CRITIQUE",
                "stade_culture": "Fructification",
                "contrainte_hydrique": "Irrigation immédiate autorisée"
            }
        }
    }
]


def test_endpoint(test_case):
    """Teste l'endpoint avec un cas de test donné"""
    print(f"\n{'='*80}")
    print(f"TEST: {test_case['name']}")
    print(f"{'='*80}")
    
    try:
        # Envoi de la requête
        print("\n📤 Envoi de la requête...")
        response = requests.post(
            ENDPOINT,
            json=test_case['data'],
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        # Vérification du statut
        print(f"📊 Statut HTTP: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            
            # Affichage des résultats
            print("\n✅ RÉSULTAT:")
            print(f"  • Recommendation ID: {result['recommendation_id']}")
            print(f"  • Zone: {result['zone_id']}")
            print(f"  • Volume: {result['volume_eau_m3']} m³")
            print(f"  • Durée: {result['duree_minutes']} minutes")
            print(f"  • Horaire: {result['horaire_debut']}")
            print(f"  • Status: {result['status']}")
            print(f"  • Généré par: {result['genere_par']}")
            print(f"  • Score confiance: {result['score_confiance']}/100")
            
            print("\n🧠 ANALYSE CONTEXTUELLE:")
            print(f"  {result['analyse_contextuelle']}")
            
            print("\n🌱 JUSTIFICATION AGRONOMIQUE:")
            print(f"  {result['justification_agronomique']}")
            
            print("\n💡 CONSEILS ADDITIONNELS:")
            for i, conseil in enumerate(result['conseils_additionnels'], 1):
                print(f"  {i}. {conseil}")
            
            return True
        else:
            print(f"\n❌ ERREUR: {response.status_code}")
            print(f"Message: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("\n❌ ERREUR: Impossible de se connecter au serveur")
        print("Assurez-vous que le serveur FastAPI est lancé sur http://localhost:8000")
        return False
    except requests.exceptions.Timeout:
        print("\n❌ ERREUR: Timeout de la requête (>60s)")
        return False
    except Exception as e:
        print(f"\n❌ ERREUR INATTENDUE: {e}")
        return False


def test_comparaison_endpoints():
    """Compare les résultats de l'endpoint standard vs IA"""
    print(f"\n{'='*80}")
    print("COMPARAISON: Endpoint standard vs Intelligence Hybride")
    print(f"{'='*80}")
    
    test_data = test_cases[0]['data']
    
    # Test endpoint standard
    print("\n1️⃣ ENDPOINT STANDARD (/calculer):")
    try:
        response_standard = requests.post(
            f"{BASE_URL}/irrigation/calculer",
            json=test_data,
            timeout=10
        )
        if response_standard.status_code == 200:
            result_std = response_standard.json()
            print(f"  ✓ Volume: {result_std['volume_eau_m3']} m³")
            print(f"  ✓ Durée: {result_std['duree_minutes']} min")
            print(f"  ✓ Instruction: {result_std['instruction_textuelle']}")
        else:
            print(f"  ✗ Erreur: {response_standard.status_code}")
    except Exception as e:
        print(f"  ✗ Erreur: {e}")
    
    # Test endpoint IA
    print("\n2️⃣ ENDPOINT INTELLIGENCE HYBRIDE (/recommandation-ia):")
    try:
        response_ia = requests.post(
            ENDPOINT,
            json=test_data,
            timeout=60
        )
        if response_ia.status_code == 200:
            result_ia = response_ia.json()
            print(f"  ✓ Volume: {result_ia['volume_eau_m3']} m³")
            print(f"  ✓ Durée: {result_ia['duree_minutes']} min")
            print(f"  ✓ Analyse IA: {result_ia['analyse_contextuelle'][:100]}...")
            print(f"  ✓ Score confiance: {result_ia['score_confiance']}/100")
            print(f"  ✓ Conseils: {len(result_ia['conseils_additionnels'])} recommandations")
        else:
            print(f"  ✗ Erreur: {response_ia.status_code}")
    except Exception as e:
        print(f"  ✗ Erreur: {e}")


def main():
    """Fonction principale"""
    print("""
╔═══════════════════════════════════════════════════════════════════════════╗
║          TEST - INTELLIGENCE HYBRIDE - RecoIrrigation                      ║
║                     Endpoint: /recommandation-ia                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
    """)
    
    print("⚙️  Configuration:")
    print(f"   • Base URL: {BASE_URL}")
    print(f"   • Endpoint: {ENDPOINT}")
    print(f"   • Nombre de tests: {len(test_cases)}")
    
    # Test de connexion
    print("\n🔌 Test de connexion au serveur...")
    try:
        response = requests.get(f"{BASE_URL}/docs", timeout=5)
        if response.status_code == 200:
            print("   ✓ Serveur accessible")
        else:
            print("   ⚠ Serveur répond mais status inattendu")
    except:
        print("   ✗ Serveur inaccessible - Lancez le serveur avec: uvicorn app.main:app --reload")
        return
    
    # Exécution des tests
    results = []
    for test_case in test_cases:
        success = test_endpoint(test_case)
        results.append((test_case['name'], success))
    
    # Comparaison des endpoints
    test_comparaison_endpoints()
    
    # Résumé
    print(f"\n{'='*80}")
    print("RÉSUMÉ DES TESTS")
    print(f"{'='*80}")
    success_count = sum(1 for _, success in results if success)
    total = len(results)
    
    for name, success in results:
        status = "✅" if success else "❌"
        print(f"{status} {name}")
    
    print(f"\n📊 Résultats: {success_count}/{total} tests réussis")
    
    if success_count == total:
        print("\n🎉 Tous les tests sont passés avec succès!")
    else:
        print(f"\n⚠️  {total - success_count} test(s) ont échoué")


if __name__ == "__main__":
    main()
