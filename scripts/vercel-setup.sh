#!/bin/bash

# Script para configurar Vercel com Neon PostgreSQL

set -e

echo "🚀 Setup Vercel + Neon PostgreSQL"
echo "=================================="

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar se Vercel CLI está instalado
echo -e "${BLUE}1. Verificando Vercel CLI...${NC}"
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Vercel CLI não encontrado. Instalando...${NC}"
    npm install -g vercel
fi
echo -e "${GREEN}✓ Vercel CLI instalado${NC}"

# 2. Fazer login no Vercel
echo -e "${BLUE}2. Fazendo login no Vercel...${NC}"
vercel login
echo -e "${GREEN}✓ Login realizado${NC}"

# 3. Link do projeto
echo -e "${BLUE}3. Linkando projeto ao Vercel...${NC}"
cd frontend
vercel link
cd ..
echo -e "${GREEN}✓ Projeto linkado${NC}"

# 4. Solicitar credenciais do Neon
echo -e "${BLUE}4. Configurando variáveis de ambiente...${NC}"
echo ""
echo "Você precisa das credenciais do Neon. Acesse:"
echo "https://console.neon.tech"
echo ""

read -p "Digite o DATABASE_URL do Neon: " DATABASE_URL
read -p "Digite o PGHOST: " PGHOST
read -p "Digite o PGUSER: " PGUSER
read -s -p "Digite o PGPASSWORD: " PGPASSWORD
echo ""
read -p "Digite o PGDATABASE: " PGDATABASE
read -p "Digite o NEXT_PUBLIC_API_URL (ex: https://seu-projeto.vercel.app/api): " API_URL

# 5. Adicionar variáveis ao Vercel
echo -e "${BLUE}5. Adicionando variáveis ao Vercel...${NC}"

cd frontend

vercel env add DATABASE_URL <<< "$DATABASE_URL"
vercel env add PGHOST <<< "$PGHOST"
vercel env add PGPORT <<< "5432"
vercel env add PGUSER <<< "$PGUSER"
vercel env add PGPASSWORD <<< "$PGPASSWORD"
vercel env add PGDATABASE <<< "$PGDATABASE"
vercel env add DATABASE_URL_UNPOOLED <<< "$DATABASE_URL"
vercel env add NEXT_PUBLIC_API_URL <<< "$API_URL"
vercel env add NEXT_PUBLIC_APP_NAME <<< "Sistema de Prevendas"

echo -e "${GREEN}✓ Variáveis adicionadas${NC}"

# 6. Gerar Prisma Client
echo -e "${BLUE}6. Gerando Prisma Client...${NC}"
npx prisma generate
echo -e "${GREEN}✓ Prisma Client gerado${NC}"

# 7. Executar migrações
echo -e "${BLUE}7. Executando migrações...${NC}"
npx prisma migrate deploy
echo -e "${GREEN}✓ Migrações executadas${NC}"

cd ..

# 8. Deploy
echo -e "${BLUE}8. Fazendo deploy no Vercel...${NC}"
cd frontend
vercel --prod
cd ..

echo ""
echo -e "${GREEN}=================================="
echo "✅ Setup concluído com sucesso!"
echo "==================================${NC}"
echo ""
echo "Próximos passos:"
echo "1. Acesse: https://seu-projeto.vercel.app"
echo "2. Verifique os logs: vercel logs"
echo "3. Teste a conexão: npx prisma studio"
echo ""
