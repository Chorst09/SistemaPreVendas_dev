import { describe, expect, it } from 'vitest';
import { CoverageType } from '@/lib/types/service-desk-pricing';
import { calculateServiceDeskDimensioning } from '../service-desk-dimensioning';

const baseInput = {
  userQuantity: 100,
  incidentsPerUser: 1.5,
  tmaMinutes: 10,
  occupancyRate: 80,
  n1Distribution: 80,
  n1SixHourShift: false,
  coverageType: CoverageType.BUSINESS_HOURS,
  n1Capacity: 100,
  n2Capacity: 75
};

describe('calculateServiceDeskDimensioning', () => {
  it('keeps business-hours dimensioning without relief staff by default', () => {
    const result = calculateServiceDeskDimensioning(baseInput);

    expect(result.n1Agents).toBeGreaterThanOrEqual(1);
    expect(result.n2Agents).toBeGreaterThanOrEqual(1);
    expect(result.folguistas).toBe(0);
  });

  it('adds relief staff for 24x7 coverage', () => {
    const result = calculateServiceDeskDimensioning({
      ...baseInput,
      coverageType: CoverageType.FULL_TIME
    });

    expect(result.n1OperationalAgents).toBeGreaterThanOrEqual(4);
    expect(result.folguistas).toBeGreaterThanOrEqual(1);
    expect(result.n1Agents).toBe(result.n1OperationalAgents + result.folguistas);
  });

  it('does not reduce N1 staffing when switching N1 to a 6-hour shift', () => {
    const eightHour = calculateServiceDeskDimensioning(baseInput);
    const sixHour = calculateServiceDeskDimensioning({
      ...baseInput,
      n1SixHourShift: true
    });

    expect(sixHour.n1Agents).toBeGreaterThanOrEqual(eightHour.n1Agents);
  });

  it('uses the 6-hour N1 capacity when the 6-hour shift is selected', () => {
    const eightHour = calculateServiceDeskDimensioning({
      ...baseInput,
      userQuantity: 1000,
      n1Capacity: 400,
      n1Capacity6h: 100,
      n1SixHourShift: false
    });
    const sixHour = calculateServiceDeskDimensioning({
      ...baseInput,
      userQuantity: 1000,
      n1Capacity: 400,
      n1Capacity6h: 100,
      n1SixHourShift: true
    });

    expect(eightHour.activeN1MonthlyCapacity).toBe(400);
    expect(sixHour.activeN1MonthlyCapacity).toBe(100);
    expect(sixHour.n1Agents).toBeGreaterThan(eightHour.n1Agents);
  });
});
