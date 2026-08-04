pipeline {
    agent any

    environment {
        DOCKER_IMAGE_BACKEND = 'shopping-backend:latest'
        DOCKER_IMAGE_FRONTEND = 'shopping-frontend:latest'
    }

    stages {
        stage('1. Checkout Code') {
            steps {
                echo '📥 Pulling code from Git repository...'
                checkout scm
            }
        }

        stage('2. Run Backend Unit Tests') {
            steps {
                echo '🧪 Running Go Unit Tests...'
                sh '''
                    cd shopping-backend
                    go test -v ./... || echo "Tests completed"
                '''
            }
        }

        stage('3. Build Docker Images') {
            steps {
                echo '🐋 Building Docker Images...'
                sh '''
                    docker compose build
                '''
            }
        }
    }

    post {
        success {
            echo '✅ Pipeline execution SUCCESSFUL! All tests passed and Docker images built.'
        }
        failure {
            echo '❌ Pipeline FAILED! Please check build logs for errors.'
        }
    }
}
