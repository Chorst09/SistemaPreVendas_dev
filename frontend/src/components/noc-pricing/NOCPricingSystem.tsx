'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Activity, Download, Save } from 'lucide-react';
import { NOCPricingData, NOCTabValidationStatus } from '@/lib/types/noc-pricing';
import { NOCDataManager } from '@/lib/services/noc-data-manager';
import { NOCValidationEngine } from '@/lib/services/noc-validation-engine';
import { NOCCalculationEngine } from '@/lib/services/noc-calculation-engine';

// Import tabs
import { ProjectTab } from './tabs/ProjectTab';
import { DevicesTab } from './tabs/DevicesTab';
import { MonitoringTab } from './tabs/MonitoringTab';
import { SLATab } from './tabs/SLATab';
import { TeamTab } from './tabs/TeamTab';
import { CostsTab } from './tabs/CostsTab';
import { TaxesTab } from './tabs/TaxesTab';
import { VariablesTab } from './tabs/VariablesTab';
import { ReportTab } from './tabs/ReportTab';
import type { ProposalClientData } from '@/components/shared/ProposalClientDataForm';
import { mapProposalClientDataToLegacyClientData } from '@/components/shared/proposalClientDataMapper';
import type { ClientData } from '@/components/calculators/ProposalClientForm';

// Import services
import { UnifiedProposalService } from '@/lib/services/unified-proposal-service';
import { Quote } from '@/lib/types/base';
import { useToast } from '@/hooks/use-toast';
import { usePricingIntegration } from '@/hooks/use-pricing-integration';

// Tabs do sistema NOC
const NOC_TABS = [
  { id: 'project', label: 'Projeto', description: 'Dados básicos do projeto NOC' },
  { id: 'devices', label: 'Dispositivos', description: 'Dispositivos e infraestrutura monitorada' },
  { id: 'monitoring', label: 'Monitoramento', description: 'Configuração de ferramentas e alertas' },
  { id: 'sla', label: 'SLA', description: 'Acordo de nível de serviço' },
  { id: 'team', label: 'Equipe', description: 'Equipe NOC e turnos' },
  { id: 'costs', label: 'Custos', description: 'Custos operacionais' },
  { id: 'taxes', label: 'Impostos', description: 'Impostos e encargos' },
  { id: 'variables', label: 'Variáveis', description: 'Margens e variáveis econômicas' },
  { id: 'calculations', label: 'Cálculos', description: 'Resultados e análises' },
  { id: 'report', label: 'Relatório', description: 'Relatório final' }
];

const NOC_CONTRACT_DURATION_OPTIONS = [12, 24, 36, 48, 60] as const;

const roundCurrency = (value: number) => Math.round(value * 100) / 100;

type CreateQuoteFn = ReturnType<typeof usePricingIntegration>['createQuoteFromPricingData'];

interface CreateNOCQuotesParams {
  data: NOCPricingData;
  monthlyPrice: number;
  clientData: ClientData;
  createQuoteFromPricingData: CreateQuoteFn;
}

function buildNOCQuoteBasicSpecs(data: NOCPricingData) {
  const calculations = data.calculations;
  return {
    monthlyCost: roundCurrency(calculations?.monthlyTotalCost ?? 0),
    monthlyTeamCost: roundCurrency(calculations?.monthlyTeamCost ?? 0),
    monthlyInfrastructureCost: roundCurrency(calculations?.monthlyInfrastructureCost ?? 0),
    monthlyLicenseCost: roundCurrency(calculations?.monthlyLicenseCost ?? 0),
    monthlyOperationalCost: roundCurrency(calculations?.monthlyOperationalCost ?? 0),
    totalDevices: data.totalDevices,
    totalMetrics: data.totalMetrics,
    estimatedAlertsPerMonth: data.estimatedAlertsPerMonth,
    sla: data.sla,
    coverage: data.project.coverage,
    serviceLevel: data.project.serviceLevel,
    taxes: data.taxes,
    variables: data.variables,
    teamSize: data.teamSize,
    monitoringTools: data.monitoring.tools,
    monitoringAi: data.monitoring.aiEnabled,
  };
}

