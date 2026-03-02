# 🚀 Guia de Migração para Novo Servidor KVM

**Data**: 25/02/2026  
**Versão**: 1.0  
**Status**: Pronto para Produção

## 📋 Pré-requisitos

- Novo servidor KVM Hostinger com Ubuntu 22.04 LTS
- Acesso SSH root ao novo servidor
- Domínio DNS apontando para o novo IP (ou pronto para apontar)
- GitHub com acesso ao repositório

## 🎯 Visão Geral do Processo

```
1. Preparar GitHub (✓ Concluído)
   ├── Scripts de deploy
   ├── Docker Compose
   ├── Dockerfiles
   └── Documentação

2. Executar Deploy (Novo Servidor)
   ├── Clonar repositório
   ├── Executar script de deploy
   ├── Configurar SSL
   └── Verificar funcionamento

3. Migrar Dados (Se necessário)
   ├── Backup do banco de dados
   ├── Restaurar no novo servidor
   └── Verificar integridade
```

## 🚀 Passo 1: Deploy Automático (Recomendado)

### Opção A: Deploy via Script Local

```bash
# 1. Clonar repositório localmente
git clone https://github.com/Chorst09/SistemaPreVendas_dev.git
cd SistemaPreVendas_dev

# 2. Executar script de deploy
chmod +x scripts/deploy-new-server.sh
./scripts/deploy-new-server.sh <IP_NOVO_SERVIDOR> <DOMINIO>

# Exemplo:
./scripts/deploy-new-server.sh 72.60.195.201 prevendas.chorstconsult.com.br
```

### Opção B: Deploy Manual via SSH

```bash
# 1. Conectar ao novo servidor
ssh root@<IP_NOVO_SERVIDOR>

# 2. Executar setup
cd /var/www/prevendas
git clone https://github.com/Chorst09/SistemaPreVendas_dev.git .

# 3. Executar docker-compose
docker-compose up -d --build

# 4. Executar migrações
docker exec prevendas-backend npx prisma migrate deploy
```

## 📊 Estrutura do Deploy

### Diretórios Criados

```
/var/www/prevendas/
├── frontend/              # Aplicação Next.js
├── backend/               # API Express
├── prisma/                # Schema do banco
├── docker-compose.yml     # Orquestração
├── .env.production        # Variáveis de ambiente
└── scripts/               # Scripts de deploy
```

### Portas Utilizadas

| Serviço | Porta Interna | Porta Externa | Acesso |
|---------|---------------|---------------|--------|
| Frontend | 3000 | 3010 | 127.0.0.1 |
| Backend | 3001 | 3011 | 127.0.0.1 |
| PostgreSQL | 5432 | 5432 | 127.0.0.1 |
| Nginx | 80/443 | 80/443 | Público |

### Volumes

| Volume | Caminho | Propósito |
|--------|---------|----------|
| postgres_data | /var/lib/postgresql/data | Dados do banco |

## 🔐 Variáveis de Ambiente

O script cria automaticamente `.env.production` com:

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://prevendas:PrevendasSecure2025!@postgres:5432/sistema_prevendas
CORS_ORIGIN=https://prevendas.chorstconsult.com.br
NEXT_PUBLIC_API_URL=https://prevendas.chorstconsult.com.br/api
NEXT_PUBLIC_APP_NAME=Sistema de Prevendas
```

**⚠️ Importante**: Alterar senha do banco em produção!

## 🔄 Migração de Dados (Se Necessário)

### Backup do Servidor Antigo

```bash
# 1. Conectar ao servidor antigo
ssh root@72.60.195.200

# 2. Fazer backup do banco
docker exec prevendas-db pg_dump -U prevendas sistema_prevendas > /tmp/backup.sql

# 3. Copiar para máquina local
scp root@72.60.195.200:/tmp/backup.sql ./backup.sql
```

### Restaurar no Novo Servidor

```bash
# 1. Copiar backup para novo servidor
scp ./backup.sql root@<IP_NOVO>:/tmp/backup.sql

# 2. Conectar ao novo servidor
ssh root@<IP_NOVO>

# 3. Restaurar banco
docker exec -i prevendas-db psql -U prevendas sistema_prevendas < /tmp/backup.sql

# 4. Limpar arquivo
rm /tmp/backup.sql
```

## ✅ Verificação Pós-Deploy

### 1. Verificar Containers

```bash
ssh root@<IP_NOVO> 'docker ps'
```

Esperado:
- prevendas-frontend (Up)
- prevendas-backend (Up)
- prevendas-db (Up)

### 2. Verificar Conectividade

```bash
# Frontend
curl -I http://127.0.0.1:3010

# Backend
curl -I http://127.0.0.1:3011

# HTTPS (após DNS apontar)
curl -I https://prevendas.chorstconsult.com.br
```

### 3. Verificar Logs

```bash
# Frontend
ssh root@<IP_NOVO> 'docker logs prevendas-frontend'

# Backend
ssh root@<IP_NOVO> 'docker logs prevendas-backend'

