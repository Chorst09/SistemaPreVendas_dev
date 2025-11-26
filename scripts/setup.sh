#!/bin/bash

# Script de setup inicial do projeto

set -e

echo "🚀 Setup do Sistema de Prevendas"
echo "=================================="

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Verificar pré-requisitos
echo -e "${BLUE}1. Verificando pré-requisitos...${NC}"

if ! command -v node &> /dev/null; then
    echo "❌ Node.js não está instalado"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm não está instalado"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v)${NC}"
echo -e "${GREEN}✓ npm $(npm -v)${NC}"

# 2. Criar arquivos .env
echo -e "${BLUE}2. Configurando variáveis de ambiente...${NC}"

if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo -e "${GREEN}✓ backend/.env criado${NC}"
else
    echo -e "${GREEN}✓ backend/.env já existe${NC}"
fi

if [ ! -f frontend/.env.local ]; then
    cp frontend/.env.example frontend/.env.local
    echo -e "${GREEN}✓ frontend/.env.local criado${NC}"
else
    echo -e "${GREEN}✓ frontend/.env.local já existe${NC}"
fi

# 3. Instalar dependências
echo -e "${BLUE}3. Instalando dependências...${NC}"

echo "📦 Backend..."
cd backend
npm install
cd ..
echo -e "${GREEN}✓ Backend instalado${NC}"

echo "📦 Frontend..."
cd frontend
npm install
cd ..
echo -e "${GREEN}✓ Frontend instalado${NC}"

# 4. Criar estrutura de pastas
echo -e "${BLUE}4. Criando estrutura de pastas...${NC}"

mkdir -p frontend/src/app
mkdir -p frontend/src/components
mkdir -p frontend/src/hooks
mkdir -p frontend/src/lib
mkdir -p frontend/src/styles
mkdir -p backend/src/routes
mkdir -p backend/src/middleware
mkdir -p backend/src/services
mkdir -p backend/src/db

echo -e "${GREEN}✓ Estrutura criada${NC}"

# 5. Resumo
echo ""
echo -e "${GREEN}=================================="
echo "✅ Setup concluído com sucesso!"
echo "==================================${NC}"
echo ""
echo "📝 Próximos passos:"
echo ""
echo "1. Configure as variáveis de ambiente:"
echo "   - backend/.env"
echo "   - frontend/.env.local"
echo ""
echo "2. Inicie o desenvolvimento:"
echo "   ./scripts/dev.sh"
echo ""
echo "3. Ou use Docker Compose:"
echo "   docker-compose up --build"
echo ""
echo "📚 Documentação:"
echo "   - docs/ARCHITECTURE.md"
echo "   - docs/DEPLOYMENT-GUIDE.md"
echo "   - docs/API.md"
echo ""
