'use client';

import React, { useState, useMemo } from 'react';
import {
  Edit,
  Trash2,
  PlusCircle,
  FileDown,
  User,
  Calendar,
  DollarSign,
  FileText,
  Search,
  Filter,
  MoreVertical,
  ExternalLink,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Eye,
  Sparkles,
  Building,
  TrendingUp,
} from 'lucide-react';
import type { Proposal, Partner } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import ProposalForm from './ProposalForm';

interface ProposalsViewV2Props {
  proposals: Proposal[];
  partners: Partner[];
  onSave: (proposal: Proposal) => void;
  onDelete: (id: string) => void;
}

const STATUS_CONFIG = {
  'Rascunho': {
    icon: FileText,
    color: 'text-muted-foreground',
    bg: 'bg-muted border-border',
    bar: 'bg-muted-foreground',
    dot: 'bg-muted-foreground',
    label: 'Rascunho',
  },
  'Enviada': {
    icon: Clock,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10 border-blue-500/25',
    bar: 'bg-blue-500',
    dot: 'bg-blue-500',
    label: 'Enviada ao Cliente',
  },
  'Em Análise': {
    icon: AlertCircle,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10 border-amber-500/25',
    bar: 'bg-amber-500',
    dot: 'bg-amber-500',
    label: 'Em Análise pelo Cliente',
  },
  'Aprovada': {
    icon: CheckCircle2,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10 border-emerald-500/25',
    bar: 'bg-emerald-500',
    dot: 'bg-emerald-500',
    label: 'Aprovada / Fechada',
  },
  'Rejeitada': {
    icon: XCircle,
    color: 'text-rose-500',
    bg: 'bg-rose-500/10 border-rose-500/25',
    bar: 'bg-rose-500',
    dot: 'bg-rose-500',
    label: 'Recusada',
  },
} as const;

