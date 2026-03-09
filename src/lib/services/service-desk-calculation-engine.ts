// @ts-nocheck
import {
  ServiceDeskData,
  TeamMember,
  WorkSchedule,
  TaxConfiguration,
  MarketVariables,
  ConsolidatedBudget,
  TeamCostCalculation,
  TeamMemberCostCalculation,
  TaxCalculationResult,
  TaxBreakdown,
  ROIAnalysis,
  PaybackAnalysis,
  MarginAnalysis,
  CashFlowPeriod,
  MarginTrendPoint,
  ScenarioConfig,
  NegotiationScenario,
  MarginConfiguration,
  AdditionalCost,
  MonthlyBudget,
  TeamCostSummary,
  TaxSummary
} from '../types/service-desk-pricing';
import { ServiceDeskCalculationCache, cached } from '../utils/calculation-cache';

/**
 * Core calculation engine for Service Desk pricing system
 * Handles all financial calculations including team costs, taxes, margins, ROI, and scenario analysis
 * Enhanced with caching for improved performance
 */
export class ServiceDeskCalculationEngine {
  private cache: ServiceDeskCalculationCache;
  private static readonly WEEKS_PER_MONTH = 52 / 12;

  constructor() {
    this.cache = ServiceDeskCalculationCache.getInstance();
  }
  
  /**
   * Calculate total team costs including salaries, benefits, and special rates
   */
  calculateTeamCosts(team: TeamMember[], schedules: WorkSchedule[]): TeamCostCalculation {
    // Check cache first
    const cachedResult = this.cache.getTeamCosts({ team, schedules });
    if (cachedResult) {
      return cachedResult;
    }
    const breakdown: TeamMemberCostCalculation[] = [];
    let totalMonthlyCost = 0;
    let totalHours = 0;

    team.forEach(member => {
      const memberCalculation = this.calculateMemberCost(member, schedules);
      breakdown.push(memberCalculation);
      totalMonthlyCost += memberCalculation.totalCost;
      const workload = this.resolveMemberWorkload(member);
      const quantity = this.getMemberQuantity(member);
      totalHours += workload * ServiceDeskCalculationEngine.WEEKS_PER_MONTH * quantity;
    });

    const totalAnnualCost = totalMonthlyCost * 12;
    // FIXED: Validate division by zero
    const costPerHour = totalHours > 0 ? totalMonthlyCost / totalHours : 0;

    const result = {
      totalMonthlyCost,
      totalAnnualCost,
      costPerHour,
      breakdown
    };

    // Cache the result
    this.cache.cacheTeamCosts({ team, schedules }, result);
    return result;
  }

  /**
   * Calculate individual team member costs
   */
  private calculateMemberCost(member: TeamMember, schedules: WorkSchedule[]): TeamMemberCostCalculation {
    const quantity = this.getMemberQuantity(member);
    const salaryPerMember = this.resolveMemberSalary(member);
    const benefitsPerMember = this.calculateBenefits(member, salaryPerMember);
    
    // Calculate special shift multipliers
    const shiftMultiplier = this.calculateShiftMultiplier(member, schedules);
    const adjustedSalary = salaryPerMember * shiftMultiplier * quantity;
    const benefits = benefitsPerMember * quantity;
    
    const totalCost = adjustedSalary + benefits;
    const monthlyHours = this.resolveMemberWorkload(member) * ServiceDeskCalculationEngine.WEEKS_PER_MONTH * quantity;
    const hourlyRate = monthlyHours > 0 ? totalCost / monthlyHours : 0;
    const annualCost = totalCost * 12;

    return {
      memberId: member.id,
      baseSalary: adjustedSalary,
      benefits,
      totalCost,
      hourlyRate,
      annualCost
    };
  }

