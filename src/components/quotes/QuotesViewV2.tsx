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
import { MetricCard } from '@/components/ui/enhanced-card';
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
  'Pendente': { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Pendente' },
  'Enviado': { icon: Send, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Enviado' },
  'Aprovado': { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100', label: 'Aprovado' },
  'Rejeitado': { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Rejeitado' },
  'Aguardando Distribuidor': {
    icon: Clock,
    color: 'text-orange-600',
    bg: 'bg-orange-100',
    label: 'Aguardando Dist.',
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
    const totalValue = quotes.reduce((sum, q) => sum + q.total, 0);
    const approved = quotes.filter((q) => q.status === 'Aprovado');
    const approvedValue = approved.reduce((sum, q) => sum + q.total, 0);
    const approvalRate = total > 0 ? (approved.length / total) * 100 : 0;
    const pending = quotes.filter(
      (q) => q.status === 'Pendente' || q.status === 'Aguardando Distribuidor'
    ).length;

    return { total, totalValue, approvedValue, approvalRate, pending };
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
      updateQuote(quote);
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
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Orçamentos"
        description="Gerencie todas as suas cotações e orçamentos em um só lugar"
        icon={<FileText className="h-6 w-6" />}
        actions={
          <Button onClick={handleNew} size="lg" className="gap-2">
            <PlusCircle className="h-5 w-5" />
            Novo Orçamento
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total de Orçamentos"
          value={stats.total}
          icon={<FileText className="h-5 w-5" />}
          description="Carteira completa"
        />
        <MetricCard
          title="Valor Total"
          value={formatCurrency(stats.totalValue)}
          icon={<DollarSign className="h-5 w-5" />}
          description="Pipeline aberto"
        />
        <MetricCard
          title="Taxa de Conversão"
          value={`${stats.approvalRate.toFixed(1)}%`}
          icon={<TrendingUp className="h-5 w-5" />}
          description="Aprovações vs total"
          variant="success"
        />
        <MetricCard
          title="Pendentes"
          value={stats.pending}
          icon={<Clock className="h-5 w-5" />}
          description="Aguardando resposta"
          variant="warning"
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
                placeholder="Buscar por ID, cliente ou projeto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
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

      {/* Quotes List */}
      {filteredQuotes.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-12 w-12" />}
          title={
            searchTerm || statusFilter !== 'all' || managerFilter !== 'all'
              ? 'Nenhum orçamento encontrado'
              : 'Nenhum orçamento cadastrado'
          }
          description={
            searchTerm || statusFilter !== 'all' || managerFilter !== 'all'
              ? 'Tente ajustar os filtros de busca'
              : 'Crie seu primeiro orçamento e comece a gerenciar oportunidades'
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
        <div className="space-y-3">
          {filteredQuotes.map((quote) => {
            const statusConfig = STATUS_CONFIG[quote.status];
            const StatusIcon = statusConfig.icon;

            return (
              <Card
                key={quote.id}
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
                            <Badge variant="outline" className="text-xs font-mono">
                              {quote.id}
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
                            {quote.projectName}
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
                            <DropdownMenuItem onClick={() => handleEdit(quote)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            {onEditITQuote && (
                              <DropdownMenuItem onClick={() => onEditITQuote(quote.id)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Precificação
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(quote.id)}
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
                          <Building className="h-4 w-4" />
                          <span>{quote.client}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-semibold text-foreground">
                            {formatCurrency(quote.total)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <User className="h-4 w-4" />
                          <span>{quote.accountManager}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(quote.date)}</span>
                        </div>
                      </div>
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
              {editingQuote ? 'Editar Orçamento' : 'Novo Orçamento'}
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