export default function ProposalsViewV2({
  proposals,
  partners,
  onSave,
  onDelete,
}: ProposalsViewV2Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [managerFilter, setManagerFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
  const [viewingProposal, setViewingProposal] = useState<Proposal | null>(null);

  // Managers list
  const managers = useMemo(
    () => [...new Set(proposals.map((p) => p.accountManager).filter(Boolean))],
    [proposals]
  );

  // Filtered proposals
  const filteredProposals = useMemo(() => {
    return proposals.filter((proposal) => {
      const matchesSearch =
        searchTerm === '' ||
        proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proposal.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proposal.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || proposal.status === statusFilter;

      const matchesManager =
        managerFilter === 'all' || proposal.accountManager === managerFilter;

      return matchesSearch && matchesStatus && matchesManager;
    });
  }, [proposals, searchTerm, statusFilter, managerFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = proposals.length;
    const totalValue = proposals.reduce((sum, p) => sum + (p.value || 0), 0);
    const approved = proposals.filter((p) => p.status === 'Aprovada').length;
    const approvedValue = proposals
      .filter((p) => p.status === 'Aprovada')
      .reduce((sum, p) => sum + (p.value || 0), 0);
    const pending = proposals.filter(
      (p) => p.status === 'Enviada' || p.status === 'Em Análise'
    ).length;

    return { total, totalValue, approved, approvedValue, pending };
  }, [proposals]);

  const handleEdit = (proposal: Proposal) => {
    setEditingProposal(proposal);
    setIsFormOpen(true);
  };

  const handleNew = () => {
    setEditingProposal(null);
    setIsFormOpen(true);
  };

  const handleSave = (proposal: Proposal) => {
    onSave(proposal);
    setIsFormOpen(false);
    setEditingProposal(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta proposta?')) {
      onDelete(id);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Data não informada';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getDaysRemaining = (expiryDateString: string) => {
    if (!expiryDateString) return null;
    const expiry = new Date(expiryDateString);
    const diff = Math.ceil((expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // Status pills
  const statusTabs = [
    { id: 'all', label: 'Todas', count: proposals.length },
    { id: 'Em Análise', label: 'Em Análise', count: proposals.filter((p) => p.status === 'Em Análise').length },
    { id: 'Enviada', label: 'Enviadas', count: proposals.filter((p) => p.status === 'Enviada').length },
    { id: 'Aprovada', label: 'Aprovadas', count: proposals.filter((p) => p.status === 'Aprovada').length },
    { id: 'Rascunho', label: 'Rascunhos', count: proposals.filter((p) => p.status === 'Rascunho').length },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Documentação Comercial & Validade
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Propostas Comerciais
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie minutas, escopo técnico, valores e prazos de validade jurídica das propostas.
          </p>
        </div>

        <Button onClick={handleNew} size="lg" className="gap-2 shadow-md hover:shadow-lg">
          <PlusCircle className="h-5 w-5" />
          Nova Proposta
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border/60 bg-gradient-to-br from-card to-card/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Total de Propostas</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {stats.total}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Documentos emitidos</p>
        </div>

        <div className="rounded-xl border border-border/60 bg-gradient-to-br from-card to-card/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Valor Total Ofertado</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {formatCurrency(stats.totalValue)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Volume de propostas no ar</p>
        </div>

        <div className="rounded-xl border border-border/60 bg-gradient-to-br from-card to-card/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Propostas Aprovadas</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {stats.approved}
            </span>
            <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
              {formatCurrency(stats.approvedValue)}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Contratos fechados</p>
        </div>

        <div className="rounded-xl border border-border/60 bg-gradient-to-br from-card to-card/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Em Negociação Ativa</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
            {stats.pending}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Enviadas ou em análise no cliente</p>
        </div>
      </div>

      {/* Quick Status Pills */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/50 pb-3">
        {statusTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
              statusFilter === tab.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <span>{tab.label}</span>
            <span
              className={cn(
                'rounded-full px-1.5 py-0.2 text-[10px] font-bold',
                statusFilter === tab.id
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'bg-background text-muted-foreground'
              )}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por código (PROP-001), cliente ou título..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 bg-background"
          />
        </div>

        {managers.length > 0 && (
          <Select value={managerFilter} onValueChange={setManagerFilter}>
            <SelectTrigger className="w-full sm:w-[220px] h-10 bg-background">
              <User className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os responsáveis</SelectItem>
              {managers.map((manager) => (
                <SelectItem key={manager} value={manager}>
                  {manager}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Proposals List */}
      {filteredProposals.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-12 w-12 text-muted-foreground" />}
          title={
            searchTerm || statusFilter !== 'all' || managerFilter !== 'all'
              ? 'Nenhuma proposta encontrada'
              : 'Nenhuma proposta cadastrada'
          }
          description={
            searchTerm || statusFilter !== 'all' || managerFilter !== 'all'
              ? 'Tente ajustar os filtros de busca para encontrar o que procura.'
              : 'Crie sua primeira proposta comercial e comece a gerenciar oportunidades.'
          }
          actions={
            searchTerm || statusFilter !== 'all' || managerFilter !== 'all'
              ? [
                  {
                    label: 'Limpar Filtros',
                    onClick: () => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setManagerFilter('all');
                    },
                  },
                ]
              : [
                  {
                    label: 'Nova Proposta',
                    primary: true,
                    icon: <PlusCircle className="h-4 w-4" />,
                    onClick: handleNew,
                  },
                ]
          }
        />
      ) : (
        <div className="grid gap-4">
          {filteredProposals.map((proposal) => {
            const statusConfig = STATUS_CONFIG[proposal.status as keyof typeof STATUS_CONFIG] || {
              icon: FileText,
              color: 'text-muted-foreground',
              bg: 'bg-muted',
              bar: 'bg-muted-foreground',
              dot: 'bg-muted-foreground',
              label: proposal.status,
            };
            const StatusIcon = statusConfig.icon;
            const daysRemaining = getDaysRemaining(proposal.expiryDate);

            return (
              <div
                key={proposal.id}
                className="group relative overflow-hidden rounded-xl border border-border/60 bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                {/* Accent bar */}
                <div className={cn('absolute left-0 top-0 bottom-0 w-1.5', statusConfig.bar)} />

                <div className="flex flex-col gap-4 pl-2 lg:flex-row lg:items-center lg:justify-between">
                  {/* Left Info */}
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-md">
                        {proposal.id}
                      </span>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
                          statusConfig.bg,
                          statusConfig.color
                        )}
                      >
                        <span className={cn('h-1.5 w-1.5 rounded-full', statusConfig.dot)} />
                        {statusConfig.label}
                      </span>
                      {daysRemaining !== null && (
                        <span
                          className={cn(
                            'text-[11px] font-medium px-2 py-0.5 rounded-md border',
                            daysRemaining < 0
                              ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                              : daysRemaining <= 7
                              ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                              : 'bg-muted/40 text-muted-foreground border-border/50'
                          )}
                        >
                          {daysRemaining < 0
                            ? 'Vencida'
                            : daysRemaining === 0
                            ? 'Vence hoje'
                            : `Vence em ${daysRemaining}d`}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                      {proposal.title}
                    </h3>

                    {proposal.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 max-w-2xl">
                        {proposal.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                      <div className="flex items-center gap-1.5">
                        <Building className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium text-foreground">{proposal.client}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{proposal.accountManager || 'Carlos Horst'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Emissão: {formatDate(proposal.date)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Value & Actions */}
                  <div className="flex flex-wrap items-center justify-between lg:justify-end gap-4 border-t lg:border-t-0 pt-3 lg:pt-0 border-border/50 shrink-0">
                    <div className="text-left lg:text-right">
                      <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Valor da Proposta</span>
                      <p className="text-xl font-bold tracking-tight text-foreground">
                        {formatCurrency(proposal.value)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewingProposal(proposal)}
                        className="gap-1.5 text-xs"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Ver
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(proposal)}
                        className="gap-1.5 text-xs text-primary hover:text-primary hover:bg-primary/10"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        Editar
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewingProposal(proposal)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Visualizar detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(proposal)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(proposal.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProposal ? 'Editar Proposta Comercial' : 'Nova Proposta Comercial'}
            </DialogTitle>
          </DialogHeader>
          <ProposalForm
            proposal={editingProposal || undefined}
            partners={partners}
            onSave={handleSave}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingProposal(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      {viewingProposal && (
        <Dialog open={!!viewingProposal} onOpenChange={() => setViewingProposal(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="font-mono text-sm bg-primary/10 text-primary px-2.5 py-1 rounded-md">
                  {viewingProposal.id}
                </span>
                <span>{viewingProposal.title}</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4 text-sm">
              <div className="grid grid-cols-2 gap-4 rounded-xl border border-border/60 bg-muted/20 p-4">
                <div>
                  <span className="text-xs text-muted-foreground">Cliente</span>
                  <p className="font-semibold text-foreground">{viewingProposal.client}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Valor Total</span>
                  <p className="text-lg font-bold text-foreground">{formatCurrency(viewingProposal.value)}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Responsável Técnico/Comercial</span>
                  <p className="font-medium text-foreground">{viewingProposal.accountManager}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Status</span>
                  <p className="font-medium text-foreground">{viewingProposal.status}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Data de Emissão</span>
                  <p className="font-medium text-foreground">{formatDate(viewingProposal.date)}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Validade da Proposta</span>
                  <p className="font-medium text-foreground">{formatDate(viewingProposal.expiryDate)}</p>
                </div>
              </div>

              {viewingProposal.description && (
                <div>
                  <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Escopo do Projeto
                  </h4>
                  <p className="text-muted-foreground leading-relaxed bg-card p-3 rounded-lg border border-border/50">
                    {viewingProposal.description}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setViewingProposal(null)}>
                  Fechar
                </Button>
                <Button
                  onClick={() => {
                    handleEdit(viewingProposal);
                    setViewingProposal(null);
                  }}
                  className="gap-1.5"
                >
                  <Edit className="h-4 w-4" />
                  Editar Proposta
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