  /**
   * Calculate benefits for a team member
   * FIXED: Use configured values properly, with correct defaults
   */
  private calculateBenefits(member: TeamMember, salaryBase: number): number {
    const benefits = member.benefits || {
      healthInsurance: 0,
      mealVoucher: 0,
      transportVoucher: 0,
      lifeInsurance: 0,
      vacation: 8.33,
      thirteenthSalary: 8.33,
      fgts: 8,
      inss: 0,
      otherBenefits: []
    };
    let totalBenefits = 0;

    // Fixed benefits
    totalBenefits += benefits.healthInsurance || 0;
    totalBenefits += benefits.mealVoucher || 0;
    totalBenefits += benefits.transportVoucher || 0;
    totalBenefits += benefits.lifeInsurance || 0;

    // Percentage-based benefits - use configured values with proper defaults
    const vacationRate = benefits.vacation ?? 8.33; // 1/12 of year
    const thirteenthRate = benefits.thirteenthSalary ?? 8.33; // 1/12 of year
    const fgtsRate = benefits.fgts ?? 8; // Default 8% FGTS
    const inssRate = benefits.inss ?? 0; // Default 0% (employer doesn't pay)

    totalBenefits += salaryBase * (vacationRate / 100);
    totalBenefits += salaryBase * (thirteenthRate / 100);
    totalBenefits += salaryBase * (fgtsRate / 100);
    totalBenefits += salaryBase * (inssRate / 100);

    // Custom benefits
    benefits.otherBenefits?.forEach(benefit => {
      if (benefit.type === 'fixed') {
        totalBenefits += benefit.value;
      } else {
        totalBenefits += salaryBase * (benefit.value / 100);
      }
    });

    return totalBenefits;
  }

  /**
   * Calculate shift multiplier based on special rates
   */
  private calculateShiftMultiplier(member: TeamMember, schedules: WorkSchedule[]): number {
    let multiplier = 1;
    
    schedules.forEach(schedule => {
      const assignedShifts = schedule.shifts.filter(shift =>
        this.isMemberAssignedToShift(member, shift.teamMembers)
      );

      assignedShifts.forEach(shift => {
        if (shift.isSpecialShift) {
          multiplier = Math.max(multiplier, shift.multiplier);
        }
      });
      
      schedule.specialRates.forEach(rate => {
        const appliesToAssignedShift = assignedShifts.some(shift =>
          rate.applicableShifts.length === 0 || rate.applicableShifts.includes(shift.id)
        );

        if (appliesToAssignedShift) {
          multiplier = Math.max(multiplier, rate.multiplier);
        }
      });
    });

    return multiplier;
  }

  private isMemberAssignedToShift(member: TeamMember, assignedMemberIds: string[]): boolean {
    const memberId = member.id;
    return assignedMemberIds.includes(memberId) ||
      assignedMemberIds.some(assignedId => assignedId.startsWith(`${memberId}-`));
  }

  private getMemberQuantity(member: TeamMember): number {
    const quantity = (member as any).quantity;
    return Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1;
  }

  private resolveMemberWorkload(member: TeamMember): number {
    if (typeof member.workload === 'number') {
      return member.workload > 0 ? member.workload : 0;
    }

    const workingHours = (member as any).workingHours;
    if (workingHours === 6) {
      return 30;
    }
    if (workingHours === 8) {
      return 40;
    }

    return 40;
  }

  private resolveMemberSalary(member: TeamMember): number {
    if (typeof member.salary === 'number' && member.salary > 0) {
      return member.salary;
    }

    const role = `${member.role || (member as any).jobPositionId || ''}`.toLowerCase();

    if (role.includes('n1') || role.includes('pos-1')) {
      return 1780;
    }
    if (role.includes('n2') || role.includes('pos-2')) {
      return 2880;
    }
    if (role.includes('n3') || role.includes('pos-3')) {
      return 7380;
    }
    if (role.includes('lider') || role.includes('líder') || role.includes('pos-4')) {
      return 5200;
    }
    if (role.includes('coordenador') || role.includes('gest') || role.includes('pos-5')) {
      return 9800;
    }

    return 3000;
  }

