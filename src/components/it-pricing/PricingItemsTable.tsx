"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2 } from "lucide-react"
import type { Dispatch, SetStateAction } from "react"
import type { ProductItem, RentalItem, ServiceItem } from "@/lib/types/pricing"
import type {
  RentalCalculationResult,
  SalesCalculationResult,
  ServicesCalculationResult,
} from "@/lib/utils/pricing-engine"
import type { LaborCosts } from "@/lib/types/labor-costs"

type OperationType = "venda" | "locacao" | "servicos"

type ColumnConfig = {
  header: string
  accessor: string
  width: string
  type?: "number" | "text"
  step?: string
  align?: "center"
  isReadOnly?: boolean
  formatter?: (value: number) => string
}

const columnsByType: Record<OperationType, ColumnConfig[]> = {
  venda: [
    { header: "Descrição", accessor: "description", width: "250px", type: "text" },
    { header: "Qtde", accessor: "quantity", type: "number", width: "80px", align: "center", step: "1" },
    { header: "Custo Unit. R$", accessor: "unitCost", type: "number", width: "120px" },
    { header: "Créd. ICMS R$", accessor: "creditoIcmsCompra", type: "number", width: "120px" },
    { header: "Custo Total", accessor: "baseCost", isReadOnly: true, width: "120px" },
    { header: "ICMS Venda %", accessor: "icmsVendaCalculated", isReadOnly: true, width: "120px" },
    { header: "ICMS Dest. Local %", accessor: "icmsDestLocal", type: "number", width: "120px" },
    { header: "DIFAL Venda", accessor: "difalVenda", isReadOnly: true, width: "120px" },
    { header: "ICMS ST", accessor: "icmsST", width: "80px", align: "center" },
    { header: "(Margem+Comissão)", accessor: "marginComissaoValor", isReadOnly: true, width: "150px" },
    { header: "Impostos", accessor: "impostosValor", isReadOnly: true, width: "120px" },
    { header: "Receita Bruta", accessor: "rbUnitario", isReadOnly: true, width: "120px" },
  ],
  servicos: [
    { header: "Descrição", accessor: "description", width: "25%", type: "text" },
    { header: "Salário Base", accessor: "baseSalary", type: "number", width: "15%" },
    { header: "Tipo", accessor: "contractType", width: "10%" },
    { header: "Horas", accessor: "estimatedHours", type: "number", width: "10%", step: "0.5" },
    { header: "Custo/Hora", accessor: "hourlyCost", isReadOnly: true, width: "10%" },
    { header: "Venda/Hora", accessor: "sellPricePerHour", isReadOnly: true, width: "10%" },
    { header: "Subtotal/custo", accessor: "totalCost", isReadOnly: true, width: "10%" },
    { header: "Subtotal/venda", accessor: "totalSellPrice", isReadOnly: true, width: "10%" },
  ],
  locacao: [
    { header: "Descrição", accessor: "description", width: "200px", type: "text" },
    { header: "QTD", accessor: "quantity", type: "number", width: "80px", align: "center", step: "1" },
    { header: "Valor Unit. R$", accessor: "assetValueBRL", type: "number", width: "120px" },
    { header: "Valor Total R$", accessor: "totalBRL", isReadOnly: true, width: "120px" },
    { header: "ICMS Compra", accessor: "icmsCompra", type: "number", width: "120px" },
    { header: "ICMS PR %", accessor: "icmsPr", type: "number", width: "120px" },
    { header: "DIFAL R$", accessor: "difal", isReadOnly: true, width: "120px" },
    { header: "Frete R$", accessor: "frete", type: "number", width: "120px" },
    { header: "Custo Total Ativo R$", accessor: "totalAssetCost", isReadOnly: true, width: "150px" },
    { header: "CT Mensalizado R$", accessor: "monthlyCostTotal", isReadOnly: true, width: "150px" },
    { header: "(Margem + Comissão)", accessor: "marginComissaoValor", isReadOnly: true, width: "150px" },
    { header: "Impostos R$", accessor: "impostosValor", isReadOnly: true, width: "120px" },
    { header: "Receita Bruta R$", accessor: "rbTotal", isReadOnly: true, width: "150px" },
    { header: "RB Unit. R$", accessor: "rbUnitario", isReadOnly: true, width: "150px" },
  ],
}

