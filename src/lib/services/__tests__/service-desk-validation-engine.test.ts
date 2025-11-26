import { describe, it, expect, beforeEach } from 'vitest';
import { ServiceDeskValidationEngine } from '../service-desk-validation-engine';
import { ProjectData, TeamMember, WorkSchedule } from '@/lib/types/service-desk-pricing';

describe('ServiceDeskValidationEngine', () => {
  let engine: ServiceDeskValidationEngine;

  beforeEach(() => {
    engine = new ServiceDeskValidationEngine();
  });

  describe('validateProjectData', () => {
    it('should validate required fields', () => {
      const data: ProjectData = {
        name: '',
        client: {
          name: '',
          document: '',
          email: '',
          contact: ''
        },
        contractPeriod: {
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString()
        },
        description: ''
      };

      const result = engine.validateTabData('data', data);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate email format', () => {
      const data: ProjectData = {
        name: 'Test Project',
        client: {
          name: 'Test Client',
          document: '12345678000100',
          email: 'invalid-email',
          contact: 'John Doe'
        },
        contractPeriod: {
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        description: 'Test'
      };

      const result = engine.validateTabData('data', data);

      expect(result.errors.some(e => e.code === 'INVALID_FORMAT')).toBe(true);
    });

    it('should validate date range', () => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const data: ProjectData = {
        name: 'Test Project',
        client: {
          name: 'Test Client',
          document: '12345678000100',
          email: 'test@example.com',
          contact: 'John Doe'
        },
        contractPeriod: {
          startDate: futureDate.toISOString(),
          endDate: new Date().toISOString() // End before start
        },
        description: 'Test'
      };

      const result = engine.validateTabData('data', data);

      expect(result.errors.some(e => e.code === 'INVALID_DATE_RANGE')).toBe(true);
    });

    it('should validate contract period duration', () => {
      const today = new Date();
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      
      const data: ProjectData = {
        name: 'Test Project',
        client: {
          name: 'Test Client',
          document: '12345678000100',
          email: 'test@example.com',
          contact: 'John Doe'
        },
        contractPeriod: {
          startDate: today.toISOString(),
          endDate: tomorrow.toISOString() // Only 1 day
        },
        description: 'Test'
      };

      const result = engine.validateTabData('data', data);

      expect(result.errors.some(e => e.code === 'INVALID_DURATION')).toBe(true);
    });

    it('should warn for very long contract periods', () => {
      const today = new Date();
      const farFuture = new Date(today.getTime() + 70 * 365 * 24 * 60 * 60 * 1000); // 70 years
      
      const data: ProjectData = {
        name: 'Test Project',
        client: {
          name: 'Test Client',
          document: '12345678000100',
          email: 'test@example.com',
          contact: 'John Doe'
        },
        contractPeriod: {
          startDate: today.toISOString(),
          endDate: farFuture.toISOString()
        },
        description: 'Test'
      };

      const result = engine.validateTabData('data', data);

      expect(result.warnings.some(w => w.field === 'contractPeriod')).toBe(true);
    });

    it('should accept valid project data', () => {
      const today = new Date();
      const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      const data: ProjectData = {
        name: 'Valid Project',
        client: {
          name: 'Valid Client',
          document: '12345678000100',
          email: 'valid@example.com',
          contact: 'John Doe'
        },
        contractPeriod: {
          startDate: today.toISOString(),
          endDate: nextMonth.toISOString()
        },
        description: 'Valid description'
      };

      const result = engine.validateTabData('data', data);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('validateTeamConfiguration', () => {
    it('should require at least one team member', () => {
      const team: TeamMember[] = [];

      const result = engine.validateTabData('team', team);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'REQUIRED_FIELD')).toBe(true);
    });

    it('should validate team member required fields', () => {
      const team: TeamMember[] = [
        {
          id: '1',
          name: '',
          role: '',
          salary: 0,
          workload: 0,
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

      const result = engine.validateTabData('team', team);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate salary is positive', () => {
      const team: TeamMember[] = [
        {
          id: '1',
          name: 'John Doe',
          role: 'Developer',
          salary: -1000, // Negative salary
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

      const result = engine.validateTabData('team', team);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'INVALID_VALUE')).toBe(true);
    });

    it('should warn for unusual workload', () => {
      const team: TeamMember[] = [
        {
          id: '1',
          name: 'John Doe',
          role: 'Developer',
          salary: 5000,
          workload: 80, // Very high workload
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

      const result = engine.validateTabData('team', team);

      expect(result.warnings.some(w => w.field.includes('workload'))).toBe(true);
    });

    it('should accept valid team configuration', () => {
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

      const result = engine.validateTabData('team', team);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('validateScheduleCoverage', () => {
    it('should warn when no schedules configured', () => {
      const schedules: WorkSchedule[] = [];

      const result = engine.validateTabData('scale', schedules);

      expect(result.warnings.some(w => w.field === 'schedules')).toBe(true);
    });

    it('should validate schedule has shifts', () => {
      const schedules: WorkSchedule[] = [
        {
          id: '1',
          name: 'Morning',
          shifts: [],
          coverage: {
            minimumStaff: 1,
            preferredStaff: 2
          },
          specialRates: []
        }
      ];

      const result = engine.validateTabData('scale', schedules);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'REQUIRED_FIELD')).toBe(true);
    });

    it('should validate shift times are different', () => {
      const schedules: WorkSchedule[] = [
        {
          id: '1',
          name: 'Morning',
          shifts: [
            {
              id: 's1',
              name: 'Morning Shift',
              startTime: '08:00',
              endTime: '08:00', // Same as start
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

      const result = engine.validateTabData('scale', schedules);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'INVALID_TIME_RANGE')).toBe(true);
    });

    it('should validate shift has days of week', () => {
      const schedules: WorkSchedule[] = [
        {
          id: '1',
          name: 'Morning',
          shifts: [
            {
              id: 's1',
              name: 'Morning Shift',
              startTime: '08:00',
              endTime: '16:00',
              daysOfWeek: [], // No days
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

      const result = engine.validateTabData('scale', schedules);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'REQUIRED_FIELD')).toBe(true);
    });

    it('should accept valid schedule', () => {
      const schedules: WorkSchedule[] = [
        {
          id: '1',
          name: 'Morning',
          shifts: [
            {
              id: 's1',
              name: 'Morning Shift',
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

      const result = engine.validateTabData('scale', schedules);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Email Validation', () => {
    it('should validate correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.co.uk',
        'user+tag@example.com',
        'user_name@example.com'
      ];

      validEmails.forEach(email => {
        const data: ProjectData = {
          name: 'Test',
          client: {
            name: 'Test',
            document: '12345678000100',
            email: email,
            contact: 'Test'
          },
          contractPeriod: {
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          },
          description: 'Test'
        };

        const result = engine.validateTabData('data', data);
        expect(result.errors.some(e => e.code === 'INVALID_FORMAT')).toBe(false);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid.email',
        '@example.com',
        'user@',
        'user @example.com',
        'user@example',
        ''
      ];

      invalidEmails.forEach(email => {
        const data: ProjectData = {
          name: 'Test',
          client: {
            name: 'Test',
            document: '12345678000100',
            email: email,
            contact: 'Test'
          },
          contractPeriod: {
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          },
          description: 'Test'
        };

        const result = engine.validateTabData('data', data);
        if (email) { // Empty email is not validated as format error
          expect(result.errors.some(e => e.code === 'INVALID_FORMAT')).toBe(true);
        }
      });
    });
  });

  describe('Completion Percentage', () => {
    it('should calculate completion percentage', () => {
      const data: ProjectData = {
        name: 'Test Project',
        client: {
          name: 'Test Client',
          document: '12345678000100',
          email: 'test@example.com',
          contact: 'John Doe'
        },
        contractPeriod: {
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        description: 'Test'
      };

      const result = engine.validateTabData('data', data);

      expect(result.completionPercentage).toBeGreaterThan(0);
      expect(result.completionPercentage).toBeLessThanOrEqual(100);
    });
  });
});