  /**
   * Calculate coverage analysis for work schedules
   */
  calculateCoverageAnalysis(schedules: WorkSchedule[]): import('../types/service-desk-pricing').CoverageAnalysis {
    let totalHours = 168; // 24h * 7 days
    let coveredHours = 0;
    const gaps: import('../types/service-desk-pricing').CoverageGap[] = [];
    const recommendations: string[] = [];

    // Track coverage by hour and day
    const coverageMatrix: boolean[][] = Array(7).fill(null).map(() => Array(24).fill(false));

    // Mark covered hours
    schedules.forEach(schedule => {
      schedule.shifts.forEach(shift => {
        const startHour = parseInt(shift.startTime.split(':')[0]);
        const endHour = parseInt(shift.endTime.split(':')[0]);
        
        shift.daysOfWeek.forEach(dayOfWeek => {
          if (endHour > startHour) {
            // Same day shift
            for (let hour = startHour; hour < endHour; hour++) {
              coverageMatrix[dayOfWeek][hour] = true;
            }
          } else {
            // Overnight shift
            for (let hour = startHour; hour < 24; hour++) {
              coverageMatrix[dayOfWeek][hour] = true;
            }
            for (let hour = 0; hour < endHour; hour++) {
              const nextDay = (dayOfWeek + 1) % 7;
              coverageMatrix[nextDay][hour] = true;
            }
          }
        });
      });
    });

    // Count covered hours
    coverageMatrix.forEach(day => {
      day.forEach(hour => {
        if (hour) coveredHours++;
      });
    });

    // Identify gaps
    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    coverageMatrix.forEach((day, dayIndex) => {
      let gapStart = -1;
      day.forEach((covered, hour) => {
        if (!covered && gapStart === -1) {
          gapStart = hour;
        } else if (covered && gapStart !== -1) {
          gaps.push({
            startTime: `${gapStart.toString().padStart(2, '0')}:00`,
            endTime: `${hour.toString().padStart(2, '0')}:00`,
            daysOfWeek: [dayIndex],
            severity: this.calculateGapSeverity(gapStart, hour),
            suggestedSolution: `Considere adicionar cobertura para ${dayNames[dayIndex]} das ${gapStart}h às ${hour}h`
          });
          gapStart = -1;
        }
      });
      
      // Handle gap that extends to end of day
      if (gapStart !== -1) {
        gaps.push({
          startTime: `${gapStart.toString().padStart(2, '0')}:00`,
          endTime: '24:00',
          daysOfWeek: [dayIndex],
          severity: this.calculateGapSeverity(gapStart, 24),
          suggestedSolution: `Considere adicionar cobertura para ${dayNames[dayIndex]} das ${gapStart}h às 24h`
        });
      }
    });

    const coveragePercentage = totalHours > 0 ? (coveredHours / totalHours) * 100 : 0;

    // Generate recommendations
    if (schedules.length === 0) {
      recommendations.push('Configure pelo menos uma escala de trabalho');
    } else if (coveragePercentage < 30) {
      recommendations.push('Cobertura muito baixa - adicione mais turnos');
    } else if (coveragePercentage < 60) {
      recommendations.push('Cobertura baixa - considere expandir horários');
    } else if (coveragePercentage < 80) {
      recommendations.push('Cobertura adequada - considere otimizar horários');
    } else {
      recommendations.push('Boa cobertura de horários');
    }

    // Check for weekend coverage
    const weekendCoverage = (coverageMatrix[0].filter(h => h).length + coverageMatrix[6].filter(h => h).length) / 48 * 100;
    if (weekendCoverage < 50) {
      recommendations.push('Considere melhorar a cobertura de fins de semana');
    }

    // Check for night coverage (22:00 - 06:00)
    let nightCoverage = 0;
    coverageMatrix.forEach(day => {
      for (let hour = 22; hour < 24; hour++) {
        if (day[hour]) nightCoverage++;
      }
      for (let hour = 0; hour < 6; hour++) {
        if (day[hour]) nightCoverage++;
      }
    });
    const nightCoveragePercentage = (nightCoverage / (8 * 7)) * 100;
    if (nightCoveragePercentage < 30) {
      recommendations.push('Considere adicionar cobertura noturna');
    }

    return {
      totalHours,
      coveredHours,
      coveragePercentage: Math.min(coveragePercentage, 100),
      gaps,
      recommendations
    };
  }

