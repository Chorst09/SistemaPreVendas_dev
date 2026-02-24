'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Book, 
  Search, 
  ChevronRight, 
  ChevronDown, 
  FileText, 
  Video, 
  ExternalLink,
  Download,
  Star,
  Clock,
  User,
  Tag,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// Documentation item interface
export interface DocumentationItem {
  id: string;
  title: string;
  content: React.ReactNode;
  category: 'getting-started' | 'user-guide' | 'advanced' | 'troubleshooting' | 'api' | 'faq';
  tags: string[];
  lastUpdated: Date;
  author: string;
  estimatedReadTime: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  relatedItems?: string[];
  attachments?: Array<{
    name: string;
    url: string;
    type: 'pdf' | 'video' | 'image' | 'link';
  }>;
}

// Documentation data
const documentationItems: DocumentationItem[] = [
  {
    id: 'getting-started-overview',
    title: 'Visão Geral do Sistema',
    category: 'getting-started',
    tags: ['introdução', 'overview', 'básico'],
    lastUpdated: new Date('2024-01-15'),
    author: 'Equipe de Desenvolvimento',
    estimatedReadTime: 5,
    difficulty: 'beginner',
    content: (
      <div className="prose prose-sm max-w-none">
        <h3>O que é o Sistema de Precificação Service Desk?</h3>
        <p>
          O Sistema de Precificação Service Desk é uma ferramenta completa para calcular custos 
          e criar orçamentos detalhados para serviços de service desk. O sistema é organizado 
          em 10 abas funcionais que cobrem todos os aspectos da precificação.
        </p>
        
        <h4>Principais Funcionalidades:</h4>
        <ul>
          <li><strong>Gestão de Dados:</strong> Configure informações básicas do projeto</li>
          <li><strong>Gestão de Equipe:</strong> Defina membros, cargos e custos</li>
          <li><strong>Escalas de Trabalho:</strong> Configure horários e turnos</li>
          <li><strong>Tributação:</strong> Aplique impostos e taxas</li>
          <li><strong>Análise Financeira:</strong> Calcule ROI, margens e rentabilidade</li>
          <li><strong>Geração de Propostas:</strong> Exporte em PDF, Excel e outros formatos</li>
        </ul>
        
        <h4>Fluxo de Trabalho:</h4>
        <ol>
          <li>Configure os dados básicos do projeto</li>
          <li>Defina a equipe e custos de pessoal</li>
          <li>Configure escalas e horários de atendimento</li>
          <li>Aplique impostos e variáveis econômicas</li>
          <li>Adicione custos adicionais</li>
          <li>Revise o orçamento consolidado</li>
          <li>Analise resultados e rentabilidade</li>
          <li>Simule cenários de negociação</li>
          <li>Finalize com análise executiva</li>
          <li>Gere propostas e relatórios</li>
        </ol>
      </div>
    )
  },
  
  {
    id: 'data-tab-guide',
    title: 'Guia da Aba Dados',
    category: 'user-guide',
    tags: ['dados', 'projeto', 'configuração'],
    lastUpdated: new Date('2024-01-10'),
    author: 'Equipe de Produto',
    estimatedReadTime: 8,
    difficulty: 'beginner',
    relatedItems: ['team-tab-guide', 'getting-started-overview'],
    content: (
      <div className="prose prose-sm max-w-none">
        <h3>Configurando os Dados do Projeto</h3>
        <p>
          A aba Dados é o ponto de partida para qualquer orçamento. Aqui você define 
          as informações fundamentais que serão usadas em todo o sistema.
        </p>
        
        <h4>Campos Obrigatórios:</h4>
        <ul>
          <li><strong>Nome do Projeto:</strong> Identificação única do projeto</li>
          <li><strong>Cliente:</strong> Nome da empresa ou organização cliente</li>
          <li><strong>Período do Contrato:</strong> Data de início e fim do contrato</li>
          <li><strong>Tipo de Serviço:</strong> Categoria do service desk (básico, avançado, premium)</li>
        </ul>
        
        <h4>Campos Opcionais:</h4>
        <ul>
          <li><strong>Descrição:</strong> Detalhes adicionais sobre o projeto</li>
          <li><strong>Localização:</strong> Cidade/estado onde será prestado o serviço</li>
          <li><strong>Moeda:</strong> Moeda para cálculos (padrão: BRL)</li>
          <li><strong>Observações:</strong> Notas internas sobre o projeto</li>
        </ul>
        
        <h4>Dicas Importantes:</h4>
        <div className="bg-blue-50 p-4 rounded-md">
          <ul className="mb-0">
            <li>Use nomes descritivos para facilitar a identificação posterior</li>
            <li>O período do contrato afeta todos os cálculos de custos</li>
            <li>A localização pode influenciar impostos e custos regionais</li>
            <li>Salve frequentemente - o sistema faz backup automático</li>
          </ul>
        </div>
      </div>
    )
  },
  
  {
    id: 'team-management-guide',
    title: 'Gestão de Equipe Completa',
    category: 'user-guide',
    tags: ['equipe', 'rh', 'custos', 'salários'],
    lastUpdated: new Date('2024-01-12'),
    author: 'Especialista em RH',
    estimatedReadTime: 12,
    difficulty: 'intermediate',
    relatedItems: ['scale-management-guide', 'cost-calculation-guide'],
    content: (
      <div className="prose prose-sm max-w-none">
        <h3>Configurando a Equipe de Service Desk</h3>
        <p>
          A aba Equipe permite definir todos os profissionais envolvidos no projeto, 
          seus custos e benefícios. Esta é uma das abas mais importantes para o cálculo preciso.
        </p>
        
        <h4>Adicionando Membros da Equipe:</h4>
        <ol>
          <li>Clique em "Adicionar Membro"</li>
          <li>Preencha nome e cargo</li>
          <li>Defina salário base mensal</li>
          <li>Configure benefícios e encargos</li>
          <li>Defina carga horária semanal</li>
        </ol>
        
        <h4>Tipos de Cargos Comuns:</h4>
        <ul>
          <li><strong>Analista N1:</strong> Atendimento básico, primeiro nível</li>
          <li><strong>Analista N2:</strong> Suporte técnico intermediário</li>
          <li><strong>Analista N3:</strong> Suporte especializado</li>
          <li><strong>Coordenador:</strong> Gestão da equipe</li>
          <li><strong>Gerente:</strong> Gestão geral do service desk</li>
        </ul>
        
        <h4>Cálculo de Custos:</h4>
        <p>O sistema calcula automaticamente:</p>
        <ul>
          <li>Custo por hora de cada profissional</li>
          <li>Encargos sociais (FGTS, INSS, etc.)</li>
          <li>Benefícios (vale transporte, alimentação, etc.)</li>
          <li>Custo total mensal e anual da equipe</li>
        </ul>
        
        <div className="bg-yellow-50 p-4 rounded-md">
          <h5>⚠️ Atenção:</h5>
          <p className="mb-0">
            Certifique-se de incluir todos os encargos e benefícios para um cálculo preciso. 
            Custos subestimados podem comprometer a viabilidade do projeto.
          </p>
        </div>
      </div>
    )
  },
  
  {
    id: 'advanced-calculations',
    title: 'Cálculos Avançados e Cenários',
    category: 'advanced',
    tags: ['cálculos', 'roi', 'cenários', 'análise'],
    lastUpdated: new Date('2024-01-08'),
    author: 'Analista Financeiro',
    estimatedReadTime: 15,
    difficulty: 'advanced',
    relatedItems: ['result-analysis-guide', 'negotiation-scenarios'],
    content: (
      <div className="prose prose-sm max-w-none">
        <h3>Análises Financeiras Avançadas</h3>
        <p>
          O sistema oferece ferramentas avançadas para análise financeira detalhada, 
          incluindo cálculos de ROI, análise de sensibilidade e simulação de cenários.
        </p>
        
        <h4>Cálculo de ROI (Return on Investment):</h4>
        <p>O ROI é calculado usando a fórmula:</p>
        <code>ROI = (Receita - Investimento) / Investimento × 100</code>
        
        <h4>Análise de Payback:</h4>
        <p>Tempo necessário para recuperar o investimento inicial:</p>
        <ul>
          <li><strong>Payback Simples:</strong> Não considera valor do dinheiro no tempo</li>
          <li><strong>Payback Descontado:</strong> Considera taxa de desconto</li>
        </ul>
        
        <h4>Simulação de Cenários:</h4>
        <p>Crie diferentes cenários para análise:</p>
        <ul>
          <li><strong>Otimista:</strong> Melhores condições de mercado</li>
          <li><strong>Realista:</strong> Condições esperadas</li>
          <li><strong>Pessimista:</strong> Condições adversas</li>
        </ul>
        
        <h4>Análise de Sensibilidade:</h4>
        <p>Identifique quais variáveis mais impactam o resultado:</p>
        <ul>
          <li>Variação de custos de pessoal</li>
          <li>Mudanças na carga tributária</li>
          <li>Flutuações de mercado</li>
          <li>Alterações no escopo</li>
        </ul>
      </div>
    )
  },
  
  {
    id: 'troubleshooting-common-issues',
    title: 'Solucionando Problemas Comuns',
    category: 'troubleshooting',
    tags: ['problemas', 'erros', 'soluções', 'suporte'],
    lastUpdated: new Date('2024-01-14'),
    author: 'Equipe de Suporte',
    estimatedReadTime: 10,
    difficulty: 'intermediate',
    content: (
      <div className="prose prose-sm max-w-none">
        <h3>Problemas Comuns e Soluções</h3>
        
        <h4>🔴 Erro: "Dados obrigatórios não preenchidos"</h4>
        <p><strong>Causa:</strong> Campos obrigatórios estão vazios ou inválidos.</p>
        <p><strong>Solução:</strong></p>
        <ol>
          <li>Verifique os campos marcados com asterisco (*)</li>
          <li>Preencha todos os campos obrigatórios</li>
          <li>Valide formatos de data e números</li>
        </ol>
        
        <h4>🟡 Aviso: "Cobertura de atendimento insuficiente"</h4>
        <p><strong>Causa:</strong> Escala não cobre todos os horários necessários.</p>
        <p><strong>Solução:</strong></p>
        <ol>
          <li>Revise a aba Escala</li>
          <li>Adicione turnos para cobrir lacunas</li>
          <li>Verifique sobreposições de horários</li>
        </ol>
        
        <h4>🔴 Erro: "Cálculo de impostos inválido"</h4>
        <p><strong>Causa:</strong> Alíquotas de impostos incorretas ou ausentes.</p>
        <p><strong>Solução:</strong></p>
        <ol>
          <li>Verifique a aba Impostos</li>
          <li>Confirme alíquotas para sua região</li>
          <li>Use templates pré-configurados</li>
        </ol>
        
        <h4>⚡ Performance: Sistema lento</h4>
        <p><strong>Possíveis causas e soluções:</strong></p>
        <ul>
          <li><strong>Muitos dados:</strong> Use filtros para reduzir volume</li>
          <li><strong>Cálculos complexos:</strong> Aguarde processamento</li>
          <li><strong>Conexão lenta:</strong> Verifique sua internet</li>
          <li><strong>Cache cheio:</strong> Limpe cache do navegador</li>
        </ul>
        
        <div className="bg-red-50 p-4 rounded-md">
          <h5>🆘 Precisa de mais ajuda?</h5>
          <p className="mb-0">
            Se o problema persistir, entre em contato com o suporte técnico 
            através do chat ou email: suporte@sistema.com
          </p>
        </div>
      </div>
    )
  },
  
  {
    id: 'faq-general',
    title: 'Perguntas Frequentes',
    category: 'faq',
    tags: ['faq', 'dúvidas', 'perguntas'],
    lastUpdated: new Date('2024-01-16'),
    author: 'Equipe de Suporte',
    estimatedReadTime: 7,
    difficulty: 'beginner',
    content: (
      <div className="prose prose-sm max-w-none">
        <h3>Perguntas Mais Frequentes</h3>
        
        <h4>❓ Como salvar meu trabalho?</h4>
        <p>
          O sistema salva automaticamente suas alterações a cada 30 segundos. 
          Você também pode salvar manualmente usando Ctrl+S.
        </p>
        
        <h4>❓ Posso trabalhar offline?</h4>
        <p>
          Não, o sistema requer conexão com internet para funcionar. 
          Porém, seus dados são salvos localmente como backup.
        </p>
        
        <h4>❓ Como exportar meus dados?</h4>
        <p>
          Use o botão "Exportar" no canto superior direito. 
          Você pode exportar em PDF, Excel ou JSON.
        </p>
        
        <h4>❓ Posso usar templates?</h4>
        <p>
          Sim! Clique em "Templates" para salvar configurações 
          ou aplicar templates existentes em novos projetos.
        </p>
        
        <h4>❓ Como calcular impostos corretamente?</h4>
        <p>
          Use os templates de impostos por região ou consulte 
          um contador para alíquotas específicas da sua localidade.
        </p>
        
        <h4>❓ O que fazer se encontrar um erro?</h4>
        <p>
          Primeiro, tente recarregar a página. Se persistir, 
          verifique a seção de Troubleshooting ou contate o suporte.
        </p>
        
        <h4>❓ Como funciona o sistema de validação?</h4>
        <p>
          O sistema valida dados em tempo real. Erros aparecem em vermelho 
          e impedem navegação. Avisos em amarelo são informativos.
        </p>
        
        <h4>❓ Posso colaborar com outros usuários?</h4>
        <p>
          Atualmente não há colaboração em tempo real, mas você pode 
          exportar e compartilhar dados via templates ou arquivos.
        </p>
      </div>
    )
  }
];

