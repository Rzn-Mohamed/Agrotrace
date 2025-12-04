#!/bin/bash

# ============================================================================
# Script de démarrage pour DashboardSIG - AgroTrace-MS
# ============================================================================
# Usage: ./start.sh [dev|prod|stop|clean]
# ============================================================================

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions utilitaires
print_header() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║         🌾 DashboardSIG - AgroTrace-MS 🌾                ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Vérification des prérequis
check_requirements() {
    print_info "Vérification des prérequis..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker n'est pas installé"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose n'est pas installé"
        exit 1
    fi
    
    print_success "Prérequis vérifiés"
}

# Création des fichiers .env s'ils n'existent pas
setup_env_files() {
    print_info "Configuration des fichiers d'environnement..."
    
    if [ ! -f backend/.env ]; then
        cp backend/.env.example backend/.env
        print_success "Fichier backend/.env créé"
    fi
    
    if [ ! -f frontend/.env ]; then
        cp frontend/.env.example frontend/.env
        print_success "Fichier frontend/.env créé"
    fi
}

# Démarrage en mode développement
start_dev() {
    print_header
    check_requirements
    setup_env_files
    
    print_info "Démarrage en mode DÉVELOPPEMENT..."
    docker-compose up --build
}

# Démarrage en mode production
start_prod() {
    print_header
    check_requirements
    setup_env_files
    
    print_info "Démarrage en mode PRODUCTION..."
    docker-compose up -d --build
    
    echo ""
    print_success "Services démarrés avec succès!"
    echo ""
    echo "🌐 Frontend:  http://localhost:5173"
    echo "📡 Backend:   http://localhost:3001/api"
    echo "🗄️  PostGIS:   localhost:5432"
    echo ""
    print_info "Pour voir les logs: docker-compose logs -f"
    print_info "Pour arrêter: ./start.sh stop"
}

# Arrêt des services
stop_services() {
    print_header
    print_info "Arrêt des services..."
    docker-compose down
    print_success "Services arrêtés"
}

# Nettoyage complet (avec suppression des volumes)
clean_all() {
    print_header
    print_error "⚠️  ATTENTION: Cette action va supprimer TOUTES les données (y compris la base de données)!"
    read -p "Êtes-vous sûr? (oui/non) " -n 3 -r
    echo
    if [[ $REPLY =~ ^[Oo][Uu][Ii]$ ]]; then
        print_info "Nettoyage en cours..."
        docker-compose down -v --remove-orphans
        docker system prune -f
        print_success "Nettoyage terminé"
    else
        print_info "Nettoyage annulé"
    fi
}

# Affichage des logs
show_logs() {
    print_header
    print_info "Affichage des logs (Ctrl+C pour quitter)..."
    docker-compose logs -f
}

# Affichage de l'aide
show_help() {
    print_header
    echo "Usage: ./start.sh [COMMAND]"
    echo ""
    echo "Commandes disponibles:"
    echo "  dev      - Démarre en mode développement (logs visibles)"
    echo "  prod     - Démarre en mode production (arrière-plan)"
    echo "  stop     - Arrête tous les services"
    echo "  clean    - Arrête et supprime tous les conteneurs/volumes"
    echo "  logs     - Affiche les logs en temps réel"
    echo "  help     - Affiche cette aide"
    echo ""
    echo "Exemples:"
    echo "  ./start.sh dev"
    echo "  ./start.sh prod"
    echo "  ./start.sh stop"
}

# Point d'entrée principal
case "${1:-help}" in
    dev)
        start_dev
        ;;
    prod)
        start_prod
        ;;
    stop)
        stop_services
        ;;
    clean)
        clean_all
        ;;
    logs)
        show_logs
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Commande inconnue: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
