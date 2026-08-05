"use client";

import React, { useState } from 'react';
import { Edit, Trash2, PlusCircle, FileDown, User, Eye, Printer, FileText, X, Headset, Package, Monitor, CheckCircle } from 'lucide-react';
import type { Quote, Partner } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import QuoteForm from './QuoteForm';
import { Input } from '@/components/ui/input';
import { useQuotes } from '@/contexts/QuoteContext';
import { hasPDF, getPDF, removePDF } from '@/lib/services/pdf-storage-service';

interface QuotesViewProps {
  partners: Partner[];
  onEditITQuote?: (quoteData: {
    id: string
    dominantModule: string
    items: any[]
  }) => void
}

const QuotesView: React.FC<QuotesViewProps> = ({ partners, onEditITQuote }) => {
  const { quotes, addQuote, updateQuote, deleteQuote } = useQuotes();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewingQuote, setViewingQuote] = useState<Quote | null>(null);
    const [clientFilter, setClientFilter] = useState('');
    const [accountManagerFilter, setAccountManagerFilter] = useState('');
    const [moduleFilter, setModuleFilter] = useState<string>('todos');
    const [pdfViewUrl, setPdfViewUrl] = useState<string | null>(null);
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

    const handleOpenModal = (quote: Quote | null = null) => {
        setEditingQuote(quote);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingQuote(null);
    };

    const handleOpenViewModal = (quote: Quote) => {
        setViewingQuote(quote);
        setIsViewModalOpen(true);
    };

    const handleCloseViewModal = () => {
        setIsViewModalOpen(false);
        setViewingQuote(null);
    };

    const handleSave = (quoteData: Quote) => {
        if (editingQuote) {
            updateQuote(editingQuote.id, quoteData);
        } else {
            addQuote(quoteData);
        }
        handleCloseModal();
    };

    const getStatusBadge = (status: Quote['status']) => {
        switch (status) {
            case 'Aprovado': return <Badge className="bg-green-500 hover:bg-green-600">Aprovado</Badge>;
            case 'Enviado': return <Badge className="bg-blue-500 hover:bg-blue-600">Enviado</Badge>;
            case 'Pendente': return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pendente</Badge>;
            case 'Aguardando Distribuidor': return <Badge className="bg-purple-500 hover:bg-purple-600">Aguardando Distribuidor</Badge>;
            case 'Rejeitado': return <Badge variant="destructive">Rejeitado</Badge>;
            default: return <Badge variant="secondary">Status</Badge>;
        }
    };

    const MODULE_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
      todos: { label: 'Todos', icon: null },
      'Service Desk': { label: 'Service Desk', icon: <Headset className="h-4 w-4" /> },
      'IT Sales/Rental/Services': { label: 'Venda/Locação/Serviços', icon: <Package className="h-4 w-4" /> },
      'Printer Outsourcing': { label: 'Outsourcing de Impressão', icon: <Printer className="h-4 w-4" /> },
      'NOC': { label: 'NOC', icon: <Monitor className="h-4 w-4" /> },
      'outros': { label: 'Outros', icon: null },
    };

    const filteredQuotes = quotes.filter(quote => {
        const clientMatch = quote.client.toLowerCase().includes(clientFilter.toLowerCase());
        const amMatch = quote.accountManager ? quote.accountManager.toLowerCase().includes(accountManagerFilter.toLowerCase()) : accountManagerFilter === '';
        if (!clientMatch || !amMatch) return false;
        if (moduleFilter === 'todos') return true;
        if (moduleFilter === 'outros') {
          const knownModules = ['Service Desk', 'IT Sales/Rental/Services', 'Printer Outsourcing', 'NOC'];
          return !quote.module || !knownModules.includes(quote.module);
        }
        return quote.module === moduleFilter;
    });

    const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');
    const resolveContractMonths = (quote: Quote) => {
        if (typeof quote.contractDurationMonths === 'number' && quote.contractDurationMonths > 0) {
            return Math.max(1, Math.round(quote.contractDurationMonths));
        }
        if (typeof quote.monthlyPrice === 'number' && quote.monthlyPrice > 0 && quote.total > 0) {
            return Math.max(1, Math.round(quote.total / quote.monthlyPrice));
        }
        return 12;
    };
    const resolveMonthlyPrice = (quote: Quote) => {
        if (typeof quote.monthlyPrice === 'number' && quote.monthlyPrice > 0) {
            return quote.monthlyPrice;
        }
        return quote.total / resolveContractMonths(quote);
    };
    const getQuoteModuleLabel = (quote: Quote) => {
        return quote.module ? MODULE_CONFIG[quote.module]?.label || quote.module : 'Não informado';
    };
    const getQuoteModalityLabel = (quote: Quote) => quote.modality || 'Não informado';
    const getQuotedProducts = (quote: Quote) => {
        return Array.isArray(quote.quotedProducts) ? quote.quotedProducts : [];
    };
    const buildQuotedProductsRows = (quote: Quote) => {
        const products = getQuotedProducts(quote);

        if (!products.length) {
            return `<tr><td colspan="5">Nenhum produto orçado cadastrado.</td></tr>`;
        }

        return products.map((item, index) => {
            const subtotal = Number(item.quantity || 0) * Number(item.unitCost || 0);
            return `
              <tr>
                <td>${index + 1}</td>
                <td>${escapeHtml(item.description)}</td>
                <td>${escapeHtml(item.quantity)}</td>
                <td>${escapeHtml(formatCurrency(item.unitCost))}</td>
                <td>${escapeHtml(formatCurrency(subtotal))}</td>
              </tr>
            `;
        }).join('');
    };

    const escapeHtml = (value?: string | number) => String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    const buildPrinterOutsourcingPreviewHtml = (quote: Quote) => {
        const specs = (quote as any).technicalSpecs || {};
        const equipments = Array.isArray(specs.equipments) ? specs.equipments : [];
        const rows = equipments.map((item: any, index: number) => {
            const details = item.detalhesCalculo || item.details || {};
            const isFranchise = details.modalidadeLocacao === 'franquia'
                || details.modalidade === 'franquia'
                || (Number(details.franquiaMensal || 0) > 0 && Number(details.valorFranquia || 0) > 0);
            const fleet = Array.isArray(details.impressoras) ? details.impressoras : [];
            const infra = Array.isArray(details.infraestrutura) ? details.infraestrutura : [];
            const fleetHtml = fleet.length > 0
                ? `<div class="sub"><strong>Frota:</strong>${fleet.map((printer: any) => `<span>${escapeHtml(printer.quantidade || 1)}x ${escapeHtml(printer.marca)} ${escapeHtml(printer.modelo)} (${escapeHtml(printer.tipo)})</span>`).join('')}</div>`
                : '';
            const infraHtml = infra.length > 0
                ? `<div class="sub"><strong>Infraestrutura:</strong>${infra.map((infraItem: any) => `<span>${escapeHtml(infraItem.quantidade || 1)}x ${escapeHtml(infraItem.tipo)} - ${escapeHtml(infraItem.descricao)}</span>`).join('')}</div>`
                : '';
            const excedenteMono = Number(details.valorPaginaExcedenteMono || details.custoPorPaginaMono || item.custoPorPagina || item.pageCost || 0);
            const excedenteColor = Number(details.valorPaginaExcedenteColor || details.custoPorPaginaColor || 0);
            const franchiseHtml = isFranchise
                ? `<div class="sub"><strong>Franquia mensal:</strong><span>${escapeHtml(Number(details.franquiaMensal || item.volumeMensal || 0).toLocaleString('pt-BR'))} páginas incluídas/mês</span><span>Valor da franquia: ${escapeHtml(formatCurrency(Number(details.valorFranquia || item.custoMensal || item.monthlyCost || 0)))}/mês</span><span>Página excedente Mono: R$ ${escapeHtml(excedenteMono.toFixed(4))}</span>${excedenteColor > 0 ? `<span>Página excedente Color: R$ ${escapeHtml(excedenteColor.toFixed(4))}</span>` : ''}</div>`
                : '';
            return `
              <tr>
                <td>${index + 1}</td>
                <td>
                  <strong>${escapeHtml(item.marca || item.brand || '')} ${escapeHtml(item.modelo || item.model || '')}</strong>
                  <div class="muted">${escapeHtml(item.tipo || item.type || '')}</div>
                  ${franchiseHtml}
                  ${fleetHtml}
                  ${infraHtml}
                </td>
                <td>${escapeHtml(item.prazoContrato || details.prazoContrato || '-')} meses</td>
                <td>${escapeHtml(formatCurrency(Number(item.custoMensal || item.monthlyCost || 0)))}</td>
                <td>${escapeHtml(formatCurrency(Number((item.custoMensal || item.monthlyCost || 0) * (item.prazoContrato || details.prazoContrato || resolveContractMonths(quote)))))}</td>
              </tr>
            `;
        }).join('');

        return `
          <html lang="pt-BR">
            <head>
              <meta charset="utf-8" />
              <title>Proposta ${escapeHtml(quote.id)}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 0; color: #172033; background: #f4f7fb; }
                .page { max-width: 980px; margin: 0 auto; background: #fff; min-height: 100vh; }
                .hero { background: #10213f; color: #fff; padding: 32px 40px; }
                .hero h1 { margin: 0 0 6px; font-size: 28px; }
                .hero p { margin: 0; color: #cbd5e1; }
                .content { padding: 28px 40px 40px; }
                .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 18px 0 24px; }
                .metric { border: 1px solid #d8e0ec; border-radius: 8px; padding: 14px; background: #f8fafc; }
                .metric span { display: block; color: #64748b; font-size: 12px; margin-bottom: 6px; }
                .metric strong { font-size: 20px; color: #10213f; }
                h2 { color: #10213f; margin-top: 26px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
                table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
                th { background: #10213f; color: #fff; text-align: left; padding: 10px; }
                td { border: 1px solid #d8e0ec; padding: 10px; vertical-align: top; }
                .muted { color: #64748b; font-size: 12px; }
                .sub { margin-top: 8px; color: #334155; font-size: 12px; }
                .sub span { display: block; margin-top: 3px; }
                .footer { margin-top: 28px; color: #64748b; font-size: 12px; }
                @media print { body { background: #fff; } .page { max-width: none; } }
              </style>
            </head>
            <body>
              <div class="page">
                <div class="hero">
                  <h1>Proposta de Outsourcing de Impressão</h1>
                  <p>${escapeHtml(quote.client)} • ${escapeHtml(quote.projectName)}</p>
                </div>
                <div class="content">
                  <div class="grid">
                    <div class="metric"><span>Valor mensal</span><strong>${escapeHtml(formatCurrency(resolveMonthlyPrice(quote)))}</strong></div>
                    <div class="metric"><span>Prazo</span><strong>${escapeHtml(resolveContractMonths(quote))} meses</strong></div>
                    <div class="metric"><span>Valor total</span><strong>${escapeHtml(formatCurrency(quote.total))}</strong></div>
                  </div>
                  <h2>Dados Comerciais</h2>
                  <p><strong>Cliente:</strong> ${escapeHtml(quote.client)}</p>
                  <p><strong>Projeto:</strong> ${escapeHtml(quote.projectName)}</p>
                  <p><strong>Gerente de contas:</strong> ${escapeHtml(quote.accountManager || 'Não informado')}</p>
                  <h2>Itens da Solução</h2>
                  <table>
                    <thead><tr><th>#</th><th>Descrição</th><th>Prazo</th><th>Mensal</th><th>Total</th></tr></thead>
                    <tbody>${rows || `<tr><td colspan="5">Detalhes técnicos não disponíveis para este orçamento.</td></tr>`}</tbody>
                  </table>
                  <div class="footer">Documento estruturado para visualização/impressão em PDF.</div>
                </div>
              </div>
            </body>
          </html>
        `;
    };

    const handleViewPDF = (quote: Quote) => {
        if (quote.module === 'Printer Outsourcing') {
            setPdfViewUrl(`data:text/html;charset=utf-8,${encodeURIComponent(buildPrinterOutsourcingPreviewHtml(quote))}`);
            setIsPdfModalOpen(true);
            return;
        }

        const data = getPDF(quote.id);
        if (data) {
            setPdfViewUrl(data);
            setIsPdfModalOpen(true);
            return;
        }
    };

    const handleClosePdfModal = () => {
        setIsPdfModalOpen(false);
        setPdfViewUrl(null);
    };

    const handleDownloadPDF = (quote: Quote) => {
        if (quote.module === 'Printer Outsourcing') {
            const blob = new Blob([buildPrinterOutsourcingPreviewHtml(quote)], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `orcamento-${quote.id}.html`;
            a.click();
            URL.revokeObjectURL(url);
            return;
        }

        const data = getPDF(quote.id);
        if (data) {
            const a = document.createElement('a');
            a.href = data;
            a.download = `orcamento-${quote.id}.pdf`;
            a.click();
        }
    };

    const handleDeleteQuote = (id: string) => {
        removePDF(id);
        deleteQuote(id);
    };

    const handlePrintQuote = (quote: Quote) => {
        const distributor = partners.find(p => p.id === Number(quote.distributorId));
        const printWindow = window.open('', '_blank', 'width=900,height=700');

        if (!printWindow) {
            alert('Não foi possível abrir a janela de impressão. Verifique o bloqueador de pop-up.');
            return;
        }

        const html = `
          <html lang="pt-BR">
            <head>
              <meta charset="utf-8" />
              <title>Orçamento ${escapeHtml(quote.id)}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 24px; color: #111; }
                h1 { margin-bottom: 8px; }
                .muted { color: #555; font-size: 12px; }
                .card { border: 1px solid #ddd; border-radius: 8px; padding: 16px; margin-top: 16px; }
                .row { display: flex; justify-content: space-between; margin: 8px 0; gap: 12px; }
                .label { font-weight: 600; color: #444; }
                .total { font-size: 20px; font-weight: bold; }
                table { width: 100%; border-collapse: collapse; margin-top: 12px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background: #f2f4f8; }
              </style>
            </head>
            <body>
              <h1>Orçamento ${escapeHtml(quote.id)}</h1>
              <p class="muted">Gerado em ${escapeHtml(new Date().toLocaleString('pt-BR'))}</p>
              <div class="card">
                <div class="row"><span class="label">Cliente</span><span>${escapeHtml(quote.client)}</span></div>
                <div class="row"><span class="label">Projeto</span><span>${escapeHtml(quote.projectName)}</span></div>
                <div class="row"><span class="label">Tipo do Orçamento</span><span>${escapeHtml(getQuoteModuleLabel(quote))}</span></div>
                <div class="row"><span class="label">Modalidade</span><span>${escapeHtml(getQuoteModalityLabel(quote))}</span></div>
                <div class="row"><span class="label">Gerente de Contas</span><span>${escapeHtml(quote.accountManager || 'Não informado')}</span></div>
                <div class="row"><span class="label">Distribuidor</span><span>${escapeHtml(distributor?.name || 'N/A')}</span></div>
                <div class="row"><span class="label">Status</span><span>${escapeHtml(quote.status)}</span></div>
                <div class="row"><span class="label">Data</span><span>${escapeHtml(formatDate(quote.date))}</span></div>
                <hr />
                <h2>Produtos Orçados</h2>
                <table>
                  <thead><tr><th>#</th><th>Descrição</th><th>Qtd</th><th>Valor Unitário</th><th>Subtotal</th></tr></thead>
                  <tbody>${buildQuotedProductsRows(quote)}</tbody>
                </table>
                <div class="row"><span class="label">Valor Mensal</span><span>${escapeHtml(formatCurrency(resolveMonthlyPrice(quote)))}</span></div>
                <div class="row"><span class="label">Prazo do Contrato</span><span>${escapeHtml(resolveContractMonths(quote))} meses</span></div>
                <div class="row total"><span>Valor Total do Contrato</span><span>${escapeHtml(formatCurrency(quote.total))}</span></div>
              </div>
            </body>
          </html>
        `;

        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        printWindow.onload = () => printWindow.print();
    };
    
    return (
        <Card className="shadow-lg">
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <CardTitle className="text-2xl mb-4 sm:mb-0">Orçamentos</CardTitle>
                    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => handleOpenModal()}>
                                <PlusCircle size={20} className="mr-2" />
                                Novo Orçamento
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-5xl">
                            <DialogHeader>
                                <DialogTitle>{editingQuote ? "Editar Orçamento" : "Adicionar Novo Orçamento"}</DialogTitle>
                            </DialogHeader>
                            <QuoteForm
                                quote={editingQuote}
                                onSave={handleSave}
                                onCancel={handleCloseModal}
                                partners={partners}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
                <Dialog open={isViewModalOpen} onOpenChange={(open) => open ? setIsViewModalOpen(true) : handleCloseViewModal()}>
                    <DialogContent className="sm:max-w-xl">
                        <DialogHeader>
                            <DialogTitle>Visualizar Proposta</DialogTitle>
                        </DialogHeader>
                        {viewingQuote && (
                            <div className="space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="rounded-lg border bg-muted/30 p-4">
                                        <div className="text-xs text-muted-foreground">Valor mensal</div>
                                        <div className="text-xl font-semibold">{formatCurrency(resolveMonthlyPrice(viewingQuote))}</div>
                                    </div>
                                    <div className="rounded-lg border bg-muted/30 p-4">
                                        <div className="text-xs text-muted-foreground">Prazo</div>
                                        <div className="text-xl font-semibold">{resolveContractMonths(viewingQuote)} meses</div>
                                    </div>
                                    <div className="rounded-lg border bg-primary/10 p-4">
                                        <div className="text-xs text-muted-foreground">Valor global</div>
                                        <div className="text-xl font-semibold text-primary">{formatCurrency(viewingQuote.total)}</div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                                    <div><span className="font-semibold">ID:</span> {viewingQuote.id}</div>
                                    <div><span className="font-semibold">Data:</span> {formatDate(viewingQuote.date)}</div>
                                    <div><span className="font-semibold">Cliente:</span> {viewingQuote.client}</div>
                                    <div><span className="font-semibold">Projeto:</span> {viewingQuote.projectName}</div>
                                    <div><span className="font-semibold">Tipo:</span> {getQuoteModuleLabel(viewingQuote)}</div>
                                    <div><span className="font-semibold">Modalidade:</span> {getQuoteModalityLabel(viewingQuote)}</div>
                                    <div><span className="font-semibold">Gerente de Contas:</span> {viewingQuote.accountManager || 'Não informado'}</div>
                                    <div><span className="font-semibold">Status:</span> {viewingQuote.status}</div>
                                    <div><span className="font-semibold">Arquivo Cotação:</span> {viewingQuote.quotationFile || 'Não anexado'}</div>
                                </div>
                                <div className="rounded-lg border">
                                    <div className="border-b px-4 py-3 font-semibold">Produtos Orçados</div>
                                    {getQuotedProducts(viewingQuote).length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Descrição</TableHead>
                                                        <TableHead className="w-20 text-right">Qtd</TableHead>
                                                        <TableHead className="w-36 text-right">Custo Unit.</TableHead>
                                                        <TableHead className="w-36 text-right">Subtotal</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {getQuotedProducts(viewingQuote).map(item => (
                                                        <TableRow key={item.id}>
                                                            <TableCell>{item.description}</TableCell>
                                                            <TableCell className="text-right">{item.quantity}</TableCell>
                                                            <TableCell className="text-right">{formatCurrency(item.unitCost)}</TableCell>
                                                            <TableCell className="text-right font-medium">
                                                                {formatCurrency(item.quantity * item.unitCost)}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    ) : (
                                        <div className="px-4 py-5 text-sm text-muted-foreground">Nenhum produto orçado cadastrado.</div>
                                    )}
                                </div>
                                {viewingQuote && hasPDF(viewingQuote.id) && (
                                    <div className="flex items-center gap-2 text-green-600">
                                        <FileText className="h-4 w-4" />
                                        <span className="font-semibold">Proposta em PDF disponível</span>
                                    </div>
                                )}
                                <div className="flex justify-end gap-2 pt-4">
                                    <Button variant="outline" onClick={handleCloseViewModal}>Fechar</Button>
                                    {viewingQuote && hasPDF(viewingQuote.id) && (
                                        <Button onClick={() => handleViewPDF(viewingQuote)}>
                                            <FileText className="h-4 w-4 mr-2" />
                                            Visualizar Proposta PDF
                                        </Button>
                                    )}
                                    <Button onClick={() => handlePrintQuote(viewingQuote)}>
                                        <Printer className="h-4 w-4 mr-2" />
                                        Imprimir / PDF
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
                <Dialog open={isPdfModalOpen} onOpenChange={(open) => open ? setIsPdfModalOpen(true) : handleClosePdfModal()}>
                    <DialogContent className="sm:max-w-4xl h-[90vh]">
                        <DialogHeader>
                            <DialogTitle>Visualizar Proposta PDF</DialogTitle>
                            <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={handleClosePdfModal}>
                                <X className="h-4 w-4" />
                            </Button>
                        </DialogHeader>
                        <div className="flex-1 w-full h-full min-h-[70vh]">
                            {pdfViewUrl ? (
                                <iframe src={pdfViewUrl} className="w-full h-full rounded border" title="Visualização do PDF" />
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    PDF não disponível.
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
                <div className="flex flex-wrap items-center gap-2 mt-4">
                    {Object.entries(MODULE_CONFIG).map(([key, config]) => (
                      <Button
                        key={key}
                        variant={moduleFilter === key ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setModuleFilter(key)}
                        className="flex items-center gap-1.5"
                      >
                        {config.icon}
                        {config.label}
                      </Button>
                    ))}
                </div>
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                    <Input 
                        placeholder="Filtrar por cliente..."
                        value={clientFilter}
                        onChange={(e) => setClientFilter(e.target.value)}
                        className="max-w-sm"
                    />
                    <Input 
                        placeholder="Filtrar por gerente de contas..."
                        value={accountManagerFilter}
                        onChange={(e) => setAccountManagerFilter(e.target.value)}
                        className="max-w-sm"
                    />
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Cliente / Projeto</TableHead>
                                <TableHead className="hidden sm:table-cell">Distribuidor</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-center">Arquivos</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredQuotes.map(quote => {
                                const distributor = partners.find(p => p.id === Number(quote.distributorId));
                                const canViewStructuredPDF = hasPDF(quote.id) || quote.module === 'Printer Outsourcing';
                                return (
                                    <TableRow key={quote.id}>
                                        <TableCell>
                                            <div className="font-semibold">{quote.client}</div>
                                            <div className="text-sm text-muted-foreground">{quote.projectName}</div>
                                            {quote.module && (
                                              <Badge variant="outline" className="mt-1 text-xs font-normal">
                                                {MODULE_CONFIG[quote.module]?.label || quote.module}
                                              </Badge>
                                            )}
                                            {quote.modality && (
                                              <Badge variant="secondary" className="ml-1 mt-1 text-xs font-normal">
                                                {quote.modality}
                                              </Badge>
                                            )}
                                            {quote.accountManager && (
                                                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                    <User size={12} /> {quote.accountManager}
                                                </div>
                                            )}
                                            <div className="text-xs text-muted-foreground font-code mt-1">{quote.id}</div>
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell">{distributor?.name || 'N/A'}</TableCell>
                                        <TableCell className="font-medium">
                                            <div>{formatCurrency(quote.total)}</div>
                                            <div className="text-xs text-muted-foreground">
                                                Mensal: {formatCurrency(resolveMonthlyPrice(quote))}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Global: {formatCurrency(quote.total)} em {resolveContractMonths(quote)} meses
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                value={quote.status}
                                                onValueChange={(val) => updateQuote(quote.id, { status: val as Quote['status'] })}
                                            >
                                                <SelectTrigger className={`h-8 w-36 text-xs font-semibold border-0 focus:ring-1 ${
                                                    quote.status === 'Aprovado'  ? 'bg-green-500/15 text-green-400 ring-green-500/30' :
                                                    quote.status === 'Pendente'  ? 'bg-yellow-500/15 text-yellow-400 ring-yellow-500/30' :
                                                    quote.status === 'Enviado'   ? 'bg-blue-500/15 text-blue-400 ring-blue-500/30' :
                                                    quote.status === 'Rejeitado' ? 'bg-red-500/15 text-red-400 ring-red-500/30' :
                                                    'bg-muted/30 text-muted-foreground'
                                                }`}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Pendente">
                                                        <span className="flex items-center gap-1.5 text-yellow-400">⏳ Pendente</span>
                                                    </SelectItem>
                                                    <SelectItem value="Enviado">
                                                        <span className="flex items-center gap-1.5 text-blue-400">📤 Enviado</span>
                                                    </SelectItem>
                                                    <SelectItem value="Aprovado">
                                                        <span className="flex items-center gap-1.5 text-green-400">✓ Aprovado</span>
                                                    </SelectItem>
                                                    <SelectItem value="Rejeitado">
                                                        <span className="flex items-center gap-1.5 text-red-400">✕ Rejeitado</span>
                                                    </SelectItem>
                                                    <SelectItem value="Aguardando Distribuidor">
                                                        <span className="flex items-center gap-1.5 text-purple-400">🔄 Aguard. Distribuidor</span>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex justify-center items-center gap-2">
                                                {quote.quotationFile && (
                                                    <a href={quote.quotationFile} download className="inline-flex">
                                                        <Button variant="outline" size="icon">
                                                            <FileDown className="h-4 w-4" />
                                                        </Button>
                                                    </a>
                                                )}
                                                {quote.pricingFile && hasPDF(quote.id) && (
                                                    <Button variant="outline" size="icon" onClick={() => handleDownloadPDF(quote)} title="Baixar PDF da Proposta">
                                                        <FileText className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {!quote.quotationFile && !quote.pricingFile && !canViewStructuredPDF && <span className="text-muted-foreground">-</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex flex-wrap gap-1 justify-end">
                                                <Button variant="outline" size="sm" onClick={() => handleOpenViewModal(quote)}>
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    Visualizar
                                                </Button>
                                                {canViewStructuredPDF && (
                                                    <Button variant="outline" size="sm" onClick={() => handleViewPDF(quote)}>
                                                        <FileText className="h-4 w-4 mr-1" />
                                                        Visualizar PDF
                                                    </Button>
                                                )}
                                                <Button variant="outline" size="sm" onClick={() => handlePrintQuote(quote)}>
                                                    <Printer className="h-4 w-4 mr-1" />
                                                    Imprimir PDF
                                                </Button>
                                                {quote.module === 'IT Sales/Rental/Services' && onEditITQuote ? (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        title="Editar na Calculadora"
                                                        onClick={() => {
                                                            const specs = (quote as any).technicalSpecs || {}
                                                            const items = Array.isArray(specs.items) ? specs.items : []
                                                            const dominantModule = specs.dominantModule || 'sales'
                                                            onEditITQuote({ id: quote.id, dominantModule, items })
                                                        }}
                                                    >
                                                        <Edit className="h-4 w-4 mr-1" />
                                                        Editar na Calculadora
                                                    </Button>
                                                ) : (
                                                    <Button variant="outline" size="sm" onClick={() => handleOpenModal(quote)} title="Editar">
                                                        <Edit className="h-4 w-4 mr-1" />
                                                        Editar
                                                    </Button>
                                                )}
                                                <Button variant="outline" size="sm" onClick={() => handleDeleteQuote(quote.id)} title="Excluir">
                                                    <Trash2 className="h-4 w-4 mr-1 text-destructive" />
                                                    Excluir
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
};

export default QuotesView;
