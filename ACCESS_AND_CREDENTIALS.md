# 🔐 AgroTrace-MS - Access & Credentials Guide

> **⚠️ SECURITY WARNING**: The credentials listed below are for **development and testing only**. 
> **Never use these credentials in production environments!**

---

## 📊 Service Endpoints

### 🌐 User-Facing Services

| Service | URL | Description |
|---------|-----|-------------|
| **Dashboard Frontend** | http://localhost:8080 | Main GIS Dashboard (React/Leaflet) |
| **MS1 - Ingestion API** | http://localhost:8001 | Sensor data ingestion (FastAPI) |
| **MS3 - Vision API** | http://localhost:8002 | Plant disease detection (PyTorch) |
| **MS4 - Prévision API** | http://localhost:8003 | Water prediction (Prophet/LSTM) |
| **MS5 - Règles API** | http://localhost:8004 | Agricultural rules engine |
| **MS6 - Reco API** | http://localhost:8005 | AI-powered irrigation recommendations |
| **MS7 - Backend API** | http://localhost:8006/api | Dashboard backend (Express.js) |

### 🔧 Infrastructure Services

| Service | URL | Description |
|---------|-----|-------------|
| **MinIO Console** | http://localhost:9001 | Object storage admin UI |
| **Kafka** | localhost:9092 | Message broker (external access) |
| **TimescaleDB** | localhost:5432 | Time-series database |
| **PostGIS** | localhost:5433 | GIS database |

### 🛠️ Admin Tools (Optional - use `--admin` flag)

| Service | URL | Description |
|---------|-----|-------------|
| **Adminer** | http://localhost:8888 | Database management UI |
| **Kafka UI** | http://localhost:8889 | Kafka topic viewer |

---

## 🔑 Database Credentials

### TimescaleDB (Primary Database)

Used by: MS1, MS2, MS4, MS5, MS6

| Parameter | Value |
|-----------|-------|
| **Host** | `localhost` (external) / `timescaledb` (internal) |
| **Port** | `5432` |
| **Database** | `agrotrace_db` |
| **Username** | `agrotrace_admin` |
| **Password** | `Agr0Tr@ce2024!Secure` |

**Connection String:**
```
postgresql://agrotrace_admin:Agr0Tr@ce2024!Secure@localhost:5432/agrotrace_db
```

### PostGIS (GIS Database)

Used by: MS7 Dashboard

| Parameter | Value |
|-----------|-------|
| **Host** | `localhost` (external) / `postgis` (internal) |
| **Port** | `5433` |
| **Database** | `agrotrace_sig` |
| **Username** | `agrotrace_gis` |
| **Password** | `G1sSecure2024!@#` |

**Connection String:**
```
postgresql://agrotrace_gis:G1sSecure2024!@#@localhost:5433/agrotrace_sig
```

---

## 📦 MinIO (Object Storage)

Used by: MS3 Vision

| Parameter | Value |
|-----------|-------|
| **Endpoint** | `localhost:9000` (API) / `localhost:9001` (Console) |
| **Access Key** | `agrotrace_minio` |
| **Secret Key** | `M1n10Secure2024!Key` |
| **Buckets** | `uav-images`, `vision-results` |

**Console Access:**
1. Open http://localhost:9001
2. Login with: `agrotrace_minio` / `M1n10Secure2024!Key`

---

## 📨 Kafka (Message Broker)

| Parameter | Value |
|-----------|-------|
| **Bootstrap Servers** | `localhost:9092` (external) / `kafka:29092` (internal) |
| **Topic** | `capteur_data` |
| **Consumer Group** | `agrotrace-consumer-group` |

---

## 🤖 LLM Configuration (MS6)

For AI-powered irrigation recommendations:

| Parameter | Value |
|-----------|-------|
| **Provider** | Google Gemini / OpenAI |
| **Model** | `gemini-1.5-flash` (default) |
| **API Key** | `your-api-key-here` *(replace in .env)* |

**Getting an API Key:**
- **Gemini**: https://makersuite.google.com/app/apikey
- **OpenAI**: https://platform.openai.com/api-keys

---

## 🖥️ Adminer Database Access

