// @ts-nocheck
'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, BookOpen, BarChart3, Download, X, Users, Save } from 'lucide-react';
import { ServiceDeskData, TabValidationStatus } from '@/lib/types/service-desk-pricing';
import { ServiceDeskDataManager } from '@/lib/services/service-desk-data-manager';
import { ServiceDeskValidationEngine } from '@/lib/services/service-desk-validation-engine';
import { ServiceDeskTemplateService } from '@/lib/services/service-desk-template-service';

// Navigation Components
import { TabNavigation } from './navigation/TabNavigation';
import { ValidationTransition } from './navigation/ValidationTransition';
import { ProgressIndicator } from './navigation/ProgressIndicator';
import { NavigationControls } from './navigation/NavigationControls';
import { Breadcrumbs, createServiceDeskBreadcrumbs } from './navigation/Breadcrumbs';
import { useServiceDeskNavigation } from '@/hooks/use-service-desk-navigation';

// Performance optimizations
import { LazyTabModules, preloadNextTab, preloadCriticalTabs } from '@/lib/utils/lazy-loading';
import { ServiceDeskCalculationCache } from '@/lib/utils/calculation-cache';
import { useDebouncedCalculations, batchCalculationManager } from '@/lib/utils/debounce';

// Template Components
import { TemplateManager } from './templates/TemplateManager';
import { TemplateApplicationDialog } from './templates/TemplateApplicationDialog';
import { 
  ServiceDeskTemplate, 
  TemplateApplication, 
  ConflictResolution 
} from '@/lib/types/service-desk-templates';

// Analytics Components
import { AnalyticsDashboard } from './analytics/AnalyticsDashboard';
import { ServiceDeskAnalyticsService } from '@/lib/services/service-desk-analytics-service';

// Export Components
import { UnifiedExportInterface } from './export/UnifiedExportInterface';

// UX Enhancement Components
import { TabTransition, FormFieldAnimation, AnimatedCard, NotificationAnimation } from './ui/AnimationsAndTransitions';
import { Tooltip, HelpIcon, ContextualHelp, QuickHelpCard } from './ui/TooltipsAndHelp';
import { GuidedTour, TourConfig } from './ui/GuidedTour';
import { basicServiceDeskTour, advancedFeaturesTour, quickTipsTour, TourLauncher } from './ui/ServiceDeskTours';

// Documentation and Help Components
import { DocumentationSystem } from './documentation/DocumentationSystem';
import { IntegratedHelpSystem, QuickHelpButton } from './help/IntegratedHelpSystem';
import { EmployeeRegistryManager } from './employees/EmployeeRegistryManager';
import type { ProposalClientData } from '@/components/shared/ProposalClientDataForm';
import { mapProposalClientDataToLegacyClientData } from '@/components/shared/proposalClientDataMapper';
import { usePricingIntegration } from '@/hooks/use-pricing-integration';

export interface ServiceDeskPricingSystemProps {
  initialData?: ServiceDeskData;
  onDataChange?: (data: ServiceDeskData) => void;
  onBack?: () => void;
  integrationMode?: 'standalone' | 'integrated';
  proposalClientData?: ProposalClientData | null;
  onNavigateToQuotes?: () => void;
}

const TAB_CONFIG = [
  { 
    id: 'data', 
    label: 'Dados', 
    shortLabel: 'Dados',
    description: 'Configuração dos dados básicos do projeto, cliente e período de contrato',
    component: LazyTabModules.DataTab,
    weight: 1
  },
  { 
    id: 'team', 
    label: 'Equipe', 
    shortLabel: 'Equipe',
    description: 'Definição da equipe, cargos, salários e benefícios',
    component: LazyTabModules.TeamTab,
    dependencies: ['data'],
    weight: 2
  },
  { 
    id: 'scale', 
    label: 'Escala', 
    shortLabel: 'Escala',
    description: 'Configuração de horários de atendimento e escalas de trabalho',
    component: LazyTabModules.ScaleTab,
    dependencies: ['team'],
    weight: 2
  },
  { 
    id: 'taxes', 
    label: 'Impostos', 
    shortLabel: 'Impostos',
    description: 'Configuração de impostos e tributação aplicável',
    component: LazyTabModules.TaxesTab,
    dependencies: ['data'],
    weight: 1
  },
  { 
    id: 'variables', 
    label: 'Variáveis', 
    shortLabel: 'Variáveis',
    description: 'Definição de variáveis de mercado e cenários econômicos',
    component: LazyTabModules.VariablesTab,
    dependencies: ['data'],
    weight: 1
  },
  { 
    id: 'other-costs', 
    label: 'Outros Custos', 
    shortLabel: 'Custos',
    description: 'Configuração de custos adicionais e despesas diversas',
    component: LazyTabModules.OtherCostsTab,
    dependencies: ['data'],
    weight: 1
  },
  { 
    id: 'budget', 
    label: 'Orçamento', 
    shortLabel: 'Orçamento',
    description: 'Consolidação de custos e definição de margens',
    component: LazyTabModules.BudgetTab,
    dependencies: ['team', 'taxes', 'other-costs'],
    weight: 2
  },
  { 
    id: 'forecast', 
    label: 'Forecast', 
    shortLabel: 'Forecast',
    description: 'Projeções financeiras e análise de cenários futuros',
    component: LazyTabModules.ForecastTab,
    dependencies: ['budget'],
    weight: 2
  },
  { 
    id: 'result', 
    label: 'Resultado', 
    shortLabel: 'Resultado',
    description: 'Análise de rentabilidade, ROI e indicadores financeiros',
    component: LazyTabModules.ResultTab,
    dependencies: ['forecast'],
    weight: 2
  },
  { 
    id: 'negotiation', 
    label: 'Negociação', 
    shortLabel: 'Negociação',
    description: 'Simulação de cenários de negociação e ajustes comerciais',
    component: LazyTabModules.NegotiationTab,
    dependencies: ['result'],
    weight: 1,
    isOptional: true
  },
  { 
    id: 'final-analysis', 
    label: 'Análise Final', 
    shortLabel: 'Análise',
    description: 'Dashboard executivo e análise final do projeto',
    component: LazyTabModules.FinalAnalysisTab,
    dependencies: ['result'],
    weight: 2
  },
  { 
    id: 'reports', 
    label: 'Relatórios', 
    shortLabel: 'Relatórios',
    description: 'Geração de relatórios personalizados e profissionais',
    component: LazyTabModules.ReportsTab,
    dependencies: ['data'],
    weight: 1,
    isOptional: true
  },
];

