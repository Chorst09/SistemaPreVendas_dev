"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TaxRegime } from '@/lib/types/tax-regimes'
import type { CostsExpenses } from '@/lib/types/costs-expenses'
import type { LaborCosts } from '@/lib/types/labor-costs'
import type { CompanyData } from '@/lib/types/company-data'
import { initialTaxRegimes } from '@/lib/types/tax-regimes'
import { initialCostsExpenses } from '@/lib/types/costs-expenses'
import { initialLaborCosts } from '@/lib/types/labor-costs'
import { defaultCompanyData } from '@/lib/types/company-data'
import { defaultICMSRates, type ICMSInterstateRates } from '@/lib/types/pricing'

interface ConfigurationState {
  taxRegimes: TaxRegime[]
  costsExpenses: CostsExpenses
  laborCosts: LaborCosts
  companyData: CompanyData
  icmsRates: ICMSInterstateRates
  
  // Getters
  getActiveTaxRegime: () => TaxRegime | null
  
  // Actions
  setTaxRegimes: (regimes: TaxRegime[]) => void
  setCostsExpenses: (costs: CostsExpenses) => void
  setLaborCosts: (labor: LaborCosts) => void
  setCompanyData: (companyData: CompanyData) => void
  setIcmsRates: (rates: ICMSInterstateRates) => void
}

export const useConfigurationStore = create<ConfigurationState>()(
  persist(
    (set, get) => ({
      taxRegimes: initialTaxRegimes || [],
      costsExpenses: initialCostsExpenses,
      laborCosts: initialLaborCosts,
      companyData: defaultCompanyData,
      icmsRates: defaultICMSRates,

      getActiveTaxRegime: () => {
        const { taxRegimes } = get()
        return taxRegimes.find(regime => regime.active) || null
      },

      setTaxRegimes: (regimes) => set({ taxRegimes: regimes }),
      setCostsExpenses: (costs) => set({ costsExpenses: costs }),
      setLaborCosts: (labor) => set({ laborCosts: labor }),
      setCompanyData: (companyData) => set({ companyData }),
      setIcmsRates: (rates) => set({ icmsRates: rates }),
    }),
    {
      name: 'it-pricing-configuration',
      version: 1,
    },
  ),
)
