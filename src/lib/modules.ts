export interface ModuleDefinition {
  id: string;
  label: string;
  category: string;
  subModules?: { id: string; label: string }[];
}

export const MODULE_DEFINITIONS: ModuleDefinition[] = [
  { id: 'dashboard', label: 'Dashboard', category: 'Gestão' },
  { id: 'projects', label: 'Projetos', category: 'Gestão' },
  { id: 'distributors', label: 'Distribuidores', category: 'Comercial' },
  {
    id: 'suppliers',
    label: 'Fornecedores',
    category: 'Comercial',
    subModules: [
      { id: 'suppliers-register', label: 'Cadastro' },
      { id: 'ro-management', label: 'Gestão de ROs' },
      { id: 'ro-charts', label: 'Gráficos de ROs' },
      { id: 'training-management', label: 'Gestão de Treinamentos' },
    ],
  },
  { id: 'quotes', label: 'Orçamentos', category: 'Comercial' },
  { id: 'proposals', label: 'Propostas', category: 'Comercial' },
  { id: 'generated-proposals', label: 'Propostas Geradas', category: 'Comercial' },
  {
    id: 'pricing',
    label: 'Precificação',
    category: 'Financeiro',
    subModules: [
      { id: 'calculator-ti-vls', label: 'Venda/Locação/Serviços' },
      { id: 'calculator-noc', label: 'NOC/SOC/SIEM' },
      { id: 'calculator-servicedesk-advanced', label: 'Service Desk Avançado' },
      { id: 'calculator-printer', label: 'Outsourcing de Impressão' },
    ],
  },
  {
    id: 'bids',
    label: 'Licitações/Editais',
    category: 'B2G',
    subModules: [
      { id: 'portal-busca', label: 'Portal de Busca' },
      { id: 'bids-analysis', label: 'Editais Analisados' },
      { id: 'ai-bid-analyzer', label: 'Analisar Edital com IA' },
      { id: 'bids-docs', label: 'Documentações para Editais' },
    ],
  },
  { id: 'price-records', label: 'Atas de Registro de Preços', category: 'B2G' },
  { id: 'rfp', label: 'RFP/RFI', category: 'B2G' },
  { id: 'it-assessment', label: 'Assessment de TI', category: 'Técnico' },
  { id: 'poc', label: 'Provas de Conceito (POC)', category: 'Técnico' },
  { id: 'settings', label: 'Configurações', category: 'Sistema' },
];

export const ALL_MODULE_IDS: string[] = MODULE_DEFINITIONS.flatMap((m) => [
  m.id,
  ...(m.subModules?.map((s) => s.id) || []),
]);

export function getModulesByCategory(): Record<string, ModuleDefinition[]> {
  const grouped: Record<string, ModuleDefinition[]> = {};
  for (const mod of MODULE_DEFINITIONS) {
    if (!grouped[mod.category]) grouped[mod.category] = [];
    grouped[mod.category].push(mod);
  }
  return grouped;
}
