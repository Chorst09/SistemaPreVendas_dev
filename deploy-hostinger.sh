#!/bin/bash

# Script de Deploy para Hostinger KVM
# Sistema de Prevendas - prevendas.chorstconsult.com.br

set -e

echo "🚀 Iniciando deploy para Hostinger..."

# Configurações
SERVER_USER="root"
SERVER_HOST="72.60.195.200"
SERVER_PATH="/var/www/prevendas"
DOMAIN="prevendas.chorstconsult.com.br"

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📦 Preparando arquivos para deploy...${NC}"

# Criar arquivo docker-compose para produção
cat > docker-compose.prod.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: prevendas-db
    restart: always
    environment:
      POSTGRES_USER: prevendas
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: sistema_prevendas
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - prevendas-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U prevendas"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: prevendas-backend
    restart: always
    environment:
      NODE_ENV: production
      PORT: 3001
      DATABASE_URL: postgresql://prevendas:${DB_PASSWORD}@postgres:5432/sistema_prevendas
      CORS_ORIGIN: https://prevendas.chorstconsult.com.br
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - prevendas-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    container_name: prevendas-frontend
    restart: always
    environment:
      NEXT_PUBLIC_API_URL: https://prevendas.chorstconsult.com.br/api
    depends_on:
      - backend
    networks:
      - prevendas-network

  nginx:
    image: nginx:alpine
    container_name: prevendas-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - certbot-data:/var/www/certbot
    depends_on:
      - frontend
      - backend
    networks:
      - prevendas-network

  certbot:
    image: certbot/certbot
    container_name: prevendas-certbot
    volumes:
      - ./ssl:/etc/letsencrypt
      - certbot-data:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"

volumes:
  postgres_data:
  certbot-data:

networks:
  prevendas-network:
    driver: bridge
EOF

echo -e "${GREEN}✅ docker-compose.prod.yml criado${NC}"

# Criar Dockerfile de produção para backend
cat > backend/Dockerfile.prod << 'EOF'
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/src/db ./src/db

ENV NODE_ENV=production
EXPOSE 3001

CMD ["npm", "start"]
EOF

echo -e "${GREEN}✅ Backend Dockerfile.prod criado${NC}"

# Criar Dockerfile de produção para frontend
cat > frontend/Dockerfile.prod << 'EOF'
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/package.json ./

EXPOSE 3000

CMD ["node", "server.js"]
EOF

echo -e "${GREEN}✅ Frontend Dockerfile.prod criado${NC}"

# Criar configuração Nginx
cat > nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server frontend:3000;
    }

    upstream backend {
        server backend:3001;
    }

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name prevendas.chorstconsult.com.br;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$host$request_uri;
        }
    }

    # HTTPS Server
    server {
        listen 443 ssl http2;
        server_name prevendas.chorstconsult.com.br;

        ssl_certificate /etc/nginx/ssl/live/prevendas.chorstconsult.com.br/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/live/prevendas.chorstconsult.com.br/privkey.pem;

        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        client_max_body_size 50M;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Backend API
        location /api {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
EOF

echo -e "${GREEN}✅ nginx.conf criado${NC}"

# Criar arquivo .env de produção
cat > .env.production << 'EOF'
# Database
DB_PASSWORD=PrevendasSecure2025!

# Backend
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://prevendas.chorstconsult.com.br

# Frontend
NEXT_PUBLIC_API_URL=https://prevendas.chorstconsult.com.br/api
NEXT_PUBLIC_APP_NAME=Sistema de Prevendas
EOF

echo -e "${GREEN}✅ .env.production criado${NC}"

echo -e "${YELLOW}📤 Enviando arquivos para o servidor...${NC}"

# Criar diretório no servidor
ssh ${SERVER_USER}@${SERVER_HOST} "mkdir -p ${SERVER_PATH}"

# Enviar arquivos (excluindo node_modules e arquivos desnecessários)
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude 'dist' \
  --exclude '.git' \
  --exclude '.env.local' \
  --exclude '.DS_Store' \
  ./ ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/

echo -e "${GREEN}✅ Arquivos enviados${NC}"

echo -e "${YELLOW}🔧 Configurando servidor...${NC}"

# Executar comandos no servidor
ssh ${SERVER_USER}@${SERVER_HOST} << 'ENDSSH'
cd /var/www/prevendas

# Instalar Docker e Docker Compose se necessário
if ! command -v docker &> /dev/null; then
    echo "Instalando Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
fi

if ! command -v docker-compose &> /dev/null; then
    echo "Instalando Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Parar containers antigos se existirem
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

# Obter certificado SSL (primeira vez)
if [ ! -d "./ssl/live/prevendas.chorstconsult.com.br" ]; then
    echo "Obtendo certificado SSL..."
    docker run -it --rm \
        -v $(pwd)/ssl:/etc/letsencrypt \
        -v $(pwd)/certbot-data:/var/www/certbot \
        certbot/certbot certonly --webroot \
        --webroot-path=/var/www/certbot \
        --email admin@chorstconsult.com.br \
        --agree-tos \
        --no-eff-email \
        -d prevendas.chorstconsult.com.br
fi

# Build e iniciar containers
echo "Iniciando containers..."
docker-compose -f docker-compose.prod.yml up -d --build

# Aguardar backend iniciar
echo "Aguardando backend iniciar..."
sleep 10

# Executar migrações do banco
echo "Executando migrações do banco..."
docker exec prevendas-backend npm run migrate:prod

echo "✅ Deploy concluído!"
echo "🌐 Aplicação disponível em: https://prevendas.chorstconsult.com.br"

ENDSSH

echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
echo -e "${GREEN}🌐 Aplicação disponível em: https://${DOMAIN}${NC}"
