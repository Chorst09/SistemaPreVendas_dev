# Fluxo Visual: Geração Automática de Escala

## 📊 Diagrama do Fluxo

```
┌─────────────────────────────────────────────────────────────────┐
│                         ABA 1: DADOS                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  👤 Usuário preenche:                                           │
│  ├─ Usuários: 500                                              │
│  ├─ Incidentes/usuário: 1.5                                    │
│  ├─ SLA: 80%                                                   │
│  └─ Cobertura: 24x7 ⭐                                         │
│                                                                 │
│  🤖 Sistema calcula automaticamente:                            │
│  ├─ Volume: 750 chamados/mês                                   │
│  ├─ Erlang C: 1.06 Erlangs                                     │
│  ├─ N1: 2 agentes (60%)                                        │
│  ├─ N2: 1 agente (30%)                                         │
│  ├─ N3: 1 agente (10%)                                         │
│  ├─ Folguistas: 2 agentes (40% para 24x7)                     │
│  └─ TOTAL: 6 agentes                                           │
│                                                                 │
│  [🚀 Gerar Escala Automaticamente]  ← Clica aqui              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ scheduleGenerated event
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        ABA 2: ESCALA                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📅 Escala gerada automaticamente:                              │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Turno 1: Madrugada (00:00-08:00) 🌙                    │  │
│  │ ├─ N1: 1 agente                                         │  │
│  │ ├─ N2: 0 agentes                                        │  │
│  │ ├─ Folguista: 1 agente                                  │  │
│  │ └─ Multiplicador: 1.5x (noturno)                        │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Turno 2: Manhã (08:00-16:00) ☀️                        │  │
│  │ ├─ N1: 1 agente                                         │  │
│  │ ├─ N2: 1 agente                                         │  │
│  │ ├─ N3: 1 agente                                         │  │
│  │ ├─ Folguista: 1 agente                                  │  │
│  │ └─ Multiplicador: 1.0x (normal)                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Turno 3: Tarde (16:00-23:59) 🌆                        │  │
│  │ ├─ N1: 1 agente                                         │  │
│  │ ├─ N2: 0 agentes                                        │  │
│  │ ├─ Folguista: 0 agentes                                 │  │
│  │ └─ Multiplicador: 1.3x (vespertino)                     │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ✅ Usuário confere e pode ajustar                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ scheduleGenerated event
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        ABA 3: EQUIPE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ℹ️ Dimensionamento da Escala Gerada:                          │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  N1: 2 agentes  │  N2: 1 agente  │  N3: 1 agente       │  │
│  │  Folguistas: 2  │  TOTAL: 6 agentes                     │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  🎯 Ações Rápidas (baseadas no dimensionamento):                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ [Equipe N1 (2 pessoas)]                                 │  │
│  │ [Equipe N2 (1 pessoa)]                                  │  │
│  │ [Equipe Completa (6 pessoas)] ← Adiciona tudo          │  │
│  │ [Cargo Customizado]                                     │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  👥 Equipe adicionada:                                          │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Cargo              │ Qtd │ Jornada │ Salário │ Total    │  │
│  ├─────────────────────────────────────────────────────────┤  │
│  │ Analista N1        │  2  │   8h    │ R$ 1.780│ R$ 3.560 │  │
│  │ Analista N2        │  1  │   8h    │ R$ 2.880│ R$ 2.880 │  │
│  │ Analista N3        │  1  │   8h    │ R$ 7.380│ R$ 7.380 │  │
│  │ Folguistas (N1)    │  2  │   8h    │ R$ 1.780│ R$ 3.560 │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  💰 Custo Total Mensal: R$ 17.380,00                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Comunicação Entre Componentes

```
DataTabModule.tsx
      │
      │ 1. Usuário clica "Gerar Escala"
      │
      ├─► Calcula dimensionamento (Erlang C)
      │   ├─ Volume de chamados
      │   ├─ Intensidade de tráfego
      │   ├─ Agentes necessários (N1, N2, N3)
      │   └─ Folguistas (20%, 25% ou 40%)
      │
      ├─► Gera turnos baseado em cobertura
      │   ├─ 8x5: 1 turno comercial
      │   ├─ 12x5: 1 turno estendido
      │   └─ 24x7: 3 turnos (madrugada, manhã, tarde)
      │
      └─► Dispara evento
          │
          │ window.dispatchEvent('scheduleGenerated', {
          │   schedule: { ... },
          │   dimensioning: { n1, n2, n3, folguistas, total }
          │ })
          │
          ├──────────────────────────────────────┐
          │                                      │
          ▼                                      ▼
    ScaleTabModule.tsx              TeamTabModuleNew.tsx
          │                                      │
          │ 2. Recebe evento                     │ 3. Recebe evento
          │                                      │
          ├─► Adiciona escala                    ├─► Atualiza requiredQuantities
          │   à lista                            │   state
          │                                      │
          ├─► Mostra turnos                      ├─► Mostra card azul com
          │   gerados                            │   dimensionamento
          │                                      │
          └─► Permite edição                     └─► Atualiza templates
              e ajustes                              com quantidades
