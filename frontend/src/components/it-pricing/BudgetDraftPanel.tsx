"use client"

import { useMemo, useState } from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProposalClientForm, type ClientData } from "@/components/calculators/ProposalClientForm"
import type { ProposalClientData } from "@/components/shared/ProposalClientDataForm"
import { mapProposalClientDataToLegacyClientData } from "@/components/shared/proposalClientDataMapper"
import { usePricingIntegration } from "@/hooks/use-pricing-integration"
import { useITBudgetStore } from "@/lib/stores/it-budget-store"

interface BudgetDraftPanelProps {
  proposalClientData?: ProposalClientData | null
  onNavigateToProposals?: () => void
}

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

const moduleLabel = (module: string) =>
  module === "sales" ? "Vendas" : module === "rental" ? "Locação" : "Serviços"

export function BudgetDraftPanel({ proposalClientData, onNavigateToProposals }: BudgetDraftPanelProps) {
  const { items, removeItem, clear } = useITBudgetStore()
  const { createQuoteFromPricingData } = usePricingIntegration()
  const [showClientForm, setShowClientForm] = useState(false)

  const totalValue = useMemo(
    () => items.reduce((total, item) => total + (item.totalPrice || 0), 0),
    [items],
  )

  const handleGenerateQuote = async (clientData: ClientData) => {
    if (items.length === 0) return

    await createQuoteFromPricingData({
      name: `Orçamento TI - ${clientData.nomeProjeto}`,
      clientName: clientData.razaoSocial,
      totalPrice: totalValue,
      module: "IT Sales/Rental/Services",
      technicalSpecs: {
        items,
        totalValue,
      },
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
    clear()
    alert("Orçamento gerado e enviado para Orçamentos com sucesso!")

    if (onNavigateToProposals) {
      setTimeout(() => onNavigateToProposals(), 1200)
    }
  }

  const handleGenerateClick = () => {
    if (items.length === 0) return
    if (proposalClientData) {
      void handleGenerateQuote(mapProposalClientDataToLegacyClientData(proposalClientData))
      return
    }
    setShowClientForm(true)
  }

  return (
    <Card className="border-dashed border-2 border-primary/20 bg-background/60">
      <CardHeader>
        <CardTitle className="text-lg">Orçamento Atual</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <div className="text-sm text-muted-foreground">Nenhum item adicionado ainda.</div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-md border border-border p-3">
                <div>
                  <div className="text-sm font-medium">{item.description}</div>
                  <div className="text-xs text-muted-foreground">
                    {moduleLabel(item.module)} · Qtd {item.quantity} · {formatCurrency(item.unitPrice)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm font-semibold">{formatCurrency(item.totalPrice)}</div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.id)}
                    aria-label="Remover item"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between rounded-md bg-primary/5 p-3">
              <span className="text-sm font-semibold">Total do Orçamento</span>
              <span className="text-lg font-bold text-primary">{formatCurrency(totalValue)}</span>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleGenerateClick}
            disabled={items.length === 0}
            className="flex-1"
          >
            Gerar Orçamento
          </Button>
          <Button
            variant="outline"
            onClick={() => clear()}
            disabled={items.length === 0}
            className="flex-1"
          >
            Limpar Orçamento
          </Button>
        </div>

        <ProposalClientForm
          isOpen={showClientForm}
          onClose={() => setShowClientForm(false)}
          onSubmit={handleGenerateQuote}
        />
      </CardContent>
    </Card>
  )
}