  /**
   * Calculate gap severity based on time range
   */
  private calculateGapSeverity(startHour: number, endHour: number): 'low' | 'medium' | 'high' | 'critical' {
    const gapDuration = endHour - startHour;
    
    // Business hours (8-18) are critical
    if ((startHour >= 8 && startHour < 18) || (endHour > 8 && endHour <= 18)) {
      return gapDuration > 4 ? 'critical' : 'high';
    }
    
    // Evening hours (18-22) are medium priority
    if ((startHour >= 18 && startHour < 22) || (endHour > 18 && endHour <= 22)) {
      return gapDuration > 2 ? 'medium' : 'low';
    }
    
    // Night hours (22-6) are low priority unless very long
    return gapDuration > 6 ? 'medium' : 'low';
  }

  /**
   * Calculate shift costs including special rates and multipliers
   */
  calculateShiftCosts(schedules: WorkSchedule[], team: TeamMember[]): {
    totalShiftCosts: number;
    shiftBreakdown: Array<{
      scheduleId: string;
      scheduleName: string;
      shiftCosts: Array<{
        shiftId: string;
        shiftName: string;
        memberCosts: Array<{
          memberId: string;
          memberName: string;
          baseCost: number;
          multipliedCost: number;
          multiplier: number;
        }>;
        totalCost: number;
      }>;
      totalScheduleCost: number;
    }>;
  } {
    let totalShiftCosts = 0;
    const shiftBreakdown: any[] = [];

    schedules.forEach(schedule => {
      let totalScheduleCost = 0;
      const shiftCosts: any[] = [];

      schedule.shifts.forEach(shift => {
        let totalShiftCost = 0;
        const memberCosts: any[] = [];

        shift.teamMembers.forEach(memberId => {
          const member = team.find(m => m.id === memberId || memberId.startsWith(`${m.id}-`));
          if (member) {
            const memberSalary = this.resolveMemberSalary(member);
            const memberWorkload = this.resolveMemberWorkload(member);
            const baseCost = member.costPerHour || (
              memberWorkload > 0
                ? memberSalary / (memberWorkload * ServiceDeskCalculationEngine.WEEKS_PER_MONTH)
                : 0
            );
            let multiplier = 1;

            // Apply shift multiplier
            if (shift.isSpecialShift) {
              multiplier = Math.max(multiplier, shift.multiplier);
            }

            // Apply special rates
            schedule.specialRates.forEach(rate => {
              if (rate.applicableShifts.includes(shift.id) || rate.applicableShifts.length === 0) {
                multiplier = Math.max(multiplier, rate.multiplier);
              }
            });

            const multipliedCost = baseCost * multiplier;
            
            // Calculate hours per week for this shift
            const startHour = parseInt(shift.startTime.split(':')[0]);
            const endHour = parseInt(shift.endTime.split(':')[0]);
            const shiftHours = endHour > startHour ? endHour - startHour : (24 - startHour) + endHour;
            const weeklyHours = shiftHours * shift.daysOfWeek.length;
            const weeklyCost = multipliedCost * weeklyHours;

            memberCosts.push({
              memberId: member.id,
              memberName: member.name || member.role || (member as any).jobPositionId || member.id,
              baseCost,
              multipliedCost,
              multiplier,
              weeklyCost
            });

            totalShiftCost += weeklyCost;
          }
        });

        shiftCosts.push({
          shiftId: shift.id,
          shiftName: shift.name,
          memberCosts,
          totalCost: totalShiftCost
        });

        totalScheduleCost += totalShiftCost;
      });

      shiftBreakdown.push({
        scheduleId: schedule.id,
        scheduleName: schedule.name,
        shiftCosts,
        totalScheduleCost
      });

      totalShiftCosts += totalScheduleCost;
    });

    return {
      totalShiftCosts,
      shiftBreakdown
    };
  }

