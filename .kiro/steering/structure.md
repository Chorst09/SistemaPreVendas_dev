# Project Structure & Organization

## Root Level Organization

```
proyecto-root/
├── backend/              # Express.js API server
├── frontend/             # Next.js web application
├── shared/               # Shared code (types, schemas, utils)
├── prisma/               # Database schema & migrations
├── k8s/                  # Kubernetes manifests
├── scripts/              # Build & utility scripts
├── tests/                # Test suites (visual, performance)
├── docs/                 # Documentation
├── public/               # Static assets (root level)
├── src/                  # Root-level source (legacy/monorepo)
├── docker-compose.yml    # Local development orchestration
├── Dockerfile            # Root-level Docker config
├── package.json          # Root workspace dependencies
└── tsconfig.json         # Root TypeScript config
```

---

## Backend Structure (`backend/`)

```
backend/
├── src/
│   ├── index.ts                    # Entry point, Express app setup
│   ├── middleware/
│   │   └── error-handler.ts        # Centralized error handling
│   ├── routes/                     # API route handlers
│   │   ├── service-desk.ts
│   │   ├── proposals.ts
│   │   ├── edital-analysis.ts
│   │   └── job-positions.ts
│   ├── services/                   # Business logic layer
│   ├── db/
│   │   ├── schema.prisma           # Database schema (symlink to root)
│   │   └── seed.ts                 # Database seeding
│   └── types/                      # Backend-specific types
├── dist/                           # Compiled output (generated)
├── Dockerfile                      # Backend container config
├── package.json                    # Backend dependencies
├── tsconfig.json                   # Backend TypeScript config
└── .env.example                    # Environment template
```

### Backend Conventions
- **Routes**: Handle HTTP requests, validation, response formatting
- **Services**: Contain business logic, calculations, database operations
- **Middleware**: Cross-cutting concerns (auth, logging, error handling)
- **Types**: Backend-specific interfaces (extend shared types as needed)

---

## Frontend Structure (`frontend/`)

```
frontend/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Home page
│   │   ├── api/                    # API routes (if needed)
│   │   ├── dashboard/              # Dashboard pages
│   │   ├── projects/               # Project management pages
│   │   ├── propostas/              # Proposal pages
│   │   ├── noc/                    # NOC pricing pages
│   │   ├── login/                  # Authentication pages
│   │   └── [module]/               # Dynamic routes
│   │
│   ├── components/                 # React components
│   │   ├── ui/                     # Base UI components (Radix-based)
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── form.tsx
│   │   │   └── ...
│   │   ├── shared/                 # Shared components (Header, Footer, Nav)
│   │   ├── dashboard/              # Dashboard-specific components
│   │   ├── proposals/              # Proposal-related components
│   │   ├── propostas/              # Proposal template components
│   │   ├── calculators/            # Calculator components
│   │   ├── edital-analysis/        # Edital analysis components
│   │   ├── noc-pricing/            # NOC pricing components
│   │   ├── pdf-generation/         # PDF export components
│   │   └── [feature]/              # Feature-specific components
│   │
│   ├── hooks/                      # Custom React hooks
│   │   ├── use-api.ts              # API communication
│   │   ├── use-auth.tsx            # Authentication
│   │   ├── use-mobile.tsx          # Responsive design
│   │   ├── use-toast.ts            # Toast notifications
│   │   ├── use-pricing-integration.ts
│   │   ├── use-project-data.ts
│   │   └── ...
│   │
│   ├── lib/                        # Utilities & helpers
│   │   ├── api-client.ts           # Axios/fetch wrapper
│   │   ├── firebase.ts             # Firebase config
│   │   ├── prisma.ts               # Prisma client
│   │   ├── types.ts                # Frontend types
│   │   ├── utils.ts                # General utilities
│   │   ├── feature-flags.ts        # Feature toggles
│   │   ├── constants/              # App constants
│   │   ├── services/               # API service functions
│   │   ├── stores/                 # Zustand stores
│   │   └── utils/                  # Utility functions
│   │
│   ├── contexts/                   # React Context providers
│   │   └── QuoteContext.tsx
│   │
│   ├── styles/                     # Global styles
│   │   ├── globals.css
│   │   ├── print.css
│   │   └── pabx-background.css
│   │
│   └── middleware.ts               # Next.js middleware
│
├── public/                         # Static assets
│   ├── clients/                    # Client logos
│   ├── images/                     # Images
│   └── proposal/                   # Proposal templates
│
├── .next/                          # Build output (generated)
├── Dockerfile                      # Frontend container config
├── next.config.ts                  # Next.js configuration
├── tailwind.config.ts              # Tailwind CSS config
├── postcss.config.mjs              # PostCSS config
├── package.json                    # Frontend dependencies
├── tsconfig.json                   # Frontend TypeScript config
└── .env.example                    # Environment template
```

