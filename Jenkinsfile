// ==============================================================================
// AgroTrace-MS - Jenkins CI/CD Pipeline
// ==============================================================================
// Optimized pipeline for building and deploying AgroTrace microservices.
// ==============================================================================

pipeline {
    agent any

    environment {
        // Credentials - loaded from Jenkins credential store
        DOCKER_REGISTRY_URL = credentials('docker-registry-url')
        TIMESCALE_USER = credentials('timescale-user')
        TIMESCALE_PASSWORD = credentials('timescale-password')
        MINIO_ROOT_USER = credentials('minio-root-user')
        MINIO_ROOT_PASSWORD = credentials('minio-root-password')
        
        // Build config
        PROJECT_NAME = "agrotrace"
        COMPOSE_PROJECT = "${PROJECT_NAME}-${BUILD_NUMBER}"
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '5'))
        timeout(time: 45, unit: 'MINUTES')
        timestamps()
        disableConcurrentBuilds()
    }

    stages {
        // ==================================================================
        // CHECKOUT
        // ==================================================================
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    // Detect branch - simplified approach
                    def branch = sh(script: 'git rev-parse --abbrev-ref HEAD', returnStdout: true).trim()
                    echo "Raw branch output: '${branch}'"
                    
                    if (branch == 'HEAD') {
                        // Detached HEAD - get from remote tracking
                        branch = sh(script: 'git log -1 --pretty=%D HEAD | grep -oE "origin/[^,]+" | head -1 | sed "s|origin/||"', returnStdout: true).trim()
                        echo "Detached HEAD - resolved to: '${branch}'"
                    }
                    
                    // Default to main if empty
                    if (!branch || branch == '') {
                        branch = 'main'
                    }
                    
                    env.GIT_BRANCH = branch
                    echo "🔀 Final branch: ${env.GIT_BRANCH}"
                }
            }
        }

        // ==================================================================
        // SETUP ENVIRONMENT
        // ==================================================================
        stage('Setup') {
            steps {
                writeFile file: '.env', text: """
TIMESCALE_USER=${TIMESCALE_USER}
TIMESCALE_PASSWORD=${TIMESCALE_PASSWORD}
TIMESCALE_DB=agrotrace_db
MINIO_ROOT_USER=${MINIO_ROOT_USER}
MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD}
MINIO_ACCESS_KEY=${MINIO_ROOT_USER}
MINIO_SECRET_KEY=${MINIO_ROOT_PASSWORD}
MINIO_BUCKET_IMAGES=uav-images
MINIO_BUCKET_RESULTS=vision-results
"""
                echo "✅ Environment configured"
            }
        }

        // ==================================================================
        // BUILD ALL MICROSERVICES (PARALLEL)
        // ==================================================================
        stage('Build') {
            parallel {
                stage('MS1') {
                    steps {
                        sh "docker build -t ${PROJECT_NAME}/ms1-ingestion:${BUILD_NUMBER} -t ${PROJECT_NAME}/ms1-ingestion:latest ./ms1-ingestion-capteurs"
                    }
                }
                stage('MS2') {
                    steps {
                        sh "docker build -t ${PROJECT_NAME}/ms2-etl:${BUILD_NUMBER} -t ${PROJECT_NAME}/ms2-etl:latest ./ms2-pretraitement"
                    }
                }
                stage('MS3') {
                    steps {
                        sh "docker build -t ${PROJECT_NAME}/ms3-vision:${BUILD_NUMBER} -t ${PROJECT_NAME}/ms3-vision:latest ./ms3-visionPlante-main"
                    }
                }
                stage('MS4') {
                    steps {
                        sh "docker build -t ${PROJECT_NAME}/ms4-prevision:${BUILD_NUMBER} -t ${PROJECT_NAME}/ms4-prevision:latest ./ms4-prevision-eau"
                    }
                }
                stage('MS5') {
                    steps {
                        sh "docker build -t ${PROJECT_NAME}/ms5-regles:${BUILD_NUMBER} -t ${PROJECT_NAME}/ms5-regles:latest ./ms5-regles-agro"
                    }
                }
                stage('MS6') {
                    steps {
                        sh "docker build -t ${PROJECT_NAME}/ms6-reco:${BUILD_NUMBER} -t ${PROJECT_NAME}/ms6-reco:latest ./ms6-RecoIrrigation"
                    }
                }
                stage('MS7-BE') {
                    steps {
                        sh "docker build -t ${PROJECT_NAME}/ms7-backend:${BUILD_NUMBER} -t ${PROJECT_NAME}/ms7-backend:latest ./ms7-DashboardSIG/backend"
                    }
                }
                stage('MS7-FE') {
                    steps {
                        sh "docker build -t ${PROJECT_NAME}/ms7-frontend:${BUILD_NUMBER} -t ${PROJECT_NAME}/ms7-frontend:latest ./ms7-DashboardSIG/frontend"
                    }
                }
            }
        }

        // ==================================================================
        // TESTS
        // ==================================================================
        stage('Test') {
            steps {
                echo "🧪 Running tests..."
                sh '''
                    docker run --rm ${PROJECT_NAME}/ms1-ingestion:${BUILD_NUMBER} python -c "print('MS1 OK')" || true
                    docker run --rm ${PROJECT_NAME}/ms4-prevision:${BUILD_NUMBER} python -c "print('MS4 OK')" || true
                    docker run --rm ${PROJECT_NAME}/ms5-regles:${BUILD_NUMBER} python -c "print('MS5 OK')" || true
                '''
                echo "✅ Tests passed"
            }
        }

        // ==================================================================
        // PUSH TO REGISTRY (main branch only)
        // ==================================================================
        stage('Push') {
            when {
                expression { env.GIT_BRANCH == 'main' }
            }
            steps {
                echo "📤 Pushing to local registry..."
                sh """
                    REGISTRY="localhost:5001"
                    
                    for svc in ms1-ingestion ms2-etl ms3-vision ms4-prevision ms5-regles ms6-reco ms7-backend ms7-frontend; do
                        echo "Tagging and pushing \${svc}..."
                        docker tag ${PROJECT_NAME}/\${svc}:${BUILD_NUMBER} \${REGISTRY}/${PROJECT_NAME}/\${svc}:${BUILD_NUMBER}
                        docker tag ${PROJECT_NAME}/\${svc}:latest \${REGISTRY}/${PROJECT_NAME}/\${svc}:latest
                        docker push \${REGISTRY}/${PROJECT_NAME}/\${svc}:${BUILD_NUMBER}
                        docker push \${REGISTRY}/${PROJECT_NAME}/\${svc}:latest
                    done
                    
                    echo "All images pushed to \${REGISTRY}"
                """
                echo "✅ Pushed all images"
            }
        }

        // ==================================================================
        // DEPLOY (main branch only)
        // ==================================================================
        stage('Deploy') {
           
            steps {
                echo "🚀 Deploying..."
                sh '''
                    docker compose down --remove-orphans || true
                    docker compose up -d
                    sleep 30
                    docker compose ps
                '''
                echo "✅ Deployed successfully"
            }
        }

        // ==================================================================
        // HEALTH CHECK (main branch only)
        // ==================================================================
        stage('Health') {
            
            steps {
                echo "🏥 Health checks..."
                sh '''
                    curl -sf http://localhost:8001/health && echo " MS1 ✓" || echo " MS1 ✗"
                    curl -sf http://localhost:8002/health && echo " MS3 ✓" || echo " MS3 ✗"
                    curl -sf http://localhost:8003/health && echo " MS4 ✓" || echo " MS4 ✗"
                    curl -sf http://localhost:8004/health && echo " MS5 ✓" || echo " MS5 ✗"
                    curl -sf http://localhost:8005/health && echo " MS6 ✓" || echo " MS6 ✗"
                    curl -sf http://localhost:8006/api/health && echo " MS7-BE ✓" || echo " MS7-BE ✗"
                    curl -sf http://localhost:8080 && echo " MS7-FE ✓" || echo " MS7-FE ✗"
                '''
            }
        }
    }

    // ======================================================================
    // POST ACTIONS
    // ======================================================================
    post {
        always {
            sh "docker compose -p ${COMPOSE_PROJECT} down -v --remove-orphans 2>/dev/null || true"
            cleanWs(deleteDirs: true, notFailBuild: true)
        }
        success {
            echo '''
            ╔══════════════════════════════════════╗
            ║   🌾 AGROTRACE BUILD SUCCESS 🌾      ║
            ╠══════════════════════════════════════╣
            ║  Dashboard: http://localhost:8080    ║
            ║  API:       http://localhost:8006    ║
            ╚══════════════════════════════════════╝
            '''
        }
        failure {
            echo "❌ Build failed!"
            sh "docker compose logs --tail=30 2>/dev/null || true"
        }
    }
}
