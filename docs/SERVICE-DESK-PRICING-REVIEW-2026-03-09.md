# Revisao Geral - Precificacao Service Desk Avancado (2026-03-09)

## Escopo revisado
- Engine de calculo: `src/lib/services/service-desk-calculation-engine.ts`
- Cache de calculos: `src/lib/utils/calculation-cache.ts`
- Integracao de abas e fluxo de dados:
  - `src/components/service-desk-pricing/ServiceDeskPricingSystem.tsx`
  - `src/components/service-desk-pricing/tabs/BudgetTabModule.tsx`
  - `src/components/service-desk-pricing/tabs/ForecastTabModule.tsx`
  - `src/components/service-desk-pricing/tabs/ResultTabModule.tsx`
- Testes do engine: `src/lib/services/__tests__/service-desk-calculation-engine.test.ts`

## Problemas encontrados e corrigidos

### 1) Subdimensionamento de custo de equipe por ignorar `quantity`
- **Impacto:** total de equipe ficava abaixo do real quando os cargos eram cadastrados por quantidade.
- **Correcao:** engine agora aplica `quantity` em custo mensal/horas e custo/hora.

### 2) `salary/benefits/workload` ausentes gerando distorcoes
- **Impacto:** entradas no formato `TeamMemberNew` podiam gerar custos incompletos/instaveis.
- **Correcao:** fallback robusto para salario, beneficios e carga horaria (6h/8h) quando dados nao vierem completos.

### 3) Multiplicador de turno especial sendo aplicado fora do contexto
- **Impacto:** custo podia inflar mesmo sem alocacao real do membro em turno especial.
- **Correcao:** multiplicadores agora so aplicam para turnos realmente atribuidos ao membro.

### 4) Orcamento consolidado com base inconsistente (mensal vs contrato)
- **Impacto:** margem, lucro mensal e preco final podiam ficar irreais.
- **Correcao:** consolidacao passou a trabalhar em base de contrato, com rateio mensal coerente.

### 5) Categoria de infraestrutura incompatível (`INFRASTRUCTURE` vs `infrastructure`)
- **Impacto:** custo de infraestrutura podia ser ignorado.
- **Correcao:** compatibilidade com valor do enum usado no sistema.

### 6) Frequencia de custos adicionais ignorada
- **Impacto:** custos trimestrais/semestrais/anuais/one-time eram tratados de forma inadequada.
- **Correcao:** normalizacao por frequencia para valor total do contrato.

### 7) Chaves de cache com alto risco de colisao
- **Impacto:** retorno de calculos incorretos por hit de cache indevido.
- **Correcao:** troca para hash FNV-1a com chave deterministica e menor risco de colisao.

### 8) Forecast usando base fixa (100k/80k) e KPI aleatorio
- **Impacto:** simulacao desalinhada com o orcamento real e resultados nao reprodutiveis.
- **Correcao:** forecast agora usa base do projeto/orcamento e KPIs deterministas.

### 9) Aba de Orcamento sem contexto completo de dados
- **Impacto:** recalculo podia nao executar (`teamData` vazio) ou usar base tributaria fraca.
- **Correcao:** props completas passadas pelo container para a aba de orcamento e forecast.

## Benchmark web (base para modernizacao)

Pesquisa feita em 2026-03-09, em paginas oficiais:

- **Jira Service Management (Atlassian):** modelo por agente com opcao de automacao/uso adicional (ex.: AI por resolucao).
  - https://www.atlassian.com/software/jira/service-desk/pricing
- **Freshservice (Freshworks):** precificacao por agente + day pass e cotas de IA por plano.
  - https://www.freshworks.com/freshservice/pricing/
- **Zendesk:** planos `Support` e `Suite + Copilot`, valores por agente/mensal, com faturamento anual ou mensal.
  - https://www.zendesk.com/pricing/
- **ManageEngine ServiceDesk Plus Cloud:** modelo por tecnico/administrador.
  - https://www.manageengine.com/products/service-desk/pricing.html
- **ServiceNow ITSM:** sem preco publico fixo; opera por custom quote.
  - https://www.servicenow.com/lpgp/pricing-itsm.html

## Direcao de produto recomendada (proximos passos)
1. Implementar **multimodelo de precificacao** nativo:
   - por agente
   - por usuario atendido
   - por ticket/resolucao
   - hibrido (retainer + volume)
2. Adicionar **custo de IA/automacao** separado (sessao, resolucao ou pacote mensal), com simulador de break-even.
3. Separar impostos entre:
   - sobre faturamento
   - sobre lucro
   - valores fixos
   com base de calculo explicita por tributo.
4. Incluir curva de produtividade/learning por trimestre (ex.: reducao gradual de TMA e custo por ticket).
5. Exibir **unit economics** executivos no resultado:
   - custo por ticket
   - receita por ticket
   - margem por ticket
   - custo por FTE equivalente

## Atualizacao de implementacao (neste ciclo)
- Multimodelo de precificacao implementado na aba de Orcamento:
  - `cost_plus_margin`
  - `per_agent`
  - `per_user`
  - `per_ticket`
  - `hybrid`
- Comparacao lado a lado de modelos e destaque do modelo ativo na visao geral.
- Persistencia no `ConsolidatedBudget` com parametros do modelo e comparativos.

## Validacao local
- `npm run typecheck` executado com sucesso.
- Testes do arquivo principal do engine (`src/.../service-desk-calculation-engine.test.ts`) passaram.
- Observacao: a suite global de testes tambem tenta executar `frontend/src/**` e falha por ausencia de `frontend/tsconfig.node.json` (estrutura legada/paralela).
