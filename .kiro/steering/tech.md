# Technology Stack & Build System

## Tech Stack Overview

### Frontend
- **Framework**: Next.js 15.3.3 (React 18, App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3.4.1 + PostCSS
- **UI Components**: Radix UI (accessible component library)
- **Forms**: React Hook Form 7.54.2 + Zod validation
- **State Management**: Zustand 5.0.7
- **Charts**: Recharts 2.15.1
- **PDF Generation**: jsPDF 3.0.1, html2canvas 1.4.1
- **Document Processing**: Mammoth 1.10.0 (Word docs), pdfjs-dist 5.4.54
- **Spreadsheets**: XLSX 0.18.5
- **Animations**: Framer Motion 12.23.24
- **Icons**: Lucide React 0.475.0
- **Date Handling**: date-fns 3.6.0
- **Theme**: next-themes 0.3.0
- **Testing**: Vitest 3.2.4, Playwright 1.55.0, React Testing Library
- **Build Tool**: Turbopack (via Next.js)

### Backend
- **Runtime**: Node.js (ES modules)
- **Framework**: Express.js 4.18.2
- **Language**: TypeScript 5
- **Database ORM**: Prisma 6.17.1
- **Database**: PostgreSQL
- **Validation**: Zod 3.24.2
- **CORS**: cors 2.8.5
- **Environment**: dotenv 16.5.0
- **AI Integration**: Genkit 1.14.1, @genkit-ai/googleai 1.14.1
- **Testing**: Vitest 3.2.4
- **Dev Runtime**: tsx 4.20.6 (TypeScript execution)

### Shared Code
- **Validation**: Zod schemas
- **Types**: TypeScript interfaces
- **Utilities**: Shared functions (Erlang C calculations, formatting, etc.)

### DevOps & Infrastructure
- **Containerization**: Docker, Docker Compose
- **Orchestration**: Kubernetes (k8s manifests included)
- **CI/CD**: GitHub Actions ready
- **Deployment**: Vercel (frontend), custom servers (backend)
- **Database Migrations**: Prisma migrations

### Development Tools
- **Package Manager**: npm
- **Version Control**: Git
- **Code Quality**: ESLint, TypeScript strict mode
- **Testing Framework**: Vitest (unit/integration), Playwright (E2E/visual)
- **Build**: TypeScript compiler, Next.js build system

---

## Common Commands

### Frontend Development
```bash
# Development with Turbopack
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Type checking
npm run typecheck

# Linting
npm run lint

# Unit/integration tests
npm run test
npm run test:run

# Visual regression tests
npm run test:visual
npm run test:visual:ui
npm run test:visual:update
npm run test:visual:regression

# Performance benchmarks
npm run test:performance
npm run benchmark:performance
```

### Backend Development
```bash
# Development with hot reload
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Type checking
npm run typecheck

# Linting
npm run lint

# Tests
npm run test
npm run test:run

# Database migrations
npm run migrate
npm run migrate:prod

# Seed database
npm run db:seed
```

### Database (Prisma)
```bash
# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name migration_name

# Deploy migrations (production)
npx prisma migrate deploy

# Open Prisma Studio (GUI)
npx prisma studio

# Seed database
npx prisma db seed
```

### Docker
```bash
# Build all services
docker-compose up --build

# Run in background
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f [service-name]

# Build individual images
docker build -t sistema-prevendas-backend ./backend
docker build -t sistema-prevendas-frontend ./frontend
```

### Kubernetes
```bash
# Apply all manifests
kubectl apply -f k8s/

# Check status
kubectl get pods -n sistema-prevendas

# View logs
kubectl logs -f deployment/app -n sistema-prevendas

# Port forward
kubectl port-forward svc/app 3000:3000 -n sistema-prevendas
```

---

## Build & Deployment

### Frontend Build
- **Output**: `.next/` directory
- **Optimization**: Automatic code splitting, image optimization
- **Deployment**: Vercel, Docker, or any static host
- **Environment**: `NEXT_PUBLIC_API_URL` for API endpoint

### Backend Build
- **Output**: `dist/` directory (compiled JavaScript)
- **Optimization**: TypeScript compilation with strict mode
- **Deployment**: Docker, Kubernetes, or Node.js servers
- **Environment**: `DATABASE_URL`, `CORS_ORIGIN`, `PORT`

### Database
- **Provider**: PostgreSQL
- **Migrations**: Prisma migrations (version-controlled)
- **Seeding**: Optional seed scripts for development

---

## Key Configuration Files

| File | Purpose |
|------|---------|
| `tsconfig.json` | TypeScript configuration (root) |
| `frontend/tsconfig.json` | Frontend-specific TypeScript config |
| `backend/tsconfig.json` | Backend-specific TypeScript config |
| `tailwind.config.ts` | Tailwind CSS customization |
| `postcss.config.mjs` | PostCSS plugins |
| `next.config.ts` | Next.js configuration |
| `prisma/schema.prisma` | Database schema definition |
| `docker-compose.yml` | Local development orchestration |
| `k8s/*.yaml` | Kubernetes manifests |
| `.env.example` | Environment variable template |

---

## Performance Considerations

- **Frontend**: Turbopack for fast builds, automatic code splitting, image optimization
- **Backend**: Connection pooling via Prisma, request validation with Zod
- **Database**: Indexed queries, migrations for schema changes
- **Caching**: HTTP headers configured for API responses

---

## Testing Strategy

- **Unit/Integration**: Vitest (fast, ESM-native)
- **Visual Regression**: Playwright with snapshot testing
- **Performance**: Custom benchmarks in `tests/performance/`
- **E2E**: Playwright for critical user flows

---

**Last Updated**: November 2025
