import type { ProductItem, RentalItem, ServiceItem, ICMSInterstateRates } from "@/lib/types/pricing"
import type { TaxRegime } from "@/lib/types/tax-regimes"
import type { CostsExpenses } from "@/lib/types/costs-expenses"
import type { LaborCosts } from "@/lib/types/labor-costs"

export type OperationType = "venda" | "locacao" | "servicos"

export type SaleItemCalculation = {
  baseCostUnit: number
  netCostUnit: number
  icmsVendaCalculated: number
  rbUnitario: number
  impostosUnitario: number
  margemComissaoUnitario: number
  difalUnitario: number
}

export type RentalItemCalculation = {
  totalAssetCost: number
  totalBRL: number
  difal: number
  monthlyCost: number
  monthlyCostTotal: number
  marginComissaoValor: number
  impostosValor: number
  rbUnitario: number
  rbTotal: number
}

export type ServiceItemCalculation = {
  hourlyCost: number
  totalCost: number
  sellPricePerHour: number
  totalSellPrice: number
}

export type SalesCalculationResult = {
  taxRegimeName: string
  baseCost: number
  netCost: number
  impostosValor: number
  margemEComissaoValor: number
  finalPrice: number
  itemCalculations: Record<string, SaleItemCalculation>
}

export type RentalCalculationResult = {
  taxRegimeName: string
  totalAssetCost: number
  impostosValorMensal: number
  margemEComissaoValorMensal: number
  monthlyPrice: number
  finalPrice: number
  itemCalculations: Record<string, RentalItemCalculation>
}

export type ServicesCalculationResult = {
  taxRegimeName: string
  baseCost: number
  impostosValor: number
  margemEComissaoValor: number
  finalPrice: number
  divisor: number | null
  itemCalculations: Record<string, ServiceItemCalculation>
}

export class PricingEngine {
  private taxRegime: TaxRegime | null = null
  private costsExpenses: CostsExpenses | null = null
  private laborCosts: LaborCosts | null = null

  configure(taxRegime: TaxRegime | null, costsExpenses: CostsExpenses | null, laborCosts: LaborCosts | null) {
    this.taxRegime = taxRegime
    this.costsExpenses = costsExpenses
    this.laborCosts = laborCosts
  }