To access databases via Adminer (http://localhost:8888):

### TimescaleDB Connection
| Field | Value |
|-------|-------|
| System | PostgreSQL |
| Server | `timescaledb` |
| Username | `agrotrace_admin` |
| Password | `Agr0Tr@ce2024!Secure` |
| Database | `agrotrace_db` |

### PostGIS Connection
| Field | Value |
|-------|-------|
| System | PostgreSQL |
| Server | `postgis` |
| Username | `agrotrace_gis` |
| Password | `G1sSecure2024!@#` |
| Database | `agrotrace_sig` |

---

## 📝 Useful Commands

### Docker Compose Commands

```bash
# Start all services
python setup_and_run.py

# Start with admin tools
python setup_and_run.py --admin

# Start with simulator (dev mode)
python setup_and_run.py --dev

# Force rebuild all images
python setup_and_run.py --build

# Check service status
python setup_and_run.py --status

# Stop all services
python setup_and_run.py --stop

# Full cleanup (remove volumes)
python setup_and_run.py --clean
```

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f ms1-ingestion
docker compose logs -f ms3-vision
docker compose logs -f ms7-backend

# Infrastructure
docker compose logs -f kafka
docker compose logs -f timescaledb
```

### Database Commands

```bash
# Connect to TimescaleDB
docker exec -it agrotrace-timescaledb psql -U agrotrace_admin -d agrotrace_db

# Connect to PostGIS
docker exec -it agrotrace-postgis psql -U agrotrace_gis -d agrotrace_sig

# List tables
\dt

# Exit psql
\q
```

### Kafka Commands

```bash
# List topics
docker exec -it agrotrace-kafka kafka-topics --bootstrap-server localhost:9092 --list

# Describe topic
docker exec -it agrotrace-kafka kafka-topics --bootstrap-server localhost:9092 --describe --topic capteur_data

# Read messages from beginning
docker exec -it agrotrace-kafka kafka-console-consumer --bootstrap-server localhost:9092 --topic capteur_data --from-beginning
```

### MinIO Commands

```bash
# List buckets
docker exec -it agrotrace-minio mc ls local

# List files in bucket
docker exec -it agrotrace-minio mc ls local/uav-images
```

---

## 🧪 API Testing Examples

### MS1 - Ingestion API

```bash
# Health check
curl http://localhost:8001/health

# Send sensor data
curl -X POST http://localhost:8001/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "capteur_id": "TEMP001",
    "type_capteur": "temperature",
    "valeur": 25.5,
    "unite": "°C",
    "parcelle_id": "P001",
    "timestamp": "2024-01-15T10:30:00Z"
  }'
```

### MS3 - Vision API

```bash
# Health check
curl http://localhost:8002/health

# Analyze image (multipart form)
curl -X POST http://localhost:8002/api/v1/analyze \
  -F "image=@plant_image.jpg"
```

### MS4 - Prévision API

```bash
# Health check
curl http://localhost:8003/health

# Get water prediction
curl "http://localhost:8003/api/v1/forecast?parcelle_id=P001&horizon_days=7"
```

### MS5 - Règles API

```bash
# Health check
curl http://localhost:8004/health

# Evaluate rules
curl -X POST http://localhost:8004/api/v1/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "soil_moisture": 25.0,
    "temperature": 32.0,
    "crop_type": "wheat"
  }'
```

### MS6 - Reco API

```bash
# Health check
curl http://localhost:8005/health

# Get irrigation recommendation
curl -X POST http://localhost:8005/api/v1/irrigation/calculer \
  -H "Content-Type: application/json" \
  -d '{
    "parcelle_id": "P001",
    "culture": "tomate",
    "surface_ha": 2.5,
    "humidite_sol": 30,
    "temperature": 28
  }'
```

### MS7 - Dashboard API

```bash
# Health check
curl http://localhost:8006/api/health

# Get parcelles
curl http://localhost:8006/api/parcelles

# Get stats
curl http://localhost:8006/api/stats
```

---

## 🔒 Security Notes

1. **Change all passwords** before deploying to production
2. **Use environment variables** - never hardcode credentials
3. **Enable SSL/TLS** for all services in production
4. **Restrict network access** using firewall rules
5. **Rotate credentials** regularly
6. **Use secrets management** (HashiCorp Vault, AWS Secrets Manager, etc.)

---

## 📞 Troubleshooting

### Services not starting?
```bash
# Check Docker status
docker ps -a

# View service logs
docker compose logs [service-name]

# Restart a specific service
docker compose restart [service-name]
```

### Database connection issues?
```bash
# Verify database is running
docker exec -it agrotrace-timescaledb pg_isready

# Check network connectivity
docker network inspect agro-net
```

### Kafka issues?
```bash
# Check Kafka broker status
docker exec -it agrotrace-kafka kafka-broker-api-versions --bootstrap-server localhost:9092

# Verify Zookeeper connection
docker exec -it agrotrace-zookeeper zkCli.sh -server localhost:2181
```

---

*Last updated: December 2024*
*AgroTrace-MS v1.0.0*
