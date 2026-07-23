import { CoverageType } from '@/lib/types/service-desk-pricing';

export interface ServiceDeskDimensioningInput {
  userQuantity: number;
  incidentsPerUser: number;
  tmaMinutes: number;
  occupancyRate: number;
  n1Distribution: number;
  n1SixHourShift: boolean;
  coverageType: CoverageType | string;
  n1Capacity?: number;
  n1Capacity6h?: number;
  n2Capacity?: number;
}

export interface ServiceDeskDimensioningResult {
  totalCallsPerMonth: number;
  n1Agents: number;
  n2Agents: number;
  n1OperationalAgents: number;
  folguistas: number;
  productiveDaysPerMonth: number;
  activeN1MonthlyCapacity: number;
  n1MonthlyCapacity: number;
  n1MonthlyCapacity6h: number;
  n2MonthlyCapacity: number;
  workloadHours: number;
  workloadErlang: number;
  coverageMinimumN1: number;
  coverageMinimumN2: number;
  suggestedLeader: number;
  suggestedCoordinator: number;
}

function normalizeCoverageType(coverageType?: CoverageType | string): CoverageType {
  if (coverageType === CoverageType.EXTENDED_HOURS || coverageType === 'EXTENDED_HOURS' || coverageType === '12x5') {
    return CoverageType.EXTENDED_HOURS;
  }
  if (coverageType === CoverageType.FULL_TIME || coverageType === 'FULL_TIME' || coverageType === '24x7') {
    return CoverageType.FULL_TIME;
  }
  return CoverageType.BUSINESS_HOURS;
}

function getCoverageMinimums(coverageType: CoverageType, n1SixHourShift: boolean) {
  if (coverageType === CoverageType.FULL_TIME) {
    return { n1: 4, n2: 1, reliefFactor: 0.4, productiveDaysPerMonth: 22 };
  }

  if (coverageType === CoverageType.EXTENDED_HOURS) {
    return { n1: n1SixHourShift ? 2 : 2, n2: 1, reliefFactor: 0.12, productiveDaysPerMonth: 22 };
  }

  return { n1: 1, n2: 1, reliefFactor: 0, productiveDaysPerMonth: 22 };
}

export function calculateServiceDeskDimensioning(input: ServiceDeskDimensioningInput): ServiceDeskDimensioningResult {
  const coverageType = normalizeCoverageType(input.coverageType);
  const userQuantity = Math.max(0, Number(input.userQuantity) || 0);
  const incidentsPerUser = Math.max(0, Number(input.incidentsPerUser) || 0);
  const tmaMinutes = Math.max(1, Number(input.tmaMinutes) || 10);
  const occupancyRate = Math.min(95, Math.max(1, Number(input.occupancyRate) || 80));
  const n1Distribution = Math.min(100, Math.max(0, Number(input.n1Distribution) || 80));
  const n2Distribution = 100 - n1Distribution;
  const totalCallsPerMonth = Math.round(userQuantity * incidentsPerUser);
  const productiveDaysPerMonth = 22;

  const n1WorkloadMinutes = totalCallsPerMonth * (n1Distribution / 100) * tmaMinutes;
  const n2WorkloadMinutes = totalCallsPerMonth * (n2Distribution / 100) * tmaMinutes;
  const n1ProductiveMinutes = (input.n1SixHourShift ? 6 : 8) * 60 * productiveDaysPerMonth * (occupancyRate / 100);
  const n1ProductiveMinutes8h = 8 * 60 * productiveDaysPerMonth * (occupancyRate / 100);
  const n1ProductiveMinutes6h = 6 * 60 * productiveDaysPerMonth * (occupancyRate / 100);
  const n2ProductiveMinutes = 8 * 60 * productiveDaysPerMonth * (occupancyRate / 100);
  const n1Capacity8h = Math.max(1, input.n1Capacity || 100);
  const n1Capacity6h = Math.max(1, input.n1Capacity6h || Math.round(n1Capacity8h * 0.75));
  const activeN1MonthlyCapacity = input.n1SixHourShift ? n1Capacity6h : n1Capacity8h;

  const n1ByWorkload = Math.ceil(n1WorkloadMinutes / Math.max(1, n1ProductiveMinutes));
  const n2ByWorkload = Math.ceil(n2WorkloadMinutes / Math.max(1, n2ProductiveMinutes));
  const n1ByCapacity = Math.ceil((totalCallsPerMonth * (n1Distribution / 100)) / activeN1MonthlyCapacity);
  const n2ByCapacity = Math.ceil((totalCallsPerMonth * (n2Distribution / 100)) / Math.max(1, input.n2Capacity || 75));
  const minimums = getCoverageMinimums(coverageType, input.n1SixHourShift);

  const n1OperationalAgents = Math.max(1, minimums.n1, n1ByWorkload, n1ByCapacity);
  const n2Agents = Math.max(1, minimums.n2, n2ByWorkload, n2ByCapacity);
  const folguistas = minimums.reliefFactor > 0 ? Math.max(1, Math.ceil(n1OperationalAgents * minimums.reliefFactor)) : 0;

  const workloadHours = Math.round(((n1WorkloadMinutes + n2WorkloadMinutes) / 60) * 100) / 100;
  const totalAgents = n1OperationalAgents + folguistas + n2Agents;
  const suggestedLeader = totalAgents >= 8 ? 1 : 0;
  const suggestedCoordinator = totalAgents >= 15 ? 1 : 0;

  return {
    totalCallsPerMonth,
    n1Agents: n1OperationalAgents + folguistas,
    n2Agents,
    n1OperationalAgents,
    folguistas,
    productiveDaysPerMonth: minimums.productiveDaysPerMonth,
    activeN1MonthlyCapacity,
    n1MonthlyCapacity: Math.round(n1ProductiveMinutes8h / tmaMinutes),
    n1MonthlyCapacity6h: Math.round(n1ProductiveMinutes6h / tmaMinutes),
    n2MonthlyCapacity: Math.round(n2ProductiveMinutes / tmaMinutes),
    workloadHours,
    workloadErlang: workloadHours,
    coverageMinimumN1: minimums.n1,
    coverageMinimumN2: minimums.n2,
    suggestedLeader,
    suggestedCoordinator
  };
}
