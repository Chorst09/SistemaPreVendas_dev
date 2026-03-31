'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Activity, Download, Save, Calculator, TrendingUp, TrendingDown } from 'lucide-react';
import { NOCPricingData, NOCTabValidationStatus } from '@/lib/types/noc-pricing';
import { NOCDataManager } from '@/lib/services/noc-data-manager';
import { NOCValidationEngine } from '@/lib/services/noc-validation-engine';
import { NOCCalculationEngine } from '@/lib/services/noc-calculation-engine';
import type { NOCPDFExportPayload } from '@/lib/services/noc-pdf-generator';

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
import { QuoteStatus } from '@/lib/types/enums';
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
const toFiniteNumber = (value: unknown): number => {
  const numericValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
};
const isValidNumericValue = (value: unknown): boolean => {
  const numericValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numericValue);
};
const formatCurrencyValue = (value: unknown) =>
  toFiniteNumber(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
const formatPercentageValue = (value: unknown) => toFiniteNumber(value).toFixed(1);
const formatDateTimeValue = (value: Date) =>
  value.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
const formatSignedCurrencyValue = (value: number) => {
  const absoluteValue = Math.abs(toFiniteNumber(value));
  const formatted = absoluteValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  return value < 0 ? `- ${formatted}` : formatted;
};

const NOC_CALCULATION_REQUIRED_TAB_IDS = [
  'project',
  'devices',
  'monitoring',
  'sla',
  'team',
  'costs',
  'taxes',
  'variables',
] as const;

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
  const [isGeneratingCalculations, setIsGeneratingCalculations] = useState(false);
  const [lastCalculationAt, setLastCalculationAt] = useState<Date | null>(null);

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
        const hasValidMetrics =
          isValidNumericValue(loadedData.calculations?.roi) &&
          isValidNumericValue(loadedData.calculations?.profitability);
        const normalizedData = hasValidMetrics
          ? loadedData
          : {
              ...loadedData,
              calculations: NOCCalculationEngine.calculateAll(loadedData),
            };

        setData(normalizedData);
        if (!hasValidMetrics) {
          await dataManager.persistData(normalizedData);
        }

        // Valida todas as abas
        const validations: Record<string, NOCTabValidationStatus> = {};
        NOC_TABS.forEach(tab => {
          const tabData = dataManager.getTabData(normalizedData, tab.id);
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

  // Exporta dados em JSON (backup técnico)
  const handleExportJSON = useCallback(() => {
    const json = dataManager.exportToJSON(data);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `noc-pricing-${data.project.projectName || 'projeto'}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data, dataManager]);

  const resolveDataForPDF = useCallback(async () => {
    const dataForExport = data.calculations
      ? data
      : {
          ...data,
          calculations: NOCCalculationEngine.calculateAll(data),
        };

    if (!data.calculations) {
      setData(dataForExport);
      await dataManager.persistData(dataForExport);
    }

    return dataForExport;
  }, [data, dataManager]);

  const handleGenerateCalculations = useCallback(async () => {
    try {
      setIsGeneratingCalculations(true);
      const recalculated = NOCCalculationEngine.calculateAll(data);
      const updatedData = {
        ...data,
        calculations: recalculated,
      };

      setData(updatedData);
      setLastCalculationAt(new Date());
      await dataManager.persistData(updatedData);

      const tabsWithErrors: string[] = [];
      const tabsPendingCompletion: string[] = [];

      NOC_CALCULATION_REQUIRED_TAB_IDS.forEach((tabId) => {
        const currentTabStatus = validationStatus[tabId];
        const tabLabel = NOC_TABS.find((tab) => tab.id === tabId)?.label ?? tabId;
        if (!currentTabStatus) {
          tabsPendingCompletion.push(tabLabel);
          return;
        }
        if (currentTabStatus.errors.length > 0) {
          tabsWithErrors.push(tabLabel);
          return;
        }
        if (!currentTabStatus.isComplete) {
          tabsPendingCompletion.push(tabLabel);
        }
      });

      if (tabsWithErrors.length > 0) {
        toast({
          title: 'Cálculo gerado com pendências críticas',
          description: `Revise as abas: ${tabsWithErrors.join(', ')}.`,
          variant: 'destructive',
        });
        return;
      }

      if (tabsPendingCompletion.length > 0) {
        toast({
          title: 'Cálculo gerado',
          description: `Ainda há campos para completar: ${tabsPendingCompletion.join(', ')}.`,
          variant: 'default',
        });
        return;
      }

      toast({
        title: 'Cálculo gerado com sucesso',
        description: 'Resultados e DRE atualizados com os dados atuais do projeto.',
        variant: 'default',
      });
    } catch (error) {
      console.error('NOCPricingSystem.handleGenerateCalculations - Error:', error);
      toast({
        title: 'Erro ao gerar cálculo',
        description: 'Não foi possível recalcular os resultados. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingCalculations(false);
    }
  }, [data, dataManager, toast, validationStatus]);

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
            status: QuoteStatus.PENDING,
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

  const handleGenerateBudget = useCallback(async () => {
    try {
      if (!data.calculations) {
        toast({
          title: 'Dados incompletos',
          description: 'Preencha todas as abas antes de gerar o orçamento.',
          variant: 'destructive'
        });
        return;
      }

      const mappedClientData: ClientData = proposalClientData
        ? mapProposalClientDataToLegacyClientData(proposalClientData)
        : {
            razaoSocial: data.project.clientName || 'Cliente não informado',
            nomeContato: data.project.clientName || 'Contato não informado',
            telefoneCliente: '',
            emailCliente: '',
            nomeProjeto: data.project.projectName || 'Projeto NOC',
            nomeGerente: '',
            telefoneGerente: '',
            emailGerente: '',
          };

      const contractMonths = Math.max(data.project.contractDuration || 12, 1);
      const monthlyCosts = roundCurrency(data.calculations.monthlyTotalCost ?? 0);
      const computedMonthlyPrice = roundCurrency(Math.max(data.calculations.finalMonthlyPrice ?? 0, monthlyCosts));
      const totalProjectValue = roundCurrency(computedMonthlyPrice * contractMonths);

      let generatedQuotes = createQuotesForNOCContracts({
        data,
        monthlyPrice: computedMonthlyPrice,
        clientData: mappedClientData,
        createQuoteFromPricingData
      });

      if (generatedQuotes.length === 0) {
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
      }

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
            status: QuoteStatus.PENDING,
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

      toast({
        title: 'Orçamento gerado!',
        description: 'O orçamento NOC foi salvo em Orçamentos.',
        variant: 'default'
      });

      if (onNavigateToQuotes) {
        setTimeout(() => onNavigateToQuotes(), 1200);
      }
    } catch (error) {
      console.error('NOCPricingSystem.handleGenerateBudget - Erro ao gerar orçamento:', error);
      toast({
        title: 'Erro ao gerar orçamento',
        description: 'Não foi possível gerar o orçamento. Tente novamente.',
        variant: 'destructive'
      });
      throw error;
    }
  }, [toast, proposalClientData, data, createQuoteFromPricingData, onNavigateToQuotes]);

  // Exporta PDF
  const handleExportPDF = useCallback(async (payload?: NOCPDFExportPayload) => {
    try {
      const dataForExport = await resolveDataForPDF();

      const { NOCPDFGenerator } = await import('@/lib/services/noc-pdf-generator');
      const pdfGenerator = new NOCPDFGenerator();
      await pdfGenerator.downloadPDF(dataForExport, payload);

      toast({
        title: 'PDF exportado com sucesso',
        description: 'A proposta final NOC com DRE foi baixada.',
        variant: 'default'
      });
    } catch (error) {
      console.error('NOCPricingSystem.handleExportPDF - Erro ao exportar PDF:', error);
      toast({
        title: 'Erro ao exportar PDF',
        description: 'Não foi possível gerar o PDF da proposta NOC.',
        variant: 'destructive'
      });
    }
  }, [resolveDataForPDF, toast]);

  const handlePreviewPDF = useCallback(async (payload?: NOCPDFExportPayload) => {
    try {
      const dataForExport = await resolveDataForPDF();
      const { NOCPDFGenerator } = await import('@/lib/services/noc-pdf-generator');
      const pdfGenerator = new NOCPDFGenerator();
      const blob = await pdfGenerator.generate(dataForExport, payload);
      const previewUrl = URL.createObjectURL(blob);
      const previewWindow = window.open(previewUrl, '_blank', 'noopener,noreferrer');

      if (!previewWindow) {
        URL.revokeObjectURL(previewUrl);
        await pdfGenerator.downloadPDF(dataForExport, payload);
        toast({
          title: 'Pop-up bloqueado',
          description: 'O PDF foi baixado automaticamente.',
          variant: 'default'
        });
        return;
      }

      previewWindow.focus();
      setTimeout(() => URL.revokeObjectURL(previewUrl), 120000);

      toast({
        title: 'Pré-visualização aberta',
        description: 'Confira o DRE e os detalhes da proposta no PDF.',
        variant: 'default'
      });
    } catch (error) {
      console.error('NOCPricingSystem.handlePreviewPDF - Erro ao visualizar PDF:', error);
      toast({
        title: 'Erro ao visualizar PDF',
        description: 'Não foi possível abrir a pré-visualização do PDF.',
        variant: 'destructive'
      });
    }
  }, [resolveDataForPDF, toast]);

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
        return 'border-destructive/40 bg-destructive/10 text-destructive';
      case 'warning':
        return 'border-yellow-500/40 bg-yellow-500/10 text-yellow-700 dark:text-yellow-200';
      case 'success':
        return 'border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-200';
      default:
        return 'border-border/70 bg-card/70 text-foreground';
    }
  };

  const getCompetitivenessBadgeClass = (competitiveness: string) => {
    switch (competitiveness) {
      case 'competitive':
        return 'border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-200';
      case 'low':
        return 'border-yellow-500/40 bg-yellow-500/10 text-yellow-700 dark:text-yellow-200';
      case 'high':
        return 'border-destructive/40 bg-destructive/10 text-destructive';
      default:
        return 'border-border/70 bg-card/70 text-foreground';
    }
  };

  const calculationReadiness = useMemo(() => {
    const tabsWithErrors: string[] = [];
    const tabsPendingCompletion: string[] = [];

    NOC_CALCULATION_REQUIRED_TAB_IDS.forEach((tabId) => {
      const currentTabStatus = validationStatus[tabId];
      const tabLabel = NOC_TABS.find((tab) => tab.id === tabId)?.label ?? tabId;

      if (!currentTabStatus) {
        tabsPendingCompletion.push(tabLabel);
        return;
      }

      if (currentTabStatus.errors.length > 0) {
        tabsWithErrors.push(tabLabel);
        return;
      }

      if (!currentTabStatus.isComplete) {
        tabsPendingCompletion.push(tabLabel);
      }
    });

    const totalTabs = NOC_CALCULATION_REQUIRED_TAB_IDS.length;
    const completedTabs = totalTabs - tabsWithErrors.length - tabsPendingCompletion.length;

    return {
      tabsWithErrors,
      tabsPendingCompletion,
      completedTabs,
      totalTabs,
      isReady: tabsWithErrors.length === 0 && tabsPendingCompletion.length === 0,
    };
  }, [validationStatus]);

  const dreSummary = useMemo(() => {
    if (!data.calculations) return null;

    const calculations = data.calculations;
    const monthlyTaxAmount = calculations.finalMonthlyPrice - calculations.priceWithMargin;
    const monthlyNetRevenue = calculations.finalMonthlyPrice - monthlyTaxAmount;
    const monthlyContributionMargin = monthlyNetRevenue - calculations.monthlyTotalCost;
    const monthlyRiskProvision = calculations.monthlyTotalCost * (toFiniteNumber(data.variables.riskMargin) / 100);
    const monthlyOperatingResult = monthlyContributionMargin - monthlyRiskProvision;
    const monthlyOperatingMargin = monthlyNetRevenue > 0
      ? (monthlyOperatingResult / monthlyNetRevenue) * 100
      : 0;
    const contractMonths = Math.max(toFiniteNumber(data.project.contractDuration), 1);

    const rows = [
      {
        label: 'Receita Bruta de Serviços',
        monthly: calculations.finalMonthlyPrice,
        annual: calculations.finalMonthlyPrice * 12,
        emphasized: false,
      },
      {
        label: '(-) Impostos sobre Receita',
        monthly: -monthlyTaxAmount,
        annual: -(monthlyTaxAmount * 12),
        emphasized: false,
      },
      {
        label: 'Receita Líquida',
        monthly: monthlyNetRevenue,
        annual: monthlyNetRevenue * 12,
        emphasized: true,
      },
      {
        label: '(-) Custos Operacionais Totais',
        monthly: -calculations.monthlyTotalCost,
        annual: -(calculations.monthlyTotalCost * 12),
        emphasized: false,
      },
      {
        label: 'Margem de Contribuição',
        monthly: monthlyContributionMargin,
        annual: monthlyContributionMargin * 12,
        emphasized: true,
      },
      {
        label: '(-) Provisão de Risco',
        monthly: -monthlyRiskProvision,
        annual: -(monthlyRiskProvision * 12),
        emphasized: false,
      },
      {
        label: 'Resultado Operacional (Lucro)',
        monthly: monthlyOperatingResult,
        annual: monthlyOperatingResult * 12,
        emphasized: true,
      },
    ];

    return {
      rows,
      contractMonths,
      monthlyOperatingMargin,
      contractResult: monthlyOperatingResult * contractMonths,
    };
  }, [data.calculations, data.project.contractDuration, data.variables.riskMargin]);

  const calculationInsights = useMemo(() => {
    if (!data.calculations) return [];

    const insights: string[] = [];
    const calculations = data.calculations;

    if (calculations.profitability < 15) {
      insights.push('Rentabilidade abaixo de 15%: avalie margem de lucro e composição de custos.');
    } else if (calculations.profitability > 35) {
      insights.push('Rentabilidade elevada: valide aderência ao mercado para não perder competitividade.');
    }

    if (calculations.paybackMonths > 18) {
      insights.push('Payback acima de 18 meses: revise custos fixos e escopo de cobertura.');
    }

    if (calculations.competitiveness === 'high') {
      insights.push('Preço acima da média de mercado: destaque diferenciais de SLA e capacidade técnica.');
    }

    if (calculations.competitiveness === 'low') {
      insights.push('Preço abaixo do mercado: confirme se todos os custos e riscos foram considerados.');
    }

    if (data.totalDevices > 0 && data.teamSize > 0) {
      const devicesPerAnalyst = data.totalDevices / data.teamSize;
      insights.push(`Produtividade atual: ${devicesPerAnalyst.toFixed(1)} dispositivos por profissional.`);
    }

    return insights.slice(0, 4);
  }, [data.calculations, data.totalDevices, data.teamSize]);

  if (!isMounted) {
    return (
      <div className="noc-theme w-full max-w-7xl mx-auto p-6 flex items-center justify-center min-h-screen rounded-2xl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="noc-theme w-full max-w-7xl mx-auto p-6 space-y-6 rounded-2xl">
      <Card className="card-surface border-border/70 bg-card/95 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Activity className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold">Sistema de Precificação NOC</h1>
                <p className="text-sm text-slate-600 dark:text-slate-300 font-normal">
                  Network Operations Center - Monitoramento e Gestão de Infraestrutura
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center justify-end gap-2">
              {onBack && (
                <Button
                  variant="outline"
                  onClick={onBack}
                  className="flex items-center space-x-2 border-border/80 bg-card/80 hover:bg-card"
                >
                  <span>← Voltar</span>
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center space-x-2 border-border/80 bg-card/80 hover:bg-card"
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
                onClick={() => { void handlePreviewPDF(); }}
                className="flex items-center space-x-2 border-blue-500/40 bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 dark:text-blue-200"
              >
                <Download className="h-4 w-4" />
                <span>Visualizar PDF</span>
              </Button>

              <Button
                variant="outline"
                onClick={handleExportJSON}
                className="flex items-center space-x-2 border-border/80 bg-card/80 hover:bg-card"
              >
                <span>Exportar JSON</span>
              </Button>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5 lg:grid-cols-10 gap-2 h-auto bg-white/90 dark:bg-card/80 border border-slate-300/80 dark:border-border/60 p-2 rounded-xl shadow-sm">
              {NOC_TABS.map(tab => {
                const status = getTabStatus(tab.id);
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="flex flex-col items-center space-y-1 p-2 border border-transparent data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-700 dark:data-[state=active]:bg-blue-500 dark:data-[state=active]:border-blue-300/50"
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
                  onGenerateBudget={handleGenerateBudget}
                  onPreviewPDF={handlePreviewPDF}
                  onExportPDF={handleExportPDF}
                />
              </TabsContent>

              <TabsContent value="calculations">
                <div className="p-6 border rounded-lg space-y-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Cálculos e Resultados</h3>
                      <p className="text-sm text-muted-foreground">
                        Consolide os dados financeiros e gere o DRE da proposta NOC.
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:items-end">
                      <Button
                        onClick={handleGenerateCalculations}
                        disabled={isGeneratingCalculations || isLoading}
                        className="flex items-center gap-2"
                      >
                        {isGeneratingCalculations ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Gerando cálculo...</span>
                          </>
                        ) : (
                          <>
                            <Calculator className="h-4 w-4" />
                            <span>Gerar Cálculo</span>
                          </>
                        )}
                      </Button>
                      {lastCalculationAt && (
                        <p className="text-xs text-muted-foreground">
                          Último cálculo: {formatDateTimeValue(lastCalculationAt)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={calculationReadiness.isReady
                        ? 'border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-200'
                        : 'border-yellow-500/40 bg-yellow-500/10 text-yellow-700 dark:text-yellow-200'}
                    >
                      {calculationReadiness.isReady ? 'Dados prontos para cálculo' : 'Dados com pendências'}
                    </Badge>
                    <Badge variant="outline">
                      Abas concluídas: {calculationReadiness.completedTabs}/{calculationReadiness.totalTabs}
                    </Badge>
                    {calculationReadiness.tabsWithErrors.length > 0 && (
                      <Badge variant="outline" className="border-destructive/40 bg-destructive/10 text-destructive">
                        {calculationReadiness.tabsWithErrors.length} com erro
                      </Badge>
                    )}
                    {calculationReadiness.tabsPendingCompletion.length > 0 && (
                      <Badge variant="outline" className="border-yellow-500/40 bg-yellow-500/10 text-yellow-700 dark:text-yellow-200">
                        {calculationReadiness.tabsPendingCompletion.length} pendentes
                      </Badge>
                    )}
                  </div>

                  {calculationReadiness.tabsWithErrors.length > 0 && (
                    <p className="text-sm text-destructive">
                      Corrigir antes do cálculo final: {calculationReadiness.tabsWithErrors.join(', ')}.
                    </p>
                  )}

                  {calculationReadiness.tabsPendingCompletion.length > 0 && (
                    <p className="text-sm text-yellow-700 dark:text-yellow-200">
                      Abas com preenchimento parcial: {calculationReadiness.tabsPendingCompletion.join(', ')}.
                    </p>
                  )}

                  {data.calculations ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Custo Mensal Total</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-2xl font-bold">
                              {data.project.currency} {formatCurrencyValue(data.calculations.monthlyTotalCost)}
                            </p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Preço Final Mensal</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-2xl font-bold text-blue-600">
                              {data.project.currency} {formatCurrencyValue(data.calculations.finalMonthlyPrice)}
                            </p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Custo por Dispositivo</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-2xl font-bold">
                              {data.project.currency} {formatCurrencyValue(data.calculations.costPerDevice)}
                            </p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Rentabilidade</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-2xl font-bold">
                              {formatPercentageValue(data.calculations.profitability)}%
                            </p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">ROI</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-2xl font-bold">
                              {formatPercentageValue(data.calculations.roi)}%
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

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Payback</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-2xl font-bold">
                              {toFiniteNumber(data.calculations.paybackMonths).toLocaleString('pt-BR', {
                                minimumFractionDigits: 1,
                                maximumFractionDigits: 1,
                              })} meses
                            </p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Preço Final Anual</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-2xl font-bold text-blue-600">
                              {data.project.currency} {formatCurrencyValue(data.calculations.finalAnnualPrice)}
                            </p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Resultado no Contrato</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className={`text-2xl font-bold ${(dreSummary?.contractResult ?? 0) < 0 ? 'text-destructive' : 'text-green-600'}`}>
                              {data.project.currency} {formatSignedCurrencyValue(dreSummary?.contractResult ?? 0)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              Baseado em {Math.max(toFiniteNumber(data.project.contractDuration), 1)} meses
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Composição de Custos Mensais</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {[
                            { label: 'Equipe', value: data.calculations.monthlyTeamCost },
                            { label: 'Infraestrutura', value: data.calculations.monthlyInfrastructureCost },
                            { label: 'Licenças', value: data.calculations.monthlyLicenseCost },
                            { label: 'Operacional', value: data.calculations.monthlyOperationalCost },
                          ].map((row) => {
                            const weight = data.calculations && data.calculations.monthlyTotalCost > 0
                              ? (row.value / data.calculations.monthlyTotalCost) * 100
                              : 0;

                            return (
                              <div key={row.label} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                  <span>{row.label}</span>
                                  <span className="font-medium">
                                    {data.project.currency} {formatCurrencyValue(row.value)} ({formatPercentageValue(weight)}%)
                                  </span>
                                </div>
                                <div className="h-2 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-blue-500/80"
                                    style={{ width: `${Math.min(Math.max(weight, 0), 100)}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </CardContent>
                      </Card>

                      {calculationInsights.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Insights Automáticos</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            {calculationInsights.map((insight, index) => (
                              <div
                                key={`${insight}-${index}`}
                                className="flex items-start gap-2 rounded-md border border-border/60 p-3"
                              >
                                {insight.includes('abaixo') || insight.includes('acima') ? (
                                  <TrendingDown className="mt-0.5 h-4 w-4 text-yellow-600" />
                                ) : (
                                  <TrendingUp className="mt-0.5 h-4 w-4 text-green-600" />
                                )}
                                <p className="text-sm text-muted-foreground">{insight}</p>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )}

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">DRE (Demonstrativo de Resultado)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="overflow-x-auto">
                            <table className="w-full min-w-[620px] text-sm">
                              <thead>
                                <tr className="border-b border-border/70">
                                  <th className="py-2 text-left font-semibold">Linha</th>
                                  <th className="py-2 text-right font-semibold">Mensal</th>
                                  <th className="py-2 text-right font-semibold">Anual</th>
                                </tr>
                              </thead>
                              <tbody>
                                {dreSummary?.rows.map((row) => (
                                  <tr key={row.label} className={`border-b border-border/50 ${row.emphasized ? 'bg-blue-500/5' : ''}`}>
                                    <td className="py-2 pr-4">{row.label}</td>
                                    <td className={`py-2 text-right font-medium ${row.monthly < 0 ? 'text-destructive' : ''}`}>
                                      {data.project.currency} {formatSignedCurrencyValue(row.monthly)}
                                    </td>
                                    <td className={`py-2 text-right font-medium ${row.annual < 0 ? 'text-destructive' : ''}`}>
                                      {data.project.currency} {formatSignedCurrencyValue(row.annual)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="rounded-lg border border-border/70 p-4">
                              <p className="text-xs text-muted-foreground mb-1">Margem Operacional Mensal</p>
                              <p className={`text-2xl font-bold ${(dreSummary?.monthlyOperatingMargin ?? 0) < 0 ? 'text-destructive' : 'text-green-600'}`}>
                                {formatPercentageValue(dreSummary?.monthlyOperatingMargin ?? 0)}%
                              </p>
                            </div>
                            <div className="rounded-lg border border-border/70 p-4">
                              <p className="text-xs text-muted-foreground mb-1">Lucro no Período Contratado</p>
                              <p className={`text-2xl font-bold ${(dreSummary?.contractResult ?? 0) < 0 ? 'text-destructive' : 'text-green-600'}`}>
                                {data.project.currency} {formatSignedCurrencyValue(dreSummary?.contractResult ?? 0)}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Projeção para {dreSummary?.contractMonths ?? Math.max(toFiniteNumber(data.project.contractDuration), 1)} meses
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <p className="text-muted-foreground">
                      Preencha as abas anteriores e clique em <strong>Gerar Cálculo</strong> para visualizar resultados e DRE.
                    </p>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