  calculateSales(params: {
    items: ProductItem[]
    desiredMargin: number
    isIcmsContributor: boolean
    destinationUF: string
    icmsInterstate: ICMSInterstateRates
  }): SalesCalculationResult {
    const activeRegime = this.taxRegime
    const outrosCustos = this.costsExpenses

    if (!activeRegime || !outrosCustos) {
      return {
        taxRegimeName: "Nenhum regime selecionado",
        baseCost: 0,
        netCost: 0,
        impostosValor: 0,
        margemEComissaoValor: 0,
        finalPrice: 0,
        itemCalculations: {},
      }
    }

    const commissionRate = (outrosCustos.comissaoVenda || 0) / 100
    const marginRate = (params.desiredMargin || 0) / 100

    const pisRate = (activeRegime.pis || 0) / 100
    const cofinsRate = (activeRegime.cofins || 0) / 100
    const icmsFallbackRate = (activeRegime.icms || 0) / 100

    let totalBaseCost = 0
    let totalNetCost = 0
    let totalImpostos = 0
    let totalMargemComissao = 0
    let totalRevenue = 0

    const itemCalculations: Record<string, SaleItemCalculation> = {}

    for (const item of params.items) {
      const quantity = item.quantity || 0
      const unitCost = item.unitCost || 0
      const credit = item.creditoIcmsCompra || 0
      const netCostUnit = unitCost - credit

      totalBaseCost += unitCost * quantity
      totalNetCost += netCostUnit * quantity

      if (quantity <= 0) {
        itemCalculations[item.id] = {
          baseCostUnit: unitCost,
          netCostUnit,
          icmsVendaCalculated: 0,
          rbUnitario: 0,
          impostosUnitario: 0,
          margemComissaoUnitario: 0,
          difalUnitario: 0,
        }
        continue
      }

      let icmsRate = (params.icmsInterstate?.[params.destinationUF] ?? icmsFallbackRate * 100) / 100
      const destInternalRate = (item.icmsDestLocal || 0) / 100

      let difalRate = 0
      if (params.isIcmsContributor && destInternalRate > icmsRate) {
        difalRate = destInternalRate - icmsRate
      }

      if (item.icmsST) {
        icmsRate = 0
        difalRate = 0
      }

      const regimeType = activeRegime.type

      let rbUnitario = 0
      let impostosUnitario = 0
      let difalUnitario = 0
      let margemComissaoUnitario = 0

      if (regimeType === "presumido" || regimeType === "real") {
        const adjustedCost = netCostUnit / (1 - commissionRate - marginRate)
        const divisor = 1 - pisRate - cofinsRate - icmsRate - difalRate
        rbUnitario = divisor > 0 ? adjustedCost / divisor : 0

        difalUnitario = rbUnitario * difalRate
        impostosUnitario = rbUnitario * pisRate + rbUnitario * cofinsRate + rbUnitario * icmsRate + difalUnitario

        margemComissaoUnitario = rbUnitario - impostosUnitario - netCostUnit
      } else if (regimeType === "simples") {
        const simplesRate = (activeRegime.anexoI || 0) / 100
        const divisor = 1 - (commissionRate + marginRate + simplesRate)
        rbUnitario = divisor > 0 ? netCostUnit / divisor : 0

        impostosUnitario = rbUnitario * simplesRate
        difalUnitario = rbUnitario * difalRate
        margemComissaoUnitario = rbUnitario * (commissionRate + marginRate)
      } else {
        // MEI (ou qualquer outro): sem impostos percentuais no cálculo
        const divisor = 1 - (commissionRate + marginRate)
        rbUnitario = divisor > 0 ? netCostUnit / divisor : 0
        impostosUnitario = 0
        difalUnitario = 0
        margemComissaoUnitario = rbUnitario - netCostUnit
      }

      itemCalculations[item.id] = {
        baseCostUnit: unitCost,
        netCostUnit,
        icmsVendaCalculated: icmsRate * 100,
        rbUnitario,
        impostosUnitario,
        margemComissaoUnitario,
        difalUnitario,
      }

      totalRevenue += rbUnitario * quantity
      totalImpostos += impostosUnitario * quantity
      totalMargemComissao += margemComissaoUnitario * quantity
    }

    return {
      taxRegimeName: activeRegime.name,
      baseCost: totalBaseCost,
      netCost: totalNetCost,
      impostosValor: totalImpostos,
      margemEComissaoValor: totalMargemComissao,
      finalPrice: totalRevenue,
      itemCalculations,
    }
  }

