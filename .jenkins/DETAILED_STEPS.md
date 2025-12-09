# 🎯 Detailed Jenkins Configuration Steps for AgroTrace

**Your Jenkins URL**: http://localhost:8081

---

## Part 1: Pre-Jenkins Setup (Terminal Commands)

### Step 1: Configure Docker Access

```bash
# Give Jenkins container access to Docker
docker exec -u root jenkins chmod 666 /var/run/docker.sock

# Verify it works (should show running containers)
docker exec jenkins docker ps
```

**Expected Output**: Should show your running containers including Jenkins itself.

### Step 2: Start Local Docker Registry

```bash
# Start registry if not already running
docker run -d -p 5000:5000 --name registry registry:2

# Verify it's running
curl http://localhost:5000/v2/_catalog
```

**Expected Output**: `{"repositories":[]}`

---

## Part 2: Inside Jenkins Web UI

### 🔧 **STEP A: Install Required Plugins**

1. **Open Jenkins**: http://localhost:8081
2. **Log in** with your admin credentials
3. Click **"Manage Jenkins"** (left sidebar)
4. Click **"Plugins"**
5. Click **"Available plugins"** tab
6. In the search box, type: **"Docker Pipeline"**
7. ✅ Check the box next to **"Docker Pipeline"**
8. In the search box, type: **"Git"** 
9. ✅ Check if **"Git plugin"** is already installed (if not, check it)
10. Click **"Install"** button at the top
11. ✅ Check **"Restart Jenkins when installation is complete and no jobs are running"**
12. **Wait** for Jenkins to restart (about 30 seconds)
13. **Log back in** to http://localhost:8081

---

### 🔐 **STEP B: Configure Credentials (6 items)**

#### Navigate to Credentials:
1. Click **"Manage Jenkins"** (left sidebar)
2. Click **"Credentials"**
3. Click **"System"** (under "Stores scoped to Jenkins")
4. Click **"Global credentials (unrestricted)"**
5. You'll see a list (probably empty). Now add credentials:

---

#### Credential 1: Docker Registry Credentials

1. Click **"+ Add Credentials"** (left side)
2. **Kind**: Select **"Username with password"**
3. **Scope**: Leave as **"Global"**
4. **Username**: Your Docker Hub username (e.g., `yourusername`)
5. **Password**: Your Docker Hub password or access token
6. **ID**: Type exactly: `docker-registry-credentials`
7. **Description**: `Docker Registry Access`
8. Click **"Create"**

---

#### Credential 2: Docker Registry URL

1. Click **"+ Add Credentials"**
2. **Kind**: Select **"Secret text"**
3. **Scope**: Leave as **"Global"**
4. **Secret**: Type exactly: `localhost:5000`
5. **ID**: Type exactly: `docker-registry-url`
6. **Description**: `Docker Registry URL`
7. Click **"Create"**

---

#### Credential 3: TimescaleDB User

1. Click **"+ Add Credentials"**
2. **Kind**: Select **"Secret text"**
3. **Scope**: Leave as **"Global"**
4. **Secret**: Type exactly: `agrotrace_admin`
5. **ID**: Type exactly: `timescale-user`
6. **Description**: `TimescaleDB Username`
7. Click **"Create"**

---

#### Credential 4: TimescaleDB Password

1. Click **"+ Add Credentials"**
2. **Kind**: Select **"Secret text"**
3. **Scope**: Leave as **"Global"**
4. **Secret**: Type exactly: `Agr0Tr@ce2024!Secure`
5. **ID**: Type exactly: `timescale-password`
6. **Description**: `TimescaleDB Password`
7. Click **"Create"**

---

#### Credential 5: MinIO User

1. Click **"+ Add Credentials"**
2. **Kind**: Select **"Secret text"**
3. **Scope**: Leave as **"Global"**
4. **Secret**: Type exactly: `agrotrace_minio`
5. **ID**: Type exactly: `minio-root-user`
6. **Description**: `MinIO Root User`
7. Click **"Create"**

---

#### Credential 6: MinIO Password

