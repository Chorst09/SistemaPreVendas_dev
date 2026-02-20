"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  BookOpen, Search, Download, ExternalLink, 
  Server, Headset, Calculator, FileText, 
  BarChart, Users, DollarSign, Printer,
  Brain, CheckSquare, Settings, Zap
} from 'lucide-react';

interface DocSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  category: string;
  description: string;
  content: {
    overview: string;
    features: string[];
    howToUse: string[];
    tips: string[];
    examples?: string[];
  };
}

const documentationSections: DocSection[] = [
  {
    id: 'noc-pricing',
    title: 'Precificação NOC',
    icon: <Server className="h-5 w-5" />,
    category: 'Calculadoras',
    description: 'Sistema de precificação para Centro de Operações de Rede (NOC)',
    content: {
      overview: 'O módulo de Precificação NOC permite calcular custos e preços para serviços de monitoramento e gestão de infraestrutura de TI. Inclui dimensionamento de equipe, custos operacionais, SLA e análise de competitividade.',
      features: [
        'Configuração de projeto e dados do cliente',
        'Cadastro de dispositivos monitorados (servidores, rede, aplicações)',
        'Configuração de ferramentas de monitoramento',
        'Definição de SLA (disponibilidade, tempo de resposta)',
        'Dimensionamento de equipe NOC por turnos',
        'Cálculo de custos operacionais (infraestrutura, licenças)',
        'Aplicação de impostos e margens',
        'Análise de competitividade de mercado',
        'Geração de relatório completo',
        'Salvamento como orçamento'
      ],
      howToUse: [
        '1. Acesse "Precificação NOC" no menu lateral',
        '2. Clique em "Nova Proposta NOC"',
        '3. Preencha os dados do projeto (nome, cliente, duração, nível de serviço)',
        '4. Adicione dispositivos a serem monitorados',
        '5. Configure ferramentas de monitoramento e alertas',
        '6. Defina o SLA desejado',
        '7. Dimensione a equipe NOC necessária',
        '8. Informe custos operacionais (infraestrutura, licenças)',
        '9. Configure impostos e margens de lucro',
        '10. Revise os cálculos na aba "Cálculos"',
        '11. Gere o relatório final na aba "Relatório"',
        '12. Salve como orçamento para acompanhamento'
      ],
      tips: [
        'Use templates pré-configurados para agilizar o processo',
        'Revise a análise de competitividade para ajustar preços',
        'Considere automação com IA para reduzir custos de equipe',
        'Monitore o ROI e rentabilidade antes de enviar a proposta',
        'Exporte o relatório em PDF para apresentação ao cliente'
      ],
      examples: [
        'NOC Básico: 50 dispositivos, 8x5, equipe de 2 analistas',
        'NOC Standard: 200 dispositivos, 24x7, equipe de 6 analistas',
        'NOC Premium: 500+ dispositivos, 24x7, equipe de 12+ analistas com IA'
      ]
    }
  },
  {
    id: 'service-desk',
    title: 'Service Desk',
    icon: <Headset className="h-5 w-5" />,
    category: 'Calculadoras',
    description: 'Dimensionamento e precificação de Service Desk usando Erlang C',
    content: {
      overview: 'O módulo Service Desk utiliza a fórmula Erlang C para dimensionar equipes de suporte técnico, calculando o número ideal de atendentes baseado em volume de chamadas, tempo médio de atendimento e nível de serviço desejado.',
      features: [
        'Cálculo Erlang C para dimensionamento',
        'Configuração de horários de atendimento',
        'Definição de níveis de serviço (SLA)',
        'Cálculo de custos por atendente',
        'Geração de escalas de trabalho',
        'Análise de capacidade e ocupação',
        'Projeção de custos mensais e anuais',
        'Relatórios de dimensionamento'
      ],
      howToUse: [
        '1. Acesse "Service Desk" no menu',
        '2. Informe o volume de chamadas esperado',
        '3. Defina o tempo médio de atendimento (TMA)',
        '4. Configure o nível de serviço desejado (ex: 80% em 20s)',
        '5. Selecione o horário de atendimento',
        '6. Informe o custo por atendente',
        '7. Revise o dimensionamento calculado',
        '8. Ajuste parâmetros se necessário',
        '9. Gere a escala de trabalho',
        '10. Salve como orçamento'
      ],
      tips: [
        'Use dados históricos para estimar volume de chamadas',
        'Considere sazonalidade no dimensionamento',
        'Adicione margem de segurança (10-15%) para picos',
        'Revise o TMA periodicamente',
        'Monitore a taxa de ocupação (ideal: 70-85%)'
      ]
    }
  },
  {
    id: 'printer-outsourcing',
    title: 'Outsourcing de Impressoras',
    icon: <Printer className="h-5 w-5" />,
    category: 'Calculadoras',
    description: 'Precificação de serviços de outsourcing de impressão',
    content: {
      overview: 'Módulo para calcular custos e preços de serviços de outsourcing de impressoras, incluindo equipamentos, suprimentos, manutenção e gestão.',
      features: [
        'Cadastro de parque de impressoras',
        'Cálculo de volume de impressão',
        'Custos de equipamentos e suprimentos',
        'Manutenção preventiva e corretiva',
        'Gestão de contratos',
        'Análise de economia',
        'Relatórios de consumo'
      ],
      howToUse: [
        '1. Acesse "Outsourcing de Impressoras"',
        '2. Cadastre o parque atual de impressoras',
        '3. Informe volumes de impressão (P&B e Color)',
        '4. Configure custos de equipamentos',
        '5. Defina custos de suprimentos',
        '6. Adicione custos de manutenção',
        '7. Calcule o valor mensal',
        '8. Compare com custos atuais',
        '9. Gere proposta comercial'
      ],
      tips: [
        'Faça levantamento detalhado do parque atual',
        'Considere crescimento futuro no dimensionamento',
        'Inclua custos de logística e gestão',
        'Ofereça diferentes níveis de SLA',
        'Monitore consumo para ajustes contratuais'
      ]
    }
  },
  {
    id: 'it-pricing',
    title: 'Precificação de TI',
    icon: <Calculator className="h-5 w-5" />,
    category: 'Calculadoras',
    description: 'Módulo completo de precificação para produtos e serviços de TI',
    content: {
      overview: 'Sistema abrangente para precificação de hardware, software, serviços e soluções de TI, com múltiplos modelos de negócio (venda, locação, serviços).',
      features: [
        'Precificação de hardware (servidores, storage, rede)',
        'Licenciamento de software',
        'Serviços profissionais',
        'Modelos de venda e locação',
        'Cálculo de margens e impostos',
        'Análise de viabilidade',
        'Comparação de cenários',
        'Geração de propostas'
      ],
      howToUse: [
        '1. Selecione o tipo de solução (hardware, software, serviços)',
        '2. Adicione itens ao carrinho',
        '3. Configure quantidades e especificações',
        '4. Escolha o modelo de negócio',
        '5. Aplique descontos e margens',
        '6. Calcule impostos',
        '7. Revise o preço final',
        '8. Gere a proposta comercial'
      ],
      tips: [
        'Mantenha catálogo de produtos atualizado',
        'Use tabelas de preços de fabricantes',
        'Considere custos de implementação',
        'Ofereça opções de pagamento flexíveis',
        'Inclua garantias e suporte'
      ]
    }
  },
  {
    id: 'proposals',
    title: 'Gestão de Propostas',
    icon: <FileText className="h-5 w-5" />,
    category: 'Comercial',
    description: 'Criação e gestão de propostas comerciais',
    content: {
      overview: 'Sistema completo para criar, editar e gerenciar propostas comerciais com templates personalizáveis, geração de PDF e acompanhamento de status.',
      features: [
        'Templates de propostas customizáveis',
        'Editor visual de propostas',
        'Geração automática de PDF',
        'Controle de versões',
        'Workflow de aprovação',
        'Assinatura digital',
        'Acompanhamento de status',
        'Histórico de alterações'
      ],
      howToUse: [
        '1. Acesse "Propostas" no menu',
        '2. Clique em "Nova Proposta"',
        '3. Selecione um template ou crie do zero',
        '4. Preencha dados do cliente',
        '5. Adicione produtos/serviços',
        '6. Configure condições comerciais',
        '7. Revise e ajuste o conteúdo',
        '8. Gere o PDF',
        '9. Envie para aprovação',
        '10. Acompanhe o status'
      ],
      tips: [
        'Use templates para padronizar propostas',
        'Inclua cases de sucesso relevantes',
        'Personalize para cada cliente',
        'Revise cuidadosamente antes de enviar',
        'Acompanhe prazos de validade'
      ]
    }
  },
  {
    id: 'quotes',
    title: 'Orçamentos',
    icon: <DollarSign className="h-5 w-5" />,
    category: 'Comercial',
    description: 'Gestão de orçamentos e cotações',
    content: {
      overview: 'Módulo para criar, acompanhar e gerenciar orçamentos, com integração automática das calculadoras de precificação.',
      features: [
        'Criação rápida de orçamentos',
        'Importação de calculadoras',
        'Controle de status',
        'Filtros e busca avançada',
        'Anexo de documentos',
        'Histórico de interações',
        'Conversão em proposta',
        'Relatórios de vendas'
      ],
      howToUse: [
        '1. Orçamentos são criados automaticamente ao salvar calculadoras',
        '2. Ou crie manualmente em "Orçamentos" > "Novo"',
        '3. Preencha dados do cliente e projeto',
        '4. Informe valores e condições',
        '5. Anexe documentos se necessário',
        '6. Atualize o status conforme negociação',
        '7. Converta em proposta quando aprovado'
      ],
      tips: [
        'Mantenha status sempre atualizado',
        'Use filtros para organizar pipeline',
        'Anexe cotações de fornecedores',
        'Acompanhe prazos de validade',
        'Analise taxa de conversão'
      ]
    }
  },
  {
    id: 'edital-analysis',
    title: 'Análise de Editais',
    icon: <Brain className="h-5 w-5" />,
    category: 'Licitações',
    description: 'Análise inteligente de editais com IA',
    content: {
      overview: 'Ferramenta com IA para analisar editais de licitação, extrair requisitos, identificar riscos e gerar checklist de conformidade.',
      features: [
        'Upload de editais (PDF, Word)',
        'Análise automática com IA',
        'Extração de requisitos técnicos',
        'Identificação de riscos',
        'Checklist de conformidade',
        'Análise de viabilidade',
        'Sugestões de estratégia',
        'Geração de relatório'
      ],
      howToUse: [
        '1. Acesse "Análise de Editais"',
        '2. Faça upload do edital',
        '3. Aguarde processamento da IA',
        '4. Revise requisitos extraídos',
        '5. Analise riscos identificados',
        '6. Verifique checklist de conformidade',
        '7. Avalie viabilidade',
        '8. Decida participação',
        '9. Gere relatório de análise'
      ],
      tips: [
        'Analise editais assim que publicados',
        'Verifique todos os anexos',
        'Atenção especial a prazos',
        'Identifique requisitos impeditivos',
        'Consulte jurídico quando necessário'
      ]
    }
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: <BarChart className="h-5 w-5" />,
    category: 'Gestão',
    description: 'Visão geral de métricas e indicadores',
    content: {
      overview: 'Dashboard executivo com métricas de vendas, pipeline, performance e indicadores chave do negócio.',
      features: [
        'Métricas de vendas em tempo real',
        'Pipeline de oportunidades',
        'Taxa de conversão',
        'Faturamento mensal/anual',
        'Gráficos interativos',
        'Comparação de períodos',
        'Metas e objetivos',
        'Exportação de relatórios'
      ],
      howToUse: [
        '1. Dashboard é a tela inicial do sistema',
        '2. Visualize métricas principais no topo',
        '3. Analise gráficos de tendência',
        '4. Filtre por período',
        '5. Clique em cards para detalhes',
        '6. Exporte relatórios quando necessário'
      ],
      tips: [
        'Acompanhe diariamente',
        'Configure metas realistas',
        'Analise tendências',
        'Identifique gargalos',
        'Compartilhe com equipe'
      ]
    }
  },
  {
    id: 'partners',
    title: 'Parceiros/Distribuidores',
    icon: <Users className="h-5 w-5" />,
    category: 'Gestão',
    description: 'Cadastro e gestão de parceiros comerciais',
    content: {
      overview: 'Módulo para gerenciar relacionamento com parceiros, distribuidores e fornecedores.',
      features: [
        'Cadastro completo de parceiros',
        'Histórico de transações',
        'Condições comerciais',
        'Tabelas de preços',
        'Descontos e comissões',
        'Documentação',
        'Avaliação de performance',
        'Relatórios de parceria'
      ],
      howToUse: [
        '1. Acesse "Parceiros"',
        '2. Clique em "Novo Parceiro"',
        '3. Preencha dados cadastrais',
        '4. Configure condições comerciais',
        '5. Anexe documentos',
        '6. Defina tabelas de preços',
        '7. Acompanhe transações',
        '8. Avalie performance periodicamente'
      ],
      tips: [
        'Mantenha cadastro atualizado',
        'Revise condições periodicamente',
        'Monitore performance',
        'Cultive bons relacionamentos',
        'Diversifique fornecedores'
      ]
    }
  }
];

