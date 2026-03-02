# ✅ GitHub Preparado para Migração de Servidor

**Data**: 25/02/2026  
**Status**: ✅ PRONTO PARA PRODUÇÃO  
**Commit**: 51b089b

## 📋 O Que Foi Preparado

### 1. ✅ GitHub Actions Workflow
**Arquivo**: `.github/workflows/deploy.yml`

Automatiza o build e push de imagens Docker para GitHub Container Registry:
- Build de imagem frontend
- Build de imagem backend
- Push automático ao fazer push para `main`
- Cache de layers para builds mais rápidos

### 2. ✅ Script de Deploy Automatizado
**Arquivo**: `scripts/deploy-new-server.sh`

Script completo que:
- Prepara o servidor (Docker, Docker Compose, Nginx, Certbot)
- Clona o repositório
- Configura variáveis de ambiente
- Obtém certificado SSL
- Configura Nginx
- Inicia containers
- Executa migrações do banco

**Uso**:
```bash
./scripts/deploy-new-server.sh <IP_NOVO_SERVIDOR> <DOMINIO>
```

### 3. ✅ Docker Compose Completo
**Arquivo**: `docker-compose.yml`

Orquestração de 3 serviços:
- **Frontend** (Next.js): Porta 3010
- **Backend** (Express): Porta 3011
- **PostgreSQL**: Porta 5432

Com:
- Health checks
- Volumes persistentes
- Rede isolada
- Restart automático

### 4. ✅ Dockerfiles Otimizados
**Arquivos**: `frontend/Dockerfile`, `backend/Dockerfile`

- Multi-stage builds para reduzir tamanho
- Usuários não-root por segurança
- Cache layers otimizado
- Pronto para produção

### 5. ✅ Scripts de Backup/Restauração
**Arquivos**: 
- `scripts/backup-database.sh` - Backup do banco
- `scripts/restore-database.sh` - Restauração do banco

Suportam:
- Backup local ou remoto
- Compressão automática
- Restauração com um comando

### 6. ✅ Documentação Completa

#### `MIGRATION-GUIDE.md`
Guia passo-a-passo para migração:
- Pré-requisitos
- Deploy automático vs manual
- Migração de dados
- Verificação pós-deploy
- Troubleshooting
- Rollback

#### `README-DEPLOYMENT.md`
Documentação técnica de deployment:
- Arquitetura do sistema
- Deploy local e remoto
- Configuração detalhada
- Monitoramento
- Segurança

### 7. ✅ Variáveis de Ambiente
**Arquivo**: `.env.example`

Template com todas as variáveis necessárias:
- Frontend
- Backend
- Banco de dados
- Produção

## 🚀 Como Usar para Migração

### Passo 1: Preparar Novo Servidor

```bash
# Novo servidor KVM Hostinger com Ubuntu 22.04 LTS
# Obter IP do novo servidor
# Ter acesso SSH root
```

### Passo 2: Executar Deploy

```bash
# No seu computador local
git clone https://github.com/Chorst09/SistemaPreVendas_dev.git
cd SistemaPreVendas_dev

# Executar script de deploy
chmod +x scripts/deploy-new-server.sh
./scripts/deploy-new-server.sh 72.60.195.201 prevendas.chorstconsult.com.br
```

### Passo 3: Migrar Dados (Se Necessário)

```bash
# Fazer backup do servidor antigo
./scripts/backup-database.sh root@72.60.195.200

# Restaurar no novo servidor
./scripts/restore-database.sh backups/backup_*.sql.gz root@72.60.195.201
```

### Passo 4: Atualizar DNS

```bash
# Apontar domínio para novo IP
# (Feito no painel de controle do domínio)
```

### Passo 5: Verificar

```bash
# Testar site
curl -I https://prevendas.chorstconsult.com.br

# Deve retornar HTTP 200
```

## 📊 Estrutura de Arquivos

```
.github/
├── workflows/
│   └── deploy.yml                 # GitHub Actions

scripts/
├── deploy-new-server.sh           # Deploy automatizado
├── backup-database.sh             # Backup do banco
└── restore-database.sh            # Restauração

frontend/
├── Dockerfile                     # Build otimizado
└── ...

backend/
├── Dockerfile                     # Build otimizado
└── ...

docker-compose.yml                 # Orquestração
.env.example                       # Template de variáveis
MIGRATION-GUIDE.md                 # Guia de migração
README-DEPLOYMENT.md               # Documentação técnica
```

## ✅ Checklist de Migração

