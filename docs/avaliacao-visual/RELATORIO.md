# Avaliação visual e de experiência — Sistema Pré-Venda TI

Data: 3 de novembro de 2026.

## Diagnóstico

O sistema oferece uma cobertura funcional ampla, mas sua apresentação ainda transmite a sensação de vários produtos reunidos. A maior oportunidade é criar uma identidade única e organizar as telas em torno das tarefas de pré-vendas. O acabamento sofisticado deve vir da hierarquia da informação, da legibilidade, da precisão dos indicadores e da consistência das interações.

Recomendo uma direção **corporativa contemporânea**: superfícies neutras, azul como cor principal, laranja reservado para destaques pontuais da marca, tipografia consistente, bordas discretas e gráficos com finalidade clara. Claro e escuro devem manter a mesma identidade e a mesma hierarquia.

## Cobertura e limites

- Inspeção da aplicação da raiz (`src/`), executada localmente em desenvolvimento com Next.js na porta 3100.
- Visita aos 23 destinos internos do menu: dashboard; projetos; distribuidores; cadastro de fornecedores; gestão e gráficos de ROs; treinamentos; orçamentos; propostas; propostas geradas; VLS; NOC/SOC/SIEM; Service Desk; impressão; portal de busca; editais analisados; análise com IA; documentação; atas; RFP/RFI; assessment; POC; configurações.
- Inspeção adicional da página pública, do login e do formulário de orçamento.
- Capturas em desktop, dashboard claro e escuro, celular de 390 px e tablet de 768 px. Celular foi verificado em dashboard, orçamentos e formulário de orçamento; isso não equivale a validar todos os módulos em todas as larguras.
- Revisão do layout, CSS global, componentes compartilhados, dashboards e estrutura das calculadoras no código.
- A sessão usada no navegador era isolada; não foram enviados formulários nem salvos registros comerciais. Os dados de exemplo pertencem à aplicação local.
- Não constitui auditoria funcional completa, teste de integrações externas, validação dos cálculos financeiros ou avaliação da versão publicada. As etapas internas de todas as calculadoras, PDFs finais e todos os estados de erro não foram percorridos integralmente.

As imagens estão em [evidencias/](evidencias/), com o inventário em [inspecao.json](evidencias/inspecao.json). As medições de altura são de desenvolvimento e podem variar com dados e tamanho da janela.

Verificações adicionais de período, busca e formulário: [verificacoes.json](evidencias/verificacoes.json).

## O que já funciona como base

- Radix, componentes compartilhados, Tailwind, Lucide e Recharts permitem evoluir o visual sem trocar a tecnologia principal.
- A navegação já tem grupos por área, indicação do item ativo e breadcrumbs.
- A separação entre temas e o uso parcial de variáveis semânticas são bons pontos de partida.
- Existem filtros e visões específicas de ROs, cartões de indicadores e recursos de gestão que podem ser reaproveitados.
- Assessment, POC e projetos já apresentam informações como responsável, progresso, prazo e risco. O próximo passo é dar prioridade a esses dados na composição.

## Achados prioritários

