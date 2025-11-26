# Arquitetura - Sistema de Prevendas

## 🏗️ Visão Geral

Sistema modular com separação clara entre frontend, backend e código compartilhado.

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Pages (App Router) → Components → Hooks → API       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Express.js)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Routes → Middleware → Controllers → Services → DB   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓ SQL
┌─────────────────────────────────────────────────────────────┐
│                  Database (PostgreSQL)                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              Shared (Types, Schemas, Utils)                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Types → Schemas (Zod) → Utilities                   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Estrutura de Pastas

### Backend

```
backend/
├── src/
│   ├── index.ts              # Entry point
│   ├── routes/               # API endpoints
│   │   ├── service-desk.ts
│   │   ├── proposals.ts
│   │   └── edital-analysis.ts
│   ├── middleware/           # Express middleware
│   │   └── error-handler.ts
│   ├── services/             # Business logic
│   ├── db/                   # Database setup
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── types/                # Local types
├── dist/                     # Compiled output
├── Dockerfile
├── package.json
└── tsconfig.json
```

### Frontend

```
frontend/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── [module]/
│   ├── components/           # React components
│   │   ├── ui/              # Base components
│   │   ├── service-desk/
│   │   ├── proposals/
│   │   └── edital-analysis/
│   ├── hooks/               # Custom hooks
│   │   └── use-api.ts
│   ├── lib/                 # Utilities
│   │   └── api-client.ts
│   ├── styles/              # Global styles
│   └── types/               # Local types
├── .next/                   # Build output
├── Dockerfile
├── package.json
└── next.config.ts
```

### Shared

```
shared/
├── types/
│   └── index.ts             # Interfaces compartilhadas
├── schemas/
│   └── index.ts             # Validação com Zod
└── utils/
    └── index.ts             # Funções reutilizáveis
```

## 🔄 Fluxo de Dados

### Exemplo: Cálculo Service Desk

```
1. Frontend
   └─ User input → Form validation → API call

2. Network
   └─ POST /api/service-desk/calculate

3. Backend
   ├─ Route handler
   ├─ Zod validation
   ├─ Business logic (calculateErlangC)
   └─ Response

4. Frontend
   └─ Parse response → Update state → Render
```

## 🔌 API Endpoints

### Service Desk
- `POST /api/service-desk/calculate` - Calcula dimensionamento
- `GET /api/service-desk/dimensions` - Lista dimensionamentos

### Proposals
- `POST /api/proposals` - Cria proposta
- `GET /api/proposals` - Lista propostas
- `GET /api/proposals/:id` - Detalhes da proposta

### Edital Analysis
- `POST /api/edital-analysis/analyze` - Analisa edital
- `GET /api/edital-analysis` - Lista análises

## 🔐 Segurança

### CORS
```typescript
cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
})
```

### Validação
```typescript
// Zod schemas validam dados de entrada
const schema = z.object({
  agents: z.number().min(1),
  // ...
})
```

### Variáveis de Ambiente
- Nunca commit `.env`
- Use `.env.example` como template
- Diferentes valores para dev/prod

## 📊 Banco de Dados

### Schema (Prisma)

```prisma
model ServiceDeskDimension {
  id        String   @id @default(cuid())
  agents    Int
  erlangC   Float
  createdAt DateTime @default(now())
}

model Proposal {
  id        String   @id @default(cuid())
  title     String
  status    String
  createdAt DateTime @default(now())
}
```

### Migrations

```bash
# Criar migração
npx prisma migrate dev --name add_field

# Deploy em produção
npx prisma migrate deploy
```

## 🧪 Testes

### Backend (Vitest)
```typescript
describe('Service Desk', () => {
  it('should calculate Erlang C', () => {
    const result = calculateErlangC(100, 300, 10);
    expect(result).toBeLessThan(1);
  });
});
```

### Frontend (Vitest + React Testing Library)
```typescript
describe('ServiceDeskForm', () => {
  it('should submit form', async () => {
    render(<ServiceDeskForm />);
    // ...
  });
});
```

## 🚀 Performance

### Frontend
- Code splitting automático (Next.js)
- Image optimization
- CSS-in-JS com Tailwind
- State management com Zustand

### Backend
- Connection pooling (Prisma)
- Request validation (Zod)
- Error handling centralizado
- Logging estruturado

## 📈 Escalabilidade

### Horizontal
- Frontend: Deploy em CDN/Vercel
- Backend: Load balancer + múltiplas instâncias
- Database: Read replicas

### Vertical
- Aumentar recursos (CPU/RAM)
- Otimizar queries
- Cache (Redis)

## 🔄 CI/CD

### GitHub Actions
```yaml
- Build e test
- Lint e type check
- Build Docker images
- Push para registry
- Deploy em produção
```

## 📚 Dependências Principais

### Backend
- `express` - Framework web
- `prisma` - ORM
- `zod` - Validação
- `cors` - CORS middleware

### Frontend
- `next` - Framework React
- `react-hook-form` - Gerenciamento de forms
- `zustand` - State management
- `tailwindcss` - Styling
- `radix-ui` - UI components

### Shared
- `zod` - Validação
- `typescript` - Type safety

---

**Última atualização**: Novembro 2025