  /**
   * Calculate taxes based on configuration and revenue
   */
  calculateTaxes(revenue: number, taxConfig: TaxConfiguration): TaxCalculationResult {
    // Check cache first
    const cachedResult = this.cache.getTaxCalculations({ revenue, taxConfig });
    if (cachedResult) {
      return cachedResult;
    }
    const breakdown: TaxBreakdown[] = [];
    let totalTaxes = 0;

    // Federal taxes
    const pisAmount = revenue * (taxConfig.pis / 100);
    const cofinsAmount = revenue * (taxConfig.cofins / 100);
    const irAmount = revenue * (taxConfig.ir / 100);
    const csllAmount = revenue * (taxConfig.csll / 100);

    breakdown.push(
      { taxName: 'PIS', rate: taxConfig.pis, base: revenue, amount: pisAmount },
      { taxName: 'COFINS', rate: taxConfig.cofins, base: revenue, amount: cofinsAmount },
      { taxName: 'IR', rate: taxConfig.ir, base: revenue, amount: irAmount },
      { taxName: 'CSLL', rate: taxConfig.csll, base: revenue, amount: csllAmount }
    );

    totalTaxes += pisAmount + cofinsAmount + irAmount + csllAmount;

    // State taxes
    const icmsAmount = revenue * (taxConfig.icms / 100);
    breakdown.push({ taxName: 'ICMS', rate: taxConfig.icms, base: revenue, amount: icmsAmount });
    totalTaxes += icmsAmount;

    // Municipal taxes
    const issAmount = revenue * (taxConfig.iss / 100);
    breakdown.push({ taxName: 'ISS', rate: taxConfig.iss, base: revenue, amount: issAmount });
    totalTaxes += issAmount;

    // Custom taxes
    taxConfig.customTaxes.forEach(tax => {
      let taxBase = revenue;
      if (tax.calculationBase === 'profit') {
        taxBase = revenue * 0.2; // Simplified profit calculation
      }
      
      const amount = tax.calculationBase === 'fixed' ? tax.rate : taxBase * (tax.rate / 100);
      breakdown.push({ taxName: tax.name, rate: tax.rate, base: taxBase, amount });
      totalTaxes += amount;
    });

    const effectiveRate = revenue > 0 ? (totalTaxes / revenue) * 100 : 0;

    const result = {
      totalTaxes,
      effectiveRate,
      breakdown,
      optimizationSuggestions: this.generateTaxOptimizationSuggestions(taxConfig, effectiveRate)
    };

    // Cache the result
    this.cache.cacheTaxCalculations({ revenue, taxConfig }, result);
    return result;
  }

  /**
   * Generate tax optimization suggestions
   */
  private generateTaxOptimizationSuggestions(taxConfig: TaxConfiguration, effectiveRate: number): string[] {
    const suggestions: string[] = [];

    if (effectiveRate > 30) {
      suggestions.push('Taxa efetiva alta - considere revisar o regime tributário');
    }

    if (taxConfig.iss > 5) {
      suggestions.push('ISS elevado - verifique possibilidade de redução baseada na localização');
    }

    if (taxConfig.ir > 15) {
      suggestions.push('IR alto - analise possibilidade de dedução de despesas');
    }

    return suggestions;
  }

  /**
   * Calculate margins and markup
   */
  calculateMargins(
    totalCosts: number, 
    marginConfig: MarginConfiguration, 
    additionalCosts: AdditionalCost[] = []
  ): { totalPrice: number; grossMargin: number; netMargin: number; markup: number } {
    
    // Add additional costs
    const otherCosts = additionalCosts.reduce((sum, cost) => sum + (cost?.value || 0), 0);
    const finalCosts = Math.max(0, totalCosts + otherCosts);

    let totalPrice: number;
    
    if (marginConfig.type === 'percentage') {
      // Price = Cost / (1 - Margin%)
      const safeMargin = Math.min(Math.max(marginConfig.value || 0, 0), 95);
      totalPrice = finalCosts / (1 - safeMargin / 100);
    } else {
      // Fixed margin
      totalPrice = finalCosts + Math.max(0, marginConfig.value || 0);
    }

    const grossMargin = totalPrice - finalCosts;
    const grossMarginPercentage = totalPrice > 0 ? (grossMargin / totalPrice) * 100 : 0;
    const markup = finalCosts > 0 ? (grossMargin / finalCosts) * 100 : 0;

    return {
      totalPrice,
      grossMargin: grossMarginPercentage,
      netMargin: grossMarginPercentage, // Simplified - same as gross for now
      markup
    };
  }

