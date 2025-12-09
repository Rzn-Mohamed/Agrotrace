#!/bin/bash
# ==============================================================================
# AgroTrace - Health Check Script
# ==============================================================================
# Usage: ./health-check.sh <service-name> <port>
# Example: ./health-check.sh ms1-ingestion 8001
# ==============================================================================

set -e

SERVICE_NAME=$1
PORT=$2
MAX_RETRIES=${3:-30}
RETRY_INTERVAL=${4:-5}

if [ -z "$SERVICE_NAME" ] || [ -z "$PORT" ]; then
    echo "❌ Usage: $0 <service-name> <port> [max-retries] [retry-interval]"
    exit 1
fi

echo "🔍 Health checking ${SERVICE_NAME} on port ${PORT}"

for i in $(seq 1 $MAX_RETRIES); do
    echo "Attempt $i/$MAX_RETRIES..."
    
    if curl -f -s http://localhost:${PORT}/health > /dev/null 2>&1; then
        echo "✅ ${SERVICE_NAME} is healthy!"
        exit 0
    fi
    
    if [ $i -lt $MAX_RETRIES ]; then
        sleep $RETRY_INTERVAL
    fi
done

echo "❌ ${SERVICE_NAME} health check failed after ${MAX_RETRIES} attempts"
exit 1
