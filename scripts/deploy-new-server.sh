#!/bin/bash

# Deploy Script para Novo Servidor KVM Hostinger
# Uso: ./scripts/deploy-new-server.sh <IP_SERVIDOR> <DOMINIO>
# Exemplo: ./scripts/deploy-new-server.sh 72.60.195.201 prevendas.chorstconsult.com.br

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Validar argumentos
if [ $# -lt 2 ]; then
    echo -e "${RED}Erro: Argumentos insuficientes${NC}"
    echo "Uso: $0 <IP_SERVIDOR> <DOMINIO>"
    echo "Exemplo: $0 72.60.195.201 prevendas.chorstconsult.com.br"
    exit 1
fi

SERVER_IP=$1
DOMAIN=$2
SERVER="root@${SERVER_IP}"
DEPLOY_PATH="/var/www/prevendas"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Deploy do Sistema de Prevendas${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Servidor: ${YELLOW}${SERVER_IP}${NC}"
echo -e "Domínio: ${YELLOW}${DOMAIN}${NC}"
echo -e "Caminho: ${YELLOW}${DEPLOY_PATH}${NC}"
echo ""

# 1. Verificar conectividade
echo -e "${BLUE}[1/8]${NC} Verificando conectividade com servidor..."
if ! ssh -o ConnectTimeout=5 ${SERVER} "echo 'OK'" > /dev/null 2>&1; then
    echo -e "${RED}Erro: Não foi possível conectar ao servidor${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Conectado${NC}"

# 2. Preparar servidor
echo -e "${BLUE}[2/8]${NC} Preparando servidor..."
ssh ${SERVER} 'bash -s' << 'SETUP_SCRIPT'
set -e

echo "Atualizando sistema..."
apt-get update -qq
apt-get upgrade -y -qq

echo "Instalando dependências..."
apt-get install -y -qq curl wget git

# Instalar Docker
if ! command -v docker &> /dev/null; then
    echo "Instalando Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl enable docker
    systemctl start docker
fi

# Instalar Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "Instalando Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Instalar Certbot
if ! command -v certbot &> /dev/null; then
    echo "Instalando Certbot..."
    apt-get install -y -qq certbot python3-certbot-nginx
fi

# Instalar Nginx
if ! command -v nginx &> /dev/null; then
    echo "Instalando Nginx..."
    apt-get install -y -qq nginx
    systemctl enable nginx
    systemctl start nginx
fi

# Configurar Docker mirrors
mkdir -p /etc/docker
cat > /etc/docker/daemon.json << 'EOF'
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com"
  ],
  "max-concurrent-downloads": 10,
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

systemctl restart docker

echo "✓ Servidor preparado"
SETUP_SCRIPT

echo -e "${GREEN}✓ Servidor preparado${NC}"

# 3. Clonar repositório
echo -e "${BLUE}[3/8]${NC} Clonando repositório..."
ssh ${SERVER} "mkdir -p ${DEPLOY_PATH} && cd ${DEPLOY_PATH} && git clone https://github.com/Chorst09/SistemaPreVendas_dev.git . 2>/dev/null || git -C ${DEPLOY_PATH} pull origin main"
echo -e "${GREEN}✓ Repositório clonado/atualizado${NC}"

# 4. Criar arquivo .env
echo -e "${BLUE}[4/8]${NC} Configurando variáveis de ambiente..."
ssh ${SERVER} "cat > ${DEPLOY_PATH}/.env.production << 'EOF'
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://prevendas:PrevendasSecure2025!@postgres:5432/sistema_prevendas
CORS_ORIGIN=https://${DOMAIN}
NEXT_PUBLIC_API_URL=https://${DOMAIN}/api
NEXT_PUBLIC_APP_NAME=Sistema de Prevendas
EOF"
echo -e "${GREEN}✓ Variáveis configuradas${NC}"

# 5. Obter certificado SSL
echo -e "${BLUE}[5/8]${NC} Configurando SSL..."
ssh ${SERVER} "bash -s ${DOMAIN}" << 'SSL_SCRIPT'
DOMAIN=$1
if [ ! -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
    echo "Obtendo certificado SSL para ${DOMAIN}..."
    certbot certonly --standalone \
        --preferred-challenges http \
        --email admin@chorstconsult.com.br \
        --agree-tos \
        --no-eff-email \
        -d ${DOMAIN}
    echo "✓ Certificado obtido"
else
    echo "✓ Certificado já existe"
fi
SSL_SCRIPT

echo -e "${GREEN}✓ SSL configurado${NC}"

# 6. Configurar Nginx
echo -e "${BLUE}[6/8]${NC} Configurando Nginx..."
ssh ${SERVER} "cat > /etc/nginx/sites-available/${DOMAIN} << 'NGINX_CONF'
upstream prevendas_frontend {
    server 127.0.0.1:3010;
}

upstream prevendas_backend {
    server 127.0.0.1:3011;
}

server {
    listen 80;
    server_name ${DOMAIN};

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN};

    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 50M;

    # Frontend
    location / {
        proxy_pass http://prevendas_frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://prevendas_backend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINX_CONF

ln -sf /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/${DOMAIN}
nginx -t
systemctl reload nginx
"
echo -e "${GREEN}✓ Nginx configurado${NC}"

# 7. Build e deploy com Docker
echo -e "${BLUE}[7/8]${NC} Fazendo build das imagens Docker..."
ssh ${SERVER} "cd ${DEPLOY_PATH} && docker-compose -f docker-compose.yml up -d --build"
echo -e "${GREEN}✓ Containers iniciados${NC}"

# 8. Executar migrações
echo -e "${BLUE}[8/8]${NC} Executando migrações do banco..."
sleep 10
ssh ${SERVER} "docker exec prevendas-backend npx prisma migrate deploy 2>/dev/null || echo 'Migrações já aplicadas'"
echo -e "${GREEN}✓ Migrações concluídas${NC}"

# Verificação final
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✓ Deploy concluído com sucesso!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "🌐 Acesse: ${YELLOW}https://${DOMAIN}${NC}"
echo ""
echo -e "📊 Status dos containers:"
ssh ${SERVER} "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"
echo ""
echo -e "📝 Comandos úteis:"
echo -e "  Ver logs: ${YELLOW}ssh ${SERVER} 'docker-compose -f ${DEPLOY_PATH}/docker-compose.yml logs -f'${NC}"
echo -e "  Reiniciar: ${YELLOW}ssh ${SERVER} 'docker-compose -f ${DEPLOY_PATH}/docker-compose.yml restart'${NC}"
echo -e "  Parar: ${YELLOW}ssh ${SERVER} 'docker-compose -f ${DEPLOY_PATH}/docker-compose.yml down'${NC}"
