#!/bin/bash

# Script para build de produção

echo "🔨 Iniciando build de produção..."

# Build Backend
echo "📦 Building backend..."
cd backend
npm install
npm run build
cd ..

# Build Frontend
echo "📦 Building frontend..."
cd frontend
npm install
npm run build
cd ..

echo "✅ Build concluído com sucesso!"
echo "📁 Backend: backend/dist"
echo "📁 Frontend: frontend/.next"
