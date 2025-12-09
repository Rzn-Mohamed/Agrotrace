#!/bin/bash
# ==============================================================================
# AgroTrace - Run Tests for Service
# ==============================================================================
# Usage: ./run-tests.sh <service-path>
# Example: ./run-tests.sh ms1-ingestion-capteurs
# ==============================================================================

set -e

SERVICE_PATH=$1

if [ -z "$SERVICE_PATH" ]; then
    echo "❌ Usage: $0 <service-path>"
    exit 1
fi

echo "🧪 Running tests for ${SERVICE_PATH}"

cd "$SERVICE_PATH"

# Python tests
if [ -f "requirements.txt" ]; then
    echo "🐍 Running Python tests..."
    
    # Create virtual environment
    python3 -m venv .venv || true
    source .venv/bin/activate
    
    # Install dependencies
    pip install -q -r requirements.txt
    pip install -q pytest pytest-cov pytest-html
    
    # Run tests
    if [ -d "tests" ]; then
        pytest tests/ \
            --junitxml=test-results/junit.xml \
            --cov=. \
            --cov-report=xml \
            --cov-report=html \
            --html=test-results/report.html \
            --self-contained-html \
            -v
    else
        echo "⚠️  No tests directory found"
    fi
    
    deactivate
fi

# Node.js tests
if [ -f "package.json" ]; then
    echo "📜 Running JavaScript/TypeScript tests..."
    
    npm install
    npm test || true
fi

echo "✅ Tests completed for ${SERVICE_PATH}"
