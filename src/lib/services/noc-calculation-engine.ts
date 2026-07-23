/**
 * NOC Calculation Engine
 * Motor de cálculos para precificação NOC
 */

import { NOCPricingData, NOCCalculations, NOCCoverage, NOCServiceLevel, MonitoredDevice, NOCTeamMember } from '@/lib/types/noc-pricing';

export class NOCCalculationEngine {
  /**
   * Calcula todos os valores do projeto NOC
   */
  static calculateAll(data: NOCPricingData): NOCCalculations {
    // Custos mensais
    const monthlyTeamCost = this.calculateMonthlyTeamCost(data.team);
    const monthlyOperationalCost = this.calculateMonthlyOperationalCost(data.operationalCosts);
    const monthlyInfrastructureCost = this.calculateMonthlyInfrastructureCost(data);
    const monthlyLicenseCost = this.calculateMonthlyLicenseCost(data);
    const monthlySOCCost = this.calculateMonthlySOCCost(data);
    const monthlySIEMCost = this.calculateMonthlySIEMCost(data);
    const monthlySecurityCost = monthlySOCCost + monthlySIEMCost;
    const monthlyTotalCost = monthlyTeamCost + monthlyOperationalCost + monthlyInfrastructureCost + monthlyLicenseCost + monthlySecurityCost;

    // Custos por unidade
    const costPerDevice = data.totalDevices > 0 ? monthlyTotalCost / data.totalDevices : 0;
    const costPerMetric = data.totalMetrics > 0 ? monthlyTotalCost / data.totalMetrics : 0;
    const costPerAlert = data.estimatedAlertsPerMonth > 0 ? monthlyTotalCost / data.estimatedAlertsPerMonth : 0;
    const totalSecurityAssets = this.getTotalSecurityAssets(data);
    const costPerSecurityAsset = totalSecurityAssets > 0 ? monthlySecurityCost / totalSecurityAssets : 0;
    const costPerGBIngested = data.security?.siem?.ingestionGBPerDay > 0 ? monthlySIEMCost / (data.security.siem.ingestionGBPerDay * 30) : 0;

    // Custos anuais
    const annualTotalCost = monthlyTotalCost * 12;

    // Aplicar margens
    const profitMargin = data.variables.profitMargin / 100;
    const riskMargin = data.variables.riskMargin / 100;
    const totalMargin = 1 + profitMargin + riskMargin;
    const priceWithMargin = monthlyTotalCost * totalMargin;

    // Aplicar impostos
    const totalTaxRate = (
      data.taxes.federalTax +
      data.taxes.stateTax +
      data.taxes.municipalTax +
      data.taxes.socialCharges
    ) / 100;
    const priceWithTaxes = priceWithMargin / (1 - totalTaxRate);

    const marketSOCMonthly = this.getMarketSOCMonthly(data);
    const marketSIEMMonthly = this.getMarketSIEMMonthly(data);
    const enabledServices = data.security?.enabledServices || ['noc'];
    const marketNOCMonthly = enabledServices.includes('noc')
      ? this.getMarketAverage(data.project.serviceLevel, data.project.coverage, data.totalDevices) * Math.max(data.totalDevices, 1)
      : 0;
    const marketSuggestedMonthly = marketNOCMonthly + marketSOCMonthly + marketSIEMMonthly;

    // Preços finais
    const finalMonthlyPrice = Math.max(priceWithTaxes, marketSuggestedMonthly);
    const finalAnnualPrice = finalMonthlyPrice * 12;

    // Métricas
    const roi = this.calculateROI(finalAnnualPrice, annualTotalCost);
    const paybackMonths = this.calculatePayback(monthlyTotalCost, finalMonthlyPrice);
    const profitability = ((finalMonthlyPrice - monthlyTotalCost) / finalMonthlyPrice) * 100;

    // Comparação de mercado
    const marketAverage = marketSuggestedMonthly;
    const competitiveness = this.assessCompetitiveness(finalMonthlyPrice, marketAverage);

    return {
      monthlyTeamCost,
      monthlyOperationalCost,
      monthlyInfrastructureCost,
      monthlyLicenseCost,
      monthlySOCCost,
      monthlySIEMCost,
      monthlySecurityCost,
      monthlyTotalCost,
      costPerDevice,
      costPerMetric,
      costPerAlert,
      costPerSecurityAsset,
      costPerGBIngested,
      annualTotalCost,
      priceWithMargin,
      priceWithTaxes,
      finalMonthlyPrice,
      finalAnnualPrice,
      roi,
      paybackMonths,
      profitability,
      marketAverage,
      marketSOCMonthly,
      marketSIEMMonthly,
      marketSuggestedMonthly,
      competitiveness
    };
  }

