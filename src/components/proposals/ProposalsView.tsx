"use client";

import { useRecordLink } from '@/hooks/use-record-link';
import React, { useState } from 'react';
import { Edit, Trash2, PlusCircle, FileDown, User, Calendar, DollarSign, FileText, Briefcase, Printer } from 'lucide-react';
import type { Proposal, Partner } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import ProposalForm from './ProposalForm';
import CommercialProposalView from '../commercial-proposal/CommercialProposalView';

interface ProposalsViewProps {
  proposals: Proposal[];
  partners: Partner[];
  onSave: (proposal: Proposal) => void;
  onDelete: (id: string) => void;
}

const DEFAULT_STATUS: Proposal['status'] = 'Rascunho';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const normalized = value.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const getEntryId = (entry: unknown, fallbackIndex: number): string => {
  if (!isRecord(entry)) return `local-${fallbackIndex}`;
  const candidate = entry.id ?? entry.proposalId ?? entry.proposalNumber;
  if (typeof candidate === 'string' && candidate.trim()) return candidate;
  if (typeof candidate === 'number' && Number.isFinite(candidate)) return String(candidate);
  return `local-${fallbackIndex}`;
};

const getRawStorageEntries = (parsed: unknown): unknown[] => {
  if (Array.isArray(parsed)) return parsed;
  if (isRecord(parsed)) return Object.values(parsed);
  return [];
};

const normalizeLocalProposal = (entry: unknown, index: number): Proposal => {
  const safeDate = new Date().toISOString().split('T')[0];
  const fallbackId = getEntryId(entry, index);

  if (!isRecord(entry)) {
    return {
      id: fallbackId,
      title: `Proposta ${fallbackId}`,
      client: 'Cliente não informado',
      description: 'Proposta importada do armazenamento local.',
      status: DEFAULT_STATUS,
      value: 0,
      date: safeDate,
      expiryDate: safeDate,
      accountManager: 'N/A',
      distributorId: 'local',
    };
  }

  const clientInfo = isRecord(entry.clientInfo) ? entry.clientInfo : {};
  const accountManagerInfo = isRecord(entry.accountManagerInfo) ? entry.accountManagerInfo : {};
  const quoteItems = Array.isArray(entry.quoteItems) ? entry.quoteItems : [];

  const quoteItemsTotal = quoteItems.reduce((sum, item) => {
    if (!isRecord(item)) return sum;
    const itemTotal = toNumber(item.totalPrice) ?? toNumber(item.total) ?? toNumber(item.price) ?? 0;
    return sum + itemTotal;
  }, 0);

  const value =
    toNumber(entry.value) ??
    toNumber(entry.totalValue) ??
    toNumber(entry.totalPrice) ??
    quoteItemsTotal ??
    0;

  const titleCandidate =
    (typeof entry.title === 'string' && entry.title) ||
    (typeof clientInfo.nomeProjeto === 'string' && clientInfo.nomeProjeto) ||
    (typeof entry.proposalNumber === 'string' && `Proposta ${entry.proposalNumber}`) ||
    `Proposta ${fallbackId}`;

  const clientCandidate =
    (typeof entry.client === 'string' && entry.client) ||
    (typeof entry.clientName === 'string' && entry.clientName) ||
    (typeof clientInfo.razaoSocial === 'string' && clientInfo.razaoSocial) ||
    'Cliente não informado';

  const accountManagerCandidate =
    (typeof entry.accountManager === 'string' && entry.accountManager) ||
    (typeof accountManagerInfo.nomeGerente === 'string' && accountManagerInfo.nomeGerente) ||
    'N/A';

  const dateCandidate = typeof entry.date === 'string' && entry.date ? entry.date : safeDate;
  const expiryCandidate = typeof entry.expiryDate === 'string' && entry.expiryDate ? entry.expiryDate : safeDate;

  const technicalSpecs =
    typeof entry.technicalSpecs === 'string'
      ? entry.technicalSpecs
      : isRecord(entry.technicalSpecs) || Array.isArray(entry.technicalSpecs)
        ? JSON.stringify(entry.technicalSpecs)
        : undefined;

  return {
    id: fallbackId,
    title: titleCandidate,
    client: clientCandidate,
    description:
      (typeof entry.description === 'string' && entry.description) ||
      'Proposta importada do módulo de precificação.',
    status:
      (typeof entry.status === 'string' &&
      ['Rascunho', 'Enviada', 'Em Análise', 'Aprovada', 'Rejeitada'].includes(entry.status)
        ? entry.status
        : DEFAULT_STATUS) as Proposal['status'],
    value,
    date: dateCandidate,
    expiryDate: expiryCandidate,
    accountManager: accountManagerCandidate,
    distributorId:
      (typeof entry.distributorId === 'string' || typeof entry.distributorId === 'number')
        ? entry.distributorId
        : 'local',
    proposalFile: typeof entry.proposalFile === 'string' ? entry.proposalFile : undefined,
    technicalSpecs,
    commercialTerms: typeof entry.commercialTerms === 'string' ? entry.commercialTerms : undefined,
  };
};