// Documentation system component
interface DocumentationSystemProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: string;
  initialSearchTerm?: string;
}

export function DocumentationSystem({ 
  isOpen, 
  onClose, 
  initialCategory = 'getting-started',
  initialSearchTerm = '' 
}: DocumentationSystemProps) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedItem, setSelectedItem] = useState<DocumentationItem | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Filter documentation items
  const filteredItems = useMemo(() => {
    let items = documentationItems;
    
    // Filter by category
    if (selectedCategory !== 'all') {
      items = items.filter(item => item.category === selectedCategory);
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      items = items.filter(item => 
        item.title.toLowerCase().includes(term) ||
        item.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }
    
    return items;
  }, [searchTerm, selectedCategory]);

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, DocumentationItem[]> = {};
    filteredItems.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredItems]);

  const categories = [
    { id: 'all', label: 'Todos', icon: Book },
    { id: 'getting-started', label: 'Primeiros Passos', icon: Star },
    { id: 'user-guide', label: 'Guia do Usuário', icon: User },
    { id: 'advanced', label: 'Avançado', icon: FileText },
    { id: 'troubleshooting', label: 'Solução de Problemas', icon: Search },
    { id: 'faq', label: 'FAQ', icon: Tag }
  ];

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Book className="text-blue-500" size={24} />
            <h2 className="text-xl font-semibold">Documentação do Sistema</h2>
          </div>
          <Button variant="ghost" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-80 border-r bg-gray-50 flex flex-col">
            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="Buscar na documentação..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="p-4 border-b">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Categorias</h3>
              <div className="space-y-1">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const count = category.id === 'all' 
                    ? documentationItems.length 
                    : documentationItems.filter(item => item.category === category.id).length;
                  
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors",
                        selectedCategory === category.id
                          ? "bg-blue-100 text-blue-700"
                          : "text-gray-600 hover:bg-gray-100"
                      )}
                    >
                      <div className="flex items-center space-x-2">
                        <Icon size={16} />
                        <span>{category.label}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {count}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-4">
              {Object.entries(groupedItems).map(([category, items]) => (
                <div key={category} className="mb-4">
                  <button
                    onClick={() => toggleSection(category)}
                    className="w-full flex items-center justify-between text-sm font-medium text-gray-700 mb-2"
                  >
                    <span className="capitalize">
                      {categories.find(c => c.id === category)?.label || category}
                    </span>
                    {expandedSections.has(category) ? 
                      <ChevronDown size={16} /> : 
                      <ChevronRight size={16} />
                    }
                  </button>
                  
                  <AnimatePresence>
                    {expandedSections.has(category) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-1 ml-2"
                      >
                        {items.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                            className={cn(
                              "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
                              selectedItem?.id === item.id
                                ? "bg-blue-100 text-blue-700"
                                : "text-gray-600 hover:bg-gray-100"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <span className="truncate">{item.title}</span>
                              <div className="flex items-center space-x-1 ml-2">
                                <Clock size={12} className="text-gray-400" />
                                <span className="text-xs text-gray-400">
                                  {item.estimatedReadTime}min
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge 
                                variant={
                                  item.difficulty === 'beginner' ? 'default' :
                                  item.difficulty === 'intermediate' ? 'secondary' :
                                  'destructive'
                                }
                                className="text-xs"
                              >
                                {item.difficulty}
                              </Badge>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col">
            {selectedItem ? (
              <div className="flex-1 overflow-y-auto">
                {/* Article Header */}
                <div className="p-6 border-b bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {selectedItem.title}
                      </h1>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <User size={14} />
                          <span>{selectedItem.author}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock size={14} />
                          <span>{selectedItem.estimatedReadTime} min de leitura</span>
                        </div>
                        <Badge 
                          variant={
                            selectedItem.difficulty === 'beginner' ? 'default' :
                            selectedItem.difficulty === 'intermediate' ? 'secondary' :
                            'destructive'
                          }
                        >
                          {selectedItem.difficulty}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {selectedItem.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Article Content */}
                <div className="p-6">
                  {selectedItem.content}
                  
                  {/* Related Items */}
                  {selectedItem.relatedItems && selectedItem.relatedItems.length > 0 && (
                    <div className="mt-8 pt-6 border-t">
                      <h4 className="text-lg font-medium mb-4">Artigos Relacionados</h4>
                      <div className="grid gap-3">
                        {selectedItem.relatedItems.map((relatedId) => {
                          const relatedItem = documentationItems.find(item => item.id === relatedId);
                          if (!relatedItem) return null;
                          
                          return (
                            <button
                              key={relatedId}
                              onClick={() => setSelectedItem(relatedItem)}
                              className="text-left p-3 border rounded-md hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-blue-600 dark:text-blue-400">
                                  {relatedItem.title}
                                </span>
                                <ChevronRight size={16} className="text-gray-400" />
                              </div>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {relatedItem.category}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {relatedItem.estimatedReadTime} min
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Book size={48} className="text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Selecione um artigo
                  </h3>
                  <p className="text-gray-600">
                    Escolha um artigo da lista à esquerda para começar a ler.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}