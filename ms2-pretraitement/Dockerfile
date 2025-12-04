# ==============================================================================
# Dockerfile - MS2 Pretraitement ETL
# AgroTrace-MS - Data Cleaning & Transformation Worker
# ==============================================================================
# check=skip=SecretsUsedInArgOrEnv
FROM python:3.11-slim

WORKDIR /app

# Environment variables (values will come from docker-compose)
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY ./pipeline ./pipeline

# Note: DB credentials are passed via environment variables in docker-compose
# Do NOT hardcode credentials here

CMD ["python", "-m", "pipeline.orchestrator"]