  /**
   * Calculate ROI analysis
   */
  calculateROI(investment: number, returns: number[], discountRate: number = 0.1): ROIAnalysis {
    // Check cache first
    const cachedResult = this.cache.getROIAnalysis({ investment, returns, discountRate });
    if (cachedResult) {
      return cachedResult;
    }
    if (returns.length === 0) {
      return {
        investment,
        returns,
        roi: 0,
        irr: 0,
        npv: 0,
        period: 0
      };
    }

    // Simple ROI calculation
    const totalReturns = returns.reduce((sum, ret) => sum + ret, 0);
    const roi = investment > 0 ? ((totalReturns - investment) / investment) * 100 : 0;

    // NPV calculation
    let npv = -investment;
    returns.forEach((ret, index) => {
      npv += ret / Math.pow(1 + discountRate, index + 1);
    });

    // IRR calculation (simplified Newton-Raphson method)
    const irr = this.calculateIRR(investment, returns);

    const result = {
      investment,
      returns,
      roi,
      irr,
      npv,
      period: returns.length
    };

    // Cache the result
    this.cache.cacheROIAnalysis({ investment, returns, discountRate }, result);
    return result;
  }

  /**
   * Calculate Internal Rate of Return using Newton-Raphson method
   * FIXED: Improved convergence handling and validation
   */
  private calculateIRR(investment: number, returns: number[]): number {
    let rate = 0.1; // Initial guess
    const maxIterations = 100;
    const tolerance = 0.0001;
    let lastValidRate = rate;

    for (let i = 0; i < maxIterations; i++) {
      let npv = -investment;
      let dnpv = 0;

      returns.forEach((ret, period) => {
        const factor = Math.pow(1 + rate, period + 1);
        npv += ret / factor;
        dnpv -= (period + 1) * ret / (factor * (1 + rate));
      });

      if (Math.abs(npv) < tolerance) {
        return rate * 100;
      }

      if (Math.abs(dnpv) < tolerance) {
        // Convergence too slow - return last valid rate
        return lastValidRate * 100;
      }

      lastValidRate = rate;
      const newRate = rate - npv / dnpv;
      
      // FIXED: Validate rate is in reasonable range
      if (newRate < -0.99 || newRate > 10) {
        // Rate out of bounds - return last valid rate
        return lastValidRate * 100;
      }
      
      rate = newRate;
    }

    // Return best approximation after max iterations
    return lastValidRate * 100;
  }

  /**
   * Calculate payback analysis
   */
  calculatePayback(investment: number, returns: number[]): PaybackAnalysis {
    const cashFlowAnalysis: CashFlowPeriod[] = [];
    let cumulativeCashFlow = -investment;
    let simplePayback = 0;
    let discountedPayback = 0;
    let breakEvenPoint = 0;
    
    const discountRate = 0.1; // 10% discount rate

    returns.forEach((ret, index) => {
      const period = index + 1;
      const netCashFlow = ret;
      cumulativeCashFlow += netCashFlow;
      
      // Discounted cash flow
      const discountedCashFlow = netCashFlow / Math.pow(1 + discountRate, period);
      
      cashFlowAnalysis.push({
        period,
        cashIn: ret,
        cashOut: period === 1 ? investment : 0,
        netCashFlow,
        cumulativeCashFlow
      });

      // Simple payback
      if (simplePayback === 0 && cumulativeCashFlow >= 0) {
        simplePayback = period;
      }

      // Break-even point
      if (breakEvenPoint === 0 && cumulativeCashFlow >= 0) {
        breakEvenPoint = period;
      }
    });

    // Calculate discounted payback
    let discountedCumulative = -investment;
    for (let i = 0; i < returns.length; i++) {
      const discountedReturn = returns[i] / Math.pow(1 + discountRate, i + 1);
      discountedCumulative += discountedReturn;
      if (discountedPayback === 0 && discountedCumulative >= 0) {
        discountedPayback = i + 1;
        break;
      }
    }

    return {
      simplePayback,
      discountedPayback,
      breakEvenPoint,
      cashFlowAnalysis
    };
  }