  private static getCoverageMultiplier(coverage: NOCCoverage): number {
    const coverageMultipliers: Record<NOCCoverage, number> = {
      '8x5': 0.65,
      '12x5': 0.8,
      '12x6': 0.9,
      '24x5': 1.1,
      '24x7': 1.35
    };
    return coverageMultipliers[coverage] || 1;
  }

  private static getTotalSecurityAssets(data: NOCPricingData): number {
    const soc = data.security?.soc;
    if (!soc?.enabled) return 0;
    return (
      (soc.endpoints || 0) +
      (soc.servers || 0) +
      (soc.networkDevices || 0) +
      (soc.cloudWorkloads || 0) +
      (soc.identities || 0)
    );
  }

  private static calculateMonthlySOCCost(data: NOCPricingData): number {
    const soc = data.security?.soc;
    if (!soc?.enabled) return 0;

    const assets = this.getTotalSecurityAssets(data);
    const coverageMultiplier = this.getCoverageMultiplier(data.project.coverage);
    const serviceMultiplier = this.getServiceLevelMultiplier(data.project.serviceLevel);
    const assetMonitoring = assets * (soc.pricePerAsset || 0) * coverageMultiplier * serviceMultiplier;
    const mdr = soc.mdrEnabled ? Math.max(assets * 8, 1500) : 0;
    const threatHunting = (soc.threatHuntingHours || 0) * (soc.analystHourRate || 0);
    const incidentRetainer = (soc.incidentResponseHours || 0) * (soc.analystHourRate || 0) * 1.25;
    const vulnerabilityTriage = soc.vulnerabilityTriage ? Math.max(assets * 3, 750) : 0;
    const compliance = (soc.complianceReports || 0) * 450;
    const onboarding = this.calculateMonthlySetup(data);

    return Math.max(soc.minimumMonthly || 0, assetMonitoring + mdr + threatHunting + incidentRetainer + vulnerabilityTriage + compliance + onboarding);
  }

  private static calculateMonthlySIEMCost(data: NOCPricingData): number {
    const siem = data.security?.siem;
    if (!siem?.enabled) return 0;

    const billableGBPerDay = Math.max(0, (siem.ingestionGBPerDay || 0) - (siem.includedGBPerDay || 0));
    const ingestion = billableGBPerDay * 30 * (siem.pricePerGBIngested || 0);
    const hotRetentionFactor = Math.max(1, (siem.retentionHotDays || 30) / 90);
    const archiveGB = (siem.ingestionGBPerDay || 0) * 30 * Math.max(0, siem.retentionArchiveMonths || 0);
    const storage = archiveGB * (siem.storagePerGBMonth || 0) * (siem.dataLakeEnabled ? 0.35 : 1);
    const rules = (siem.correlationRules || 0) * (siem.ruleMonthlyCost || 0);
    const parsers = (siem.customParsers || 0) * (siem.parserMonthlyCost || 0);
    const platformMultiplier = this.getSIEMPlatformMultiplier(siem.platform);
    const logSourceComplexity = Math.max(0, (siem.logSources || 0) - 5) * 120;
    const onboarding = this.calculateMonthlySetup(data) * 0.5;

    return ((siem.baseMonthly || 0) + ingestion + storage + rules + parsers + logSourceComplexity + onboarding) * hotRetentionFactor * platformMultiplier;
  }

  private static calculateMonthlySetup(data: NOCPricingData): number {
    const setup = data.security?.setup;
    const months = Math.max(1, setup?.amortizationMonths || data.project.contractDuration || 12);
    return (setup?.onboardingFee || 0) / months;
  }

  private static getSIEMPlatformMultiplier(platform: string): number {
    const multipliers: Record<string, number> = {
      sentinel: 1.05,
      splunk: 1.35,
      elastic: 0.9,
      qradar: 1.2,
      'google-secops': 1.15,
      custom: 1
    };
    return multipliers[platform] || 1;
  }

  private static getMarketSOCMonthly(data: NOCPricingData): number {
    const soc = data.security?.soc;
    if (!soc?.enabled) return 0;
    const assets = this.getTotalSecurityAssets(data);
    const coverageMultiplier = this.getCoverageMultiplier(data.project.coverage);
    const serviceMultiplier = data.project.serviceLevel === 'premium' ? 1.25 : data.project.serviceLevel === 'advanced' ? 1.12 : 1;
    const marketPerAsset = 95;
    return Math.max(9000, assets * marketPerAsset * coverageMultiplier * serviceMultiplier);
  }

