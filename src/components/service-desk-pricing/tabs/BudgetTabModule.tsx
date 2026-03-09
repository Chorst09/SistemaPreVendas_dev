'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  ConsolidatedBudget, 
  MarginConfiguration, 
  MonthlyBudget,
  TeamCostSummary,
  TaxSummary,
  ValidationResult,
  ServiceDeskData,
  PricingModelConfiguration,
  PricingModelComparison,
  PricingModelType
} from '@/lib/types/service-desk-pricing';
import { ServiceDeskCalculationEngine } from '@/lib/services/service-desk-calculation-engine';
import { BudgetComparisonService, BudgetComparison, BudgetAlert, BudgetRecommendation } from '@/lib/services/budget-comparison-service';
import { 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  PieChart, 
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Info,
  Settings,
  RefreshCw,
  TrendingDown,
  Minus,
  Target,
  Award,
  AlertCircle
} from 'lucide-react';

export interface BudgetTabModuleProps {
  data: ConsolidatedBudget;
  onUpdate: (data: ConsolidatedBudget) => void;
  onAutoSave: (data: ConsolidatedBudget) => void;
  validation?: ValidationResult;
  isLoading?: boolean;
  // Additional context data needed for calculations
  teamData?: any[];
  scheduleData?: any[];
  taxData?: any;
  otherCostsData?: any[];
  projectData?: any;
}

const DEFAULT_PRICING_MODEL_CONFIGURATION: PricingModelConfiguration = {
  model: 'cost_plus_margin',
  agentRateMonthly: 2200,
  userRateMonthly: 55,
  ticketRate: 18,
  baseRetainerMonthly: 25000,
  projectedUsers: 200,
  projectedTicketsMonthly: 1200,
  minimumMonthlyCharge: 0
};

const PRICING_MODEL_LABELS: Record<PricingModelType, string> = {
  cost_plus_margin: 'Custo + Margem',
  per_agent: 'Por Agente',
  per_user: 'Por Usuário',
  per_ticket: 'Por Ticket',
  hybrid: 'Híbrido'
};

const sanitizePricingModelConfig = (
  config?: Partial<PricingModelConfiguration>
): PricingModelConfiguration => ({
  ...DEFAULT_PRICING_MODEL_CONFIGURATION,
  ...config,
  model: config?.model || DEFAULT_PRICING_MODEL_CONFIGURATION.model,
  agentRateMonthly: Math.max(0, Number(config?.agentRateMonthly ?? DEFAULT_PRICING_MODEL_CONFIGURATION.agentRateMonthly)),
  userRateMonthly: Math.max(0, Number(config?.userRateMonthly ?? DEFAULT_PRICING_MODEL_CONFIGURATION.userRateMonthly)),
  ticketRate: Math.max(0, Number(config?.ticketRate ?? DEFAULT_PRICING_MODEL_CONFIGURATION.ticketRate)),
  baseRetainerMonthly: Math.max(0, Number(config?.baseRetainerMonthly ?? DEFAULT_PRICING_MODEL_CONFIGURATION.baseRetainerMonthly)),
  projectedUsers: Math.max(0, Number(config?.projectedUsers ?? DEFAULT_PRICING_MODEL_CONFIGURATION.projectedUsers)),
  projectedTicketsMonthly: Math.max(0, Number(config?.projectedTicketsMonthly ?? DEFAULT_PRICING_MODEL_CONFIGURATION.projectedTicketsMonthly)),
  minimumMonthlyCharge: Math.max(0, Number(config?.minimumMonthlyCharge ?? DEFAULT_PRICING_MODEL_CONFIGURATION.minimumMonthlyCharge))
});

