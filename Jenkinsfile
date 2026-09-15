pipeline {
    agent any

    environment {
        DOCKER_IMAGE_BACKEND = 'shopping-backend:latest'
        DOCKER_IMAGE_FRONTEND = 'shopping-frontend:latest'
        GOPATH = '/var/jenkins_home/go'
    }

    stages {
        stage('1. Run Backend Unit Tests') {
            steps {
                echo '🧪 Running Go Unit Tests...'
                sh '''
                    cd shopping-backend
                    go test -v ./tests/...
                '''
            }
        }

        stage('2. Build Docker Images') {
            steps {
                echo '🐋 Building Application Docker Images...'
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