  private static getMarketSIEMMonthly(data: NOCPricingData): number {
    const siem = data.security?.siem;
    if (!siem?.enabled) return 0;
    const gbPerMonth = Math.max(0, siem.ingestionGBPerDay || 0) * 30;
    const managedRatePerGB = 18;
    const platformBase = siem.platform === 'splunk' ? 9000 : siem.platform === 'sentinel' ? 6500 : 5000;
    return Math.max(7000, platformBase + (gbPerMonth * managedRatePerGB) + ((siem.logSources || 0) * 120));
  }

  /**
   * Calcula custo mensal da equipe
   */
  private static calculateMonthlyTeamCost(team: NOCTeamMember[]): number {
    return team.reduce((total, member) => {
      const baseCost = member.monthlySalary + member.benefits;
      
      // Adiciona custo de cobertura (turnos noturnos e finais de semana custam mais)
      let coverageMultiplier = 1;
      if (member.shift === 'night') {
        coverageMultiplier = 1.3; // 30% adicional para turno noturno
      }
      
      return total + (baseCost * coverageMultiplier);
    }, 0);
  }

  /**
   * Calcula custos operacionais mensais
   */
  private static calculateMonthlyOperationalCost(costs: any): number {
    return (
      costs.facilityCosts +
      costs.utilitiesCosts +
      (costs.trainingCosts / 12) + // Treinamento anualizado
      (costs.certificationCosts / 12) + // Certificações anualizadas
      costs.contingencyCosts
    );
  }

  /**
   * Calcula custos de infraestrutura mensais
   */
  private static calculateMonthlyInfrastructureCost(data: NOCPricingData): number {
    const costs = data.operationalCosts;
    
    // Custos base de infraestrutura
    let infraCost = costs.serverCosts + costs.storageCosts + costs.networkCosts;
    
    // Ajusta baseado no número de dispositivos e métricas
    const deviceFactor = Math.log10(data.totalDevices + 1) * 0.1;
    const metricFactor = Math.log10(data.totalMetrics + 1) * 0.05;
    
    infraCost *= (1 + deviceFactor + metricFactor);
    
    // Ajusta baseado no nível de serviço
    const serviceLevelMultiplier = this.getServiceLevelMultiplier(data.project.serviceLevel);
    infraCost *= serviceLevelMultiplier;
    
    return infraCost;
  }

  /**
   * Calcula custos de licenças mensais
   */
  private static calculateMonthlyLicenseCost(data: NOCPricingData): number {
    let licenseCost = data.operationalCosts.monitoringLicenses;
    
    // Adiciona custo de integrações
    licenseCost += data.operationalCosts.integrationCosts;
    
    // Ajusta baseado nas ferramentas selecionadas
    const toolsMultiplier = this.getToolsMultiplier(data.monitoring.tools);
    licenseCost *= toolsMultiplier;
    
    // Adiciona custo de IA se habilitado
    if (data.monitoring.aiEnabled) {
      licenseCost *= 1.5; // 50% adicional para IA
    }
    
    return licenseCost;
  }

  /**
   * Multiplicador baseado no nível de serviço
   */
  private static getServiceLevelMultiplier(level: NOCServiceLevel): number {
    const multipliers = {
      basic: 0.7,
      standard: 1.0,
      advanced: 1.4,
      premium: 2.0
    };
    return multipliers[level] || 1.0;
  }

  /**
   * Multiplicador baseado nas ferramentas
   */
  private static getToolsMultiplier(tools: string[]): number {
    const toolCosts: Record<string, number> = {
      zabbix: 0.5, // Open source
      nagios: 0.5,
      prometheus: 0.5,
      grafana: 0.5,
      prtg: 1.0,
      solarwinds: 1.2,
      datadog: 1.5,
      'new-relic': 1.5,
      dynatrace: 2.0,
      splunk: 2.5,
      elastic: 1.3,
      sentinel: 1.6,
      qradar: 1.9,
      crowdstrike: 1.7,
      defender: 1.4,
      custom: 1.0
    };
    
    const avgCost = tools.reduce((sum, tool) => sum + (toolCosts[tool] || 1.0), 0) / tools.length;
    return avgCost;
  }

  /**
   * Calcula ROI
   */
  private static calculateROI(revenue: number, cost: number): number {
    if (cost === 0) return 0;
    return ((revenue - cost) / cost) * 100;
  }

  /**
   * Calcula payback em meses
   */
  private static calculatePayback(monthlyCost: number, monthlyRevenue: number): number {
    const monthlyProfit = monthlyRevenue - monthlyCost;
    if (monthlyProfit <= 0) return 0;
    
    // Considera investimento inicial (setup)
    const initialInvestment = monthlyCost * 2; // 2 meses de custo como investimento inicial
    return initialInvestment / monthlyProfit;
  }

