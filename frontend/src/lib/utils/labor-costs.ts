import { BenefitPackage, TeamMember, TeamMemberNew } from '@/lib/types/service-desk-pricing';

export interface LaborCostBreakdown {
  fixedBenefits: number;
  vacationProvision: number;
  vacationThirdProvision: number;
  thirteenthSalaryProvision: number;
  fgts: number;
  employerSocialSecurity: number;
  customBenefits: number;
  totalBenefitsAndCharges: number;
  totalMonthlyCost: number;
}

export const DEFAULT_LABOR_CHARGES = {
  vacation: 8.33,
  thirteenthSalary: 8.33,
  vacationThird: 2.78,
  fgts: 8,
  employerSocialSecurity: 20
};

const asPositiveNumber = (value: unknown, fallback = 0): number => {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;
};

export function resolveWorkload(member: Partial<TeamMember | TeamMemberNew>): number {
  if (typeof member.workload === 'number') {
    return member.workload > 0 ? member.workload : 0;
  }

  if (member.workingHours === 6) {
    return 30;
  }

  return 40;
}

export function calculateLaborCostBreakdown(
  salary: number,
  benefits?: Partial<BenefitPackage>
): LaborCostBreakdown {
  const salaryBase = asPositiveNumber(salary);
  const fixedBenefits =
    asPositiveNumber(benefits?.healthInsurance) +
    asPositiveNumber(benefits?.mealVoucher) +
    asPositiveNumber(benefits?.transportVoucher) +
    asPositiveNumber(benefits?.lifeInsurance);

  const vacationRate = asPositiveNumber(benefits?.vacation, DEFAULT_LABOR_CHARGES.vacation);
  const thirteenthRate = asPositiveNumber(benefits?.thirteenthSalary, DEFAULT_LABOR_CHARGES.thirteenthSalary);
  const vacationThirdRate = asPositiveNumber(
    benefits?.vacationThird,
    vacationRate > 0 ? DEFAULT_LABOR_CHARGES.vacationThird : 0
  );
  const fgtsRate = asPositiveNumber(benefits?.fgts, DEFAULT_LABOR_CHARGES.fgts);
  const socialSecurityRate = asPositiveNumber(
    benefits?.employerSocialSecurity ?? benefits?.inss,
    DEFAULT_LABOR_CHARGES.employerSocialSecurity
  );

  const vacationProvision = salaryBase * (vacationRate / 100);
  const thirteenthSalaryProvision = salaryBase * (thirteenthRate / 100);
  const vacationThirdProvision = salaryBase * (vacationThirdRate / 100);
  const provisionBase = vacationProvision + thirteenthSalaryProvision + vacationThirdProvision;
  const fgtsBase = benefits?.fgtsOnProvisions === false ? salaryBase : salaryBase + provisionBase;
  const employerChargeBase = benefits?.socialSecurityOnProvisions === false ? salaryBase : salaryBase + provisionBase;

  const fgts = fgtsBase * (fgtsRate / 100);
  const employerSocialSecurity = employerChargeBase * (socialSecurityRate / 100);
  const customBenefits = (benefits?.otherBenefits || []).reduce((sum, benefit) => {
    return sum + (benefit.type === 'fixed'
      ? asPositiveNumber(benefit.value)
      : salaryBase * (asPositiveNumber(benefit.value) / 100));
  }, 0);

  const totalBenefitsAndCharges =
    fixedBenefits +
    vacationProvision +
    vacationThirdProvision +
    thirteenthSalaryProvision +
    fgts +
    employerSocialSecurity +
    customBenefits;

  return {
    fixedBenefits,
    vacationProvision,
    vacationThirdProvision,
    thirteenthSalaryProvision,
    fgts,
    employerSocialSecurity,
    customBenefits,
    totalBenefitsAndCharges,
    totalMonthlyCost: salaryBase + totalBenefitsAndCharges
  };
}

export function calculateMemberCostPerHour(member: Partial<TeamMember | TeamMemberNew>): number {
  const monthlyHours = resolveWorkload(member) * (52 / 12);
  if (monthlyHours <= 0) {
    return 0;
  }

  const cost = calculateLaborCostBreakdown(asPositiveNumber(member.salary), member.benefits);
  return cost.totalMonthlyCost / monthlyHours;
}
