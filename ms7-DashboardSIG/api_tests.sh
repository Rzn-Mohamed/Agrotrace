# ============================================================================
# Collection de tests API pour DashboardSIG
# Utilisation: source ce fichier puis lancer les fonctions test_*
# Ou utiliser avec un client REST comme Postman/Insomnia
# ============================================================================

# Configuration
API_URL="http://localhost:3001/api"

# ============================================================================
# TESTS HEALTH CHECK
# ============================================================================

# Test: Santé de l'API
test_health() {
    echo "🔍 Test: Health Check"
    curl -X GET "${API_URL}/health" \
        -H "Content-Type: application/json" \
        | jq '.'
    echo ""
}

# ============================================================================
# TESTS PARCELLES
# ============================================================================

# Test: Récupérer toutes les parcelles (GeoJSON)
test_get_parcelles() {
    echo "🗺️  Test: GET /parcelles (GeoJSON)"
    curl -X GET "${API_URL}/parcelles" \
        -H "Content-Type: application/json" \
        | jq '.'
    echo ""
}

# Test: Récupérer une parcelle spécifique
test_get_parcelle_by_id() {
    local id=${1:-1}
    echo "📍 Test: GET /parcelles/${id}"
    curl -X GET "${API_URL}/parcelles/${id}" \
        -H "Content-Type: application/json" \
        | jq '.'
    echo ""
}

# ============================================================================
# TESTS ÉTAT HYDRIQUE
# ============================================================================

# Test: État hydrique global (Mock IoT/Drone)
test_etat_hydrique() {
    echo "💧 Test: GET /etat-hydrique"
    curl -X GET "${API_URL}/etat-hydrique" \
        -H "Content-Type: application/json" \
        | jq '.'
    echo ""
}

# ============================================================================
# TESTS ALERTES
# ============================================================================

# Test: Récupérer toutes les alertes maladies
test_get_alertes() {
    echo "⚠️  Test: GET /alertes"
    curl -X GET "${API_URL}/alertes" \
        -H "Content-Type: application/json" \
        | jq '.'
    echo ""
}

# ============================================================================
# TESTS RECOMMANDATIONS
# ============================================================================

# Test: Récupérer toutes les recommandations
test_get_recommandations() {
    echo "💡 Test: GET /recommandations"
    curl -X GET "${API_URL}/recommandations" \
        -H "Content-Type: application/json" \
        | jq '.'
    echo ""
}

# Test: Appliquer une recommandation
test_apply_recommandation() {
    local id=${1:-1}
    echo "✅ Test: POST /recommandations/${id}/appliquer"
    curl -X POST "${API_URL}/recommandations/${id}/appliquer" \
        -H "Content-Type: application/json" \
        | jq '.'
    echo ""
}

# ============================================================================
# TESTS STATISTIQUES
# ============================================================================

# Test: Statistiques globales
test_get_stats() {
    echo "📊 Test: GET /stats"
    curl -X GET "${API_URL}/stats" \
        -H "Content-Type: application/json" \
        | jq '.'
    echo ""
}

# ============================================================================
# SUITE DE TESTS COMPLÈTE
# ============================================================================

run_all_tests() {
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║         🧪 Suite de Tests API - DashboardSIG 🧪          ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    
    test_health
    sleep 1
    
    test_get_parcelles
    sleep 1
    
    test_get_parcelle_by_id 1
    sleep 1
    
    test_etat_hydrique
    sleep 1
    
    test_get_alertes
    sleep 1
    
    test_get_recommandations
    sleep 1
    
    test_get_stats
    sleep 1
    
    echo "✅ Tous les tests terminés!"
}

# ============================================================================
# TESTS POSTMAN/INSOMNIA (Format JSON)
# ============================================================================

# Export au format Postman Collection v2.1
generate_postman_collection() {
    cat > postman_collection.json << 'EOF'
{
  "info": {
    "name": "DashboardSIG API",
    "description": "Collection de tests pour l'API DashboardSIG - AgroTrace-MS",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{base_url}}/health",
          "host": ["{{base_url}}"],
          "path": ["health"]
        }
      }
    },
    {
      "name": "Get All Parcelles (GeoJSON)",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{base_url}}/parcelles",
          "host": ["{{base_url}}"],
          "path": ["parcelles"]
        }
      }
    },
    {
      "name": "Get Parcelle By ID",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{base_url}}/parcelles/1",
          "host": ["{{base_url}}"],
          "path": ["parcelles", "1"]
        }
      }
    },
    {
      "name": "Get État Hydrique",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{base_url}}/etat-hydrique",
          "host": ["{{base_url}}"],
          "path": ["etat-hydrique"]
        }
      }
    },
    {
      "name": "Get Alertes Maladies",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{base_url}}/alertes",
          "host": ["{{base_url}}"],
          "path": ["alertes"]
        }
      }
    },
    {
      "name": "Get Recommandations",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{base_url}}/recommandations",
          "host": ["{{base_url}}"],
          "path": ["recommandations"]
        }
      }
    },
    {
      "name": "Apply Recommandation",
      "request": {
        "method": "POST",
        "header": [],
        "url": {
          "raw": "{{base_url}}/recommandations/1/appliquer",
          "host": ["{{base_url}}"],
          "path": ["recommandations", "1", "appliquer"]
        }
      }
    },
    {
      "name": "Get Statistics",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{base_url}}/stats",
          "host": ["{{base_url}}"],
          "path": ["stats"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3001/api",
      "type": "string"
    }
  ]
}
EOF
    echo "✅ Collection Postman générée: postman_collection.json"
}

# ============================================================================
# AIDE
# ============================================================================

show_test_help() {
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║         📚 Aide Tests API - DashboardSIG 📚              ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Usage:"
    echo "  source api_tests.sh"
    echo "  <nom_fonction>"
    echo ""
    echo "Fonctions disponibles:"
    echo "  test_health                    - Test health check"
    echo "  test_get_parcelles             - Récupère toutes les parcelles"
    echo "  test_get_parcelle_by_id [ID]   - Récupère une parcelle spécifique"
    echo "  test_etat_hydrique             - État hydrique (Mock IoT)"
    echo "  test_get_alertes               - Liste des alertes"
    echo "  test_get_recommandations       - Liste des recommandations"
    echo "  test_apply_recommandation [ID] - Applique une recommandation"
    echo "  test_get_stats                 - Statistiques globales"
    echo ""
    echo "  run_all_tests                  - Lance tous les tests"
    echo "  generate_postman_collection    - Génère collection Postman"
    echo ""
    echo "Exemples:"
    echo "  test_get_parcelle_by_id 2"
    echo "  test_apply_recommandation 1"
    echo "  run_all_tests"
}

# Afficher l'aide si le script est exécuté directement
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    show_test_help
fi