  /**
   * Obtém média de mercado
   */
  private static getMarketAverage(
    serviceLevel: NOCServiceLevel,
    coverage: NOCCoverage,
    deviceCount: number
  ): number {
    // Valores base por dispositivo (em BRL)
    const baseValues: Record<NOCServiceLevel, number> = {
      basic: 50,
      standard: 100,
      advanced: 200,
      premium: 400
    };
    
    // Multiplicador de cobertura
    const coverageMultipliers: Record<NOCCoverage, number> = {
      '8x5': 0.6,
      '12x5': 0.8,
      '12x6': 0.9,
      '24x5': 1.1,
      '24x7': 1.3
    };
    
    const basePrice = baseValues[serviceLevel] || 100;
    const coverageMultiplier = coverageMultipliers[coverage] || 1.0;
    
    // Economia de escala
    let scaleDiscount = 1.0;
    if (deviceCount > 100) scaleDiscount = 0.9;
    if (deviceCount > 500) scaleDiscount = 0.8;
    if (deviceCount > 1000) scaleDiscount = 0.7;
    
    return basePrice * coverageMultiplier * scaleDiscount;
  }

  /**
   * Avalia competitividade
   */
  private static assessCompetitiveness(
    pricePerDevice: number,
    marketAverage: number
  ): 'low' | 'competitive' | 'high' {
    if (marketAverage <= 0) return 'competitive';
    const ratio = pricePerDevice / marketAverage;
    
    if (ratio < 0.85) return 'low'; // Muito abaixo do mercado
    if (ratio > 1.15) return 'high'; // Muito acima do mercado
    return 'competitive'; // Competitivo
  }

  /**
   * Calcula dimensionamento da equipe recomendado
   */
  static calculateRecommendedTeamSize(
    deviceCount: number,
    coverage: NOCCoverage,
    serviceLevel: NOCServiceLevel
  ): {
    l1Analysts: number;
    l2Analysts: number;
    l3Analysts: number;
    engineers: number;
    coordinators: number;
    total: number;
  } {
    // Dispositivos por analista (varia por nível)
    const devicesPerAnalyst: Record<NOCServiceLevel, number> = {
      basic: 200,
      standard: 150,
      advanced: 100,
      premium: 50
    };
    
    const ratio = devicesPerAnalyst[serviceLevel] || 150;
    const baseAnalysts = Math.ceil(deviceCount / ratio);
    
    // Multiplicador de cobertura (turnos)
    const coverageMultipliers: Record<NOCCoverage, number> = {
      '8x5': 1,
      '12x5': 1.5,
      '12x6': 1.8,
      '24x5': 3,
      '24x7': 4
    };
    
    const totalAnalysts = Math.ceil(baseAnalysts * (coverageMultipliers[coverage] || 1));
    
    // Distribuição por nível
    const l1Analysts = Math.ceil(totalAnalysts * 0.5); // 50% L1
    const l2Analysts = Math.ceil(totalAnalysts * 0.3); // 30% L2
    const l3Analysts = Math.ceil(totalAnalysts * 0.2); // 20% L3
    
    // Engenheiros e coordenadores
    const engineers = Math.max(1, Math.ceil(totalAnalysts / 10));
    const coordinators = Math.max(1, Math.ceil(totalAnalysts / 15));
    
    return {
      l1Analysts,
      l2Analysts,
      l3Analysts,
      engineers,
      coordinators,
      total: l1Analysts + l2Analysts + l3Analysts + engineers + coordinators
    };
  }

  /**
   * Calcula estimativa de alertas por mês
   */
  static calculateEstimatedAlerts(
    devices: MonitoredDevice[],
    serviceLevel: NOCServiceLevel
  ): number {
    // Alertas base por dispositivo por mês
    const baseAlertsPerDevice: Record<NOCServiceLevel, number> = {
      basic: 5,
      standard: 10,
      advanced: 20,
      premium: 30
    };
    
    const baseRate = baseAlertsPerDevice[serviceLevel] || 10;
    
    return devices.reduce((total, device) => {
      let deviceAlerts = device.quantity * baseRate;
      
      // Ajusta por criticidade
      const criticalityMultipliers = {
        low: 0.5,
        medium: 1.0,
        high: 1.5,
        critical: 2.0
      };
      
      deviceAlerts *= criticalityMultipliers[device.criticality] || 1.0;
      
      return total + deviceAlerts;
    }, 0);
  }

  /**
   * Calcula total de métricas
   */
  static calculateTotalMetrics(devices: MonitoredDevice[]): number {
    return devices.reduce((total, device) => {
      return total + (device.quantity * device.metricsCount);
    }, 0);
  }
}