export function DocumentationView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', ...Array.from(new Set(documentationSections.map(s => s.category)))];

  const filteredSections = documentationSections.filter(section => {
    const matchesSearch = section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         section.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || section.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BookOpen className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Documentação</h1>
            <p className="text-muted-foreground">Guias completos de todos os módulos do sistema</p>
          </div>
        </div>
        <Button variant="outline" className="flex items-center space-x-2">
          <Download className="h-4 w-4" />
          <span>Baixar PDF Completo</span>
        </Button>
      </div>

      {/* Busca e Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar na documentação..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category === 'all' ? 'Todos' : category}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Módulos */}
      <div className="grid grid-cols-1 gap-6">
        {filteredSections.map(section => (
          <Card key={section.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    {section.icon}
                  </div>
                  <div>
                    <CardTitle className="text-xl">{section.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
                  </div>
                </div>
                <Badge variant="secondary">{section.category}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                  <TabsTrigger value="features">Funcionalidades</TabsTrigger>
                  <TabsTrigger value="howto">Como Usar</TabsTrigger>
                  <TabsTrigger value="tips">Dicas</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="prose prose-sm max-w-none">
                    <p className="text-foreground">{section.content.overview}</p>
                  </div>
                </TabsContent>

                <TabsContent value="features" className="space-y-2">
                  <ul className="space-y-2">
                    {section.content.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <CheckSquare className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </TabsContent>

                <TabsContent value="howto" className="space-y-2">
                  <ol className="space-y-2">
                    {section.content.howToUse.map((step, idx) => (
                      <li key={idx} className="text-sm text-foreground">
                        {step}
                      </li>
                    ))}
                  </ol>
                </TabsContent>

                <TabsContent value="tips" className="space-y-2">
                  <ul className="space-y-2">
                    {section.content.tips.map((tip, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <Zap className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-foreground">{tip}</span>
                      </li>
                    ))}
                  </ul>
                  {section.content.examples && section.content.examples.length > 0 && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-sm mb-2">Exemplos:</h4>
                      <ul className="space-y-1">
                        {section.content.examples.map((example, idx) => (
                          <li key={idx} className="text-sm text-blue-900">• {example}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSections.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum resultado encontrado</h3>
            <p className="text-muted-foreground">
              Tente ajustar os filtros ou termo de busca
            </p>
          </CardContent>
        </Card>
      )}

      {/* Rodapé com Links Úteis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ExternalLink className="h-5 w-5" />
            <span>Links Úteis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start">
              <FileText className="h-4 w-4 mr-2" />
              Manual do Usuário (PDF)
            </Button>
            <Button variant="outline" className="justify-start">
              <BookOpen className="h-4 w-4 mr-2" />
              Tutoriais em Vídeo
            </Button>
            <Button variant="outline" className="justify-start">
              <Users className="h-4 w-4 mr-2" />
              Suporte Técnico
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
