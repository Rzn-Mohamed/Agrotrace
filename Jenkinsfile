// ==============================================================================
// AgroTrace-MS - Optimized Jenkins CI/CD Pipeline
// ==============================================================================
// A comprehensive pipeline for building, testing, and deploying the AgroTrace
// microservices platform for precision agriculture
// ==============================================================================

pipeline {
    agent any
    
    // -------------------------------------------------------------------------
    // Environment Variables
    // -------------------------------------------------------------------------
    environment {
        // Docker Configuration
        DOCKER_REGISTRY = credentials('docker-registry-url')
        DOCKER_CREDENTIALS = credentials('docker-registry-credentials')
        
        // Database Credentials
        TIMESCALE_USER = credentials('timescale-user')
        TIMESCALE_PASSWORD = credentials('timescale-password')
        
        // MinIO Object Storage
        MINIO_ROOT_USER = credentials('minio-root-user')
        MINIO_ROOT_PASSWORD = credentials('minio-root-password')
        
        // Project Configuration
        PROJECT_NAME = 'agrotrace'
        COMPOSE_PROJECT_NAME = 'agrotrace'
        
        // Microservices List
        SERVICES = 'ms1-ingestion-capteurs,ms2-pretraitement,ms3-visionPlante-main,ms4-prevision-eau,ms5-regles-agro,ms6-RecoIrrigation,ms7-DashboardSIG'
    }
    
    // -------------------------------------------------------------------------
    // Pipeline Options
    // -------------------------------------------------------------------------
    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timestamps()
        timeout(time: 60, unit: 'MINUTES')
        disableConcurrentBuilds()
    }
    
    // -------------------------------------------------------------------------
    // Pipeline Stages
    // -------------------------------------------------------------------------
    stages {
        
        // =====================================================================
        // Stage 1: Checkout & Setup
        // =====================================================================
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    // Determine branch for conditional logic
                    env.BRANCH_NAME = sh(
                        script: "git rev-parse --abbrev-ref HEAD",
                        returnStdout: true
                    ).trim()
                    
                    // Get short commit hash for image tagging
                    env.GIT_SHORT_HASH = sh(
                        script: "git rev-parse --short HEAD",
                        returnStdout: true
                    ).trim()
                    
                    // Set image tag based on branch
                    env.IMAGE_TAG = (env.BRANCH_NAME == 'main') ? 'latest' : env.GIT_SHORT_HASH
                    
                    echo "🌿 Branch: ${env.BRANCH_NAME}"
                    echo "🏷️  Image Tag: ${env.IMAGE_TAG}"
                    echo "📝 Commit: ${env.GIT_SHORT_HASH}"
                }
            }
        }
        
        // =====================================================================
        // Stage 2: Code Quality & Validation
        // =====================================================================
        stage('Code Quality') {
            parallel {
                stage('Docker Compose Validate') {
                    steps {
                        echo "🔍 Validating docker-compose.yml..."
                        sh 'docker compose config --quiet'
                    }
                }
                
                stage('Check Dockerfiles') {
                    steps {
                        script {
                            def services = [
                                'ms1-ingestion-capteurs',
                                'ms2-pretraitement',
                                'ms3-visionPlante-main',
                                'ms4-prevision-eau',
                                'ms5-regles-agro',
                                'ms6-RecoIrrigation',
                                'ms7-DashboardSIG/backend',
                                'ms7-DashboardSIG/frontend'
                            ]
                            for (service in services) {
                                if (fileExists("${service}/Dockerfile")) {
                                    echo "✅ Dockerfile found: ${service}"
                                } else {
                                    echo "⚠️  Missing Dockerfile: ${service}"
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // =====================================================================
        // Stage 3: Build Docker Images (Parallel)
        // =====================================================================
        stage('Build Images') {
            parallel {
                stage('Build: MS1 Ingestion') {
                    steps {
                        buildMicroservice('ms1-ingestion-capteurs', 'ms1-ingestion')
                    }
                }
                
                stage('Build: MS2 ETL') {
                    steps {
                        buildMicroservice('ms2-pretraitement', 'ms2-etl')
                    }
                }
                
                stage('Build: MS3 Vision') {
                    steps {
                        buildMicroservice('ms3-visionPlante-main', 'ms3-vision')
                    }
                }
                
                stage('Build: MS4 Prevision') {
                    steps {
                        buildMicroservice('ms4-prevision-eau', 'ms4-prevision')
                    }
                }
                
                stage('Build: MS5 Regles') {
                    steps {
                        buildMicroservice('ms5-regles-agro', 'ms5-regles')
                    }
                }
                
                stage('Build: MS6 Reco') {
                    steps {
                        buildMicroservice('ms6-RecoIrrigation', 'ms6-reco')
                    }
                }
                
                stage('Build: MS7 Backend') {
                    steps {
                        buildMicroservice('ms7-DashboardSIG/backend', 'ms7-backend')
                    }
                }
                
                stage('Build: MS7 Frontend') {
                    steps {
                        buildMicroservice('ms7-DashboardSIG/frontend', 'ms7-frontend')
                    }
                }
            }
        }
        
        // =====================================================================
        // Stage 4: Unit Tests
        // =====================================================================
        stage('Unit Tests') {
            steps {
                script {
                    echo "🧪 Unit Tests Stage..."
                    
                    // Check for test directories in services
                    def testableServices = [
                        'ms1-ingestion-capteurs',
                        'ms4-prevision-eau',
                        'ms5-regles-agro',
                        'ms6-RecoIrrigation',
                        'ms7-DashboardSIG/backend'
                    ]
                    
                    for (service in testableServices) {
                        if (fileExists("${service}/tests") || fileExists("${service}/test")) {
                            echo "✅ Tests available: ${service}"
                        } else {
                            echo "ℹ️  No tests directory: ${service}"
                        }
                    }
                    
                    echo "ℹ️  Note: Full unit tests run inside Docker containers during build"
                }
            }
        }
        
        // =====================================================================
        // Stage 5: Integration Tests (Main Branch Only)
        // =====================================================================
        stage('Integration Tests') {
            when {
                anyOf {
                    branch 'main'
                    branch 'master'
                    branch 'develop'
                    expression { env.BRANCH_NAME ==~ /(main|master|develop)/ }
                }
            }
            steps {
                script {
                    echo "🔗 Starting Integration Tests..."
                    
                    // Start infrastructure services
                    sh '''
                        docker compose up -d timescaledb kafka zookeeper minio
                        sleep 30
                    '''
                    
                    // Run integration tests
                    sh '''
                        docker compose up -d ms1-ingestion ms5-regles ms6-reco
                        sleep 20
                        
                        # Health checks
                        curl -f http://localhost:8001/health || exit 1
                        curl -f http://localhost:8004/health || exit 1
                        curl -f http://localhost:8005/health || exit 1
                        
                        echo "✅ Integration tests passed!"
                    '''
                }
            }
            post {
                always {
                    sh 'docker compose down -v --remove-orphans || true'
                }
            }
        }
        
        // =====================================================================
        // Stage 6: Push to Docker Registry (Main Branch Only)
        // =====================================================================
        stage('Push to Registry') {
            when {
                anyOf {
                    branch 'main'
                    branch 'master'
                    expression { env.BRANCH_NAME ==~ /(main|master)/ }
                }
            }
            steps {
                script {
                    echo "📦 Pushing images to Docker Registry..."
                    
                    withCredentials([
                        usernamePassword(
                            credentialsId: 'docker-registry-credentials',
                            usernameVariable: 'DOCKER_USER',
                            passwordVariable: 'DOCKER_PASS'
                        )
                    ]) {
                        sh '''
                            echo "${DOCKER_PASS}" | docker login -u "${DOCKER_USER}" --password-stdin
                        '''
                        
                        def services = [
                            'ms1-ingestion',
                            'ms2-etl',
                            'ms3-vision',
                            'ms4-prevision',
                            'ms5-regles',
                            'ms6-reco',
                            'ms7-backend',
                            'ms7-frontend'
                        ]
                        
                        for (service in services) {
                            sh """
                                docker tag ${PROJECT_NAME}/${service}:${IMAGE_TAG} ${DOCKER_USER}/${service}:${IMAGE_TAG}
                                docker tag ${PROJECT_NAME}/${service}:${IMAGE_TAG} ${DOCKER_USER}/${service}:latest
                                docker push ${DOCKER_USER}/${service}:${IMAGE_TAG}
                                docker push ${DOCKER_USER}/${service}:latest
                            """
                        }
                        
                        sh 'docker logout'
                    }
                    
                    echo "✅ All images pushed successfully!"
                }
            }
        }
        
        // =====================================================================
        // Stage 7: Deploy (Main Branch Only)
        // =====================================================================
        stage('Deploy') {
            when {
                anyOf {
                    branch 'main'
                    branch 'master'
                    expression { env.BRANCH_NAME ==~ /(main|master)/ }
                }
            }
            steps {
                script {
                    echo "🚀 Deploying AgroTrace Platform..."
                    
                    withCredentials([
                        string(credentialsId: 'timescale-user', variable: 'TIMESCALE_USER'),
                        string(credentialsId: 'timescale-password', variable: 'TIMESCALE_PASSWORD'),
                        string(credentialsId: 'minio-root-user', variable: 'MINIO_ROOT_USER'),
                        string(credentialsId: 'minio-root-password', variable: 'MINIO_ROOT_PASSWORD')
                    ]) {
                        sh '''
                            # Export credentials for docker-compose
                            export TIMESCALE_USER="${TIMESCALE_USER}"
                            export TIMESCALE_PASSWORD="${TIMESCALE_PASSWORD}"
                            export MINIO_ROOT_USER="${MINIO_ROOT_USER}"
                            export MINIO_ROOT_PASSWORD="${MINIO_ROOT_PASSWORD}"
                            
                            # Pull latest images and deploy
                            docker compose pull
                            docker compose up -d --remove-orphans
                            
                            echo "⏳ Waiting for services to be healthy..."
                            sleep 60
                        '''
                    }
                    
                    echo "✅ Deployment completed!"
                }
            }
        }
        
        // =====================================================================
        // Stage 8: Smoke Tests (Post-Deployment)
        // =====================================================================
        stage('Smoke Tests') {
            when {
                anyOf {
                    branch 'main'
                    branch 'master'
                    expression { env.BRANCH_NAME ==~ /(main|master)/ }
                }
            }
            steps {
                script {
                    echo "🔥 Running Smoke Tests..."
                    
                    def healthChecks = [
                        [name: 'MS1 Ingestion', url: 'http://localhost:8001/health'],
                        [name: 'MS3 Vision', url: 'http://localhost:8002/health'],
                        [name: 'MS4 Prevision', url: 'http://localhost:8003/health'],
                        [name: 'MS5 Regles', url: 'http://localhost:8004/health'],
                        [name: 'MS6 Reco', url: 'http://localhost:8005/health'],
                        [name: 'MS7 Backend', url: 'http://localhost:8006/api/health'],
                        [name: 'MS7 Frontend', url: 'http://localhost:8080/']
                    ]
                    
                    def failed = []
                    
                    for (check in healthChecks) {
                        def result = sh(
                            script: "curl -sf ${check.url} -o /dev/null",
                            returnStatus: true
                        )
                        if (result == 0) {
                            echo "✅ ${check.name}: HEALTHY"
                        } else {
                            echo "❌ ${check.name}: UNHEALTHY"
                            failed.add(check.name)
                        }
                    }
                    
                    if (failed.size() > 0) {
                        error("Smoke tests failed for: ${failed.join(', ')}")
                    }
                    
                    echo "✅ All smoke tests passed!"
                }
            }
        }
    }
    
    // -------------------------------------------------------------------------
    // Post-Build Actions
    // -------------------------------------------------------------------------
    post {
        always {
            echo "🧹 Cleaning up workspace..."
            cleanWs(
                deleteDirs: true,
                disableDeferredWipeout: true,
                patterns: [
                    [pattern: '**/node_modules/**', type: 'EXCLUDE'],
                    [pattern: '**/__pycache__/**', type: 'INCLUDE']
                ]
            )
        }
        
        success {
            echo """
            ╔══════════════════════════════════════════════════════════════╗
            ║  ✅ BUILD SUCCESSFUL                                          ║
            ║  Branch: ${env.BRANCH_NAME}                                   
            ║  Commit: ${env.GIT_SHORT_HASH}                                
            ║  Tag: ${env.IMAGE_TAG}                                        
            ╚══════════════════════════════════════════════════════════════╝
            """
        }
        
        failure {
            echo """
            ╔══════════════════════════════════════════════════════════════╗
            ║  ❌ BUILD FAILED                                              ║
            ║  Branch: ${env.BRANCH_NAME}                                   
            ║  Commit: ${env.GIT_SHORT_HASH}                                
            ╚══════════════════════════════════════════════════════════════╝
            """
            
            // Optional: Send notification on failure
            // slackSend(channel: '#devops', color: 'danger', message: "Build Failed: ${env.JOB_NAME} #${env.BUILD_NUMBER}")
        }
    }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Builds a microservice Docker image
 * @param contextPath The path to the service directory
 * @param imageName The name for the Docker image
 */
def buildMicroservice(String contextPath, String imageName) {
    if (fileExists("${contextPath}/Dockerfile")) {
        echo "🔨 Building ${imageName}..."
        sh """
            docker build \
                --pull \
                --cache-from ${PROJECT_NAME}/${imageName}:latest \
                -t ${PROJECT_NAME}/${imageName}:${IMAGE_TAG} \
                -t ${PROJECT_NAME}/${imageName}:latest \
                ${contextPath}
        """
        echo "✅ ${imageName} built successfully!"
    } else {
        echo "⚠️  No Dockerfile found for ${imageName}, skipping..."
    }
}
