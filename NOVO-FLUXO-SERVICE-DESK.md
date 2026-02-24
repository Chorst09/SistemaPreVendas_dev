# Novo Fluxo Service Desk - Corrigido

## 🎯 Fluxo Correto

### 1️⃣ ABA DADOS
**Objetivo**: Coletar informações básicas e dimensionar

**Campos**:
- Nome do projeto
- Cliente
- Período do contrato
- Quantidade de usuários
- Incidentes por usuário/mês
- SLA alvo
- **Tipo de Cobertura** (8x5, 12x5, 24x7)

**Ação**: 
- Botão "Gerar Escala Automaticamente"
- Calcula dimensionamento (N1, N2, N3)
- Gera escala com turnos
- **Inclui folguistas automaticamente**
- Navega para aba ESCALA

### 2️⃣ ABA ESCALA
**Objetivo**: Conferir e ajustar escala gerada

**Mostra**:
- Turnos gerados automaticamente
- Distribuição por dia/horário
- **Folguistas incluídos**
- Cobertura total
- Gaps (se houver)

**Ações**:
- Conferir escala
- Ajustar se necessário
- Adicionar/remover turnos
- Confirmar e ir para EQUIPE

### 3️⃣ ABA EQUIPE
**Objetivo**: Adicionar membros da equipe

**Mostra**:
- Quantidade necessária de N1 (da escala)
- Quantidade necessária de N2 (da escala)
- Quantidade necessária de N3 (da escala)
- **Folguistas necessários**

**Ações**:
- Adicionar membros por cargo
- Templates rápidos baseados no dimensionamento
- Alocar pessoas aos cargos

## 📋 Cálculo de Folguistas

### Fórmula
```
Folguistas = ceil(Total_Agentes × Fator_Folga)

Fator_Folga por cobertura:
- 8x5: 20% (1 dia de folga por semana)
- 12x5: 25% (cobertura estendida)
- 24x7: 40% (cobertura integral com turnos)
```

### Exemplo
```
Dimensionamento: 10 agentes
Cobertura: 24x7
Folguistas: ceil(10 × 0.40) = 4 agentes

Total necessário: 14 agentes (10 + 4 folguistas)
```

## 🔄 Fluxo Detalhado

### Passo 1: DADOS
```
Usuário preenche:
├── Projeto: "Service Desk Empresa XYZ"
├── Cliente: "Empresa XYZ"
├── Usuários: 500
├── Incidentes/usuário: 1.5
├── SLA: 80%
└── Cobertura: 24x7

Sistema calcula:
├── Volume mensal: 750 chamados
├── Volume diário: 34 chamados
├── N1 necessário: 6 agentes
├── N2 necessário: 3 agentes
├── N3 necessário: 1 agente
├── Folguistas: 4 agentes (40% de 10)
└── Total: 14 agentes

Botão: "Gerar Escala Automaticamente"
```

### Passo 2: ESCALA (Gerada Automaticamente)
```
Sistema gera:

Turno 1 (00:00-08:00):
├── N1: 2 agentes
├── N2: 1 agente
└── Folguista: 1 agente

Turno 2 (08:00-16:00):
├── N1: 2 agentes
├── N2: 1 agente
└── Folguista: 1 agente

Turno 3 (16:00-00:00):
├── N1: 2 agentes
├── N2: 1 agente
└── Folguista: 1 agente

N3 (On-call):
└── 1 agente (disponível 24x7)

Folguistas rotativos:
└── 4 agentes (cobrem folgas)

Usuário confere e ajusta se necessário
Botão: "Confirmar Escala e Adicionar Equipe"
```

### Passo 3: EQUIPE
```
Sistema mostra necessidade:
├── N1: 6 vagas (baseado na escala)
├── N2: 3 vagas (baseado na escala)
├── N3: 1 vaga (baseado na escala)
└── Folguistas: 4 vagas (baseado na escala)

Templates rápidos:
├── "Preencher N1 (6 pessoas)"
├── "Preencher N2 (3 pessoas)"
├── "Preencher N3 (1 pessoa)"
└── "Preencher Folguistas (4 pessoas)"

Ou adicionar manualmente:
└── Cargo customizado
```

## 🛠️ Implementação

