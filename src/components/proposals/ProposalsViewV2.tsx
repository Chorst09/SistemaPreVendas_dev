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
} from 'lucide-react';
import type { Proposal, Partner } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { StatCard } from '@/components/ui/enhanced-card';
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
  'Rascunho': { icon: FileText, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Rascunho' },
  'Enviada': { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Enviada' },
  'Em Análise': { icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Em Análise' },
  'Aprovada': { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100', label: 'Aprovada' },
  'Rejeitada': { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Rejeitada' },
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
    const totalValue = proposals.reduce((sum, p) => sum + p.value, 0);
    const approved = proposals.filter((p) => p.status === 'Aprovada').length;
    const approvedValue = proposals
      .filter((p) => p.status === 'Aprovada')
      .reduce((sum, p) => sum + p.value, 0);
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
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Propostas Comerciais"
        description="Gerencie todas as suas propostas em um só lugar"
        icon={<FileText className="h-6 w-6" />}
        actions={
          <Button onClick={handleNew} size="lg" className="gap-2">
            <PlusCircle className="h-5 w-5" />
            Nova Proposta
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total de Propostas"
          value={stats.total}
          icon={<FileText className="h-5 w-5" />}
        />
        <StatCard
          label="Valor Total"
          value={formatCurrency(stats.totalValue)}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <StatCard
          label="Propostas Aprovadas"
          value={stats.approved}
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <StatCard
          label="Em Análise"
          value={stats.pending}
          icon={<Clock className="h-5 w-5" />}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, cliente ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {Object.keys(STATUS_CONFIG).map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Manager Filter */}
            {managers.length > 0 && (
              <Select value={managerFilter} onValueChange={setManagerFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <User className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {managers.map((manager) => (
                    <SelectItem key={manager} value={manager}>
                      {manager}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Proposals List */}
      {filteredProposals.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-12 w-12" />}
          title={
            searchTerm || statusFilter !== 'all' || managerFilter !== 'all'
              ? 'Nenhuma proposta encontrada'
              : 'Nenhuma proposta cadastrada'
          }
          description={
            searchTerm || statusFilter !== 'all' || managerFilter !== 'all'
              ? 'Tente ajustar os filtros de busca para encontrar o que procura'
              : 'Crie sua primeira proposta comercial e comece a gerenciar oportunidades'
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
        <div className="space-y-3">
          {filteredProposals.map((proposal) => {
            const statusConfig = STATUS_CONFIG[proposal.status];
            const StatusIcon = statusConfig.icon;

            return (
              <Card
                key={proposal.id}
                className="group transition-all hover:shadow-md hover:border-primary/50"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    {/* Status Icon */}
                    <div
                      className={cn(
                        'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg',
                        statusConfig.bg
                      )}
                    >
                      <StatusIcon className={cn('h-6 w-6', statusConfig.color)} />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {proposal.id}
                            </Badge>
                            <Badge
                              className={cn(
                                'text-xs',
                                statusConfig.color,
                                statusConfig.bg
                              )}
                            >
                              {statusConfig.label}
                            </Badge>
                          </div>
                          <h3 className="text-lg font-semibold text-foreground">
                            {proposal.title}
                          </h3>
                        </div>

                        {/* Actions */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewingProposal(proposal)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(proposal)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            {proposal.proposalFile && (
                              <DropdownMenuItem>
                                <FileDown className="mr-2 h-4 w-4" />
                                Baixar PDF
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(proposal.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Details */}
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <User className="h-4 w-4" />
                          <span>{proposal.client}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-semibold text-foreground">
                            {formatCurrency(proposal.value)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <User className="h-4 w-4" />
                          <span>{proposal.accountManager}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          <span>Criada: {formatDate(proposal.date)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          <span>Vence: {formatDate(proposal.expiryDate)}</span>
                        </div>
                      </div>

                      {/* Description */}
                      {proposal.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {proposal.description}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProposal ? 'Editar Proposta' : 'Nova Proposta'}
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

      {/* View Dialog */}
      {viewingProposal && (
        <Dialog open={!!viewingProposal} onOpenChange={() => setViewingProposal(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{viewingProposal.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Cliente
                  </label>
                  <p className="text-base font-semibold">{viewingProposal.client}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Valor
                  </label>
                  <p className="text-base font-semibold">
                    {formatCurrency(viewingProposal.value)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Status
                  </label>
                  <p className="text-base font-semibold">{viewingProposal.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Responsável
                  </label>
                  <p className="text-base font-semibold">
                    {viewingProposal.accountManager}
                  </p>
                </div>
              </div>
              {viewingProposal.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Descrição
                  </label>
                  <p className="text-base">{viewingProposal.description}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
