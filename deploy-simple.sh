#!/bin/bash

# Script de Deploy Simplificado para Hostinger
# Execute este script localmente: bash deploy-simple.sh

set -e

SERVER="root@72.60.195.200"
DEPLOY_PATH="/var/www/prevendas"
DOMAIN="prevendas.chorstconsult.com.br"

echo "🚀 Iniciando deploy para $DOMAIN..."

# Criar diretório temporário para arquivos de deploy
mkdir -p .deploy-temp

# Copiar arquivos necessários
echo "📦 Preparando arquivos..."
rsync -a --exclude='node_modules' --exclude='.next' --exclude='dist' --exclude='.git' \
  backend/ .deploy-temp/backend/
rsync -a --exclude='node_modules' --exclude='.next' --exclude='dist' --exclude='.git' \
  frontend/ .deploy-temp/frontend/

# Criar docker-compose de produção
cat > .deploy-temp/docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: prevendas-db
    restart: always
    environment:
      POSTGRES_USER: prevendas
      POSTGRES_PASSWORD: PrevendasSecure2025!
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
      dockerfile: Dockerfile
    container_name: prevendas-backend
    restart: always
    environment:
      NODE_ENV: production
      PORT: 3001
      DATABASE_URL: postgresql://prevendas:PrevendasSecure2025!@postgres:5432/sistema_prevendas
      CORS_ORIGIN: https://prevendas.chorstconsult.com.br
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - prevendas-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: prevendas-frontend
    restart: always
    environment:
      NEXT_PUBLIC_API_URL: https://prevendas.chorstconsult.com.br/api
      NODE_ENV: production
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
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - certbot-www:/var/www/certbot
    depends_on:
      - frontend
      - backend
    networks:
      - prevendas-network

volumes:
  postgres_data:
  certbot-www:

networks:
  prevendas-network:
    driver: bridge
EOF

# Criar Dockerfile para backend
cat > .deploy-temp/backend/Dockerfile << 'EOF'
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
EOF

# Criar Dockerfile para frontend
cat > .deploy-temp/frontend/Dockerfile << 'EOF'
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
EOF

# Criar configuração Nginx
cat > .deploy-temp/nginx.conf << 'EOF'
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

    server {
        listen 443 ssl http2;
        server_name prevendas.chorstconsult.com.br;

        ssl_certificate /etc/letsencrypt/live/prevendas.chorstconsult.com.br/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/prevendas.chorstconsult.com.br/privkey.pem;

        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_prefer_server_ciphers on;

        client_max_body_size 50M;

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

        location /api {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
EOF

# Criar script de setup no servidor
cat > .deploy-temp/setup-server.sh << 'EOF'
#!/bin/bash
set -e

echo "🔧 Configurando servidor..."

# Instalar Docker se necessário
if ! command -v docker &> /dev/null; then
    echo "Instalando Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
    rm get-docker.sh
fi

# Instalar Docker Compose se necessário
if ! command -v docker-compose &> /dev/null; then
    echo "Instalando Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Instalar Certbot se necessário
if ! command -v certbot &> /dev/null; then
    echo "Instalando Certbot..."
    apt-get update
    apt-get install -y certbot
fi

# Obter certificado SSL se não existir
if [ ! -d "/etc/letsencrypt/live/prevendas.chorstconsult.com.br" ]; then
    echo "Obtendo certificado SSL..."
    certbot certonly --standalone \
        --preferred-challenges http \
        --email admin@chorstconsult.com.br \
        --agree-tos \
        --no-eff-email \
        -d prevendas.chorstconsult.com.br
fi

cd /var/www/prevendas

# Parar containers antigos
docker-compose down 2>/dev/null || true

# Build e iniciar
echo "🚀 Iniciando aplicação..."
docker-compose up -d --build

# Aguardar backend
echo "⏳ Aguardando backend iniciar..."
sleep 15

# Executar migrações
echo "📊 Executando migrações do banco..."
docker exec prevendas-backend npx prisma migrate deploy 2>/dev/null || echo "Migrações já aplicadas"

echo "✅ Deploy concluído!"
echo "🌐 Aplicação disponível em: https://prevendas.chorstconsult.com.br"
EOF

chmod +x .deploy-temp/setup-server.sh

echo "📤 Enviando arquivos para o servidor..."
ssh $SERVER "mkdir -p $DEPLOY_PATH"
rsync -avz --progress .deploy-temp/ $SERVER:$DEPLOY_PATH/

echo "🔧 Executando setup no servidor..."
ssh $SERVER "bash $DEPLOY_PATH/setup-server.sh"

# Limpar arquivos temporários
rm -rf .deploy-temp

echo ""
echo "✅ Deploy concluído com sucesso!"
echo "🌐 Acesse: https://$DOMAIN"
echo ""
echo "📝 Comandos úteis:"
echo "  Ver logs: ssh $SERVER 'cd $DEPLOY_PATH && docker-compose logs -f'"
echo "  Reiniciar: ssh $SERVER 'cd $DEPLOY_PATH && docker-compose restart'"
echo "  Parar: ssh $SERVER 'cd $DEPLOY_PATH && docker-compose down'"
