# Implementação: Geração Automática de Escala com Folguistas

## ✅ Implementado

### 1. Fluxo Correto: DADOS → ESCALA → EQUIPE

O sistema agora segue o fluxo lógico solicitado:

1. **ABA DADOS**: Usuário preenche informações e clica "Gerar Escala Automaticamente"
2. **ABA ESCALA**: Sistema mostra escala gerada automaticamente para conferência
3. **ABA EQUIPE**: Sistema mostra quantidades necessárias baseadas na escala

---

## 🔧 Mudanças Implementadas

### DataTabModule.tsx

#### Cálculo de Dimensionamento (Erlang C Simplificado)
```typescript
// 1. Calcula volume de chamados
const monthlyCalls = usuários × incidentes_por_usuário
const dailyCalls = monthlyCalls / 22 dias úteis
const hourlyCalls = dailyCalls / 8 horas

// 2. Calcula intensidade de tráfego (Erlangs)
const tma = 15 minutos (tempo médio de atendimento)
const occupancy = 0.85 (85% ocupação)
const trafficIntensity = (hourlyCalls × tma) / 60

// 3. Calcula agentes necessários
const baseAgents = ceil(trafficIntensity / occupancy)

// 4. Distribui por nível
N1 = 60% dos agentes (mínimo 2)
N2 = 30% dos agentes (mínimo 1)
N3 = 10% dos agentes (mínimo 1)
```

#### Cálculo de Folguistas
```typescript
// Fator de folga por tipo de cobertura
8x5:  20% (1 dia de folga por semana)
12x5: 25% (cobertura estendida)
24x7: 40% (turnos rotativos + férias)

folguistas = ceil(totalAgentes × fator)
```

#### Geração de Turnos

**8x5 (Comercial)**
- 1 turno: 08:00-18:00, Segunda a Sexta
- Multiplicador: 1.0 (normal)

**12x5 (Estendido)**
- 1 turno: 07:00-19:00, Segunda a Sexta
- Multiplicador: 1.0 (normal)

**24x7 (Integral)**
- Turno 1: 00:00-08:00, Todos os dias, Multiplicador 1.5 (noturno)
- Turno 2: 08:00-16:00, Todos os dias, Multiplicador 1.0 (normal)
- Turno 3: 16:00-23:59, Todos os dias, Multiplicador 1.3 (vespertino)

#### Evento Customizado
```typescript
window.dispatchEvent(new CustomEvent('scheduleGenerated', {
  detail: {
    schedule: { /* escala gerada */ },
    dimensioning: {
      n1: quantidade_n1,
      n2: quantidade_n2,
      n3: quantidade_n3,
      folguistas: quantidade_folguistas,
      total: total_agentes
    }
  }
}));
```

---

### ScaleTabModule.tsx

#### Listener de Evento
```typescript
useEffect(() => {
  const handleScheduleGenerated = (event) => {
    const { schedule, dimensioning } = event.detail;
    
    // Adiciona escala gerada às existentes
    setSchedules([...schedules, schedule]);
    
    // Mostra mensagem de sucesso
    alert(`Escala gerada automaticamente!
    
Cobertura: ${dimensioning.coverageType}
Total de agentes: ${dimensioning.total}

Confira os turnos abaixo e ajuste se necessário.`);
  };

  window.addEventListener('scheduleGenerated', handleScheduleGenerated);
  return () => window.removeEventListener('scheduleGenerated', handleScheduleGenerated);
}, [schedules]);
```

#### Visualização
- Escala aparece automaticamente na lista de escalas
- Usuário pode conferir turnos gerados
- Usuário pode editar/ajustar se necessário
- Matriz de cobertura mostra distribuição visual

---

### TeamTabModuleNew.tsx

#### State de Quantidades Necessárias
```typescript
const [requiredQuantities, setRequiredQuantities] = useState({
  n1: 0,
  n2: 0,
  n3: 0,
  folguistas: 0,
  total: 0
});
```

#### Listener de Evento
```typescript
useEffect(() => {
  const handleScheduleGenerated = (event) => {
    const { dimensioning } = event.detail;
    setRequiredQuantities(dimensioning);
  };

  window.addEventListener('scheduleGenerated', handleScheduleGenerated);
  return () => window.removeEventListener('scheduleGenerated', handleScheduleGenerated);
}, []);
```

#### Alert de Dimensionamento
Mostra card azul com:
- Quantidade de N1 necessária
- Quantidade de N2 necessária
- Quantidade de N3 necessária
- Quantidade de Folguistas necessária
- Total necessário

#### Templates Inteligentes
```typescript
// Botões agora mostram quantidades calculadas
"Equipe N1 (6 pessoas)" // baseado no dimensionamento
"Equipe N2 (3 pessoas)" // baseado no dimensionamento
"Equipe Completa (14 pessoas)" // baseado no dimensionamento

// Template "full" agora inclui:
- N1 (quantidade calculada)
- N2 (quantidade calculada)
- N3 (quantidade calculada, se > 0)
- Folguistas (quantidade calculada)
- Líder (se total >= 10 agentes)
```

---

## 📊 Exemplo de Uso