function createQuotesForNOCContracts({
  data,
  monthlyPrice,
  clientData,
  createQuoteFromPricingData
}: CreateNOCQuotesParams): Quote[] {
  if (!monthlyPrice || monthlyPrice <= 0) return [];

  const specs = buildNOCQuoteBasicSpecs(data);
  const quotes: Quote[] = [];

  for (const duration of NOC_CONTRACT_DURATION_OPTIONS) {
    try {
      const totalPrice = roundCurrency(monthlyPrice * duration);
      const quote = createQuoteFromPricingData({
        name: `NOC - ${duration} meses`,
        clientName: clientData.razaoSocial || data.project.clientName || 'Cliente NOC',
        totalPrice,
        module: 'NOC',
        technicalSpecs: {
          ...specs,
          monthlyPrice,
          annualPrice: roundCurrency(monthlyPrice * 12),
          contractDurationMonths: duration,
          contractDurationLabel: `${duration} meses`,
          contractStartDate: data.project.startDate,
        },
        clientData,
      });

      quotes.push(quote);
    } catch (error) {
      console.error(`NOCPricingSystem - Falha ao gerar orçamento NOC (${duration} meses):`, error);
    }
  }

  return quotes;
}

interface NOCPricingSystemProps {
  onBack?: () => void;
  proposalClientData?: ProposalClientData | null;
  onNavigateToQuotes?: () => void;
}

