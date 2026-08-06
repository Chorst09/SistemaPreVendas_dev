"use client"

import { useMemo, useState } from "react"
import { ArrowLeft, BarChart3, ClipboardList } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ModuleShortcuts } from "./ModuleShortcuts"
import { PricingItemsTable } from "./PricingItemsTable"
import type { ProductItem } from "@/lib/types/pricing"
import { defaultICMSRates, stateNames } from "@/lib/types/pricing"
import { createConfiguredPricingEngine } from "@/lib/utils/pricing-engine"
import { useConfigurationStore } from "@/lib/stores/configuration-store"
import type { ProposalClientData } from "@/components/shared/ProposalClientDataForm"
import { useITBudgetStore } from "@/lib/stores/it-budget-store"
import { BudgetDraftPanel } from "./BudgetDraftPanel"

interface SalesModuleProps {
  onBack: () => void
  onModuleChange?: (module: "sales" | "rental" | "services") => void
  onNavigateToProposals?: () => void
  proposalClientData?: ProposalClientData | null
  initialItems?: ProductItem[]
  initialMargin?: number
}

export function SalesModule({ onBack, onModuleChange, onNavigateToProposals, proposalClientData, initialItems, initialMargin }: SalesModuleProps) {
  const { getActiveTaxRegime, costsExpenses, icmsRates } = useConfigurationStore()
  const [products, setProducts] = useState<ProductItem[]>(
    initialItems && initialItems.length > 0
      ? initialItems
      : [
          {
            id: "1",
            description: "Servidor Dell",
            quantity: 1,
            unitCost: 8500,
            creditoIcmsCompra: 1020,
            icmsDestLocal: 18,
            icmsST: false,
          },
        ]
  )

  const [desiredMargin, setDesiredMargin] = useState(initialMargin ?? 20)
  const [isFinalConsumer, setIsFinalConsumer] = useState(false)
  const [destinationUF, setDestinationUF] = useState<string>("SP")
  const [analysisTab, setAnalysisTab] = useState<"resumo" | "analise">("resumo")
  const { addItems } = useITBudgetStore()

  const activeTaxRegime = getActiveTaxRegime()
  const configuredPricingEngine = useMemo(
    () => createConfiguredPricingEngine(activeTaxRegime, costsExpenses, null),
    [activeTaxRegime, costsExpenses],
  )

  if (!costsExpenses || !activeTaxRegime) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Carregando Configurações...</h2>
          <p className="text-muted-foreground">
            {!activeTaxRegime && "Nenhum regime tributário ativo encontrado. "}
            {!costsExpenses && "Configurações de custos não encontradas. "}
            <br />
            Vá em Configurações para definir os parâmetros necessários.
          </p>
        </div>
      </div>
    )
  }

  const salesCalc = useMemo(() => {
    return configuredPricingEngine.calculateSales({
      items: products,
      desiredMargin,
      isIcmsContributor: isFinalConsumer,
      destinationUF,
      icmsInterstate: icmsRates || defaultICMSRates,
    })
  }, [configuredPricingEngine, products, desiredMargin, isFinalConsumer, destinationUF, icmsRates])

  const suggestedPrice = salesCalc.finalPrice
  const formatCurrency = configuredPricingEngine.formatCurrency
  const formatPercent = (value: number) =>
    Number.isFinite(value)
      ? `${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
      : "0,00%"
  const ufOptions = useMemo(() => Object.keys(stateNames).sort(), [])
  const isSaveDisabled = suggestedPrice <= 0
  const baseButtonClass =
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transition-all"

  const handleOptimizePrice = () => {
    alert("Funcionalidade de otimização com IA em desenvolvimento!")
  }

  const handleAddToBudget = () => {
    const items = products.map((product) => {
      const unitPrice = salesCalc.itemCalculations[product.id]?.rbUnitario || 0
      return {
        module: "sales" as const,
        description: product.description,
        quantity: product.quantity,
        unitPrice,
        totalPrice: unitPrice * (product.quantity || 0),
        // Campos originais para edição posterior
        originalItem: {
          id: product.id,
          description: product.description,
          quantity: product.quantity,
          unitCost: product.unitCost,
          creditoIcmsCompra: product.creditoIcmsCompra,
          icmsDestLocal: product.icmsDestLocal,
          icmsST: product.icmsST,
        },
        originalMargin: desiredMargin,
      }
    })

    addItems(items)
    alert("Itens adicionados ao orçamento.")
  }

  return (
    <div className="min-h-screen bg-background text-foreground tech-background">
      <div className="max-w-screen-2xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <button type="button" onClick={onBack} className={`${baseButtonClass} btn-3d-secondary h-9 px-3`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </button>
        </div>

        {onModuleChange && <ModuleShortcuts currentModule="sales" onModuleChange={onModuleChange} />}

        <div className="space-y-8">
          <div className="glass-card p-4 sm:p-6 rounded-lg tech-glow floating-animation">
            <h3 className="text-lg font-headline font-semibold text-primary mb-4 border-b border-primary/20 pb-3 flex items-center gap-2">
              ⚙️ Parâmetros de Cálculo
            </h3>

            <div className="space-y-6">
              <PricingItemsTable
                operationType="venda"
                saleItems={products}
                setSaleItems={setProducts}
                calculationResults={salesCalc}
                formatCurrency={formatCurrency}
                formatPercent={formatPercent}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <label className="text-sm text-foreground/80">Margem de Lucro Desejada</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={desiredMargin}
                      onChange={(event) => setDesiredMargin(Number.parseFloat(event.target.value) || 0)}
                      className="w-full p-2 h-9 text-right min-w-[100px] bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      step="1"
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="isIcmsContributor"
                    checked={isFinalConsumer}
                    onCheckedChange={(checked) => setIsFinalConsumer(checked === true)}
                  />
                  <label htmlFor="isIcmsContributor" className="text-sm text-foreground/80">
                    Consumidor Final é Contribuinte do ICMS?
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="destinationUF" className="text-sm text-foreground/80">
                    UF Destino:
                  </label>
                  <select
                    id="destinationUF"
                    name="destinationUF"
                    value={destinationUF}
                    onChange={(event) => setDestinationUF(event.target.value)}
                    className="bg-background border border-input rounded-md text-foreground py-1 px-2 focus:ring-ring focus:border-ring"
                  >
                    {ufOptions.map((uf) => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card tech-glow h-full flex flex-col floating-animation">
            <div className="bg-primary text-primary-foreground rounded-t-lg px-6 py-4">
              <h3 className="font-headline text-xl flex items-center">
                <BarChart3 className="w-6 h-6 mr-2" />
                Resultados e Análise
              </h3>
            </div>
            <div className="p-6 flex-grow flex flex-col">
              <Tabs
                value={analysisTab}
                onValueChange={(value) => setAnalysisTab(value as "resumo" | "analise")}
                className="flex-grow flex flex-col"
              >
                <TabsList className="grid w-full grid-cols-2 bg-muted/60">
                  <TabsTrigger value="resumo">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Resumo
                  </TabsTrigger>
                  <TabsTrigger value="analise">
                    <ClipboardList className="w-4 h-4 mr-2" />
                    Análise
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="resumo" className="flex-grow flex flex-col justify-between mt-4">
                  <div className="text-center my-4">
                    <p className="text-muted-foreground text-sm">Preço Final Sugerido</p>
                    <p className="text-4xl lg:text-5xl font-bold text-primary tracking-tight my-2 font-headline">
                      {formatCurrency(suggestedPrice)}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 text-center mb-4 border-t pt-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Custo Base</p>
                      <p className="text-lg font-semibold">{formatCurrency(salesCalc.baseCost)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">MARGEM+COM</p>
                      <p className="text-lg font-semibold">{formatCurrency(salesCalc.margemEComissaoValor)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Impostos</p>
                      <p className="text-lg font-semibold">{formatCurrency(salesCalc.impostosValor)}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mt-auto">
                    <button
                      type="button"
                      onClick={handleOptimizePrice}
                      className={`${baseButtonClass} btn-3d-secondary w-full h-10`}
                    >
                      💡 Otimizar Preço com IA
                    </button>
                    <button
                      type="button"
                      onClick={handleAddToBudget}
                      className={`${baseButtonClass} btn-3d-success w-full h-10`}
                      disabled={isSaveDisabled}
                    >
                      ✅ Adicionar ao Orçamento
                    </button>
                  </div>
                </TabsContent>

                <TabsContent value="analise" className="mt-4">
                  <div className="space-y-4 text-sm max-h-[450px] overflow-y-auto pr-2">
                    <h4 className="text-md font-semibold text-primary">Análise DRE - Demonstrativo de Resultado</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 rounded-md bg-muted/40">
                        <span className="text-foreground/80">Receita Bruta</span>
                        <span className="font-mono text-primary">{formatCurrency(suggestedPrice)}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded-md bg-muted/40">
                        <span className="text-foreground/80">(-) Impostos</span>
                        <span className="font-mono text-destructive">{formatCurrency(salesCalc.impostosValor)}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded-md bg-muted/40">
                        <span className="text-foreground/80">(-) Custos Diretos</span>
                        <span className="font-mono text-destructive">{formatCurrency(salesCalc.baseCost)}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded-md bg-muted/80 font-semibold">
                        <span className="text-foreground">Lucro Líquido</span>
                        <span className="font-mono text-primary">{formatCurrency(salesCalc.margemEComissaoValor)}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded-md bg-muted/40 text-xs">
                        <span className="text-muted-foreground">Margem Líquida</span>
                        <span className="font-mono text-primary">
                          {suggestedPrice > 0
                            ? ((salesCalc.margemEComissaoValor / suggestedPrice) * 100).toFixed(1)
                            : "0.0"}
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>

        <BudgetDraftPanel
          proposalClientData={proposalClientData}
          onNavigateToProposals={onNavigateToProposals}
        />
      </div>
    </div>
  )
}
