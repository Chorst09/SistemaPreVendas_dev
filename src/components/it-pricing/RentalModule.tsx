"use client"

import { useMemo, useState } from "react"
import { ArrowLeft, BarChart3, ClipboardList } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ModuleShortcuts } from "./ModuleShortcuts"
import { PricingItemsTable } from "./PricingItemsTable"
import type { RentalItem } from "@/lib/types/pricing"
import { createConfiguredPricingEngine } from "@/lib/utils/pricing-engine"
import { useConfigurationStore } from "@/lib/stores/configuration-store"
import { usePricingIntegration } from "@/hooks/use-pricing-integration"
import { ProposalClientForm, type ClientData } from "@/components/calculators/ProposalClientForm"
import type { ProposalClientData } from "@/components/shared/ProposalClientDataForm"
import { mapProposalClientDataToLegacyClientData } from "@/components/shared/proposalClientDataMapper"

interface RentalModuleProps {
  onBack: () => void
  onModuleChange?: (module: "sales" | "rental" | "services") => void
  onNavigateToProposals?: () => void
  proposalClientData?: ProposalClientData | null
}

export function RentalModule({ onBack, onModuleChange, onNavigateToProposals, proposalClientData }: RentalModuleProps) {
  const { getActiveTaxRegime, costsExpenses, laborCosts } = useConfigurationStore()
  const [contractPeriod, setContractPeriod] = useState(12)
  const [desiredMargin, setDesiredMargin] = useState(20)
  const [analysisTab, setAnalysisTab] = useState<"resumo" | "analise">("resumo")
  const [showGoToProposal, setShowGoToProposal] = useState(false)
  const [showClientForm, setShowClientForm] = useState(false)

  const { createQuoteFromPricingData } = usePricingIntegration()

  const activeTaxRegime = getActiveTaxRegime()
  const configuredPricingEngine = useMemo(
    () => createConfiguredPricingEngine(activeTaxRegime, costsExpenses, laborCosts),
    [activeTaxRegime, costsExpenses, laborCosts],
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

  const [rentalItems, setRentalItems] = useState<RentalItem[]>([
    {
      id: "1",
      description: "Servidor Dell",
      quantity: 1,
      assetValueBRL: 5000,
      icmsCompra: 0,
      icmsPr: 12,
      frete: 0,
    },
  ])

  const rentalCalc = useMemo(() => {
    return configuredPricingEngine.calculateRental({
      items: rentalItems,
      rentalPeriod: contractPeriod,
      desiredMargin,
    })
  }, [configuredPricingEngine, rentalItems, contractPeriod, desiredMargin])

  const finalSuggestedMonthlyPrice = rentalCalc.monthlyPrice
  const finalSuggestedTotalPrice = rentalCalc.finalPrice
  const baseCostMonthly = Math.max(
    0,
    finalSuggestedMonthlyPrice - rentalCalc.margemEComissaoValorMensal - rentalCalc.impostosValorMensal,
  )
  const formatCurrency = configuredPricingEngine.formatCurrency
  const formatPercent = (value: number) =>
    Number.isFinite(value)
      ? `${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
      : "0,00%"
  const isSaveDisabled = finalSuggestedMonthlyPrice <= 0
  const baseButtonClass =
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transition-all"

  const handleOptimizePrice = () => {
    alert("Funcionalidade de otimização com IA em desenvolvimento!")
  }

  const handleSaveProposal = () => {
    if (proposalClientData) {
      void handleClientFormSubmit(mapProposalClientDataToLegacyClientData(proposalClientData))
      return
    }
    setShowClientForm(true)
  }

  const handleClientFormSubmit = async (clientData: ClientData) => {
    try {
      const pricingData = {
        items: rentalItems.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: rentalCalc.itemCalculations[item.id]?.rbUnitario || 0,
          totalPrice: (rentalCalc.itemCalculations[item.id]?.rbUnitario || 0) * (item.quantity || 0) * contractPeriod,
          specifications: {
            icmsCompra: item.icmsCompra,
            icmsPr: item.icmsPr,
            frete: item.frete,
            totalAssetCost: rentalCalc.itemCalculations[item.id]?.totalAssetCost || 0,
            difal: rentalCalc.itemCalculations[item.id]?.difal || 0,
            monthlyCostTotal: rentalCalc.itemCalculations[item.id]?.monthlyCostTotal || 0,
            impostosMensal: rentalCalc.itemCalculations[item.id]?.impostosValor || 0,
            margemComissaoMensal: rentalCalc.itemCalculations[item.id]?.marginComissaoValor || 0,
          },
        })),
        totalValue: finalSuggestedTotalPrice,
        specifications: {
          contractPeriod,
          desiredMargin,
          taxRegime: activeTaxRegime?.name || "N/A",
        },
      }

      await createQuoteFromPricingData({
        name: `Locação de TI - ${clientData.nomeProjeto}`,
        clientName: clientData.razaoSocial,
        totalPrice: finalSuggestedTotalPrice,
        module: "IT Sales/Rental/Services",
        technicalSpecs: pricingData.specifications,
        clientData: {
          razaoSocial: clientData.razaoSocial,
          nomeContato: clientData.nomeContato,
          telefoneCliente: clientData.telefoneCliente,
          emailCliente: clientData.emailCliente,
          nomeProjeto: clientData.nomeProjeto,
          nomeGerente: clientData.nomeGerente,
          telefoneGerente: clientData.telefoneGerente,
          emailGerente: clientData.emailGerente,
        },
      })

      setShowClientForm(false)
      alert("Proposta criada e enviada para Orçamentos com sucesso!")

      if (onNavigateToProposals) {
        setShowGoToProposal(true)
        onNavigateToProposals()
      }
    } catch (error) {
      console.error("Erro ao criar proposta:", error)
      alert("Erro ao criar proposta. Tente novamente.")
    }
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

        {onModuleChange && <ModuleShortcuts currentModule="rental" onModuleChange={onModuleChange} />}

        <div className="space-y-8">
          <div className="glass-card p-4 sm:p-6 rounded-lg tech-glow floating-animation">
            <h3 className="text-lg font-headline font-semibold text-primary mb-4 border-b border-primary/20 pb-3 flex items-center gap-2">
              ⚙️ Parâmetros de Cálculo
            </h3>

            <div className="space-y-6">
              <PricingItemsTable
                operationType="locacao"
                rentalItems={rentalItems}
                setRentalItems={setRentalItems}
                calculationResults={rentalCalc}
                formatCurrency={formatCurrency}
                formatPercent={formatPercent}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <label className="text-sm text-foreground/80">Período do Contrato (meses)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={contractPeriod}
                      min={1}
                      onChange={(event) => setContractPeriod(Number.parseInt(event.target.value) || 1)}
                      className="w-full p-2 h-9 text-right min-w-[100px] bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <span className="text-xs text-muted-foreground">meses</span>
                  </div>
                </div>
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
            </div>
          </div>

          <div className="glass-card tech-glow h-full flex flex-col floating-animation">
            <div className="text-white rounded-t-lg px-6 py-4" style={{ background: "#1C6880" }}>
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
                    <p className="text-muted-foreground text-sm">Preço Mensal Sugerido</p>
                    <p className="text-4xl lg:text-5xl font-bold text-primary tracking-tight my-2 font-headline">
                      {formatCurrency(finalSuggestedMonthlyPrice)}
                    </p>
                    {finalSuggestedTotalPrice > 0 && contractPeriod > 0 && (
                      <p className="text-accent text-sm">
                        (Total Contrato: {formatCurrency(finalSuggestedTotalPrice)})
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 text-center mb-4 border-t pt-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Custo Base</p>
                      <p className="text-lg font-semibold">{formatCurrency(baseCostMonthly)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">MARGEM+COM</p>
                      <p className="text-lg font-semibold">{formatCurrency(rentalCalc.margemEComissaoValorMensal)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Impostos</p>
                      <p className="text-lg font-semibold">{formatCurrency(rentalCalc.impostosValorMensal)}</p>
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
                      onClick={handleSaveProposal}
                      className={`${baseButtonClass} btn-3d-success w-full h-10`}
                      disabled={isSaveDisabled}
                    >
                      ✅ Adicionar ao Orçamento
                    </button>
                    {showGoToProposal && onNavigateToProposals && (
                      <button
                        type="button"
                        onClick={onNavigateToProposals}
                        className={`${baseButtonClass} btn-3d w-full h-10`}
                      >
                        📋 Ir para Orçamentos
                      </button>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="analise" className="mt-4">
                  <div className="space-y-4 text-sm max-h-[450px] overflow-y-auto pr-2">
                    <h4 className="text-md font-semibold text-primary">Análise DRE - Demonstrativo de Resultado</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 rounded-md bg-muted/40">
                        <span className="text-foreground/80">Receita Bruta</span>
                        <span className="font-mono text-primary">{formatCurrency(finalSuggestedMonthlyPrice)}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded-md bg-muted/40">
                        <span className="text-foreground/80">(-) Impostos</span>
                        <span className="font-mono text-destructive">
                          {formatCurrency(rentalCalc.impostosValorMensal)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded-md bg-muted/40">
                        <span className="text-foreground/80">(-) Custos Diretos</span>
                        <span className="font-mono text-destructive">{formatCurrency(baseCostMonthly)}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded-md bg-muted/80 font-semibold">
                        <span className="text-foreground">Lucro Líquido</span>
                        <span className="font-mono text-primary">
                          {formatCurrency(rentalCalc.margemEComissaoValorMensal)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded-md bg-muted/40 text-xs">
                        <span className="text-muted-foreground">Margem Líquida</span>
                        <span className="font-mono text-primary">
                          {finalSuggestedMonthlyPrice > 0
                            ? ((rentalCalc.margemEComissaoValorMensal / finalSuggestedMonthlyPrice) * 100).toFixed(1)
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

        <ProposalClientForm
          isOpen={showClientForm}
          onClose={() => setShowClientForm(false)}
          onSubmit={handleClientFormSubmit}
        />
      </div>
    </div>
  )
}
