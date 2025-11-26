# Estrutura e Organização do Projeto

## Organização do Nível Raiz

```
raiz-projeto/
├── backend/              # Servidor API Express.js
├── frontend/             # Aplicação web Next.js
├── shared/               # Código compartilhado (tipos, schemas, utils)
├── prisma/               # Schema do banco & migrações
├── k8s/                  # Manifestos Kubernetes
├── scripts/              # Scripts de build & utilitários
├── tests/                # Suites de testes (visual, performance)
├── docs/                 # Documentação
├── public/               # Ativos estáticos (nível raiz)
├── src/                  # Fonte nível raiz (legado/monorepo)
├── docker-compose.yml    # Orquestração de desenvolvimento local
├── Dockerfile            # Configuração Docker nível raiz
├── package.json          # Dependências do workspace raiz
└── tsconfig.json         # Configuração TypeScript raiz
```

---

## Estrutura do Backend (`backend/`)

```
backend/
├── src/
│   ├── index.ts                    # Ponto de entrada, setup app Express
│   ├── middleware/
│   │   └── error-handler.ts        # Tratamento centralizado de erros
│   ├── routes/                     # Manipuladores de rotas da API
│   │   ├── service-desk.ts
│   │   ├── proposals.ts
│   │   ├── edital-analysis.ts
│   │   └── job-positions.ts
│   ├── services/                   # Camada de lógica de negócio
│   ├── db/
│   │   ├── schema.prisma           # Schema do banco (symlink para raiz)
│   │   └── seed.ts                 # Seed do banco
│   └── types/                      # Tipos específicos do backend
├── dist/                           # Saída compilada (gerada)
├── Dockerfile                      # Configuração container backend
├── package.json                    # Dependências do backend
├── tsconfig.json                   # Configuração TypeScript backend
└── .env.example                    # Template de ambiente
```

### Convenções do Backend
- **Routes**: Manipulam requisições HTTP, validação, formatação de resposta
- **Services**: Contêm lógica de negócio, cálculos, operações de banco
- **Middleware**: Preocupações transversais (auth, logging, tratamento de erro)
- **Types**: Interfaces específicas do backend (estendem tipos compartilhados conforme necessário)

---

## Estrutura do Frontend (`frontend/`)

```
frontend/
├── src/
│   ├── app/                        # App Router Next.js
│   │   ├── layout.tsx              # Layout raiz
│   │   ├── page.tsx                # Página inicial
│   │   ├── api/                    # Rotas da API (se necessário)
│   │   ├── dashboard/              # Páginas do dashboard
│   │   ├── projects/               # Páginas de gestão de projetos
│   │   ├── propostas/              # Páginas de propostas
│   │   ├── noc/                    # Páginas de precificação NOC
│   │   ├── login/                  # Páginas de autenticação
│   │   └── [module]/               # Rotas dinâmicas
│   │
│   ├── components/                 # Componentes React
│   │   ├── ui/                     # Componentes UI base (baseados em Radix)
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── form.tsx
│   │   │   └── ...
│   │   ├── shared/                 # Componentes compartilhados (Header, Footer, Nav)
│   │   ├── dashboard/              # Componentes específicos do dashboard
│   │   ├── proposals/              # Componentes relacionados a propostas
│   │   ├── propostas/              # Componentes de template de propostas
│   │   ├── calculators/            # Componentes de calculadoras
│   │   ├── edital-analysis/        # Componentes de análise de editais
│   │   ├── noc-pricing/            # Componentes de precificação NOC
│   │   ├── pdf-generation/         # Componentes de exportação PDF
│   │   └── [feature]/              # Componentes específicos de feature
│   │
│   ├── hooks/                      # Hooks React customizados
│   │   ├── use-api.ts              # Comunicação com API
│   │   ├── use-auth.tsx            # Autenticação
│   │   ├── use-mobile.tsx          # Design responsivo
│   │   ├── use-toast.ts            # Notificações toast
│   │   ├── use-pricing-integration.ts
│   │   ├── use-project-data.ts
│   │   └── ...
│   │
│   ├── lib/                        # Utilitários & helpers
│   │   ├── api-client.ts           # Wrapper Axios/fetch
│   │   ├── firebase.ts             # Configuração Firebase
│   │   ├── prisma.ts               # Cliente Prisma
│   │   ├── types.ts                # Tipos do frontend
│   │   ├── utils.ts                # Utilitários gerais
│   │   ├── feature-flags.ts        # Feature toggles
│   │   ├── constants/              # Constantes da app
│   │   ├── services/               # Funções de serviço da API
│   │   ├── stores/                 # Stores Zustand
│   │   └── utils/                  # Funções utilitárias
│   │
│   ├── contexts/                   # Provedores React Context
│   │   └── QuoteContext.tsx
│   │
│   ├── styles/                     # Estilos globais
│   │   ├── globals.css
│   │   ├── print.css
│   │   └── pabx-background.css
│   │
│   └── middleware.ts               # Middleware Next.js
│
├── public/                         # Ativos estáticos
│   ├── clients/                    # Logos de clientes
│   ├── images/                     # Imagens
│   └── proposal/                   # Templates de propostas
│
├── .next/                          # Saída de build (gerada)
├── Dockerfile                      # Configuração container frontend
├── next.config.ts                  # Configuração Next.js
├── tailwind.config.ts              # Configuração Tailwind CSS
├── postcss.config.mjs              # Configuração PostCSS
├── package.json                    # Dependências do frontend
├── tsconfig.json                   # Configuração TypeScript frontend
└── .env.example                    # Template de ambiente
```