  /**
   * Calculate margin analysis over time
   */
  calculateMarginAnalysis(
    monthlyBudgets: MonthlyBudget[],
    teamCosts: TeamCostSummary,
    taxes: TaxSummary
  ): MarginAnalysis {
    
    const marginTrend: MarginTrendPoint[] = [];
    let totalRevenue = 0;
    let totalCosts = 0;

    monthlyBudgets.forEach((budget, index) => {
      const grossMargin = budget.revenue > 0 ? ((budget.revenue - budget.totalCosts) / budget.revenue) * 100 : 0;
      const netMargin = budget.revenue > 0 ? (budget.profit / budget.revenue) * 100 : 0;
      
      marginTrend.push({
        period: index + 1,
        grossMargin,
        netMargin
      });

      totalRevenue += budget.revenue;
      totalCosts += budget.totalCosts;
    });

    const grossMargin = totalRevenue > 0 ? ((totalRevenue - totalCosts) / totalRevenue) * 100 : 0;
    const netMargin = totalRevenue > 0 ? ((totalRevenue - totalCosts - taxes.total) / totalRevenue) * 100 : 0;
    const ebitdaMargin = grossMargin; // Simplified
    const contributionMargin = grossMargin; // Simplified

    return {
      grossMargin,
      netMargin,
      ebitdaMargin,
      contributionMargin,
      marginTrend
    };
  }

  /**
   * Calculate scenario analysis
   */
  calculateScenarios(
    baseData: ServiceDeskData,
    scenarios: ScenarioConfig[]
  ): Array<{ scenario: ScenarioConfig; results: any }> {
    
    return scenarios.map(scenario => {
      // Clone base data
      const scenarioData = JSON.parse(JSON.stringify(baseData));
      
      // Apply scenario adjustments
      scenario.adjustments.forEach(adjustment => {
        this.applyScenarioAdjustment(scenarioData, adjustment);
      });

      // Recalculate with adjusted data
      const teamCosts = this.calculateTeamCosts(scenarioData.team, scenarioData.schedules);
      const taxes = this.calculateTaxes(scenarioData.budget.totalPrice, scenarioData.taxes);
      const margins = this.calculateMargins(
        teamCosts.totalMonthlyCost,
        scenarioData.budget.margin,
        scenarioData.otherCosts
      );

      return {
        scenario,
        results: {
          teamCosts: teamCosts.totalMonthlyCost,
          taxes: taxes.totalTaxes,
          totalPrice: margins.totalPrice,
          grossMargin: margins.grossMargin,
          roi: this.calculateROI(margins.totalPrice * 0.2, [margins.totalPrice * 0.15]).roi
        }
      };
    });
  }

  /**
   * Apply scenario adjustment to data
   */
  private applyScenarioAdjustment(data: ServiceDeskData, adjustment: any): void {
    const factor = 1 + (adjustment.adjustment / 100);
    
    switch (adjustment.category) {
      case 'salary':
        data.team.forEach(member => {
          member.salary *= factor;
        });
        break;
      case 'costs':
        data.otherCosts.forEach(cost => {
          cost.value *= factor;
        });
        break;
      case 'revenue':
        data.budget.totalPrice *= factor;
        break;
      case 'taxes':
        Object.keys(data.taxes).forEach(key => {
          if (typeof data.taxes[key as keyof TaxConfiguration] === 'number') {
            (data.taxes[key as keyof TaxConfiguration] as number) *= factor;
          }
        });
        break;
    }
  }

