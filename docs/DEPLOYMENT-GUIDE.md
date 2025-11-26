# Guia de Deploy - Sistema de Prevendas

## 📋 Pré-requisitos

- Docker e Docker Compose
- Node.js 20+
- PostgreSQL 16+ (se não usar Docker)
- Git

## 🐳 Deploy com Docker Compose (Recomendado)

### Desenvolvimento Local

```bash
# 1. Clone o repositório
git clone <repo>
cd projeto-root

# 2. Configure variáveis de ambiente
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 3. Inicie os containers
docker-compose up --build

# 4. Acesse
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
# Database: localhost:5432
```

### Produção

```bash
# 1. Configure variáveis de produção
export NODE_ENV=production
export DATABASE_URL="postgresql://user:pass@prod-db:5432/db"
export CORS_ORIGIN="https://seu-dominio.com"

# 2. Build e inicie
docker-compose -f docker-compose.yml up -d

# 3. Verifique saúde
curl http://localhost:3001/api/health
```

## ☁️ Deploy em Kubernetes

### Preparação

```bash
# 1. Build e push das imagens
docker build -t seu-registry/backend:latest ./backend
docker build -t seu-registry/frontend:latest ./frontend

docker push seu-registry/backend:latest
docker push seu-registry/frontend:latest

# 2. Atualize k8s/deployment.yaml com suas imagens
```

### Deploy

```bash
# 1. Crie namespace
kubectl create namespace sistema-prevendas

# 2. Configure secrets
kubectl create secret generic db-credentials \
  --from-literal=DATABASE_URL="postgresql://..." \
  -n sistema-prevendas

# 3. Deploy
kubectl apply -f k8s/ -n sistema-prevendas

# 4. Verifique
kubectl get pods -n sistema-prevendas
kubectl logs -f deployment/backend -n sistema-prevendas
```

## 🚀 Deploy em Vercel (Frontend)

### Setup

```bash
# 1. Instale Vercel CLI
npm i -g vercel

# 2. Faça login
vercel login

# 3. Configure projeto
cd frontend
vercel link

# 4. Configure variáveis de ambiente
vercel env add NEXT_PUBLIC_API_URL
# Digite: https://seu-backend.com/api
```

### Deploy

```bash
# Produção
vercel --prod

# Preview
vercel
```

## 🔌 Deploy do Backend em Heroku

### Setup

```bash
# 1. Instale Heroku CLI
brew tap heroku/brew && brew install heroku

# 2. Faça login
heroku login

# 3. Crie app
heroku create seu-app-backend

# 4. Configure banco de dados
heroku addons:create heroku-postgresql:standard-0 -a seu-app-backend

# 5. Configure variáveis
heroku config:set NODE_ENV=production -a seu-app-backend
heroku config:set CORS_ORIGIN=https://seu-frontend.vercel.app -a seu-app-backend
```

### Deploy

```bash
# 1. Adicione remote
git remote add heroku https://git.heroku.com/seu-app-backend.git

# 2. Deploy
git push heroku main

# 3. Verifique
heroku logs --tail -a seu-app-backend
```

## 🔐 Variáveis de Ambiente

### Backend

```env
# Obrigatórias
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:pass@host:5432/db
CORS_ORIGIN=https://seu-dominio.com

# Opcionais
GENKIT_API_KEY=your-key
LOG_LEVEL=info
```

### Frontend

```env
NEXT_PUBLIC_API_URL=https://seu-backend.com/api
NEXT_PUBLIC_APP_NAME=Sistema de Prevendas
```

## 🗄️ Banco de Dados

### Migração Inicial

```bash
# 1. Conecte ao banco
psql postgresql://user:pass@host:5432/db

# 2. Execute migrações
cd backend
npx prisma migrate deploy

# 3. Seed (opcional)
npm run db:seed
```

### Backup

```bash
# Backup
pg_dump postgresql://user:pass@host:5432/db > backup.sql

# Restore
psql postgresql://user:pass@host:5432/db < backup.sql
```

## 📊 Monitoramento

### Health Checks

```bash
# Backend
curl https://seu-backend.com/api/health

# Frontend
curl https://seu-frontend.com
```

### Logs

```bash
# Docker
docker-compose logs -f backend
docker-compose logs -f frontend

# Kubernetes
kubectl logs -f deployment/backend -n sistema-prevendas
kubectl logs -f deployment/frontend -n sistema-prevendas

# Heroku
heroku logs --tail -a seu-app-backend
```

## 🔄 CI/CD com GitHub Actions

### Setup

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Backend
        run: |
          cd backend
          npm install
          npm run build
      
      - name: Build Frontend
        run: |
          cd frontend
          npm install
          npm run build
      
      - name: Deploy
        run: |
          # Seu script de deploy
          ./scripts/deploy-docker.sh
```

## 🆘 Troubleshooting

### Backend não conecta ao banco

```bash
# Verifique conexão
psql $DATABASE_URL

# Verifique migrações
npx prisma migrate status

# Execute migrações
npx prisma migrate deploy
```

### Frontend não conecta ao backend

```bash
# Verifique CORS
curl -H "Origin: http://localhost:3000" \
  http://localhost:3001/api/health

# Verifique variável de ambiente
echo $NEXT_PUBLIC_API_URL
```

### Containers não iniciam

```bash
# Verifique logs
docker-compose logs

# Reconstrua
docker-compose down
docker-compose up --build
```

## 📈 Performance

### Otimizações

- Frontend: Next.js Image Optimization, Code Splitting
- Backend: Connection Pooling, Caching
- Database: Indexes, Query Optimization

### Scaling

```bash
# Kubernetes - Scale backend
kubectl scale deployment backend --replicas=3 -n sistema-prevendas

# Docker Compose - Use load balancer
# Configure nginx ou similar
```

## 🔒 Segurança

- Use HTTPS em produção
- Configure CORS corretamente
- Use variáveis de ambiente para secrets
- Mantenha dependências atualizadas
- Configure firewall/WAF

---

**Última atualização**: Novembro 2025
