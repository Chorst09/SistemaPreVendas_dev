# Deploy Vercel + Neon - Quick Start

## ⚡ 5 Minutos para Deploy

### 1️⃣ Prepare o Neon
```bash
# Acesse https://console.neon.tech
# Crie um projeto e copie a connection string
# Exemplo: postgresql://user:password@host/database?sslmode=require
```

### 2️⃣ Configure o Vercel
```bash
# Instale Vercel CLI
npm install -g vercel

# Faça login
vercel login

# Link o projeto
cd frontend
vercel link
```

### 3️⃣ Adicione Variáveis de Ambiente

**Via Dashboard:**
1. Acesse https://vercel.com/dashboard
2. Selecione seu projeto
3. Settings → Environment Variables
4. Adicione:

```
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
PGHOST=seu-host.neon.tech
PGPORT=5432
PGUSER=seu-usuario
PGPASSWORD=sua-senha
PGDATABASE=seu-banco
DATABASE_URL_UNPOOLED=postgresql://user:password@host/database?sslmode=require
NEXT_PUBLIC_API_URL=https://seu-projeto.vercel.app/api
NEXT_PUBLIC_APP_NAME=Sistema de Prevendas
```

**Via CLI:**
```bash
./scripts/vercel-setup.sh
```

### 4️⃣ Deploy
```bash
cd frontend
vercel --prod
```

### 5️⃣ Acesse
```
https://seu-projeto.vercel.app
```

## 🔧 Solução de Problemas

### ❌ "Failed to set env vars"
**Solução**: Certifique-se de que todas as variáveis estão definidas no Vercel Dashboard

### ❌ "Connection refused"
**Solução**: 
1. Verifique a connection string
2. Adicione `?sslmode=require` ao final
3. Whitelist o IP do Vercel no Neon

### ❌ "Prisma Client not found"
**Solução**:
```bash
npx prisma generate
```

## 📊 Variáveis Obrigatórias

| Variável | Valor |
|----------|-------|
| `DATABASE_URL` | Connection string do Neon |
| `PGHOST` | Host do Neon |
| `PGUSER` | Usuário do banco |
| `PGPASSWORD` | Senha do banco |
| `PGDATABASE` | Nome do banco |

## 🚀 Próximos Passos

1. Verifique os logs: `vercel logs`
2. Teste a conexão: `npx prisma studio`
3. Configure domínio customizado no Vercel
4. Configure CI/CD no GitHub

## 📚 Documentação Completa

👉 [VERCEL-NEON-SETUP.md](./VERCEL-NEON-SETUP.md)

---

**Tempo estimado**: 5 minutos
**Dificuldade**: ⭐ Fácil
