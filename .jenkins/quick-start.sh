#!/bin/bash
# ==============================================================================
# Quick Start Jenkins with Docker
# ==============================================================================
# This script sets up Jenkins in Docker with all necessary configurations
# for testing the AgroTrace pipeline locally
# ==============================================================================

set -e

echo "🚀 Starting Jenkins Quick Start Setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check if Docker is running
echo ""
echo "📋 Step 1: Checking Docker..."
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker is running${NC}"

# Step 2: Create Jenkins home directory
echo ""
echo "📋 Step 2: Creating Jenkins home directory..."
JENKINS_HOME="$HOME/jenkins_home"
mkdir -p "$JENKINS_HOME"
echo -e "${GREEN}✅ Jenkins home: $JENKINS_HOME${NC}"

# Step 3: Start local Docker registry
echo ""
echo "📋 Step 3: Starting local Docker registry..."
if docker ps -a | grep -q "registry"; then
    echo "Registry container exists. Removing..."
    docker rm -f registry || true
fi

docker run -d \
    -p 5000:5000 \
    --name registry \
    --restart=always \
    registry:2

sleep 3
if curl -s http://localhost:5000/v2/_catalog > /dev/null; then
    echo -e "${GREEN}✅ Docker registry running on localhost:5000${NC}"
else
    echo -e "${RED}❌ Registry failed to start${NC}"
    exit 1
fi

# Step 4: Start Jenkins container
echo ""
echo "📋 Step 4: Starting Jenkins container..."
if docker ps -a | grep -q "jenkins-agrotrace"; then
    echo "Jenkins container exists. Removing..."
    docker rm -f jenkins-agrotrace || true
fi

docker run -d \
    --name jenkins-agrotrace \
    -p 8080:8080 \
    -p 50000:50000 \
    -v "$JENKINS_HOME:/var/jenkins_home" \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v "$PWD:/workspace" \
    --user root \
    jenkins/jenkins:lts

echo -e "${YELLOW}⏳ Waiting for Jenkins to start (this takes ~60 seconds)...${NC}"
sleep 60

# Step 5: Fix Docker socket permissions
echo ""
echo "📋 Step 5: Configuring Docker access..."
docker exec -u root jenkins-agrotrace chmod 666 /var/run/docker.sock
docker exec jenkins-agrotrace docker ps > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Docker access configured${NC}"
else
    echo -e "${YELLOW}⚠️  Docker access may need manual configuration${NC}"
fi

# Step 6: Get initial admin password
echo ""
echo "📋 Step 6: Getting Jenkins admin password..."
ADMIN_PASSWORD=$(docker exec jenkins-agrotrace cat /var/jenkins_home/secrets/initialAdminPassword 2>/dev/null || echo "")

if [ -z "$ADMIN_PASSWORD" ]; then
    echo -e "${YELLOW}⏳ Jenkins still initializing... waiting 30 more seconds...${NC}"
    sleep 30
    ADMIN_PASSWORD=$(docker exec jenkins-agrotrace cat /var/jenkins_home/secrets/initialAdminPassword)
fi

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Jenkins is ready!${NC}"
echo "=========================================="
echo ""
echo "📍 Jenkins URL: http://localhost:8080"
echo "🔑 Admin Password: $ADMIN_PASSWORD"
echo "📦 Docker Registry: localhost:5000"
echo ""
echo "📋 Next Steps:"
echo "1. Open http://localhost:8080 in your browser"
echo "2. Enter the admin password above"
echo "3. Click 'Install suggested plugins'"
echo "4. Create your admin user"
echo "5. Follow the SETUP_GUIDE.md for pipeline configuration"
echo ""
echo -e "${YELLOW}Tip: Keep this terminal open to see the admin password${NC}"
echo ""

# Optional: Open browser automatically (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    read -p "Open Jenkins in browser now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open http://localhost:8080
    fi
fi

echo ""
echo "🛠️  Useful Commands:"
echo "  View Jenkins logs: docker logs -f jenkins-agrotrace"
echo "  Stop Jenkins:      docker stop jenkins-agrotrace"
echo "  Start Jenkins:     docker start jenkins-agrotrace"
echo "  Remove Jenkins:    docker rm -f jenkins-agrotrace"
echo "  Stop Registry:     docker stop registry"
echo ""