### 1. Aba DADOS - handleGenerateSchedule()
```typescript
const handleGenerateSchedule = () => {
  // 1. Calcular dimensionamento
  const dimensioning = calculateDimensioning({
    users: localData.userQuantity,
    incidentsPerUser: localData.incidentsPerUser,
    coverage: localData.coverageType,
    sla: localData.slaTarget
  });
  
  // 2. Calcular folguistas
  const folguistas = calculateFolguistas(
    dimensioning.total,
    localData.coverageType
  );
  
  // 3. Gerar turnos
  const shifts = generateShifts(
    localData.coverageType,
    dimensioning,
    folguistas
  );
  
  // 4. Salvar dados
  onUpdate({
    ...localData,
    dimensioning: {
      n1: dimensioning.n1,
      n2: dimensioning.n2,
      n3: dimensioning.n3,
      folguistas: folguistas,
      total: dimensioning.total + folguistas
    },
    generatedShifts: shifts
  });
  
  // 5. Navegar para ESCALA
  navigateToTab('scale');
};
```

### 2. Aba ESCALA - Receber e Mostrar
```typescript
useEffect(() => {
  // Escutar evento de geração
  const handleGenerate = (event) => {
    const { dimensioning, shifts } = event.detail;
    
    // Aplicar escala gerada
    setSchedules(shifts);
    
    // Mostrar mensagem
    toast.success('Escala gerada automaticamente! Confira e ajuste se necessário.');
  };
  
  window.addEventListener('scheduleGenerated', handleGenerate);
  return () => window.removeEventListener('scheduleGenerated', handleGenerate);
}, []);
```

### 3. Aba EQUIPE - Mostrar Necessidade
```typescript
// Receber dimensionamento da escala
const { n1, n2, n3, folguistas } = getDimensioningFromSchedule();

// Mostrar cards de necessidade
<div className="grid grid-cols-4 gap-4">
  <NeedCard
    title="N1 Necessário"
    quantity={n1}
    filled={team.filter(m => m.level === 'N1').length}
    onQuickFill={() => fillPosition('N1', n1)}
  />
  <NeedCard
    title="N2 Necessário"
    quantity={n2}
    filled={team.filter(m => m.level === 'N2').length}
    onQuickFill={() => fillPosition('N2', n2)}
  />
  <NeedCard
    title="N3 Necessário"
    quantity={n3}
    filled={team.filter(m => m.level === 'N3').length}
    onQuickFill={() => fillPosition('N3', n3)}
  />
  <NeedCard
    title="Folguistas"
    quantity={folguistas}
    filled={team.filter(m => m.isFolguista).length}
    onQuickFill={() => fillFolguistas(folguistas)}
  />
</div>
```

## 📊 Cálculo de Folguistas por Cobertura

### 8x5 (Comercial)
- **Fator**: 20%
- **Motivo**: 1 dia de folga por semana (sábado/domingo)
- **Exemplo**: 10 agentes → 2 folguistas

### 12x5 (Estendido)
- **Fator**: 25%
- **Motivo**: Jornada estendida + 1 dia de folga
- **Exemplo**: 10 agentes → 3 folguistas

### 24x7 (Integral)
- **Fator**: 40%
- **Motivo**: Turnos rotativos + folgas + férias
- **Exemplo**: 10 agentes → 4 folguistas

## ✅ Checklist de Implementação

### Aba DADOS
- [x] Campo tipo de cobertura
- [x] Botão gerar escala
- [ ] Cálculo de dimensionamento
- [ ] Cálculo de folguistas
- [ ] Geração de turnos
- [ ] Navegação para ESCALA

### Aba ESCALA
- [ ] Receber escala gerada
- [ ] Mostrar turnos
- [ ] Mostrar folguistas
- [ ] Indicador de cobertura
- [ ] Botão confirmar
- [ ] Navegação para EQUIPE

### Aba EQUIPE
- [ ] Receber dimensionamento
- [ ] Mostrar necessidade (N1, N2, N3, Folguistas)
- [ ] Templates baseados em necessidade
- [ ] Validação de preenchimento
- [ ] Indicador de progresso

## 🎯 Resultado Esperado

### Antes (Confuso)
1. Dados → ?
2. Equipe → Não sabe quantos adicionar
3. Escala → Não sabe como gerar
4. ❌ Usuário perdido

### Depois (Claro)
1. Dados → Gera escala automaticamente
2. Escala → Confere e ajusta
3. Equipe → Sabe exatamente quantos adicionar
4. ✅ Fluxo lógico e guiado

---

**Próximo Passo**: Implementar geração automática de escala com folguistas
