# Sistema de Prevendas - Arquitetura Refatorada v3.0

Reorganização completa do projeto com separação clara entre backend e frontend, pronto para publicação e deploy em produção. Banco NEON configurado e migrações aplicadas.

## � Quick uStart

👉 **[Comece em 5 minutos](./docs/QUICKSTART.md)** - Deploy automático configurado!

## 📁 Estrutura do Projeto

```
projeto-root/
├── backend/                 # API Node.js/Express
│   ├── src/
│   │   ├── index.ts        # Entry point
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Express middleware
│   │   └── db/             # Database setup
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/               # Next.js App
│   ├── src/
│   │   ├── app/           # App Router pages
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Utilities
│   │   └── styles/        # Global styles
│   ├── Dockerfile
│   ├── package.json
│   └── next.config.ts
│
├── shared/                # Código compartilhado
│   ├── types/            # TypeScript types
│   ├── schemas/          # Zod schemas
│   └── utils/            # Funções utilitárias
│
├── docker-compose.yml    # Orquestração local
└── docs/                 # Documentação
```

## 🚀 Quick Start

### Desenvolvimento Local

```bash
# 1. Clone e instale dependências
git clone <repo>
cd projeto-root

# 2. Configure variáveis de ambiente
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Inicie com Docker Compose
docker-compose up --build

# Frontend: http://localhost:3000
# Backend: http://localhost:3001
# Database: localhost:5432
```

### Sem Docker

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (em outro terminal)
cd frontend
npm install
npm run dev
```

## 🏗️ Arquitetura

### Backend (Express.js)
- **Port**: 3001
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Validation**: Zod
- **API Routes**:
  - `/api/service-desk` - Dimensionamento e cálculos
  - `/api/edital-analysis` - Análise de editais
  - `/api/proposals` - Gestão de propostas

### Frontend (Next.js)
- **Port**: 3000
- **Framework**: React 18
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **State Management**: Zustand
- **Forms**: React Hook Form

### Shared
- **Types**: Interfaces TypeScript compartilhadas
- **Schemas**: Validação com Zod
- **Utils**: Funções reutilizáveis (Erlang C, formatação, etc)

## 📦 Deploy

### Docker
```bash
# Build images
docker build -t sistema-prevendas-backend ./backend
docker build -t sistema-prevendas-frontend ./frontend

# Run containers
docker run -p 3001:3001 sistema-prevendas-backend
docker run -p 3000:3000 sistema-prevendas-frontend
```

### Kubernetes
```bash
kubectl apply -f k8s/
```

### Vercel (Frontend)
```bash
vercel --prod
```

## 🔧 Scripts Disponíveis

### Backend
```bash
npm run dev          # Desenvolvimento com hot reload
npm run build        # Build para produção
npm run start        # Inicia servidor
npm run typecheck    # Verifica tipos TypeScript
npm run test         # Executa testes
npm run migrate      # Executa migrações do banco
```

### Frontend
```bash
npm run dev          # Desenvolvimento
npm run build        # Build para produção
npm run start        # Inicia servidor
npm run lint         # Lint do código
npm run test         # Executa testes
npm run test:visual  # Testes visuais com Playwright
```

## �️ Banco de Dados

### Setup
```bash
# Criar arquivo .env no backend
DATABASE_URL="postgresql://prevendas:prevendas123@localhost:5432/sistema_prevendas"

# Executar migrações
cd backend
npm run migrate
```

### Prisma
```bash
# Gerar cliente Prisma
npx prisma generate

# Abrir Prisma Studio
npx prisma studio

# Criar nova migração
npx prisma migrate dev --name nome_da_migracao
```

## 🧪 Testes

### Backend
```bash
npm run test         # Vitest
npm run test:run     # Execução única
```

### Frontend
```bash
npm run test         # Vitest
npm run test:visual  # Playwright
```

## 📚 Documentação

### Comece por:
- **[Quick Start](./docs/QUICKSTART.md)** - 5 minutos para começar
- **[Índice de Documentação](./docs/INDEX.md)** - Todos os guias

### Documentação Técnica:
- **[Arquitetura](./docs/ARCHITECTURE.md)** - Visão geral da arquitetura
- **[API Reference](./docs/API.md)** - Endpoints disponíveis
- **[Guia de Deploy](./docs/DEPLOYMENT-GUIDE.md)** - Deploy em produção
- **[Guia de Migração](./docs/MIGRATION-GUIDE.md)** - Migrar código legado
- **[Migração Completa](./docs/MIGRATION-COMPLETED.md)** - Status da migração

### Contribuição:
- **[Guia de Contribuição](./docs/CONTRIBUTING.md)** - Como contribuir
- **[Checklist de Verificação](./docs/VERIFICATION-CHECKLIST.md)** - Verificação final
- **[Resumo da Refatoração](./docs/REFACTORING-SUMMARY.md)** - Detalhes técnicos

## 🔐 Variáveis de Ambiente

### Backend (.env)
```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/db
CORS_ORIGIN=http://localhost:3000
GENKIT_API_KEY=your-key
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_NAME=Sistema de Prevendas
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/feature-name`)
3. Commit mudanças (`git commit -m 'Add feature'`)
4. Push (`git push origin feature/feature-name`)
5. Abra um Pull Request

## 📝 Licença

MIT License - veja LICENSE para detalhes

## 👨‍💻 Autor

Carlos Horst - [@Chorst09](https://github.com/Chorst09)

---

**Status**: ✅ Pronto para produção
**Última atualização**: Novembro 2025