```

---

## 📈 Exemplo de Cálculo Detalhado

### Entrada
```
Usuários: 500
Incidentes/usuário: 1.5
SLA: 80%
Cobertura: 24x7
```

### Passo 1: Volume de Chamados
```
Volume mensal = 500 × 1.5 = 750 chamados/mês
Volume diário = 750 ÷ 22 = 34 chamados/dia
Volume horário = 34 ÷ 8 = 4.25 chamados/hora
```

### Passo 2: Intensidade de Tráfego (Erlang C)
```
TMA (Tempo Médio de Atendimento) = 15 minutos
Ocupação alvo = 85%

Intensidade = (4.25 × 15) ÷ 60 = 1.06 Erlangs
```

### Passo 3: Agentes Necessários
```
Agentes base = ceil(1.06 ÷ 0.85) = ceil(1.25) = 2 agentes

Distribuição:
├─ N1 (60%): ceil(2 × 0.6) = 2 agentes
├─ N2 (30%): ceil(2 × 0.3) = 1 agente
└─ N3 (10%): ceil(2 × 0.1) = 1 agente

Total operacional: 4 agentes
```

### Passo 4: Folguistas
```
Cobertura: 24x7
Fator de folga: 40%

Folguistas = ceil(4 × 0.40) = ceil(1.6) = 2 agentes

TOTAL NECESSÁRIO: 4 + 2 = 6 agentes
```

### Passo 5: Distribuição em Turnos (24x7)
```
3 turnos de 8 horas cada:

Turno 1 (Madrugada): 00:00-08:00
├─ N1: 1 agente (2 ÷ 3 ≈ 1)
├─ N2: 0 agentes (1 ÷ 3 ≈ 0)
├─ N3: 0 agentes (trabalha só de dia)
├─ Folguista: 1 agente (2 ÷ 3 ≈ 1)
└─ Multiplicador: 1.5x (adicional noturno)

Turno 2 (Manhã): 08:00-16:00
├─ N1: 1 agente
├─ N2: 1 agente (todo o N2 trabalha de dia)
├─ N3: 1 agente (todo o N3 trabalha de dia)
├─ Folguista: 1 agente
└─ Multiplicador: 1.0x (horário normal)

Turno 3 (Tarde): 16:00-23:59
├─ N1: 1 agente
├─ N2: 0 agentes
├─ N3: 0 agentes
├─ Folguista: 0 agentes
└─ Multiplicador: 1.3x (adicional vespertino)
```

---

## 🎯 Fatores de Folguista por Cobertura

### 8x5 - Comercial (20%)
```
Motivo: 1 dia de folga por semana
Exemplo: 10 agentes → 2 folguistas
Cobertura: Segunda a Sexta, 8h/dia
```

### 12x5 - Estendido (25%)
```
Motivo: Jornada estendida + 1 dia de folga
Exemplo: 10 agentes → 3 folguistas
Cobertura: Segunda a Sexta, 12h/dia
```

### 24x7 - Integral (40%)
```
Motivo: Turnos rotativos + folgas + férias + feriados
Exemplo: 10 agentes → 4 folguistas
Cobertura: 24 horas, 7 dias por semana
```

---

## ✅ Validações Automáticas

```
┌─────────────────────────────────────────┐
│ Antes de gerar escala, valida:         │
├─────────────────────────────────────────┤
│ ✓ Usuários > 0                          │
│ ✓ Incidentes/usuário > 0                │
│ ✓ SLA entre 0-100%                      │
│ ✓ Tipo de cobertura selecionado        │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Após gerar escala, mostra:              │
├─────────────────────────────────────────┤
│ ✓ Dimensionamento calculado             │
│ ✓ Turnos gerados                        │
│ ✓ Folguistas incluídos                  │
│ ✓ Multiplicadores aplicados             │
│ ✓ Cobertura total                       │
└─────────────────────────────────────────┘
```

---

## 🚀 Benefícios do Fluxo

### Para o Usuário
- ⚡ **Rápido**: Gera em segundos
- 🎯 **Preciso**: Baseado em Erlang C
- 🔢 **Completo**: Inclui folguistas automaticamente
- 📊 **Visual**: Vê tudo claramente
- ✏️ **Flexível**: Pode ajustar depois

### Para o Sistema
- 🔄 **Consistente**: Cálculos padronizados
- 📝 **Rastreável**: Tudo documentado
- 🔗 **Integrado**: Dados fluem entre abas
- 🛠️ **Manutenível**: Código organizado
- 📈 **Escalável**: Fácil adicionar features

---

**Criado**: 24 de Fevereiro de 2026
**Status**: ✅ Implementado e Funcionando

