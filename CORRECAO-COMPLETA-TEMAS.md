# Correção Completa de Temas - Light e Dark Mode

## 🎯 Objetivo
Corrigir TODOS os componentes do sistema para ter:
- **Modo Claro**: Backgrounds brancos puros, sem opacidade
- **Modo Escuro**: Backgrounds escuros sólidos, com bom contraste

## 📋 Padrões a Aplicar

### Backgrounds de Cards
```tsx
// ANTES (errado - com opacidade)
bg-blue-50/30

// DEPOIS (correto - sólido)
bg-white dark:bg-gray-900
```

### Alerts
```tsx
// ANTES
bg-blue-50 border-blue-200

// DEPOIS
bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800
```

### Textos em Alerts
```tsx
// ANTES
text-blue-900

// DEPOIS
text-blue-900 dark:text-blue-100
```

### Ícones em Alerts
```tsx
// ANTES
text-blue-600

// DEPOIS
text-blue-600 dark:text-blue-400
```

## 🔧 Arquivos a Corrigir

### ✅ Já Corrigidos
1. FormSection.tsx
2. MetricCard.tsx
3. CategoryCard.tsx
4. EnhancedInput.tsx
5. DataTabModule.tsx (Alert)
6. TeamTabModuleNew.tsx (Alert)

### 🔄 Pendentes de Correção

#### Navegação
- [ ] ValidationTransition.tsx (3 Alerts)
- [ ] NavigationConfirmation.tsx (3 Alerts)

#### Tabs
- [ ] ReportsTabModule.tsx (1 Alert)
- [ ] ScaleTabModule.tsx (verificar Alerts)
- [ ] BudgetTabModule.tsx (verificar)
- [ ] ForecastTabModule.tsx (verificar)
- [ ] ResultTabModule.tsx (verificar)
- [ ] NegotiationTabModule.tsx (verificar)
- [ ] FinalAnalysisTabModule.tsx (verificar)

#### Help/Guides
- [ ] TabGuides.tsx (1 Alert)

#### Landing
- [ ] ServiceDeskLandingPage.tsx (Cards com opacidade)

#### Projects
- [ ] ProjectList.tsx (skeleton loaders)

## 🎨 Paleta de Cores Padrão

### Modo Claro
```tsx
// Backgrounds
bg-white          // Cards principais
bg-gray-50        // Backgrounds secundários
bg-blue-50        // Alerts info
bg-green-50       // Alerts success
bg-yellow-50      // Alerts warning
bg-red-50         // Alerts error

// Textos
text-gray-900     // Texto principal
text-gray-600     // Texto secundário
text-blue-900     // Texto em alert azul
text-green-900    // Texto em alert verde
text-yellow-900   // Texto em alert amarelo
text-red-900      // Texto em alert vermelho

// Ícones
text-blue-600     // Ícone azul
text-green-600    // Ícone verde
text-yellow-600   // Ícone amarelo
text-red-600      // Ícone vermelho

// Bordas
border-gray-200   // Borda padrão
border-blue-200   // Borda azul
border-green-200  // Borda verde
border-yellow-200 // Borda amarela
border-red-200    // Borda vermelha
```

### Modo Escuro
```tsx
// Backgrounds
bg-gray-900       // Cards principais
bg-gray-800       // Backgrounds secundários
bg-blue-950       // Alerts info
bg-green-950      // Alerts success
bg-yellow-950     // Alerts warning
bg-red-950        // Alerts error

// Textos
text-gray-100     // Texto principal
text-gray-300     // Texto secundário
text-blue-100     // Texto em alert azul
text-green-100    // Texto em alert verde
text-yellow-100   // Texto em alert amarelo
text-red-100      // Texto em alert vermelho

// Ícones
text-blue-400     // Ícone azul
text-green-400    // Ícone verde
text-yellow-400   // Ícone amarelo
text-red-400      // Ícone vermelho

// Bordas
border-gray-700   // Borda padrão
border-blue-800   // Borda azul
border-green-800  // Borda verde
border-yellow-800 // Borda amarela
border-red-800    // Borda vermelha
```

## 🔍 Buscar e Substituir

### Padrão 1: Alerts Azuis (Info)
```tsx
// Buscar
className="bg-blue-50 border-blue-200"

// Substituir por
className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
```

### Padrão 2: Textos em Alerts Azuis
```tsx
// Buscar
className="text-blue-900"

// Substituir por
className="text-blue-900 dark:text-blue-100"
```

### Padrão 3: Ícones em Alerts Azuis
```tsx
// Buscar
className="h-4 w-4 text-blue-600"

// Substituir por
className="h-4 w-4 text-blue-600 dark:text-blue-400"
```

### Padrão 4: Alerts Verdes (Success)
```tsx
// Buscar
className="bg-green-50 border-green-200"

// Substituir por
className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
```

### Padrão 5: Alerts Amarelos (Warning)
```tsx
// Buscar
className="bg-yellow-50 border-yellow-200"

// Substituir por
className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800"
```

### Padrão 6: Alerts Vermelhos (Error)
```tsx
// Buscar
className="bg-red-50 border-red-200"

// Substituir por
className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
```

### Padrão 7: Cards com Opacidade
```tsx
// Buscar
bg-slate-800/50

// Substituir por
bg-white dark:bg-gray-900
```

## 📝 Checklist de Validação

### Modo Claro
- [ ] Todos os cards têm fundo branco puro
- [ ] Textos são escuros e legíveis
- [ ] Bordas são visíveis mas sutis
- [ ] Ícones têm cores vibrantes
- [ ] Alerts têm backgrounds coloridos claros
- [ ] Sem opacidade em nenhum lugar

### Modo Escuro
- [ ] Todos os cards têm fundo escuro sólido
- [ ] Textos são claros e legíveis
- [ ] Bordas são visíveis com bom contraste
- [ ] Ícones têm cores mais claras
- [ ] Alerts têm backgrounds coloridos escuros
- [ ] Sem opacidade em nenhum lugar

## 🚀 Próximos Passos

1. Corrigir todos os Alerts nos arquivos de navegação
2. Corrigir todos os Alerts nos tabs
3. Corrigir ServiceDeskLandingPage
4. Testar em modo claro
5. Testar em modo escuro
6. Validar contraste WCAG
7. Commit final

---

**Status**: Em Progresso
**Última Atualização**: 24 de Fevereiro de 2026
