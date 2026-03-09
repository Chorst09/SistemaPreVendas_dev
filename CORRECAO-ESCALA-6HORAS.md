# Correção: Cálculo de Escala com 6 Horas e Remoção de Animações

**Data**: 9 de Março de 2026  
**Status**: ✅ Concluído e em Deploy no Vercel  
**Commits**: `7b44f69`, `8bb9c26`

## Problemas Resolvidos

### 1. Checkbox de 6 Horas Não Funcionava
**Problema**: O checkbox "Analista N1 fará turno de 6 horas?" não estava sendo selecionado.

**Causa**: A função `handleFieldChange` não suportava caminhos aninhados como `dimensioning.n1SixHourShift`.

**Solução**: 
- Atualizei `handleFieldChange` para suportar notação de ponto (dot notation)
- Agora suporta caminhos como `dimensioning.n1SixHourShift`
- Implementei navegação recursiva para objetos aninhados

**Arquivo**: `frontend/src/components/service-desk-pricing/tabs/DataTabModule.tsx`

```typescript
const handleFieldChange = useCallback((field: string, value: any) => {
  setLocalData(prev => {
    // Support nested field paths like 'dimensioning.n1SixHourShift'
    if (field.includes('.')) {
      const keys = field.split('.');
      const newData = { ...prev };
      let current = newData;
      
      // Navigate to the parent object
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!current[key]) {
          current[key] = {};
        }
        current[key] = { ...current[key] };
        current = current[key];
      }
      
      // Set the final value
      current[keys[keys.length - 1]] = value;
      
      return {
        ...newData,
        updatedAt: new Date()
      };
    }
    // ... resto do código
  });
}, []);
```

### 2. Cálculo de 6 Horas Incorreto
**Problema**: Quando selecionava 6 horas, o cálculo de agentes não estava sendo ajustado corretamente.

**Causa**: A função `handleGenerateSchedule` não considerava o flag `n1SixHourShift` ao calcular o número de agentes necessários.

**Solução**:
- Adicionei ajuste de `workingHoursPerDay` baseado no flag de 6 horas
- Implementei multiplicador de agentes: `agentMultiplier = 8/6 ≈ 1.33`
- Isso garante que com 6 horas, precisamos de ~33% mais agentes para cobrir o mesmo período
- Ajustei os horários dos turnos:
  - **8x5 com 6h**: 08:00-14:00 (em vez de 08:00-18:00)
  - **12x5 com 6h**: 07:00-13:00 (em vez de 07:00-19:00)
  - **24x7 com 6h**: 4 turnos de 6 horas (00-06, 06-12, 12-18, 18-00)

**Arquivo**: `frontend/src/components/service-desk-pricing/tabs/DataTabModule.tsx`

```typescript
// Adjust for 6-hour shifts if enabled
const workingHoursPerDay = localData.dimensioning?.n1SixHourShift ? 6 : 8;
const hourlyCalls = dailyCalls / workingHoursPerDay;

// ... cálculo de trafficIntensity ...

// Adjust for 6-hour shifts: need more agents to cover same hours
const agentMultiplier = localData.dimensioning?.n1SixHourShift ? (8 / 6) : 1;
const adjustedBaseAgents = Math.ceil(baseAgents * agentMultiplier);
```

### 3. Cards se Movimentavam ao Clicar
**Problema**: Os cards de métricas se movimentavam (scale) quando o usuário clicava no checkbox de 6 horas.

**Causa**: A classe `hover:scale-105` no componente `MetricCard` causava animação de escala.

**Solução**:
- Removi `hover:scale-105` da classe do Card
- Mudei `transition-all` para `transition-shadow` para transições mais suaves
- Mantive o efeito hover de sombra sem movimento

**Arquivo**: `frontend/src/components/service-desk-pricing/shared/MetricCard.tsx`

```typescript
// Antes:
className={cn(
  'transition-all hover:shadow-md',
  styles.card,
  onClick && 'cursor-pointer hover:scale-105',
  className
)}

// Depois:
className={cn(
  'transition-shadow',
  styles.card,
  onClick && 'cursor-pointer',
  className
)}
```

## Testes Realizados

✅ **Build**: Compilação bem-sucedida sem erros  
✅ **Typecheck**: Sem erros de tipo  
✅ **Checkbox**: Agora funciona corretamente  
✅ **Cálculo**: Agentes ajustados para 6 horas  
✅ **Animações**: Removidas as animações de escala  

## Deploy

- **Plataforma**: Vercel (sistemapre-dev.vercel.app)
- **Trigger**: Automático ao fazer push no GitHub
- **Status**: Em progresso (Vercel está fazendo build)

## Como Testar

1. Acesse https://sistemapre-dev.vercel.app
2. Vá para a aba "Dados do Projeto"
3. Preencha os campos:
   - Usuários: 100
   - Incidentes/Mês: 1.5
   - SLA: 80%
   - Cobertura: 8x5
4. Marque o checkbox "Analista N1 fará turno de 6 horas?"
5. Clique em "Gerar Escala Automaticamente"
6. Verifique que:
   - O checkbox fica marcado
   - Os cards não se movem
   - A escala é gerada com turnos de 6 horas (08:00-14:00)
   - O número de agentes é maior que sem 6 horas

## Próximos Passos

- Monitorar o deploy no Vercel
- Fazer hard refresh (Cmd+Shift+R) para limpar cache
- Testar em diferentes navegadores
- Validar cálculos com dados reais

---

**Commits relacionados**:
- `7b44f69`: Melhoria no cálculo de 6 horas e remoção de animações
- `8bb9c26`: Suporte para caminhos aninhados no handleFieldChange
