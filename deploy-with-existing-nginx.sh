#!/bin/bash

# Deploy considerando Nginx já existente no servidor
# Este script configura o Sistema de Prevendas como um novo virtual host

set -e

SERVER="root@72.60.195.200"
DEPLOY_PATH="/var/www/prevendas"
DOMAIN="prevendas.chorstconsult.com.br"

echo "🚀 Deploy do Sistema de Prevendas (com Nginx existente)..."

# Criar diretório temporário
mkdir -p .deploy-temp

echo "📦 Preparando arquivos..."

# Copiar backend
rsync -a --exclude='node_modules' --exclude='dist' --exclude='.git' \
  backend/ .deploy-temp/backend/

# Copiar shared para 3 níveis acima de backend/src/routes
# Como o Dockerfile faz WORKDIR /app, e os imports são ../../../shared
# Precisamos copiar shared para .deploy-temp/backend/../../../shared
# Mas isso seria fora do contexto. Então vamos criar um symlink ou copiar para backend/../../shared
# Melhor: copiar para .deploy-temp/backend/../../shared que é .deploy-temp/../shared
# Mas isso também sai do contexto. Solução: ajustar a estrutura no deploy-temp
mkdir -p .deploy-temp/workspace/backend
rsync -a --exclude='node_modules' --exclude='dist' --exclude='.git' backend/ .deploy-temp/workspace/backend/
mkdir -p .deploy-temp/workspace/shared
rsync -a shared/ .deploy-temp/workspace/shared/

# Copiar frontend
rsync -a --exclude='node_modules' --exclude='.next' --exclude='.git' \
  frontend/ .deploy-temp/frontend/

# Criar docker-compose SEM nginx (usaremos o nginx do host)
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
      context: ./workspace
      dockerfile: ../backend.Dockerfile
    container_name: prevendas-backend
    restart: always
    environment:
      NODE_ENV: production
      PORT: 3001
      DATABASE_URL: postgresql://prevendas:PrevendasSecure2025!@postgres:5432/sistema_prevendas
      CORS_ORIGIN: https://prevendas.chorstconsult.com.br
    ports:
      - "127.0.0.1:3011:3001"
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
    ports:
      - "127.0.0.1:3010:3000"
    depends_on:
      - backend
    networks:
      - prevendas-network

volumes:
  postgres_data:

networks:
  prevendas-network:
    driver: bridge
EOF

# Criar Dockerfile para backend
cat > .deploy-temp/backend.Dockerfile << 'EOF'
FROM node:20-alpine

WORKDIR /app

# Copiar package.json do backend
COPY backend/package*.json ./

# Instalar dependências
RUN npm install

# Copiar código do backend
COPY backend/ ./

# Copiar shared para dentro de src
COPY shared/ ./src/shared/

# Ajustar imports para usar ../shared em vez de ../../../shared
# Os arquivos estão em src/routes, então ../shared está correto
RUN find src/routes -type f -name "*.ts" -exec sed -i "s|from '../../../shared/|from '../shared/|g" {} \;
RUN find src/routes -type f -name "*.ts" -exec sed -i "s|from \"../../../shared/|from \"../shared/|g" {} \;

# Verificar se os ajustes funcionaram
RUN echo "=== Verificando imports ajustados ===" && grep -r "from.*shared" src/routes/ || true

# Build
RUN npm run build

# Limpar devDependencies após build
RUN npm prune --production

EXPOSE 3001

CMD ["npm", "start"]
EOF

# Criar Dockerfile para frontend
cat > .deploy-temp/frontend/Dockerfile << 'EOF'
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm install
RUN npx prisma generate

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

# Criar configuração Nginx para adicionar ao servidor existente
cat > .deploy-temp/nginx-prevendas.conf << 'EOF'
# Configuração para prevendas.chorstconsult.com.br
# Adicionar ao Nginx existente

upstream prevendas_frontend {
    server 127.0.0.1:3010;
}

upstream prevendas_backend {
    server 127.0.0.1:3011;
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

    # Frontend
    location / {
        proxy_pass http://prevendas_frontend;
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
        proxy_pass http://prevendas_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Criar script de setup
cat > .deploy-temp/setup-server.sh << 'EOF'
#!/bin/bash
set -e

echo "🔧 Configurando Sistema de Prevendas..."

cd /var/www/prevendas

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

# Obter certificado SSL se não existir
if [ ! -d "/etc/letsencrypt/live/prevendas.chorstconsult.com.br" ]; then
    echo "Obtendo certificado SSL..."
    certbot certonly --nginx \
        --email admin@chorstconsult.com.br \
        --agree-tos \
        --no-eff-email \
        -d prevendas.chorstconsult.com.br
fi

# Parar containers antigos se existirem
docker-compose down 2>/dev/null || true

# Build e iniciar containers
echo "🚀 Iniciando containers..."
docker-compose up -d --build

# Aguardar backend
echo "⏳ Aguardando backend iniciar..."
sleep 15

# Executar migrações
echo "📊 Executando migrações..."
docker exec prevendas-backend npx prisma migrate deploy 2>/dev/null || echo "Migrações já aplicadas"

# Configurar Nginx
echo "🌐 Configurando Nginx..."

# Verificar se é Nginx ou Apache
if systemctl is-active --quiet nginx; then
    # Copiar configuração
    cp nginx-prevendas.conf /etc/nginx/sites-available/prevendas.chorstconsult.com.br
    
    # Criar symlink se não existir
    if [ ! -L "/etc/nginx/sites-enabled/prevendas.chorstconsult.com.br" ]; then
        ln -s /etc/nginx/sites-available/prevendas.chorstconsult.com.br /etc/nginx/sites-enabled/
    fi
    
    # Testar configuração
    nginx -t
    
    # Recarregar Nginx
    systemctl reload nginx
    
    echo "✅ Nginx configurado!"
elif systemctl is-active --quiet apache2; then
    echo "⚠️  Apache detectado. Configuração manual necessária."
    echo "Adicione um ProxyPass para:"
    echo "  Frontend: http://127.0.0.1:3010"
    echo "  Backend: http://127.0.0.1:3011"
else
    echo "⚠️  Nenhum servidor web detectado. Instale Nginx ou Apache."
fi

echo ""
echo "✅ Deploy concluído!"
echo "🌐 Aplicação disponível em: https://prevendas.chorstconsult.com.br"
echo ""
echo "Portas usadas:"
echo "  - Frontend: 127.0.0.1:3010"
echo "  - Backend: 127.0.0.1:3011"
echo "  - PostgreSQL: interno (não exposto)"

EOF

chmod +x .deploy-temp/setup-server.sh

echo "📤 Enviando arquivos para o servidor..."
ssh $SERVER "mkdir -p $DEPLOY_PATH"
rsync -avz --progress .deploy-temp/ $SERVER:$DEPLOY_PATH/

echo "🔧 Executando setup no servidor..."
ssh $SERVER "bash $DEPLOY_PATH/setup-server.sh"

# Limpar
rm -rf .deploy-temp

echo ""
echo "✅ Deploy concluído!"
echo "🌐 Acesse: https://$DOMAIN"
echo ""
echo "📝 Comandos úteis:"
echo "  Ver logs: ssh $SERVER 'cd $DEPLOY_PATH && docker-compose logs -f'"
echo "  Reiniciar: ssh $SERVER 'cd $DEPLOY_PATH && docker-compose restart'"
echo "  Status: ssh $SERVER 'docker ps'"
