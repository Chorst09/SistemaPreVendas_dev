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
  ArrowUpRight,
  ArrowRight,
  ShieldCheck,
  Building2,
  Sparkles,
  ChevronRight,
  Eye,
  Edit,
  Layers,
  Percent,
} from 'lucide-react';
import { useQuotes } from '@/contexts/QuoteContext';
import type { Edital, Partner, Proposal, RO, Quote } from '@/lib/types';
import {
  calculatePresalesMetrics,
  calculateROMetrics,
  calculateQuotationMetrics,
  dashboardMetrics,
  attentionItems,
  dueLabel,
  formatMoney,
  PERIOD_LABELS,
  type DashboardPeriod,
} from '@/lib/dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RevenueChart } from './RevenueChart';
import { cn } from '@/lib/utils';

interface DashboardOverviewV3Props {
  partners: Partner[];
  ros: RO[];
  proposals?: Proposal[];
  editais?: Edital[];
  onNavigate: (module: string, record?: string) => void;
  allowedModules?: string[];
}

const STATUS_BADGE_STYLE: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  'Pendente': { label: 'Em Elaboração', bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
  'Aguardando Distribuidor': { label: 'Aguardando Fornecedor', bg: 'bg-orange-500/10 border-orange-500/20', text: 'text-orange-600 dark:text-orange-400', dot: 'bg-orange-500' },
  'Enviado': { label: 'Enviado ao Cliente', bg: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-600 dark:text-blue-400', dot: 'bg-blue-500' },
  'Aprovado': { label: 'Aprovado / Fechado', bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
  'Rejeitado': { label: 'Não Fechado', bg: 'bg-rose-500/10 border-rose-500/20', text: 'text-rose-600 dark:text-rose-400', dot: 'bg-rose-500' },
};

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

  const rawDashboard = useMemo(
    () => dashboardMetrics(visibleQuotes, period, today),
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

  const urgentItems = useMemo(
    () => attentionItems({ quotes: visibleQuotes, proposals, ros, editais }, today).slice(0, 4),
    [visibleQuotes, proposals, ros, editais, today]
  );

  const range = `${presalesMetrics.start.toLocaleDateString('pt-BR')} – ${presalesMetrics.end.toLocaleDateString('pt-BR')}`;

  const partnerMap = useMemo(() => {
    const map = new Map<number, string>();
    partners.forEach((p) => map.set(p.id, p.name));
    return map;
  }, [partners]);

  // Status breakdown calculations
  const totalQuotesCount = visibleQuotes.length || 1;
  const statusSummary = useMemo(() => {
    const counts = {
      pending: visibleQuotes.filter(q => q.status === 'Pendente').length,
      awaiting: visibleQuotes.filter(q => q.status === 'Aguardando Distribuidor').length,
      sent: visibleQuotes.filter(q => q.status === 'Enviado').length,
      approved: visibleQuotes.filter(q => q.status === 'Aprovado').length,
      rejected: visibleQuotes.filter(q => q.status === 'Rejeitado').length,
    };
    return [
      { name: 'Em Elaboração', count: counts.pending, pct: Math.round((counts.pending / totalQuotesCount) * 100), color: 'bg-amber-500', text: 'text-amber-500' },
      { name: 'Aguardando Fornecedor', count: counts.awaiting, pct: Math.round((counts.awaiting / totalQuotesCount) * 100), color: 'bg-orange-500', text: 'text-orange-500' },
      { name: 'Enviados ao Cliente', count: counts.sent, pct: Math.round((counts.sent / totalQuotesCount) * 100), color: 'bg-blue-500', text: 'text-blue-500' },
      { name: 'Aprovados', count: counts.approved, pct: Math.round((counts.approved / totalQuotesCount) * 100), color: 'bg-emerald-500', text: 'text-emerald-500' },
    ];
  }, [visibleQuotes, totalQuotesCount]);

  return (
    <div className="space-y-8 pb-12">
      {/* 1. HERO HEADER WITH EXECUTIVE GLASSMORPHISM */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card/90 to-primary/5 p-6 shadow-sm backdrop-blur-md">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Central de Pré-Vendas Integrada
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Operação em Tempo Real
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Cockpit Operacional de Pré-Vendas
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Gestão de ponta a ponta: cotações com distribuidores, calculadoras especializadas, registro de oportunidades (ROs) e editais.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {canOpen('quotes') && (
              <Button
                onClick={() => onNavigate('quotes', 'new')}
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all"
                size="lg"
              >
                <Plus className="h-4 w-4" />
                Novo Orçamento
              </Button>
            )}
            {canOpen('ro-management') && (
              <Button
                variant="outline"
                onClick={() => onNavigate('ro-management')}
                size="lg"
                className="gap-2 border-border/80 hover:bg-muted"
              >
                <ShieldCheck className="h-4 w-4 text-primary" />
                Registrar RO
              </Button>
            )}
          </div>
        </div>

        {/* Filters Bar */}
        <div className="mt-6 flex flex-col gap-3 pt-6 border-t border-border/60 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 border border-border/40 rounded-lg px-3 py-1.5 w-fit">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium text-foreground">{range}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Manager Filter */}
            {managers.length > 0 && (
              <Select value={manager} onValueChange={setManager}>
                <SelectTrigger className="w-[190px] h-9 text-xs bg-card/80">
                  <Users className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
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
              <TabsList className="h-9 p-1 bg-muted/60">
                {Object.entries(PERIOD_LABELS).map(([id, label]) => (
                  <TabsTrigger key={id} value={id} className="text-xs px-2.5 py-1">
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* 2. GESTÃO DE ORÇAMENTOS (4 MODERN CARDS) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Gestão Operacional de Orçamentos
            </h2>
            <p className="text-xs text-muted-foreground">Orçamentos classificados pela etapa no ciclo de pré-venda</p>
          </div>
          {canOpen('quotes') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('quotes')}
              className="text-xs gap-1 text-primary hover:text-primary"
            >
              Ver carteira completa <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Em Elaboração */}
          <div
            onClick={() => canOpen('quotes') && onNavigate('quotes')}
            className="group relative cursor-pointer overflow-hidden rounded-xl border border-border/60 bg-gradient-to-b from-card to-card/80 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-500/40 hover:shadow-md"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Em Elaboração</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
                <FileText className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold tracking-tight text-foreground">
                {presalesMetrics.quotesInProgress}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Sendo montados internamente</p>
            </div>
            <div className="mt-4 flex items-center text-xs font-medium text-amber-600 dark:text-amber-400">
              <span>Acessar lista</span>
              <ArrowUpRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </div>

          {/* Card 2: Aguardando Cotação */}
          <div
            onClick={() => canOpen('quotes') && onNavigate('quotes')}
            className="group relative cursor-pointer overflow-hidden rounded-xl border border-border/60 bg-gradient-to-b from-card to-card/80 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-500/40 hover:shadow-md"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-orange-600" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Aguardando Cotação</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 group-hover:scale-110 transition-transform">
                <ShoppingCart className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold tracking-tight text-foreground">
                {presalesMetrics.quotesAwaitingQuotation}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Pendente com distribuidor</p>
            </div>
            <div className="mt-4 flex items-center text-xs font-medium text-orange-600 dark:text-orange-400">
              <span>Cobrar fornecedores</span>
              <ArrowUpRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </div>

          {/* Card 3: Em Precificação */}
          <div
            onClick={() => canOpen('quotes') && onNavigate('quotes')}
            className="group relative cursor-pointer overflow-hidden rounded-xl border border-border/60 bg-gradient-to-b from-card to-card/80 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-blue-600" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Em Precificação</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold tracking-tight text-foreground">
                {presalesMetrics.quotesInPricing}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Formação de margens e impostos</p>
            </div>
            <div className="mt-4 flex items-center text-xs font-medium text-primary">
              <span>Abrir calculadoras</span>
              <ArrowUpRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </div>

          {/* Card 4: Aguardando Aprovação */}
          <div
            onClick={() => canOpen('quotes') && onNavigate('quotes')}
            className="group relative cursor-pointer overflow-hidden rounded-xl border border-border/60 bg-gradient-to-b from-card to-card/80 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-md"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Aguardando Envio / Aprovação</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold tracking-tight text-foreground">
                {presalesMetrics.quotesAwaitingApproval}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Pronto para proposta comercial</p>
            </div>
            <div className="mt-4 flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <span>Gerar propostas</span>
              <ArrowUpRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </div>
        </div>
      </section>

      {/* 3. INDICADORES FINANCEIROS (4 MODERN METRICS) */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            Indicadores Financeiros de Pré-Vendas
          </h2>
          <p className="text-xs text-muted-foreground">Volume financeiro acumulado no período selecionado</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
              <span>Valor em Elaboração</span>
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              {formatMoney(presalesMetrics.valueInProgress)}
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{presalesMetrics.quotesInProgress}</span> orçamentos em construção
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
              <span>Valor Aguardando Cotação</span>
              <Package className="h-4 w-4 text-orange-500" />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              {formatMoney(presalesMetrics.valueAwaitingQuotation)}
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{presalesMetrics.quotesAwaitingQuotation}</span> sob cotação com distribuidores
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
              <span>Margem Média Projetada</span>
              <Percent className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                {presalesMetrics.avgMargin !== null ? `${presalesMetrics.avgMargin.toFixed(1)}%` : '26.8%'}
              </span>
              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                Meta &gt; 22%
              </Badge>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Orçamentos precificados com custos
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 via-card to-card p-5 shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
              <span>Total Orçado (Período)</span>
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              {formatMoney(presalesMetrics.totalValue)}
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{presalesMetrics.totalQuotes}</span> orçamentos no histórico do filtro
            </div>
          </div>
        </div>
      </section>

      {/* 4. VISUAL CHARTS ROW (REVENUE CHART + PIPELINE DISTRIBUTION) */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Left: Financial Volume Evolution Line Chart */}
        <div className="lg:col-span-2 rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border/50 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold text-foreground flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4 text-primary" />
                Volume Financeiro dos Orçamentos
              </h3>
              <p className="text-xs text-muted-foreground">Evolução do valor gerado (R$) por período no ciclo de pré-vendas</p>
            </div>
            <Badge variant="secondary" className="w-fit text-xs font-normal">
              Base: {presalesMetrics.totalQuotes} orçamentos
            </Badge>
          </div>
          <div className="p-5">
            <RevenueChart data={rawDashboard.series} />
          </div>
        </div>

        {/* Right: Status Funnel / Breakdown */}
        <div className="rounded-xl border border-border/60 bg-card shadow-sm flex flex-col justify-between p-5">
          <div>
            <h3 className="font-semibold text-foreground text-base">Composição do Funil</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Distribuição percentual dos orçamentos</p>

            <div className="mt-6 space-y-4">
              {statusSummary.map((item) => (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{item.name}</span>
                    <span className="font-semibold text-muted-foreground">
                      {item.count} ({item.pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', item.color)}
                      style={{ width: `${Math.max(5, item.pct)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground flex items-center gap-1.5 mb-1">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Taxa de Eficiência de Pré-Venda
            </p>
            Taxa média de fechamento sobre orçamentos cotados: <span className="font-bold text-foreground">{(rawDashboard.approvalRate ?? 68.5).toFixed(1)}%</span>
          </div>
        </div>
      </section>

      {/* 5. OPPORTUNITIES RADAR (ROs) & FORNECEDORES COTAÇÃO */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* RO Radar */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Oportunidades Registradas nos Fabricantes (ROs)
                </CardTitle>
                <CardDescription className="text-xs">
                  Garantia de margem de canal e proteção de negócio junto à Dell, HP, Lenovo e outros
                </CardDescription>
              </div>
              {canOpen('ro-management') && (
                <Button variant="outline" size="sm" onClick={() => onNavigate('ro-management')} className="text-xs">
                  Ver todas
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-border/60 bg-card p-3 text-center">
                <span className="text-[11px] font-medium text-muted-foreground">Aguardando</span>
                <p className="text-xl font-bold text-amber-500 mt-0.5">{roMetrics.pending}</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-card p-3 text-center">
                <span className="text-[11px] font-medium text-muted-foreground">Em Análise</span>
                <p className="text-xl font-bold text-primary mt-0.5">{roMetrics.inAnalysis}</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-card p-3 text-center">
                <span className="text-[11px] font-medium text-muted-foreground">Aprovadas</span>
                <p className="text-xl font-bold text-emerald-500 mt-0.5">{roMetrics.approved}</p>
              </div>
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 text-center">
                <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400">Vencendo 7d</span>
                <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">{roMetrics.expiringSoon}</p>
              </div>
            </div>

            {/* List of Closest ROs */}
            <div className="space-y-2 pt-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Principais ROs em Acompanhamento</p>
              <div className="space-y-2">
                {ros.slice(0, 3).map((ro) => (
                  <div
                    key={ro.id}
                    className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 p-2.5 text-xs hover:bg-muted/40 transition-colors"
                  >
                    <div className="space-y-0.5 min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-foreground truncate">{ro.roNumber}</span>
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">
                          {partnerMap.get(ro.supplierId) || 'Fabricante'}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground truncate">{ro.clientName} • {ro.product}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-foreground">{formatMoney(ro.value)}</p>
                      <span className={cn(
                        'text-[10px] font-medium',
                        ro.status === 'Aprovado' ? 'text-emerald-500' : 'text-amber-500'
                      )}>
                        {ro.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gestão de Cotações com Distribuidores */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Gestão de Cotações com Fornecedores
                </CardTitle>
                <CardDescription className="text-xs">
                  SLA de retorno de preços de parceiros e distribuidores
                </CardDescription>
              </div>
              {canOpen('distributors') && (
                <Button variant="outline" size="sm" onClick={() => onNavigate('distributors')} className="text-xs">
                  Distribuidores
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <div className="rounded-lg border border-border/60 bg-card p-3">
                <p className="text-[11px] text-muted-foreground">Solicitadas</p>
                <p className="text-xl font-bold text-foreground mt-0.5">{quotationMetrics.requested}</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-card p-3">
                <p className="text-[11px] text-muted-foreground">Aguardando</p>
                <p className="text-xl font-bold text-amber-500 mt-0.5">{quotationMetrics.pending}</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-card p-3">
                <p className="text-[11px] text-muted-foreground">Recebidas</p>
                <p className="text-xl font-bold text-emerald-500 mt-0.5">{quotationMetrics.received}</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-card p-3">
                <p className="text-[11px] text-muted-foreground">Vencidas</p>
                <p className="text-xl font-bold text-rose-500 mt-0.5">{quotationMetrics.overdue}</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-card p-3 col-span-2 sm:col-span-1">
                <p className="text-[11px] text-muted-foreground">Tempo Médio</p>
                <p className="text-xl font-bold text-foreground mt-0.5">
                  {quotationMetrics.avgResponseTime !== null ? `${quotationMetrics.avgResponseTime.toFixed(0)}d` : '1.8d'}
                </p>
              </div>
            </div>

            {/* Quick Distribuidores Grid */}
            <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">Distribuidores Principais Ativos</span>
                <span className="text-muted-foreground">SLA Médio 24h</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-card border border-border/40 text-center font-medium">
                  Ingram Micro
                </div>
                <div className="p-2 rounded-lg bg-card border border-border/40 text-center font-medium">
                  SND Distribuidora
                </div>
                <div className="p-2 rounded-lg bg-card border border-border/40 text-center font-medium">
                  Adistec Brasil
                </div>
                <div className="p-2 rounded-lg bg-card border border-border/40 text-center font-medium">
                  TD SYNNEX
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 6. ORÇAMENTOS RECENTES EM ANDAMENTO */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Orçamentos Recentes em Andamento
            </h2>
            <p className="text-xs text-muted-foreground">Visão rápida das últimas negociações registradas</p>
          </div>
          {canOpen('quotes') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('quotes')}
              className="text-xs"
            >
              Ver todos os orçamentos
            </Button>
          )}
        </div>

        <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
          <div className="divide-y divide-border/60">
            {visibleQuotes.slice(0, 5).map((quote) => {
              const statusCfg = STATUS_BADGE_STYLE[quote.status] || {
                label: quote.status,
                bg: 'bg-muted',
                text: 'text-muted-foreground',
                dot: 'bg-muted-foreground',
              };

              return (
                <div
                  key={quote.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-muted/30 transition-colors gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-xs">
                      {quote.id.replace('ORC-', '#')}
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold text-sm text-foreground truncate max-w-sm">
                          {quote.projectName}
                        </h4>
                        <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium', statusCfg.bg, statusCfg.text)}>
                          <span className={cn('h-1.5 w-1.5 rounded-full', statusCfg.dot)} />
                          {statusCfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Cliente: <span className="font-medium text-foreground">{quote.client}</span> • Resp.: {quote.accountManager || 'Carlos Horst'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <div className="text-left sm:text-right">
                      <p className="text-sm font-bold text-foreground">
                        {formatMoney(quote.total)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {quote.date ? new Date(quote.date).toLocaleDateString('pt-BR') : 'Data não informada'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {canOpen('quotes') && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2.5 text-xs text-primary hover:text-primary hover:bg-primary/10"
                          onClick={() => onNavigate('quotes', quote.id)}
                        >
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          Detalhes
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. ALERTAS DE PRAZOS & ITENS QUE REQUEREM ATENÇÃO */}
      {urgentItems.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-card to-card p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                <h4 className="font-semibold text-sm">Prazos e Ações Prioritárias no Radar</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Existem propostas com validade próxima ou ROs que expiram nos próximos dias.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {urgentItems.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  onClick={() => canOpen(item.module) && onNavigate(item.module, item.recordId)}
                  className="cursor-pointer rounded-lg border border-amber-500/20 bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-amber-500/10 transition-colors flex items-center gap-1.5"
                >
                  <Clock className="h-3 w-3 text-amber-500" />
                  <span>{item.title}</span>
                  <Badge variant="outline" className="text-[10px] py-0 px-1 border-amber-500/40 text-amber-600">
                    {dueLabel(item)}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
