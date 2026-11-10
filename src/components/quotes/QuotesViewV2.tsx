'use client';

import React, { useState, useMemo } from 'react';
import {
  Edit,
  Trash2,
  PlusCircle,
  Search,
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
  ArrowRight,
  Columns3,
  Grid,
  List,
  Percent,
  BarChart3,
  MoreVertical,
} from 'lucide-react';
import { useQuotes } from '@/contexts/QuoteContext';
import type { Partner, Quote } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  'Aguardando Distribuidor': {
    icon: Clock,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10 border-orange-500/25',
    bar: 'bg-orange-500',
    dot: 'bg-orange-500',
    label: 'Aguardando Fornecedor',
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
} as const;

const KANBAN_STAGES = [
  { id: 'Pendente', title: 'Em Elaboração', color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/5' },
  { id: 'Aguardando Distribuidor', title: 'Aguardando Cotação', color: 'text-orange-400', border: 'border-orange-500/30', bg: 'bg-orange-500/5' },
  { id: 'Enviado', title: 'Enviados ao Cliente', color: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-500/5' },
  { id: 'Aprovado', title: 'Aprovados', color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/5' },
  { id: 'Rejeitado', title: 'Não Fechados', color: 'text-rose-400', border: 'border-rose-500/30', bg: 'bg-rose-500/5' },
];

export default function QuotesViewV2({ partners, onEditITQuote }: QuotesViewV2Props) {
  const { quotes, addQuote, updateQuote, deleteQuote } = useQuotes();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [managerFilter, setManagerFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'cards' | 'list'>('kanban');
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
    if (confirm('Tem certeza que deseja excluir esta oportunidade?')) {
      deleteQuote(id);
    }
  };

  const handleAdvance = (quote: Quote) => {
    const nextStatusMap: Record<string, string> = {
      'Pendente': 'Aguardando Distribuidor',
      'Aguardando Distribuidor': 'Enviado',
      'Enviado': 'Aprovado',
      'Aprovado': 'Aprovado',
      'Rejeitado': 'Pendente',
    };
    const next = nextStatusMap[quote.status] || 'Aguardando Distribuidor';
    updateQuote(quote.id, { status: next as any });
  };

  const handleApprove = (quote: Quote) => {
    updateQuote(quote.id, { status: 'Aprovado' });
  };

  const handleReject = (quote: Quote) => {
    updateQuote(quote.id, { status: 'Rejeitado' });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '29/11/2026';
    try {
      const parts = dateString.split('T')[0].split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return '29/11/2026';
    }
  };

  const getOpportunityCode = (id: string) => {
    if (id.startsWith('B2B-')) return id;
    if (id.startsWith('ORC-')) {
      const num = id.replace('ORC-', '').padStart(5, '0');
      return `B2B-2026-${num}`;
    }
    return `B2B-2026-${id.padStart(5, '0')}`;
  };

  const getChance = (status: string) => {
    switch (status) {
      case 'Aprovado': return '100% de chance';
      case 'Enviado': return '65% de chance';
      case 'Aguardando Distribuidor': return '30% de chance';
      case 'Pendente': return '25% de chance';
      default: return '15% de chance';
    }
  };

  // Render the exact reference card from user screenshot
  const renderOpportunityCard = (quote: Quote) => {
    const code = getOpportunityCode(quote.id);
    const chance = getChance(quote.status);

    return (
      <div
        key={quote.id}
        className="group relative flex flex-col justify-between rounded-2xl border border-cyan-500/25 bg-[#0b1723]/95 p-4 sm:p-5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(56,189,248,0.2)] hover:border-cyan-400/50 hover:shadow-[0_12px_32px_-6px_rgba(6,182,212,0.28)] transition-all duration-200"
      >
        <div>
          {/* Header with 6-dot drag indicator & Client Name */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <span className="text-[11px] font-mono tracking-tighter opacity-60 select-none">:::</span>
                <h4
                  onClick={() => handleEdit(quote)}
                  className="font-bold text-sm sm:text-base text-white hover:text-cyan-300 transition-colors cursor-pointer truncate"
                >
                  {quote.client}
                </h4>
              </div>

              {/* Amber Tracking ID */}
              <span className="block font-mono text-xs font-bold text-amber-500">
                {code}
              </span>

              {/* Project & Opportunity Info */}
              <p className="mt-1 text-xs text-slate-300 truncate">
                Projeto: {quote.projectName}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                Oportunidade: {quote.client} - {quote.modality || 'Solução TI'}
              </p>
            </div>
          </div>

          {/* Big Emerald Currency Value */}
          <div className="mt-3.5">
            <span className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight drop-shadow-[0_0_12px_rgba(16,185,129,0.35)]">
              {formatCurrency(quote.total)}
            </span>
          </div>

          {/* Detailed Item Rows with Icons */}
          <div className="mt-4 space-y-2 text-xs text-slate-300 border-t border-cyan-500/15 pt-3.5">
            <div className="flex items-center gap-2 text-slate-400">
              <BarChart3 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              <span className="truncate">{quote.modality === 'Locação' ? 'Renovação' : quote.modality === 'Serviços' ? 'Cliente da Base' : 'Cliente Novo'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <DollarSign className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              <span className="truncate">{quote.contractDurationMonths ? `Projeto mensal - ${quote.contractDurationMonths} meses` : 'Projeto pontual'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <User className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              <span className="truncate">{quote.accountManager || 'Carlos Horst'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Percent className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              <span>{chance}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Calendar className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              <span>Prevista: {formatDate(quote.date)}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Clock className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              <span>Entrada: {formatDate(quote.date)}</span>
            </div>
          </div>
        </div>

        {/* Action Row at Bottom: Blue Avançar Pill + Circle Check + Circle X + Trash */}
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-cyan-500/15 pt-3">
          <Button
            size="sm"
            onClick={() => handleAdvance(quote)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs h-7 px-3.5 rounded-full shadow-[0_2px_8px_rgba(37,99,235,0.4)] flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
          >
            <span>Avançar</span>
            <ArrowRight className="h-3 w-3" />
          </Button>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              title="Aprovar Oportunidade"
              onClick={() => handleApprove(quote)}
              className="h-7 w-7 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center transition-all hover:scale-110 shadow-sm"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title="Rejeitar / Não Fechado"
              onClick={() => handleReject(quote)}
              className="h-7 w-7 rounded-full bg-rose-500 hover:bg-rose-400 text-white flex items-center justify-center transition-all hover:scale-110 shadow-sm"
            >
              <XCircle className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title="Excluir"
              onClick={() => handleDelete(quote.id)}
              className="h-7 w-7 rounded-full bg-[#182635] hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 flex items-center justify-center border border-white/5 transition-all hover:scale-110"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">
            <Sparkles className="h-3.5 w-3.5" />
            Operação de Cotações & Oportunidades B2B
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Gestão de Orçamentos
          </h1>
          <p className="text-sm text-muted-foreground">
            Pipeline comercial, precificação protegida, cotações com distribuidores e aprovações.
          </p>
        </div>

        <Button
          onClick={handleNew}
          size="lg"
          className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-full shadow-[0_4px_16px_rgba(37,99,235,0.45)] transition-all hover:scale-105"
        >
          <PlusCircle className="h-5 w-5" />
          Novo Orçamento
        </Button>
      </div>

      {/* Modern Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-cyan-500/20 bg-card/90 p-5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(56,189,248,0.15)]">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Total de Oportunidades</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">
            {stats.total}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Carteira ativa sob gestão
          </p>
        </div>

        <div className="rounded-2xl border border-cyan-500/20 bg-card/90 p-5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(56,189,248,0.15)]">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Volume Total Cotado</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold tracking-tight text-foreground">
            {formatCurrency(stats.totalValue)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Pipeline acumulado em negociação
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-500/25 bg-card/90 p-5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(16,185,129,0.2)]">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Taxa de Conversão</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.35)]">
              {stats.approvalRate.toFixed(1)}%
            </span>
            <Badge variant="outline" className="text-[10px] bg-emerald-500/15 text-emerald-300 border-emerald-400/40">
              {formatCurrency(stats.approvedValue)}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Fechamento sobre carteira total
          </p>
        </div>

        <div className="rounded-2xl border border-amber-500/25 bg-card/90 p-5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(251,191,36,0.2)]">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Pendentes de Ação</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-3xl font-extrabold tracking-tight text-amber-400">
            {stats.pending}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {stats.awaitingDistributor} aguardando fornecedores
          </p>
        </div>
      </div>

      {/* Filter & View Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-cyan-500/25 bg-card/90 p-4 shadow-sm">
        <div className="flex flex-1 flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por código (B2B-2026-..., ORC-...), cliente ou projeto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 bg-background/80 border-cyan-500/20 rounded-xl"
            />
          </div>

          {managers.length > 0 && (
            <Select value={managerFilter} onValueChange={setManagerFilter}>
              <SelectTrigger className="w-full sm:w-[200px] h-10 bg-background/80 border-cyan-500/20 rounded-xl text-xs">
                <User className="mr-2 h-4 w-4 text-cyan-400" />
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

        {/* View Mode Switcher Pills */}
        <div className="flex items-center rounded-xl bg-black/40 border border-cyan-500/20 p-1 self-end sm:self-auto shadow-inner">
          <button
            type="button"
            onClick={() => setViewMode('kanban')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
              viewMode === 'kanban'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Columns3 className="h-3.5 w-3.5" />
            <span>Kanban</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
              viewMode === 'cards'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Grid className="h-3.5 w-3.5" />
            <span>Cards</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
              viewMode === 'list'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <List className="h-3.5 w-3.5" />
            <span>Lista</span>
          </button>
        </div>
      </div>

      {/* Main View Area */}
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
      ) : viewMode === 'kanban' ? (
        /* 1. KANBAN BOARD VIEW (MATCHING USER SCREENSHOT) */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-4 items-start">
          {KANBAN_STAGES.map((stage) => {
            const stageQuotes = filteredQuotes.filter((q) => q.status === stage.id);
            const stageTotal = stageQuotes.reduce((sum, q) => sum + (q.total || 0), 0);

            return (
              <div
                key={stage.id}
                className="flex flex-col rounded-2xl border border-cyan-500/20 bg-card/60 p-3 shadow-inner min-h-[500px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 px-1 border-b border-cyan-500/15 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={cn('h-2.5 w-2.5 rounded-full', stage.color.replace('text-', 'bg-'))} />
                    <h3 className="font-bold text-xs uppercase tracking-wider text-foreground">
                      {stage.title}
                    </h3>
                  </div>
                  <span className="rounded-full bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-extrabold text-cyan-300">
                    {stageQuotes.length}
                  </span>
                </div>

                {/* Total in Stage */}
                {stageQuotes.length > 0 && (
                  <div className="mb-3 px-1 text-[11px] text-muted-foreground flex items-center justify-between">
                    <span>Subtotal:</span>
                    <span className="font-bold text-emerald-400">{formatCurrency(stageTotal)}</span>
                  </div>
                )}

                {/* Cards Container */}
                <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-1 custom-scrollbar">
                  {stageQuotes.map((quote) => renderOpportunityCard(quote))}
                  {stageQuotes.length === 0 && (
                    <div className="h-32 flex flex-col items-center justify-center rounded-xl border border-dashed border-cyan-500/15 text-muted-foreground text-xs p-4 text-center">
                      <span>Nenhuma oportunidade nesta etapa</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === 'cards' ? (
        /* 2. CARDS GRID VIEW */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredQuotes.map((quote) => renderOpportunityCard(quote))}
        </div>
      ) : (
        /* 3. LIST TABLE VIEW */
        <div className="grid gap-3">
          {filteredQuotes.map((quote) => {
            const statusConfig = STATUS_CONFIG[quote.status as keyof typeof STATUS_CONFIG] || {
              icon: FileText,
              color: 'text-muted-foreground',
              bg: 'bg-muted',
              bar: 'bg-muted-foreground',
              dot: 'bg-muted-foreground',
              label: quote.status,
            };

            return (
              <div
                key={quote.id}
                className="group relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-card/90 p-4 shadow-sm transition-all hover:border-cyan-400/40 hover:shadow-md"
              >
                <div className={cn('absolute left-0 top-0 bottom-0 w-1.5', statusConfig.bar)} />

                <div className="flex flex-col gap-4 pl-2 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/25">
                        {getOpportunityCode(quote.id)}
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
                    </div>

                    <h3 className="text-base font-bold text-foreground group-hover:text-cyan-300 transition-colors">
                      {quote.projectName}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Building className="h-3.5 w-3.5 text-cyan-400" />
                        <span className="font-semibold text-foreground">{quote.client}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-cyan-400" />
                        <span>{quote.accountManager || 'Carlos Horst'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-cyan-400" />
                        <span>{formatDate(quote.date)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between lg:justify-end gap-4 border-t lg:border-t-0 pt-3 lg:pt-0 border-border/50 shrink-0">
                    <div className="text-left lg:text-right">
                      <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Valor Total</span>
                      <p className="text-xl font-black tracking-tight text-emerald-400">
                        {formatCurrency(quote.total)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAdvance(quote)}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs h-8 px-3 rounded-full shadow-sm flex items-center gap-1"
                      >
                        <span>Avançar</span>
                        <ArrowRight className="h-3 w-3" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(quote)}
                        className="gap-1.5 text-xs border-cyan-500/25 hover:bg-cyan-500/10"
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
                          <DropdownMenuItem onClick={() => handleApprove(quote)}>
                            <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-400" />
                            Aprovar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleReject(quote)}>
                            <XCircle className="mr-2 h-4 w-4 text-rose-400" />
                            Não Fechado
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
