# Quick Start - Sistema de Prevendas

## ⚡ 5 Minutos para Começar

### 1️⃣ Clone e Setup

```bash
# Clone o repositório
git clone <seu-repo>
cd projeto-root

# Execute setup
chmod +x scripts/*.sh
./scripts/setup.sh
```

### 2️⃣ Inicie o Desenvolvimento

```bash
# Opção A: Com Docker (Recomendado)
./scripts/dev.sh

# Opção B: Sem Docker
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 3️⃣ Acesse a Aplicação

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001/api/health
- **Database**: localhost:5432

## 📁 Estrutura Rápida

```
backend/          → API Express.js (porta 3001)
frontend/         → Next.js App (porta 3000)
shared/           → Tipos e schemas compartilhados
docs/             → Documentação completa
scripts/          → Automação
```

## 🔧 Comandos Úteis

### Backend
```bash
cd backend

npm run dev          # Desenvolvimento
npm run build        # Build
npm run test         # Testes
npm run migrate      # Migrações do banco
npm run db:seed      # Seed do banco
```

### Frontend
```bash
cd frontend

npm run dev          # Desenvolvimento
npm run build        # Build
npm run test         # Testes
npm run lint         # Lint
```

## 🐳 Docker

```bash
# Iniciar tudo
docker-compose up --build

# Parar
docker-compose down

# Ver logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 📝 Variáveis de Ambiente

### Backend (.env)
```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://prevendas:prevendas123@localhost:5432/sistema_prevendas
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## 🧪 Testes

```bash
# Backend
cd backend && npm run test

# Frontend
cd frontend && npm run test

# Visual (Frontend)
cd frontend && npm run test:visual
```

## 📚 Documentação

- **[README.md](./README.md)** - Visão geral
- **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - Arquitetura
- **[docs/API.md](./docs/API.md)** - Endpoints
- **[docs/DEPLOYMENT-GUIDE.md](./docs/DEPLOYMENT-GUIDE.md)** - Deploy
- **[docs/MIGRATION-GUIDE.md](./docs/MIGRATION-GUIDE.md)** - Migração

## 🚀 Deploy

### Docker
```bash
./scripts/deploy-docker.sh
```

### Vercel (Frontend)
```bash
cd frontend
vercel --prod
```

### Heroku (Backend)
```bash
heroku create seu-app
git push heroku main
```

## 🆘 Troubleshooting

### Porta já em uso
```bash
# Mude a porta em backend/.env
PORT=3002
```

### Banco de dados não conecta
```bash
# Verifique DATABASE_URL
echo $DATABASE_URL

# Reinicie containers
docker-compose down
docker-compose up --build
```

### Módulos não encontrados
```bash
# Reinstale dependências
cd backend && npm install
cd frontend && npm install
```

## 💡 Próximos Passos

1. **Migrar código legado** → Ver `docs/MIGRATION-GUIDE.md`
2. **Adicionar autenticação** → Implementar JWT
3. **Configurar CI/CD** → GitHub Actions
4. **Deploy em produção** → Kubernetes ou Vercel

## 📞 Suporte

- 📖 Consulte a documentação em `docs/`
- 🐛 Reporte bugs em Issues
- 💬 Discussões em Discussions

---

**Pronto para começar?** Execute `./scripts/setup.sh` agora! 🚀
