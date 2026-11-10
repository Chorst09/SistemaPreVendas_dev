'use client';

import React, { useState, useMemo } from 'react';
import {
  Edit,
  Trash2,
  PlusCircle,
  Search,
  Filter,
  MoreVertical,
  Calendar,
  DollarSign,
  User,
  Building,
  CheckCircle2,
  Clock,
  XCircle,
  Send,
  FileText,
  Eye,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  SlidersHorizontal,
} from 'lucide-react';
import { useQuotes } from '@/contexts/QuoteContext';
import type { Partner, Quote } from '@/lib/types';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import QuoteForm from './QuoteForm';

interface QuotesViewV2Props {
  partners: Partner[];
  onEditITQuote?: (quoteId: string) => void;
}

const STATUS_CONFIG = {
  'Pendente': {
    icon: Clock,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10 border-amber-500/25',
    bar: 'bg-amber-500',
    dot: 'bg-amber-500',
    label: 'Em Elaboração',
  },
  'Enviado': {
    icon: Send,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10 border-blue-500/25',
    bar: 'bg-blue-500',
    dot: 'bg-blue-500',
    label: 'Enviado ao Cliente',
  },
  'Aprovado': {
    icon: CheckCircle2,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10 border-emerald-500/25',
    bar: 'bg-emerald-500',
    dot: 'bg-emerald-500',
    label: 'Aprovado / Fechado',
  },
  'Rejeitado': {
    icon: XCircle,
    color: 'text-rose-500',
    bg: 'bg-rose-500/10 border-rose-500/25',
    bar: 'bg-rose-500',
    dot: 'bg-rose-500',
    label: 'Não Fechado',
  },
  'Aguardando Distribuidor': {
    icon: Clock,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10 border-orange-500/25',
    bar: 'bg-orange-500',
    dot: 'bg-orange-500',
    label: 'Aguardando Fornecedor',
  },
} as const;

