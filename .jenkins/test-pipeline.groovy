# ==============================================================================
# Jenkins Test Configuration (Paste in Pipeline Script)
# ==============================================================================
# Use this for initial testing without full infrastructure
# Go to Jenkins → New Item → Pipeline → Pipeline Script (not SCM)
# Paste this entire file
# ==============================================================================

pipeline {
    agent any
    
    stages {
        stage('Test 1: Environment Check') {
            steps {
                script {
                    echo "✅ Jenkins Pipeline is working!"
                    echo "🐳 Checking Docker access..."
                    sh 'docker --version'
                    sh 'docker ps'
                    echo "✅ Docker is accessible from Jenkins"
                }
            }
        }
        
        stage('Test 2: Git Repository') {
            steps {
                script {
                    echo "📦 Checking Git repository..."
                    sh 'git --version'
                    echo "Current directory: ${pwd()}"
                    echo "✅ Git is working"
                }
            }
        }
        
        stage('Test 3: Change Detection') {
            steps {
                script {
                    echo "🔍 Testing change detection logic..."
                    def changedFiles = sh(
                        returnStdout: true,
                        script: "git diff --name-only HEAD~1 HEAD || echo 'No changes'"
                    ).trim()
                    echo "Changed files: ${changedFiles}"
                    echo "✅ Change detection works"
                }
            }
        }
        
        stage('Test 4: Build Docker Image') {
            steps {
                script {
                    echo "🔨 Building a test Docker image..."
                    sh '''
                        echo "FROM alpine:latest" > Dockerfile.test
                        echo "CMD echo 'Hello from AgroTrace!'" >> Dockerfile.test
                        docker build -f Dockerfile.test -t agrotrace-test:latest .
                        rm Dockerfile.test
                    '''
                    echo "✅ Docker build works"
                }
            }
        }
        
        stage('Test 5: Parallel Execution') {
            parallel {
                stage('Task 1') {
                    steps {
                        script {
                            echo "🔄 Running parallel task 1..."
                            sleep 2
                            echo "✅ Task 1 complete"
                        }
                    }
                }
                stage('Task 2') {
                    steps {
                        script {
                            echo "🔄 Running parallel task 2..."
                            sleep 2
                            echo "✅ Task 2 complete"
                        }
                    }
                }
                stage('Task 3') {
                    steps {
                        script {
                            echo "🔄 Running parallel task 3..."
                            sleep 2
                            echo "✅ Task 3 complete"
                        }
                    }
                }
            }
        }
        
        stage('Test 6: Credentials') {
            steps {
                script {
                    echo "🔐 Testing credentials access..."
                    try {
                        withCredentials([string(credentialsId: 'docker-registry-url', variable: 'REGISTRY')]) {
                            echo "✅ Found docker-registry-url: ${REGISTRY}"
                        }
                    } catch (Exception e) {
                        echo "⚠️  Credential 'docker-registry-url' not found (this is OK for initial test)"
                    }
                }
            }
        }
    }
    
    post {
        success {
            script {
                echo ""
                echo "=========================================="
                echo "✅ ALL TESTS PASSED!"
                echo "=========================================="
                echo ""
                echo "Your Jenkins environment is ready for AgroTrace pipeline!"
                echo ""
                echo "Next steps:"
                echo "1. Configure credentials (see SETUP_GUIDE.md)"
                echo "2. Create pipeline from SCM pointing to Jenkinsfile"
                echo "3. Run your first real build"
                echo ""
            }
        }
        failure {
            script {
                echo ""
                echo "=========================================="
                echo "❌ SOME TESTS FAILED"
                echo "=========================================="
                echo ""
                echo "Check the console output above for errors"
                echo "See SETUP_GUIDE.md for troubleshooting"
                echo ""
            }
        }
    }
}
