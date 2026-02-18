# 🎯 Como Executar o Deploy

## Passo a Passo

### 1️⃣ Verificar DNS (✅ Já está OK!)

O DNS está configurado corretamente:
- `prevendas.chorstconsult.com.br` → `72.60.195.200`

### 2️⃣ Executar o Deploy

No terminal, na pasta do projeto, execute:

```bash
./deploy-simple.sh
```

**Importante**: Você precisará digitar a senha SSH quando solicitado:
- Senha: `raizCh@#horst1977#@`

### 3️⃣ Aguardar

O processo leva aproximadamente 10-15 minutos na primeira vez:

1. ⏳ Preparando arquivos... (1 min)
2. ⏳ Enviando para servidor... (2-3 min)
3. ⏳ Instalando Docker... (2-3 min)
4. ⏳ Obtendo certificado SSL... (1-2 min)
5. ⏳ Build dos containers... (5-7 min)
6. ⏳ Executando migrações... (1 min)

### 4️⃣ Verificar

Após o deploy, acesse:

**https://prevendas.chorstconsult.com.br**

## 🔍 Monitorar o Deploy

Durante o deploy, você pode abrir outro terminal e monitorar:

```bash
# Ver logs em tempo real
ssh root@72.60.195.200 'cd /var/www/prevendas && docker-compose logs -f'
```

## ✅ Deploy Bem-Sucedido

Você verá a mensagem:

```
✅ Deploy concluído com sucesso!
🌐 Acesse: https://prevendas.chorstconsult.com.br
```

## ❌ Se Algo Der Errado

### Erro de Conexão SSH
```bash
# Teste a conexão
ssh root@72.60.195.200
```

### Erro no Build
```bash
# Ver logs detalhados
ssh root@72.60.195.200 'cd /var/www/prevendas && docker-compose logs'
```

### Erro de Certificado SSL
```bash
# Verificar se o certbot conseguiu obter o certificado
ssh root@72.60.195.200 'ls -la /etc/letsencrypt/live/prevendas.chorstconsult.com.br/'
```

### Recomeçar do Zero
```bash
ssh root@72.60.195.200 'cd /var/www/prevendas && docker-compose down -v'
./deploy-simple.sh
```

## 📊 Após o Deploy

### Ver Status dos Containers
```bash
ssh root@72.60.195.200 'docker ps'
```

Você deve ver 4 containers rodando:
- prevendas-nginx
- prevendas-frontend
- prevendas-backend
- prevendas-db

### Testar a API
```bash
curl https://prevendas.chorstconsult.com.br/api/health
```

### Ver Logs
```bash
# Frontend
ssh root@72.60.195.200 'docker logs prevendas-frontend'

# Backend
ssh root@72.60.195.200 'docker logs prevendas-backend'

# Banco
ssh root@72.60.195.200 'docker logs prevendas-db'
```

## 🔄 Fazer Atualizações

Para atualizar o código após mudanças:

```bash
./deploy-simple.sh
```

O script detecta que já existe uma instalação e apenas atualiza os containers.

## 🆘 Suporte

Consulte os guias detalhados:
- [QUICK-DEPLOY.md](./QUICK-DEPLOY.md) - Comandos rápidos
- [DEPLOY-HOSTINGER.md](./DEPLOY-HOSTINGER.md) - Guia completo
- [PRE-DEPLOY-CHECKLIST.md](./PRE-DEPLOY-CHECKLIST.md) - Checklist

## 🎉 Pronto!

Agora é só executar:

```bash
./deploy-simple.sh
```

E aguardar a mágica acontecer! ✨