| Prioridade | Achado observado | Impacto | Recomendação |
|---|---|---|---|
| P0 | A lateral fica oculta abaixo de `md`, e a tela autenticada principal não renderiza um menu móvel substituto. Em 390 px não havia botão de menu. | O usuário perde acesso aos outros módulos no celular. | Botão de menu sempre acessível, navegação em painel lateral e acesso ao tema e à conta no menu móvel. |
| P0 | Os títulos dos cartões “Orçamentos no mês” e “Valor no pipeline” usam `text-primary-foreground/80` sobre cartão claro. Na captura clara os títulos praticamente desaparecem. | Indicadores ficam sem identificação legível. | Texto semântico de primeiro plano sobre superfícies claras; cor de texto invertida apenas sobre preenchimento primário. |
| P0 | O seletor de período altera o estado `period`, mas esse estado não filtra séries, métricas ou ROs. | A interface promete uma análise que os números não refletem. | Definir intervalo real, aplicá-lo aos dados e explicitar comparação e atualização. |
| P0 | `salesData` e `quoteStatusData` são séries fixas importadas de `src/lib/data.ts`. O “Valor no pipeline” é a soma de `quoteStatusData.value` formatada como moeda, sem vínculo com o valor dos orçamentos. | O painel não sustenta decisões comerciais com dados reais; a unidade do indicador não é demonstrada pela origem usada. | Calcular a partir dos registros comerciais, definir unidade de cada série e sinalizar demonstração quando for o caso. |
| P1 | Portal de Busca e Projetos usam aparência escura própria mesmo com o restante da aplicação claro. Projetos substitui o layout global. | Mudança de contexto, identidade e navegação entre módulos. | Um layout compartilhado, temas consistentes e navegação local dentro da área de trabalho. |
| P1 | VLS, NOC, Service Desk e impressão abrem com apresentações promocionais grandes. VLS ainda tem marca e cabeçalho próprios. | A ação de trabalho fica distante e o produto parece uma sequência de páginas de divulgação. | Abrir com propostas recentes, rascunhos, resumo do módulo e uma ação principal “Novo orçamento”. Ajuda introdutória sob demanda. |
| P1 | Campo “Buscar módulos...” sem conexão com a navegação e botão de notificações sem ação no componente do cabeçalho. Indicador “Online” é estático. | Controles sugerem capacidades que não demonstram. | Implementar busca global navegável e notificações reais; exibir estado de conexão somente se medido. |
| P1 | Dashboard agrega os gráficos comerciais e todo o painel de ROs em uma página de cerca de 2.908 px no desktop e 5.829 px no celular observado. | O que exige ação compete com muita informação secundária. | Visão executiva curta e painéis específicos por área, com acesso aos detalhes. |
| P1 | Gráficos principais escondem o eixo numérico; o gráfico de status usa categorias longas no eixo horizontal e o rótulo superior aparece cortado na captura. | Comparação e interpretação mais difíceis. | Mostrar unidade e escala; usar barras horizontais para status; reservar espaço para rótulos e valores. |
| P1 | Cartões usam sombra, transparência, gradiente e movimento de hover mesmo quando não são interativos. | Excesso de peso visual e indicação ambígua de clique. | Cartão neutro como padrão; efeitos reservados a estados interativos ou destaques justificáveis. |
| P2 | Títulos variam entre `CardTitle` renderizado como `div` e diferentes tamanhos de `h1`; algumas telas não têm título semântico. | Hierarquia visual e navegação assistiva inconsistentes. | Componente único de cabeçalho de página e títulos semânticos. |
| P2 | A configuração menciona Inter, mas o layout da raiz não carrega a fonte; Inter não constou entre as faces registradas na inspeção. Projetos usa a pilha do sistema. | Tipografia pode variar por máquina e módulo. | Carregar uma família explicitamente e usá-la em toda a aplicação. |
| P2 | O CSS global tem 1.784 linhas e 70 usos de `!important`, incluindo correções amplas para classes de cor de módulos. | Ajustes locais podem afetar telas não relacionadas. | Migrar gradualmente para tokens e variantes compartilhadas, removendo correções globais à medida que cada módulo for adaptado. |
| P2 | Há implementações divergentes em `src/` e `frontend/src/`, inclusive página, CSS e componentes visuais; as dependências Next também diferem. | Risco de atualizar uma interface e publicar outra. | Definir a fonte de interface usada no build e consolidar a manutenção visual antes de expandir o redesign. |

Evidências principais: [dashboard claro](evidencias/dashboard-claro.png), [dashboard no celular](evidencias/dashboard-celular.png), [VLS](evidencias/precificacao-vls.png), [Portal de Busca](evidencias/portal-busca.png), [Projetos](evidencias/projetos.png).

## Direção visual recomendada

### Identidade e superfícies

Proposta inicial de tokens, sujeita à conferência de contraste em cada combinação e estado:

| Papel | Claro | Escuro |
|---|---|---|
| Fundo de trabalho | `#F6F8FB` | `#0B1220` |
| Cartão / superfície | `#FFFFFF` | `#111C2E` |
| Texto principal | `#172033` | `#E8EDF5` |
| Texto secundário | `#526179` | `#A4B2C8` |
| Ação principal | `#2563EB` | `#60A5FA` |
| Borda | `#DCE3ED` | `#2A3A52` |
| Destaque da marca | `#C65A0A` | `#FB923C` |

Usar texto adequado ao preenchimento de cada botão; a mesma cor de texto não serve automaticamente para o azul claro e para o azul escuro. Não mudar a identidade principal de azul para ciano quando o usuário troca de tema.

