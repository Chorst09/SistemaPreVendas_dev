"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Edit, Trash2, Eye, FileText, PlusCircle, Search, X, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ServiceDeskProposal, ServiceDeskContractType, ServiceDeskServiceLevel } from "@/lib/types/service-desk"
import { generateServiceDeskProposalPDF } from "@/lib/pdf/generators/ServiceDeskPDFGenerator"

const STORAGE_KEY = "serviceDeskProposals"

interface ServiceDeskProposalsViewProps {
  onNewProposal: () => void
  onEditProposal: (proposalId: string) => void
}

const statusColors: Record<string, string> = {
  Rascunho: "bg-yellow-500 hover:bg-yellow-600",
  Enviada: "bg-blue-500 hover:bg-blue-600",
  Aprovada: "bg-green-500 hover:bg-green-600",
  Rejeitada: "bg-red-500 hover:bg-red-600",
}

const contractTypeLabels: Record<string, string> = {
  Mensal: "Mensal",
  Trimestral: "Trimestral",
  Semestral: "Semestral",
  Anual: "Anual",
  Bienal: "Bienal",
}

export function ServiceDeskProposalsView({
  onNewProposal,
  onEditProposal,
}: ServiceDeskProposalsViewProps) {
  const [proposals, setProposals] = useState<ServiceDeskProposal[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [pdfViewUrl, setPdfViewUrl] = useState<string | null>(null)
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false)
  const [selectedProposal, setSelectedProposal] = useState<ServiceDeskProposal | null>(null)
  const [loadingPdf, setLoadingPdf] = useState(false)

  const loadProposals = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setProposals(parsed.map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
          validUntil: new Date(p.validUntil),
        })))
      }
    } catch (error) {
      console.error("Error loading Service Desk proposals:", error)
    }
  }, [])

  useEffect(() => {
    loadProposals()
  }, [loadProposals])

  const filteredProposals = proposals.filter((p) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      p.clientData.companyName.toLowerCase().includes(term) ||
      p.clientData.contactName.toLowerCase().includes(term) ||
      p.clientData.projectName.toLowerCase().includes(term) ||
      p.id.toLowerCase().includes(term)
    )
  })

  const handleDelete = (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta proposta?")) return
    const updated = proposals.filter((p) => p.id !== id)
    setProposals(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const handleViewPdf = async (proposal: ServiceDeskProposal) => {
    setLoadingPdf(true)
    try {
      const { url } = await generateServiceDeskProposalPDF(proposal)
      setPdfViewUrl(url)
      setIsPdfModalOpen(true)
    } catch (error) {
      console.error("Error generating PDF for viewing:", error)
      alert("Erro ao gerar PDF. Tente novamente.")
    } finally {
      setLoadingPdf(false)
    }
  }

  const handleClosePdfModal = () => {
    setIsPdfModalOpen(false)
    setPdfViewUrl(null)
  }

  const handleOpenPdfInNewTab = async (proposal: ServiceDeskProposal) => {
    setLoadingPdf(true)
    try {
      const { url } = await generateServiceDeskProposalPDF(proposal)
      window.open(url, "_blank")
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Erro ao gerar PDF. Tente novamente.")
    } finally {
      setLoadingPdf(false)
    }
  }

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString("pt-BR")

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl">Propostas de Service Desk</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {proposals.length} proposta(s) cadastrada(s)
              </p>
            </div>
            <Button onClick={onNewProposal}>
              <PlusCircle size={20} className="mr-2" />
              Nova Proposta
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por empresa, contato ou projeto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredProposals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">
                {searchTerm ? "Nenhuma proposta encontrada" : "Nenhuma proposta de Service Desk"}
              </p>
              <p className="text-sm mb-6">
                {searchTerm
                  ? "Tente ajustar sua busca."
                  : "Clique em \"Nova Proposta\" para criar a primeira."}
              </p>
              {!searchTerm && (
                <Button onClick={onNewProposal} variant="outline">
                  <PlusCircle size={16} className="mr-2" />
                  Criar Primeira Proposta
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente / Projeto</TableHead>
                    <TableHead className="hidden md:table-cell">Contato</TableHead>
                    <TableHead>Valores</TableHead>
                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProposals.map((proposal) => (
                    <TableRow key={proposal.id}>
                      <TableCell>
                        <div className="font-semibold">{proposal.clientData.companyName}</div>
                        <div className="text-sm text-muted-foreground">
                          {proposal.clientData.projectName}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono mt-1">
                          {proposal.id.slice(0, 8)}...
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div>{proposal.clientData.contactName}</div>
                        <div className="text-xs text-muted-foreground">
                          {proposal.clientData.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatCurrency(proposal.totals.monthlyCost)}/mês
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Setup: {formatCurrency(proposal.totals.totalSetupCost)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {contractTypeLabels[proposal.contractType] || proposal.contractType} ·{" "}
                          {proposal.totals.totalUsers} usuário(s)
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge className={statusColors[proposal.status] || "bg-gray-500"}>
                          {proposal.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">
                        <div>Criada: {formatDate(proposal.createdAt)}</div>
                        <div className="text-xs text-muted-foreground">
                          Válida até: {formatDate(proposal.validUntil)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap gap-1 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewPdf(proposal)}
                            disabled={loadingPdf}
                            title="Visualizar PDF"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">PDF</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenPdfInNewTab(proposal)}
                            disabled={loadingPdf}
                            title="Abrir PDF em nova aba"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">Abrir</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEditProposal(proposal.id)}
                            title="Editar proposta"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">Editar</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(proposal.id)}
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isPdfModalOpen} onOpenChange={(open) => !open && handleClosePdfModal()}>
        <DialogContent className="sm:max-w-5xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>Visualizar Proposta Service Desk</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4"
              onClick={handleClosePdfModal}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          <div className="flex-1 w-full h-full min-h-[70vh]">
            {pdfViewUrl ? (
              <iframe
                src={pdfViewUrl}
                className="w-full h-full rounded border"
                title="Visualização do PDF"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                {loadingPdf ? "Gerando PDF..." : "PDF não disponível."}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