export function BudgetTabModule({
  data,
  onUpdate,
  onAutoSave,
  validation,
  isLoading = false,
  teamData = [],
  scheduleData = [],
  taxData = {},
  otherCostsData = [],
  projectData = {}
}: BudgetTabModuleProps) {
  const [localData, setLocalData] = useState<ConsolidatedBudget>({
    ...data,
    pricingModel: sanitizePricingModelConfig(data?.pricingModel),
    pricingModelComparisons: data?.pricingModelComparisons || []
  });
  const [activeView, setActiveView] = useState<'overview' | 'details' | 'comparison' | 'settings'>('overview');
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [showOptimizations, setShowOptimizations] = useState(false);
  const [budgetComparison, setBudgetComparison] = useState<BudgetComparison | null>(null);
  const [budgetHealthScore, setBudgetHealthScore] = useState<any>(null);
  const [previousBudgets, setPreviousBudgets] = useState<ConsolidatedBudget[]>([]);

  const calculationEngine = useMemo(() => new ServiceDeskCalculationEngine(), []);
  const comparisonService = useMemo(() => new BudgetComparisonService(), []);
  const contractPeriod = useMemo(
    () => Math.max(1, Number(projectData?.contractPeriod?.durationMonths || 12)),
    [projectData]
  );
  const teamHeadcount = useMemo(
    () => teamData.reduce((sum: number, member: any) => sum + Math.max(1, Number(member?.quantity || 1)), 0),
    [teamData]
  );

  // Initialize local data and load comparison data
  useEffect(() => {
    setLocalData({
      ...data,
      pricingModel: sanitizePricingModelConfig(data?.pricingModel),
      pricingModelComparisons: data?.pricingModelComparisons || []
    });
    
    // Load previous budgets from localStorage (in a real app, this would come from an API)
    const loadPreviousBudgets = () => {
      try {
        const stored = localStorage.getItem('service-desk-previous-budgets');
        if (stored) {
          const budgets = JSON.parse(stored);
          setPreviousBudgets(budgets);
          
          // Generate comparison
          const comparison = comparisonService.compareBudgets(data, budgets);
          setBudgetComparison(comparison);
        }
      } catch (error) {
        console.error('Error loading previous budgets:', error);
      }
    };

    loadPreviousBudgets();
    
    // Calculate budget health score
    const healthScore = comparisonService.getBudgetHealthScore(data);
    setBudgetHealthScore(healthScore);
  }, [data, comparisonService]);

  // Auto-save with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (JSON.stringify(localData) !== JSON.stringify(data)) {
        onAutoSave(localData);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [localData, data, onAutoSave]);

  const calculateContractRevenueByModel = useCallback((
    modelConfig: PricingModelConfiguration,
    costPlusRevenue: number
  ) => {
    const agentRevenue = teamHeadcount * modelConfig.agentRateMonthly;
    const userRevenue = modelConfig.projectedUsers * modelConfig.userRateMonthly;
    const ticketRevenue = modelConfig.projectedTicketsMonthly * modelConfig.ticketRate;

    let monthlyRevenue = 0;
    switch (modelConfig.model) {
      case 'per_agent':
        monthlyRevenue = agentRevenue;
        break;
      case 'per_user':
        monthlyRevenue = userRevenue;
        break;
      case 'per_ticket':
        monthlyRevenue = ticketRevenue;
        break;
      case 'hybrid':
        monthlyRevenue = modelConfig.baseRetainerMonthly + agentRevenue + userRevenue + ticketRevenue;
        break;
      case 'cost_plus_margin':
      default:
        monthlyRevenue = costPlusRevenue / contractPeriod;
        break;
    }

    const monthlyWithMinimum = Math.max(monthlyRevenue, modelConfig.minimumMonthlyCharge);
    return monthlyWithMinimum * contractPeriod;
  }, [teamHeadcount, contractPeriod]);

  const buildPricingModelComparisons = useCallback((
    modelConfig: PricingModelConfiguration,
    costPlusRevenue: number,
    totalCosts: number
  ): PricingModelComparison[] => {
    const models: PricingModelType[] = ['cost_plus_margin', 'per_agent', 'per_user', 'per_ticket', 'hybrid'];
    return models.map((model) => {
      const configForModel = { ...modelConfig, model };
      const contractRevenue = calculateContractRevenueByModel(configForModel, costPlusRevenue);
      const monthlyRevenue = contractRevenue / contractPeriod;
      const estimatedMargin = contractRevenue > 0
        ? ((contractRevenue - totalCosts) / contractRevenue) * 100
        : 0;

      return {
        model,
        label: PRICING_MODEL_LABELS[model],
        monthlyRevenue,
        contractRevenue,
        estimatedMargin
      };
    });
  }, [calculateContractRevenueByModel, contractPeriod]);

  const buildTaxSummary = useCallback((taxResult: any) => {
    const breakdown = taxResult?.breakdown || [];
    return {
      federal: breakdown
        .filter((t: any) => ['PIS', 'COFINS', 'IR', 'CSLL'].includes(t.taxName))
        .reduce((sum: number, t: any) => sum + t.amount, 0),
      state: breakdown
        .filter((t: any) => t.taxName === 'ICMS')
        .reduce((sum: number, t: any) => sum + t.amount, 0),
      municipal: breakdown
        .filter((t: any) => t.taxName === 'ISS')
        .reduce((sum: number, t: any) => sum + t.amount, 0),
      total: Number(taxResult?.totalTaxes || 0),
      breakdown
    };
  }, []);

  const applyPricingModelToBudget = useCallback((
    baseBudget: ConsolidatedBudget,
    modelConfig: PricingModelConfiguration
  ): ConsolidatedBudget => {
    const costPlusRevenue = calculationEngine.calculateMargins(
      Math.max(0, baseBudget.totalCosts || 0),
      baseBudget.margin
    ).totalPrice;

    const selectedContractRevenue = calculateContractRevenueByModel(modelConfig, costPlusRevenue);
    const safeRevenue = Number.isFinite(selectedContractRevenue) ? Math.max(0, selectedContractRevenue) : 0;

    let taxResult: any;
    if (taxData && Object.keys(taxData).length > 0) {
      taxResult = calculationEngine.calculateTaxes(safeRevenue, taxData);
    } else {
      const currentRevenue = Math.max(1, baseBudget.totalPrice || costPlusRevenue);
      const ratio = safeRevenue / currentRevenue;
      taxResult = {
        totalTaxes: baseBudget.taxes.total * ratio,
        breakdown: baseBudget.taxes.breakdown.map((tax) => ({
          ...tax,
          base: safeRevenue,
          amount: tax.amount * ratio
        }))
      };
    }

    const monthlyRevenue = safeRevenue / contractPeriod;
    const monthlyTaxes = (taxResult.totalTaxes || 0) / contractPeriod;
    const monthlyBreakdown = baseBudget.monthlyBreakdown.map((month) => {
      const profit = monthlyRevenue - month.totalCosts - monthlyTaxes;
      const margin = monthlyRevenue > 0 ? (profit / monthlyRevenue) * 100 : 0;
      return {
        ...month,
        revenue: monthlyRevenue,
        taxes: monthlyTaxes,
        profit,
        margin
      };
    });

    const taxSummary = buildTaxSummary(taxResult);
    const pricingModelComparisons = buildPricingModelComparisons(modelConfig, costPlusRevenue, baseBudget.totalCosts);

    return {
      ...baseBudget,
      totalPrice: safeRevenue,
      taxes: taxSummary,
      monthlyBreakdown,
      pricingModel: modelConfig,
      pricingModelComparisons
    };
  }, [
    calculationEngine,
    calculateContractRevenueByModel,
    taxData,
    contractPeriod,
    buildTaxSummary,
    buildPricingModelComparisons
  ]);

  // Recalculate budget when dependencies change
  const recalculateBudget = useCallback(async () => {
    if (!teamData.length || !taxData || Object.keys(taxData).length === 0) return;

    setIsRecalculating(true);
    try {
      // Calculate team costs
      const teamCosts = calculationEngine.calculateTeamCosts(teamData, scheduleData);

      const contractPeriod = projectData?.contractPeriod?.durationMonths || 12;
      const safeContractPeriod = Math.max(1, contractPeriod);

      const marginValue = localData.margin.type === 'percentage'
        ? Math.min(Math.max(localData.margin.value || 0, 0), 95)
        : null;

      const fallbackRevenueEstimate = marginValue !== null
        ? (teamCosts.totalMonthlyCost * safeContractPeriod) / (1 - marginValue / 100)
        : (teamCosts.totalMonthlyCost * safeContractPeriod) + Math.max(0, localData.margin.value || 0);

      const taxBaseRevenue = localData.totalPrice > 0 ? localData.totalPrice : fallbackRevenueEstimate;

      // Calculate taxes using a consistent contract-level revenue estimate
      const taxes = calculationEngine.calculateTaxes(taxBaseRevenue, taxData);

      // Calculate consolidated budget
      const consolidatedBudget = calculationEngine.calculateConsolidatedBudget(
        teamCosts,
        otherCostsData,
        taxes,
        localData.margin,
        safeContractPeriod
      );
      const modelConfig = sanitizePricingModelConfig(localData.pricingModel);
      const budgetWithModel = applyPricingModelToBudget(consolidatedBudget, modelConfig);

      setLocalData(budgetWithModel);
      onUpdate(budgetWithModel);
    } catch (error) {
      console.error('Error recalculating budget:', error);
    } finally {
      setIsRecalculating(false);
    }
  }, [
    teamData,
    scheduleData,
    taxData,
    otherCostsData,
    projectData,
    localData.margin,
    localData.pricingModel,
    calculationEngine,
    onUpdate,
    applyPricingModelToBudget
  ]);

  // Handle margin configuration changes
  const handleMarginChange = useCallback((field: keyof MarginConfiguration, value: any) => {
    const updatedMargin = { ...localData.margin, [field]: value };
    const baseBudget: ConsolidatedBudget = { ...localData, margin: updatedMargin };
    const modelConfig = sanitizePricingModelConfig(localData.pricingModel);
    const updatedData = applyPricingModelToBudget(baseBudget, modelConfig);
    setLocalData(updatedData);
  }, [localData, applyPricingModelToBudget]);

  const handlePricingModelConfigChange = useCallback((field: keyof PricingModelConfiguration, value: any) => {
    const currentConfig = sanitizePricingModelConfig(localData.pricingModel);
    const nextConfig = sanitizePricingModelConfig({
      ...currentConfig,
      [field]: field === 'model' ? value : Number(value || 0)
    });
    const updatedData = applyPricingModelToBudget(localData, nextConfig);
    setLocalData(updatedData);
  }, [localData, applyPricingModelToBudget]);

  // Calculate budget health indicators
  const budgetHealth = useMemo(() => {
    const teamCostPercentage = localData.totalPrice > 0 ? (localData.teamCosts.total / localData.totalPrice) * 100 : 0;
    const taxPercentage = localData.totalPrice > 0 ? (localData.taxes.total / localData.totalPrice) * 100 : 0;
    const marginPercentage = localData.totalPrice > 0 ? ((localData.totalPrice - localData.totalCosts) / localData.totalPrice) * 100 : 0;

    return {
      teamCostPercentage,
      taxPercentage,
      marginPercentage,
      isHealthy: marginPercentage >= 15 && teamCostPercentage <= 70,
      warnings: [
        ...(marginPercentage < 10 ? ['Margem muito baixa - risco de prejuízo'] : []),
        ...(teamCostPercentage > 80 ? ['Custos de equipe muito altos'] : []),
        ...(taxPercentage > 35 ? ['Carga tributária elevada'] : [])
      ]
    };
  }, [localData]);

  const pricingModelConfig = useMemo(
    () => sanitizePricingModelConfig(localData.pricingModel),
    [localData.pricingModel]
  );

  const pricingModelComparisons = useMemo(() => {
    if (localData.pricingModelComparisons && localData.pricingModelComparisons.length > 0) {
      return localData.pricingModelComparisons;
    }

    const costPlusRevenue = calculationEngine.calculateMargins(
      Math.max(0, localData.totalCosts || 0),
      localData.margin
    ).totalPrice;

    return buildPricingModelComparisons(pricingModelConfig, costPlusRevenue, localData.totalCosts);
  }, [localData, calculationEngine, pricingModelConfig, buildPricingModelComparisons]);

  const selectedPricingModelComparison = useMemo(
    () => pricingModelComparisons.find((item) => item.model === pricingModelConfig.model),
    [pricingModelComparisons, pricingModelConfig.model]
  );

  // Generate optimization suggestions from comparison service
  const optimizationSuggestions = useMemo(() => {
    if (budgetComparison) {
      return budgetComparison.recommendations.map(rec => rec.description);
    }
    
    // Fallback to basic suggestions if no comparison data
    const suggestions: string[] = [];
    
    if (budgetHealth.marginPercentage < 15) {
      suggestions.push('Considere aumentar a margem ou reduzir custos');
    }
    
    if (budgetHealth.teamCostPercentage > 70) {
      suggestions.push('Analise possibilidade de otimizar a equipe');
    }
    
    if (localData.taxes.total > localData.teamCosts.total * 0.3) {
      suggestions.push('Revise a estratégia tributária');
    }

    if (localData.monthlyBreakdown.some(month => month.margin < 10)) {
      suggestions.push('Alguns meses apresentam margem baixa');
    }

    return suggestions;
  }, [budgetComparison, budgetHealth, localData]);

  // Save current budget to history when it changes significantly
  const saveBudgetToHistory = useCallback(() => {
    try {
      const stored = localStorage.getItem('service-desk-previous-budgets');
      const existingBudgets = stored ? JSON.parse(stored) : [];
      
      // Add current budget to history (limit to last 10)
      const updatedBudgets = [...existingBudgets, localData].slice(-10);
      localStorage.setItem('service-desk-previous-budgets', JSON.stringify(updatedBudgets));
      
      setPreviousBudgets(updatedBudgets);
    } catch (error) {
      console.error('Error saving budget to history:', error);
    }
  }, [localData]);

  // Render trend icon based on trend direction
  const renderTrendIcon = useCallback((trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  }, []);

  // Render alert icon based on type
  const renderAlertIcon = useCallback((type: 'warning' | 'error' | 'info') => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  }, []);

  // Render priority badge
  const renderPriorityBadge = useCallback((priority: 'low' | 'medium' | 'high' | 'critical') => {
    const variants = {
      low: 'secondary',
      medium: 'outline',
      high: 'destructive',
      critical: 'destructive'
    };
    
    return (
      <Badge variant={variants[priority] as any} className="text-xs">
        {priority.toUpperCase()}
      </Badge>
    );
  }, []);

  // Format currency
  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }, []);

  // Format percentage
  const formatPercentage = useCallback((value: number) => {
    return `${value.toFixed(1)}%`;
  }, []);

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calculator className="h-6 w-6" />
            Orçamento Consolidado
          </h2>
          <p className="text-muted-foreground">
            Visualização e ajuste de custos, margens e preço final
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={recalculateBudget}
            disabled={isRecalculating}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRecalculating ? 'animate-spin' : ''}`} />
            Recalcular
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowOptimizations(!showOptimizations)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Otimizações
          </Button>
        </div>
      </div>

      {/* Validation alerts */}
      {validation && validation.errors.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {validation.errors.map(error => error.message).join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {/* Budget health indicator */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Status do Orçamento</CardTitle>
            <Badge variant={budgetHealth.isHealthy ? "default" : "destructive"}>
              {budgetHealth.isHealthy ? (
                <><CheckCircle className="h-3 w-3 mr-1" /> Saudável</>
              ) : (
                <><AlertTriangle className="h-3 w-3 mr-1" /> Atenção</>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Custos de Equipe</span>
                <span>{formatPercentage(budgetHealth.teamCostPercentage)}</span>
              </div>
              <Progress value={budgetHealth.teamCostPercentage} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Impostos</span>
                <span>{formatPercentage(budgetHealth.taxPercentage)}</span>
              </div>
              <Progress value={budgetHealth.taxPercentage} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Margem</span>
                <span>{formatPercentage(budgetHealth.marginPercentage)}</span>
              </div>
              <Progress value={budgetHealth.marginPercentage} className="h-2" />
            </div>
          </div>
          
          {budgetHealth.warnings.length > 0 && (
            <div className="mt-4 space-y-1">
              {budgetHealth.warnings.map((warning, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-amber-600">
                  <AlertTriangle className="h-3 w-3" />
                  {warning}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main content tabs */}
      <Tabs value={activeView} onValueChange={(value: any) => setActiveView(value)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="details">Detalhamento</TabsTrigger>
          <TabsTrigger value="comparison">Comparação</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Custos de Equipe
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(localData.teamCosts.total)}</div>
                <p className="text-xs text-muted-foreground">
                  {formatPercentage(budgetHealth.teamCostPercentage)} do total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  Outros Custos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(localData.otherCosts)}</div>
                <p className="text-xs text-muted-foreground">
                  Infraestrutura: {formatCurrency(localData.infrastructureCosts)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Impostos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(localData.taxes.total)}</div>
                <p className="text-xs text-muted-foreground">
                  Taxa efetiva: {formatPercentage(budgetHealth.taxPercentage)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Preço Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(localData.totalPrice)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Margem: {formatPercentage(budgetHealth.marginPercentage)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4" />
                Modelo de Precificação Ativo
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <Badge variant="secondary">{PRICING_MODEL_LABELS[pricingModelConfig.model]}</Badge>
                <p className="text-sm text-muted-foreground">
                  Receita mensal estimada: {formatCurrency(selectedPricingModelComparison?.monthlyRevenue || 0)}
                </p>
              </div>
              <div className="text-sm">
                <div>Receita contrato: <strong>{formatCurrency(selectedPricingModelComparison?.contractRevenue || localData.totalPrice)}</strong></div>
                <div>Margem estimada: <strong>{formatPercentage(selectedPricingModelComparison?.estimatedMargin || budgetHealth.marginPercentage)}</strong></div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly breakdown chart */}
          <Card>
            <CardHeader>
              <CardTitle>Evolução Mensal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {localData.monthlyBreakdown.slice(0, 6).map((month, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium">
                        {month.month.toString().padStart(2, '0')}/{month.year}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Margem: {formatPercentage(month.margin)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{formatCurrency(month.revenue)}</div>
                      <div className="text-xs text-muted-foreground">
                        Lucro: {formatCurrency(month.profit)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Team costs breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Detalhamento - Custos de Equipe</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Salários</span>
                  <span className="font-medium">{formatCurrency(localData.teamCosts.salaries)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Benefícios</span>
                  <span className="font-medium">{formatCurrency(localData.teamCosts.benefits)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center font-medium">
                  <span>Total Equipe</span>
                  <span>{formatCurrency(localData.teamCosts.total)}</span>
                </div>
                
                {localData.teamCosts.breakdown.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium">Por Membro:</h4>
                    {localData.teamCosts.breakdown.map((member, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{member.memberName || `Membro ${index + 1}`}</span>
                        <span>{formatCurrency(member.monthlyCost)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tax breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Detalhamento - Impostos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Impostos Federais</span>
                  <span className="font-medium">{formatCurrency(localData.taxes.federal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Impostos Estaduais</span>
                  <span className="font-medium">{formatCurrency(localData.taxes.state)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Impostos Municipais</span>
                  <span className="font-medium">{formatCurrency(localData.taxes.municipal)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center font-medium">
                  <span>Total Impostos</span>
                  <span>{formatCurrency(localData.taxes.total)}</span>
                </div>
                
                {localData.taxes.breakdown.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium">Detalhado:</h4>
                    {localData.taxes.breakdown.map((tax, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{tax.taxName} ({formatPercentage(tax.rate)})</span>
                        <span>{formatCurrency(tax.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Comparison Tab */}
        <TabsContent value="comparison" className="space-y-6">
          {budgetComparison && budgetComparison.previousBudgets.length > 0 ? (
            <>
              {/* Budget Health Score */}
              {budgetHealthScore && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Score de Saúde do Orçamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-3xl font-bold">{budgetHealthScore.score}/100</div>
                      <Badge 
                        variant={
                          budgetHealthScore.category === 'excellent' ? 'default' :
                          budgetHealthScore.category === 'good' ? 'secondary' :
                          budgetHealthScore.category === 'fair' ? 'outline' :
                          'destructive'
                        }
                      >
                        {budgetHealthScore.category.toUpperCase()}
                      </Badge>
                    </div>
                    <Progress value={budgetHealthScore.score} className="mb-4" />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {budgetHealthScore.factors.map((factor: any, index: number) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{factor.name}</span>
                            <span>{factor.score}/100</span>
                          </div>
                          <Progress value={factor.score} className="h-2" />
                          <p className="text-xs text-muted-foreground">{factor.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Deviations from previous budgets */}
              <Card>
                <CardHeader>
                  <CardTitle>Variações em Relação ao Orçamento Anterior</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="text-sm font-medium">Custos de Equipe</div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(Math.abs(budgetComparison.deviations.teamCosts.absolute))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {renderTrendIcon(budgetComparison.deviations.teamCosts.trend)}
                        <span className="text-sm">
                          {budgetComparison.deviations.teamCosts.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="text-sm font-medium">Outros Custos</div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(Math.abs(budgetComparison.deviations.otherCosts.absolute))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {renderTrendIcon(budgetComparison.deviations.otherCosts.trend)}
                        <span className="text-sm">
                          {budgetComparison.deviations.otherCosts.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="text-sm font-medium">Impostos</div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(Math.abs(budgetComparison.deviations.taxes.absolute))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {renderTrendIcon(budgetComparison.deviations.taxes.trend)}
                        <span className="text-sm">
                          {budgetComparison.deviations.taxes.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="text-sm font-medium">Preço Total</div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(Math.abs(budgetComparison.deviations.totalPrice.absolute))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {renderTrendIcon(budgetComparison.deviations.totalPrice.trend)}
                        <span className="text-sm">
                          {budgetComparison.deviations.totalPrice.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="text-sm font-medium">Margem</div>
                        <div className="text-xs text-muted-foreground">
                          {Math.abs(budgetComparison.deviations.margin.absolute).toFixed(1)}pp
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {renderTrendIcon(budgetComparison.deviations.margin.trend)}
                        <span className="text-sm">
                          {budgetComparison.deviations.margin.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Alerts */}
              {budgetComparison.alerts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Alertas e Avisos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {budgetComparison.alerts.map((alert, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                          {renderAlertIcon(alert.type)}
                          <div className="flex-1">
                            <div className="font-medium text-sm">{alert.title}</div>
                            <div className="text-sm text-muted-foreground">{alert.message}</div>
                            {alert.suggestedAction && (
                              <div className="text-xs text-blue-600 mt-1">
                                Sugestão: {alert.suggestedAction}
                              </div>
                            )}
                          </div>
                          {alert.currentValue !== undefined && (
                            <div className="text-sm font-medium">
                              {alert.currentValue.toFixed(1)}
                              {alert.category === 'margin' ? '%' : ''}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              {budgetComparison.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recomendações de Otimização</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {budgetComparison.recommendations.map((recommendation, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium">{recommendation.title}</h4>
                                {renderPriorityBadge(recommendation.priority)}
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">
                                {recommendation.description}
                              </p>
                            </div>
                            <div className="text-right text-sm">
                              <div className="font-medium text-green-600">
                                {formatCurrency(recommendation.impact.financial)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Impacto potencial
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="text-sm font-medium">Ações recomendadas:</div>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              {recommendation.actionItems.map((action, actionIndex) => (
                                <li key={actionIndex} className="flex items-start gap-2">
                                  <span className="text-blue-500 mt-1">•</span>
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Tendências Históricas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Evolução da Margem</h4>
                      <div className="space-y-2">
                        {budgetComparison.trends.marginTrend.map((point, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{point.period}</span>
                            <span>{point.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-3">Evolução do Preço</h4>
                      <div className="space-y-2">
                        {budgetComparison.trends.priceTrend.map((point, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{point.period}</span>
                            <span>{point.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Save current budget button */}
              <div className="flex justify-center">
                <Button onClick={saveBudgetToHistory} variant="outline">
                  Salvar Orçamento no Histórico
                </Button>
              </div>
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Comparação com Orçamentos Anteriores</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Compare este orçamento com projetos similares
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum orçamento anterior encontrado</p>
                  <p className="text-sm mb-4">Salve este orçamento para começar a comparar</p>
                  <Button onClick={saveBudgetToHistory} variant="outline">
                    Salvar Orçamento no Histórico
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Margens</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="margin-type">Tipo de Margem</Label>
                    <Select
                      value={localData.margin.type}
                      onValueChange={(value: 'percentage' | 'fixed') => 
                        handleMarginChange('type', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentual</SelectItem>
                        <SelectItem value="fixed">Valor Fixo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="margin-value">
                      {localData.margin.type === 'percentage' ? 'Margem (%)' : 'Margem (R$)'}
                    </Label>
                    <Input
                      id="margin-value"
                      type="number"
                      value={localData.margin.value}
                      onChange={(e) => handleMarginChange('value', parseFloat(e.target.value) || 0)}
                      step={localData.margin.type === 'percentage' ? '0.1' : '100'}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="min-margin">Margem Mínima (%)</Label>
                    <Input
                      id="min-margin"
                      type="number"
                      value={localData.margin.minimumMargin}
                      onChange={(e) => handleMarginChange('minimumMargin', parseFloat(e.target.value) || 0)}
                      step="0.1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="target-margin">Margem Alvo (%)</Label>
                    <Input
                      id="target-margin"
                      type="number"
                      value={localData.margin.targetMargin}
                      onChange={(e) => handleMarginChange('targetMargin', parseFloat(e.target.value) || 0)}
                      step="0.1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="max-margin">Margem Máxima (%)</Label>
                    <Input
                      id="max-margin"
                      type="number"
                      value={localData.margin.maximumMargin}
                      onChange={(e) => handleMarginChange('maximumMargin', parseFloat(e.target.value) || 0)}
                      step="0.1"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Modelo de Precificação Moderno</h4>

                <div>
                  <Label htmlFor="pricing-model">Modelo</Label>
                  <Select
                    value={pricingModelConfig.model}
                    onValueChange={(value: PricingModelType) => handlePricingModelConfigChange('model', value)}
                  >
                    <SelectTrigger id="pricing-model">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cost_plus_margin">Custo + Margem</SelectItem>
                      <SelectItem value="per_agent">Por Agente</SelectItem>
                      <SelectItem value="per_user">Por Usuário</SelectItem>
                      <SelectItem value="per_ticket">Por Ticket</SelectItem>
                      <SelectItem value="hybrid">Híbrido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(pricingModelConfig.model === 'per_agent' || pricingModelConfig.model === 'hybrid') && (
                  <div>
                    <Label htmlFor="agent-rate">Valor por agente/mês (R$)</Label>
                    <Input
                      id="agent-rate"
                      type="number"
                      step="10"
                      value={pricingModelConfig.agentRateMonthly}
                      onChange={(e) => handlePricingModelConfigChange('agentRateMonthly', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Headcount atual considerado: {teamHeadcount} agentes
                    </p>
                  </div>
                )}

                {(pricingModelConfig.model === 'per_user' || pricingModelConfig.model === 'hybrid') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="projected-users">Usuários projetados</Label>
                      <Input
                        id="projected-users"
                        type="number"
                        value={pricingModelConfig.projectedUsers}
                        onChange={(e) => handlePricingModelConfigChange('projectedUsers', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="user-rate">Valor por usuário/mês (R$)</Label>
                      <Input
                        id="user-rate"
                        type="number"
                        step="1"
                        value={pricingModelConfig.userRateMonthly}
                        onChange={(e) => handlePricingModelConfigChange('userRateMonthly', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {(pricingModelConfig.model === 'per_ticket' || pricingModelConfig.model === 'hybrid') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="projected-tickets">Tickets projetados/mês</Label>
                      <Input
                        id="projected-tickets"
                        type="number"
                        value={pricingModelConfig.projectedTicketsMonthly}
                        onChange={(e) => handlePricingModelConfigChange('projectedTicketsMonthly', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="ticket-rate">Valor por ticket (R$)</Label>
                      <Input
                        id="ticket-rate"
                        type="number"
                        step="0.1"
                        value={pricingModelConfig.ticketRate}
                        onChange={(e) => handlePricingModelConfigChange('ticketRate', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {pricingModelConfig.model === 'hybrid' && (
                  <div>
                    <Label htmlFor="base-retainer">Retainer base mensal (R$)</Label>
                    <Input
                      id="base-retainer"
                      type="number"
                      step="100"
                      value={pricingModelConfig.baseRetainerMonthly}
                      onChange={(e) => handlePricingModelConfigChange('baseRetainerMonthly', e.target.value)}
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="minimum-charge">Piso mensal de cobrança (R$)</Label>
                  <Input
                    id="minimum-charge"
                    type="number"
                    step="100"
                    value={pricingModelConfig.minimumMonthlyCharge}
                    onChange={(e) => handlePricingModelConfigChange('minimumMonthlyCharge', e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-recalc">Recálculo Automático</Label>
                  <Switch id="auto-recalc" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-warnings">Mostrar Alertas</Label>
                  <Switch id="show-warnings" defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comparação de Modelos (Lado a Lado)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pricingModelComparisons.map((comparison) => (
                <div
                  key={comparison.model}
                  className={`p-3 border rounded-lg ${
                    comparison.model === pricingModelConfig.model ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <div className="font-medium">{comparison.label}</div>
                      <div className="text-xs text-muted-foreground">
                        Receita mensal: {formatCurrency(comparison.monthlyRevenue)}
                      </div>
                    </div>
                    <div className="text-sm">
                      <div>Contrato: <strong>{formatCurrency(comparison.contractRevenue)}</strong></div>
                      <div>Margem: <strong>{formatPercentage(comparison.estimatedMargin)}</strong></div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Optimization suggestions */}
          {showOptimizations && optimizationSuggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Sugestões de Otimização</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {optimizationSuggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                      <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                      <span className="text-sm">{suggestion}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
