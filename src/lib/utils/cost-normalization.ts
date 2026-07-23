import { AdditionalCost, CostFrequency } from '@/lib/types/service-desk-pricing';

export interface NormalizedCost {
  inputValue: number;
  monthlyEquivalent: number;
  annualEquivalent: number;
  contractTotal: number;
  contractPeriodMonths: number;
}

const asPositiveNumber = (value: unknown, fallback = 0): number => {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;
};

export function normalizeContractPeriodMonths(contractPeriodMonths?: number): number {
  return Math.max(1, Math.floor(asPositiveNumber(contractPeriodMonths, 12)));
}

function getRecurringCycleMonths(frequency?: CostFrequency | string): number {
  switch (frequency) {
    case CostFrequency.MONTHLY:
    case 'monthly':
      return 1;
    case CostFrequency.QUARTERLY:
    case 'quarterly':
      return 3;
    case CostFrequency.SEMI_ANNUAL:
    case 'semi_annual':
      return 6;
    case CostFrequency.ANNUAL:
    case 'annual':
      return 12;
    default:
      return 1;
  }
}

export function normalizeAdditionalCost(
  cost: Pick<AdditionalCost, 'value' | 'frequency'>,
  contractPeriodMonths = 12
): NormalizedCost {
  const inputValue = asPositiveNumber(cost?.value);
  const period = normalizeContractPeriodMonths(contractPeriodMonths);
  const frequency = cost?.frequency as CostFrequency | string | undefined;

  if (frequency === CostFrequency.ONE_TIME || frequency === 'one_time') {
    const monthlyEquivalent = inputValue / period;
    return {
      inputValue,
      monthlyEquivalent,
      annualEquivalent: monthlyEquivalent * 12,
      contractTotal: inputValue,
      contractPeriodMonths: period
    };
  }

  const monthlyEquivalent = inputValue / getRecurringCycleMonths(frequency);

  return {
    inputValue,
    monthlyEquivalent,
    annualEquivalent: monthlyEquivalent * 12,
    contractTotal: monthlyEquivalent * period,
    contractPeriodMonths: period
  };
}

export function calculateMonthlyAdditionalCost(cost: AdditionalCost, contractPeriodMonths = 12): number {
  return normalizeAdditionalCost(cost, contractPeriodMonths).monthlyEquivalent;
}

export function calculateContractAdditionalCost(cost: AdditionalCost, contractPeriodMonths = 12): number {
  return normalizeAdditionalCost(cost, contractPeriodMonths).contractTotal;
}
