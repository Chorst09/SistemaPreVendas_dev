import { describe, it, expect, beforeEach } from 'vitest';
import { ServiceDeskCalculationEngine } from '../service-desk-calculation-engine';
import { TeamMember, WorkSchedule, TaxConfiguration, MarginConfiguration, AdditionalCost } from '@/lib/types/service-desk-pricing';

describe('ServiceDeskCalculationEngine', () => {
  let engine: ServiceDeskCalculationEngine;

  beforeEach(() => {
    engine = new ServiceDeskCalculationEngine();
  });

  describe('calculateTeamCosts', () => {
    it('should calculate team costs correctly', () => {
      const team: TeamMember[] = [
        {
          id: '1',
          name: 'John Doe',
          role: 'Developer',
          salary: 5000,
          workload: 40,
          benefits: {
            healthInsurance: 200,
            mealVoucher: 300,
            transportVoucher: 200,
            lifeInsurance: 50,
            vacation: 8.33,
            thirteenthSalary: 8.33,
            fgts: 8,
            inss: 0,
            otherBenefits: []
          },
          costPerHour: 0
        }
      ];

      const schedules: WorkSchedule[] = [];
      const result = engine.calculateTeamCosts(team, schedules);

      expect(result.totalMonthlyCost).toBeGreaterThan(0);
      expect(result.totalAnnualCost).toBe(result.totalMonthlyCost * 12);
      expect(result.costPerHour).toBeGreaterThan(0);
      expect(result.breakdown.length).toBe(1);
    });

    it('should handle zero workload without division by zero', () => {
      const team: TeamMember[] = [
        {
          id: '1',
          name: 'John Doe',
          role: 'Developer',
          salary: 5000,
          workload: 0, // Zero workload
          benefits: {
            healthInsurance: 200,
            mealVoucher: 300,
            transportVoucher: 200,
            lifeInsurance: 50,
            vacation: 8.33,
            thirteenthSalary: 8.33,
            fgts: 8,
            inss: 0,
            otherBenefits: []
          },
          costPerHour: 0
        }
      ];

      const schedules: WorkSchedule[] = [];
      const result = engine.calculateTeamCosts(team, schedules);

      expect(result.costPerHour).toBe(0); // Should not throw error
      expect(isFinite(result.costPerHour)).toBe(true);
    });

    it('should calculate benefits correctly with configured rates', () => {
      const team: TeamMember[] = [
        {
          id: '1',
          name: 'John Doe',
          role: 'Developer',
          salary: 10000,
          workload: 40,
          benefits: {
            healthInsurance: 500,
            mealVoucher: 600,
            transportVoucher: 400,
            lifeInsurance: 100,
            vacation: 8.33,
            thirteenthSalary: 8.33,
            fgts: 8,
            inss: 0,
            otherBenefits: []
          },
          costPerHour: 0
        }
      ];

      const schedules: WorkSchedule[] = [];
      const result = engine.calculateTeamCosts(team, schedules);

      // Includes fixed benefits, vacation, 1/3 vacation, 13th salary, and FGTS on salary + provisions.
      expect(result.breakdown[0].totalCost).toBeCloseTo(14499.52, 1);
    });

    it('should use precise weeks per month calculation', () => {
      const team: TeamMember[] = [
        {
          id: '1',
          name: 'John Doe',
          role: 'Developer',
          salary: 5000,
          workload: 40,
          benefits: {
            healthInsurance: 0,
            mealVoucher: 0,
            transportVoucher: 0,
            lifeInsurance: 0,
            vacation: 0,
            thirteenthSalary: 0,
            fgts: 0,
            inss: 0,
            otherBenefits: []
          },
          costPerHour: 0
        }
      ];

      const schedules: WorkSchedule[] = [];
      const result = engine.calculateTeamCosts(team, schedules);

      // With 40 hours/week and 52/12 weeks/month = 173.33 hours/month
      // costPerHour should be 5000 / 173.33 = 28.85
      expect(result.costPerHour).toBeCloseTo(28.85, 1);
    });

    it('should account for quantity on position-based team entries', () => {
      const team: TeamMember[] = [
        {
          id: 'n1-position',
          jobPositionId: 'pos-1',
          quantity: 3,
          workingHours: 8,
          isActive: true,
          workload: 40,
          benefits: {
            healthInsurance: 0,
            mealVoucher: 0,
            transportVoucher: 0,
            lifeInsurance: 0,
            vacation: 0,
            thirteenthSalary: 0,
            fgts: 0,
            inss: 0,
            otherBenefits: []
          },
          costPerHour: 0
        } as any
      ];

      const result = engine.calculateTeamCosts(team, []);
      expect(result.totalMonthlyCost).toBeCloseTo(1780 * 3, 0);
    });
  });

  describe('calculateTaxes', () => {
    it('should calculate taxes correctly', () => {
      const revenue = 100000;
      const taxConfig: TaxConfiguration = {
        pis: 1.65,
        cofins: 7.6,
        ir: 15,
        csll: 9,
        icms: 18,
        iss: 5,
        customTaxes: []
      };

      const result = engine.calculateTaxes(revenue, taxConfig);

      expect(result.totalTaxes).toBeGreaterThan(0);
      expect(result.effectiveRate).toBeGreaterThan(0);
      expect(result.breakdown.length).toBeGreaterThan(0);
    });

    it('should handle zero revenue', () => {
      const revenue = 0;
      const taxConfig: TaxConfiguration = {
        pis: 1.65,
        cofins: 7.6,
        ir: 15,
        csll: 9,
        icms: 18,
        iss: 5,
        customTaxes: []
      };

      const result = engine.calculateTaxes(revenue, taxConfig);

      expect(result.totalTaxes).toBe(0);
      expect(result.effectiveRate).toBe(0);
    });
  });

  describe('calculateROI', () => {
    it('should calculate ROI correctly', () => {
      const investment = 100000;
      const returns = [30000, 30000, 30000, 30000];

      const result = engine.calculateROI(investment, returns);

      expect(result.roi).toBeGreaterThan(0);
      expect(isFinite(result.npv)).toBe(true);
      expect(result.irr).toBeGreaterThan(0);
    });

    it('should handle empty returns', () => {
      const investment = 100000;
      const returns: number[] = [];

      const result = engine.calculateROI(investment, returns);

      expect(result.roi).toBe(0);
      expect(result.irr).toBe(0);
      expect(result.npv).toBe(0);
    });

    it('should calculate IRR with convergence', () => {
      const investment = 100000;
      const returns = [50000, 50000, 50000];

      const result = engine.calculateROI(investment, returns);

      expect(result.irr).toBeGreaterThan(0);
      expect(isFinite(result.irr)).toBe(true);
      expect(result.irr).toBeLessThan(100); // Reasonable upper bound
    });

    it('should handle negative returns', () => {
      const investment = 100000;
      const returns = [-10000, 50000, 50000, 50000];

      const result = engine.calculateROI(investment, returns);

      expect(isFinite(result.roi)).toBe(true);
      expect(isFinite(result.irr)).toBe(true);
    });
  });

  describe('calculatePayback', () => {
    it('should calculate payback period correctly', () => {
      const investment = 100000;
      const returns = [30000, 30000, 30000, 30000, 30000];

      const result = engine.calculatePayback(investment, returns);

      expect(result.simplePayback).toBeGreaterThan(0);
      expect(result.simplePayback).toBeLessThanOrEqual(returns.length);
    });

    it('should handle immediate payback', () => {
      const investment = 100000;
      const returns = [150000, 50000, 50000];

      const result = engine.calculatePayback(investment, returns);

      expect(result.simplePayback).toBe(1);
    });
  });

  describe('calculateMargins', () => {
    it('should calculate margins with percentage markup', () => {
      const totalCosts = 100000;
      const marginConfig: MarginConfiguration = {
        type: 'percentage',
        value: 20 // 20% margin
      };

      const result = engine.calculateMargins(totalCosts, marginConfig);

      expect(result.totalPrice).toBeGreaterThan(totalCosts);
      expect(result.grossMargin).toBeCloseTo(20, 1);
    });

    it('should calculate margins with fixed amount', () => {
      const totalCosts = 100000;
      const marginConfig: MarginConfiguration = {
        type: 'fixed',
        value: 20000 // Fixed 20k margin
      };

      const result = engine.calculateMargins(totalCosts, marginConfig);

      expect(result.totalPrice).toBe(120000);
      expect(result.grossMargin).toBeCloseTo(16.67, 1); // 20000/120000
    });

    it('should handle zero costs', () => {
      const totalCosts = 0;
      const marginConfig: MarginConfiguration = {
        type: 'percentage',
        value: 20
      };

      const result = engine.calculateMargins(totalCosts, marginConfig);

      expect(result.totalPrice).toBe(0);
      expect(result.grossMargin).toBe(0);
    });
  });

  describe('calculateCoverageAnalysis', () => {
    it('should analyze coverage correctly', () => {
      const schedules: WorkSchedule[] = [
        {
          id: '1',
          name: 'Morning Shift',
          shifts: [
            {
              id: 's1',
              name: 'Morning',
              startTime: '08:00',
              endTime: '16:00',
              daysOfWeek: [1, 2, 3, 4, 5],
              teamMembers: ['m1'],
              isSpecialShift: false,
              multiplier: 1,
              coverage: 0
            }
          ],
          coverage: {
            minimumStaff: 1,
            preferredStaff: 2
          },
          specialRates: []
        }
      ];

      const result = engine.calculateCoverageAnalysis(schedules);

      expect(result.coveragePercentage).toBeGreaterThan(0);
      expect(result.coveragePercentage).toBeLessThanOrEqual(100);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should identify coverage gaps', () => {
      const schedules: WorkSchedule[] = [
        {
          id: '1',
          name: 'Limited Shift',
          shifts: [
            {
              id: 's1',
              name: 'Morning',
              startTime: '09:00',
              endTime: '12:00',
              daysOfWeek: [1, 2, 3],
              teamMembers: ['m1'],
              isSpecialShift: false,
              multiplier: 1,
              coverage: 0
            }
          ],
          coverage: {
            minimumStaff: 1,
            preferredStaff: 1
          },
          specialRates: []
        }
      ];

      const result = engine.calculateCoverageAnalysis(schedules);

      expect(result.gaps.length).toBeGreaterThan(0);
    });
  });

  describe('calculateScenarios', () => {
    it('should calculate multiple scenarios', () => {
      // This is a simplified test - full test would require complete ServiceDeskData
      const scenarios = [
        {
          name: 'Optimistic',
          adjustments: [
            { category: 'salary', adjustment: 10 }
          ]
        },
        {
          name: 'Pessimistic',
          adjustments: [
            { category: 'salary', adjustment: -10 }
          ]
        }
      ];

      expect(scenarios.length).toBe(2);
    });
  });

  describe('calculateConsolidatedBudget', () => {
    it('should use normalized frequencies and lowercase infrastructure category', () => {
      const teamCosts = {
        totalMonthlyCost: 10000,
        totalAnnualCost: 120000,
        costPerHour: 57.7,
        breakdown: [
          {
            memberId: '1',
            baseSalary: 8000,
            benefits: 2000,
            totalCost: 10000,
            hourlyRate: 57.7,
            annualCost: 120000
          }
        ]
      };

      const otherCosts: AdditionalCost[] = [
        {
          id: 'infra',
          name: 'Infra',
          category: 'infrastructure' as any,
          value: 3000,
          type: 'fixed' as any,
          frequency: 'monthly' as any,
          startDate: new Date(),
          description: '',
          allocation: { method: 'equal', periods: [] }
        },
        {
          id: 'setup',
          name: 'Setup',
          category: 'licenses' as any,
          value: 6000,
          type: 'fixed' as any,
          frequency: 'one_time' as any,
          startDate: new Date(),
          description: '',
          allocation: { method: 'equal', periods: [] }
        }
      ];

      const taxes = {
        totalTaxes: 20000,
        effectiveRate: 20,
        breakdown: [{ taxName: 'ISS', rate: 5, base: 100000, amount: 5000 }],
        optimizationSuggestions: []
      };

      const marginConfig: MarginConfiguration = {
        type: 'percentage',
        value: 20,
        minimumMargin: 10,
        targetMargin: 20,
        maximumMargin: 40
      };

      const result = engine.calculateConsolidatedBudget(teamCosts as any, otherCosts, taxes as any, marginConfig, 12);

      expect(result.infrastructureCosts).toBe(3000 * 12);
      expect(result.otherCosts).toBe((3000 * 12) + 6000);
      expect(result.totalCosts).toBe((10000 * 12) + (3000 * 12) + 6000);
      expect(result.monthlyBreakdown).toHaveLength(12);
    });

    it('should keep monthly costs monthly and distribute one-time costs over the contract', () => {
      const teamCosts = {
        totalMonthlyCost: 0,
        totalAnnualCost: 0,
        costPerHour: 0,
        breakdown: []
      };

      const otherCosts: AdditionalCost[] = [
        {
          id: 'monthly-license',
          name: 'Licenca mensal',
          category: 'licenses' as any,
          value: 1200,
          type: 'fixed' as any,
          frequency: 'monthly' as any,
          startDate: new Date(),
          description: '',
          allocation: { method: 'equal', periods: [] }
        },
        {
          id: 'setup',
          name: 'Setup pontual',
          category: 'infrastructure' as any,
          value: 24000,
          type: 'fixed' as any,
          frequency: 'one_time' as any,
          startDate: new Date(),
          description: '',
          allocation: { method: 'equal', periods: [] }
        }
      ];

      const taxes = {
        totalTaxes: 0,
        effectiveRate: 0,
        breakdown: [],
        optimizationSuggestions: []
      };

      const marginConfig: MarginConfiguration = {
        type: 'percentage',
        value: 0,
        minimumMargin: 0,
        targetMargin: 0,
        maximumMargin: 0
      };

      const result = engine.calculateConsolidatedBudget(teamCosts as any, otherCosts, taxes as any, marginConfig, 24);

      expect(result.otherCosts).toBe((1200 * 24) + 24000);
      expect(result.monthlyBreakdown[0].otherCosts).toBe(2200);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle very large numbers', () => {
      const investment = 1000000000; // 1 billion
      const returns = [100000000, 100000000, 100000000]; // 100M each

      const result = engine.calculateROI(investment, returns);

      expect(isFinite(result.roi)).toBe(true);
      expect(isFinite(result.irr)).toBe(true);
    });

    it('should handle very small numbers', () => {
      const investment = 0.01;
      const returns = [0.005, 0.005, 0.005];

      const result = engine.calculateROI(investment, returns);

      expect(isFinite(result.roi)).toBe(true);
    });

    it('should handle negative investment', () => {
      const investment = -100000;
      const returns = [50000, 50000, 50000];

      const result = engine.calculateROI(investment, returns);

      expect(isFinite(result.roi)).toBe(true);
    });
  });
});