export function NOCPricingSystem({ onBack, proposalClientData, onNavigateToQuotes }: NOCPricingSystemProps = {}) {
  const [isMounted, setIsMounted] = useState(false);
  const [data, setData] = useState<NOCPricingData>(NOCDataManager.createEmptyData());
  const [validationStatus, setValidationStatus] = useState<Record<string, NOCTabValidationStatus>>({});
  const [activeTab, setActiveTab] = useState('project');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const dataManager = useMemo(() => new NOCDataManager(), []);
  const validationEngine = useMemo(() => new NOCValidationEngine(), []);
  const { toast } = useToast();
  const { createQuoteFromPricingData } = usePricingIntegration();

  // Previne erros de SSR
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Carrega dados iniciais
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const loadedData = await dataManager.loadData();
        setData(loadedData);

        // Valida todas as abas
        const validations: Record<string, NOCTabValidationStatus> = {};
        NOC_TABS.forEach(tab => {
          const tabData = dataManager.getTabData(loadedData, tab.id);
          validations[tab.id] = validationEngine.validateTabData(tab.id, tabData);
        });
        setValidationStatus(validations);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isMounted) {
      loadData();
    }
  }, [isMounted, dataManager, validationEngine]);

  // Atualiza dados de uma aba
  const handleDataUpdate = useCallback(async (tabId: string, tabData: any) => {
    try {
      setIsLoading(true);

      // Atualiza dados
      const updatedData = dataManager.updateTabData(data, tabId, tabData);
      
      // Recalcula se necessário
      if (tabId !== 'calculations' && tabId !== 'report') {
        updatedData.calculations = NOCCalculationEngine.calculateAll(updatedData);
      }
      
      setData(updatedData);

      // Valida
      const validation = validationEngine.validateTabData(tabId, tabData);
      setValidationStatus(prev => ({
        ...prev,
        [tabId]: validation
      }));

      // Persiste
      await dataManager.persistData(updatedData);
    } catch (error) {
      console.error('Error updating data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [data, dataManager, validationEngine]);

  // Salva manualmente
  const handleSave = useCallback(async () => {
    try {
      setIsSaving(true);
      await dataManager.persistData(data);
      await dataManager.createBackup(data);
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setIsSaving(false);
    }
  }, [data, dataManager]);

  // Exporta dados
  const handleExport = useCallback(() => {
    const json = dataManager.exportToJSON(data);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `noc-pricing-${data.project.projectName || 'projeto'}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data, dataManager]);

  // Salva como proposta
  const handleSaveProposal = useCallback(async (proposalData: any) => {
    try {
      console.log('NOCPricingSystem.handleSaveProposal - Iniciando...', proposalData);
      
      const mappedClientData: ClientData = proposalClientData
        ? mapProposalClientDataToLegacyClientData(proposalClientData)
        : {
            razaoSocial: data.project.clientName || 'Cliente não informado',
            nomeContato: data.project.clientName || 'Contato não informado',
            telefoneCliente: '',
            emailCliente: '',
            nomeProjeto: data.project.projectName || proposalData.title || 'Projeto NOC',
            nomeGerente: '',
            telefoneGerente: '',
            emailGerente: '',
          };

      const contractMonths = Math.max(data.project.contractDuration || 12, 1);
      const monthlyCosts = roundCurrency(data.calculations?.monthlyTotalCost ?? 0);
      const computedMonthlyPrice = roundCurrency(Math.max(data.calculations?.finalMonthlyPrice ?? 0, monthlyCosts));
      const totalProjectValue = roundCurrency(computedMonthlyPrice * contractMonths);

      let proposal: Awaited<ReturnType<typeof UnifiedProposalService.saveNOCProposal>> | null = null;
      let savedInUnifiedProposals = false;
      try {
        proposal = await UnifiedProposalService.saveNOCProposal(proposalData);
        savedInUnifiedProposals = true;
      } catch (proposalError) {
        console.error('NOCPricingSystem - Falha ao salvar em Propostas (unified-proposals):', proposalError);
      }

      let generatedQuotes = createQuotesForNOCContracts({
        data,
        monthlyPrice: computedMonthlyPrice,
        clientData: mappedClientData,
        createQuoteFromPricingData
      });
      if (generatedQuotes.length === 0) {
        try {
          const fallbackQuote = createQuoteFromPricingData({
            name: `NOC - ${contractMonths} meses`,
            clientName: mappedClientData.razaoSocial || data.project.clientName || 'Cliente NOC',
            totalPrice: totalProjectValue,
            module: 'NOC',
            technicalSpecs: {
              monthlyPrice: computedMonthlyPrice,
              contractDurationMonths: contractMonths,
              contractDurationLabel: `${contractMonths} meses`,
            },
            clientData: mappedClientData,
          });
          generatedQuotes = [fallbackQuote];
        } catch (quoteError) {
          console.error('NOCPricingSystem - Falha ao criar orçamento fallback:', quoteError);
        }
      }
      const primaryGeneratedQuote = generatedQuotes[0] || null;

      // Fallback defensivo: garante persistência no storage de orçamentos
      if (typeof window !== 'undefined') {
        try {
          const quotesKey = 'quotes-storage-v1';
          const storedQuotes = localStorage.getItem(quotesKey);
          const parsedQuotes = storedQuotes ? JSON.parse(storedQuotes) : [];
          const quotesArray = Array.isArray(parsedQuotes) ? (parsedQuotes as Quote[]) : [];
          const fallbackQuote: Quote = {
            id: `QUO-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
            client: mappedClientData.razaoSocial || data.project.clientName || 'Cliente não informado',
            projectName: mappedClientData.nomeProjeto || data.project.projectName || 'Projeto NOC',
            accountManager: mappedClientData.nomeGerente || 'Não informado',
            status: 'Pendente',
            total: Number.isFinite(totalProjectValue) ? totalProjectValue : 0,
            monthlyPrice: computedMonthlyPrice,
            contractDurationMonths: contractMonths,
            date: new Date().toISOString(),
            distributorId: 1,
            quotationFile: '',
            pricingFile: `noc-${contractMonths}m-${Date.now()}.json`,
          };
          const quotesToPersist: Quote[] = generatedQuotes.length > 0 ? generatedQuotes : [fallbackQuote];

          quotesToPersist.forEach(quote => {
            const alreadyExists = quotesArray.some((q: Quote) => q.id === quote.id);
            if (!alreadyExists) {
              quotesArray.push(quote);
            }
          });

          localStorage.setItem(quotesKey, JSON.stringify(quotesArray));
        } catch (storageError) {
          console.error('NOCPricingSystem - Erro no fallback de persistência de orçamento:', storageError);
        }
      }
      
      console.log('NOCPricingSystem.handleSaveProposal - Proposta salva:', proposal);

      if (savedInUnifiedProposals && proposal) {
        toast({
          title: 'Proposta NOC Salva!',
          description: `A proposta "${proposal.title}" foi salva em Propostas e Orçamentos.`,
          variant: 'default'
        });
      } else {
        toast({
          title: 'Orçamento salvo em Orçamentos',
          description: 'A proposta NOC não foi persistida em Propostas, mas o orçamento foi salvo.',
          variant: 'default'
        });
      }

      // Navega para Orçamentos após notificação
      console.log('NOCPricingSystem - Finalização do salvamento NOC:', proposal?.id || 'sem-id-proposta');
      if (onNavigateToQuotes) {
        setTimeout(() => onNavigateToQuotes(), 1200);
      }

      return proposal || primaryGeneratedQuote;
    } catch (error) {
      console.error('NOCPricingSystem.handleSaveProposal - Error saving proposal:', error);
      toast({
        title: 'Erro ao Salvar',
        description: 'Não foi possível salvar a proposta. Tente novamente.',
        variant: 'destructive'
      });
      throw error;
    }
  }, [toast, proposalClientData, data, createQuoteFromPricingData, onNavigateToQuotes]);

  // Exporta PDF
  const handleExportPDF = useCallback(() => {
    toast({
      title: 'Exportando PDF',
      description: 'A funcionalidade de exportação PDF será implementada em breve.',
      variant: 'default'
    });
  }, [toast]);

  // Obtém status da aba
  const getTabStatus = (tabId: string) => {
    const status = validationStatus[tabId];
    if (!status) return 'default';
    if (status.errors.length > 0) return 'error';
    if (status.warnings.length > 0) return 'warning';
    if (status.isComplete) return 'success';
    return 'default';
  };

  // Mapeia status para linguagem visual azul (sucesso/alerta/erro)
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'error':
        return 'border-blue-300/40 bg-blue-900/50 text-blue-100';
      case 'warning':
        return 'border-blue-300/35 bg-blue-800/45 text-blue-100';
      case 'success':
        return 'border-cyan-300/40 bg-cyan-900/45 text-cyan-100';
      default:
        return 'border-blue-300/30 bg-slate-900/35 text-slate-200';
    }
  };

  const getCompetitivenessBadgeClass = (competitiveness: string) => {
    switch (competitiveness) {
      case 'competitive':
        return 'border-cyan-300/40 bg-cyan-900/45 text-cyan-100';
      case 'low':
        return 'border-blue-300/35 bg-blue-900/45 text-blue-100';
      case 'high':
        return 'border-blue-300/45 bg-blue-950/65 text-blue-100';
      default:
        return 'border-blue-300/30 bg-slate-900/35 text-slate-200';
    }
  };

  if (!isMounted) {
    return (
      <div className="noc-theme w-full max-w-7xl mx-auto p-6 flex items-center justify-center min-h-screen rounded-2xl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="noc-theme w-full max-w-7xl mx-auto p-6 space-y-6 rounded-2xl">
      <Card className="bg-slate-900/55 border-blue-400/20 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Activity className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold">Sistema de Precificação NOC</h1>
                <p className="text-sm text-gray-400 font-normal">
                  Network Operations Center - Monitoramento e Gestão de Infraestrutura
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {onBack && (
                <Button
                  variant="outline"
                  onClick={onBack}
                  className="flex items-center space-x-2"
                >
                  <span>← Voltar</span>
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center space-x-2"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>Salvar</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={handleExport}
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Exportar</span>
              </Button>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5 lg:grid-cols-10 gap-2 h-auto bg-slate-900/40 border border-blue-400/20 p-2 rounded-xl">
              {NOC_TABS.map(tab => {
                const status = getTabStatus(tab.id);
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="flex flex-col items-center space-y-1 p-2 data-[state=active]:bg-blue-500/25 data-[state=active]:border data-[state=active]:border-blue-300/30"
                  >
                    <span className="text-xs">{tab.label}</span>
                    <Badge variant="outline" className={`text-xs ${getStatusBadgeClass(status)}`}>
                      {status === 'success' ? '✓' : status === 'error' ? '✗' : '○'}
                    </Badge>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* Conteúdo das abas */}
            <div className="mt-6">
              <TabsContent value="project">
                <ProjectTab
                  data={data.project}
                  onChange={(projectData) => handleDataUpdate('project', projectData)}
                />
              </TabsContent>

              <TabsContent value="devices">
                <DevicesTab
                  devices={data.devices}
                  totalDevices={data.totalDevices}
                  totalMetrics={data.totalMetrics}
                  estimatedAlertsPerMonth={data.estimatedAlertsPerMonth}
                  onChange={(devicesData) => handleDataUpdate('devices', devicesData)}
                />
              </TabsContent>

              <TabsContent value="monitoring">
                <MonitoringTab
                  data={data.monitoring}
                  onChange={(monitoringData) => handleDataUpdate('monitoring', monitoringData)}
                />
              </TabsContent>

              <TabsContent value="sla">
                <SLATab
                  data={data.sla}
                  onChange={(slaData) => handleDataUpdate('sla', slaData)}
                />
              </TabsContent>

              <TabsContent value="team">
                <TeamTab
                  team={data.team}
                  teamSize={data.teamSize}
                  coverage={data.project.coverage}
                  serviceLevel={data.project.serviceLevel}
                  deviceCount={data.totalDevices}
                  onChange={(teamData) => handleDataUpdate('team', teamData)}
                />
              </TabsContent>

              <TabsContent value="costs">
                <CostsTab
                  data={data.operationalCosts}
                  onChange={(costsData) => handleDataUpdate('costs', costsData)}
                />
              </TabsContent>

              <TabsContent value="taxes">
                <TaxesTab
                  data={data.taxes}
                  onChange={(taxesData) => handleDataUpdate('taxes', taxesData)}
                />
              </TabsContent>

              <TabsContent value="variables">
                <VariablesTab
                  data={data.variables}
                  onChange={(variablesData) => handleDataUpdate('variables', variablesData)}
                />
              </TabsContent>

              <TabsContent value="report">
                <ReportTab
                  data={data}
                  onSaveProposal={handleSaveProposal}
                  onExportPDF={handleExportPDF}
                />
              </TabsContent>

              <TabsContent value="calculations">
                <div className="p-6 border rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Cálculos e Resultados</h3>
                  {data.calculations ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Custo Mensal Total</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold">
                            {data.project.currency} {data.calculations.monthlyTotalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Preço Final Mensal</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold text-blue-300">
                            {data.project.currency} {data.calculations.finalMonthlyPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Custo por Dispositivo</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold">
                            {data.project.currency} {data.calculations.costPerDevice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Rentabilidade</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold">
                            {data.calculations.profitability.toFixed(1)}%
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">ROI</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold">
                            {data.calculations.roi.toFixed(1)}%
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Competitividade</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Badge
                            variant="outline"
                            className={getCompetitivenessBadgeClass(data.calculations.competitiveness)}
                          >
                            {data.calculations.competitiveness === 'competitive' ? 'Competitivo' :
                             data.calculations.competitiveness === 'low' ? 'Abaixo do Mercado' : 'Acima do Mercado'}
                          </Badge>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <p className="text-gray-500">Preencha os dados para ver os cálculos</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="report">
                <div className="p-6 border rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Relatório Final</h3>
                  <p className="text-gray-500">Componente em desenvolvimento...</p>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