export default function QuotesViewV2({ partners, onEditITQuote }: QuotesViewV2Props) {
  const { quotes, addQuote, updateQuote, deleteQuote } = useQuotes();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [managerFilter, setManagerFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);

  // Managers list
  const managers = useMemo(
    () => [...new Set(quotes.map((q) => q.accountManager).filter(Boolean))],
    [quotes]
  );

  // Filtered quotes
  const filteredQuotes = useMemo(() => {
    return quotes.filter((quote) => {
      const matchesSearch =
        searchTerm === '' ||
        quote.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.projectName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
      const matchesManager = managerFilter === 'all' || quote.accountManager === managerFilter;

      return matchesSearch && matchesStatus && matchesManager;
    });
  }, [quotes, searchTerm, statusFilter, managerFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = quotes.length;
    const totalValue = quotes.reduce((sum, q) => sum + (q.total || 0), 0);
    const approved = quotes.filter((q) => q.status === 'Aprovado');
    const approvedValue = approved.reduce((sum, q) => sum + (q.total || 0), 0);
    const approvalRate = total > 0 ? (approved.length / total) * 100 : 0;
    const pending = quotes.filter(
      (q) => q.status === 'Pendente' || q.status === 'Aguardando Distribuidor'
    ).length;
    const awaitingDistributor = quotes.filter((q) => q.status === 'Aguardando Distribuidor').length;

    return { total, totalValue, approvedValue, approvalRate, pending, awaitingDistributor };
  }, [quotes]);

  const handleNew = () => {
    setEditingQuote(null);
    setIsFormOpen(true);
  };

  const handleEdit = (quote: Quote) => {
    setEditingQuote(quote);
    setIsFormOpen(true);
  };

  const handleSave = (quote: Quote) => {
    if (editingQuote) {
      updateQuote(quote.id, quote);
    } else {
      addQuote(quote);
    }
    setIsFormOpen(false);
    setEditingQuote(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este orçamento?')) {
      deleteQuote(id);
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

  // Status pill options for one-click filtering
  const statusTabs = [
    { id: 'all', label: 'Todos', count: quotes.length },
    { id: 'Pendente', label: 'Em Elaboração', count: quotes.filter((q) => q.status === 'Pendente').length },
    { id: 'Aguardando Distribuidor', label: 'Aguardando Fornecedor', count: quotes.filter((q) => q.status === 'Aguardando Distribuidor').length },
    { id: 'Enviado', label: 'Enviados', count: quotes.filter((q) => q.status === 'Enviado').length },
    { id: 'Aprovado', label: 'Aprovados', count: quotes.filter((q) => q.status === 'Aprovado').length },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Operação de Cotações & Propostas
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Gestão de Orçamentos
          </h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe a precificação, margens, cotações com distribuidores e aprovações.
          </p>
        </div>

        <Button onClick={handleNew} size="lg" className="gap-2 shadow-md hover:shadow-lg">
          <PlusCircle className="h-5 w-5" />
          Novo Orçamento
        </Button>
      </div>

      {/* Modern Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border/60 bg-gradient-to-br from-card to-card/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Total de Orçamentos</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {stats.total}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Carteira ativa sob gestão
          </p>
        </div>

        <div className="rounded-xl border border-border/60 bg-gradient-to-br from-card to-card/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Volume Total Cotado</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {formatCurrency(stats.totalValue)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Pipeline acumulado em negociação
          </p>
        </div>

        <div className="rounded-xl border border-border/60 bg-gradient-to-br from-card to-card/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Taxa de Conversão</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {stats.approvalRate.toFixed(1)}%
            </span>
            <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
              {formatCurrency(stats.approvedValue)}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Fechamento sobre carteira total
          </p>
        </div>

        <div className="rounded-xl border border-border/60 bg-gradient-to-br from-card to-card/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Pendentes de Ação</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
            {stats.pending}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {stats.awaitingDistributor} aguardando fornecedores
          </p>
        </div>
      </div>

      {/* Quick Status Filter Pills */}
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

      {/* Search & Manager Filter Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por código (ORC-001), cliente ou projeto..."
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

      {/* Quotes Cards Grid / List */}
      {filteredQuotes.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-12 w-12 text-muted-foreground" />}
          title={
            searchTerm || statusFilter !== 'all' || managerFilter !== 'all'
              ? 'Nenhum orçamento encontrado'
              : 'Nenhum orçamento cadastrado'
          }
          description={
            searchTerm || statusFilter !== 'all' || managerFilter !== 'all'
              ? 'Tente ajustar os filtros de busca ou limpar a pesquisa.'
              : 'Crie seu primeiro orçamento e comece a gerenciar oportunidades.'
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
                    label: 'Novo Orçamento',
                    primary: true,
                    icon: <PlusCircle className="h-4 w-4" />,
                    onClick: handleNew,
                  },
                ]
          }
        />
      ) : (
        <div className="grid gap-4">
          {filteredQuotes.map((quote) => {
            const statusConfig = STATUS_CONFIG[quote.status as keyof typeof STATUS_CONFIG] || {
              icon: FileText,
              color: 'text-muted-foreground',
              bg: 'bg-muted',
              bar: 'bg-muted-foreground',
              dot: 'bg-muted-foreground',
              label: quote.status,
            };
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={quote.id}
                className="group relative overflow-hidden rounded-xl border border-border/60 bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                {/* Left accent bar */}
                <div className={cn('absolute left-0 top-0 bottom-0 w-1.5', statusConfig.bar)} />

                <div className="flex flex-col gap-4 pl-2 lg:flex-row lg:items-center lg:justify-between">
                  {/* Left Info */}
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-md">
                        {quote.id}
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
                      {quote.modality && (
                        <Badge variant="outline" className="text-xs">
                          {quote.modality}
                        </Badge>
                      )}
                    </div>

                    <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                      {quote.projectName}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Building className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium text-foreground">{quote.client}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{quote.accountManager || 'Carlos Horst'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{formatDate(quote.date)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Value & Actions */}
                  <div className="flex flex-wrap items-center justify-between lg:justify-end gap-4 border-t lg:border-t-0 pt-3 lg:pt-0 border-border/50 shrink-0">
                    <div className="text-left lg:text-right">
                      <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Valor Total</span>
                      <p className="text-xl font-bold tracking-tight text-foreground">
                        {formatCurrency(quote.total)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(quote)}
                        className="gap-1.5 text-xs"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        Editar
                      </Button>

                      {onEditITQuote && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditITQuote(quote.id)}
                          className="gap-1.5 text-xs text-primary hover:text-primary hover:bg-primary/10"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Precificação
                        </Button>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(quote)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar dados
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(quote.id)}
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
              {editingQuote ? 'Editar Orçamento' : 'Novo Orçamento de Pré-Venda'}
            </DialogTitle>
          </DialogHeader>
          <QuoteForm
            quote={editingQuote || undefined}
            partners={partners}
            onSave={handleSave}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingQuote(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
