# 🚀 Complete Jenkins Setup & Testing Guide

This guide walks you through setting up Jenkins and running the AgroTrace pipeline.

---

## 📋 Table of Contents

1. [Install Jenkins](#1-install-jenkins)
2. [Configure Jenkins](#2-configure-jenkins)
3. [Set Up Credentials](#3-set-up-credentials)
4. [Create Pipeline Job](#4-create-pipeline-job)
5. [Run & Test Pipeline](#5-run--test-pipeline)
6. [Troubleshooting](#6-troubleshooting)

---

## 1️⃣ Install Jenkins

### Option A: Using Docker (Recommended for Testing)

```bash
# Create Jenkins data directory
mkdir -p ~/jenkins_home

# Run Jenkins in Docker
docker run -d \
  --name jenkins \
  -p 8080:8080 \
  -p 50000:50000 \
  -v ~/jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --user root \
  jenkins/jenkins:lts

# Wait 30 seconds for Jenkins to start
sleep 30

# Get initial admin password
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

### Option B: Using Homebrew (macOS)

```bash
# Install Jenkins
brew install jenkins-lts

# Start Jenkins
brew services start jenkins-lts

# Jenkins will be available at http://localhost:8080

# Get initial admin password
cat /usr/local/var/jenkins_home/secrets/initialAdminPassword
```

### Option C: Manual Installation

Download from: https://www.jenkins.io/download/

---

## 2️⃣ Configure Jenkins

### Step 2.1: Initial Setup

1. Open browser: **http://localhost:8080**
2. Enter the **initial admin password** (from previous step)
3. Click **Install suggested plugins**
4. Create your first admin user
5. Keep default Jenkins URL: `http://localhost:8080/`

### Step 2.2: Install Required Plugins

Navigate to: **Manage Jenkins → Plugins → Available plugins**

Install these plugins:
- ✅ **Docker Pipeline** (for Docker commands)
- ✅ **Git Plugin** (for Git operations)
- ✅ **Pipeline** (should be pre-installed)
- ✅ **Blue Ocean** (optional, better UI)
- ✅ **Slack Notification** (optional, for notifications)

Click **Install** and restart Jenkins when done.

### Step 2.3: Configure Docker Access

If using Docker-in-Docker:

```bash
# Give Jenkins container access to Docker
docker exec -u root jenkins chmod 666 /var/run/docker.sock

# Verify Docker works inside Jenkins
docker exec jenkins docker ps
```

---

## 3️⃣ Set Up Credentials

### Navigate to Credentials Store

**Jenkins Dashboard → Manage Jenkins → Credentials → System → Global credentials**

### Add Required Credentials

#### 3.1: Docker Registry Credentials

Click **Add Credentials**:
- **Kind**: Username with password
- **Scope**: Global
- **Username**: `your-docker-username` (or use local registry)
- **Password**: `your-docker-password`
- **ID**: `docker-registry-credentials`
- **Description**: Docker Registry Access

#### 3.2: Docker Registry URL

Click **Add Credentials**:
- **Kind**: Secret text
- **Scope**: Global
- **Secret**: `localhost:5000` (for local testing) or `registry.example.com`
- **ID**: `docker-registry-url`
- **Description**: Docker Registry URL

#### 3.3: TimescaleDB Credentials

**TimescaleDB User**:
- **Kind**: Secret text
- **Secret**: `agrotrace_admin`
- **ID**: `timescale-user`

**TimescaleDB Password**:
- **Kind**: Secret text
- **Secret**: `Agr0Tr@ce2024!Secure`
- **ID**: `timescale-password`

#### 3.4: MinIO Credentials

**MinIO User**:
- **Kind**: Secret text
- **Secret**: `agrotrace_minio`
- **ID**: `minio-root-user`

**MinIO Password**:
- **Kind**: Secret text
- **Secret**: `M1n10Secure2024!Key`
- **ID**: `minio-root-password`

### Summary of Credentials

| ID | Type | Value (for testing) |
|----|------|---------------------|
| `docker-registry-credentials` | Username/Password | Your Docker Hub credentials |
| `docker-registry-url` | Secret Text | `localhost:5000` |
| `timescale-user` | Secret Text | `agrotrace_admin` |
| `timescale-password` | Secret Text | `Agr0Tr@ce2024!Secure` |
| `minio-root-user` | Secret Text | `agrotrace_minio` |
| `minio-root-password` | Secret Text | `M1n10Secure2024!Key` |

---

## 4️⃣ Create Pipeline Job

### Step 4.1: Create New Item

1. Click **New Item** (or **Create a job**)
2. Enter name: `AgroTrace-Pipeline`
3. Select **Pipeline**
4. Click **OK**

### Step 4.2: Configure Pipeline

#### General Section:
- ✅ Check **Discard old builds**
  - **Days to keep builds**: 30
  - **Max # of builds to keep**: 10

- ✅ Check **GitHub project** (optional)
  - **Project url**: `https://github.com/Rzn-Mohamed/Agrotrace/`

#### Build Triggers:
- ✅ Check **Poll SCM** (for automatic builds)
  - **Schedule**: `H/5 * * * *` (checks every 5 minutes)

Or:
- ✅ Check **GitHub hook trigger** (if you have webhooks set up)

#### Pipeline Section:

**Definition**: Pipeline script from SCM

**SCM**: Git

**Repository URL**: 
```
https://github.com/Rzn-Mohamed/Agrotrace.git
```

Or if local:
```
/Users/Aeztic/Documents/Agrotrace
```

**Credentials**: (leave as `- none -` for public repos)

**Branch Specifier**: `*/main`

**Script Path**: `Jenkinsfile`

### Step 4.3: Save

Click **Save**

---

## 5️⃣ Run & Test Pipeline

### Test 1: Local Docker Registry (Recommended for First Test)

Before running the pipeline, set up a local Docker registry:

```bash
# Start local Docker registry
docker run -d -p 5000:5000 --name registry registry:2

# Verify it's running
curl http://localhost:5000/v2/_catalog
```

### Test 2: Run Pipeline

1. Go to **AgroTrace-Pipeline** job
2. Click **Build Now**
3. Watch the build progress in real-time

### Test 3: Monitor Build

Click on **Build #1** → **Console Output**

You should see:
```
🚀 Starting AgroTrace Pipeline Build #1
📦 Git Commit: a3f2c1d
🔍 Initialize & Detect Changes
✅ Changed services: ms1-ingestion, ms2-etl, ...
```

### Test 4: View in Blue Ocean (Better UI)

1. Click **Open Blue Ocean** (left sidebar)
2. Select **AgroTrace-Pipeline**
3. See visual pipeline execution

---

## 6️⃣ Testing Different Scenarios

### Scenario 1: Test Change Detection

Make a small change to one microservice:

```bash
# Go to your project
cd /Users/Aeztic/Documents/Agrotrace

# Make a small change to MS1
echo "# Test change" >> ms1-ingestion-capteurs/README.md

# Commit and push
git add ms1-ingestion-capteurs/README.md
git commit -m "test: trigger pipeline for ms1 only"
git push origin main
```

**Expected Result**: Pipeline should only build MS1 (and its dependencies)

### Scenario 2: Test Infrastructure Change

```bash
# Modify docker-compose.yml
echo "# Pipeline test" >> docker-compose.yml

git add docker-compose.yml
git commit -m "test: infrastructure change"
git push origin main
```

**Expected Result**: Pipeline should build ALL services

### Scenario 3: Test Multiple Service Changes

```bash
# Modify multiple services
echo "# Test" >> ms3-visionPlante-main/README.md
echo "# Test" >> ms5-regles-agro/README.md

git add .
git commit -m "test: multiple services"
git push origin main
```

**Expected Result**: Pipeline builds MS3, MS5, and their dependents

---

## 7️⃣ Verify Pipeline Execution

### Check Each Stage:

1. **🔍 Detect Changes**: 
   - Should show which services changed
   - Should add dependent services

2. **🔎 Code Quality**: 
   - Runs linting (may show warnings, that's OK)
   - Security scan with Trivy

3. **🧪 Run Tests**:
   - Unit tests for each service
   - May fail if tests don't exist yet (expected)

4. **🐳 Build Docker Images**:
   - Builds Docker images for changed services
   - Tags them properly

5. **📤 Push to Registry** (only on main/staging):
   - Pushes to your registry

6. **🚀 Deploy** (only on main/staging):
   - Runs docker-compose up for changed services

7. **💨 Smoke Tests**:
   - Verifies health endpoints

---

## 8️⃣ Expected First Run Issues (Normal!)

### Issue 1: Tests Fail
```
❌ pytest: command not found
```
**Solution**: This is normal if you don't have tests yet. The pipeline continues.

### Issue 2: Docker Registry Push Fails
```
❌ unauthorized: authentication required
```
**Solutions**:
1. Use local registry: `docker-registry-url` = `localhost:5000`
2. Or skip push by running on a feature branch instead of main

### Issue 3: Deployment Skipped
```
⏭️  Stage "Deploy" skipped
```
**Reason**: Deployment only runs on `main` or `staging` branches. This is expected on feature branches.

### Issue 4: Service Health Check Fails
```
❌ ms1-ingestion health check failed
```
**Solution**: 
- Make sure services have a `/health` endpoint
- Or comment out health checks temporarily for testing

---

## 9️⃣ Quick Test Without Full Infrastructure

### Minimal Test Pipeline

Create a simplified version for testing:

```bash
# Create test branch
git checkout -b test-jenkins

# Edit Jenkinsfile to skip deployment stages
# Comment out stages 5, 6, 7 in Jenkinsfile

git add Jenkinsfile
git commit -m "test: simplified pipeline"
git push origin test-jenkins
```

Then in Jenkins:
- Create new pipeline job: `AgroTrace-Test`
- Point to branch `test-jenkins`
- Run build

---

## 🔟 Local Testing Without Jenkins

Test the helper scripts directly:

```bash
# Test build script
.jenkins/scripts/build-service.sh ms1-ingestion test-1.0.0

# Test health check
docker-compose up -d ms1-ingestion
.jenkins/scripts/health-check.sh ms1-ingestion 8001

# Test linting
cd ms1-ingestion-capteurs
python3 -m pip install flake8
flake8 app/ --count --show-source --statistics
```

---

## 📊 Understanding Build Output

### Successful Build:
```
✅ Pipeline completed successfully!
✅ Changed services: ms1-ingestion
✅ Built agrotrace-ms1-ingestion:main-1-a3f2c1d
✅ ms1-ingestion is healthy
```

### Partial Success (OK for testing):
```
⚠️  Some tests failed but build continued
✅ Docker images built successfully
⏭️  Deployment skipped (not on main branch)
```

### Failed Build:
```
❌ Docker build failed for ms1-ingestion
❌ Pipeline failed!
```

---

## 🎯 Quick Start Checklist

- [ ] Jenkins installed and running on port 8080
- [ ] Plugins installed (Docker Pipeline, Git)
- [ ] Credentials configured (6 items)
- [ ] Pipeline job created
- [ ] Local Docker registry running (optional)
- [ ] First build triggered
- [ ] Console output reviewed
- [ ] Blue Ocean UI checked (optional)

---

## 🐛 Common Issues & Solutions

### "Jenkins can't access Docker"
```bash
# Fix Docker socket permissions
docker exec -u root jenkins chmod 666 /var/run/docker.sock
```

### "Git repository not found"
**Solution**: Use local path for testing:
```
Repository URL: /Users/Aeztic/Documents/Agrotrace
```

### "Credentials not found"
**Solution**: Double-check credential IDs match exactly:
- `docker-registry-credentials` (not `docker-credentials`)
- `docker-registry-url` (not `registry-url`)

### "Pipeline script not found"
**Solution**: Verify `Jenkinsfile` exists in repo root:
```bash
ls -la /Users/Aeztic/Documents/Agrotrace/Jenkinsfile
```

### "Build queue stuck"
**Solution**: Make sure you have at least 1 executor:
- **Manage Jenkins → Nodes → Built-in Node → Configure**
- Set **# of executors** to `2` or more

---

## 🎓 Next Steps After Successful Test

1. **Set up webhooks** for automatic builds on git push
2. **Configure Slack notifications** for build status
3. **Add integration tests** specific to your services
4. **Set up staging environment** for pre-production testing
5. **Configure production deployment** with proper secrets

---

## 📞 Getting Help

- **Jenkins Logs**: `docker logs jenkins -f`
- **Build Console**: Click build number → Console Output
- **Pipeline Visualization**: Blue Ocean UI
- **Jenkins Documentation**: https://www.jenkins.io/doc/

---

**Happy Testing! 🚀**

Your first successful build will validate:
✅ Jenkins configuration
✅ Docker integration
✅ Git repository access
✅ Pipeline logic
✅ Change detection
✅ Parallel execution
