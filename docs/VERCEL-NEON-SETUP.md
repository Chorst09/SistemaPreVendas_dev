# Guia de Deploy no Vercel com Neon PostgreSQL

## 🚀 Passo 1: Preparar o Projeto

### 1.1 Instale Vercel CLI
```bash
npm install -g vercel
```

### 1.2 Faça login no Vercel
```bash
vercel login
```

### 1.3 Link o projeto
```bash
cd frontend
vercel link
```

## 🗄️ Passo 2: Configurar Neon PostgreSQL

### 2.1 Crie uma conta no Neon
1. Acesse https://console.neon.tech
2. Crie uma nova conta ou faça login
3. Crie um novo projeto

### 2.2 Obtenha a Connection String
1. No Neon, vá para **Project Settings**
2. Copie a **Connection String** (formato: `postgresql://user:password@host/database?sslmode=require`)

### 2.3 Copie as Credenciais
Você precisará de:
- `PGHOST` - Host do Neon
- `PGUSER` - Usuário do banco
- `PGPASSWORD` - Senha do banco
- `PGDATABASE` - Nome do banco
- `DATABASE_URL` - Connection string completa

## 🔧 Passo 3: Configurar Variáveis no Vercel

### 3.1 Via Dashboard Vercel
1. Acesse https://vercel.com/dashboard
2. Selecione seu projeto `sistema-prevendas-dev`
3. Vá para **Settings** → **Environment Variables**
4. Adicione as seguintes variáveis:

```
DATABASE_URL=postgresql://[user]:[password]@[host]/[database]?sslmode=require
PGHOST=[neon-host]
PGPORT=5432
PGUSER=[neon-user]
PGPASSWORD=[neon-password]
PGDATABASE=[neon-database]
DATABASE_URL_UNPOOLED=postgresql://[user]:[password]@[host]/[database]?sslmode=require
NEXT_PUBLIC_API_URL=https://seu-dominio.vercel.app/api
NEXT_PUBLIC_APP_NAME=Sistema de Prevendas
```

### 3.2 Via CLI
```bash
vercel env add DATABASE_URL
vercel env add PGHOST
vercel env add PGPORT
vercel env add PGUSER
vercel env add PGPASSWORD
vercel env add PGDATABASE
vercel env add DATABASE_URL_UNPOOLED
vercel env add NEXT_PUBLIC_API_URL
vercel env add NEXT_PUBLIC_APP_NAME
```

## 📝 Passo 4: Configurar Prisma

### 4.1 Atualize prisma/.env
```env
DATABASE_URL="postgresql://[user]:[password]@[host]/[database]?sslmode=require"
```

### 4.2 Gere o cliente Prisma
```bash
cd frontend
npx prisma generate
```

### 4.3 Execute as migrações
```bash
npx prisma migrate deploy
```

## 🚀 Passo 5: Deploy no Vercel

### 5.1 Deploy via CLI
```bash
cd frontend
vercel --prod
```

### 5.2 Deploy via Git
```bash
git push origin main
```
(Se você conectou o repositório GitHub ao Vercel)

## ✅ Passo 6: Verificar o Deploy

### 6.1 Acesse a aplicação
```
https://seu-projeto.vercel.app
```

### 6.2 Verifique os logs
```bash
vercel logs
```

### 6.3 Teste a conexão com o banco
```bash
npx prisma studio
```

## 🔍 Troubleshooting

### Erro: "Failed to set env vars"
**Solução**: Certifique-se de que todas as variáveis obrigatórias estão definidas:
- `DATABASE_URL`
- `PGHOST`
- `PGUSER`
- `PGPASSWORD`
- `PGDATABASE`

### Erro: "Connection refused"
**Solução**: 
1. Verifique se a connection string está correta
2. Adicione `?sslmode=require` ao final da URL
3. Verifique se o IP do Vercel está na whitelist do Neon

### Erro: "Prisma Client not found"
**Solução**:
```bash
npx prisma generate
```

### Erro: "Migration failed"
**Solução**:
```bash
npx prisma migrate resolve --rolled-back [migration-name]
npx prisma migrate deploy
```

## 📊 Variáveis de Ambiente Necessárias

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | Connection string completa | `postgresql://user:pass@host/db?sslmode=require` |
| `PGHOST` | Host do Neon | `ep-cool-cloud-123456.us-east-1.aws.neon.tech` |
| `PGPORT` | Porta PostgreSQL | `5432` |
| `PGUSER` | Usuário do banco | `neondb_owner` |
| `PGPASSWORD` | Senha do banco | `sua-senha-aqui` |
| `PGDATABASE` | Nome do banco | `neondb` |
| `DATABASE_URL_UNPOOLED` | Connection string sem pool | `postgresql://user:pass@host/db?sslmode=require` |
| `NEXT_PUBLIC_API_URL` | URL da API | `https://seu-dominio.vercel.app/api` |
| `NEXT_PUBLIC_APP_NAME` | Nome da app | `Sistema de Prevendas` |

## 🔐 Segurança

### Boas Práticas
1. ✅ Nunca commit `.env` ou `.env.local`
2. ✅ Use variáveis de ambiente para secrets
3. ✅ Ative SSL/TLS (`?sslmode=require`)
4. ✅ Use senhas fortes no Neon
5. ✅ Restrinja IP whitelist no Neon

### Rotação de Credenciais
Se precisar trocar a senha:
1. Vá para Neon Console
2. Clique em **Reset password**
3. Atualize `PGPASSWORD` no Vercel
4. Redeploy

## 📚 Referências

- [Vercel Docs](https://vercel.com/docs)
- [Neon Docs](https://neon.tech/docs)
- [Prisma Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html)

## 🆘 Suporte

Se encontrar problemas:
1. Verifique os logs do Vercel: `vercel logs`
2. Verifique os logs do Neon: Console do Neon
3. Teste localmente: `npm run dev`
4. Consulte a documentação oficial

---

**Última atualização**: Novembro 2025
**Status**: ✅ Pronto para Produção
