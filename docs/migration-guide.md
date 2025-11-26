# Guia de Migração - Código Legado para Nova Arquitetura

## 📋 Visão Geral

Este guia ajuda a migrar componentes e funcionalidades do código legado para a nova arquitetura separada (backend/frontend).

## 🔄 Processo de Migração

### 1. Identificar Componentes

**Legado:**
```
src/components/service-desk/
src/components/proposals/
src/components/edital-analysis/
```

**Novo:**
```
frontend/src/components/service-desk/
frontend/src/components/proposals/
frontend/src/components/edital-analysis/
```

### 2. Mover Componentes React

```bash
# Copiar componentes para frontend
cp -r src/components/* frontend/src/components/

# Copiar hooks
cp -r src/hooks/* frontend/src/hooks/

# Copiar estilos
cp -r src/styles/* frontend/src/styles/
```

### 3. Mover Lógica de Negócio para Backend

**Antes (Frontend):**
```typescript
// src/lib/calculations.ts
export function calculateErlangC(calls, aht, agents) {
  // lógica
}
```

**Depois (Backend):**
```typescript
// backend/src/services/service-desk.ts
export function calculateErlangC(calls, aht, agents) {
  // lógica
}

// backend/src/routes/service-desk.ts
router.post('/calculate', (req, res) => {
  const result = calculateErlangC(...);
  res.json(result);
});
```

### 4. Atualizar Chamadas de API

**Antes:**
```typescript
// Lógica local no frontend
const result = calculateErlangC(100, 300, 10);
```

**Depois:**
```typescript
// Chamada para backend
const response = await ApiClient.post('/service-desk/calculate', {
  callsPerHour: 100,
  averageHandleTime: 300,
  agents: 10,
});
```

### 5. Migrar Modelos de Dados

**Antes (Prisma no frontend):**
```typescript
// src/lib/db.ts
```

**Depois (Prisma no backend):**
```typescript
// backend/src/db/schema.prisma
model ServiceDeskDimension {
  id String @id @default(cuid())
  agents Int
  // ...
}
```

### 6. Atualizar Variáveis de Ambiente

**Antes:**
```env
DATABASE_URL=...
NEXTAUTH_SECRET=...
```

**Depois:**

Backend (.env):
```env
DATABASE_URL=...
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

Frontend (.env.local):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## 📦 Checklist de Migração

### Componentes
- [ ] Copiar componentes React para `frontend/src/components/`
- [ ] Atualizar imports de paths
- [ ] Remover dependências de backend do frontend
- [ ] Testar componentes isoladamente

### Lógica de Negócio
- [ ] Identificar funções de cálculo/processamento
- [ ] Mover para `backend/src/services/`
- [ ] Criar endpoints correspondentes
- [ ] Adicionar validação com Zod

### Banco de Dados
- [ ] Definir schema no `backend/src/db/schema.prisma`
- [ ] Criar migrações
- [ ] Testar queries

### API
- [ ] Criar rotas no backend
- [ ] Implementar error handling
- [ ] Documentar endpoints
- [ ] Testar com Postman/Insomnia

### Frontend
- [ ] Criar hooks com `useApi`
- [ ] Atualizar componentes para usar API
- [ ] Adicionar loading/error states
- [ ] Testar integração

### Testes
- [ ] Testes unitários do backend
- [ ] Testes de integração
- [ ] Testes visuais do frontend
- [ ] Testes E2E

## 🔧 Exemplos de Migração

### Exemplo 1: Service Desk Calculator

**Antes (Tudo no Frontend):**
```typescript
// src/components/service-desk/Calculator.tsx
export function Calculator() {
  const [agents, setAgents] = useState(10);
  
  const handleCalculate = () => {
    const erlangC = calculateErlangC(100, 300, agents);
    setResult(erlangC);
  };
  
  return (
    <div>
      <input value={agents} onChange={e => setAgents(+e.target.value)} />
      <button onClick={handleCalculate}>Calcular</button>
    </div>
  );
}
```

**Depois (Separado):**

Backend:
```typescript
// backend/src/routes/service-desk.ts
router.post('/calculate', (req, res) => {
  const { agents, callsPerHour, aht } = req.body;
  const erlangC = calculateErlangC(callsPerHour, aht, agents);
  res.json({ erlangC });
});
```

Frontend:
```typescript
// frontend/src/components/service-desk/Calculator.tsx
export function Calculator() {
  const { data, loading, post } = useApi();
  const [agents, setAgents] = useState(10);
  
  const handleCalculate = async () => {
    await post('/service-desk/calculate', {
      agents,
      callsPerHour: 100,
      aht: 300,
    });
  };
  
  return (
    <div>
      <input value={agents} onChange={e => setAgents(+e.target.value)} />
      <button onClick={handleCalculate} disabled={loading}>
        {loading ? 'Calculando...' : 'Calcular'}
      </button>
      {data && <p>Erlang C: {data.erlangC}</p>}
    </div>
  );
}
```

### Exemplo 2: Proposals Management

**Antes:**
```typescript
// src/components/proposals/ProposalForm.tsx
export function ProposalForm() {
  const [proposals, setProposals] = useState([]);
  
  const handleSubmit = async (data) => {
    // Salvar direto no banco
    const result = await db.proposals.create(data);
    setProposals([...proposals, result]);
  };
}
```

**Depois:**

Backend:
```typescript
// backend/src/routes/proposals.ts
router.post('/', async (req, res) => {
  const data = ProposalSchema.parse(req.body);
  const proposal = await prisma.proposal.create({ data });
  res.json({ success: true, data: proposal });
});
```

Frontend:
```typescript
// frontend/src/components/proposals/ProposalForm.tsx
export function ProposalForm() {
  const { data: proposals, post } = useApi();
  
  const handleSubmit = async (data) => {
    await post('/proposals', data);
  };
}
```

## 🧪 Testes Pós-Migração

### Backend
```bash
cd backend
npm run test
npm run typecheck
```

### Frontend
```bash
cd frontend
npm run test
npm run typecheck
npm run lint
```

### Integração
```bash
# Iniciar ambos
docker-compose up

# Testar endpoints
curl http://localhost:3001/api/health
curl http://localhost:3000
```

## 🚨 Problemas Comuns

### Problema: CORS Error
**Solução:**
```typescript
// backend/src/index.ts
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
}));
```

### Problema: Tipos não encontrados
**Solução:**
```typescript
// Importar de shared
import { ServiceDeskDimension } from '../../../shared/types';
```

### Problema: Variáveis de ambiente não carregam
**Solução:**
```bash
# Verificar arquivo .env
cat backend/.env

# Reiniciar containers
docker-compose down
docker-compose up --build
```

## 📚 Recursos

- [Arquitetura](./ARCHITECTURE.md)
- [API Reference](./API.md)
- [Deployment Guide](./DEPLOYMENT-GUIDE.md)

---

**Última atualização**: Novembro 2025