- Superfícies opacas, com separação de camadas por contraste e borda. Transparência e blur apenas onde houver propósito.
- Raios de 10–12 px em cartões, 8 px em campos e botões; badges podem ter formato de pílula.
- Sombra discreta em cartões; sombra maior em menus e diálogos sobrepostos.
- Uma cor de ação dominante. Verde, amarelo e vermelho representam estados; cor sempre acompanhada por texto ou ícone.
- Imagens podem permanecer na página pública. Nas áreas de trabalho, priorizar dados, listas e controles.

### Tipografia, densidade e movimento

- Uma família consistente, como Inter já prevista no projeto, carregada explicitamente.
- Título da página entre 24 e 28 px; título de seção entre 16 e 18 px; texto de trabalho entre 14 e 16 px; apoio entre 12 e 13 px.
- Reduzir o uso de textos de 10 e 11 px para rótulos essenciais.
- Indicadores entre 28 e 36 px; números alinhados em tabelas, com algarismos tabulares.
- Espaçamento baseado em múltiplos de 4 px, com 24 px entre seções e 16–24 px dentro de superfícies.
- Oferecer densidade confortável e compacta para tabelas extensas, sem apenas diminuir a fonte.
- Transições breves em controles. Evitar levantar cartões estáticos ao passar o mouse. Conferir também o comportamento do Framer Motion com redução de movimento, além das regras CSS existentes.

## Navegação e estrutura da informação

Preservar a divisão por área, com menor repetição de itens e rótulos mais orientados ao trabalho:

| Grupo | Conteúdo proposto |
|---|---|
| Visão geral | Dashboard e minhas pendências |
| Comercial | Orçamentos, propostas, registros de oportunidade e parceiros |
| Precificação | Venda/locação/serviços, Service Desk, NOC/SOC/SIEM e impressão |
| Licitações | Busca, editais, análise com IA, documentação e atas |
| Soluções e entrega | Assessment, POC, RFP/RFI e projetos |
| Administração | Configurações e acessos |

“Propostas” e “Propostas Geradas” podem virar uma área única com abas de rascunhos, enviadas, aprovadas e documentos. Antes de unir, mapear a relação entre suas entidades e fluxos para não ocultar diferenças de negócio.

- Lateral recolhível no desktop, com nome acessível e tooltip quando necessário.
- Menu em painel no celular, com acesso integral aos destinos permitidos.
- Busca global que encontre módulos e, progressivamente, clientes, propostas e projetos; atalho de teclado opcional.
- Cada página com título, breve contexto, ação principal e filtros locais.
- Navegação por URLs por módulo, preservando filtros quando fizer sentido. Hoje a maior parte das telas troca por `activeTab`, o que limita links diretos e histórico do navegador.
- Manter o contexto do cliente/oportunidade ao passar entre orçamento, proposta, POC e projeto.

## Dashboard proposto

A primeira tela deve responder: **como está o negócio, o que mudou e o que preciso fazer agora?**

### Visão executiva

1. Cabeçalho “Visão geral”, período explícito, responsável/equipe quando aplicável e horário de atualização.
2. Quatro indicadores: pipeline aberto em reais, receita de negócios ganhos no período, taxa de conversão e margem estimada ponderada. Usar somente métricas que tenham origem e definição disponíveis; enquanto isso, exibir indisponibilidade ou indicadores comprovados.
3. Evolução de receita em reais com comparação temporal claramente identificada; funil por etapa com quantidade e valor.
4. Fila “Precisa de atenção”: propostas próximas do vencimento, ROs próximos da expiração, editais com prazo curto e aprovações pendentes. Cada linha abre o item correspondente.
5. Links para o painel comercial, licitações e projetos, em vez de incorporar todas as suas visualizações à primeira página.

### Definição dos indicadores antes do desenho

| Indicador | Definição proposta | Cuidado |
|---|---|---|
| Pipeline aberto | Soma dos valores dos negócios nas etapas consideradas abertas | Definir inclusão de valores recorrentes, moeda e deduplicação entre orçamento e proposta |
| Receita ganha | Soma dos negócios ganhos pela data de fechamento dentro do período | Identificar se representa contrato total, mensalidade ou receita reconhecida |
| Conversão | Ganhos / (ganhos + perdidos) encerrados no período | Mostrar a base; não dividir contagens de origens temporais incompatíveis |
| Margem estimada | Resultado estimado total / receita estimada total | Usar média ponderada e distinguir de margem realizada |
| Comparação temporal | Mesmo indicador no intervalo anterior equivalente | Tratar denominador zero, intervalos sem dados e ausência de histórico |

Nos gráficos, usar barras para comparar categorias, linhas para evolução temporal e barras empilhadas para composição. Reservar pizza ou rosca a poucos grupos quando a comparação de proporções for o objetivo real. A escolha deve partir da pergunta de negócio.