  calculateRental(params: {
    items: RentalItem[]
    rentalPeriod: number
    desiredMargin: number
  }): RentalCalculationResult {
    const activeRegime = this.taxRegime
    const outrosCustos = this.costsExpenses

    if (!activeRegime || !outrosCustos) {
      return {
        taxRegimeName: "Nenhum regime selecionado",
        totalAssetCost: 0,
        impostosValorMensal: 0,
        margemEComissaoValorMensal: 0,
        monthlyPrice: 0,
        finalPrice: 0,
        itemCalculations: {},
      }
    }

    const rentalPeriod = params.rentalPeriod || 0
    const financeRate = (outrosCustos.custoFinanceiroMensal || 0) / 100
    const commissionRate = (outrosCustos.comissaoLocacao || 0) / 100
    const marginRate = (params.desiredMargin || 0) / 100

    const pisCofinsRate = (activeRegime.pis + activeRegime.cofins) / 100
    const simplesRate = (activeRegime.anexoIII || 0) / 100

    const itemCalculations: Record<string, RentalItemCalculation> = {}

    let totalAssetCost = 0
    for (const item of params.items) {
      const quantity = item.quantity || 0
      const assetValue = item.assetValueBRL || 0
      const icmsCompra = item.icmsCompra || 0
      const icmsPrRate = (item.icmsPr || 0) / 100

      if (quantity <= 0) {
        itemCalculations[item.id] = {
          totalAssetCost: 0,
          totalBRL: 0,
          difal: 0,
          monthlyCost: 0,
          monthlyCostTotal: 0,
          marginComissaoValor: 0,
          impostosValor: 0,
          rbUnitario: 0,
          rbTotal: 0,
        }
        continue
      }

      const divisor = 1 - icmsPrRate
      let difal = 0
      if (divisor > 0 && icmsPrRate > 0) {
        difal = ((assetValue - icmsCompra) / divisor) * icmsPrRate - icmsCompra
      }
      if (difal < 0) difal = 0

      const totalBRL = assetValue * quantity
      const totalAsset = (assetValue + difal + (item.frete || 0)) * quantity

      itemCalculations[item.id] = {
        totalAssetCost: totalAsset,
        totalBRL,
        difal: difal * quantity,
        monthlyCost: 0,
        monthlyCostTotal: 0,
        marginComissaoValor: 0,
        impostosValor: 0,
        rbUnitario: 0,
        rbTotal: 0,
      }

      totalAssetCost += totalAsset
    }

    if (rentalPeriod <= 0 || totalAssetCost <= 0) {
      return {
        taxRegimeName: activeRegime.name,
        totalAssetCost,
        impostosValorMensal: 0,
        margemEComissaoValorMensal: 0,
        monthlyPrice: 0,
        finalPrice: 0,
        itemCalculations,
      }
    }

    const pmtTotal = this.pmt(financeRate, rentalPeriod, totalAssetCost)

    let totalMonthlyRevenue = 0
    let totalMonthlyTaxes = 0
    let totalMonthlyMarginCommission = 0

    const taxesRate =
      activeRegime.type === "simples"
        ? simplesRate
        : activeRegime.type === "presumido" || activeRegime.type === "real"
          ? pisCofinsRate
          : 0

    for (const item of params.items) {
      const base = itemCalculations[item.id]
      const quantity = item.quantity || 0
      if (!base || quantity <= 0) continue

      const itemMonthlyCostTotal = pmtTotal * (totalAssetCost > 0 ? base.totalAssetCost / totalAssetCost : 0)
      const marginDivisor = 1 - (marginRate + commissionRate)
      const marginCommissionValue =
        marginDivisor > 0 ? (itemMonthlyCostTotal / marginDivisor) * (marginRate + commissionRate) : 0

      const costPlusMargin = itemMonthlyCostTotal + marginCommissionValue
      const revenueDivisor = 1 - taxesRate
      const rbMensal = revenueDivisor > 0 ? costPlusMargin / revenueDivisor : costPlusMargin
      const impostosMensal = rbMensal * taxesRate

      base.monthlyCostTotal = itemMonthlyCostTotal
      base.monthlyCost = itemMonthlyCostTotal / quantity
      base.marginComissaoValor = marginCommissionValue
      base.impostosValor = impostosMensal
      base.rbUnitario = rbMensal / quantity
      base.rbTotal = rbMensal * rentalPeriod

      totalMonthlyRevenue += rbMensal
      totalMonthlyTaxes += impostosMensal
      totalMonthlyMarginCommission += marginCommissionValue
    }

    return {
      taxRegimeName: activeRegime.name,
      totalAssetCost,
      impostosValorMensal: totalMonthlyTaxes,
      margemEComissaoValorMensal: totalMonthlyMarginCommission,
      monthlyPrice: totalMonthlyRevenue,
      finalPrice: totalMonthlyRevenue * rentalPeriod,
      itemCalculations,
    }
  }

