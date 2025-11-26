# Pilha Tecnológica e Sistema de Build

## Visão Geral da Pilha Tecnológica

### Frontend
- **Framework**: Next.js 15.3.3 (React 18, App Router)
- **Linguagem**: TypeScript 5
- **Estilo**: Tailwind CSS 3.4.1 + PostCSS
- **Componentes UI**: Radix UI (biblioteca de componentes acessíveis)
- **Formulários**: React Hook Form 7.54.2 + validação Zod
- **Gestão de Estado**: Zustand 5.0.7
- **Gráficos**: Recharts 2.15.1
- **Geração de PDF**: jsPDF 3.0.1, html2canvas 1.4.1
- **Processamento de Documentos**: Mammoth 1.10.0 (docs Word), pdfjs-dist 5.4.54
- **Planilhas**: XLSX 0.18.5
- **Animações**: Framer Motion 12.23.24
- **Ícones**: Lucide React 0.475.0
- **Manipulação de Datas**: date-fns 3.6.0
- **Tema**: next-themes 0.3.0
- **Testes**: Vitest 3.2.4, Playwright 1.55.0, React Testing Library
- **Ferramenta de Build**: Turbopack (via Next.js)

### Backend
- **Runtime**: Node.js (módulos ES)
- **Framework**: Express.js 4.18.2
- **Linguagem**: TypeScript 5
- **ORM do Banco**: Prisma 6.17.1
- **Banco de Dados**: PostgreSQL
- **Validação**: Zod 3.24.2
- **CORS**: cors 2.8.5
- **Ambiente**: dotenv 16.5.0
- **Integração com IA**: Genkit 1.14.1, @genkit-ai/googleai 1.14.1
- **Testes**: Vitest 3.2.4
- **Runtime de Dev**: tsx 4.20.6 (execução TypeScript)

### Código Compartilhado
- **Validação**: Schemas Zod
- **Tipos**: Interfaces TypeScript
- **Utilitários**: Funções compartilhadas (cálculos Erlang C, formatação, etc.)

### DevOps e Infraestrutura
- **Containerização**: Docker, Docker Compose
- **Orquestração**: Kubernetes (manifestos k8s inclusos)
- **CI/CD**: Pronto para GitHub Actions
- **Deploy**: Vercel (frontend), servidores customizados (backend)
- **Migrações de Banco**: Migrações Prisma

### Ferramentas de Desenvolvimento
- **Gerenciador de Pacotes**: npm
- **Controle de Versão**: Git
- **Qualidade de Código**: ESLint, modo strict TypeScript
- **Framework de Testes**: Vitest (unit/integração), Playwright (E2E/visual)
- **Build**: Compilador TypeScript, sistema de build Next.js

---

## Comandos Comuns

### Desenvolvimento Frontend
```bash
# Desenvolvimento com Turbopack
npm run dev

# Build para produção
npm run build

# Inicia servidor de produção
npm run start

# Verificação de tipos
npm run typecheck

# Linting
npm run lint

# Testes unitários/integração
npm run test
npm run test:run

# Testes de regressão visual
npm run test:visual
npm run test:visual:ui
npm run test:visual:update
npm run test:visual:regression

# Benchmarks de performance
npm run test:performance
npm run benchmark:performance
```

### Desenvolvimento Backend
```bash
# Desenvolvimento com hot reload
npm run dev

# Build para produção
npm run build

# Inicia servidor de produção
npm run start

# Verificação de tipos
npm run typecheck

# Linting
npm run lint

# Testes
npm run test
npm run test:run

# Migrações de banco
npm run migrate
npm run migrate:prod

# Seed do banco
npm run db:seed
```

### Banco de Dados (Prisma)
```bash
# Gera cliente Prisma
npx prisma generate

# Cria migração
npx prisma migrate dev --name nome_migracao

# Deploy de migrações (produção)
npx prisma migrate deploy

# Abre Prisma Studio (GUI)
npx prisma studio

# Seed do banco
npx prisma db seed
```

### Docker
```bash
# Build de todos os serviços
docker-compose up --build

# Executa em background
docker-compose up -d

# Para serviços
docker-compose down

# Visualiza logs
docker-compose logs -f [nome-servico]

# Build de imagens individuais
docker build -t sistema-prevendas-backend ./backend
docker build -t sistema-prevendas-frontend ./frontend
```

### Kubernetes
```bash
# Aplica todos os manifestos
kubectl apply -f k8s/

# Verifica status
kubectl get pods -n sistema-prevendas

# Visualiza logs
kubectl logs -f deployment/app -n sistema-prevendas

# Port forward
kubectl port-forward svc/app 3000:3000 -n sistema-prevendas
```

---

## Build e Deploy

### Build Frontend
- **Saída**: Diretório `.next/`
- **Otimização**: Code splitting automático, otimização de imagens
- **Deploy**: Vercel, Docker, ou qualquer host estático
- **Ambiente**: `NEXT_PUBLIC_API_URL` para endpoint da API

### Build Backend
- **Saída**: Diretório `dist/` (JavaScript compilado)
- **Otimização**: Compilação TypeScript com modo strict
- **Deploy**: Docker, Kubernetes, ou servidores Node.js
- **Ambiente**: `DATABASE_URL`, `CORS_ORIGIN`, `PORT`

### Banco de Dados
- **Provedor**: PostgreSQL
- **Migrações**: Migrações Prisma (versionadas)
- **Seed**: Scripts opcionais de seed para desenvolvimento

---

## Arquivos de Configuração Principais

| Arquivo | Propósito |
|---------|-----------|
| `tsconfig.json` | Configuração TypeScript (raiz) |
| `frontend/tsconfig.json` | Configuração TypeScript específica do frontend |
| `backend/tsconfig.json` | Configuração TypeScript específica do backend |
| `tailwind.config.ts` | Customização Tailwind CSS |
| `postcss.config.mjs` | Plugins PostCSS |
| `next.config.ts` | Configuração Next.js |
| `prisma/schema.prisma` | Definição do schema do banco |
| `docker-compose.yml` | Orquestração de desenvolvimento local |
| `k8s/*.yaml` | Manifestos Kubernetes |
| `.env.example` | Template de variáveis de ambiente |

---

## Considerações de Performance

- **Frontend**: Turbopack para builds rápidos, code splitting automático, otimização de imagens
- **Backend**: Connection pooling via Prisma, validação de requisições com Zod
- **Banco de Dados**: Queries indexadas, migrações para mudanças de schema
- **Cache**: Headers HTTP configurados para respostas da API

---

## Estratégia de Testes

- **Unit/Integração**: Vitest (rápido, nativo ESM)
- **Regressão Visual**: Playwright com snapshot testing
- **Performance**: Benchmarks customizados em `tests/performance/`
- **E2E**: Playwright para fluxos críticos de usuário

---

**Última Atualização**: Novembro 2025