### Painéis por área

- **Comercial:** valor por etapa, conversão, ticket, idade das oportunidades, desempenho por responsável e motivos de perda.
- **Precificação:** custos, preço, margem, impostos e sensibilidade de cenários. Distinguir mensal, anual e valor total do contrato em todos os resumos.
- **Licitações:** prazos, etapa de participação, documentação pendente, alertas de risco e próximos eventos.
- **Projetos:** progresso, marcos atrasados, orçamento planejado versus realizado e carga da equipe.
- **ROs:** vencimentos futuros separados de registros já expirados. Hoje a lista de “próximos da expiração” ordena todos os registros e pode ser ocupada pelos mais antigos já vencidos.

## Melhorias por módulo

| Área avaliada | Melhorias recomendadas |
|---|---|
| Página pública e login | Simplificar a mensagem principal e usar uma demonstração do produto. Manter identidade, tipografia e botões iguais aos da aplicação. Revisar afirmações quantitativas e de infraestrutura antes de usá-las como promessa comercial. |
| Dashboard | Resolver os P0; reduzir extensão; priorizar indicadores confiáveis e pendências com ação. |
| Distribuidores e cadastro de fornecedores | Padrão único de tabela, busca e filtros; contatos e pendências visíveis; ações secundárias em menu por linha. |
| Gestão de ROs | Destacar prazo, situação e responsável. Filtros rápidos de vencimento; abrir detalhes com histórico e próxima ação. |
| Gráficos de ROs | Usar o mesmo padrão de gráfico do restante do produto; reduzir cartões decorativos e uniformizar semântica das cores. |
| Treinamentos | Calendário/lista com data, fabricante, inscrição e responsável. Separar próximos eventos de histórico. |
| Orçamentos | Barra de filtros consistente; valores e recorrência identificados; ações por linha; detalhe lateral no desktop e tela completa no celular. |
| Propostas e propostas geradas | Jornada unificada quando o modelo permitir; versão, validade, status, responsável, cliente e relação com o orçamento. Preview e exportação no mesmo contexto. |
| Precificação VLS | Remover marca/cabeçalho concorrente e apresentação longa. Abrir em propostas recentes ou no trabalho em andamento. |
| NOC/SOC/SIEM | Escolha inicial compacta do serviço; módulos dentro do mesmo padrão. Agrupar as 11 abas em etapas compreensíveis e manter resumo de preço visível. |
| Service Desk | Organizar as 12 abas em grupos: premissas, operação, custos e resultado. Preservar acesso direto para usuários experientes, indicar pendências e salvar andamento. |
| Outsourcing de impressão | Abrir com parque/equipamentos e propostas recentes. Resumo de franquia, custo por página, excedente, preço mensal e prazo do contrato. |
| Portal de Busca | Integrar ao tema global; corrigir sobreposição de cabeçalho observada; busca principal clara; filtros avançados recolhíveis; chips dos filtros ativos e consultas salvas. |
| Editais analisados | Lista com prazo, risco, elegibilidade, responsável e próxima ação; vínculo direto com análise e documentação. |
| Análise de edital com IA | Fluxo “Enviar → Processar → Revisar”. Mostrar evidências do documento junto às conclusões e manter estados de processamento e falha claros. |
| Documentação para editais | Organizar por empresa, tipo, validade e situação. Destacar documentos vencidos, ausentes e próximos do vencimento. |
| Atas de registro de preços | Tabela com vigência, saldo, órgão, itens e alertas de vencimento. Detalhes progressivos. |
| RFP/RFI | Etapas, requisitos, responsáveis e prazo; resumo de completude e comparação de respostas quando houver dados. |
| Assessment | Reduzir a apresentação inicial; evidenciar maturidade, achados, evidências e plano de ação. |
| POC | Compactar o banner fotográfico e evitar repetir indicadores no banner e nos cartões. Priorizar critérios de sucesso, prazo, risco e resultado de validação. |
| Projetos | Preservar o layout global e o tema selecionado; entrada com tarefas e projetos reais. Manter Kanban, lista, cronograma e painel como visões locais. |
| Configurações | Agrupar por identidade, conta, acessos e preferências. Deixar claro alcance e confirmação das alterações. |

## Padrões compartilhados a criar

