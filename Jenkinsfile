// ==============================================================================
// AgroTrace - Jenkins Pipeline (Monorepo Multi-Service)
// ==============================================================================
// This pipeline detects changes in microservices and builds only what changed
// Supports parallel execution and intelligent dependency management
// ==============================================================================

import groovy.transform.Field

@Field def MICROSERVICES = [
    [name: 'ms1-ingestion',   path: 'ms1-ingestion-capteurs',    port: 8001, deps: ['kafka', 'timescaledb']],
    [name: 'ms2-etl',         path: 'ms2-pretraitement',         port: null, deps: ['timescaledb']],
    [name: 'ms3-vision',      path: 'ms3-visionPlante-main',     port: 8002, deps: ['minio']],
    [name: 'ms4-prevision',   path: 'ms4-prevision-eau',         port: 8003, deps: ['timescaledb', 'ms5-regles']],
    [name: 'ms5-regles',      path: 'ms5-regles-agro',           port: 8004, deps: ['timescaledb']],
    [name: 'ms6-reco',        path: 'ms6-RecoIrrigation',        port: 8005, deps: ['timescaledb']],
    [name: 'ms7-backend',     path: 'ms7-DashboardSIG/backend',  port: 8006, deps: ['timescaledb']],
    [name: 'ms7-frontend',    path: 'ms7-DashboardSIG/frontend', port: 8080, deps: ['ms7-backend']]
]

@Field def CHANGED_SERVICES = []
@Field def BUILD_VERSION = ""

pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = credentials('docker-registry-url')
        DOCKER_CREDENTIALS = credentials('docker-registry-credentials')
        TIMESCALE_USER = credentials('timescale-user')
        TIMESCALE_PASSWORD = credentials('timescale-password')
        MINIO_ROOT_USER = credentials('minio-root-user')
        MINIO_ROOT_PASSWORD = credentials('minio-root-password')
        COMPOSE_PROJECT_NAME = 'agrotrace'
        GIT_COMMIT_SHORT = sh(returnStdout: true, script: "git rev-parse --short HEAD").trim()
    }
    
    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 60, unit: 'MINUTES')
        timestamps()
        disableConcurrentBuilds()
    }
    
    stages {
        // ======================================================================
        // STAGE 1: Initialize & Detect Changes
        // ======================================================================
        stage('🔍 Initialize & Detect Changes') {
            steps {
                script {
                    echo "🚀 Starting AgroTrace Pipeline Build #${BUILD_NUMBER}"
                    echo "📦 Git Commit: ${GIT_COMMIT_SHORT}"
                    
                    // Generate build version
                    BUILD_VERSION = "${env.BRANCH_NAME}-${BUILD_NUMBER}-${GIT_COMMIT_SHORT}"
                    
                    // Detect changed services
                    if (env.CHANGE_TARGET) {
                        // Pull Request build - compare with target branch
                        echo "🔀 PR Build detected. Comparing with ${env.CHANGE_TARGET}"
                        CHANGED_SERVICES = detectChangedServices(env.CHANGE_TARGET)
                    } else if (env.BRANCH_NAME == 'main' || env.BRANCH_NAME == 'master') {
                        // Main branch - compare with previous commit
                        echo "🎯 Main branch build. Comparing with HEAD~1"
                        CHANGED_SERVICES = detectChangedServices('HEAD~1')
                    } else {
                        // Feature branch - compare with main
                        echo "🌿 Feature branch build. Comparing with origin/main"
                        CHANGED_SERVICES = detectChangedServices('origin/main')
                    }
                    
                    if (CHANGED_SERVICES.isEmpty()) {
                        echo "⚠️  No service changes detected. Building all services."
                        CHANGED_SERVICES = MICROSERVICES.collect { it.name }
                    } else {
                        echo "✅ Changed services: ${CHANGED_SERVICES.join(', ')}"
                    }
                    
                    // Add dependent services
                    CHANGED_SERVICES = addDependentServices(CHANGED_SERVICES)
                    echo "📋 Services to build (with dependencies): ${CHANGED_SERVICES.join(', ')}"
                }
            }
        }
        
        // ======================================================================
        // STAGE 2: Code Quality & Security Checks
        // ======================================================================
        stage('🔎 Code Quality & Security') {
            parallel {
                stage('Python Linting') {
                    when {
                        expression { hasPythonChanges() }
                    }
                    steps {
                        script {
                            echo "🐍 Running Python linting..."
                            CHANGED_SERVICES.each { serviceName ->
                                def service = MICROSERVICES.find { it.name == serviceName }
                                if (service && fileExists("${service.path}/requirements.txt")) {
                                    dir(service.path) {
                                        sh '''
                                            python3 -m pip install --quiet flake8 pylint || true
                                            flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics || true
                                            pylint **/*.py --exit-zero || true
                                        '''
                                    }
                                }
                            }
                        }
                    }
                }
                
                stage('JavaScript Linting') {
                    when {
                        expression { hasJavaScriptChanges() }
                    }
                    steps {
                        script {
                            echo "📜 Running JavaScript/TypeScript linting..."
                            CHANGED_SERVICES.each { serviceName ->
                                def service = MICROSERVICES.find { it.name == serviceName }
                                if (service && fileExists("${service.path}/package.json")) {
                                    dir(service.path) {
                                        sh '''
                                            npm install --quiet || true
                                            npm run lint || true
                                        '''
                                    }
                                }
                            }
                        }
                    }
                }
                
                stage('Security Scan') {
                    steps {
                        script {
                            echo "🔒 Running security vulnerability scan..."
                            sh '''
                                # Trivy security scanner
                                docker run --rm -v $WORKSPACE:/workspace aquasec/trivy:latest fs /workspace --quiet || true
                            '''
                        }
                    }
                }
            }
        }
        
        // ======================================================================
        // STAGE 3: Run Tests
        // ======================================================================
        stage('🧪 Run Tests') {
            parallel {
                stage('Unit Tests') {
                    steps {
                        script {
                            echo "🧪 Running unit tests for changed services..."
                            CHANGED_SERVICES.each { serviceName ->
                                def service = MICROSERVICES.find { it.name == serviceName }
                                if (service) {
                                    runServiceTests(service)
                                }
                            }
                        }
                    }
                }
                
                stage('Integration Tests') {
                    when {
                        branch 'main'
                    }
                    steps {
                        script {
                            echo "🔗 Running integration tests..."
                            sh '''
                            # Start test infrastructure
                            docker-compose -f docker-compose.yml up -d timescaledb kafka minio
                            
                            # Wait for services to be ready (health check instead of sleep)
                            echo "Waiting for infrastructure services..."
                            timeout 60 bash -c 'until docker-compose exec -T timescaledb pg_isready; do sleep 2; done' || true
                            
                            # Run integration tests
                            docker-compose -f docker-compose.test.yml up --exit-code-from tests || true
                            
                            # Cleanup
                            docker-compose -f docker-compose.test.yml down -v
                        '''
                        }
                    }
                }
            }
        }
        
        // ======================================================================
        // STAGE 4: Build Docker Images
        // ======================================================================
        stage('🐳 Build Docker Images') {
            steps {
                script {
                    echo "🔨 Building Docker images for changed services..."
                    
                    // Login to Docker registry
                    sh "echo ${DOCKER_CREDENTIALS_PSW} | docker login -u ${DOCKER_CREDENTIALS_USR} --password-stdin ${DOCKER_REGISTRY}"
                    
                    // Build images in parallel
                    def buildSteps = [:]
                    CHANGED_SERVICES.each { serviceName ->
                        def service = MICROSERVICES.find { it.name == serviceName }
                        if (service) {
                            buildSteps[serviceName] = {
                                buildDockerImage(service, BUILD_VERSION)
                            }
                        }
                    }
                    
                    parallel buildSteps
                }
            }
        }
        
        // ======================================================================
        // STAGE 5: Push Images to Registry
        // ======================================================================
        stage('📤 Push to Registry') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                    branch 'staging'
                }
            }
            steps {
                script {
                    echo "📤 Pushing images to registry..."
                    CHANGED_SERVICES.each { serviceName ->
                        def imageName = "${DOCKER_REGISTRY}/agrotrace-${serviceName}:${BUILD_VERSION}"
                        sh "docker push ${imageName}"
                        
                        // Tag and push latest for main branch
                        if (env.BRANCH_NAME == 'main') {
                            sh """
                                docker tag ${imageName} ${DOCKER_REGISTRY}/agrotrace-${serviceName}:latest
                                docker push ${DOCKER_REGISTRY}/agrotrace-${serviceName}:latest
                            """
                        }
                    }
                }
            }
        }
        
        // ======================================================================
        // STAGE 6: Deploy
        // ======================================================================
        stage('🚀 Deploy') {
            when {
                anyOf {
                    branch 'main'
                    branch 'staging'
                }
            }
            steps {
                script {
                    def environment = env.BRANCH_NAME == 'main' ? 'production' : 'staging'
                    echo "🚀 Deploying to ${environment}..."
                    
                    // Deploy using docker-compose
                    sh """
                        export BUILD_VERSION=${BUILD_VERSION}
                        
                        # Pull latest images
                        docker-compose pull
                        
                        # Deploy services
                        docker-compose up -d ${CHANGED_SERVICES.join(' ')}
                        
                        # Wait for containers to start (quick check, verification does health polling)
                        sleep 5
                        docker-compose ps
                    """
                    
                    // Verify deployment
                    verifyDeployment(CHANGED_SERVICES)
                }
            }
        }
        
        // ======================================================================
        // STAGE 7: Smoke Tests
        // ======================================================================
        stage('💨 Smoke Tests') {
            when {
                anyOf {
                    branch 'main'
                    branch 'staging'
                }
            }
            steps {
                script {
                    echo "💨 Running smoke tests..."
                    CHANGED_SERVICES.each { serviceName ->
                        def service = MICROSERVICES.find { it.name == serviceName }
                        if (service && service.port) {
                            runSmokeTest(service)
                        }
                    }
                }
            }
        }
    }
    
    // ==========================================================================
    // POST-BUILD ACTIONS
    // ==========================================================================
    post {
        success {
            script {
                echo "✅ Pipeline completed successfully!"
                notifySuccess()
            }
        }
        
        failure {
            script {
                echo "❌ Pipeline failed!"
                notifyFailure()
            }
        }
        
        always {
            script {
                // Cleanup
                sh """
                    docker system prune -f --filter 'until=24h' || true
                    docker volume prune -f || true
                """
                
                // Archive artifacts
                archiveArtifacts artifacts: '**/target/*.jar,**/dist/**', allowEmptyArchive: true
                
                // Publish test results
                junit testResults: '**/test-results/*.xml', allowEmptyResults: true
            }
        }
    }
}