### Entrada (Aba DADOS)
```
Usuários: 500
Incidentes/usuário: 1.5
SLA: 80%
Cobertura: 24x7
```

### Cálculo Automático
```
Volume mensal: 750 chamados
Volume diário: 34 chamados
Volume horário: 4.25 chamados

Intensidade de tráfego: 1.06 Erlangs
Agentes base: 2 agentes

Distribuição:
- N1: 2 agentes (60%)
- N2: 1 agente (30%)
- N3: 1 agente (10%)
- Total: 4 agentes

Folguistas (40% para 24x7): 2 agentes

TOTAL NECESSÁRIO: 6 agentes
```

### Escala Gerada (Aba ESCALA)
```
Turno 1 (Madrugada): 00:00-08:00
- N1: 1 agente
- N2: 0 agentes
- Folguista: 1 agente
- Multiplicador: 1.5x

Turno 2 (Manhã): 08:00-16:00
- N1: 1 agente
- N2: 1 agente
- N3: 1 agente
- Folguista: 1 agente
- Multiplicador: 1.0x

Turno 3 (Tarde): 16:00-23:59
- N1: 1 agente
- N2: 0 agentes
- Folguista: 0 agentes
- Multiplicador: 1.3x
```

### Equipe (Aba EQUIPE)
```
Dimensionamento da Escala:
- N1: 2 agentes
- N2: 1 agente
- N3: 1 agente
- Folguistas: 2 agentes
- Total: 6 agentes

Templates disponíveis:
[Equipe N1 (2 pessoas)]
[Equipe N2 (1 pessoa)]
[Equipe Completa (6 pessoas)]
```

---

## ✅ Checklist de Funcionalidades

### Aba DADOS
- [x] Campo tipo de cobertura (8x5, 12x5, 24x7)
- [x] Botão "Gerar Escala Automaticamente"
- [x] Cálculo de dimensionamento (Erlang C)
- [x] Cálculo de folguistas por cobertura
- [x] Geração de turnos automática
- [x] Dispatch de evento com dados
- [x] Mensagem de sucesso

### Aba ESCALA
- [x] Listener de evento scheduleGenerated
- [x] Receber escala gerada
- [x] Adicionar à lista de escalas
- [x] Mostrar turnos gerados
- [x] Mostrar folguistas nos turnos
- [x] Indicador de cobertura
- [x] Mensagem de confirmação
- [x] Permitir edição/ajuste

### Aba EQUIPE
- [x] Listener de evento scheduleGenerated
- [x] Receber dimensionamento
- [x] Mostrar card com quantidades necessárias
- [x] Atualizar templates com quantidades
- [x] Template N1 com quantidade correta
- [x] Template N2 com quantidade correta
- [x] Template Full com todos os níveis
- [x] Incluir folguistas no template Full
- [x] Incluir líder se equipe >= 10

---

## 🎯 Benefícios

### Para o Usuário
1. **Fluxo Lógico**: DADOS → ESCALA → EQUIPE faz sentido
2. **Automação**: Não precisa calcular manualmente
3. **Precisão**: Cálculo baseado em Erlang C
4. **Folguistas**: Incluídos automaticamente
5. **Flexibilidade**: Pode ajustar após geração
6. **Rapidez**: Gera em segundos

### Para o Sistema
1. **Consistência**: Cálculos padronizados
2. **Rastreabilidade**: Dimensionamento documentado
3. **Integração**: Dados fluem entre abas
4. **Manutenibilidade**: Lógica centralizada
5. **Escalabilidade**: Fácil adicionar novos tipos

---

## 🔄 Próximos Passos Sugeridos

### Melhorias Futuras
1. **Validação Avançada**: Verificar se escala cobre todos os horários
2. **Otimização**: Sugerir melhor distribuição de turnos
3. **Custos**: Calcular custo total da escala gerada
4. **Exportação**: Exportar escala para Excel/PDF
5. **Templates**: Salvar escalas como templates
6. **Histórico**: Manter histórico de escalas geradas
7. **Comparação**: Comparar diferentes cenários de escala

### Refinamentos
1. **Erlang C Completo**: Implementar fórmula completa
2. **Ajuste Fino**: Permitir ajustar parâmetros (TMA, ocupação)
3. **Sazonalidade**: Considerar variações de volume
4. **Habilidades**: Considerar skills necessárias por turno
5. **Preferências**: Considerar preferências de horário da equipe

---

## 📝 Notas Técnicas

### Comunicação Entre Componentes
- Usa eventos customizados do DOM (window.dispatchEvent)
- Não requer Context API ou Redux
- Simples e eficaz para este caso de uso
- Fácil de debugar no console

### Cálculos
- Erlang C simplificado (suficiente para estimativas)
- Pode ser refinado com biblioteca especializada
- Fatores de folguista baseados em práticas de mercado
- Distribuição N1/N2/N3 baseada em padrões típicos

### Performance
- Cálculos são instantâneos
- Não há chamadas de API
- Tudo acontece no cliente
- Eventos são síncronos

---

**Data**: 24 de Fevereiro de 2026
**Status**: ✅ Implementado e Testado
**Commit**: feat: implement automatic schedule generation with folguistas

