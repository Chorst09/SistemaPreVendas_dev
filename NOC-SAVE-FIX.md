# Correção: NOC Salvando em Orçamentos

## Problema Identificado
O sistema de precificação NOC não estava salvando corretamente e não redirecionava para a aba de Orçamentos após salvar.

## Solução Implementada

### 1. Integração com QuoteContext
- Adicionado hook `useQuotes()` no componente `NOCPricingSystem`
- Criação automática de orçamento (Quote) a partir da proposta NOC

### 2. Dados do Orçamento Incluem
- **Valor Mensal**: `calculations.finalMonthlyPrice`
- **Prazo do Contrato**: `projectData.contractDuration` (em meses)
- **Valor Total do Contrato**: `valorMensal × prazoDosContrato`

### 3. Navegação Automática
- Após salvar com sucesso, redireciona para `/?tab=quotes`
- Toast notification informa o usuário antes do redirecionamento
- Delay de 1.5 segundos para o usuário ver a confirmação

## Estrutura do Orçamento Criado

```typescript
{
  id: proposal.id,                    // ID único da proposta NOC
  client: projectData.clientName,     // Nome do cliente
  projectName: projectData.projectName, // Nome do projeto
  accountManager: '',                 // Pode ser preenchido depois
  status: 'Pendente',                 // Status inicial
  total: monthlyPrice × duration,     // Valor total do contrato
  date: hoje,                         // Data de criação
  distributorId: 1,                   // ID padrão
  quotationFile: undefined,           // Arquivos podem ser anexados depois
  pricingFile: undefined
}
```

## Fluxo Completo

1. **Usuário preenche dados NOC** → Todas as abas (Projeto, Dispositivos, Monitoramento, etc.)
2. **Vai para aba "Relatório"** → Visualiza resumo e análise financeira
3. **Preenche título e descrição** → Dados da proposta
4. **Clica em "Salvar em Propostas"** → Salva proposta NOC
5. **Sistema cria orçamento** → Com valor mensal, prazo e total
6. **Toast de confirmação** → "Proposta NOC Salva! Redirecionando..."
7. **Redirecionamento automático** → Para aba "Orçamentos"
8. **Orçamento aparece na lista** → Com todos os dados financeiros

## Como Testar

### Ambiente Local (http://localhost:3000)

1. Acesse o sistema
2. Navegue para "Precificação NOC"
3. Preencha os dados do projeto:
   - Nome do Projeto: "Teste NOC"
   - Cliente: "Empresa Teste"
   - Duração do Contrato: 12 meses
   - Nível de Serviço: Standard
   - Cobertura: 24x7

4. Preencha as demais abas com dados básicos
5. Vá para a aba "Relatório"
6. Verifique os valores calculados:
   - Preço Final Mensal
   - Duração do Contrato
   - Valor Total (deve ser mensal × duração)

7. Preencha:
   - Título: "Proposta NOC - Teste"
   - Descrição: "Teste de salvamento"

8. Clique em "Salvar em Propostas"
9. Aguarde o toast de confirmação
10. Verifique o redirecionamento para "Orçamentos"
11. Confirme que o orçamento aparece na lista com:
    - Cliente correto
    - Nome do projeto
    - Valor total do contrato
    - Status "Pendente"

## Arquivos Modificados

- `frontend/src/components/noc-pricing/NOCPricingSystem.tsx`
  - Adicionado `useRouter` do Next.js
  - Adicionado `useQuotes` do QuoteContext
  - Modificado `handleSaveProposal` para criar Quote e redirecionar

## Commit

```
Fix NOC pricing save to quotes with redirect - Add navigation and QuoteContext integration
```

## Próximos Passos (Opcional)

1. Adicionar campo "Gerente de Contas" no formulário NOC
2. Permitir seleção de distribuidor
3. Adicionar geração automática de PDF da proposta
4. Implementar edição de orçamentos NOC salvos
5. Adicionar filtros específicos para orçamentos NOC na lista

## Status

✅ Implementado e testado localmente
⏳ Aguardando deploy para produção

---

**Data**: 19/02/2026
**Desenvolvedor**: Kiro AI Assistant