1. Click **"+ Add Credentials"**
2. **Kind**: Select **"Secret text"**
3. **Scope**: Leave as **"Global"**
4. **Secret**: Type exactly: `M1n10Secure2024!Key`
5. **ID**: Type exactly: `minio-root-password`
6. **Description**: `MinIO Root Password`
7. Click **"Create"**

---

#### ✅ Verify All Credentials Added

You should now see **6 credentials** in the list:
- ✅ docker-registry-credentials (Username with password)
- ✅ docker-registry-url (Secret text)
- ✅ timescale-user (Secret text)
- ✅ timescale-password (Secret text)
- ✅ minio-root-user (Secret text)
- ✅ minio-root-password (Secret text)

**Screenshot location**: You're at `http://localhost:8081/manage/credentials/store/system/domain/_/`

---

### 📝 **STEP C: Create Test Pipeline (Validate Setup)**

This quick test ensures everything is configured correctly.

1. Click **"Dashboard"** (top left, Jenkins logo)
2. Click **"+ New Item"** (left sidebar)
3. **Enter an item name**: `test-jenkins`
4. Select **"Pipeline"** (scroll down if needed)
5. Click **"OK"**

#### Configure Test Pipeline:

**General Section:**
- Leave defaults

**Pipeline Section:**
1. **Definition**: Leave as **"Pipeline script"** (default)
2. In the **Script** text box, paste this:

```groovy
pipeline {
    agent any
    
    stages {
        stage('Test Docker Access') {
            steps {
                script {
                    echo "Testing Docker access..."
                    sh 'docker --version'
                    sh 'docker ps'
                    echo "✅ Docker works!"
                }
            }
        }
        
        stage('Test Git') {
            steps {
                script {
                    echo "Testing Git..."
                    sh 'git --version'
                    echo "✅ Git works!"
                }
            }
        }
        
        stage('Test Credentials') {
            steps {
                script {
                    echo "Testing credentials..."
                    withCredentials([string(credentialsId: 'docker-registry-url', variable: 'REGISTRY')]) {
                        echo "Registry URL: ${REGISTRY}"
                    }
                    echo "✅ Credentials work!"
                }
            }
        }
    }
    
    post {
        success {
            echo "=========================================="
            echo "✅ ALL TESTS PASSED!"
            echo "Your Jenkins is ready for AgroTrace!"
            echo "=========================================="
        }
    }
}
```

3. Click **"Save"**

#### Run Test Pipeline:

1. Click **"Build Now"** (left sidebar)
2. Wait a few seconds
3. You'll see **"#1"** appear under "Build History"
4. Click **"#1"**
5. Click **"Console Output"**
6. Watch the output - should end with **"✅ ALL TESTS PASSED!"**

**If it fails**: Check the error message and fix the issue before proceeding.

---

### 🚀 **STEP D: Create AgroTrace Pipeline (The Real One)**

1. Click **"Dashboard"** (top left)
2. Click **"+ New Item"**
3. **Enter an item name**: `AgroTrace-Pipeline`
4. Select **"Pipeline"**
5. Click **"OK"**

#### Configure AgroTrace Pipeline:

**General Section:**

1. ✅ Check **"Discard old builds"**
   - **Days to keep builds**: `30`
   - **Max # of builds to keep**: `10`

2. ✅ Check **"GitHub project"** (optional)
   - **Project url**: `https://github.com/Rzn-Mohamed/Agrotrace/`

**Build Triggers Section:**

1. ✅ Check **"Poll SCM"**
   - **Schedule**: Type: `H/5 * * * *`
   - (This checks for changes every 5 minutes)

**Pipeline Section:**

1. **Definition**: Select **"Pipeline script from SCM"** (dropdown)

2. **SCM**: Select **"Git"**

3. **Repository URL**: Type exactly:
   ```
   /Users/Aeztic/Documents/Agrotrace
   ```

