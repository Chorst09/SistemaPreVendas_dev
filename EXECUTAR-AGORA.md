# ⚡ Executar Deploy AGORA - Versão Corrigida

## O Problema

O servidor já tem Nginx configurado com múltiplos subdomínios (CRM, Finanças, etc). O script anterior tentaria criar um Nginx próprio e conflitaria.

## A Solução

Usar o Nginx existente e adicionar o Sistema de Prevendas como mais um virtual host.

---

## 🚀 Passo a Passo

### 1️⃣ Investigar (Opcional mas Recomendado)

```bash
./fix-vhost-config.sh
```

Isso mostra como o servidor está configurado atualmente.

### 2️⃣ Executar Deploy

```bash
./deploy-with-existing-nginx.sh
```

**Senha quando solicitado**: `raizCh@#horst1977#@`

### 3️⃣ Aguardar

⏳ Tempo estimado: 10-15 minutos

O script vai:
1. Preparar arquivos
2. Enviar para servidor
3. Criar containers Docker (PostgreSQL, Backend, Frontend)
4. Obter certificado SSL
5. Configurar Nginx existente
6. Iniciar aplicação

### 4️⃣ Verificar

Acesse: **https://prevendas.chorstconsult.com.br**

---

## 📊 O Que Será Criado

### Containers Docker
- `prevendas-db` - PostgreSQL (porta interna)
- `prevendas-backend` - API (127.0.0.1:3011)
- `prevendas-frontend` - Next.js (127.0.0.1:3010)

### Configuração Nginx
- Arquivo: `/etc/nginx/sites-available/prevendas.chorstconsult.com.br`
- Proxy para frontend (porta 3010)
- Proxy para backend/api (porta 3011)
- SSL/HTTPS configurado

### Estrutura no Servidor
```
/var/www/prevendas/
├── backend/
├── frontend/
├── docker-compose.yml
└── nginx-prevendas.conf
```

---

## ✅ Verificações Pós-Deploy

### Containers rodando?
```bash
ssh root@72.60.195.200 'docker ps | grep prevendas'
```

### Nginx configurado?
```bash
ssh root@72.60.195.200 'ls -la /etc/nginx/sites-enabled/ | grep prevendas'
```

### Aplicação respondendo?
```bash
curl -I https://prevendas.chorstconsult.com.br
```

---

## 🐛 Se Algo Der Errado

### Ver logs
```bash
ssh root@72.60.195.200 'cd /var/www/prevendas && docker-compose logs -f'
```

### Testar portas localmente
```bash
ssh root@72.60.195.200 'curl http://127.0.0.1:3010'  # Frontend
ssh root@72.60.195.200 'curl http://127.0.0.1:3011/api/health'  # Backend
```

### Verificar Nginx
```bash
ssh root@72.60.195.200 'nginx -t'
ssh root@72.60.195.200 'systemctl status nginx'
```

### Recomeçar
```bash
ssh root@72.60.195.200 'cd /var/www/prevendas && docker-compose down'
./deploy-with-existing-nginx.sh
```

---

## 📚 Documentação Completa

- [CORRECAO-DEPLOY.md](./CORRECAO-DEPLOY.md) - Explicação detalhada da correção
- [DEPLOY-HOSTINGER.md](./DEPLOY-HOSTINGER.md) - Guia completo original
- [BACKUP-RECOVERY.md](./BACKUP-RECOVERY.md) - Backup e recuperação

---

## 🎯 Pronto!

Execute agora:

```bash
./deploy-with-existing-nginx.sh
```

E aguarde a mágica acontecer! ✨

**Importante**: Este script foi corrigido para funcionar com o Nginx existente no seu servidor, sem conflitar com CRM, Finanças e outras aplicações.