const totalLabels: Record<OperationType, string> = {
  venda: "Custo Base Total",
  servicos: "Custo Base Total",
  locacao: "Custo Base Mensal (Total)",
}

type PricingItemsTableProps = {
  operationType: OperationType
  saleItems?: ProductItem[]
  rentalItems?: RentalItem[]
  serviceItems?: ServiceItem[]
  setSaleItems?: Dispatch<SetStateAction<ProductItem[]>>
  setRentalItems?: Dispatch<SetStateAction<RentalItem[]>>
  setServiceItems?: Dispatch<SetStateAction<ServiceItem[]>>
  calculationResults: SalesCalculationResult | RentalCalculationResult | ServicesCalculationResult
  laborCosts?: LaborCosts | null
  formatCurrency: (value: number) => string
  formatPercent: (value: number) => string
}

export function PricingItemsTable({
  operationType,
  saleItems,
  rentalItems,
  serviceItems,
  setSaleItems,
  setRentalItems,
  setServiceItems,
  calculationResults,
  laborCosts,
  formatCurrency,
  formatPercent,
}: PricingItemsTableProps) {
  const columns = columnsByType[operationType]
  const items =
    operationType === "venda" ? saleItems ?? [] : operationType === "locacao" ? rentalItems ?? [] : serviceItems ?? []
  const itemCalculations = (calculationResults as { itemCalculations?: Record<string, any> }).itemCalculations ?? {}

  const setItems = (updater: (items: any[]) => any[]) => {
    if (operationType === "venda" && setSaleItems) setSaleItems(updater as any)
    if (operationType === "locacao" && setRentalItems) setRentalItems(updater as any)
    if (operationType === "servicos" && setServiceItems) setServiceItems(updater as any)
  }

  const updateItem = (id: string, field: string, value: string | number | boolean) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const addItem = () => {
    if (operationType === "venda") {
      setItems((prev) => [
        ...prev,
        { id: Date.now().toString(), description: "", quantity: 1, unitCost: 0, creditoIcmsCompra: 0, icmsDestLocal: 18, icmsST: false },
      ])
    }
    if (operationType === "locacao") {
      setItems((prev) => [
        ...prev,
        { id: Date.now().toString(), description: "", quantity: 1, assetValueBRL: 5000, icmsCompra: 600, icmsPr: 12, frete: 0 },
      ])
    }
    if (operationType === "servicos") {
      setItems((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          description: "",
          estimatedHours: 8,
          baseSalary: laborCosts?.salarioBasePadrao ?? 0,
          contractType: "clt",
        },
      ])
    }
  }

  const baseTotal = items.reduce((sum, item) => {
    const calc = itemCalculations[item.id] ?? {}
    const quantity = (item as { quantity?: number }).quantity ?? 1
    let value = 0
    if (operationType === "venda") value = quantity * ((calc.baseCostUnit ?? (item as any).unitCost) || 0)
    if (operationType === "locacao") value = quantity * (calc.monthlyCost || 0)
    if (operationType === "servicos") value = quantity * (calc.totalCost || 0)
    return sum + value
  }, 0)

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.header}
                  style={{ width: column.width, minWidth: column.width }}
                  className={`p-2 text-xs font-semibold text-muted-foreground ${column.align === "center" ? "text-center" : "text-left"}`}
                >
                  {column.header}
                </th>
              ))}
              <th className="w-12" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const calc = itemCalculations[item.id] ?? {}
              const quantity = (item as { quantity?: number }).quantity ?? 1
              const displayValues: Record<string, number> = { ...calc }

              if (operationType === "venda") {
                displayValues.baseCost = ((calc.baseCostUnit ?? (item as any).unitCost) || 0) * quantity
                displayValues.marginComissaoValor = (calc.margemComissaoUnitario || 0) * quantity
                displayValues.impostosValor = (calc.impostosUnitario || 0) * quantity
                displayValues.rbUnitario = (calc.rbUnitario || 0) * quantity
                displayValues.difalVenda = (calc.difalUnitario || 0) * quantity
                displayValues.icmsVendaCalculated = calc.icmsVendaCalculated || 0
              }

              if (operationType === "locacao") {
                displayValues.totalBRL = ((item as any).assetValueBRL || 0) * quantity
                displayValues.totalAssetCost = calc.totalAssetCost || 0
                displayValues.monthlyCostTotal = calc.monthlyCostTotal || 0
                displayValues.marginComissaoValor = calc.marginComissaoValor || 0
                displayValues.impostosValor = calc.impostosValor || 0
                displayValues.rbTotal = calc.rbTotal || 0
                displayValues.rbUnitario = calc.rbUnitario || 0
              }

              if (operationType === "servicos") {
                displayValues.hourlyCost = calc.hourlyCost || 0
                displayValues.sellPricePerHour = calc.sellPricePerHour || 0
                displayValues.totalCost = calc.totalCost || 0
                displayValues.totalSellPrice = calc.totalSellPrice || 0
              }

              return (
                <tr key={item.id} className="border-b last:border-b-0">
                  {columns.map((column) => {
                    const isReadOnly = column.isReadOnly
                    const accessor = column.accessor
                    const value = (item as any)[accessor]
                    const displayValue = displayValues[accessor]
                    const inputClass =
                      accessor === "description"
                        ? "w-full p-2 h-9 text-left min-w-[100px] bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                        : "w-full p-2 h-9 text-right min-w-[100px] bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"

                    return (
                      <td
                        key={accessor}
                        style={{ width: column.width }}
                        className={`p-1 align-top ${column.align === "center" ? "text-center" : ""}`}
                      >
                        {isReadOnly ? (
                          <span className="font-mono text-foreground p-2 block text-right h-9">
                            {column.accessor === "icmsVendaCalculated"
                              ? formatPercent(displayValue ?? 0)
                              : column.accessor === "baseCost" ||
                                  column.accessor === "difalVenda" ||
                                  column.accessor === "marginComissaoValor" ||
                                  column.accessor === "impostosValor" ||
                                  column.accessor === "rbUnitario" ||
                                  column.accessor === "totalBRL" ||
                                  column.accessor === "difal" ||
                                  column.accessor === "totalAssetCost" ||
                                  column.accessor === "monthlyCostTotal" ||
                                  column.accessor === "rbTotal" ||
                                  column.accessor === "hourlyCost" ||
                                  column.accessor === "sellPricePerHour" ||
                                  column.accessor === "totalCost" ||
                                  column.accessor === "totalSellPrice"
                                ? formatCurrency(displayValue ?? 0)
                                : displayValue ?? "-"}
                          </span>
                        ) : accessor === "description" ? (
                          <input
                            type="text"
                            value={value ?? ""}
                            onChange={(event) => updateItem(item.id, accessor, event.target.value)}
                            className={inputClass}
                          />
                        ) : accessor === "icmsST" ? (
                          <div className="flex justify-center items-center h-9">
                            <Checkbox
                              checked={Boolean((item as any).icmsST)}
                              onCheckedChange={(checked) => updateItem(item.id, "icmsST", checked === true)}
                            />
                          </div>
                        ) : accessor === "contractType" ? (
                          <select
                            value={(item as any).contractType}
                            onChange={(event) => updateItem(item.id, "contractType", event.target.value)}
                            className="w-full h-9 bg-background border border-input rounded-md px-2 text-foreground"
                          >
                            <option value="clt">CLT</option>
                            <option value="pj">Terceiro</option>
                          </select>
                        ) : (
                          <input
                            type={column.type ?? "number"}
                            value={value ?? ""}
                            step={column.step ?? "0.01"}
                            onChange={(event) =>
                              updateItem(
                                item.id,
                                accessor,
                                column.type === "text" ? event.target.value : Number.parseFloat(event.target.value) || 0,
                              )
                            }
                            className={inputClass}
                          />
                        )}
                      </td>
                    )
                  })}
                  <td className="p-1 text-center align-top pt-2.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive h-7 w-7"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-2">
        <Button
          variant="link"
          onClick={addItem}
          className="p-2 text-primary hover:scale-105 transition-all duration-300 tech-glow rounded-lg"
        >
          <Plus className="h-4 w-4" />
          <span className="ml-2">➕ Adicionar Item</span>
        </Button>
        <div className="text-right">
          <span className="text-xs text-muted-foreground block">{totalLabels[operationType]}</span>
          <span className="font-bold text-lg text-foreground">{formatCurrency(baseTotal)}</span>
        </div>
      </div>
    </div>
  )
}