### Frontend Conventions
- **App Router**: File-based routing, server/client components
- **Components**: Reusable, single responsibility, prop-based
- **Hooks**: Custom logic extraction, state management helpers
- **Lib**: Pure functions, no React dependencies (mostly)
- **Stores**: Zustand for global state (auth, UI state, etc.)
- **Services**: API communication functions

---

## Shared Code Structure (`shared/`)

```
shared/
├── types/
│   └── index.ts                    # Shared TypeScript interfaces
│                                   # (User, Project, Proposal, etc.)
├── schemas/
│   └── index.ts                    # Zod validation schemas
│                                   # (Used by both frontend & backend)
└── utils/
    └── index.ts                    # Shared utility functions
                                    # (Erlang C, formatting, calculations)
```

### Shared Conventions
- **Types**: Interfaces used across frontend and backend
- **Schemas**: Zod schemas for runtime validation (single source of truth)
- **Utils**: Pure functions with no external dependencies

---

## Database Structure (`prisma/`)

```
prisma/
├── schema.prisma                   # Database schema definition
├── migrations/
│   ├── 20251021210949_init/
│   │   └── migration.sql
│   ├── 20251022122753_add_job_positions_table/
│   │   └── migration.sql
│   └── migration_lock.toml
└── seed.ts                         # Database seeding script
```

### Database Conventions
- **Schema**: Single source of truth for data model
- **Migrations**: Version-controlled, incremental schema changes
- **Seed**: Optional development data population

---

## Tests Structure (`tests/`)

```
tests/
├── visual/                         # Playwright visual regression tests
│   ├── color-system.spec.ts
│   ├── components.spec.ts
│   ├── domain-components.spec.ts
│   └── utils/
├── performance/                    # Performance benchmarks
│   ├── color-performance.test.ts
│   ├── comprehensive-performance.test.ts
│   └── benchmark-utils.ts
└── README.md                       # Testing guide
```

### Test Conventions
- **Visual**: Playwright for UI regression testing
- **Performance**: Vitest for benchmarking
- **Unit/Integration**: Vitest in component/service files

---

## Scripts Structure (`scripts/`)

```
scripts/
├── dev.sh                          # Local development startup
├── build.sh                        # Production build
├── deploy.sh                       # Deployment script
├── setup.sh                        # Initial setup
├── migrate-colors.ts               # Color system migration
├── performance-benchmark.ts        # Performance testing
└── visual-regression-runner.ts     # Visual regression runner
```

---

## Documentation Structure (`docs/`)

```
docs/
├── README.md                       # Documentation index
├── QUICKSTART.md                   # 5-minute setup guide
├── ARCHITECTURE.md                 # System architecture
├── API.md                          # API reference
├── DEPLOYMENT-GUIDE.md             # Production deployment
├── CONTRIBUTING.md                 # Contribution guidelines
├── color-system.md                 # Color system documentation
└── [feature-docs]/                 # Feature-specific docs
```

---

## Key Patterns & Conventions

### File Naming
- **Components**: PascalCase (`ServiceDeskForm.tsx`)
- **Hooks**: camelCase with `use` prefix (`useApi.ts`)
- **Utils**: camelCase (`calculateErlangC.ts`)
- **Types**: PascalCase (`User.ts`, `Project.ts`)
- **Styles**: kebab-case (`pabx-background.css`)

### Import Organization
1. External dependencies
2. Shared code (`shared/`)
3. Local lib utilities
4. Components
5. Styles

### Component Structure
```typescript
// Imports
import { useState } from 'react';
import { Button } from '@/components/ui/button';

// Types
interface Props {
  title: string;
}

// Component
export function MyComponent({ title }: Props) {
  // Logic
  return <div>{title}</div>;
}
```

### API Communication
- Use `use-api.ts` hook for data fetching
- Validate responses with Zod schemas
- Handle errors consistently
- Use React Query patterns (if needed)

### State Management
- **Global**: Zustand stores in `lib/stores/`
- **Local**: React `useState`
- **Server**: Prisma queries in backend

### Database Access
- Backend only: Use Prisma client
- Frontend: Call backend API endpoints
- Never expose database directly to frontend

---

## Environment Configuration

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

## Build Outputs

| Directory | Purpose | Generated |
|-----------|---------|-----------|
| `backend/dist/` | Compiled backend | Yes |
| `frontend/.next/` | Next.js build | Yes |
| `node_modules/` | Dependencies | Yes |
| `public/` | Static assets | No |
| `prisma/migrations/` | DB migrations | No |

---

**Last Updated**: November 2025
