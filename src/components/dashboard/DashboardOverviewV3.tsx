'use client';

import { useMemo, useState } from 'react';
import {
  FileText,
  Clock,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Package,
  Users,
  Calendar,
  Filter,
  Plus,
  BarChart3,
} from 'lucide-react';
import { useQuotes } from '@/contexts/QuoteContext';
import type { Edital, Partner, Proposal, RO } from '@/lib/types';
import {
  calculatePresalesMetrics,
  calculateROMetrics,
  calculateQuotationMetrics,
  formatMoney,
  PERIOD_LABELS,
  type DashboardPeriod,
} from '@/lib/dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from '@/components/ui/enhanced-card';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface DashboardOverviewV3Props {
  partners: Partner[];
  ros: RO[];
  proposals?: Proposal[];
  editais?: Edital[];
  onNavigate: (module: string, record?: string) => void;
  allowedModules?: string[];
}

/**
 * DashboardOverviewV3 - Dashboard focado em gestão de PRÉ-VENDAS
 * 
 * Foco: orçamentos, cotações, precificação, oportunidades registradas, propostas e prazos
 * NÃO é um CRM comercial - é operação de pré-vendas
 */
export default function DashboardOverviewV3({
  partners,
  ros,
  proposals = [],
  editais = [],
  onNavigate,
  allowedModules,
}: DashboardOverviewV3Props) {
  const { quotes } = useQuotes();
  const [period, setPeriod] = useState<DashboardPeriod>('30d');
  const [manager, setManager] = useState('all');
  const [today] = useState(() => new Date());

  const canOpen = (module: string) => !allowedModules || allowedModules.includes(module);
  const managers = [...new Set(quotes.map((q) => q.accountManager).filter(Boolean))] as string[];

  const visibleQuotes = useMemo(
    () => quotes.filter((q) => manager === 'all' || q.accountManager === manager),
    [quotes, manager]
  );

  const presalesMetrics = useMemo(
    () => calculatePresalesMetrics(visibleQuotes, period, today),
    [visibleQuotes, period, today]
  );

  const roMetrics = useMemo(
    () => calculateROMetrics(ros, today),
    [ros, today]
  );

  const quotationMetrics = useMemo(
    () => calculateQuotationMetrics(visibleQuotes, partners, today),
    [visibleQuotes, partners, today]
  );

  const range = `${presalesMetrics.start.toLocaleDateString('pt-BR')} – ${presalesMetrics.end.toLocaleDateString('pt-BR')}`;

  return (
    <div className="min-h-screen space-y-8 pb-8">
      {/* Header */}
      <PageHeader
        title="Central de Pré-Vendas"
        description="Gestão completa de orçamentos, cotações, precificação e oportunidades registradas"
        icon={<BarChart3 className="h-6 w-6" />}
        actions={
          canOpen('quotes') && (
            <Button onClick={() => onNavigate('quotes', 'new')} size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Novo orçamento
            </Button>
          )
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{range}</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Manager Filter */}
          {managers.length > 0 && (
            <Select value={manager} onValueChange={setManager}>
              <SelectTrigger className="w-[200px]">
                <Users className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os responsáveis</SelectItem>
                {managers.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Period Tabs */}
          <Tabs value={period} onValueChange={(v) => setPeriod(v as DashboardPeriod)}>
            <TabsList>
              {Object.entries(PERIOD_LABELS).map(([id, label]) => (
                <TabsTrigger key={id} value={id}>
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* SEÇÃO 1: INDICADORES DE ORÇAMENTOS */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Gestão de Orçamentos</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Em elaboração"
            value={presalesMetrics.quotesInProgress}
            icon={<FileText className="h-5 w-5" />}
            description="Orçamentos sendo criados"
            variant="primary"
            onClick={() => canOpen('quotes') && onNavigate('quotes')}
          />

          <MetricCard
            title="Aguardando cotação"
            value={presalesMetrics.quotesAwaitingQuotation}
            icon={<ShoppingCart className="h-5 w-5" />}
            description="Pendente de fornecedor"
            variant={presalesMetrics.quotesAwaitingQuotation > 5 ? 'warning' : 'default'}
            onClick={() => canOpen('quotes') && onNavigate('quotes')}
          />

          <MetricCard
            title="Em precificação"
            value={presalesMetrics.quotesInPricing}
            icon={<DollarSign className="h-5 w-5" />}
            description="Formação de preço"
            onClick={() => canOpen('quotes') && onNavigate('quotes')}
          />

          <MetricCard
            title="Aguardando aprovação"
            value={presalesMetrics.quotesAwaitingApproval}
            icon={<Clock className="h-5 w-5" />}
            description="Pronto para envio"
            onClick={() => canOpen('quotes') && onNavigate('quotes')}
          />
        </div>
      </div>

      {/* SEÇÃO 2: INDICADORES FINANCEIROS */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Indicadores Financeiros</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Valor em elaboração"
            value={formatMoney(presalesMetrics.valueInProgress)}
            icon={<TrendingUp className="h-5 w-5" />}
            description={`${presalesMetrics.quotesInProgress} orçamentos`}
            variant="primary"
          />

          <MetricCard
            title="Valor aguardando cotação"
            value={formatMoney(presalesMetrics.valueAwaitingQuotation)}
            icon={<Package className="h-5 w-5" />}
            description="Pendente de fornecedores"
          />

          <MetricCard
            title="Margem média projetada"
            value={presalesMetrics.avgMargin !== null ? `${presalesMetrics.avgMargin.toFixed(1)}%` : '—'}
            icon={<BarChart3 className="h-5 w-5" />}
            description="Orçamentos precificados"
            variant={presalesMetrics.avgMargin !== null && presalesMetrics.avgMargin < 20 ? 'warning' : 'success'}
          />

          <MetricCard
            title="Total orçado (período)"
            value={formatMoney(presalesMetrics.totalValue)}
            icon={<DollarSign className="h-5 w-5" />}
            description={`${presalesMetrics.totalQuotes} orçamentos`}
          />
        </div>
      </div>

      {/* SEÇÃO 3: OPORTUNIDADES REGISTRADAS */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Oportunidades Registradas nos Fornecedores</CardTitle>
              <CardDescription>Gestão de ROs e registros junto a fabricantes e distribuidores</CardDescription>
            </div>
            {canOpen('ro-management') && (
              <Button variant="outline" size="sm" onClick={() => onNavigate('ro-management')}>
                Ver todos
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-yellow/10">
                <Clock className="h-5 w-5 text-accent-yellow" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{roMetrics.pending}</p>
                <p className="text-xs text-muted-foreground">Aguardando registro</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{roMetrics.inAnalysis}</p>
                <p className="text-xs text-muted-foreground">Em análise</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-green/10">
                <CheckCircle2 className="h-5 w-5 text-accent-green" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{roMetrics.approved}</p>
                <p className="text-xs text-muted-foreground">Aprovados</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{roMetrics.expiringSoon}</p>
                <p className="text-xs text-muted-foreground">Vencendo em 7 dias</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEÇÃO 4: GESTÃO DE COTAÇÕES */}
      <Card>
        <CardHeader>
          <CardTitle>Gestão de Cotações com Fornecedores</CardTitle>
          <CardDescription>Acompanhamento de solicitações e tempo de resposta</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground">Solicitadas</p>
              <p className="text-2xl font-bold text-foreground">{quotationMetrics.requested}</p>
            </div>

            <div className="rounded-lg border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground">Aguardando resposta</p>
              <p className="text-2xl font-bold text-accent-yellow">{quotationMetrics.pending}</p>
            </div>

            <div className="rounded-lg border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground">Recebidas</p>
              <p className="text-2xl font-bold text-accent-green">{quotationMetrics.received}</p>
            </div>

            <div className="rounded-lg border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground">Vencidas</p>
              <p className="text-2xl font-bold text-destructive">{quotationMetrics.overdue}</p>
            </div>

            <div className="rounded-lg border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground">Tempo médio</p>
              <p className="text-2xl font-bold text-foreground">
                {quotationMetrics.avgResponseTime !== null 
                  ? `${quotationMetrics.avgResponseTime.toFixed(0)}d`
                  : '—'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      {canOpen('quotes') && (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-gradient-to-br from-primary/5 to-accent/5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Novo orçamento ou cotação?</h3>
            <p className="text-sm text-muted-foreground">Inicie um processo de pré-venda ou registre uma oportunidade</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => onNavigate('quotes', 'new')} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo orçamento
            </Button>
            {canOpen('ro-management') && (
              <Button variant="outline" onClick={() => onNavigate('ro-management')} className="gap-2">
                Registrar RO
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
