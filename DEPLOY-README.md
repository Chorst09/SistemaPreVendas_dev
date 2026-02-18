# 📚 Documentação de Deploy - Sistema de Prevendas

## 🎯 Início Rápido

**Para fazer o deploy agora:**

```bash
./deploy-simple.sh
```

Leia: [EXECUTAR-DEPLOY.md](./EXECUTAR-DEPLOY.md)

---

## 📖 Guias Disponíveis

### 1. [EXECUTAR-DEPLOY.md](./EXECUTAR-DEPLOY.md) ⭐
**Comece aqui!** Passo a passo completo para executar o deploy.

### 2. [QUICK-DEPLOY.md](./QUICK-DEPLOY.md)
Referência rápida com comandos essenciais.

### 3. [DEPLOY-HOSTINGER.md](./DEPLOY-HOSTINGER.md)
Guia completo com troubleshooting e comandos avançados.

### 4. [PRE-DEPLOY-CHECKLIST.md](./PRE-DEPLOY-CHECKLIST.md)
Checklist para verificar antes do deploy.

---

## 🗂️ Arquivos de Deploy

### Scripts
- `deploy-simple.sh` - Script principal de deploy (recomendado)
- `deploy-hostinger.sh` - Script alternativo com mais opções

### Configurações
- `frontend/next.config.ts` - Configurado com `output: 'standalone'` para Docker
- `.gitignore` - Atualizado para ignorar arquivos temporários de deploy

---

## 🏗️ Arquitetura do Deploy

```
Hostinger KVM (72.60.195.200)
└── /var/www/prevendas/
    ├── Docker Compose
    │   ├── PostgreSQL (porta interna 5432)
    │   ├── Backend (porta interna 3001)
    │   ├── Frontend (porta interna 3000)
    │   └── Nginx (portas 80/443)
    │
    └── SSL/TLS (Let's Encrypt)
        └── prevendas.chorstconsult.com.br
```

---

## 🔐 Informações do Servidor

- **Host**: 72.60.195.200
- **Usuário**: root
- **Domínio**: prevendas.chorstconsult.com.br
- **Caminho**: /var/www/prevendas

---

## 🚀 Processo de Deploy

1. **Preparação Local**
   - Cria arquivos Docker de produção
   - Prepara configuração Nginx
   - Gera docker-compose.yml

2. **Envio para Servidor**
   - Rsync dos arquivos (excluindo node_modules, .next, etc)
   - Upload via SSH

3. **Setup no Servidor**
   - Instala Docker e Docker Compose (se necessário)
   - Obtém certificado SSL via Let's Encrypt
   - Configura firewall (portas 80, 443)

4. **Build e Inicialização**
   - Build das imagens Docker
   - Inicia containers
   - Executa migrações do banco

5. **Verificação**
   - Testa conectividade
   - Verifica logs
   - Confirma SSL

---

## 🐳 Containers Docker

| Container | Imagem | Porta | Descrição |
|-----------|--------|-------|-----------|
| prevendas-nginx | nginx:alpine | 80, 443 | Reverse proxy + SSL |
| prevendas-frontend | node:20-alpine | 3000 | Next.js App |
| prevendas-backend | node:20-alpine | 3001 | Express API |
| prevendas-db | postgres:16-alpine | 5432 | PostgreSQL |

---

## 🔧 Comandos Úteis

### Deploy e Atualização
```bash
# Deploy inicial ou atualização
./deploy-simple.sh

# Deploy manual (alternativo)
./deploy-hostinger.sh
```

### Monitoramento
```bash
# Ver logs em tempo real
ssh root@72.60.195.200 'cd /var/www/prevendas && docker-compose logs -f'

# Status dos containers
ssh root@72.60.195.200 'docker ps'

# Uso de recursos
ssh root@72.60.195.200 'docker stats'
```

### Manutenção
```bash
# Reiniciar aplicação
ssh root@72.60.195.200 'cd /var/www/prevendas && docker-compose restart'

# Parar aplicação
ssh root@72.60.195.200 'cd /var/www/prevendas && docker-compose down'

# Rebuild completo
ssh root@72.60.195.200 'cd /var/www/prevendas && docker-compose up -d --build'
```