  calculateServices(params: { items: ServiceItem[]; desiredMargin: number }): ServicesCalculationResult {
    const activeRegime = this.taxRegime
    const outrosCustos = this.costsExpenses
    const laborCosts = this.laborCosts

    if (!activeRegime || !outrosCustos || !laborCosts) {
      return {
        taxRegimeName: "Nenhum regime selecionado",
        baseCost: 0,
        impostosValor: 0,
        margemEComissaoValor: 0,
        finalPrice: 0,
        divisor: null,
        itemCalculations: {},
      }
    }

    const commissionRate = (outrosCustos.comissaoServico || 0) / 100
    const marginRate = (params.desiredMargin || 0) / 100
    const adminRate = ((outrosCustos.despesasAdmin || 0) + (outrosCustos.outrasDespesas || 0)) / 100

    const monthlyHours = (laborCosts.diasUteisNoMes || 1) * (laborCosts.horasPorDia || 1)
    const encargosPercent =
      (laborCosts.ferias +
        laborCosts.umTercoFerias +
        laborCosts.decimoTerceiro +
        laborCosts.inssBase +
        laborCosts.inssSistemaS +
        laborCosts.inssFeriasDecimo +
        laborCosts.fgts +
        laborCosts.fgtsFeriasDecimo +
        laborCosts.multaFgtsRescisao +
        laborCosts.outros) /
      100
    const beneficiosTotal = laborCosts.valeTransporte + laborCosts.planoSaude + laborCosts.valeAlimentacao

    const calcHourly = (baseSalary: number, contractType: ServiceItem["contractType"]) => {
      if (monthlyHours <= 0) return 0
      if (contractType === "clt") {
        return (baseSalary + baseSalary * encargosPercent + beneficiosTotal) / monthlyHours
      }
      return baseSalary / monthlyHours
    }

    const itemCalculations: Record<string, ServiceItemCalculation> = {}

    let totalCost = 0
    for (const item of params.items) {
      const hourlyCost = calcHourly(item.baseSalary || 0, item.contractType)
      const estimatedHours = item.estimatedHours || 0
      const itemCost = hourlyCost * estimatedHours
      totalCost += itemCost

      itemCalculations[item.id] = {
        hourlyCost,
        totalCost: itemCost,
        sellPricePerHour: 0,
        totalSellPrice: 0,
      }
    }

    const pis = (activeRegime.pis || 0) / 100
    const cofins = (activeRegime.cofins || 0) / 100
    const iss = (activeRegime.iss || 0) / 100
    const irpj = (activeRegime.irpj || 0) / 100
    const csll = (activeRegime.csll || 0) / 100
    const presuncaoServico = (activeRegime.basePresuncaoServico || 0) / 100

    let taxRateA = 0
    let taxRateB = 0

    switch (activeRegime.type) {
      case "presumido":
        taxRateA = pis + cofins + iss
        taxRateB = irpj * presuncaoServico + csll * presuncaoServico
        break
      case "real":
        taxRateA = pis + cofins + iss
        taxRateB = irpj + csll
        break
      case "simples":
        taxRateA = (activeRegime.anexoIII || 0) / 100
        taxRateB = 0
        break
      default:
        taxRateA = 0
        taxRateB = 0
    }

    const t = commissionRate + adminRate + marginRate

    let revenue = 0
    let taxes = 0
    if (activeRegime.type === "real") {
      const baseDivisor = 1 - taxRateA - t
      const r = baseDivisor > 0 ? totalCost / baseDivisor : 0
      const profit = r - r * taxRateA - totalCost - r * t
      revenue = r + (profit > 0 ? profit * taxRateB : 0)

      taxes = revenue * taxRateA
      const profit2 = revenue - taxes - totalCost - revenue * (commissionRate + adminRate + marginRate)
      if (profit2 > 0) {
        taxes += profit2 * taxRateB
      }
    } else {
      const baseDivisor = 1 - taxRateA - t - taxRateB
      revenue = baseDivisor > 0 ? totalCost / baseDivisor : 0
      taxes = revenue * taxRateA
      if (activeRegime.type === "presumido") {
        taxes += revenue * taxRateB
      }
    }

    const margemEComissao = revenue - taxes - totalCost - revenue * adminRate
    const divisor = totalCost > 0 ? revenue / totalCost : null

    for (const item of params.items) {
      const calc = itemCalculations[item.id]
      if (!calc) continue
      const sellPricePerHour = (calc.hourlyCost || 0) * (divisor || 0)
      calc.sellPricePerHour = sellPricePerHour
      calc.totalSellPrice = sellPricePerHour * (item.estimatedHours || 0)
    }

    return {
      taxRegimeName: activeRegime.name,
      baseCost: totalCost,
      impostosValor: taxes,
      margemEComissaoValor: margemEComissao,
      finalPrice: revenue,
      divisor,
      itemCalculations,
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number.isFinite(value) ? value : 0)
  }

  private pmt(rate: number, nper: number, pv: number): number {
    if (nper <= 0 || rate < 0) return 0
    if (rate === 0) return pv / nper
    const t = Math.pow(1 + rate, nper)
    return (rate * pv * t) / (t - 1)
  }
}

export const pricingEngine = new PricingEngine()

export function createConfiguredPricingEngine(
  taxRegime: TaxRegime | null,
  costsExpenses: CostsExpenses | null,
  laborCosts: LaborCosts | null,
): PricingEngine {
  const engine = new PricingEngine()
  engine.configure(taxRegime, costsExpenses, laborCosts)
  return engine
}

