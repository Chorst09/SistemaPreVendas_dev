#!/bin/bash

# Script para iniciar desenvolvimento local

echo "🚀 Iniciando Sistema de Prevendas em desenvolvimento..."

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Inicie o Docker e tente novamente."
    exit 1
fi

# Criar arquivos .env se não existirem
if [ ! -f backend/.env ]; then
    echo "📝 Criando backend/.env..."
    cp backend/.env.example backend/.env
fi

if [ ! -f frontend/.env.local ]; then
    echo "📝 Criando frontend/.env.local..."
    cp frontend/.env.example frontend/.env.local
fi

# Iniciar Docker Compose
echo "🐳 Iniciando containers..."
docker-compose up --build

echo "✅ Sistema iniciado!"
echo "📱 Frontend: http://localhost:3000"
echo "🔌 Backend: http://localhost:3001"
echo "🗄️  Database: localhost:5432"