// ==============================================================================
// HELPER FUNCTIONS
// ==============================================================================

def detectChangedServices(String compareWith) {
    def changedFiles = sh(
        returnStdout: true,
        script: "git diff --name-only ${compareWith} HEAD"
    ).trim().split('\n')
    
    def changedServices = []
    MICROSERVICES.each { service ->
        if (changedFiles.any { it.startsWith(service.path) }) {
            changedServices << service.name
        }
    }
    
    // Check for infrastructure changes
    if (changedFiles.any { it == 'docker-compose.yml' || it.startsWith('database/') }) {
        echo "🏗️  Infrastructure changes detected. Building all services."
        return MICROSERVICES.collect { it.name }
    }
    
    return changedServices
}

def addDependentServices(List changedServices) {
    def result = changedServices.clone()
    
    MICROSERVICES.each { service ->
        if (service.deps) {
            service.deps.each { dep ->
                // If a dependency changed, rebuild this service too
                if (changedServices.contains(dep) && !result.contains(service.name)) {
                    echo "📦 Adding ${service.name} (depends on ${dep})"
                    result << service.name
                }
            }
        }
    }
    
    return result
}

def hasPythonChanges() {
    return CHANGED_SERVICES.any { serviceName ->
        def service = MICROSERVICES.find { it.name == serviceName }
        service && fileExists("${service.path}/requirements.txt")
    }
}

def hasJavaScriptChanges() {
    return CHANGED_SERVICES.any { serviceName ->
        def service = MICROSERVICES.find { it.name == serviceName }
        service && fileExists("${service.path}/package.json")
    }
}

def runServiceTests(Map service) {
    dir(service.path) {
        if (fileExists('requirements.txt')) {
            sh '''
                python3 -m venv venv || true
                . venv/bin/activate
                pip install -r requirements.txt
                pip install pytest pytest-cov
                pytest tests/ --junitxml=test-results/junit.xml --cov=. --cov-report=xml || true
            '''
        } else if (fileExists('package.json')) {
            sh '''
                npm install
                npm test || true
            '''
        }
    }
}

def buildDockerImage(Map service, String version) {
    def imageName = "agrotrace-${service.name}"
    def imageTag = "${DOCKER_REGISTRY}/${imageName}:${version}"
    def cacheTag = "${DOCKER_REGISTRY}/${imageName}:cache"
    
    echo "🔨 Building ${imageName}..."
    
    dir(service.path) {
        // Pull cache image for faster builds (ignore failure if not exists)
        sh "docker pull ${cacheTag} || true"
        
        sh """
            docker build \
                --cache-from ${cacheTag} \
                --build-arg BUILDKIT_INLINE_CACHE=1 \
                --build-arg BUILD_DATE=\$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
                --build-arg VERSION=${version} \
                --build-arg VCS_REF=${GIT_COMMIT_SHORT} \
                -t ${imageTag} \
                -t ${cacheTag} \
                -f Dockerfile \
                .
        """
    }
    
    echo "✅ Built ${imageTag}"
}

def verifyDeployment(List services) {
    echo "🔍 Verifying deployment health..."
    services.each { serviceName ->
        def service = MICROSERVICES.find { it.name == serviceName }
        if (service && service.port) {
            // Use timeout with faster polling instead of slow retry+sleep
            sh """
                timeout 60 bash -c '
                    until curl -sf http://localhost:${service.port}/health; do
                        echo "Waiting for ${serviceName}..."
                        sleep 3
                    done
                '
            """
            echo "✅ ${serviceName} is healthy"
        }
    }
}

def runSmokeTest(Map service) {
    echo "💨 Smoke testing ${service.name}..."
    sh """
        curl -f http://localhost:${service.port}/health
        echo "✅ ${service.name} health check passed"
    """
}

def notifySuccess() {
    // Add your notification logic (Slack, Email, etc.)
    echo "🎉 Deployment successful! Services: ${CHANGED_SERVICES.join(', ')}"
}

def notifyFailure() {
    // Add your notification logic (Slack, Email, etc.)
    echo "🚨 Build failed for commit ${GIT_COMMIT_SHORT}"
}