- [ ] Novo servidor KVM preparado (Ubuntu 22.04 LTS)
- [ ] SSH acesso confirmado
- [ ] Repositório clonado localmente
- [ ] Backup do banco de dados feito
- [ ] Script de deploy executado
- [ ] Containers rodando corretamente
- [ ] SSL certificado obtido
- [ ] Nginx configurado
- [ ] Dados migrados (se necessário)
- [ ] Testes funcionais concluídos
- [ ] DNS apontando para novo servidor
- [ ] Monitoramento configurado

## 🔐 Segurança

### Senhas Padrão (ALTERAR EM PRODUÇÃO!)

```
PostgreSQL User: prevendas
PostgreSQL Password: PrevendasSecure2025!
```

**⚠️ IMPORTANTE**: Alterar senha em produção!

```bash
# Conectar ao banco
docker exec -it prevendas-db psql -U prevendas -d sistema_prevendas

# Alterar senha
ALTER USER prevendas WITH PASSWORD 'nova_senha_segura';

# Atualizar .env.production
```

## 📞 Suporte Rápido

### Problema: Containers não iniciam
```bash
docker-compose logs -f
docker-compose up -d --build
```

### Problema: Banco não conecta
```bash
docker logs prevendas-db
docker-compose restart postgres
```

### Problema: SSL não funciona
```bash
certbot renew --force-renewal
systemctl reload nginx
```

### Problema: Migrações falharam
```bash
docker exec prevendas-backend npx prisma migrate status
docker exec prevendas-backend npx prisma migrate deploy
```

## 📚 Documentação Disponível

1. **MIGRATION-GUIDE.md** - Guia completo de migração
2. **README-DEPLOYMENT.md** - Documentação técnica
3. **GITHUB-MIGRATION-READY.md** - Este arquivo
4. **DEPLOY-FINAL-SUCESSO.md** - Status do deploy atual
5. **LIMPAR-CACHE-NAVEGADOR.md** - Instruções de cache

## 🎯 Próximos Passos

1. **Quando estiver pronto para migrar**:
   ```bash
   ./scripts/deploy-new-server.sh <IP_NOVO> <DOMINIO>
   ```

2. **Monitorar durante migração**:
   ```bash
   ssh root@<IP_NOVO> 'docker-compose logs -f'
   ```

3. **Após migração bem-sucedida**:
   - Atualizar DNS
   - Testar funcionalidades
   - Configurar backups automáticos
   - Monitorar performance

## 📊 Informações Técnicas

### Imagens Docker

As imagens serão buildadas e pushadas para:
- `ghcr.io/Chorst09/SistemaPreVendas_dev/prevendas-frontend:latest`
- `ghcr.io/Chorst09/SistemaPreVendas_dev/prevendas-backend:latest`

### Portas

| Serviço | Porta Interna | Porta Externa | Acesso |
|---------|---------------|---------------|--------|
| Frontend | 3000 | 3010 | 127.0.0.1 |
| Backend | 3001 | 3011 | 127.0.0.1 |
| PostgreSQL | 5432 | 5432 | 127.0.0.1 |
| Nginx | 80/443 | 80/443 | Público |

### Volumes

- `postgres_data`: Dados do banco de dados

## 🔄 Rollback (Se Necessário)

Se algo der errado:

```bash
# 1. Atualizar DNS para apontar para IP antigo
# (Feito no painel de controle do domínio)

# 2. Aguardar propagação DNS (5-10 minutos)

# 3. Verificar se está funcionando
curl -I https://prevendas.chorstconsult.com.br
```

## 📝 Notas Importantes

1. **Backup**: Sempre fazer backup antes de migrar
2. **DNS**: Pode levar até 24h para propagar (geralmente 5-10 min)
3. **SSL**: Certificado é obtido automaticamente
4. **Dados**: Migração de dados é opcional (novo banco vazio por padrão)
5. **Monitoramento**: Configurar alertas após migração

## ✅ Conclusão

O GitHub está **100% preparado** para migração:

✅ Scripts de deploy automatizados  
✅ Docker Compose completo  
✅ Dockerfiles otimizados  
✅ Scripts de backup/restauração  
✅ Documentação completa  
✅ GitHub Actions configurado  

**Basta executar um comando para fazer o deploy!**

```bash
./scripts/deploy-new-server.sh <IP_NOVO> <DOMINIO>
```

---

**Última Atualização**: 25/02/2026  
**Versão**: 1.0  
**Status**: ✅ PRONTO PARA MIGRAÇÃO  
**Commit**: 51b089b