### Banco de Dados
```bash
# Acessar PostgreSQL
ssh root@72.60.195.200 'docker exec -it prevendas-db psql -U prevendas -d sistema_prevendas'

# Executar migrações
ssh root@72.60.195.200 'docker exec prevendas-backend npx prisma migrate deploy'

# Backup do banco
ssh root@72.60.195.200 'docker exec prevendas-db pg_dump -U prevendas sistema_prevendas > backup.sql'
```

---

## 🔒 Segurança

### SSL/TLS
- Certificado Let's Encrypt (renovação automática)
- TLS 1.2 e 1.3
- HTTPS obrigatório (redirect de HTTP)

### Banco de Dados
- Senha forte: `PrevendasSecure2025!`
- Acesso apenas interno (não exposto publicamente)
- Backups recomendados

### Variáveis de Ambiente
- Configuradas no docker-compose.yml
- Não commitadas no Git
- Específicas para produção

---

## 📊 Monitoramento e Logs

### Logs da Aplicação
```bash
# Todos os serviços
docker-compose logs -f

# Serviço específico
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f postgres
```

### Métricas do Sistema
```bash
# Uso de CPU/Memória
docker stats

# Espaço em disco
df -h
docker system df
```

### Health Checks
```bash
# API Backend
curl https://prevendas.chorstconsult.com.br/api/health

# Frontend
curl https://prevendas.chorstconsult.com.br

# PostgreSQL
docker exec prevendas-db pg_isready -U prevendas
```

---

## 🐛 Troubleshooting

### Aplicação não inicia
1. Verificar logs: `docker-compose logs`
2. Verificar status: `docker ps -a`
3. Reiniciar: `docker-compose restart`

### Erro 502 Bad Gateway
1. Verificar se backend está rodando: `docker ps`
2. Ver logs do backend: `docker logs prevendas-backend`
3. Reiniciar backend: `docker-compose restart backend`

### Erro de SSL
1. Verificar certificado: `ls -la /etc/letsencrypt/live/prevendas.chorstconsult.com.br/`
2. Renovar: `certbot renew`
3. Reiniciar nginx: `docker-compose restart nginx`

### Banco de dados não conecta
1. Verificar se está rodando: `docker ps | grep postgres`
2. Testar conexão: `docker exec prevendas-db pg_isready -U prevendas`
3. Ver logs: `docker logs prevendas-db`

### Limpar e recomeçar
```bash
ssh root@72.60.195.200 'cd /var/www/prevendas && docker-compose down -v'
./deploy-simple.sh
```

---

## 🔄 Workflow de Atualização

1. **Fazer mudanças no código localmente**
2. **Testar localmente**: `npm run dev`
3. **Commit das mudanças**: `git commit -am "Descrição"`
4. **Executar deploy**: `./deploy-simple.sh`
5. **Verificar**: Acessar https://prevendas.chorstconsult.com.br
6. **Monitorar logs**: `docker-compose logs -f`

---

## 📞 Suporte

### Documentação
- [Next.js Docs](https://nextjs.org/docs)
- [Docker Docs](https://docs.docker.com/)
- [Prisma Docs](https://www.prisma.io/docs)
- [Nginx Docs](https://nginx.org/en/docs/)

### Logs e Debug
Sempre comece verificando os logs:
```bash
ssh root@72.60.195.200 'cd /var/www/prevendas && docker-compose logs -f'
```

---

## ✅ Status do Deploy

- [x] DNS configurado (prevendas.chorstconsult.com.br → 72.60.195.200)
- [x] Scripts de deploy criados
- [x] Dockerfiles de produção configurados
- [x] Nginx configurado com SSL
- [x] Docker Compose pronto
- [x] Documentação completa
- [ ] **Pronto para executar!**

---

## 🎉 Próximos Passos

1. Leia: [EXECUTAR-DEPLOY.md](./EXECUTAR-DEPLOY.md)
2. Execute: `./deploy-simple.sh`
3. Acesse: https://prevendas.chorstconsult.com.br
4. Monitore: `docker-compose logs -f`

**Boa sorte com o deploy! 🚀**
