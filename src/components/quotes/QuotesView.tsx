"use client";

import React, { useState } from 'react';
import { Edit, Trash2, PlusCircle, FileDown, User, Eye, Printer } from 'lucide-react';
import type { Quote, Partner } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import QuoteForm from './QuoteForm';
import { Input } from '@/components/ui/input';
import { useQuotes } from '@/contexts/QuoteContext';

interface QuotesViewProps {
  partners: Partner[];
}

const QuotesView: React.FC<QuotesViewProps> = ({ partners }) => {
  const { quotes, addQuote, updateQuote, deleteQuote } = useQuotes();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewingQuote, setViewingQuote] = useState<Quote | null>(null);
    const [clientFilter, setClientFilter] = useState('');
    const [accountManagerFilter, setAccountManagerFilter] = useState('');

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

    const filteredQuotes = quotes.filter(quote => {
        const clientMatch = quote.client.toLowerCase().includes(clientFilter.toLowerCase());
        const amMatch = quote.accountManager ? quote.accountManager.toLowerCase().includes(accountManagerFilter.toLowerCase()) : accountManagerFilter === '';
        return clientMatch && amMatch;
    });

    const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');

    const escapeHtml = (value?: string | number) => String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

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
              </style>
            </head>
            <body>
              <h1>Orçamento ${escapeHtml(quote.id)}</h1>
              <p class="muted">Gerado em ${escapeHtml(new Date().toLocaleString('pt-BR'))}</p>
              <div class="card">
                <div class="row"><span class="label">Cliente</span><span>${escapeHtml(quote.client)}</span></div>
                <div class="row"><span class="label">Projeto</span><span>${escapeHtml(quote.projectName)}</span></div>
                <div class="row"><span class="label">Gerente de Contas</span><span>${escapeHtml(quote.accountManager || 'Não informado')}</span></div>
                <div class="row"><span class="label">Distribuidor</span><span>${escapeHtml(distributor?.name || 'N/A')}</span></div>
                <div class="row"><span class="label">Status</span><span>${escapeHtml(quote.status)}</span></div>
                <div class="row"><span class="label">Data</span><span>${escapeHtml(formatDate(quote.date))}</span></div>
                <hr />
                <div class="row total"><span>Total</span><span>${escapeHtml(formatCurrency(quote.total))}</span></div>
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
                        <DialogContent className="sm:max-w-2xl">
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
                            <DialogTitle>Visualizar Orçamento</DialogTitle>
                        </DialogHeader>
                        {viewingQuote && (
                            <div className="space-y-3">
                                <div><span className="font-semibold">ID:</span> {viewingQuote.id}</div>
                                <div><span className="font-semibold">Cliente:</span> {viewingQuote.client}</div>
                                <div><span className="font-semibold">Projeto:</span> {viewingQuote.projectName}</div>
                                <div><span className="font-semibold">Gerente de Contas:</span> {viewingQuote.accountManager || 'Não informado'}</div>
                                <div><span className="font-semibold">Status:</span> {viewingQuote.status}</div>
                                <div><span className="font-semibold">Data:</span> {formatDate(viewingQuote.date)}</div>
                                <div><span className="font-semibold">Total:</span> {formatCurrency(viewingQuote.total)}</div>
                                <div><span className="font-semibold">Arquivo Cotação:</span> {viewingQuote.quotationFile || 'Não anexado'}</div>
                                <div><span className="font-semibold">Arquivo Precificação:</span> {viewingQuote.pricingFile || 'Não anexado'}</div>
                                <div className="flex justify-end gap-2 pt-4">
                                    <Button variant="outline" onClick={handleCloseViewModal}>Fechar</Button>
                                    <Button onClick={() => handlePrintQuote(viewingQuote)}>
                                        <Printer className="h-4 w-4 mr-2" />
                                        Imprimir / PDF
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
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
                                return (
                                    <TableRow key={quote.id}>
                                        <TableCell>
                                            <div className="font-semibold">{quote.client}</div>
                                            <div className="text-sm text-muted-foreground">{quote.projectName}</div>
                                            {quote.accountManager && (
                                                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                    <User size={12} /> {quote.accountManager}
                                                </div>
                                            )}
                                            <div className="text-xs text-muted-foreground font-code mt-1">{quote.id}</div>
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell">{distributor?.name || 'N/A'}</TableCell>
                                        <TableCell className="font-medium">
                                            {quote.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(quote.status)}</TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex justify-center items-center gap-2">
                                                {quote.quotationFile && (
                                                    <Button variant="outline" size="icon" onClick={() => alert(`Download: ${quote.quotationFile}`)}>
                                                        <FileDown className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {quote.pricingFile && (
                                                    <Button variant="outline" size="icon" onClick={() => alert(`Download: ${quote.pricingFile}`)}>
                                                        <FileDown className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {!quote.quotationFile && !quote.pricingFile && <span className="text-muted-foreground">-</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex flex-wrap gap-1 justify-end">
                                                <Button variant="outline" size="sm" onClick={() => handleOpenViewModal(quote)}>
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    Visualizar
                                                </Button>
                                                <Button variant="outline" size="sm" onClick={() => handlePrintQuote(quote)}>
                                                    <Printer className="h-4 w-4 mr-1" />
                                                    Imprimir PDF
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleOpenModal(quote)} title="Editar">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => deleteQuote(quote.id)} title="Excluir">
                                                    <Trash2 className="h-4 w-4 text-destructive" />
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