export function ServiceDeskPricingSystem({
  initialData,
  onDataChange,
  onBack,
  integrationMode = 'integrated',
  proposalClientData,
  onNavigateToQuotes
}: ServiceDeskPricingSystemProps) {
  // Early return for SSR - prevent localStorage access on server
  const [isMounted, setIsMounted] = useState(false);

  const [data, setData] = useState<ServiceDeskData>(
    initialData || ServiceDeskDataManager.createEmptyData()
  );
  const [validationStatus, setValidationStatus] = useState<Record<string, TabValidationStatus>>({});
  const [isLoading, setIsLoading] = useState(false);
  const isComponentMountedRef = useRef(false);
  const dataRef = useRef<ServiceDeskData>(data);
  const loadingOperationsRef = useRef(0);

  // Template management state
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [showTemplateApplication, setShowTemplateApplication] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ServiceDeskTemplate | null>(null);
  const [templateApplication, setTemplateApplication] = useState<TemplateApplication | null>(null);

  // Analytics state
  const [showAnalyticsDashboard, setShowAnalyticsDashboard] = useState(false);

  // Export state
  const [showExportInterface, setShowExportInterface] = useState(false);

  // UX Enhancement state
  const [showContextualHelp, setShowContextualHelp] = useState(false);
  const [activeTour, setActiveTour] = useState<string | null>(null);
  const [showTourLauncher, setShowTourLauncher] = useState(false);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    isVisible: boolean;
  }>>([]);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);

  // Documentation and Help state
  const [showDocumentation, setShowDocumentation] = useState(false);
  const [showIntegratedHelp, setShowIntegratedHelp] = useState(false);
  const [documentationCategory, setDocumentationCategory] = useState('getting-started');
  const [documentationSearchTerm, setDocumentationSearchTerm] = useState('');
  const [showEmployeeRegistry, setShowEmployeeRegistry] = useState(false);

  const dataManager = useMemo(() => new ServiceDeskDataManager(), []);
  const validationEngine = useMemo(() => new ServiceDeskValidationEngine(), []);
  const calculationCache = useMemo(() => ServiceDeskCalculationCache.getInstance(), []);
  const debouncedCalculations = useDebouncedCalculations();
  const templateService = useMemo(() => new ServiceDeskTemplateService(), []);
  const analyticsService = useMemo(() => new ServiceDeskAnalyticsService(), []);
  const { createQuoteFromPricingData } = usePricingIntegration();

  useEffect(() => {
    isComponentMountedRef.current = true;
    setIsMounted(true);

    return () => {
      isComponentMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const setLoadingSafely = useCallback((value: boolean) => {
    if (!isComponentMountedRef.current) return;
    setIsLoading(value);
  }, []);

  const beginLoadingOperation = useCallback(() => {
    loadingOperationsRef.current += 1;
    setLoadingSafely(true);
  }, [setLoadingSafely]);

  const endLoadingOperation = useCallback(() => {
    loadingOperationsRef.current = Math.max(0, loadingOperationsRef.current - 1);
    if (loadingOperationsRef.current === 0) {
      setLoadingSafely(false);
    }
  }, [setLoadingSafely]);

  const areValuesEqual = useCallback((left: any, right: any) => {
    if (left === right) return true;
    try {
      return JSON.stringify(left) === JSON.stringify(right);
    } catch {
      return false;
    }
  }, []);

  // Enhanced navigation with validation
  const navigation = useServiceDeskNavigation({
    tabs: TAB_CONFIG,
    initialTab: 'data',
    validationStatus,
    data,
    onTabChange: (tabId) => {
      // Additional logic when tab changes
      console.log('Navigated to tab:', tabId);
    },
    onValidationRequired: async (fromTab, toTab) => {
      // Custom validation logic if needed
      return true;
    },
    autoSaveOnNavigation: true,
    userPreferences: {
      allowNavigationWithWarnings: false,
      autoSaveOnNavigation: true,
      strictValidation: integrationMode === 'integrated' // Stricter validation in integrated mode
    }
  });

  const formatCurrency = useCallback((value: number) => {
    const currency = data?.project?.currency || 'BRL';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0
    }).format(value || 0);
  }, [data?.project?.currency]);

  const formatNumber = useCallback((value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value || 0);
  }, []);

  const summary = useMemo(() => {
    const totalPrice = data?.budget?.totalPrice || 0;
    const totalCosts = data?.budget?.totalCosts || 0;
    const marginPct = totalPrice > 0 ? ((totalPrice - totalCosts) / totalPrice) * 100 : 0;
    const headcount = data?.team?.reduce((sum, member) => sum + (member.quantity || 0), 0) || 0;
    const coverage = data?.project?.dimensioning?.coverageType || data?.project?.serviceType || '—';
    const tma = data?.project?.dimensioning?.tmaMinutes || null;
    const monthlyCalls = data?.project?.generalInfo?.monthlyCalls || null;

    return { totalPrice, totalCosts, marginPct, headcount, coverage, tma, monthlyCalls };
  }, [data]);

  const nextRecommendation = navigation.navigationCapabilities.recommendations?.[0];

  const MiniResult = useCallback(({ tabId }: { tabId: string }) => {
    const tabValidation = validationStatus[tabId];
    const completion = tabValidation?.completionPercentage ?? 0;
    return (
      <div className="mb-3 w-full rounded-lg border border-border/60 bg-background/80 backdrop-blur-sm px-3 py-2 flex flex-wrap gap-3 items-center text-xs sm:text-sm">
        <span className="font-semibold text-foreground/90">Resumo rápido</span>
        <span className="pill-soft px-2 py-0.5 rounded-full border text-[11px]">
          Preço: {formatCurrency(summary.totalPrice)}
        </span>
        <span className={`px-2 py-0.5 rounded-full text-[11px] border ${summary.marginPct >= (data?.budget?.margin?.targetMargin || 0) ? 'pill-soft-success' : 'pill-soft-warning'}`}>
          Margem: {summary.marginPct.toFixed(1)}%
        </span>
        <span className="pill-soft px-2 py-0.5 rounded-full border text-[11px]">
          Equipe: {summary.headcount || 0} pessoas
        </span>
        {summary.monthlyCalls && (
          <span className="pill-soft px-2 py-0.5 rounded-full border text-[11px]">
            {formatNumber(summary.monthlyCalls)} chamados/mês
          </span>
        )}
        <span className="ml-auto flex items-center gap-1 text-muted-foreground text-[11px]">
          Progresso da aba: {Math.round(completion)}%
        </span>
      </div>
    );
  }, [summary, validationStatus, formatCurrency, formatNumber, data?.budget?.margin?.targetMargin]);

  // Initialize data manager and load data
  useEffect(() => {
    const initializeData = async () => {
      try {
        beginLoadingOperation();
        
        // Preload critical tabs for better performance
        await preloadCriticalTabs();
        
        // Initialize sync between tabs
        dataManager.initializeSync();
        
        // Check if user is first time user (only on client side)
        if (typeof window !== 'undefined') {
          const hasSeenTour = localStorage.getItem('service-desk-tour-completed');
          if (!hasSeenTour) {
            setIsFirstTimeUser(true);
            // Show tour launcher after a brief delay
            setTimeout(() => setShowTourLauncher(true), 2000);
          }
        }
        
        // Load existing data if no initial data provided
        if (!initialData) {
          const loadedData = await dataManager.loadData();
          dataRef.current = loadedData;
          setData(loadedData);
          
          // Validate all tabs
          const validations: Record<string, TabValidationStatus> = {};
          TAB_CONFIG.forEach(tab => {
            const tabData = dataManager.getTabData(loadedData, tab.id);
            validations[tab.id] = validationEngine.validateTabData(tab.id, tabData);
          });
          setValidationStatus(validations);
        }
        
        // Show welcome notification for new users
        if (isFirstTimeUser) {
          showNotification('info', 'Bem-vindo ao Sistema de Precificação Service Desk! Clique no botão "?" para fazer um tour guiado.');
        }
        
      } catch (error) {
        console.error('Error initializing data:', error);
        showNotification('error', 'Erro ao inicializar o sistema. Tente recarregar a página.');
      } finally {
        endLoadingOperation();
      }
    };

    initializeData();

    // Cleanup on unmount
    return () => {
      dataManager.cleanup();
      batchCalculationManager.clearBatch();
    };
  }, [initialData, dataManager, validationEngine, beginLoadingOperation, endLoadingOperation]);

  // Create backup when data changes significantly
  useEffect(() => {
    const createBackup = async () => {
      try {
        await dataManager.createBackup(data);
      } catch (error) {
        console.error('Error creating backup:', error);
      }
    };

    // Create backup every 10 minutes or when significant changes occur
    const backupInterval = setInterval(createBackup, 10 * 60 * 1000);
    
    return () => clearInterval(backupInterval);
  }, [data, dataManager]);

  // Handle data updates from tabs with performance optimizations
  const handleDataUpdate = useCallback(async (tabId: string, tabData: any) => {
    const startTime = Date.now();
    
    try {
      const currentTabData = dataManager.getTabData(dataRef.current, tabId);
      if (areValuesEqual(currentTabData, tabData)) {
        return;
      }

      beginLoadingOperation();
      
      // Track data operation start
      analyticsService.trackEvent({
        type: 'SYSTEM_EVENT' as any,
        category: 'DATA_OPERATION' as any,
        action: 'data_update_start',
        label: tabId,
        properties: { tabId }
      });
      
      // Update data
      const updatedData = dataManager.updateTabData(dataRef.current, tabId, tabData);
      dataRef.current = updatedData;
      setData(updatedData);
      
      // Invalidate related caches when data changes
      calculationCache.invalidateRelatedCaches(tabId);
      
      // Validate updated data
      const validationStartTime = Date.now();
      const validation = validationEngine.validateTabData(tabId, tabData);
      const validationDuration = Date.now() - validationStartTime;
      
      // Track validation
      analyticsService.trackValidation(
        tabId, 
        validation.isValid, 
        validation.errors.length, 
        validation.warnings.length
      );
      
      setValidationStatus(prev => ({
        ...prev,
        [tabId]: validation
      }));
      
      // Persist data
      await dataManager.persistData(updatedData);
      
      // Notify parent component
      onDataChange?.(updatedData);
      
      // Track successful data operation
      const totalDuration = Date.now() - startTime;
      analyticsService.trackEvent({
        type: 'SYSTEM_EVENT' as any,
        category: 'DATA_OPERATION' as any,
        action: 'data_update_success',
        label: tabId,
        value: totalDuration,
        properties: { 
          tabId, 
          duration: totalDuration,
          validationDuration,
          hasErrors: validation.errors.length > 0,
          hasWarnings: validation.warnings.length > 0
        }
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Track error
      analyticsService.trackError(error as Error, `data_update_${tabId}`);
      analyticsService.trackEvent({
        type: 'ERROR_EVENT' as any,
        category: 'DATA_OPERATION' as any,
        action: 'data_update_error',
        label: tabId,
        value: duration,
        properties: { 
          tabId, 
          duration,
          errorMessage: (error as Error).message
        }
      });
      
      console.error('Error updating data:', error);
    } finally {
      endLoadingOperation();
    }
  }, [dataManager, validationEngine, onDataChange, calculationCache, analyticsService, beginLoadingOperation, endLoadingOperation, areValuesEqual]);

  // Handle auto-save from tabs with enhanced debouncing
  const handleAutoSave = useCallback(async (tabId: string, tabData: any) => {
    try {
      const currentTabData = dataManager.getTabData(dataRef.current, tabId);
      if (areValuesEqual(currentTabData, tabData)) {
        return;
      }

      // Update data without loading state for auto-save
      const updatedData = dataManager.updateTabData(dataRef.current, tabId, tabData);
      dataRef.current = updatedData;
      setData(updatedData);
      
      // Use batch calculation manager for performance
      batchCalculationManager.addToBatch(tabId, () => {
        // Invalidate related caches
        calculationCache.invalidateRelatedCaches(tabId);
        
        // Validate updated data
        const validation = validationEngine.validateTabData(tabId, tabData);
        setValidationStatus(prev => ({
          ...prev,
          [tabId]: validation
        }));
      });
      
      // Schedule auto-save with debouncing
      dataManager.scheduleAutoSave(updatedData);
      
      // Notify parent component
      onDataChange?.(updatedData);
      
    } catch (error) {
      console.error('Error during auto-save:', error);
    }
  }, [dataManager, validationEngine, onDataChange, calculationCache, areValuesEqual]);

  // Handle tab navigation with enhanced validation and preloading
  const handleTabChange = useCallback(async (newTab: string) => {
    const startTime = Date.now();
    const currentTab = navigation.navigationState.activeTab;
    
    // Track navigation
    analyticsService.trackNavigation(currentTab, newTab);
    
    // Preload next tab for better performance
    await preloadNextTab(newTab);
    navigation.navigateToTab(newTab);
    
    // Track navigation performance
    const duration = Date.now() - startTime;
    analyticsService.trackPerformance('tab_navigation', duration, true);
  }, [navigation, analyticsService]);

  // Template management handlers
  const handleOpenTemplateManager = useCallback(() => {
    setShowTemplateManager(true);
  }, []);

  const handleCloseTemplateManager = useCallback(() => {
    setShowTemplateManager(false);
    setSelectedTemplate(null);
    setTemplateApplication(null);
  }, []);

  const handleApplyTemplate = useCallback((application: TemplateApplication) => {
    setTemplateApplication(application);
    setShowTemplateApplication(true);
    setShowTemplateManager(false);
  }, []);

  const handleConfirmTemplateApplication = useCallback(async (
    application: TemplateApplication, 
    resolutions: Record<string, ConflictResolution>
  ) => {
    try {
      beginLoadingOperation();
      
      // Apply conflict resolutions
      let updatedData = { ...application.targetData };
      
      application.conflicts.forEach(conflict => {
        const resolution = resolutions[conflict.field];
        if (resolution === ConflictResolution.USE_TEMPLATE) {
          // Apply template value
          const fieldPath = conflict.field.split('.');
          let current: any = updatedData;
          for (let i = 0; i < fieldPath.length - 1; i++) {
            current = current[fieldPath[i]];
          }
          current[fieldPath[fieldPath.length - 1]] = conflict.templateValue;
        }
        // For KEEP_EXISTING, we don't need to do anything
        // For MERGE, we would need more complex logic (TODO)
      });

      // Update data
      dataRef.current = updatedData;
      setData(updatedData);
      
      // Persist data
      await dataManager.persistData(updatedData);
      
      // Notify parent component
      onDataChange?.(updatedData);
      
      // Close dialogs
      setShowTemplateApplication(false);
      setTemplateApplication(null);
      setSelectedTemplate(null);
      
    } catch (error) {
      console.error('Error applying template:', error);
    } finally {
      endLoadingOperation();
    }
  }, [dataManager, onDataChange, beginLoadingOperation, endLoadingOperation]);

  const handleCancelTemplateApplication = useCallback(() => {
    setShowTemplateApplication(false);
    setTemplateApplication(null);
    setSelectedTemplate(null);
    setShowTemplateManager(true);
  }, []);

  const handleCreateTemplate = useCallback((template: ServiceDeskTemplate) => {
    // Template created successfully
    console.log('Template created:', template.name);
    analyticsService.trackEvent({
      type: 'BUSINESS_EVENT' as any,
      category: 'TEMPLATE_OPERATION' as any,
      action: 'template_created',
      label: template.name,
      properties: {
        templateId: template.id,
        templateCategory: template.category,
        templateType: template.type
      }
    });
    setShowTemplateManager(false);
  }, [analyticsService]);

  // Analytics handlers
  const handleOpenAnalyticsDashboard = useCallback(() => {
    setShowAnalyticsDashboard(true);
    analyticsService.trackUserAction('analytics_dashboard_opened');
  }, [analyticsService]);

  const handleCloseAnalyticsDashboard = useCallback(() => {
    setShowAnalyticsDashboard(false);
  }, []);

  // Notification management
  const showNotification = useCallback((
    type: 'success' | 'error' | 'warning' | 'info', 
    message: string,
    duration: number = 5000
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    const notification = { id, type, message, isVisible: true };
    
    setNotifications(prev => [...prev, notification]);
    
    // Auto-hide notification
    setTimeout(() => {
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isVisible: false } : n)
      );
      
      // Remove from array after animation
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 300);
    }, duration);
  }, []);

  const handleDimensionTeamFromData = useCallback(async (projectData: any, dimensionedTeam: any[]) => {
    try {
      beginLoadingOperation();

      const currentTeam = dataRef.current.team || [];
      const preservedMembers = currentTeam.filter((member: any) => !['pos-1', 'pos-2'].includes(member?.jobPositionId));
      const finalTeam = [...dimensionedTeam, ...preservedMembers];

      let updatedData = dataManager.updateTabData(dataRef.current, 'data', projectData);
      updatedData = dataManager.updateTabData(updatedData, 'team', finalTeam);

      dataRef.current = updatedData;
      setData(updatedData);

      calculationCache.invalidateRelatedCaches('data');
      calculationCache.invalidateRelatedCaches('team');

      const dataValidation = validationEngine.validateTabData('data', updatedData.project);
      const teamValidation = validationEngine.validateTabData('team', updatedData.team);

      setValidationStatus(prev => ({
        ...prev,
        data: dataValidation,
        team: teamValidation
      }));

      await dataManager.persistData(updatedData);
      onDataChange?.(updatedData);

      await handleTabChange('team');

      const n1Quantity = finalTeam.find((member: any) => member.jobPositionId === 'pos-1')?.quantity || 0;
      const n2Quantity = finalTeam.find((member: any) => member.jobPositionId === 'pos-2')?.quantity || 0;
      showNotification('success', `Equipe dimensionada: N1 ${n1Quantity} | N2 ${n2Quantity}.`);
    } catch (error) {
      console.error('Error applying dimensioning from data tab:', error);
      showNotification('error', 'Não foi possível dimensionar a equipe automaticamente.');
    } finally {
      endLoadingOperation();
    }
  }, [
    beginLoadingOperation,
    calculationCache,
    dataManager,
    endLoadingOperation,
    handleTabChange,
    onDataChange,
    showNotification,
    validationEngine
  ]);

  const handleSaveToQuotes = useCallback(() => {
    const totalPrice = data?.budget?.totalPrice || 0;
    if (totalPrice <= 0) {
      showNotification('warning', 'Preencha os dados de orçamento antes de salvar em Orçamentos.');
      return;
    }

    const mappedClientData = proposalClientData
      ? mapProposalClientDataToLegacyClientData(proposalClientData)
      : {
          razaoSocial: data.project?.client?.name || 'Cliente não informado',
          nomeContato: data.project?.client?.contactPerson || data.project?.client?.name || 'Contato não informado',
          telefoneCliente: data.project?.client?.phone || '',
          emailCliente: data.project?.client?.email || '',
          nomeProjeto: data.project?.name || 'Projeto Service Desk',
          nomeGerente: proposalClientData?.managerName || data.project?.client?.contactPerson || '',
          telefoneGerente: proposalClientData?.managerPhone || data.project?.client?.phone || '',
          emailGerente: proposalClientData?.managerEmail || data.project?.client?.email || '',
        };

    createQuoteFromPricingData({
      name: `Service Desk - ${mappedClientData.nomeProjeto}`,
      clientName: mappedClientData.razaoSocial,
      totalPrice,
      module: 'Service Desk',
      technicalSpecs: {
        projectId: data.project?.id,
        totalCosts: data.budget?.totalCosts || 0,
        totalPrice,
        margin: data.budget?.margin,
      },
      clientData: mappedClientData,
    });

    showNotification('success', 'Orçamento de Service Desk salvo com sucesso.');
    if (onNavigateToQuotes) {
      onNavigateToQuotes();
    }
  }, [data, proposalClientData, createQuoteFromPricingData, showNotification, onNavigateToQuotes]);

  // Tour management
  const handleStartTour = useCallback((tourId: string) => {
    setActiveTour(tourId);
    setShowTourLauncher(false);
    analyticsService.trackEvent({
      type: 'USER_ACTION' as any,
      category: 'TOUR' as any,
      action: 'tour_started',
      label: tourId
    });
  }, [analyticsService]);

  const handleCloseTour = useCallback(() => {
    setActiveTour(null);
  }, []);

  const handleTourComplete = useCallback((tourId: string) => {
    setActiveTour(null);
    if (typeof window !== 'undefined') {
      localStorage.setItem('service-desk-tour-completed', 'true');
    }
    setIsFirstTimeUser(false);
    showNotification('success', 'Tour concluído! Agora você está pronto para usar o sistema.');
    
    analyticsService.trackEvent({
      type: 'USER_ACTION' as any,
      category: 'TOUR' as any,
      action: 'tour_completed',
      label: tourId
    });
  }, [analyticsService, showNotification]);

  const handleTourSkip = useCallback((tourId: string) => {
    setActiveTour(null);
    if (typeof window !== 'undefined') {
      localStorage.setItem('service-desk-tour-skipped', 'true');
    }
    
    analyticsService.trackEvent({
      type: 'USER_ACTION' as any,
      category: 'TOUR' as any,
      action: 'tour_skipped',
      label: tourId
    });
  }, [analyticsService]);

  // Contextual help management
  const handleToggleContextualHelp = useCallback(() => {
    setShowContextualHelp(!showContextualHelp);
    analyticsService.trackUserAction(showContextualHelp ? 'contextual_help_closed' : 'contextual_help_opened');
  }, [showContextualHelp, analyticsService]);

  // Documentation management
  const handleOpenDocumentation = useCallback((category?: string, searchTerm?: string) => {
    if (category) setDocumentationCategory(category);
    if (searchTerm) setDocumentationSearchTerm(searchTerm);
    setShowDocumentation(true);
    analyticsService.trackUserAction('documentation_opened');
  }, [analyticsService]);

  const handleCloseDocumentation = useCallback(() => {
    setShowDocumentation(false);
    setDocumentationSearchTerm('');
  }, []);

  // Integrated help management
  const handleToggleIntegratedHelp = useCallback(() => {
    setShowIntegratedHelp(!showIntegratedHelp);
    analyticsService.trackUserAction(showIntegratedHelp ? 'integrated_help_closed' : 'integrated_help_opened');
  }, [showIntegratedHelp, analyticsService]);

  // Create breadcrumb items
  const breadcrumbItems = useMemo(() => {
    const currentTabConfig = TAB_CONFIG.find(tab => tab.id === navigation.navigationState.activeTab);
    return createServiceDeskBreadcrumbs(
      navigation.navigationState.activeTab,
      currentTabConfig?.label || 'Desconhecido',
      () => {
        // Navigate to home - could be implemented
        console.log('Navigate to home');
      },
      () => {
        // Navigate to service desk overview
        navigation.navigateToTab('data');
      },
      data.project?.name // Add project name to breadcrumbs
    );
  }, [navigation, data.project?.name]);

  // Don't render on server to avoid localStorage errors
  if (!isMounted) {
    return (
      <div className="service-desk-theme w-full max-w-7xl mx-auto p-6 flex items-center justify-center min-h-screen rounded-2xl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="service-desk-theme w-full max-w-7xl mx-auto p-6 space-y-6 rounded-2xl">
      {/* Comando rápido e visão geral */}
      <Card variant="contrast" className="card-surface overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-primary/15 via-[hsl(var(--accent-cyan))/12] to-transparent" />
        <div className="relative flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Service Desk Avançado</Badge>
              {integrationMode === 'integrated' && (
                <Badge variant="secondary" className="pill-soft">Integrado com PDF</Badge>
              )}
              {navigation.navigationCapabilities.hasErrors && (
                <Badge variant="destructive" className="pill-soft-danger">Correções pendentes</Badge>
              )}
              {navigation.navigationCapabilities.hasWarnings && !navigation.navigationCapabilities.hasErrors && (
                <Badge variant="secondary" className="pill-soft-warning">Há avisos</Badge>
              )}
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold">Fluxo guiado de precificação</h2>
              <p className="text-sm text-muted-foreground max-w-2xl">
                Revise os dados essenciais, navegue por abas em ordem lógica e acompanhe KPIs-chave em tempo real.
                Inspirado em experiências de pricing do Freshservice, ServiceNow e SolarWinds Service Desk.
              </p>
            </div>
            {nextRecommendation && (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="secondary" className="pill-soft">Próxima etapa sugerida</Badge>
                <span className="text-foreground/80 font-medium">{nextRecommendation.tabName}</span>
                <span className="text-xs text-muted-foreground">— {nextRecommendation.reason}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleTabChange(nextRecommendation.tabId)}
                  className="ml-1"
                >
                  Ir agora
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            {onBack && (
              <Button variant="outline" size="sm" onClick={onBack}>
                ← Voltar
              </Button>
            )}
            <Button variant="default" size="sm" onClick={handleSaveToQuotes} className="shadow-lg shadow-primary/25">
              <Save className="h-4 w-4 mr-1" /> Salvar em Orçamentos
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowExportInterface(true)}>
              <Download className="h-4 w-4 mr-1" /> Exportar
            </Button>
            <Button variant="outline" size="sm" onClick={handleOpenTemplateManager}>
              <BookOpen className="h-4 w-4 mr-1" /> Templates
            </Button>
            <Button variant="outline" size="sm" onClick={handleOpenAnalyticsDashboard}>
              <BarChart3 className="h-4 w-4 mr-1" /> Analytics
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleOpenDocumentation()}>
              <BookOpen className="h-4 w-4 mr-1" /> Docs
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowEmployeeRegistry(true)}>
              <Users className="h-4 w-4 mr-1" /> Funcionários
            </Button>
            <QuickHelpButton
              activeTab={navigation.navigationState.activeTab}
              onOpenHelp={handleToggleIntegratedHelp}
            />
            <Button variant="ghost" size="sm" onClick={() => setShowTourLauncher(true)}>
              ?
            </Button>
          </div>
        </div>

        <div className="relative mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            {
              label: 'Preço sugerido',
              value: formatCurrency(summary.totalPrice),
              hint: summary.totalPrice > 0 ? 'Inclui impostos e margem' : 'Defina dados para calcular',
              tone: 'primary'
            },
            {
              label: 'Custos/mês',
              value: formatCurrency(summary.totalCosts),
              hint: 'Equipe + impostos + outros custos',
              tone: 'muted'
            },
            {
              label: 'Margem estimada',
              value: `${summary.marginPct.toFixed(1)}%`,
              hint: `Alvo: ${data?.budget?.margin?.targetMargin || 0}%`,
              tone: summary.marginPct >= (data?.budget?.margin?.targetMargin || 0) ? 'success' : 'warning'
            },
            {
              label: 'Equipe dimensionada',
              value: `${summary.headcount} pessoas`,
              hint: `${data.team?.length || 0} cargos configurados`,
              tone: 'success'
            },
            {
              label: 'Volume / Cobertura',
              value: summary.monthlyCalls ? `${formatNumber(summary.monthlyCalls)} chamados` : 'Configurar',
              hint: summary.coverage ? `Cobertura ${summary.coverage}${summary.tma ? ` · TMA ${summary.tma} min` : ''}` : 'Defina em Dados',
              tone: 'muted'
            }
          ].map((metric, index) => (
            <div
              key={metric.label + index}
              className="rounded-xl border border-border/60 bg-background/70 backdrop-blur-sm p-4 shadow-sm"
            >
              <p className="text-[11px] uppercase tracking-[0.04em] text-muted-foreground font-medium">{metric.label}</p>
              <div className={`text-lg font-semibold mt-1 ${
                metric.tone === 'success' ? 'text-green-300' :
                metric.tone === 'warning' ? 'text-amber-200' :
                metric.tone === 'primary' ? 'text-primary' : 'text-foreground'
              }`}>
                {metric.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{metric.hint}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Indicator */}
        <div className="lg:col-span-2">
          <ProgressIndicator
            tabs={TAB_CONFIG}
            validationStatus={validationStatus}
            activeTab={navigation.navigationState.activeTab}
            showDetails={true}
            showMilestones={true}
            showNavigationShortcuts={true}
            onNavigateToTab={handleTabChange}
            onNavigateToFirstError={navigation.navigateToFirstError}
            onNavigateToFirstIncomplete={navigation.navigateToFirstIncomplete}
          />
        </div>

        {/* Navigation Controls */}
        <div className="lg:col-span-1">
          <NavigationControls
            currentTab={navigation.navigationState.activeTab}
            currentTabLabel={TAB_CONFIG.find(t => t.id === navigation.navigationState.activeTab)?.label || 'Desconhecido'}
            totalTabs={TAB_CONFIG.length}
            currentTabIndex={TAB_CONFIG.findIndex(t => t.id === navigation.navigationState.activeTab)}
            validationStatus={validationStatus}
            canNavigateNext={navigation.navigationCapabilities.canGoNext}
            canNavigatePrevious={navigation.navigationCapabilities.canGoPrevious}
            onNavigateNext={navigation.navigateNext}
            onNavigatePrevious={navigation.navigatePrevious}
            onNavigateToFirstError={navigation.navigateToFirstError}
            onNavigateToFirstIncomplete={navigation.navigateToFirstIncomplete}
            onNavigateToTab={handleTabChange}
            navigationRecommendations={navigation.navigationCapabilities.recommendations}
          />
        </div>
      </div>

      <Card variant="surface" className="card-surface">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span>Sistema de Precificação Service Desk</span>
              </div>
              {/* Breadcrumbs */}
              <Breadcrumbs 
                items={breadcrumbItems}
                showIcons={true}
                className="text-sm"
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enhanced Tab Navigation with animations */}
          <TabTransition tabId={navigation.navigationState.activeTab}>
            <TabNavigation
              tabs={TAB_CONFIG}
              activeTab={navigation.navigationState.activeTab}
              validationStatus={validationStatus}
              onTabChange={handleTabChange}
              onNavigateNext={navigation.navigateNext}
              onNavigatePrevious={navigation.navigatePrevious}
              onNavigateToFirstError={navigation.navigateToFirstError}
              onNavigateToFirstIncomplete={navigation.navigateToFirstIncomplete}
              showProgress={false} // Already shown in ProgressIndicator
              showBreadcrumbs={false} // Already shown above
              showQuickActions={true}
              showTabPreview={true}
            />
          </TabTransition>

          {/* Show validation alerts */}
          {navigation.navigationCapabilities.hasErrors && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription className="flex items-center justify-between">
                <span>
                  Existem erros que precisam ser corrigidos em algumas abas.
                </span>
                <button
                  onClick={navigation.navigateToFirstError}
                  className="text-sm underline hover:no-underline"
                >
                  Ir para primeiro erro
                </button>
              </AlertDescription>
            </Alert>
          )}

          {navigation.navigationCapabilities.hasWarnings && !navigation.navigationCapabilities.hasErrors && (
            <Alert className="mb-4">
              <AlertDescription>
                Existem avisos em algumas abas. Verifique os indicadores para mais detalhes.
              </AlertDescription>
            </Alert>
          )}

          <Tabs value={navigation.navigationState.activeTab} onValueChange={handleTabChange} className="w-full">
            {/* Hidden TabsList - navigation is handled by TabNavigation component */}
            <TabsList className="hidden">
              {TAB_CONFIG.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {TAB_CONFIG.map((tab) => {
              const TabComponent = tab.component;
              const tabData = dataManager.getTabData(data, tab.id);
              
              // Prepare additional props for specific tabs
              const additionalProps: any = {};

              if (tab.id === 'data') {
                additionalProps.onDimensionTeam = handleDimensionTeamFromData;
              }
              
              if (tab.id === 'team') {
                // Pass full data to team tab for dimensioning
                additionalProps.fullData = data;
                // Pass callback to update schedules
                additionalProps.onUpdateSchedule = (schedules: any[]) => {
                  handleDataUpdate('scale', schedules);
                };
              }
              
              if (tab.id === 'scale') {
                // Pass team members to scale tab - convert new format to expected format
                additionalProps.teamMembers = data.team?.flatMap(member => {
                  // Create individual entries for each person in the position
                  const entries = [];
                  for (let i = 0; i < member.quantity; i++) {
                    entries.push({
                      id: `${member.id}-${i}`,
                      name: `Pessoa ${i + 1}`, // Generic name for now
                      role: member.jobPositionId // Use position ID as role
                    });
                  }
                  return entries;
                }) || [];
              }
              
              if (tab.id === 'result') {
                // Pass full data to result tab for calculations and export
                additionalProps.fullData = data;
              }

              if (tab.id === 'budget') {
                additionalProps.teamData = data.team || [];
                additionalProps.scheduleData = data.schedules || [];
                additionalProps.taxData = data.taxes || {};
                additionalProps.otherCostsData = data.otherCosts || [];
                additionalProps.projectData = data.project || {};
              }

              if (tab.id === 'forecast') {
                additionalProps.fullData = data;
              }
              
              return (
                <TabsContent key={tab.id} value={tab.id} className="mt-6" data-tour={`${tab.id}-tab`}>
                  <MiniResult tabId={tab.id} />
                  <AnimatedCard className="w-full">
                    <Suspense 
                      fallback={
                        <div className="flex items-center justify-center p-8">
                          <Loader2 className="h-8 w-8 animate-spin" />
                          <span className="ml-2">Carregando módulo...</span>
                        </div>
                      }
                    >
                      <TabTransition tabId={tab.id}>
                        <TabComponent
                          data={tabData}
                          onUpdate={(tabData: any) => handleDataUpdate(tab.id, tabData)}
                          onAutoSave={(tabData: any) => handleAutoSave(tab.id, tabData)}
                          validation={validationStatus[tab.id] || { isValid: true, errors: [], warnings: [], completionPercentage: 100, tabId: tab.id }}
                          isLoading={isLoading}
                          {...additionalProps}
                        />
                      </TabTransition>
                    </Suspense>
                  </AnimatedCard>
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>

      {/* Enhanced Navigation Validation Dialog */}
      {navigation.showValidationDialog && navigation.validationData && (
        <ValidationTransition
          isOpen={navigation.showValidationDialog}
          onClose={navigation.cancelNavigation}
          onConfirm={navigation.confirmNavigation}
          onCancel={navigation.cancelNavigation}
          fromTab={navigation.validationData.fromTab}
          toTab={navigation.validationData.toTab}
          fromTabLabel={TAB_CONFIG.find(t => t.id === navigation.validationData?.fromTab)?.label || ''}
          toTabLabel={TAB_CONFIG.find(t => t.id === navigation.validationData?.toTab)?.label || ''}
          validationStatus={validationStatus[navigation.validationData.fromTab] || {
            isValid: false,
            errors: [],
            warnings: [],
            completionPercentage: 0
          }}
          errors={navigation.validationData.validation.errors}
          warnings={navigation.validationData.validation.warnings}
          suggestions={navigation.validationData.validation.suggestions || []}
          blockingIssues={navigation.validationData.validation.blockingIssues}
          isOptimalPath={navigation.navigationPathAnalysis(navigation.validationData.toTab).isOptimal}
          suggestedPath={navigation.navigationPathAnalysis(navigation.validationData.toTab).suggestedPath}
          pathReason={navigation.navigationPathAnalysis(navigation.validationData.toTab).reason}
          canProceedWithWarnings={true}
          showSaveReminder={true}
          showPathAnalysis={true}
        />
      )}

      {/* Template Manager Dialog */}
      <TemplateManager
        currentData={data}
        onApplyTemplate={handleApplyTemplate}
        onCreateTemplate={handleCreateTemplate}
        isOpen={showTemplateManager}
        onClose={handleCloseTemplateManager}
      />

      {/* Template Application Dialog */}
      <TemplateApplicationDialog
        isOpen={showTemplateApplication}
        onClose={() => setShowTemplateApplication(false)}
        onConfirm={handleConfirmTemplateApplication}
        onCancel={handleCancelTemplateApplication}
        template={selectedTemplate}
        application={templateApplication}
      />

      {/* Analytics Dashboard */}
      <AnalyticsDashboard
        isOpen={showAnalyticsDashboard}
        onClose={handleCloseAnalyticsDashboard}
      />

      {/* Export Interface */}
      <UnifiedExportInterface
        open={showExportInterface}
        onOpenChange={setShowExportInterface}
        data={data}
      />

      {/* Contextual Help Panel */}
      <ContextualHelp
        title="Ajuda do Sistema"
        isOpen={showContextualHelp}
        onClose={() => setShowContextualHelp(false)}
        content={
          <div className="space-y-4">
            <QuickHelpCard
              title="Navegação por Abas"
              description="O sistema é organizado em 10 abas sequenciais. Complete cada aba antes de prosseguir para a próxima."
              tips={[
                "Use os indicadores coloridos para verificar o status de cada aba",
                "Campos obrigatórios são marcados com asterisco (*)",
                "O sistema salva automaticamente suas alterações"
              ]}
            />
            
            <QuickHelpCard
              title="Validação de Dados"
              description="O sistema valida seus dados em tempo real e oferece sugestões de correção."
              tips={[
                "Erros são mostrados em vermelho e impedem a navegação",
                "Avisos são mostrados em amarelo mas não bloqueiam",
                "Sugestões aparecem em azul para otimizar seus dados"
              ]}
            />
            
            <QuickHelpCard
              title="Atalhos de Teclado"
              description="Use atalhos para navegar mais rapidamente pelo sistema."
              tips={[
                "Ctrl + → : Próxima aba",
                "Ctrl + ← : Aba anterior", 
                "Ctrl + S : Salvar dados",
                "Ctrl + E : Abrir exportação"
              ]}
            />
          </div>
        }
      />

      {/* Tour Launcher Dialog */}
      {showTourLauncher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-blue-700">Tours Guiados</h2>
                <Button variant="ghost" onClick={() => setShowTourLauncher(false)}>
                  <X size={20} />
                </Button>
              </div>
              
              <TourLauncher 
                onStartTour={handleStartTour}
                className="mb-4"
              />
              
              {isFirstTimeUser && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mt-4">
                  <p className="text-sm text-blue-800">
                    <strong>Primeira vez aqui?</strong> Recomendamos começar com o Tour Básico para conhecer as principais funcionalidades.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Guided Tours */}
      {activeTour === 'basic' && (
        <GuidedTour
          config={{
            ...basicServiceDeskTour,
            onComplete: () => handleTourComplete('basic'),
            onSkip: () => handleTourSkip('basic')
          }}
          isActive={true}
          onClose={handleCloseTour}
        />
      )}
      
      {activeTour === 'advanced' && (
        <GuidedTour
          config={{
            ...advancedFeaturesTour,
            onComplete: () => handleTourComplete('advanced'),
            onSkip: () => handleTourSkip('advanced')
          }}
          isActive={true}
          onClose={handleCloseTour}
        />
      )}
      
      {activeTour === 'tips' && (
        <GuidedTour
          config={{
            ...quickTipsTour,
            onComplete: () => handleTourComplete('tips'),
            onSkip: () => handleTourSkip('tips')
          }}
          isActive={true}
          onClose={handleCloseTour}
        />
      )}

      {/* Documentation System */}
      <DocumentationSystem
        isOpen={showDocumentation}
        onClose={handleCloseDocumentation}
        initialCategory={documentationCategory}
        initialSearchTerm={documentationSearchTerm}
      />

      {/* Integrated Help System */}
      <IntegratedHelpSystem
        activeTab={navigation.navigationState.activeTab}
        isOpen={showIntegratedHelp}
        onClose={() => setShowIntegratedHelp(false)}
        onOpenDocumentation={() => {
          setShowIntegratedHelp(false);
          handleOpenDocumentation('user-guide', navigation.navigationState.activeTab);
        }}
      />

      {/* Employee Registry Manager */}
      <EmployeeRegistryManager
        isOpen={showEmployeeRegistry}
        onClose={() => setShowEmployeeRegistry(false)}
        selectionMode={false}
      />

      {/* Notifications */}
      <div className="fixed top-4 right-4 z-40 space-y-2">
        {notifications.map((notification) => (
          <NotificationAnimation
            key={notification.id}
            isVisible={notification.isVisible}
            position="top-right"
          >
            <div className={`
              px-4 py-3 rounded-md shadow-lg max-w-sm
              ${notification.type === 'success' ? 'bg-green-500 text-white' :
                notification.type === 'error' ? 'bg-red-500 text-white' :
                notification.type === 'warning' ? 'bg-yellow-500 text-white' :
                'bg-blue-500 text-white'}
            `}>
              <div className="flex items-center justify-between">
                <span className="text-sm">{notification.message}</span>
                <button
                  onClick={() => setNotifications(prev => 
                    prev.map(n => n.id === notification.id ? { ...n, isVisible: false } : n)
                  )}
                  className="ml-2 text-white hover:text-gray-200"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </NotificationAnimation>
        ))}
      </div>
    </div>
  );
}