const loadLocalProposals = (): Proposal[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem('proposals') || '[]');
    const entries = getRawStorageEntries(parsed);
    return entries.map((entry, index) => normalizeLocalProposal(entry, index));
  } catch {
    return [];
  }
};

const removeFromLocalStorageProposals = (proposalId: string): Proposal[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem('proposals') || '[]');

    if (Array.isArray(parsed)) {
      const updated = parsed.filter((entry, index) => getEntryId(entry, index) !== proposalId);
      localStorage.setItem('proposals', JSON.stringify(updated));
      return updated.map((entry, index) => normalizeLocalProposal(entry, index));
    }

    if (isRecord(parsed)) {
      const updatedEntries = Object.entries(parsed).filter(([, entry], index) => getEntryId(entry, index) !== proposalId);
      const updatedObject = Object.fromEntries(updatedEntries);
      localStorage.setItem('proposals', JSON.stringify(updatedObject));
      return Object.values(updatedObject).map((entry, index) => normalizeLocalProposal(entry, index));
    }

    localStorage.setItem('proposals', '[]');
    return [];
  } catch {
    return [];
  }
};

const ProposalsView: React.FC<ProposalsViewProps> = ({ proposals, partners, onSave, onDelete }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingProposal, setViewingProposal] = useState<Proposal | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showProposalTypeDialog, setShowProposalTypeDialog] = useState(false);
  const [showCommercialProposal, setShowCommercialProposal] = useState(false);
  const [localProposals, setLocalProposals] = useState<Proposal[]>([]);

  // Carrega propostas do localStorage
  React.useEffect(() => {
    setLocalProposals(loadLocalProposals());
  }, []);

  // Combina propostas do sistema com as do localStorage
  const allProposals = [...proposals, ...localProposals];
  useRecordLink('proposals', allProposals, setViewingProposal);

  const handleGoToCommercialProposals = () => {
    window.location.href = '/propostas';
  };

  const filteredProposals = allProposals.filter(proposal =>
    (statusFilter === 'all' || proposal.status === statusFilter) && (proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proposal.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proposal.accountManager.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Rascunho': return 'bg-gray-100 text-gray-800';
      case 'Enviada': return 'bg-blue-100 text-blue-800';
      case 'Em Análise': return 'bg-yellow-100 text-yellow-800';
      case 'Aprovada': return 'bg-green-100 text-green-800';
      case 'Rejeitada': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleEdit = (proposal: Proposal) => {
    // Se for uma proposta de outsourcing, redireciona para a calculadora
    if (proposal.distributorId === 'outsourcing' && proposal.technicalSpecs) {
      const shouldRedirect = confirm(
        `Esta é uma proposta de Outsourcing de Impressão.\n\n` +
        `Deseja editar na Calculadora de Outsourcing?\n\n` +
        `✓ Manterá todos os equipamentos e dados\n` +
        `✓ Permitirá modificar valores e gerar novo PDF`
      )
      
      if (shouldRedirect) {
        // Salva os dados da proposta para edição
        localStorage.setItem('editingOutsourcingProposal', JSON.stringify({
          proposalId: proposal.id,
          clientData: {
            razaoSocial: proposal.client,
            nomeProjeto: proposal.title.split(' - ')[0] || 'Projeto',
            nomeContato: 'Contato',
            emailCliente: 'contato@cliente.com',
            telefoneCliente: '(11) 99999-9999',
            nomeGerente: proposal.accountManager,
            emailGerente: 'gerente@empresa.com',
            telefoneGerente: '(11) 88888-8888'
          },
          technicalSpecs: JSON.parse(proposal.technicalSpecs)
        }))
        
        // Redireciona para a calculadora (isso precisa ser implementado no componente pai)
        alert('Redirecionando para a Calculadora de Outsourcing...\n\nVá para: Precificação → Outsourcing de Impressão → Iniciar Cálculo')
        return
      }
    }
    
    // Para outras propostas, usa o fluxo normal
    setEditingProposal(proposal);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setShowProposalTypeDialog(true);
  };

  const handleProposalTypeSelect = (type: 'commercial' | 'technical') => {
    setShowProposalTypeDialog(false);
    if (type === 'commercial') {
      setShowCommercialProposal(true);
    } else {
      setEditingProposal(null);
      setIsFormOpen(true);
    }
  };

  const handleSave = (proposal: Proposal) => {
    onSave(proposal);
    setIsFormOpen(false);
    setEditingProposal(null);
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingProposal(null);
  };

  const handleCommercialProposalClose = () => {
    setShowCommercialProposal(false);
  };

  const getDistributorName = (distributorId: number | string) => {
    if (distributorId === 'outsourcing') {
      return 'Outsourcing de Impressão';
    }
    const distributor = partners.find(p => p.id.toString() === distributorId.toString());
    return distributor?.name || 'N/A';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Propostas</h1>
          <p className="text-muted-foreground">
            Gerencie suas propostas comerciais
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleGoToCommercialProposals} variant="default">
            <FileText className="h-4 w-4 mr-2" />
            Propostas Comerciais
          </Button>
          <Button onClick={handleCreate} variant="outline">
            <PlusCircle className="h-4 w-4 mr-2" />
            Nova Proposta Técnica
          </Button>
        </div>
      </div>

      {/* Banner Propostas Comerciais */}


      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Propostas</CardTitle>
            <FileDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{proposals.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(proposals.reduce((sum, p) => sum + p.value, 0))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {proposals.filter(p => p.status === 'Aprovada').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Análise</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {proposals.filter(p => p.status === 'Em Análise').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtro de Busca */}
      <div className="workspace-toolbar">
        <Input
          placeholder="Buscar propostas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <select className="dashboard-manager" aria-label="Filtrar propostas por status" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="all">Todos os status</option>{['Rascunho','Enviada','Em Análise','Aprovada','Rejeitada'].map(status => <option key={status}>{status}</option>)}</select>
      </div>

      {/* Tabela de Propostas */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Propostas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Gerente de Conta</TableHead>
                <TableHead>Distribuidor</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data de Criação</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProposals.map((proposal) => (
                <TableRow key={proposal.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {proposal.title}
                      {proposal.distributorId === 'outsourcing' && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          <Printer className="h-3 w-3 mr-1" />
                          Outsourcing
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{proposal.client}</TableCell>
                  <TableCell>{proposal.accountManager}</TableCell>
                  <TableCell>{getDistributorName(proposal.distributorId)}</TableCell>
                  <TableCell>{formatCurrency(proposal.value)}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(proposal.status)}>
                      {proposal.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(proposal.date)}</TableCell>
                  <TableCell>{formatDate(proposal.expiryDate)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {/* Botão para visualizar PDF (apenas para propostas de outsourcing) */}
                      {proposal.proposalFile && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Abre o PDF em nova aba
                            const newWindow = window.open()
                            if (newWindow) {
                              newWindow.document.write(`
                                <html>
                                  <head><title>Proposta - ${proposal.client}</title></head>
                                  <body style="margin:0;">
                                    <embed src="${proposal.proposalFile}" type="application/pdf" width="100%" height="100%" />
                                  </body>
                                </html>
                              `)
                            }
                          }}
                          title="Visualizar PDF"
                        >
                          <FileDown className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(proposal)}
                        title="Editar Proposta"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Se for proposta do localStorage, remove de lá também
                          if (proposal.distributorId === 'outsourcing') {
                            const updatedProposals = removeFromLocalStorageProposals(proposal.id);
                            setLocalProposals(updatedProposals);
                          }
                          onDelete(proposal.id)
                        }}
                        title="Excluir Proposta"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredProposals.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma proposta encontrada.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de Seleção do Tipo de Proposta */}
      <Dialog open={showProposalTypeDialog} onOpenChange={setShowProposalTypeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Escolha o Tipo de Proposta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Button 
              onClick={() => handleProposalTypeSelect('commercial')}
              className="w-full h-20 flex flex-col items-center justify-center space-y-2"
              variant="outline"
            >
              <FileText className="h-8 w-8" />
              <span className="font-semibold">Proposta Comercial</span>
              <span className="text-sm text-muted-foreground">Layout personalizado com design profissional</span>
            </Button>
            <Button 
              onClick={() => handleProposalTypeSelect('technical')}
              className="w-full h-20 flex flex-col items-center justify-center space-y-2"
              variant="outline"
            >
              <Briefcase className="h-8 w-8" />
              <span className="font-semibold">Proposta Técnica</span>
              <span className="text-sm text-muted-foreground">Formulário detalhado com especificações técnicas</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo da Proposta Comercial */}
      <Dialog open={showCommercialProposal} onOpenChange={setShowCommercialProposal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Proposta Comercial</DialogTitle>
          </DialogHeader>
          <CommercialProposalView partners={partners} />
        </DialogContent>
      </Dialog>

      {/* Diálogo da Proposta Técnica */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProposal ? 'Editar Proposta' : 'Nova Proposta Técnica'}
            </DialogTitle>
          </DialogHeader>
          <ProposalForm
            proposal={editingProposal}
            partners={partners}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </DialogContent>
      </Dialog>
      <Dialog open={!!viewingProposal} onOpenChange={open => { if (!open) setViewingProposal(null); }}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{viewingProposal?.title}</DialogTitle></DialogHeader>{viewingProposal && <div className="space-y-5"><p className="text-sm text-muted-foreground">{viewingProposal.client} · {viewingProposal.accountManager}</p><div className="grid grid-cols-2 gap-4 rounded-lg border bg-muted/30 p-4"><div><p className="text-xs text-muted-foreground">Valor global</p><strong className="mt-1 block text-xl tabular-nums">{formatCurrency(viewingProposal.value)}</strong></div><div><p className="text-xs text-muted-foreground">Validade</p><p className="mt-1 text-sm">{formatDate(viewingProposal.expiryDate)}</p></div></div><Badge variant="secondary">{viewingProposal.status}</Badge><p className="whitespace-pre-wrap text-sm leading-relaxed">{viewingProposal.description}</p><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setViewingProposal(null)}>Fechar</Button><Button onClick={() => { const proposal = viewingProposal; setViewingProposal(null); handleEdit(proposal); }}>Editar proposta</Button></div></div>}</DialogContent></Dialog>
    </div>
  );
};

export default ProposalsView; 