  /**
   * Calculate consolidated budget
   */
  calculateConsolidatedBudget(
    teamCosts: TeamCostCalculation,
    otherCosts: AdditionalCost[],
    taxes: TaxCalculationResult,
    marginConfig: MarginConfiguration,
    contractPeriod: number
  ): ConsolidatedBudget {
    const normalizedContractPeriod = Math.max(1, Math.floor(contractPeriod || 1));

    const infrastructureCosts = otherCosts
      .filter(cost => cost.category === 'infrastructure' || (cost.category as unknown as string) === 'INFRASTRUCTURE')
      .reduce((sum, cost) => sum + this.calculateContractCost(cost, normalizedContractPeriod), 0);
    
    const totalOtherCosts = otherCosts.reduce(
      (sum, cost) => sum + this.calculateContractCost(cost, normalizedContractPeriod),
      0
    );
    const totalCosts = (teamCosts.totalMonthlyCost * normalizedContractPeriod) + totalOtherCosts;
    
    const margins = this.calculateMargins(totalCosts, marginConfig);
    const adjustedTaxes = this.scaleTaxesToRevenue(taxes, margins.totalPrice);
    
    // Generate monthly breakdown
    const monthlyBreakdown: MonthlyBudget[] = [];
    for (let month = 1; month <= normalizedContractPeriod; month++) {
      const monthlyTeamCost = teamCosts.totalMonthlyCost;
      const monthlyOtherCosts = totalOtherCosts / normalizedContractPeriod;
      const monthlyTotalCosts = monthlyTeamCost + monthlyOtherCosts;
      const monthlyRevenue = margins.totalPrice / normalizedContractPeriod;
      const monthlyTaxes = adjustedTaxes.total / normalizedContractPeriod;
      const monthlyProfit = monthlyRevenue - monthlyTotalCosts - monthlyTaxes;
      const monthlyMargin = monthlyRevenue > 0 ? (monthlyProfit / monthlyRevenue) * 100 : 0;

      monthlyBreakdown.push({
        month: ((month - 1) % 12) + 1,
        year: Math.floor((month - 1) / 12) + new Date().getFullYear(),
        teamCosts: monthlyTeamCost,
        otherCosts: monthlyOtherCosts,
        taxes: monthlyTaxes,
        totalCosts: monthlyTotalCosts,
        revenue: monthlyRevenue,
        profit: monthlyProfit,
        margin: monthlyMargin
      });
    }

    return {
      teamCosts: {
        salaries: teamCosts.breakdown.reduce((sum, member) => sum + member.baseSalary, 0),
        benefits: teamCosts.breakdown.reduce((sum, member) => sum + member.benefits, 0),
        total: teamCosts.totalMonthlyCost,
        breakdown: teamCosts.breakdown.map(member => ({
          memberId: member.memberId,
          memberName: '', // Would need to be populated from team data
          role: '', // Would need to be populated from team data
          monthlyCost: member.totalCost,
          annualCost: member.annualCost
        }))
      },
      infrastructureCosts,
      otherCosts: totalOtherCosts,
      taxes: {
        federal: adjustedTaxes.breakdown.filter(t => ['PIS', 'COFINS', 'IR', 'CSLL'].includes(t.taxName))
          .reduce((sum, t) => sum + t.amount, 0),
        state: adjustedTaxes.breakdown.filter(t => t.taxName === 'ICMS')
          .reduce((sum, t) => sum + t.amount, 0),
        municipal: adjustedTaxes.breakdown.filter(t => t.taxName === 'ISS')
          .reduce((sum, t) => sum + t.amount, 0),
        total: adjustedTaxes.total,
        breakdown: adjustedTaxes.breakdown
      },
      totalCosts,
      margin: marginConfig,
      totalPrice: margins.totalPrice,
      monthlyBreakdown
    };
  }

  private calculateContractCost(cost: AdditionalCost, contractPeriod: number): number {
    const period = Math.max(1, contractPeriod);
    const value = Number.isFinite(cost?.value) ? Math.max(0, cost.value) : 0;

    switch (cost?.frequency) {
      case 'monthly':
        return value * period;
      case 'quarterly':
        return value * Math.ceil(period / 3);
      case 'semi_annual':
        return value * Math.ceil(period / 6);
      case 'annual':
        return value * Math.ceil(period / 12);
      case 'one_time':
        return value;
      default:
        return value * period;
    }
  }

  private scaleTaxesToRevenue(taxes: TaxCalculationResult, revenue: number): { total: number; breakdown: TaxBreakdown[] } {
    const targetTotalTaxes = revenue * ((taxes.effectiveRate || 0) / 100);
    const sourceTotalTaxes = taxes.breakdown.reduce((sum, item) => sum + item.amount, 0);

    if (sourceTotalTaxes <= 0 || taxes.breakdown.length === 0) {
      return { total: targetTotalTaxes, breakdown: [] };
    }

    const scaledBreakdown = taxes.breakdown.map(item => {
      const proportion = item.amount / sourceTotalTaxes;
      const amount = targetTotalTaxes * proportion;
      return {
        ...item,
        base: revenue,
        amount
      };
    });

    return {
      total: targetTotalTaxes,
      breakdown: scaledBreakdown
    };
  }
}
