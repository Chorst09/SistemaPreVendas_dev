"use client"

import { useState, useEffect } from "react"
import { Printer, ArrowLeft, Plus, Trash2, Calculator, Save, Search, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { usePricingIntegration } from "@/hooks/use-pricing-integration"
import { useProposalEditing } from "@/hooks/use-proposal-editing"
import { ProposalClientForm, type ClientData } from "@/components/calculators/ProposalClientForm"
import type { ProposalClientData } from "@/components/shared/ProposalClientDataForm"
import { mapProposalClientDataToLegacyClientData } from "@/components/shared/proposalClientDataMapper"
import { Printer as PrinterType, Suprimento } from "./types"
import { ManualCalculationModal } from "./ManualCalculationModal"
import SimplePDFGenerator from "@/components/pdf-generation/simple/SimplePDFGenerator"
import ProposalConfirmation from "@/components/pdf-generation/viewers/ProposalConfirmation"
import { 
  mapFormClientDataToPDF, 
  createProposalData
} from "@/lib/pdf/utils/data-mappers"
import { ProposalData, ClientData as PDFClientData } from "@/lib/pdf/types/index"
import { useConfigurationStore } from "@/lib/stores/configuration-store"
import { blobToBase64, storePDF } from "@/lib/services/pdf-storage-service"

interface PrinterItem {
    id: string
    printerId?: string // ID da impressora cadastrada
    modelo?: string
    marca?: string
    tipo: string
    volumeMensal: number
    custoPorPagina: number
    custoMensal: number
    custoAnual: number
    prazoContrato: number // em meses
    valorMensalLocacao?: number
    isFromCatalog: boolean // indica se veio do catálogo
    detalhesCalculo?: any // Detalhes do cálculo manual
}

interface PrinterCalculatorModuleProps {
    onBack: () => void
    onNavigateToProposals?: () => void
    printers: PrinterType[]
    suprimentos: any[]
    onUpdatePrinters?: (printers: PrinterType[]) => void
    onUpdateSuprimentos?: (suprimentos: Suprimento[]) => void
    editingProposalId?: string | null // For editing existing proposals
    onFinishEditing?: () => void // Callback when editing is finished
    proposalClientData?: ProposalClientData | null
}

export function PrinterCalculatorModule({ onBack, onNavigateToProposals, printers: availablePrinters, suprimentos: availableSuprimentos, onUpdatePrinters, onUpdateSuprimentos, editingProposalId, onFinishEditing, proposalClientData }: PrinterCalculatorModuleProps) {
    const { outsourcingConfig, taxRegimes } = useConfigurationStore()
    const regimeAtivo = taxRegimes.find(r => r.active)
    
    const [printers, setPrinters] = useState<PrinterItem[]>([])
    const [showClientForm, setShowClientForm] = useState(false)
    const [showQuoteView, setShowQuoteView] = useState(false)
    const [showConfirmation, setShowConfirmation] = useState(false)
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
    const [pdfData, setPdfData] = useState<{
        proposalData: ProposalData
        clientData: PDFClientData
        pdfUrl: string
        pdfBlob: Blob
    } | null>(null)
    
    // Hook de integração com orçamentos
    const { createQuoteFromPricingData } = usePricingIntegration()
    
    // Hook de edição de propostas
    const { 
        isEditing, 
        startEditing, 
        cancelEditing, 
        updateProposal,
        printerItems: editingPrinterItems,
        clientData: editingClientData,
        isLoading: isLoadingProposal
    } = useProposalEditing()

    // Estados para novo item manual
    const [novoTipo, setNovoTipo] = useState("")
    const [novoVolume, setNovoVolume] = useState(0)
    const [novoCusto, setNovoCusto] = useState(0)
    const [novoPrazo, setNovoPrazo] = useState(36)

    // Estados para impressora do catálogo
    const [impressoraSelecionada, setImpressoraSelecionada] = useState("")
    const [volumeImpressora, setVolumeImpressora] = useState(0)
    const [prazoImpressora, setPrazoImpressora] = useState(36)
    const [tipoModoCalculo, setTipoModoCalculo] = useState<"manual" | "catalogo">("manual")
    const [showManualCalculationModal, setShowManualCalculationModal] = useState(false)
    const [showCatalogRegistration, setShowCatalogRegistration] = useState(false)
    const [catalogPrinterDraft, setCatalogPrinterDraft] = useState<Partial<PrinterType>>({
        marca: "",
        modelo: "",
        tipo: "Laser P&B",
        velocidadePPM: 0,
        custoAquisicao: 0,
        custoMensalLocacao: 0,
        vidaUtilPaginas: 100000,
        consumoEnergia: 15,
        custoManutencaoMensal: 50,
        ativo: true
    })
    const [catalogSupplyDraft, setCatalogSupplyDraft] = useState<Partial<Suprimento>>({
        tipo: "Toner P&B",
        descricao: "",
        rendimentoPaginas: 0,
        custoUnitario: 0,
        estoqueMinimo: 1,
        estoqueAtual: 0,
        fornecedor: "",
        codigoOriginal: "",
        compativel: false
    })
    const [catalogSuppliesDraft, setCatalogSuppliesDraft] = useState<Suprimento[]>([])
    
    // Effect to load proposal data when editing
    useEffect(() => {
        if (editingProposalId && !isEditing) {
            startEditing(editingProposalId)
        }
        
        // Verifica se há uma proposta de outsourcing para editar
        const editingData = localStorage.getItem('editingOutsourcingProposal')
        if (editingData) {
            try {
                const data = JSON.parse(editingData)
                console.log('Carregando proposta para edição:', data)
                
                // Carrega os equipamentos da proposta
                if (data.technicalSpecs && data.technicalSpecs.equipments) {
                    setPrinters(data.technicalSpecs.equipments)
                }
                
                // Remove os dados do localStorage após carregar
                localStorage.removeItem('editingOutsourcingProposal')
                
                alert(`✅ Proposta "${data.clientData.razaoSocial}" carregada para edição!\n\nVocê pode modificar os equipamentos e gerar um novo PDF.`)
            } catch (error) {
                console.error('Erro ao carregar proposta para edição:', error)
            }
        }
    }, [editingProposalId, isEditing, startEditing])
    
    // Debug effect to monitor showClientForm state
    useEffect(() => {
        console.log('showClientForm mudou para:', showClientForm)
    }, [showClientForm])
    
    // Effect to populate form data when editing data is loaded
    useEffect(() => {
        if (isEditing && editingPrinterItems.length > 0) {
            setPrinters(editingPrinterItems)
        }
    }, [isEditing, editingPrinterItems])

    // Custos base por tipo de impressão (das configurações centralizadas)
    const custosBase = outsourcingConfig.custosBase || {
        "Preto e Branco": 0.08,
        "Colorida": 0.35,
        "A3 Preto e Branco": 0.12,
        "A3 Colorida": 0.50
    }

    const adicionarItemManual = () => {
        if (!novoTipo || novoVolume <= 0) return

        const custoUnitario = novoCusto > 0 ? novoCusto : custosBase[novoTipo as keyof typeof custosBase] || 0.08
        const custoMensal = novoVolume * custoUnitario
        const custoAnual = custoMensal * novoPrazo

        const novoItem: PrinterItem = {
            id: Date.now().toString(),
            tipo: novoTipo,
            volumeMensal: novoVolume,
            custoPorPagina: custoUnitario,
            custoMensal,
            custoAnual,
            prazoContrato: novoPrazo,
            isFromCatalog: false
        }

        setPrinters([...printers, novoItem])
        
        // Limpar formulário
        setNovoTipo("")
        setNovoVolume(0)
        setNovoCusto(0)
        setNovoPrazo(36)
    }

    const calcularPrecificacaoCatalogo = (custoAquisicao: number, supplies: Suprimento[], tipo: string) => {
        const taxaFinanceira = (outsourcingConfig.taxaFinanceiraMensal || 0) / 100
        const margemRate = (outsourcingConfig.margemPadrao || 0) / 100
        const comissaoRate = (outsourcingConfig.comissaoVenda || 0) / 100
        const operacionalRate = (outsourcingConfig.custosOperacionais || 0) / 100
        const impostoRate = regimeAtivo
            ? (regimeAtivo.type === 'iva'
                ? regimeAtivo.ivaTotal
                : regimeAtivo.type === 'simples'
                    ? regimeAtivo.anexoI
                    : (regimeAtivo.icms || 0) + (regimeAtivo.pis || 0) + (regimeAtivo.cofins || 0) + 1.2) / 100
            : 0
        const divisor = 1 - margemRate - comissaoRate - operacionalRate - impostoRate
        const mensalizar = (prazo: number) => {
            if (custoAquisicao <= 0 || prazo <= 0) return 0
            const pmt = taxaFinanceira > 0
                ? (custoAquisicao * taxaFinanceira) / (1 - Math.pow(1 + taxaFinanceira, -prazo))
                : custoAquisicao / prazo
            return divisor > 0 ? pmt / divisor : pmt
        }
        const custoSupMono = supplies
            .filter(s => ['Toner P&B', 'Toner Preto', 'Fotoconductor', 'Kit Manutenção'].includes(s.tipo))
            .reduce((total, s) => total + (s.rendimentoPaginas > 0 ? s.custoUnitario / s.rendimentoPaginas : 0), 0)
        const custoSupColorAdicional = supplies
            .filter(s => ['Toner Ciano', 'Toner Magenta', 'Toner Amarelo'].includes(s.tipo))
            .reduce((total, s) => total + (s.rendimentoPaginas > 0 ? s.custoUnitario / s.rendimentoPaginas : 0), 0)
        const custoPaginaMono = custoSupMono
        const custoPaginaColor = tipo.includes('Colorida') ? custoSupMono + custoSupColorAdicional : 0
        const periodosLocacao = [12, 24, 36, 48, 60].reduce((acc, prazo) => {
            const valorMensal = mensalizar(prazo)
            acc[prazo] = {
                valorMensal,
                valorTotal: valorMensal * prazo,
                paybackMeses: valorMensal > 0 ? custoAquisicao / valorMensal : 0,
                roi: custoAquisicao > 0 ? ((valorMensal * prazo - custoAquisicao) / custoAquisicao) * 100 : 0
            }
            return acc
        }, {} as NonNullable<PrinterType['precificacao']>['periodosLocacao'])

        return {
            custoBase: custoAquisicao,
            margemDesejada: outsourcingConfig.margemPadrao || 0,
            regimeTributario: regimeAtivo?.name || outsourcingConfig.taxRegimeId || 'Não configurado',
            regimeTributarioId: regimeAtivo?.id || outsourcingConfig.taxRegimeId || null,
            icmsCompra: 0,
            icmsVenda: regimeAtivo?.type === 'presumido' || regimeAtivo?.type === 'real' ? regimeAtivo.icms || 0 : 0,
            ipiCompra: 0,
            pisCofinsSaida: regimeAtivo?.type === 'presumido' || regimeAtivo?.type === 'real' ? (regimeAtivo.pis || 0) + (regimeAtivo.cofins || 0) : 0,
            comissaoVenda: outsourcingConfig.comissaoVenda || 0,
            custosOperacionais: outsourcingConfig.custosOperacionais || 0,
            precoVendaSugerido: divisor > 0 ? custoAquisicao / divisor : custoAquisicao,
            custoPaginaMono,
            custoPaginaColor,
            periodosLocacao,
            calculadoEm: new Date().toISOString()
        }
    }

    const adicionarSuprimentoCatalogo = () => {
        if (!catalogSupplyDraft.descricao || !catalogSupplyDraft.rendimentoPaginas || !catalogSupplyDraft.custoUnitario) {
            alert('Preencha descrição, rendimento e custo do suprimento.')
            return
        }

        const supply: Suprimento = {
            id: `draft-${Date.now()}`,
            printerId: '',
            tipo: catalogSupplyDraft.tipo || 'Toner P&B',
            descricao: catalogSupplyDraft.descricao,
            rendimentoPaginas: Number(catalogSupplyDraft.rendimentoPaginas || 0),
            custoUnitario: Number(catalogSupplyDraft.custoUnitario || 0),
            estoqueMinimo: Number(catalogSupplyDraft.estoqueMinimo || 1),
            estoqueAtual: Number(catalogSupplyDraft.estoqueAtual || 0),
            fornecedor: catalogSupplyDraft.fornecedor || '',
            codigoOriginal: catalogSupplyDraft.codigoOriginal || '',
            compativel: catalogSupplyDraft.compativel ?? false
        }

        setCatalogSuppliesDraft([...catalogSuppliesDraft, supply])
        setCatalogSupplyDraft({
            tipo: 'Toner P&B',
            descricao: '',
            rendimentoPaginas: 0,
            custoUnitario: 0,
            estoqueMinimo: 1,
            estoqueAtual: 0,
            fornecedor: '',
            codigoOriginal: '',
            compativel: false
        })
    }

    const salvarImpressoraCatalogo = () => {
        if (!catalogPrinterDraft.marca || !catalogPrinterDraft.modelo || !catalogPrinterDraft.custoAquisicao) {
            alert('Preencha marca, modelo e valor de custo da impressora.')
            return
        }
        if (catalogSuppliesDraft.length === 0) {
            alert('Adicione pelo menos um suprimento para esta impressora.')
            return
        }

        const printerId = `printer-${Date.now()}`
        const tipo = catalogPrinterDraft.tipo || 'Laser P&B'
        const precificacao = calcularPrecificacaoCatalogo(Number(catalogPrinterDraft.custoAquisicao || 0), catalogSuppliesDraft, tipo)
        const newPrinter: PrinterType = {
            id: printerId,
            modelo: catalogPrinterDraft.modelo,
            marca: catalogPrinterDraft.marca,
            tipo,
            velocidadePPM: Number(catalogPrinterDraft.velocidadePPM || 0),
            custoAquisicao: Number(catalogPrinterDraft.custoAquisicao || 0),
            custoMensalLocacao: Number(catalogPrinterDraft.custoMensalLocacao || precificacao.periodosLocacao[36]?.valorMensal || 0),
            vidaUtilPaginas: Number(catalogPrinterDraft.vidaUtilPaginas || 100000),
            consumoEnergia: Number(catalogPrinterDraft.consumoEnergia || 15),
            custoManutencaoMensal: Number(catalogPrinterDraft.custoManutencaoMensal || 50),
            ativo: true,
            precificacao
        }
        const newSupplies = catalogSuppliesDraft.map((s, index) => ({
            ...s,
            id: `supply-${Date.now()}-${index}`,
            printerId
        }))

        onUpdatePrinters?.([...availablePrinters, newPrinter])
        onUpdateSuprimentos?.([...(availableSuprimentos as Suprimento[]), ...newSupplies])
        setImpressoraSelecionada(printerId)
        setShowCatalogRegistration(false)
        setCatalogSuppliesDraft([])
        setCatalogPrinterDraft({
            marca: '',
            modelo: '',
            tipo: 'Laser P&B',
            velocidadePPM: 0,
            custoAquisicao: 0,
            custoMensalLocacao: 0,
            vidaUtilPaginas: 100000,
            consumoEnergia: 15,
            custoManutencaoMensal: 50,
            ativo: true
        })
    }

    const handleManualCalculationSave = (dados: any, options?: { salvarEmOrcamentos?: boolean }) => {
        const modalidadeLocacao = dados.modalidadeLocacao as 'franquia' | 'por-pagina'
        const volumeMensal = Number(dados.volumeMensal || 0)
        const custoPorPagina = Number(dados.calculo.total || 0)
        const valorLocacaoImpressora = Number(dados.valorLocacaoImpressora || 0)
        const valorFranquia = Number(dados.valorFranquia || 0)
        const franquiaMensal = Number(dados.franquiaMensal || 0)
        const valorPaginaExcedenteMono = Number(dados.valorPaginaExcedenteMono || dados.calculo?.valorPaginaExcedenteMono || dados.calculo?.detalhes?.suprimentosMono || 0)
        const valorPaginaExcedenteColor = Number(dados.valorPaginaExcedenteColor || dados.calculo?.valorPaginaExcedenteColor || dados.calculo?.detalhes?.suprimentosColor || 0)
        const prazoContrato = Number(dados.prazoContrato || 0)
        const impressoras = Array.isArray(dados.impressoras) ? dados.impressoras : [dados.impressora].filter(Boolean)
        const totalEquipamentos = impressoras.reduce((total: number, printer: any) => total + Number(printer.quantidade || 1), 0)
        const hasColorida = impressoras.some((printer: any) => printer.tipo === 'Laser Colorida')

        const custoMensalCalculado = Number(dados.calculo?.custoMensal || 0) || (
            modalidadeLocacao === 'por-pagina'
                ? valorLocacaoImpressora + (volumeMensal * custoPorPagina)
                : valorFranquia
        )

        const custoTotalContratoCalculado = custoMensalCalculado * prazoContrato

        const novoItem: PrinterItem = {
            id: Date.now().toString(),
            modelo: totalEquipamentos > 1 ? `${totalEquipamentos} impressoras` : dados.impressora.modelo,
            marca: totalEquipamentos > 1 ? 'Frota' : dados.impressora.marca,
            tipo: hasColorida ? 'Laser Colorida' : (dados.impressora.tipo || 'Laser P&B'),
            volumeMensal,
            custoPorPagina,
            custoMensal: custoMensalCalculado,
            custoAnual: custoTotalContratoCalculado,
            prazoContrato,
            isFromCatalog: false,
            // Armazenar dados detalhados para referência
            detalhesCalculo: {
                impressoras,
                suprimentos: dados.suprimentos,
                infraestrutura: dados.infraestrutura || [],
                totalEquipamentos,
                custoAquisicao: impressoras.reduce((total: number, printer: any) => total + (Number(printer.custoAquisicao || 0) * Number(printer.quantidade || 1)), 0),
                vidaUtil: dados.impressora.vidaUtil,
                detalhamento: dados.calculo.detalhes,
                custoPorPaginaMono: dados.custoPorPaginaMono,
                custoPorPaginaColor: dados.custoPorPaginaColor,
                isColorida: dados.isColorida,
                modalidadeLocacao,
                valorLocacaoImpressora,
                valorLocacaoBaseImpressoras: dados.valorLocacaoBaseImpressoras,
                franquiaMensal,
                valorFranquia,
                valorPaginaExcedenteMono,
                valorPaginaExcedenteColor,
                infraestruturaModo: dados.infraestruturaModo,
                infraestruturaRateadaNaLocacao: dados.infraestruturaRateadaNaLocacao,
                infraestruturaMensalSeparada: dados.infraestruturaMensalSeparada,
                // Dados do regime tributário
                regimeTributarioId: dados.regimeTributarioId,
                regimeTributarioNome: dados.regimeTributarioNome,
                regimeTributarioAliquota: dados.regimeTributarioAliquota,
                comissaoVenda: dados.comissaoVenda,
                custosOperacionais: dados.custosOperacionais,
                margemPadrao: dados.margemPadrao
            }
        }

        setPrinters([...printers, novoItem])
        setShowManualCalculationModal(false)
        if (options?.salvarEmOrcamentos) {
            setShowClientForm(true)
        }
    }

    const adicionarImpressoraCatalogo = () => {
        console.log('Botão clicado!', { impressoraSelecionada, volumeImpressora, prazoImpressora })
        
        if (!impressoraSelecionada || volumeImpressora <= 0) {
            console.log('Validação falhou:', { impressoraSelecionada, volumeImpressora })
            alert('Por favor, selecione uma impressora e informe o volume mensal.')
            return
        }

        const impressora = availablePrinters.find(p => p.id === impressoraSelecionada)
        console.log('Impressora encontrada:', impressora)
        
        if (!impressora || !impressora.precificacao) {
            console.log('Impressora não encontrada ou sem precificação')
            alert('Impressora não encontrada ou sem precificação. Verifique se a impressora foi precificada.')
            return
        }

        const periodoSelecionado = impressora.precificacao.periodosLocacao[prazoImpressora]
        console.log('Período selecionado:', periodoSelecionado)
        
        if (!periodoSelecionado) {
            console.log('Período não encontrado para:', prazoImpressora)
            alert('Período de locação não encontrado para este prazo.')
            return
        }

        const isColorida = impressora.tipo.includes('Colorida')
        const custoPaginaSuprimentos = isColorida
            ? Number(impressora.precificacao.custoPaginaColor || 0)
            : Number(impressora.precificacao.custoPaginaMono || 0)
        const custoVariavelMensal = custoPaginaSuprimentos * volumeImpressora
        const custoMensal = periodoSelecionado.valorMensal + custoVariavelMensal
        const custoPorPagina = volumeImpressora > 0 ? (custoMensal / volumeImpressora) : 0
        const custoAnual = custoMensal * prazoImpressora

        const novoItem: PrinterItem = {
            id: Date.now().toString(),
            printerId: impressora.id,
            modelo: impressora.modelo,
            marca: impressora.marca,
            tipo: impressora.tipo,
            volumeMensal: volumeImpressora,
            custoPorPagina,
            custoMensal,
            custoAnual,
            prazoContrato: prazoImpressora,
            valorMensalLocacao: periodoSelecionado.valorMensal,
            isFromCatalog: true
        }

        setPrinters([...printers, novoItem])
        
        // Mostrar tela de orçamento
        setShowQuoteView(true)
        
        // Limpar formulário
        setImpressoraSelecionada("")
        setVolumeImpressora(0)
        setPrazoImpressora(36)
    }

    const removerItem = (id: string) => {
        setPrinters(printers.filter(p => p.id !== id))
    }

    const atualizarItem = (id: string, campo: keyof PrinterItem, valor: any) => {
        setPrinters(printers.map(p => {
            if (p.id === id) {
                const updated = { ...p, [campo]: valor }
                
                // Se for item do catálogo e mudou o prazo, recalcular baseado na precificação
                if (p.isFromCatalog && campo === 'prazoContrato' && p.printerId) {
                    const impressora = availablePrinters.find(imp => imp.id === p.printerId)
                    if (impressora?.precificacao?.periodosLocacao[valor]) {
                        const periodo = impressora.precificacao.periodosLocacao[valor]
                        const isColorida = impressora.tipo.includes('Colorida')
                        const custoPaginaSuprimentos = isColorida
                            ? Number(impressora.precificacao.custoPaginaColor || 0)
                            : Number(impressora.precificacao.custoPaginaMono || 0)
                        const custoVariavelMensal = custoPaginaSuprimentos * updated.volumeMensal
                        updated.valorMensalLocacao = periodo.valorMensal
                        updated.custoMensal = periodo.valorMensal + custoVariavelMensal
                        updated.custoPorPagina = updated.volumeMensal > 0 ? (updated.custoMensal / updated.volumeMensal) : 0
                        updated.custoAnual = updated.custoMensal * updated.prazoContrato
                    }
                }
                // Recalcular custos quando volume, custo por página ou prazo mudar
                else if (campo === 'volumeMensal' || campo === 'custoPorPagina' || campo === 'prazoContrato') {
                    if (p.isFromCatalog && p.valorMensalLocacao) {
                        // Para itens do catálogo: locação fixa + custo variável por página
                        const impressora = p.printerId ? availablePrinters.find(imp => imp.id === p.printerId) : null
                        const isColorida = Boolean(impressora?.tipo?.includes('Colorida'))
                        const custoPaginaSuprimentos = impressora?.precificacao
                            ? (isColorida
                                ? Number(impressora.precificacao.custoPaginaColor || 0)
                                : Number(impressora.precificacao.custoPaginaMono || 0))
                            : 0

                        const custoVariavelMensal = custoPaginaSuprimentos * updated.volumeMensal
                        updated.custoMensal = p.valorMensalLocacao + custoVariavelMensal
                        updated.custoPorPagina = updated.volumeMensal > 0 ? (updated.custoMensal / updated.volumeMensal) : 0
                        updated.custoAnual = updated.custoMensal * updated.prazoContrato
                    } else if (p.detalhesCalculo?.modalidadeLocacao === 'por-pagina') {
                        const locacaoFixa = Number(p.detalhesCalculo?.valorLocacaoImpressora || 0)
                        updated.custoMensal = locacaoFixa + (updated.volumeMensal * updated.custoPorPagina)
                        updated.custoAnual = updated.custoMensal * updated.prazoContrato
                    } else if (p.detalhesCalculo?.modalidadeLocacao === 'franquia') {
                        const franquiaFixa = Number(p.detalhesCalculo?.valorFranquia || updated.custoMensal || 0)
                        updated.custoMensal = franquiaFixa
                        updated.custoAnual = updated.custoMensal * updated.prazoContrato
                    } else {
                        // Para itens manuais, calcular normalmente
                        updated.custoMensal = updated.volumeMensal * updated.custoPorPagina
                        updated.custoAnual = updated.custoMensal * updated.prazoContrato
                    }
                }
                
                return updated
            }
            return p
        }))
    }

    const totais = printers.reduce((acc, item) => ({
        volumeTotal: acc.volumeTotal + item.volumeMensal,
        custoMensal: acc.custoMensal + item.custoMensal,
        custoAnual: acc.custoAnual + item.custoAnual
    }), { volumeTotal: 0, custoMensal: 0, custoAnual: 0 })

    const handleSaveProposal = () => {
        if (printers.length === 0) {
            alert("Adicione pelo menos um item de impressão para criar a proposta.")
            return
        }

        if (proposalClientData) {
            void handleClientFormSubmit(mapProposalClientDataToLegacyClientData(proposalClientData))
            return
        }

        setShowClientForm(true)
    }

    const handleClientFormSubmit = async (clientData: ClientData) => {
        console.log('handleClientFormSubmit chamado com:', clientData)
        setIsGeneratingPDF(true)
        
        try {
            // Convert form data to PDF format
            console.log('Convertendo dados do formulário...')
            const pdfClientData = mapFormClientDataToPDF(clientData)
            const proposalData = createProposalData(printers, totais)
            
            console.log('Dados convertidos:', { pdfClientData, proposalData })
            
            // Validate data before PDF generation
            console.log('Validando dados...')
            console.log('proposalData:', proposalData)
            console.log('pdfClientData:', pdfClientData)
            
            // Validação simples para teste
            console.log('Fazendo validação simples...')
            if (!pdfClientData.companyName) {
                alert('Nome da empresa é obrigatório')
                return
            }
            if (!proposalData.equipments || proposalData.equipments.length === 0) {
                alert('Pelo menos um equipamento deve ser adicionado')
                return
            }
            console.log('Validação simples passou!')
            
            console.log('Validação passou, iniciando geração do PDF...')

            // Generate PDF - usando apenas o gerador simples para teste
            console.log('Usando gerador simples diretamente...')
            const simpleGenerator = new SimplePDFGenerator()
            const simpleData = {
                clientName: clientData.razaoSocial,
                projectName: clientData.nomeProjeto,
                totalMonthly: totais.custoMensal,
                totalAnnual: totais.custoAnual,
                equipments: printers.map(p => ({
                    model: p.modelo || 'N/A',
                    brand: p.marca || 'N/A',
                    type: p.tipo,
                    monthlyVolume: p.volumeMensal,
                    monthlyCost: p.custoMensal,
                    pageCost: p.custoPorPagina,
                    contractMonths: p.prazoContrato,
                    details: p.detalhesCalculo
                }))
            }
            
            console.log('Dados para o PDF simples:', simpleData)
            const result = await simpleGenerator.generateSimplePDF(simpleData)
            const blob = result.blob
            const url = result.url
            console.log('PDF gerado com sucesso:', { blobSize: blob.size, url })

            // If editing, update the existing proposal
            if (isEditing) {
                await updateProposal(proposalData, pdfClientData, blob)
                
                // Store PDF data for confirmation screen
                setPdfData({
                    proposalData,
                    clientData: pdfClientData,
                    pdfUrl: url,
                    pdfBlob: blob
                })
                
                // Close client form and show confirmation
                setShowClientForm(false)
                setShowConfirmation(true)
                
                return
            }

            // Store PDF data for confirmation screen
            setPdfData({
                proposalData,
                clientData: pdfClientData,
                pdfUrl: url,
                pdfBlob: blob
            })

            // Create quote in the system (existing functionality for new proposals)
            const pricingData = {
                items: printers.map(item => ({
                    description: item.isFromCatalog 
                        ? `${item.marca} ${item.modelo} - ${item.volumeMensal.toLocaleString()} páginas/mês (${item.prazoContrato} meses)`
                        : `${item.tipo} - ${item.volumeMensal.toLocaleString()} páginas/mês (${item.prazoContrato} meses)`,
                    quantity: item.volumeMensal,
                    unitPrice: item.custoPorPagina,
                    totalPrice: item.custoAnual,
                    specifications: {
                        tipo: item.tipo,
                        modelo: item.modelo,
                        marca: item.marca,
                        volumeMensal: item.volumeMensal,
                        custoPorPagina: item.custoPorPagina,
                        custoMensal: item.custoMensal,
                        custoAnual: item.custoAnual,
                        prazoContrato: item.prazoContrato,
                        isFromCatalog: item.isFromCatalog,
                        printerId: item.printerId,
                        valorMensalLocacao: item.valorMensalLocacao,
                        regimeTributario: regimeAtivo?.name || null,
                        regimeTributarioId: regimeAtivo?.id || null,
                        modalidadeLocacao: item.detalhesCalculo?.modalidadeLocacao || null,
                        franquiaMensal: item.detalhesCalculo?.franquiaMensal || null,
                        valorFranquia: item.detalhesCalculo?.valorFranquia || null,
                        valorPaginaExcedenteMono: item.detalhesCalculo?.valorPaginaExcedenteMono || null,
                        valorPaginaExcedenteColor: item.detalhesCalculo?.valorPaginaExcedenteColor || null
                    }
                })),
                totalValue: totais.custoAnual,
                specifications: {
                    equipments: printers,
                    volumeTotalMensal: totais.volumeTotal,
                    custoMensalTotal: totais.custoMensal,
                    custoAnualTotal: totais.custoAnual,
                    monthlyPrice: totais.custoMensal,
                    contractDurationMonths: printers.length > 0
                        ? Math.max(...printers.map(p => Number(p.prazoContrato || 0)))
                        : 12,
                    quantidadeItens: printers.length,
                    itensFromCatalog: printers.filter(p => p.isFromCatalog).length,
                    itensManual: printers.filter(p => !p.isFromCatalog).length,
                    regimeTributario: regimeAtivo?.name || outsourcingConfig.taxRegimeId || 'Não configurado',
                    regimeTributarioId: regimeAtivo?.id || outsourcingConfig.taxRegimeId || null,
                    // Add PDF reference for better integration
                    pdfGenerated: true,
                    pdfGeneratedAt: new Date().toISOString()
                }
            }

            const createdQuote = await createQuoteFromPricingData({
                name: `Outsourcing de Impressão - ${clientData.nomeProjeto}`,
                clientName: clientData.razaoSocial,
                totalPrice: totais.custoAnual,
                module: 'Printer Outsourcing',
                technicalSpecs: pricingData.specifications,
                clientData: {
                    razaoSocial: clientData.razaoSocial,
                    nomeContato: clientData.nomeContato,
                    telefoneCliente: clientData.telefoneCliente,
                    emailCliente: clientData.emailCliente,
                    nomeProjeto: clientData.nomeProjeto,
                    nomeGerente: clientData.nomeGerente,
                    telefoneGerente: clientData.telefoneGerente,
                    emailGerente: clientData.emailGerente
                }
            })

            if (createdQuote?.id) {
                const pdfBase64 = await blobToBase64(blob)
                storePDF(createdQuote.id, pdfBase64)
            }

            // Log successful integration
            console.log('PDF proposal integrated with quote system:', {
                quoteId: createdQuote?.id,
                proposalData: proposalData,
                clientData: pdfClientData
            })

            // Close client form and show confirmation
            setShowClientForm(false)
            setShowConfirmation(true)
            
        } catch (error) {
            console.error('Erro ao gerar proposta:', error)
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
            alert(`Erro ao gerar proposta: ${errorMessage}`)
        } finally {
            setIsGeneratingPDF(false)
        }
    }

    // Tela de Orçamento
    if (showQuoteView && printers.length > 0) {
        const lastPrinter = printers[printers.length - 1]
        return (
            <div className="printer-theme min-h-screen bg-background text-foreground">
                {/* Header */}
                <div className="mb-8 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <Button onClick={() => setShowQuoteView(false)} variant="outline" className="mb-4">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Voltar ao Cálculo
                        </Button>
                    </div>

                    <Card className="bg-gradient-to-r from-[hsl(var(--accent-cyan))] to-[hsl(var(--primary-800))] border-[hsl(var(--accent-cyan)/0.5)] mb-6 card-modern">
                        <CardContent className="p-8 text-center">
                            <div className="flex items-center justify-center gap-3 mb-4">
                                <Calculator className="h-8 w-8 text-white" />
                                <h1 className="text-3xl font-bold text-white">Orçamento de Impressora</h1>
                            </div>
                            <p className="text-white/90 text-lg mb-4">Resumo do Equipamento e Custos</p>
                            <Badge className="bg-[hsl(var(--primary-700))] hover:bg-[hsl(var(--primary-600))] text-white border-white/20">
                                {lastPrinter.marca} {lastPrinter.modelo}
                            </Badge>
                        </CardContent>
                    </Card>
                </div>

                <div className="px-6">
                    {/* Informações do Equipamento */}
                    <Card className="mb-6 bg-slate-700 border-slate-600">
                        <CardHeader>
                            <CardTitle className="text-white">Informações do Equipamento</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-blue-300">Modelo</Label>
                                        <p className="text-white font-medium">{lastPrinter.marca} {lastPrinter.modelo}</p>
                                    </div>
                                    <div>
                                        <Label className="text-blue-300">Tipo</Label>
                                        <p className="text-white font-medium">{lastPrinter.tipo}</p>
                                    </div>
                                    <div>
                                        <Label className="text-blue-300">Volume Mensal Estimado</Label>
                                        <p className="text-white font-medium">{lastPrinter.volumeMensal.toLocaleString()} páginas</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-blue-300">Prazo do Contrato</Label>
                                        <p className="text-white font-medium">{lastPrinter.prazoContrato} meses</p>
                                    </div>
                                    <div>
                                        <Label className="text-blue-300">Custo por Página</Label>
                                        <p className="text-white font-medium">R$ {lastPrinter.custoPorPagina.toFixed(4)}</p>
                                    </div>
                                    {lastPrinter.isFromCatalog && (
                                        <div>
                                            <Label className="text-blue-300">Valor Mensal Fixo</Label>
                                            <p className="text-green-400 font-bold text-lg">R$ {lastPrinter.valorMensalLocacao?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Resumo Financeiro */}
                    <Card className="mb-6 bg-slate-700 border-slate-600">
                        <CardHeader>
                            <CardTitle className="text-white">Resumo Financeiro</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="text-center p-4 bg-slate-600 rounded-lg">
                                    <p className="text-sm text-gray-300">Custo Mensal</p>
                                    <p className="text-2xl font-bold text-blue-400">
                                        R$ {lastPrinter.custoMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div className="text-center p-4 bg-slate-600 rounded-lg">
                                    <p className="text-sm text-gray-300">Custo Total ({lastPrinter.prazoContrato} meses)</p>
                                    <p className="text-2xl font-bold text-green-400">
                                        R$ {lastPrinter.custoAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div className="text-center p-4 bg-slate-600 rounded-lg">
                                    <p className="text-sm text-gray-300">Custo por Página</p>
                                    <p className="text-2xl font-bold text-purple-400">
                                        R$ {lastPrinter.custoPorPagina.toFixed(4)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Ações */}
                    <div className="flex gap-4 justify-center">
                        <Button onClick={() => setShowQuoteView(false)} variant="outline">
                            Adicionar Mais Equipamentos
                        </Button>
                        <button 
                            onClick={handleSaveProposal}
                            style={{
                                backgroundColor: '#ff6b35',
                                color: 'white',
                                padding: '16px 32px',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '18px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(255, 107, 53, 0.3)',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => {
                                const el = e.currentTarget as HTMLElement
                                el.style.backgroundColor = '#e55a2b'
                                el.style.transform = 'translateY(-2px)'
                            }}
                            onMouseOut={(e) => {
                                const el = e.currentTarget as HTMLElement
                                el.style.backgroundColor = '#ff6b35'
                                el.style.transform = 'translateY(0)'
                            }}
                        >
                            📄 SALVAR EM ORÇAMENTOS
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="printer-theme min-h-screen bg-background text-foreground">
            {/* Header */}
            <div className="mb-8 p-6">
                <div className="flex items-center justify-between mb-6">
                    <Button onClick={() => {
                        if (isEditing) {
                            cancelEditing()
                            if (onFinishEditing) onFinishEditing()
                        } else {
                            onBack()
                        }
                    }} variant="outline" className="mb-4">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        {isEditing ? 'Cancelar Edição' : 'Voltar'}
                    </Button>
                    <div className="flex items-center gap-3">
                        {printers.length > 0 && (
                            <Button onClick={handleSaveProposal} className="bg-orange-600 hover:bg-orange-700 text-white">
                                <Save className="h-4 w-4 mr-2" />
                                {isEditing ? 'Atualizar Proposta' : 'Salvar em Orçamentos'}
                            </Button>
                        )}
                        {isEditing && (
                            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                Modo de Edição
                            </div>
                        )}
                    </div>
                </div>

                <Card className="bg-gradient-to-r from-[hsl(var(--accent-cyan))] to-[hsl(var(--primary-800))] border-[hsl(var(--accent-cyan)/0.5)] mb-6 card-modern">
                    <CardContent className="p-8 text-center">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <Printer className="h-8 w-8 text-white" />
                            <h1 className="text-3xl font-bold text-white">
                                {isEditing ? 'Editando Proposta' : 'Calculadora de Outsourcing'}
                            </h1>
                        </div>
                        <p className="text-white/90 text-lg mb-4">
                            {isEditing ? 'Modificando proposta existente' : 'Sistema de Cálculo de Impressão'}
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                            <Badge className="bg-[hsl(var(--primary-700))] hover:bg-[hsl(var(--primary-600))] text-white border-white/20">
                                Volume Total: {totais.volumeTotal.toLocaleString()} páginas/mês
                            </Badge>
                            {regimeAtivo && (
                                <Badge variant="secondary" className="bg-green-700/50 text-green-100 border-green-500/40">
                                    <Info className="h-3 w-3 mr-1" />
                                    Regime: {regimeAtivo.name}
                                </Badge>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="px-6">
                {/* Seletor de modo de cálculo */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <Plus className="h-5 w-5" />
                            Adicionar Item de Impressão
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-6">
                            <Label className="text-base font-semibold">Modo de Cálculo</Label>
                            <div className="flex gap-4 mt-2">
                                <Button
                                    variant={tipoModoCalculo === "catalogo" ? "default" : "outline"}
                                    onClick={() => setTipoModoCalculo("catalogo")}
                                    className="flex items-center gap-2"
                                >
                                    <Search className="h-4 w-4" />
                                    Impressora do Catálogo
                                </Button>
                                <Button
                                    variant="default"
                                    onClick={() => setShowManualCalculationModal(true)}
                                    className="flex items-center gap-2"
                                >
                                    <Calculator className="h-4 w-4" />
                                    Cálculo Manual Detalhado
                                </Button>
                            </div>
                        </div>

                        {/* Informação sobre volume variável */}
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start gap-2">
                                <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-sm text-blue-800 font-medium">Volume Variável Mês a Mês</p>
                                    <p className="text-xs text-blue-600 mt-1">
                                        O volume informado é uma estimativa mensal. Na modalidade <strong>Por Página</strong>, 
                                        o custo varia conforme o uso real (páginas * custo por página + locação fixa). 
                                        Na modalidade <strong>Franquia</strong>, o valor é fixo independente do volume. 
                                        O custo por página considera o regime tributário configurado em 
                                        <strong> Configurações → Outsourcing</strong>.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {tipoModoCalculo === "catalogo" ? (
                            /* Formulário para impressora do catálogo */
                            <div className="space-y-4">
                                {availablePrinters.filter(p => p.ativo && p.precificacao).length === 0 && (
                                    <div className="p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
                                        <p className="text-yellow-800 text-sm">
                                            <strong>Atenção:</strong> Não há impressoras com precificação disponíveis. 
                                            Cadastre uma nova impressora abaixo ou precifique uma impressora na seção "Gestão de Impressoras".
                                        </p>
                                    </div>
                                )}
                                <div className="flex justify-end">
                                    <Button type="button" variant="outline" onClick={() => setShowCatalogRegistration(!showCatalogRegistration)}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        {showCatalogRegistration ? 'Fechar Cadastro' : 'Cadastrar Nova Impressora'}
                                    </Button>
                                </div>

                                {showCatalogRegistration && (
                                    <Card className="border-blue-500/40 bg-slate-900/60">
                                        <CardHeader>
                                            <CardTitle className="text-sm text-blue-100">Nova Impressora do Catálogo</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                <div>
                                                    <Label>Marca *</Label>
                                                    <Input
                                                        value={catalogPrinterDraft.marca || ''}
                                                        onChange={(e) => setCatalogPrinterDraft({ ...catalogPrinterDraft, marca: e.target.value })}
                                                        placeholder="Ex: HP"
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Modelo *</Label>
                                                    <Input
                                                        value={catalogPrinterDraft.modelo || ''}
                                                        onChange={(e) => setCatalogPrinterDraft({ ...catalogPrinterDraft, modelo: e.target.value })}
                                                        placeholder="Ex: LaserJet M404dn"
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Tipo</Label>
                                                    <Select value={catalogPrinterDraft.tipo} onValueChange={(value: any) => setCatalogPrinterDraft({ ...catalogPrinterDraft, tipo: value })}>
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Laser P&B">Laser P&B</SelectItem>
                                                            <SelectItem value="Laser Colorida">Laser Colorida</SelectItem>
                                                            <SelectItem value="Jato de Tinta">Jato de Tinta</SelectItem>
                                                            <SelectItem value="Multifuncional P&B">Multifuncional P&B</SelectItem>
                                                            <SelectItem value="Multifuncional Colorida">Multifuncional Colorida</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label>Valor de custo (R$) *</Label>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        value={catalogPrinterDraft.custoAquisicao || ''}
                                                        onChange={(e) => setCatalogPrinterDraft({ ...catalogPrinterDraft, custoAquisicao: Number(e.target.value) })}
                                                        placeholder="Ex: 3400.00"
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Velocidade (PPM)</Label>
                                                    <Input
                                                        type="number"
                                                        value={catalogPrinterDraft.velocidadePPM || ''}
                                                        onChange={(e) => setCatalogPrinterDraft({ ...catalogPrinterDraft, velocidadePPM: Number(e.target.value) })}
                                                        placeholder="Ex: 38"
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Vida útil (páginas)</Label>
                                                    <Input
                                                        type="number"
                                                        value={catalogPrinterDraft.vidaUtilPaginas || ''}
                                                        onChange={(e) => setCatalogPrinterDraft({ ...catalogPrinterDraft, vidaUtilPaginas: Number(e.target.value) })}
                                                        placeholder="Ex: 100000"
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Energia (kWh/mês)</Label>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        value={catalogPrinterDraft.consumoEnergia || ''}
                                                        onChange={(e) => setCatalogPrinterDraft({ ...catalogPrinterDraft, consumoEnergia: Number(e.target.value) })}
                                                        placeholder="Ex: 15"
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Manutenção (R$/mês)</Label>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        value={catalogPrinterDraft.custoManutencaoMensal || ''}
                                                        onChange={(e) => setCatalogPrinterDraft({ ...catalogPrinterDraft, custoManutencaoMensal: Number(e.target.value) })}
                                                        placeholder="Ex: 50"
                                                    />
                                                </div>
                                            </div>

                                            <div className="rounded-lg border border-slate-700 bg-slate-950/40 p-4 space-y-3">
                                                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                                    <div>
                                                        <Label>Tipo Suprimento</Label>
                                                        <Select value={catalogSupplyDraft.tipo} onValueChange={(value: any) => setCatalogSupplyDraft({ ...catalogSupplyDraft, tipo: value })}>
                                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Toner P&B">Toner P&B</SelectItem>
                                                                <SelectItem value="Toner Preto">Toner Preto</SelectItem>
                                                                <SelectItem value="Toner Ciano">Toner Ciano</SelectItem>
                                                                <SelectItem value="Toner Magenta">Toner Magenta</SelectItem>
                                                                <SelectItem value="Toner Amarelo">Toner Amarelo</SelectItem>
                                                                <SelectItem value="Fotoconductor">Fotoconductor</SelectItem>
                                                                <SelectItem value="Kit Manutenção">Kit Manutenção</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div>
                                                        <Label>Descrição *</Label>
                                                        <Input
                                                            value={catalogSupplyDraft.descricao || ''}
                                                            onChange={(e) => setCatalogSupplyDraft({ ...catalogSupplyDraft, descricao: e.target.value })}
                                                            placeholder="Ex: Toner CF258X"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>Rendimento *</Label>
                                                        <Input
                                                            type="number"
                                                            value={catalogSupplyDraft.rendimentoPaginas || ''}
                                                            onChange={(e) => setCatalogSupplyDraft({ ...catalogSupplyDraft, rendimentoPaginas: Number(e.target.value) })}
                                                            placeholder="Páginas"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>Custo unitário *</Label>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            value={catalogSupplyDraft.custoUnitario || ''}
                                                            onChange={(e) => setCatalogSupplyDraft({ ...catalogSupplyDraft, custoUnitario: Number(e.target.value) })}
                                                            placeholder="R$"
                                                        />
                                                    </div>
                                                    <div className="flex items-end">
                                                        <Button type="button" onClick={adicionarSuprimentoCatalogo} className="w-full">
                                                            <Plus className="h-4 w-4 mr-2" />
                                                            Suprimento
                                                        </Button>
                                                    </div>
                                                </div>

                                                {catalogSuppliesDraft.length > 0 && (
                                                    <div className="space-y-2">
                                                        {catalogSuppliesDraft.map((supply) => (
                                                            <div key={supply.id} className="flex items-center justify-between rounded border border-slate-700 bg-slate-900/60 p-2 text-sm">
                                                                <span>{supply.tipo} - {supply.descricao} | {supply.rendimentoPaginas.toLocaleString()} páginas | R$ {supply.custoUnitario.toFixed(2)}</span>
                                                                <Button type="button" variant="ghost" size="sm" onClick={() => setCatalogSuppliesDraft(catalogSuppliesDraft.filter(s => s.id !== supply.id))}>
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex justify-end">
                                                <Button type="button" onClick={salvarImpressoraCatalogo} className="bg-green-600 hover:bg-green-700">
                                                    <Save className="h-4 w-4 mr-2" />
                                                    Salvar no Catálogo
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label>Impressora Cadastrada</Label>
                                        <Select value={impressoraSelecionada} onValueChange={setImpressoraSelecionada}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione uma impressora" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availablePrinters
                                                    .filter(p => p.ativo && p.precificacao)
                                                    .map(printer => (
                                                        <SelectItem key={printer.id} value={printer.id}>
                                                            {printer.marca} {printer.modelo} - {printer.tipo}
                                                        </SelectItem>
                                                    ))
                                                }
                                                {availablePrinters.filter(p => p.ativo && p.precificacao).length === 0 && (
                                                    <SelectItem value="no-printers" disabled>
                                                        Nenhuma impressora com precificação disponível
                                                    </SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Prazo do Contrato</Label>
                                        <Select value={prazoImpressora.toString()} onValueChange={(value) => setPrazoImpressora(Number(value))}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione o prazo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="12">12 meses</SelectItem>
                                                <SelectItem value="24">24 meses</SelectItem>
                                                <SelectItem value="36">36 meses</SelectItem>
                                                <SelectItem value="48">48 meses</SelectItem>
                                                <SelectItem value="60">60 meses</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label>Volume Mensal Estimado (páginas)</Label>
                                        <Input
                                            type="number"
                                            value={volumeImpressora || ""}
                                            onChange={(e) => setVolumeImpressora(Number(e.target.value))}
                                            placeholder="Ex: 5000"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <Button onClick={adicionarImpressoraCatalogo} className="w-full">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Adicionar Impressora
                                        </Button>
                                    </div>
                                </div>
                                
                                {/* Informações da impressora selecionada */}
                                {impressoraSelecionada && (() => {
                                    const impressora = availablePrinters.find(p => p.id === impressoraSelecionada)
                                    const periodo = impressora?.precificacao?.periodosLocacao[prazoImpressora]
                                    return impressora && periodo ? (
                                        <div className="mt-4 p-4 bg-slate-700 border border-slate-600 rounded-lg">
                                            <h4 className="font-semibold text-white mb-2">Informações da Impressora</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                <div>
                                                    <span className="text-blue-300">Modelo:</span>
                                                    <p className="font-medium text-white">{impressora.marca} {impressora.modelo}</p>
                                                </div>
                                                <div>
                                                    <span className="text-blue-300">Velocidade:</span>
                                                    <p className="font-medium text-white">{impressora.velocidadePPM} PPM</p>
                                                </div>
                                                <div>
                                                    <span className="text-blue-300">Valor Mensal:</span>
                                                    <p className="font-medium text-green-400">R$ {periodo.valorMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                </div>
                                                <div>
                                                    <span className="text-blue-300">ROI:</span>
                                                    <p className="font-medium text-purple-400">{periodo.roi.toFixed(1)}%</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : null
                                })()}
                            </div>
                        ) : (
                            /* Formulário manual */
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                <div>
                                    <Label>Tipo de Impressão</Label>
                                    <Select value={novoTipo} onValueChange={setNovoTipo}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o tipo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Preto e Branco">Preto e Branco</SelectItem>
                                            <SelectItem value="Colorida">Colorida</SelectItem>
                                            <SelectItem value="A3 Preto e Branco">A3 Preto e Branco</SelectItem>
                                            <SelectItem value="A3 Colorida">A3 Colorida</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Volume Mensal (páginas)</Label>
                                    <Input
                                        type="number"
                                        value={novoVolume || ""}
                                        onChange={(e) => setNovoVolume(Number(e.target.value))}
                                        placeholder="Ex: 1000"
                                    />
                                </div>
                                <div>
                                    <Label>Custo por Página (R$)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={novoCusto || ""}
                                        onChange={(e) => setNovoCusto(Number(e.target.value))}
                                        placeholder={`Padrão: R$ ${novoTipo ? (custosBase[novoTipo as keyof typeof custosBase] || 0.08).toFixed(2) : '0.08'}`}
                                    />
                                </div>
                                <div>
                                    <Label>Prazo (meses)</Label>
                                    <Select value={novoPrazo.toString()} onValueChange={(value) => setNovoPrazo(Number(value))}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="12">12 meses</SelectItem>
                                            <SelectItem value="24">24 meses</SelectItem>
                                            <SelectItem value="36">36 meses</SelectItem>
                                            <SelectItem value="48">48 meses</SelectItem>
                                            <SelectItem value="60">60 meses</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-end">
                                    <Button onClick={adicionarItemManual} className="w-full">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Adicionar
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Lista de itens */}
                {printers.length > 0 && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Itens de Impressão</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {printers.map((item, index) => (
                                    <div key={item.id} className="p-4 border rounded-lg bg-muted/50">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-semibold">Item {index + 1}</h3>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removerItem(item.id)}
                                                className="text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        
                                        {/* Informações da impressora se for do catálogo */}
                                        {item.isFromCatalog && (
                                            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                                        Catálogo
                                                    </Badge>
                                                    <span className="font-semibold text-blue-900">
                                                        {item.marca} {item.modelo}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-blue-700">
                                                    Contrato de {item.prazoContrato} meses - Valor fixo mensal
                                                </p>
                                            </div>
                                        )}

                                        {/* Mostrar informações do cálculo manual detalhado */}
                                        {item.detalhesCalculo?.isColorida ? (
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div>
                                                        <Label className="text-xs">Tipo</Label>
                                                        <p className="font-medium">{item.tipo}</p>
                                                        {item.modelo && (
                                                            <p className="text-xs text-gray-500">{item.marca} {item.modelo}</p>
                                                        )}
                                                    </div>
                                                    {item.detalhesCalculo?.modalidadeLocacao !== 'por-pagina' && (
                                                        <div>
                                                            <Label className="text-xs">Volume Mensal</Label>
                                                            <Input
                                                                type="number"
                                                                value={item.volumeMensal}
                                                                onChange={(e) => atualizarItem(item.id, 'volumeMensal', Number(e.target.value))}
                                                                className="h-8"
                                                            />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <Label className="text-xs">Prazo (meses)</Label>
                                                        <Input
                                                            type="number"
                                                            value={item.prazoContrato}
                                                            onChange={(e) => atualizarItem(item.id, 'prazoContrato', Number(e.target.value))}
                                                            className="h-8"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Custos separados para impressora colorida */}
                                                <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                                                    <div className="p-3 bg-blue-50 rounded border border-blue-200">
                                                        <Label className="text-xs text-blue-700">Custo/Página Mono</Label>
                                                        <p className="font-bold text-blue-600 text-lg">
                                                            R$ {item.detalhesCalculo.custoPorPaginaMono.toFixed(4)}
                                                        </p>
                                                    </div>
                                                    <div className="p-3 bg-green-50 rounded border border-green-200">
                                                        <Label className="text-xs text-green-700">Custo/Página Color</Label>
                                                        <p className="font-bold text-green-600 text-lg">
                                                            R$ {item.detalhesCalculo.custoPorPaginaColor.toFixed(4)}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label className="text-xs">Custo Mensal</Label>
                                                        <p className="font-bold text-green-600">
                                                            R$ {item.custoMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs">Custo Total ({item.prazoContrato} meses)</Label>
                                                        <p className="font-bold text-blue-600">
                                                            R$ {(item.custoMensal * item.prazoContrato).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                                                <div>
                                                    <Label className="text-xs">Tipo</Label>
                                                    <p className="font-medium">{item.tipo}</p>
                                                    {item.modelo && (
                                                        <p className="text-xs text-gray-500">{item.marca} {item.modelo}</p>
                                                    )}
                                                </div>
                                                {item.detalhesCalculo?.modalidadeLocacao !== 'por-pagina' && (
                                                    <div>
                                                        <Label className="text-xs">Volume Mensal</Label>
                                                        <Input
                                                            type="number"
                                                            value={item.volumeMensal}
                                                            onChange={(e) => atualizarItem(item.id, 'volumeMensal', Number(e.target.value))}
                                                            className="h-8"
                                                        />
                                                    </div>
                                                )}
                                                <div>
                                                    <Label className="text-xs">Prazo (meses)</Label>
                                                    {item.isFromCatalog ? (
                                                        <Select 
                                                            value={item.prazoContrato.toString()} 
                                                            onValueChange={(value) => atualizarItem(item.id, 'prazoContrato', Number(value))}
                                                        >
                                                            <SelectTrigger className="h-8">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="12">12</SelectItem>
                                                                <SelectItem value="24">24</SelectItem>
                                                                <SelectItem value="36">36</SelectItem>
                                                                <SelectItem value="48">48</SelectItem>
                                                                <SelectItem value="60">60</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    ) : (
                                                        <Input
                                                            type="number"
                                                            value={item.prazoContrato}
                                                            onChange={(e) => atualizarItem(item.id, 'prazoContrato', Number(e.target.value))}
                                                            className="h-8"
                                                        />
                                                    )}
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Custo/Página</Label>
                                                    {item.isFromCatalog || item.detalhesCalculo ? (
                                                        <p className="font-medium text-sm">
                                                            R$ {(item.detalhesCalculo?.custoPorPaginaMono || item.custoPorPagina).toFixed(4)}
                                                        </p>
                                                    ) : (
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            value={item.custoPorPagina}
                                                            onChange={(e) => atualizarItem(item.id, 'custoPorPagina', Number(e.target.value))}
                                                            className="h-8"
                                                        />
                                                    )}
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Custo Mensal</Label>
                                                    <p className="font-bold text-green-600">
                                                        R$ {item.custoMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </p>
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Custo Total</Label>
                                                    <p className="font-bold text-blue-600">
                                                        R$ {(item.custoMensal * item.prazoContrato).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Resumo dos totais */}
                {printers.length > 0 && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <Calculator className="h-5 w-5" />
                                Resumo do Orçamento
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                    <p className="text-sm text-muted-foreground">Volume Total Mensal</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {totais.volumeTotal.toLocaleString()} páginas
                                    </p>
                                </div>
                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                    <p className="text-sm text-muted-foreground">Custo Mensal Total</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        R$ {totais.custoMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div className="text-center p-4 bg-purple-50 rounded-lg">
                                    <p className="text-sm text-muted-foreground">Custo Total dos Contratos</p>
                                    <p className="text-2xl font-bold text-purple-600">
                                        R$ {totais.custoAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </div>

                            {printers.length > 0 && (
                                <div className="mt-6 text-center space-y-4">
                                    <Button 
                                        onClick={handleSaveProposal} 
                                        size="lg" 
                                        className="px-8"
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        {isEditing ? 'Atualizar Proposta' : 'Salvar em Orçamentos'}
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Informações adicionais */}
                <Card>
                    <CardHeader>
                        <CardTitle>Informações sobre Outsourcing de Impressão</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-semibold mb-2">Custos Base por Tipo:</h4>
                                <ul className="space-y-1 text-sm">
                                    <li>• Preto e Branco: R$ 0,08 por página</li>
                                    <li>• Colorida: R$ 0,35 por página</li>
                                    <li>• A3 Preto e Branco: R$ 0,12 por página</li>
                                    <li>• A3 Colorida: R$ 0,50 por página</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2">Serviços Inclusos:</h4>
                                <ul className="space-y-1 text-sm">
                                    <li>• Fornecimento de equipamentos</li>
                                    <li>• Manutenção preventiva e corretiva</li>
                                    <li>• Suprimentos (toner, papel)</li>
                                    <li>• Suporte técnico especializado</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Modal de Dados do Cliente */}
            <ProposalClientForm
                isOpen={showClientForm}
                onClose={() => {
                    console.log('Modal fechado')
                    setShowClientForm(false)
                }}
                onSubmit={(data) => {
                    console.log('Formulário submetido com:', data)
                    handleClientFormSubmit(data)
                }}
                initialData={isEditing ? editingClientData || undefined : undefined}
                isLoading={isGeneratingPDF || isLoadingProposal}
            />

            {/* PDF Confirmation Modal */}
            {pdfData && (
                <ProposalConfirmation
                    isOpen={showConfirmation}
                    onClose={() => {
                        setShowConfirmation(false)
                        setPdfData(null)
                        if (isEditing && onFinishEditing) {
                            onFinishEditing()
                        }
                    }}
                    onViewPDF={() => {
                        window.open(pdfData.pdfUrl, '_blank')
                    }}
                    onDownloadPDF={() => {
                        const link = document.createElement('a')
                        link.href = pdfData.pdfUrl
                        link.download = `Proposta-${pdfData.clientData.projectName}-${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`
                        document.body.appendChild(link)
                        link.click()
                        document.body.removeChild(link)
                    }}
                    onEditProposal={() => {
                        setShowConfirmation(false)
                        setShowClientForm(true)
                    }}
                    proposalData={pdfData.proposalData}
                    clientData={pdfData.clientData}
                    pdfUrl={pdfData.pdfUrl}
                />
            )}

            {/* Modal de Cálculo Manual Detalhado */}
            {showManualCalculationModal && (
                <ManualCalculationModal
                    onClose={() => setShowManualCalculationModal(false)}
                    onSave={handleManualCalculationSave}
                />
            )}
        </div>
    )
}
