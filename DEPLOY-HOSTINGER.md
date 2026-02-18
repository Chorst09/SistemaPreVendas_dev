# Deploy para Hostinger KVM

Guia completo para fazer deploy do Sistema de Prevendas no servidor Hostinger.

## 📋 Pré-requisitos

- Acesso SSH ao servidor: `root@72.60.195.200`
- Subdomínio configurado: `prevendas.chorstconsult.com.br`
- Docker e Docker Compose (serão instalados automaticamente se necessário)

## 🚀 Deploy Automático (Recomendado)

Execute o script de deploy na sua máquina local:

```bash
chmod +x deploy-simple.sh
./deploy-simple.sh
```

O script irá:
1. ✅ Preparar todos os arquivos necessários
2. ✅ Enviar para o servidor via rsync
3. ✅ Instalar Docker e Docker Compose (se necessário)
4. ✅ Obter certificado SSL via Let's Encrypt
5. ✅ Fazer build e iniciar os containers
6. ✅ Executar migrações do banco de dados

## 🔧 Deploy Manual

Se preferir fazer o deploy manualmente:

### 1. Conectar ao servidor

```bash
ssh root@72.60.195.200
```

### 2. Instalar dependências

```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl enable docker
systemctl start docker

# Instalar Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Instalar Certbot
apt-get update
apt-get install -y certbot
```

### 3. Obter certificado SSL

```bash
certbot certonly --standalone \
  --preferred-challenges http \
  --email admin@chorstconsult.com.br \
  --agree-tos \
  -d prevendas.chorstconsult.com.br
```

### 4. Criar diretório e enviar arquivos

Na sua máquina local:

```bash
# Criar diretório no servidor
ssh root@72.60.195.200 "mkdir -p /var/www/prevendas"

# Enviar arquivos
rsync -avz --exclude='node_modules' --exclude='.next' --exclude='dist' --exclude='.git' \
  ./ root@72.60.195.200:/var/www/prevendas/
```

### 5. Iniciar aplicação

No servidor:

```bash
cd /var/www/prevendas
docker-compose -f docker-compose.yml up -d --build

# Aguardar e executar migrações
sleep 15
docker exec prevendas-backend npx prisma migrate deploy
```

## 📊 Estrutura no Servidor

```
/var/www/prevendas/
├── backend/              # API Backend
├── frontend/             # Frontend Next.js
├── docker-compose.yml    # Orquestração
├── nginx.conf           # Configuração Nginx
└── setup-server.sh      # Script de setup
```

## 🐳 Containers Docker

A aplicação roda em 4 containers:

1. **prevendas-db** - PostgreSQL 16
2. **prevendas-backend** - API Express.js (porta 3001)
3. **prevendas-frontend** - Next.js (porta 3000)
4. **prevendas-nginx** - Nginx reverse proxy (portas 80/443)

## 🔍 Comandos Úteis

### Ver logs

```bash
# Todos os serviços
ssh root@72.60.195.200 'cd /var/www/prevendas && docker-compose logs -f'

# Serviço específico
ssh root@72.60.195.200 'cd /var/www/prevendas && docker-compose logs -f frontend'
ssh root@72.60.195.200 'cd /var/www/prevendas && docker-compose logs -f backend'
```

### Reiniciar serviços

```bash
# Todos
ssh root@72.60.195.200 'cd /var/www/prevendas && docker-compose restart'

# Específico
ssh root@72.60.195.200 'cd /var/www/prevendas && docker-compose restart frontend'
```

### Parar aplicação

```bash
ssh root@72.60.195.200 'cd /var/www/prevendas && docker-compose down'
```

### Rebuild completo

```bash
ssh root@72.60.195.200 'cd /var/www/prevendas && docker-compose down && docker-compose up -d --build'
```

### Acessar banco de dados

```bash
ssh root@72.60.195.200 'docker exec -it prevendas-db psql -U prevendas -d sistema_prevendas'
```

### Executar migrações

```bash
ssh root@72.60.195.200 'docker exec prevendas-backend npx prisma migrate deploy'
```

### Ver status dos containers

```bash
ssh root@72.60.195.200 'docker ps'
```

## 🔐 Variáveis de Ambiente

As variáveis de ambiente estão configuradas no `docker-compose.yml`:

- **DATABASE_URL**: `postgresql://prevendas:PrevendasSecure2025!@postgres:5432/sistema_prevendas`
- **CORS_ORIGIN**: `https://prevendas.chorstconsult.com.br`
- **NEXT_PUBLIC_API_URL**: `https://prevendas.chorstconsult.com.br/api`

## 🔄 Atualizar Aplicação

Para atualizar após mudanças no código:

```bash
# Na sua máquina local
./deploy-simple.sh
```

Ou manualmente:

```bash
# Enviar arquivos atualizados
rsync -avz --exclude='node_modules' --exclude='.next' --exclude='dist' --exclude='.git' \
  ./ root@72.60.195.200:/var/www/prevendas/

# Rebuild no servidor
ssh root@72.60.195.200 'cd /var/www/prevendas && docker-compose up -d --build'
```

## 🔒 SSL/HTTPS

O certificado SSL é obtido automaticamente via Let's Encrypt e renovado automaticamente.

Para renovar manualmente:

```bash
ssh root@72.60.195.200 'certbot renew'
ssh root@72.60.195.200 'cd /var/www/prevendas && docker-compose restart nginx'
```

## 🐛 Troubleshooting

### Aplicação não inicia

```bash
# Ver logs de todos os serviços
ssh root@72.60.195.200 'cd /var/www/prevendas && docker-compose logs'

# Verificar status
ssh root@72.60.195.200 'docker ps -a'
```

### Erro de conexão com banco

```bash
# Verificar se o PostgreSQL está rodando
ssh root@72.60.195.200 'docker exec prevendas-db pg_isready -U prevendas'

# Reiniciar banco
ssh root@72.60.195.200 'cd /var/www/prevendas && docker-compose restart postgres'
```

### Erro 502 Bad Gateway

```bash
# Verificar se backend está respondendo
ssh root@72.60.195.200 'docker exec prevendas-backend curl http://localhost:3001/api/health'

# Reiniciar backend
ssh root@72.60.195.200 'cd /var/www/prevendas && docker-compose restart backend'
```

### Limpar tudo e recomeçar

```bash
ssh root@72.60.195.200 'cd /var/www/prevendas && docker-compose down -v'
ssh root@72.60.195.200 'cd /var/www/prevendas && docker-compose up -d --build'
```

## 📈 Monitoramento

### Uso de recursos

```bash
ssh root@72.60.195.200 'docker stats'
```

### Espaço em disco

```bash
ssh root@72.60.195.200 'df -h'
ssh root@72.60.195.200 'docker system df'
```

### Limpar imagens antigas

```bash
ssh root@72.60.195.200 'docker system prune -a'
```

## 🌐 Acesso

Após o deploy, a aplicação estará disponível em:

- **URL**: https://prevendas.chorstconsult.com.br
- **API**: https://prevendas.chorstconsult.com.br/api

## 📞 Suporte

Em caso de problemas:

1. Verifique os logs: `docker-compose logs -f`
2. Verifique o status: `docker ps`
3. Reinicie os serviços: `docker-compose restart`
4. Se necessário, rebuild completo: `docker-compose down && docker-compose up -d --build`
