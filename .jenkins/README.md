# 🚀 Jenkins CI/CD Pipeline for AgroTrace

Complete Jenkins pipeline configuration for the AgroTrace microservices platform with intelligent change detection and parallel execution.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Pipeline Features](#pipeline-features)
- [Configuration](#configuration)
- [Pipeline Stages](#pipeline-stages)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

This pipeline implements a **monorepo multi-service strategy** that:

✅ **Detects changed microservices** automatically  
✅ **Builds only what changed** (saves time & resources)  
✅ **Handles dependencies** between services  
✅ **Runs tests in parallel** for efficiency  
✅ **Deploys intelligently** based on branch  
✅ **Supports rollback** on deployment failures  

### Why Single Pipeline?

- **Shared Infrastructure**: All services use the same Kafka, TimescaleDB, MinIO
- **Orchestrated Deployment**: Respects service dependencies (e.g., ms4 depends on ms5)
- **Simplified Management**: One Jenkinsfile to maintain
- **Better Resource Usage**: Build only what changed
- **Atomic Releases**: Deploy related changes together

---

## 🏗️ Architecture

```
Jenkinsfile (root)
├── Stage 1: Detect Changes
│   ├── Compare with target branch
│   ├── Identify changed services
│   └── Add dependent services
├── Stage 2: Code Quality
│   ├── Python linting (parallel)
│   ├── JS/TS linting (parallel)
│   └── Security scan (parallel)
├── Stage 3: Tests
│   ├── Unit tests (parallel per service)
│   └── Integration tests
├── Stage 4: Build Docker Images
│   └── Build in parallel for all changed services
├── Stage 5: Push to Registry
│   └── Tag with version & latest
├── Stage 6: Deploy
│   └── Rolling deployment with health checks
└── Stage 7: Smoke Tests
    └── Verify all endpoints
```

### Microservices Detected

| Service | Path | Port | Dependencies |
|---------|------|------|--------------|
| ms1-ingestion | ms1-ingestion-capteurs | 8001 | kafka, timescaledb |
| ms2-etl | ms2-pretraitement | - | timescaledb |
| ms3-vision | ms3-visionPlante-main | 8002 | minio |
| ms4-prevision | ms4-prevision-eau | 8003 | timescaledb, ms5-regles |
| ms5-regles | ms5-regles-agro | 8004 | timescaledb |
| ms6-reco | ms6-RecoIrrigation | 8005 | timescaledb |
| ms7-backend | ms7-DashboardSIG/backend | 8006 | timescaledb |
| ms7-frontend | ms7-DashboardSIG/frontend | 8080 | ms7-backend |

---

## 📦 Prerequisites

### Jenkins Server Requirements

1. **Jenkins 2.x** with recommended plugins:
   - Pipeline
   - Docker Pipeline
   - Git
   - Credentials Binding
   - Blue Ocean (optional, for better UI)

2. **Docker** installed on Jenkins agent(s)

3. **Required Jenkins Credentials** (configure in Jenkins → Credentials):

   | ID | Type | Description |
   |---|---|---|
   | `docker-registry-credentials` | Username/Password | Docker registry access |
   | `docker-registry-url` | Secret Text | Registry URL (e.g., `registry.example.com`) |
   | `timescale-user` | Secret Text | TimescaleDB username |
   | `timescale-password` | Secret Text | TimescaleDB password |
   | `minio-root-user` | Secret Text | MinIO username |
   | `minio-root-password` | Secret Text | MinIO password |

4. **Jenkins Agent** with:
   - 4+ CPU cores (for parallel builds)
   - 8+ GB RAM
   - 50+ GB disk space

---

## 🚀 Quick Start

### Step 1: Configure Jenkins Credentials

Navigate to **Jenkins → Manage Jenkins → Credentials** and add all required credentials listed above.

### Step 2: Create New Pipeline Job

1. **New Item** → **Pipeline** → Name: `AgroTrace-Pipeline`
2. Under **Pipeline** section:
   - Definition: **Pipeline script from SCM**
   - SCM: **Git**
   - Repository URL: `https://github.com/Rzn-Mohamed/Agrotrace.git`
   - Branch: `*/main`
   - Script Path: `Jenkinsfile`
3. **Save**

### Step 3: Configure Environment Variables

Edit `.jenkins/jenkins.env` with your actual values:

```bash
# Docker Registry
DOCKER_REGISTRY=your-registry.example.com

# Notification Settings
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
NOTIFICATION_EMAIL=devops@agrotrace.com
```

### Step 4: Run Your First Build

Click **Build Now** and watch the magic! 🎉

---

## 🎨 Pipeline Features

### 1. **Intelligent Change Detection**

The pipeline automatically detects which services changed:

- **Pull Requests**: Compares with target branch
- **Main Branch**: Compares with previous commit (HEAD~1)
- **Feature Branches**: Compares with origin/main

Example output:
```
✅ Changed services: ms1-ingestion, ms4-prevision
📋 Services to build (with dependencies): ms1-ingestion, ms4-prevision, ms5-regles
```

### 2. **Dependency Management**

If `ms5-regles` changes, `ms4-prevision` automatically rebuilds (since it depends on ms5).

```groovy
[name: 'ms4-prevision', deps: ['timescaledb', 'ms5-regles']]
```

### 3. **Parallel Execution**

- Linting runs in parallel (Python + JavaScript)
- Tests run in parallel (one per service)
- Docker builds run in parallel (all changed services)

### 4. **Smart Deployment**

- **Main Branch**: Deploys to production
- **Staging Branch**: Deploys to staging
- **Feature Branches**: Build only, no deploy
- **Pull Requests**: Build + test only

### 5. **Health Checks**

After deployment, verifies each service:

```bash
✅ ms1-ingestion is healthy
✅ ms4-prevision is healthy
```

---

## ⚙️ Configuration

### Build Versioning

Format: `{branch}-{buildNumber}-{gitCommit}`

Example: `main-42-a3f2c1d`

### Timeouts

- **Overall Pipeline**: 60 minutes
- **Health Checks**: 30 seconds per service
- **Smoke Tests**: 5 retries with 10s intervals

### Docker Image Tags

```
registry.example.com/agrotrace-ms1-ingestion:main-42-a3f2c1d
registry.example.com/agrotrace-ms1-ingestion:latest  (main branch only)
```

---

## 🔍 Pipeline Stages

### Stage 1: Initialize & Detect Changes

```groovy
- Determines build type (PR, main, feature)
- Compares git diff with target
- Identifies changed services
- Adds dependent services
- Prints build plan
```

### Stage 2: Code Quality & Security

```groovy
Parallel:
  - Python: flake8 + pylint
  - JavaScript: ESLint
  - Security: Trivy container scan
```

### Stage 3: Run Tests

```groovy
Parallel:
  - Unit tests (pytest/jest per service)
  - Integration tests (main branch only)
```

### Stage 4: Build Docker Images

```groovy
For each changed service:
  - Build Docker image
  - Tag with version
  - Add metadata labels
```

### Stage 5: Push to Registry

```groovy
Only on: main, develop, staging branches
  - Push versioned tag
  - Push 'latest' tag (main only)
```

### Stage 6: Deploy

```groovy
Only on: main, staging branches
  - Pull latest images
  - Deploy with docker-compose
  - Wait for health checks
```

### Stage 7: Smoke Tests

```groovy
For each deployed service:
  - Verify health endpoint
  - Check API availability
```

---

## 🛠️ Helper Scripts

Located in `.jenkins/scripts/`:

### build-service.sh

Build a single service manually:

```bash
./build-service.sh ms1-ingestion 1.0.0
```

### run-tests.sh

Run tests for a specific service:

```bash
./run-tests.sh ms1-ingestion-capteurs
```

### health-check.sh

Check service health:

```bash
./health-check.sh ms1-ingestion 8001 30 5
# Args: service-name, port, max-retries, retry-interval
```

---

## 📊 Monitoring & Notifications

### Build Notifications

Configure in `Jenkinsfile`:

```groovy
def notifySuccess() {
    // Add Slack/Email integration
    slackSend(
        channel: '#deployments',
        color: 'good',
        message: "✅ Deployment successful: ${CHANGED_SERVICES.join(', ')}"
    )
}
```

### Recommended Plugins

- **Slack Notification Plugin**: Real-time build status
- **Email Extension Plugin**: Detailed email reports
- **Blue Ocean**: Modern UI for pipeline visualization

---

## 🐛 Troubleshooting

### Issue: "No service changes detected"

**Solution**: Check git history. Pipeline compares with previous commit. For first build, it builds all services.

### Issue: "Docker build failed"

**Solution**: 
1. Check Dockerfile exists in service directory
2. Verify build context is correct
3. Check Docker daemon is running on Jenkins agent

### Issue: "Health check timeout"

**Solution**:
1. Check service logs: `docker-compose logs <service-name>`
2. Verify port mappings in docker-compose.yml
3. Increase timeout in `jenkins.env`

### Issue: "Tests failing in Jenkins but pass locally"

**Solution**:
1. Check environment variables match
2. Ensure test database is available
3. Review Jenkins workspace permissions

---

## 🔐 Security Best Practices

✅ **Never commit credentials** to git  
✅ Use Jenkins **Credentials Store** for secrets  
✅ Run **security scans** (Trivy) on every build  
✅ Use **non-root containers** in Dockerfiles  
✅ Enable **RBAC** on Jenkins  
✅ Regularly **update base images**  

---

## 📈 Performance Optimization

### Build Time Comparison

| Strategy | Build Time | Notes |
|----------|-----------|-------|
| Build All Services | ~25 min | Every commit |
| Smart Detection (this pipeline) | ~5-8 min | Only changed services |
| Parallel Execution | ~3-5 min | With 4+ CPU cores |

### Tips for Faster Builds

1. **Use Docker layer caching**:
   ```groovy
   --cache-from ${REGISTRY}/agrotrace-${service}:latest
   ```

2. **Parallelize independent tasks**:
   - Already implemented for builds, tests, linting

3. **Skip integration tests** on feature branches:
   ```groovy
   when { branch 'main' }
   ```

---

## 🎓 Advanced Usage

### Custom Build Trigger

Trigger specific service builds:

```groovy
pipeline {
    parameters {
        choice(name: 'FORCE_BUILD_SERVICE', 
               choices: ['', 'ms1-ingestion', 'ms2-etl', ...])
    }
}
```

### Multi-Environment Deployment

Extend for dev/staging/prod:

```groovy
stage('Deploy to Dev') {
    when { branch 'develop' }
    steps { deployToEnvironment('dev') }
}
```

### Rollback Strategy

On deployment failure:

```groovy
post {
    failure {
        script {
            sh "docker-compose up -d --force-recreate"
        }
    }
}
```

---

## 📞 Support

- **Issues**: Open a GitHub issue
- **Questions**: Contact DevOps team
- **Documentation**: See `/docs` folder

---

## 📄 License

MIT License - See LICENSE file

---

**Happy Building! 🚀**

Built with ❤️ for AgroTrace by the DevOps Team
