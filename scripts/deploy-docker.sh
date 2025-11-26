#!/bin/bash

# Script para deploy com Docker

set -e

echo "🚀 Iniciando deploy com Docker..."

# Variáveis
REGISTRY="${DOCKER_REGISTRY:-docker.io}"
BACKEND_IMAGE="sistema-prevendas-backend:latest"
FRONTEND_IMAGE="sistema-prevendas-frontend:latest"

# Build images
echo "🔨 Building Docker images..."
docker build -t $BACKEND_IMAGE ./backend
docker build -t $FRONTEND_IMAGE ./frontend

# Tag images (opcional, para registry)
if [ ! -z "$DOCKER_REGISTRY" ]; then
    echo "🏷️  Tagging images..."
    docker tag $BACKEND_IMAGE $REGISTRY/$BACKEND_IMAGE
    docker tag $FRONTEND_IMAGE $REGISTRY/$FRONTEND_IMAGE
    
    echo "📤 Pushing images..."
    docker push $REGISTRY/$BACKEND_IMAGE
    docker push $REGISTRY/$FRONTEND_IMAGE
fi

echo "✅ Deploy concluído!"
echo "🐳 Backend image: $BACKEND_IMAGE"
echo "🐳 Frontend image: $FRONTEND_IMAGE"