| Componente/padrão | Contrato visual e de interação |
|---|---|
| Layout da aplicação | Navegação desktop e móvel, cabeçalho, conta, tema e área de conteúdo |
| Cabeçalho de página | Título semântico, contexto, ação principal e ações secundárias |
| Cartão de indicador | Nome legível, valor com unidade, intervalo, comparação e ação opcional |
| Painel de gráfico | Título, período, unidade, legenda necessária, tooltip e resumo acessível |
| Tabela de trabalho | Busca, filtros, ordenação, paginação quando necessária, ações e estados vazios |
| Badge de status | Vocabulário e cores comuns em claro e escuro; ícone/texto para significado |
| Formulário | Rótulo persistente, ajuda contextual, unidade, validação próxima ao campo e ação de salvar previsível |
| Fluxo de precificação | Etapas agrupadas, progresso, rascunho, resumo e validação antes de gerar proposta |
| Estados de interface | Carregamento, vazio inicial, nenhum resultado, indisponibilidade e erro recuperável |

Não é necessário substituir a biblioteca de componentes. O investimento deve estar nas regras compartilhadas e na adoção delas em cada módulo.

## Sequência de execução

| Etapa | Entrega concreta | Critério de conclusão |
|---|---|---|
| 1. Base e impedimentos | Definição do frontend mantido; navegação móvel; contraste dos KPIs; regras de métricas e período | Todos os módulos acessíveis em celular; rótulos legíveis; filtros e números coerentes |
| 2. Padrão visual | Tokens, fonte carregada, layout, cabeçalho, cartão, tabela, formulário e estados | Uma tela de referência coerente em claro, escuro, desktop e celular |
| 3. Dashboard de referência | Visão executiva curta e fila de atenção ligada aos registros | Cada indicador tem origem, unidade e definição; cada pendência abre o item |
| 4. Fluxo comercial | Orçamentos, propostas, parceiros e ROs no padrão | Jornada sem mudança de identidade e sem duplicação visual de ações |
| 5. Fluxos especializados | Calculadoras, licitações, assessment, POC e projetos | Identidade comum; particularidades de negócio preservadas; introduções compactas |
| 6. Acabamento | Responsividade, teclado, contraste, estados, mensagens e PDFs | Verificação dos fluxos críticos e comparação visual com a referência aprovada |

Começaria por **layout global + dashboard**, seguido por **orçamentos/propostas**. Essas telas estabelecem o padrão e permitem avaliar rapidamente o resultado antes de replicá-lo.

## Critérios de qualidade

- Acesso a todos os módulos em 390, 768, 1280 e 1440 px, sem perder ações essenciais. Verificar também 320 px e zoom de 200%.
- Contraste mínimo de texto comum de 4,5:1 e texto grande de 3:1, conforme [WCAG 2.2 — contraste](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). A presença de comentários de conformidade no CSS não substitui medição.
- Foco visível, ordem de teclado, nomes acessíveis e diálogos utilizáveis sem mouse.
- Todo gráfico com unidade, período e origem definidos; leitura não dependente apenas de cor ou hover.
- Mesmos dados e contexto preservados ao alternar tema.
- Nenhum botão/campo aparentando uma função que não executa.
- Tabelas com números alinhados e filtros compreensíveis; adaptação móvel que mantenha ações acessíveis.
- Regressão visual focada nas telas e nos estados realmente modificados. O Playwright atual aponta para a porta 3000; a instância desta inspeção foi 3100, portanto a suíte existente não foi executada contra esse endereço por padrão.

As recomendações de visualização também foram confrontadas com a documentação oficial do [Carbon Design System](https://www.carbondesignsystem.com/building-blocks/data-visualization/overview), que enfatiza comunicação precisa e acessível dos dados. A composição, a paleta sugerida e as prioridades deste relatório são propostas específicas para o sistema avaliado.

## Conceitos para comparação

Foram preparados dois conceitos ilustrativos para discussão visual: **Executivo**, com resultados e fila de atenção, e **Operacional**, com carteira de trabalho e próximos passos. Os números são fictícios e não representam os registros do sistema. Ambos foram conferidos no navegador em larguras de 320, 390, 768 e 1024 px, sem transbordamento horizontal, e com os controles de período e prioridade funcionando localmente. Esses conceitos não substituem telas da aplicação.

## Resultado esperado

Uma plataforma com aparência única, leitura mais rápida e melhor continuidade entre descoberta, precificação, proposta e entrega. A modernização será mais perceptível quando cada tela mostrar primeiro a situação do trabalho e a próxima ação, com dados confiáveis e componentes consistentes.
