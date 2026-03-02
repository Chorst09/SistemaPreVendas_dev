# 🚀 Deployment - Sistema de Prevendas

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Deploy Rápido](#deploy-rápido)
4. [Deploy Detalhado](#deploy-detalhado)
5. [Migração de Servidor](#migração-de-servidor)
6. [Troubleshooting](#troubleshooting)

## 🎯 Visão Geral

Sistema de Prevendas é uma aplicação full-stack containerizada com:

- **Frontend**: Next.js 15 + React 18 + Tailwind CSS
- **Backend**: Express.js + TypeScript
- **Banco de Dados**: PostgreSQL 16
- **Orquestração**: Docker Compose
- **Proxy Reverso**: Nginx
- **SSL**: Let's Encrypt

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    Internet (HTTPS)                      │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                   Nginx (Proxy)                          │
│              Port 80/443 → 3010/3011                     │
└────────────────────────┬────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
┌───────▼────────┐ ┌────▼──────────┐ ┌──▼──────────────┐
│   Frontend     │ │   Backend     │ │   PostgreSQL    │
│  (Next.js)     │ │  (Express)    │ │   (Database)    │
│  Port 3010     │ │  Port 3011    │ │   Port 5432     │
└────────────────┘ └───────────────┘ └─────────────────┘
```

## 🚀 Deploy Rápido

### Pré-requisitos

- Docker e Docker Compose instalados
- Git
- Acesso SSH ao servidor (para deploy remoto)

### Opção 1: Deploy Local (Desenvolvimento)

```bash
# 1. Clonar repositório
git clone https://github.com/Chorst09/SistemaPreVendas_dev.git
cd SistemaPreVendas_dev

# 2. Criar arquivo .env
cp .env.example .env.local

# 3. Iniciar containers
docker-compose up -d

# 4. Executar migrações
docker exec prevendas-backend npx prisma migrate dev

# 5. Acessar aplicação
# Frontend: http://localhost:3010
# Backend: http://localhost:3011
```

### Opção 2: Deploy Remoto (Produção)

```bash
# 1. Executar script de deploy
chmod +x scripts/deploy-new-server.sh
./scripts/deploy-new-server.sh <IP_SERVIDOR> <DOMINIO>

# Exemplo:
./scripts/deploy-new-server.sh 72.60.195.201 prevendas.chorstconsult.com.br

# 2. Aguardar conclusão (5-10 minutos)

# 3. Acessar aplicação
# https://prevendas.chorstconsult.com.br
```

## 📖 Deploy Detalhado

### Passo 1: Preparar Servidor

```bash
# Conectar ao servidor
ssh root@<IP_SERVIDOR>

# Atualizar sistema
apt-get update && apt-get upgrade -y

# Instalar dependências
apt-get install -y curl wget git

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

# Instalar Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Instalar Nginx
apt-get install -y nginx

# Instalar Certbot
apt-get install -y certbot python3-certbot-nginx
```

### Passo 2: Clonar Repositório

```bash
# Criar diretório
mkdir -p /var/www/prevendas
cd /var/www/prevendas

# Clonar repositório
git clone https://github.com/Chorst09/SistemaPreVendas_dev.git .

# Verificar estrutura
ls -la
```

### Passo 3: Configurar Variáveis de Ambiente

```bash
# Criar arquivo .env.production
cat > .env.production << 'EOF'
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://prevendas:PrevendasSecure2025!@postgres:5432/sistema_prevendas
CORS_ORIGIN=https://prevendas.chorstconsult.com.br
NEXT_PUBLIC_API_URL=https://prevendas.chorstconsult.com.br/api
NEXT_PUBLIC_APP_NAME=Sistema de Prevendas
EOF

# ⚠️ Alterar senha em produção!
```

### Passo 4: Obter Certificado SSL

```bash
# Obter certificado Let's Encrypt
certbot certonly --standalone \
    --preferred-challenges http \
    --email admin@chorstconsult.com.br \
    --agree-tos \
    --no-eff-email \
    -d prevendas.chorstconsult.com.br
```

### Passo 5: Configurar Nginx

```bash
# Criar configuração Nginx
cat > /etc/nginx/sites-available/prevendas.chorstconsult.com.br << 'EOF'
upstream prevendas_frontend {
    server 127.0.0.1:3010;
}

upstream prevendas_backend {
    server 127.0.0.1:3011;
}

server {
    listen 80;
    server_name prevendas.chorstconsult.com.br;
    return 301 https://$host$request_uri;
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

# Ativar configuração
ln -sf /etc/nginx/sites-available/prevendas.chorstconsult.com.br /etc/nginx/sites-enabled/

# Testar configuração
nginx -t

# Recarregar Nginx
systemctl reload nginx
```

### Passo 6: Iniciar Containers

```bash
# Navegar para diretório do projeto
cd /var/www/prevendas

# Iniciar containers
docker-compose up -d --build

# Aguardar inicialização (30-60 segundos)
sleep 30

# Verificar status
docker-compose ps
```

### Passo 7: Executar Migrações

```bash
# Executar migrações do banco
docker exec prevendas-backend npx prisma migrate deploy

# Verificar status
docker exec prevendas-backend npx prisma migrate status
```

### Passo 8: Verificar Funcionamento

```bash
# Testar frontend
curl -I http://127.0.0.1:3010

# Testar backend
curl -I http://127.0.0.1:3011

# Testar HTTPS (após DNS apontar)
curl -I https://prevendas.chorstconsult.com.br
```

## 🔄 Migração de Servidor

Veja [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md) para instruções completas.

### Resumo Rápido

```bash
# 1. Fazer backup do banco antigo
./scripts/backup-database.sh root@72.60.195.200

# 2. Deploy no novo servidor
./scripts/deploy-new-server.sh 72.60.195.201 prevendas.chorstconsult.com.br

# 3. Restaurar dados
./scripts/restore-database.sh backups/backup_*.sql.gz root@72.60.195.201

# 4. Atualizar DNS
# (Feito no painel de controle do domínio)

# 5. Verificar funcionamento
curl -I https://prevendas.chorstconsult.com.br
```

## 🔧 Troubleshooting

### Containers não iniciam

```bash
# Ver logs
docker-compose logs -f

# Reconstruir imagens
docker-compose down
docker-compose up -d --build
```

### Banco não conecta

```bash
# Verificar se PostgreSQL está rodando
docker ps | grep postgres

# Ver logs do banco
docker logs prevendas-db

# Reiniciar banco
docker-compose restart postgres
```

### SSL não funciona

```bash
# Verificar certificado
ls -la /etc/letsencrypt/live/prevendas.chorstconsult.com.br/

# Renovar certificado
certbot renew --force-renewal

# Recarregar Nginx
systemctl reload nginx
```

### Migrações falharam

```bash
# Ver status
docker exec prevendas-backend npx prisma migrate status

# Resetar (⚠️ Apaga dados!)
docker exec prevendas-backend npx prisma migrate reset

# Reexecutar
docker exec prevendas-backend npx prisma migrate deploy
```

## 📊 Monitoramento

### Ver Status dos Containers

```bash
docker-compose ps
```

### Ver Logs em Tempo Real

```bash
# Todos os serviços
docker-compose logs -f

# Serviço específico
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f postgres
```

### Verificar Uso de Recursos

```bash
docker stats
```

## 🔐 Segurança

### Alterar Senha do Banco

```bash
# Conectar ao banco
docker exec -it prevendas-db psql -U prevendas -d sistema_prevendas

# Alterar senha
ALTER USER prevendas WITH PASSWORD 'nova_senha_segura';

# Atualizar .env.production
# DATABASE_URL=postgresql://prevendas:nova_senha_segura@postgres:5432/sistema_prevendas

# Reiniciar containers
docker-compose restart
```

### Fazer Backup Regular

```bash
# Adicionar ao crontab
crontab -e

# Adicionar linha (backup diário às 2 AM)
0 2 * * * /var/www/prevendas/scripts/backup-database.sh >> /var/log/prevendas-backup.log 2>&1
```

## 📚 Referências

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Express.js Guide](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)

## 📞 Suporte

Para problemas ou dúvidas:

1. Verificar logs: `docker-compose logs -f`
2. Consultar troubleshooting acima
3. Verificar GitHub Issues
4. Contatar suporte

---

**Última Atualização**: 25/02/2026  
**Versão**: 1.0  
**Status**: ✅ Pronto para Produção
