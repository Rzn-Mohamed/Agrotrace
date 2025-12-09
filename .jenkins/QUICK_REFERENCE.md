# 🎯 Jenkins Pipeline - Quick Reference Card

## 🚀 Quick Start (2 Minutes)

```bash
# 1. Start Jenkins & Registry
cd /Users/Aeztic/Documents/Agrotrace
./.jenkins/quick-start.sh

# 2. Open Jenkins (will auto-open or go to):
# http://localhost:8080

# 3. Use the password shown in terminal
```

---

## 📝 Step-by-Step Setup

### Phase 1: Initial Setup (5 minutes)
```
1. Run quick-start.sh ✓
2. Open http://localhost:8080 ✓
3. Enter admin password ✓
4. Install suggested plugins ✓
5. Create admin user ✓
```

### Phase 2: Test Pipeline (2 minutes)
```
1. New Item → "test-jenkins" → Pipeline
2. Pipeline section → Pipeline script
3. Copy content from .jenkins/test-pipeline.groovy
4. Save → Build Now
5. Should see "✅ ALL TESTS PASSED!"
```

### Phase 3: Configure Credentials (3 minutes)
```
Manage Jenkins → Credentials → Global → Add Credentials

Add 6 credentials (IDs must match exactly):
├── docker-registry-credentials (Username/Password)
├── docker-registry-url (Secret: localhost:5000)
├── timescale-user (Secret: agrotrace_admin)
├── timescale-password (Secret: Agr0Tr@ce2024!Secure)
├── minio-root-user (Secret: agrotrace_minio)
└── minio-root-password (Secret: M1n10Secure2024!Key)
```

### Phase 4: Real Pipeline (2 minutes)
```
1. New Item → "AgroTrace-Pipeline" → Pipeline
2. Pipeline section:
   - Definition: "Pipeline script from SCM"
   - SCM: Git
   - Repository URL: /Users/Aeztic/Documents/Agrotrace
   - Branch: */main
   - Script Path: Jenkinsfile
3. Save → Build Now
4. Watch in Blue Ocean (optional)
```

---

## 🧪 Testing Scenarios

### Test 1: Single Service Change
```bash
echo "# test" >> ms1-ingestion-capteurs/README.md
git add . && git commit -m "test: ms1 change"
git push origin main
# Expected: Only builds ms1-ingestion
```

### Test 2: Infrastructure Change
```bash
echo "# test" >> docker-compose.yml
git add . && git commit -m "test: infra change"
git push origin main
# Expected: Builds ALL services
```

### Test 3: Multiple Services
```bash
echo "# test" >> ms3-visionPlante-main/README.md
echo "# test" >> ms5-regles-agro/README.md
git add . && git commit -m "test: multi service"
git push origin main
# Expected: Builds ms3, ms5, and dependents
```

---

## 📊 Understanding Build Output

### Stage 1: Detect Changes
```
🔍 Initialize & Detect Changes
✅ Changed services: ms1-ingestion, ms4-prevision
📋 Services to build (with dependencies): ms1-ingestion, ms4-prevision, ms5-regles
```

### Stage 2: Code Quality (Parallel)
```
🐍 Running Python linting...
📜 Running JavaScript/TypeScript linting...
🔒 Running security vulnerability scan...
```

### Stage 3: Tests
```
🧪 Running unit tests for changed services...
pytest tests/ -v
```

### Stage 4: Build Images
```
🔨 Building agrotrace-ms1-ingestion...
✅ Built localhost:5000/agrotrace-ms1-ingestion:main-1-a3f2c1d
```

### Stage 5: Push (main branch only)
```
📤 Pushing images to registry...
✅ Pushed to localhost:5000
```

### Stage 6: Deploy (main branch only)
```
🚀 Deploying to production...
✅ Services deployed
```

### Stage 7: Smoke Tests
```
💨 Running smoke tests...
✅ ms1-ingestion health check passed
```

---

## 🔧 Useful Commands

### Jenkins Container
```bash
# View logs
docker logs -f jenkins-agrotrace

# Restart Jenkins
docker restart jenkins-agrotrace

# Stop Jenkins
docker stop jenkins-agrotrace

# Start Jenkins
docker start jenkins-agrotrace

# Remove Jenkins (keeps data)
docker rm -f jenkins-agrotrace

# Remove Jenkins AND data
docker rm -f jenkins-agrotrace
rm -rf ~/jenkins_home
```

### Docker Registry
```bash
# View images in registry
curl http://localhost:5000/v2/_catalog

# View tags for an image
curl http://localhost:5000/v2/agrotrace-ms1-ingestion/tags/list
```

### Pipeline Testing
```bash
# Validate Jenkinsfile syntax (requires jenkins-cli)
java -jar jenkins-cli.jar declarative-linter < Jenkinsfile

# Test build script manually
./.jenkins/scripts/build-service.sh ms1-ingestion test-1.0.0

# Test health check manually
./.jenkins/scripts/health-check.sh ms1-ingestion 8001
```

---

## ❌ Common Issues & Quick Fixes

| Issue | Quick Fix |
|-------|-----------|
| Can't access Jenkins | Check Docker Desktop is running |
| Docker commands fail | `docker exec -u root jenkins-agrotrace chmod 666 /var/run/docker.sock` |
| Credentials not found | Check ID matches exactly (case-sensitive) |
| Build queue stuck | Manage Jenkins → Nodes → Configure → Set executors to 2 |
| Port 8080 in use | Stop other services or change port in quick-start.sh |
| Tests fail | Normal on first run if tests don't exist yet |
| Deployment skipped | Expected on non-main branches |
| Health check timeout | Services may not have /health endpoint yet |

---

## 🎯 Success Checklist

- [ ] Jenkins running on http://localhost:8080
- [ ] Test pipeline passes all 6 tests
- [ ] All 6 credentials configured
- [ ] AgroTrace-Pipeline job created
- [ ] First build triggered successfully
- [ ] Can see changed services in console output
- [ ] Docker images built
- [ ] Blue Ocean UI working (optional)

---

## 🆘 Need Help?

1. **Check logs**: Console Output in Jenkins
2. **See detailed guide**: `.jenkins/SETUP_GUIDE.md`
3. **View credentials guide**: `.jenkins/CREDENTIALS.md`
4. **Check main docs**: `.jenkins/README.md`

---

## 🎓 What You've Built

✅ Automated CI/CD pipeline  
✅ Change detection per microservice  
✅ Parallel build execution  
✅ Docker image building & registry  
✅ Automated testing  
✅ Smart deployment logic  
✅ Health monitoring  

**Total Setup Time**: ~15 minutes  
**Time Saved Per Build**: ~20 minutes (vs building all services)  

---

**Jenkins Admin**: http://localhost:8080  
**Docker Registry**: http://localhost:5000  
**Blue Ocean UI**: http://localhost:8080/blue  

---

Created with ❤️ for AgroTrace