### Convenções do Frontend
- **App Router**: Roteamento baseado em arquivos, componentes server/client
- **Components**: Reutilizáveis, responsabilidade única, baseados em props
- **Hooks**: Extração de lógica customizada, helpers de gestão de estado
- **Lib**: Funções puras, sem dependências React (na maioria)
- **Stores**: Zustand para estado global (auth, estado UI, etc.)
- **Services**: Funções de comunicação com API

---

## Estrutura de Código Compartilhado (`shared/`)

```
shared/
├── types/
│   └── index.ts                    # Interfaces TypeScript compartilhadas
│                                   # (User, Project, Proposal, etc.)
├── schemas/
│   └── index.ts                    # Schemas de validação Zod
│                                   # (Usados por frontend & backend)
└── utils/
    └── index.ts                    # Funções utilitárias compartilhadas
                                    # (Erlang C, formatação, cálculos)
```

### Convenções Compartilhadas
- **Types**: Interfaces usadas entre frontend e backend
- **Schemas**: Schemas Zod para validação em runtime (fonte única de verdade)
- **Utils**: Funções puras sem dependências externas

---

## Estrutura do Banco de Dados (`prisma/`)

```
prisma/
├── schema.prisma                   # Definição do schema do banco
├── migrations/
│   ├── 20251021210949_init/
│   │   └── migration.sql
│   ├── 20251022122753_add_job_positions_table/
│   │   └── migration.sql
│   └── migration_lock.toml
└── seed.ts                         # Script de seed do banco
```

### Convenções do Banco de Dados
- **Schema**: Fonte única de verdade para o modelo de dados
- **Migrations**: Mudanças de schema versionadas e incrementais
- **Seed**: População opcional de dados de desenvolvimento

---

## Estrutura de Testes (`tests/`)

```
tests/
├── visual/                         # Testes de regressão visual Playwright
│   ├── color-system.spec.ts
│   ├── components.spec.ts
│   ├── domain-components.spec.ts
│   └── utils/
├── performance/                    # Benchmarks de performance
│   ├── color-performance.test.ts
│   ├── comprehensive-performance.test.ts
│   └── benchmark-utils.ts
└── README.md                       # Guia de testes
```

### Convenções de Testes
- **Visual**: Playwright para testes de regressão UI
- **Performance**: Vitest para benchmarking
- **Unit/Integração**: Vitest em arquivos de componentes/serviços

---

## Estrutura de Scripts (`scripts/`)

```
scripts/
├── dev.sh                          # Inicialização de desenvolvimento local
├── build.sh                        # Build para produção
├── deploy.sh                       # Script de deploy
├── setup.sh                        # Setup inicial
├── migrate-colors.ts               # Migração do sistema de cores
├── performance-benchmark.ts        # Testes de performance
└── visual-regression-runner.ts     # Executor de regressão visual
```

---

## Estrutura de Documentação (`docs/`)

```
docs/
├── README.md                       # Índice de documentação
├── QUICKSTART.md                   # Guia de setup em 5 minutos
├── ARCHITECTURE.md                 # Arquitetura do sistema
├── API.md                          # Referência da API
├── DEPLOYMENT-GUIDE.md             # Deploy para produção
├── CONTRIBUTING.md                 # Guia de contribuição
├── color-system.md                 # Documentação do sistema de cores
└── [feature-docs]/                 # Docs específicas de feature
```

---

## Padrões e Convenções Principais

### Nomenclatura de Arquivos
- **Components**: PascalCase (`ServiceDeskForm.tsx`)
- **Hooks**: camelCase com prefixo `use` (`useApi.ts`)
- **Utils**: camelCase (`calculateErlangC.ts`)
- **Types**: PascalCase (`User.ts`, `Project.ts`)
- **Styles**: kebab-case (`pabx-background.css`)

### Organização de Imports
1. Dependências externas
2. Código compartilhado (`shared/`)
3. Utilitários lib locais
4. Componentes
5. Estilos

### Estrutura de Componentes
```typescript
// Imports
import { useState } from 'react';
import { Button } from '@/components/ui/button';

// Types
interface Props {
  title: string;
}

// Componente
export function MyComponent({ title }: Props) {
  // Lógica
  return <div>{title}</div>;
}
```

### Comunicação com API
- Use hook `use-api.ts` para busca de dados
- Valide respostas com schemas Zod
- Trate erros consistentemente
- Use padrões React Query (se necessário)

### Gestão de Estado
- **Global**: Stores Zustand em `lib/stores/`
- **Local**: React `useState`
- **Servidor**: Queries Prisma no backend

### Acesso ao Banco de Dados
- Apenas backend: Use cliente Prisma
- Frontend: Chame endpoints da API backend
- Nunca exponha banco diretamente ao frontend

---

## Configuração de Ambiente

### Backend (`.env`)
```
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://...
CORS_ORIGIN=http://localhost:3000
```

### Frontend (`.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_NAME=Sistema de Prevendas
```

---

## Saídas de Build

| Diretório | Propósito | Gerado |
|-----------|-----------|--------|
| `backend/dist/` | Backend compilado | Sim |
| `frontend/.next/` | Build Next.js | Sim |
| `node_modules/` | Dependências | Sim |
| `public/` | Ativos estáticos | Não |
| `prisma/migrations/` | Migrações do banco | Não |

---

**Última Atualização**: Novembro 2025
