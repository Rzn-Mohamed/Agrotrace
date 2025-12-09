#!/bin/bash
# ==============================================================================
# AgroTrace - Build Individual Service Script
# ==============================================================================
# Usage: ./build-service.sh <service-name> <version>
# Example: ./build-service.sh ms1-ingestion 1.0.0
# ==============================================================================

set -e

SERVICE_NAME=$1
VERSION=$2
REGISTRY=${DOCKER_REGISTRY:-"localhost:5000"}

if [ -z "$SERVICE_NAME" ] || [ -z "$VERSION" ]; then
    echo "❌ Usage: $0 <service-name> <version>"
    exit 1
fi

echo "🔨 Building ${SERVICE_NAME}:${VERSION}"

# Map service name to directory
case $SERVICE_NAME in
    ms1-ingestion)
        SERVICE_DIR="ms1-ingestion-capteurs"
        ;;
    ms2-etl)
        SERVICE_DIR="ms2-pretraitement"
        ;;
    ms3-vision)
        SERVICE_DIR="ms3-visionPlante-main"
        ;;
    ms4-prevision)
        SERVICE_DIR="ms4-prevision-eau"
        ;;
    ms5-regles)
        SERVICE_DIR="ms5-regles-agro"
        ;;
    ms6-reco)
        SERVICE_DIR="ms6-RecoIrrigation"
        ;;
    ms7-backend)
        SERVICE_DIR="ms7-DashboardSIG/backend"
        ;;
    ms7-frontend)
        SERVICE_DIR="ms7-DashboardSIG/frontend"
        ;;
    *)
        echo "❌ Unknown service: $SERVICE_NAME"
        exit 1
        ;;
esac

# Check if directory exists
if [ ! -d "$SERVICE_DIR" ]; then
    echo "❌ Service directory not found: $SERVICE_DIR"
    exit 1
fi

# Build Docker image
IMAGE_TAG="${REGISTRY}/agrotrace-${SERVICE_NAME}:${VERSION}"

cd "$SERVICE_DIR"

docker build \
    --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
    --build-arg VERSION=${VERSION} \
    --build-arg VCS_REF=$(git rev-parse --short HEAD) \
    --label "com.agrotrace.service=${SERVICE_NAME}" \
    --label "com.agrotrace.version=${VERSION}" \
    -t ${IMAGE_TAG} \
    -f Dockerfile \
    .

echo "✅ Built ${IMAGE_TAG}"

# Tag as latest if requested
if [ "$TAG_LATEST" = "true" ]; then
    docker tag ${IMAGE_TAG} ${REGISTRY}/agrotrace-${SERVICE_NAME}:latest
    echo "✅ Tagged as latest"
fi