# Banco
ssh root@<IP_NOVO> 'docker logs prevendas-db'
```

### 4. Testar Funcionalidades

1. Acessar https://prevendas.chorstconsult.com.br
2. Fazer login
3. Testar calculadora Service Desk
4. Testar NOC Pricing
5. Testar AI Bid Analyzer
6. Testar geração de PDF

## 🔧 Troubleshooting

### Problema: Containers não iniciam

```bash
# Ver logs detalhados
docker-compose logs -f

# Reiniciar containers
docker-compose restart

# Reconstruir imagens
docker-compose up -d --build
```

### Problema: Banco não conecta

```bash
# Verificar se PostgreSQL está rodando
docker ps | grep postgres

# Verificar logs do banco
docker logs prevendas-db

# Verificar variáveis de ambiente
docker exec prevendas-backend env | grep DATABASE
```

### Problema: SSL não funciona

```bash
# Verificar certificado
ls -la /etc/letsencrypt/live/prevendas.chorstconsult.com.br/

# Renovar certificado
certbot renew --force-renewal

# Recarregar Nginx
systemctl reload nginx
```

### Problema: Migrações falharam

```bash
# Verificar status das migrações
docker exec prevendas-backend npx prisma migrate status

# Resetar banco (⚠️ Cuidado: apaga dados!)
docker exec prevendas-backend npx prisma migrate reset

# Reexecutar migrações
docker exec prevendas-backend npx prisma migrate deploy
```

## 📝 Comandos Úteis

### Gerenciamento de Containers

```bash
# Ver status
docker-compose ps

# Ver logs em tempo real
docker-compose logs -f

# Reiniciar serviço específico
docker-compose restart frontend

# Parar todos os serviços
docker-compose down

# Iniciar todos os serviços
docker-compose up -d

# Reconstruir imagens
docker-compose build --no-cache
```

### Gerenciamento do Banco

```bash
# Acessar banco de dados
docker exec -it prevendas-db psql -U prevendas -d sistema_prevendas

# Fazer backup
docker exec prevendas-db pg_dump -U prevendas sistema_prevendas > backup.sql

# Restaurar backup
docker exec -i prevendas-db psql -U prevendas sistema_prevendas < backup.sql
```

### Gerenciamento de Nginx

```bash
# Testar configuração
nginx -t

# Recarregar Nginx
systemctl reload nginx

# Reiniciar Nginx
systemctl restart nginx

# Ver status
systemctl status nginx
```

## 🔄 Rollback (Se Necessário)

Se algo der errado, você pode voltar para o servidor antigo:

```bash
# 1. Atualizar DNS para apontar para IP antigo
# (Feito no painel de controle do domínio)

# 2. Aguardar propagação DNS (até 24h, geralmente 5-10 min)

# 3. Verificar se está funcionando
curl -I https://prevendas.chorstconsult.com.br
```

## 📊 Monitoramento Contínuo

### Verificar Saúde dos Serviços

```bash
# Criar script de monitoramento
cat > /usr/local/bin/check-prevendas.sh << 'EOF'
#!/bin/bash
echo "=== Status dos Containers ==="
docker ps --format "table {{.Names}}\t{{.Status}}"

echo ""
echo "=== Verificação de Conectividade ==="
curl -s -o /dev/null -w "Frontend: %{http_code}\n" http://127.0.0.1:3010
curl -s -o /dev/null -w "Backend: %{http_code}\n" http://127.0.0.1:3011

echo ""
echo "=== Uso de Disco ==="
df -h /var/lib/docker/volumes/

echo ""
echo "=== Uso de Memória ==="
docker stats --no-stream
EOF

chmod +x /usr/local/bin/check-prevendas.sh

# Executar verificação
check-prevendas.sh
```

### Configurar Alertas (Opcional)

```bash
# Adicionar ao crontab para verificação a cada 5 minutos
crontab -e

# Adicionar linha:
*/5 * * * * /usr/local/bin/check-prevendas.sh >> /var/log/prevendas-check.log 2>&1
```

## 🎯 Checklist de Migração

- [ ] Novo servidor preparado (Ubuntu 22.04 LTS)
- [ ] SSH acesso confirmado
- [ ] Script de deploy baixado
- [ ] Domínio DNS pronto para apontar
- [ ] Backup do banco de dados feito
- [ ] Deploy executado com sucesso
- [ ] Containers rodando corretamente
- [ ] SSL certificado obtido
- [ ] Nginx configurado
- [ ] Dados migrados (se necessário)
- [ ] Testes funcionais concluídos
- [ ] DNS apontando para novo servidor
- [ ] Monitoramento configurado
- [ ] Documentação atualizada

## 📞 Suporte

Se encontrar problemas:

1. Verificar logs: `docker-compose logs -f`
2. Consultar troubleshooting acima
3. Verificar GitHub Issues
4. Contatar suporte Hostinger

## 📚 Referências

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Express.js Guide](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)

---

**Última Atualização**: 25/02/2026  
**Versão**: 1.0  
**Status**: ✅ Pronto para Produção