4. **Credentials**: Leave as **"- none -"** (local repo doesn't need credentials)

5. **Branches to build**:
   - **Branch Specifier**: `*/main`

6. **Script Path**: Type exactly: `Jenkinsfile`

7. **Lightweight checkout**: ✅ Check this (optional, makes checkout faster)

#### Save Pipeline:

Click **"Save"** (bottom of page)

---

### ▶️ **STEP E: Run Your First Build**

1. You should now be on the **AgroTrace-Pipeline** page
2. Click **"Build Now"** (left sidebar)
3. Watch as **"#1"** appears under "Build History"
4. Click **"#1"** to see details
5. Click **"Console Output"** to see live logs

---

### 📊 **What You'll See in Console Output**

The pipeline will execute these stages:

#### Stage 1: Initialize & Detect Changes
```
🚀 Starting AgroTrace Pipeline Build #1
📦 Git Commit: a3f2c1d
🔍 Initialize & Detect Changes
⚠️  No service changes detected. Building all services.
📋 Services to build (with dependencies): ms1-ingestion, ms2-etl, ms3-vision, ms4-prevision, ms5-regles, ms6-reco, ms7-backend, ms7-frontend
```

#### Stage 2: Code Quality & Security (Parallel)
```
[Pipeline] parallel
[Python Linting] 🐍 Running Python linting...
[JavaScript Linting] 📜 Running JavaScript/TypeScript linting...
[Security Scan] 🔒 Running security vulnerability scan...
```

#### Stage 3: Run Tests
```
🧪 Running unit tests for changed services...
```
**Note**: Tests might fail if you don't have test files yet - this is OK!

#### Stage 4: Build Docker Images (Parallel)
```
🔨 Building agrotrace-ms1-ingestion...
🔨 Building agrotrace-ms2-etl...
🔨 Building agrotrace-ms3-vision...
...
✅ Built localhost:5000/agrotrace-ms1-ingestion:main-1-a3f2c1d
```

#### Stage 5: Push to Registry
```
📤 Pushing images to registry...
✅ Pushed localhost:5000/agrotrace-ms1-ingestion:main-1-a3f2c1d
```

#### Stage 6: Deploy
```
🚀 Deploying to production...
docker-compose up -d ms1-ingestion ms2-etl ...
```

#### Stage 7: Smoke Tests
```
💨 Running smoke tests...
✅ ms1-ingestion health check passed
```

**Final Output:**
```
✅ Pipeline completed successfully!
Finished: SUCCESS
```

---

### 🎨 **STEP F: View in Blue Ocean (Optional but Beautiful)**

1. Click **"Dashboard"**
2. Click **"Open Blue Ocean"** (left sidebar)
3. Click **"AgroTrace-Pipeline"**
4. You'll see a visual representation of your pipeline with all stages
5. Click any stage to see its logs
6. Green = Success, Red = Failed, Blue = Running

---

### 🧪 **STEP G: Test Change Detection**

Now test that the pipeline only builds changed services:

#### In Terminal:

```bash
# Go to your project
cd /Users/Aeztic/Documents/Agrotrace

# Make a small change to one service
echo "# Jenkins pipeline test" >> ms1-ingestion-capteurs/README.md

# Commit the change
git add ms1-ingestion-capteurs/README.md
git commit -m "test: jenkins change detection for ms1"

# Wait 5 minutes (or click "Build Now" in Jenkins)
```

#### In Jenkins:

1. Click **"Build Now"** (don't wait for auto-trigger)
2. Click the new build **"#2"**
3. Click **"Console Output"**

**Expected Output:**
```
✅ Changed services: ms1-ingestion
📋 Services to build (with dependencies): ms1-ingestion
```

**Success!** It only built ms1-ingestion instead of all 8 services!

---

## Part 3: Understanding Build Results

### ✅ Successful Build

**What you'll see:**
- All stages green in Blue Ocean
- Console ends with: `Finished: SUCCESS`
- Build time: ~5-15 minutes (depending on services built)

### ⚠️ Partial Success (Common on First Run)

**What you might see:**
```
⚠️  Some tests failed but build continued
✅ Docker images built successfully
⏭️  Deployment skipped (not on main branch)
```

**This is OK!** It means:
- Tests don't exist yet (normal for new projects)
- Docker builds succeeded (what matters most)
- Deployment skipped because you're not on main branch

### ❌ Build Failed

**Common Issues:**

1. **Docker permission denied**
   ```bash
   docker exec -u root jenkins chmod 666 /var/run/docker.sock
   ```

2. **Credential not found**
   - Check credential IDs match EXACTLY (case-sensitive)
   - Go back to Step B and verify

3. **Jenkinsfile not found**
   ```bash
   ls -la /Users/Aeztic/Documents/Agrotrace/Jenkinsfile
   ```

4. **Git repository not found**
   - Make sure path is: `/Users/Aeztic/Documents/Agrotrace`
   - No trailing slash!

---

## Part 4: Monitoring & Management

### View All Builds

1. Dashboard → AgroTrace-Pipeline
2. See "Build History" on left
3. Click any build number to see details

### View Build Trends

1. AgroTrace-Pipeline page
2. Scroll down to see graphs:
   - Build time trend
   - Success/failure rate
   - Stage durations

### Cancel a Build

1. Click the running build number
2. Click the **red X** icon (top left)

### View Workspace

1. AgroTrace-Pipeline → Build #X
2. Click **"Workspace"** (left sidebar)
3. Browse files Jenkins checked out

### View Logs

1. Build #X → **"Console Output"**
2. Or in Blue Ocean: Click stage → See logs

---

## Part 5: Advanced Configuration (Optional)

### Enable Automatic Builds on Git Push

**Option 1: Poll SCM** (Already configured)
- Jenkins checks every 5 minutes
- No additional setup needed

**Option 2: Webhooks** (Better, instant)
1. GitHub → Your repo → Settings → Webhooks
2. Add webhook: `http://your-jenkins-url/github-webhook/`
3. Content type: `application/json`
4. Events: Just push events
5. In Jenkins pipeline: Check "GitHub hook trigger"

### Add Slack Notifications

1. Install Slack Notification plugin
2. Get Slack webhook URL
3. Add to Jenkinsfile:
```groovy
def notifySuccess() {
    slackSend(
        channel: '#deployments',
        color: 'good',
        message: "✅ Build #${BUILD_NUMBER} succeeded!"
    )
}
```

### Add Email Notifications

1. Manage Jenkins → System
2. Configure email settings
3. In pipeline: Add post-build email action

---

## Quick Reference: What Each Stage Does

| Stage | Purpose | Can Fail? | Impact if Fails |
|-------|---------|-----------|-----------------|
| 1. Detect Changes | Identifies which services changed | No | Builds all services |
| 2. Code Quality | Linting and security scans | Yes (continues) | Warnings shown |
| 3. Run Tests | Unit and integration tests | Yes (continues) | Tests failures logged |
| 4. Build Images | Creates Docker images | Yes (stops) | Build fails |
| 5. Push to Registry | Uploads images | Yes (stops) | Can't deploy |
| 6. Deploy | Starts services | Yes (stops) | Services not updated |
| 7. Smoke Tests | Verifies health | Yes (stops) | Deployment failed |

---

## Checklist: Is Everything Working?

- [ ] Jenkins accessible at http://localhost:8081
- [ ] Docker Pipeline plugin installed
- [ ] 6 credentials configured correctly
- [ ] Test pipeline passed all tests
- [ ] AgroTrace-Pipeline created
- [ ] First build completed (success or partial)
- [ ] Can see console output
- [ ] Blue Ocean UI accessible
- [ ] Change detection tested
- [ ] Docker registry running on port 5000

---

## What's Next?

1. **Add real tests** to your microservices
2. **Configure production credentials** (separate from dev)
3. **Set up staging environment**
4. **Add integration tests**
5. **Configure webhooks** for instant builds
6. **Add monitoring** (Prometheus, Grafana)
7. **Set up backup** for Jenkins configuration

---

## Need Help?

**Jenkins Logs:**
```bash
docker logs -f jenkins
```

**Check Docker Access:**
```bash
docker exec jenkins docker ps
```

**Restart Jenkins:**
```bash
docker restart jenkins
```

**View Registry Contents:**
```bash
curl http://localhost:5000/v2/_catalog
```

---

**You're all set! 🎉**

Your Jenkins pipeline will now:
- ✅ Detect which microservices changed
- ✅ Build only those services (saves time!)
- ✅ Run tests in parallel
- ✅ Push to Docker registry
- ✅ Deploy automatically (on main branch)
- ✅ Verify deployment health

**Estimated time to complete all steps: 20-30 minutes**
