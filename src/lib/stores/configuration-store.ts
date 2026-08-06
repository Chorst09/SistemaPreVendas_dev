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

export interface ModuleTaxConfig {
  taxRegimeId: string | null
}

export interface OutsourcingConfig {
  comissaoVenda: number
  custosOperacionais: number
  margemPadrao: number
  taxRegimeId: string | null
  custosBase: {
    "Preto e Branco": number
    "Colorida": number
    "A3 Preto e Branco": number
    "A3 Colorida": number
  }
  taxaFinanceiraMensal: number
}

const defaultOutsourcingConfig: OutsourcingConfig = {
  comissaoVenda: 3,
  custosOperacionais: 8,
  margemPadrao: 25,
  taxRegimeId: null,
  custosBase: {
    "Preto e Branco": 0.08,
    "Colorida": 0.35,
    "A3 Preto e Branco": 0.12,
    "A3 Colorida": 0.50
  },
  taxaFinanceiraMensal: 1.17
}

const defaultModuleConfig: ModuleTaxConfig = {
  taxRegimeId: null
}

interface ConfigurationState {
  taxRegimes: TaxRegime[]
  costsExpenses: CostsExpenses
  laborCosts: LaborCosts
  companyData: CompanyData
  icmsRates: ICMSInterstateRates
  outsourcingConfig: OutsourcingConfig
  nocConfig: ModuleTaxConfig
  serviceDeskConfig: ModuleTaxConfig
  
  // Getters
  getActiveTaxRegime: () => TaxRegime | null
  getRegimeForModule: (moduleConfig: ModuleTaxConfig) => TaxRegime | null
  
  // Actions
  setTaxRegimes: (regimes: TaxRegime[]) => void
  setCostsExpenses: (costs: CostsExpenses) => void
  setLaborCosts: (labor: LaborCosts) => void
  setCompanyData: (companyData: CompanyData) => void
  setIcmsRates: (rates: ICMSInterstateRates) => void
  setOutsourcingConfig: (config: Partial<OutsourcingConfig>) => void
  setNocConfig: (config: Partial<ModuleTaxConfig>) => void
  setServiceDeskConfig: (config: Partial<ModuleTaxConfig>) => void
}

export const useConfigurationStore = create<ConfigurationState>()(
  persist(
    (set, get) => ({
      taxRegimes: initialTaxRegimes || [],
      costsExpenses: initialCostsExpenses,
      laborCosts: initialLaborCosts,
      companyData: defaultCompanyData,
      icmsRates: defaultICMSRates,
      outsourcingConfig: defaultOutsourcingConfig,
      nocConfig: { ...defaultModuleConfig },
      serviceDeskConfig: { ...defaultModuleConfig },

      getActiveTaxRegime: () => {
        const { taxRegimes } = get()
        return taxRegimes.find(regime => regime.active) || null
      },

      getRegimeForModule: (moduleConfig) => {
        const { taxRegimes } = get()
        if (moduleConfig.taxRegimeId) {
          return taxRegimes.find(r => r.id === moduleConfig.taxRegimeId) || null
        }
        return taxRegimes.find(regime => regime.active) || null
      },

      setTaxRegimes: (regimes) => set({ taxRegimes: regimes }),
      setCostsExpenses: (costs) => set({ costsExpenses: costs }),
      setLaborCosts: (labor) => set({ laborCosts: labor }),
      setCompanyData: (companyData) => set({ companyData }),
      setIcmsRates: (rates) => set({ icmsRates: rates }),
      setOutsourcingConfig: (config) => set((state) => ({ 
        outsourcingConfig: { ...state.outsourcingConfig, ...config } 
      })),
      setNocConfig: (config) => set((state) => ({
        nocConfig: { ...state.nocConfig, ...config }
      })),
      setServiceDeskConfig: (config) => set((state) => ({
        serviceDeskConfig: { ...state.serviceDeskConfig, ...config }
      })),
    }),
    {
      name: 'it-pricing-configuration',
      version: 2,
      merge: (persistedState: any, currentState: ConfigurationState): ConfigurationState => {
        // Garantir que todos os campos numéricos existam com valores padrão
        const mergedCosts: CostsExpenses = {
          ...initialCostsExpenses,
          ...(persistedState?.costsExpenses || {}),
        }
        const mergedLabor: LaborCosts = {
          ...initialLaborCosts,
          ...(persistedState?.laborCosts || {}),
        }
        return {
          ...currentState,
          ...persistedState,
          costsExpenses: mergedCosts,
          laborCosts: mergedLabor,
          taxRegimes: persistedState?.taxRegimes || initialTaxRegimes || [],
          icmsRates: persistedState?.icmsRates || defaultICMSRates,
          outsourcingConfig: { ...defaultOutsourcingConfig, ...(persistedState?.outsourcingConfig || {}) },
          nocConfig: { ...defaultModuleConfig, ...(persistedState?.nocConfig || {}) },
          serviceDeskConfig: { ...defaultModuleConfig, ...(persistedState?.serviceDeskConfig || {}) },
        }
      },
    },
  ),
)
