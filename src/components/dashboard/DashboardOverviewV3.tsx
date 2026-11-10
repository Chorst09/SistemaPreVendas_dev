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
  Zap,
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
  'Pendente': { label: 'Em Elaboração', bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-400', dot: 'bg-amber-400' },
  'Aguardando Distribuidor': { label: 'Aguardando Fornecedor', bg: 'bg-orange-500/10 border-orange-500/30', text: 'text-orange-400', dot: 'bg-orange-400' },
  'Enviado': { label: 'Enviado ao Cliente', bg: 'bg-blue-500/10 border-blue-500/30', text: 'text-blue-400', dot: 'bg-blue-400' },
  'Aprovado': { label: 'Aprovado / Fechado', bg: 'bg-lime-500/15 border-lime-500/40', text: 'text-lime-400', dot: 'bg-lime-400' },
  'Rejeitado': { label: 'Não Fechado', bg: 'bg-rose-500/10 border-rose-500/30', text: 'text-rose-400', dot: 'bg-rose-400' },
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
      { name: 'Em Elaboração', count: counts.pending, pct: Math.round((counts.pending / totalQuotesCount) * 100), color: 'from-amber-500 to-yellow-600', text: 'text-amber-400' },
      { name: 'Aguardando Fornecedor', count: counts.awaiting, pct: Math.round((counts.awaiting / totalQuotesCount) * 100), color: 'from-orange-500 to-amber-600', text: 'text-orange-400' },
      { name: 'Enviados ao Cliente', count: counts.sent, pct: Math.round((counts.sent / totalQuotesCount) * 100), color: 'from-blue-500 to-cyan-600', text: 'text-blue-400' },
      { name: 'Aprovados', count: counts.approved, pct: Math.round((counts.approved / totalQuotesCount) * 100), color: 'from-lime-500 to-emerald-600', text: 'text-lime-400' },
    ];
  }, [visibleQuotes, totalQuotesCount]);

  return (
    <div className="space-y-8 pb-14">
      {/* 1. HERO COCKPIT 3D WITH VERDE OLIVA GRADIENT */}
      <div className="relative overflow-hidden rounded-3xl border border-lime-500/30 bg-gradient-to-br from-[#1b2f19]/90 via-[#122214]/95 to-[#0b130c]/98 p-6 sm:p-8 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.6),inset_0_1px_2px_rgba(190,242,100,0.35)] backdrop-blur-2xl">
        {/* 3D Ambient Light Orbs */}
        <div className="absolute right-0 top-0 -mr-20 -mt-20 h-72 w-72 rounded-full bg-lime-500/15 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-24 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-lime-400/40 bg-lime-500/15 px-3.5 py-1 text-xs font-semibold text-lime-300 shadow-[0_0_15px_rgba(163,230,53,0.3)]">
                <Sparkles className="h-3.5 w-3.5 text-lime-400" />
                Cockpit 3D de Pré-Vendas
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-lime-400 animate-pulse shadow-[0_0_8px_#a3e635]" />
                Operação em Tempo Real • SLA 98.4%
              </span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl bg-gradient-to-r from-white via-lime-100 to-lime-300 bg-clip-text text-transparent">
              Central Integrada de Pré-Vendas
            </h1>
            <p className="text-sm text-muted-foreground/90 max-w-2xl leading-relaxed">
              Gestão de cotações com distribuidores homologados, calculadoras especializadas com margem protegida, registro de oportunidades (ROs) e inteligência de editais.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {canOpen('quotes') && (
              <Button
                onClick={() => onNavigate('quotes', 'new')}
                className="gap-2 bg-gradient-to-r from-lime-600 via-lime-700 to-emerald-800 hover:from-lime-500 hover:to-emerald-700 text-white font-semibold shadow-[0_4px_20px_rgba(101,163,13,0.5),inset_0_1px_0_rgba(255,255,255,0.35)] border border-lime-400/40 transition-all hover:scale-105 active:scale-95"
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
                className="gap-2 border-lime-500/30 bg-card/60 hover:bg-lime-500/10 hover:border-lime-500/60 text-foreground transition-all"
              >
                <ShieldCheck className="h-4 w-4 text-lime-400" />
                Registrar RO
              </Button>
            )}
          </div>
        </div>

        {/* 3D Glass Filter Bar */}
        <div className="mt-6 flex flex-col gap-3 pt-6 border-t border-lime-500/20 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-black/40 border border-lime-500/25 rounded-xl px-3.5 py-2 w-fit shadow-inner">
            <Calendar className="h-3.5 w-3.5 text-lime-400" />
            <span className="font-semibold text-foreground">{range}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Manager Filter */}
            {managers.length > 0 && (
              <Select value={manager} onValueChange={setManager}>
                <SelectTrigger className="w-[190px] h-9 text-xs bg-card/80 border-lime-500/25">
                  <Users className="mr-2 h-3.5 w-3.5 text-lime-400" />
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
              <TabsList className="h-9 p-1 bg-black/40 border border-lime-500/20">
                {Object.entries(PERIOD_LABELS).map(([id, label]) => (
                  <TabsTrigger
                    key={id}
                    value={id}
                    className="text-xs px-3 py-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-lime-600 data-[state=active]:to-emerald-700 data-[state=active]:text-white data-[state=active]:shadow-sm"
                  >
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* 2. GESTÃO DE ORÇAMENTOS (4 3D METRIC CARDS) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Layers className="h-4 w-4 text-lime-400" />
              Gestão Operacional de Orçamentos
            </h2>
            <p className="text-xs text-muted-foreground">Ciclo de vida dos orçamentos da elaboração ao fechamento</p>
          </div>
          {canOpen('quotes') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('quotes')}
              className="text-xs gap-1 text-lime-400 hover:text-lime-300 hover:bg-lime-500/10"
            >
              Ver carteira completa <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Em Elaboração */}
          <div
            onClick={() => canOpen('quotes') && onNavigate('quotes')}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-b from-card/90 via-card/70 to-card/50 p-5 shadow-[0_12px_28px_-8px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(251,191,36,0.25)] hover:shadow-[0_20px_35px_-10px_rgba(245,158,11,0.35),inset_0_1px_2px_rgba(251,191,36,0.45)] hover:-translate-y-1.5 transition-all duration-300"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Em Elaboração</span>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/25 to-amber-600/10 border border-amber-500/30 text-amber-400 group-hover:scale-110 shadow-inner transition-transform">
                <FileText className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold tracking-tight text-foreground drop-shadow-sm">
                {presalesMetrics.quotesInProgress}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Sendo montados internamente</p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-amber-400">
              <span>Acessar lista</span>
              <ArrowUpRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </div>

          {/* Card 2: Aguardando Cotação */}
          <div
            onClick={() => canOpen('quotes') && onNavigate('quotes')}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-b from-card/90 via-card/70 to-card/50 p-5 shadow-[0_12px_28px_-8px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(249,115,22,0.25)] hover:shadow-[0_20px_35px_-10px_rgba(249,115,22,0.35),inset_0_1px_2px_rgba(249,115,22,0.45)] hover:-translate-y-1.5 transition-all duration-300"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-orange-500 to-amber-600" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Aguardando Cotação</span>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/25 to-orange-600/10 border border-orange-500/30 text-orange-400 group-hover:scale-110 shadow-inner transition-transform">
                <ShoppingCart className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold tracking-tight text-foreground drop-shadow-sm">
                {presalesMetrics.quotesAwaitingQuotation}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Pendente com distribuidor</p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-orange-400">
              <span>Cobrar fornecedores</span>
              <ArrowUpRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </div>

          {/* Card 3: Em Precificação */}
          <div
            onClick={() => canOpen('quotes') && onNavigate('quotes')}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-lime-500/35 bg-gradient-to-b from-card/90 via-card/70 to-card/50 p-5 shadow-[0_12px_28px_-8px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(190,242,100,0.25)] hover:shadow-[0_20px_35px_-10px_rgba(101,163,13,0.4),inset_0_1px_2px_rgba(190,242,100,0.5)] hover:-translate-y-1.5 transition-all duration-300"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-lime-400 via-lime-600 to-emerald-700" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Em Precificação</span>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-lime-500/25 to-emerald-600/10 border border-lime-500/40 text-lime-400 group-hover:scale-110 shadow-inner transition-transform">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold tracking-tight text-foreground drop-shadow-sm">
                {presalesMetrics.quotesInPricing}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Formação de margens e impostos</p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-lime-400">
              <span>Abrir calculadoras</span>
              <ArrowUpRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </div>

          {/* Card 4: Aguardando Aprovação */}
          <div
            onClick={() => canOpen('quotes') && onNavigate('quotes')}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-b from-card/90 via-card/70 to-card/50 p-5 shadow-[0_12px_28px_-8px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(56,189,248,0.25)] hover:shadow-[0_20px_35px_-10px_rgba(14,165,233,0.35),inset_0_1px_2px_rgba(56,189,248,0.45)] hover:-translate-y-1.5 transition-all duration-300"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-cyan-500 to-emerald-600" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Aguardando Envio</span>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/25 to-cyan-600/10 border border-blue-500/30 text-blue-400 group-hover:scale-110 shadow-inner transition-transform">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold tracking-tight text-foreground drop-shadow-sm">
                {presalesMetrics.quotesAwaitingApproval}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Pronto para proposta comercial</p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-blue-400">
              <span>Gerar propostas</span>
              <ArrowUpRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </div>
        </div>
      </section>

      {/* 3. INDICADORES FINANCEIROS 3D (4 CARDS) */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-lime-400" />
            Indicadores Financeiros de Pré-Vendas
          </h2>
          <p className="text-xs text-muted-foreground">Volume financeiro acumulado com base no filtro selecionado</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-lime-500/20 bg-gradient-to-b from-card/90 to-card/60 p-5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.1)]">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
              <span>Valor em Elaboração</span>
              <div className="h-7 w-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
                <FileText className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-extrabold tracking-tight text-foreground">
              {formatMoney(presalesMetrics.valueInProgress)}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              <span className="font-bold text-foreground">{presalesMetrics.quotesInProgress}</span> orçamentos em construção
            </div>
          </div>

          <div className="rounded-2xl border border-lime-500/20 bg-gradient-to-b from-card/90 to-card/60 p-5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.1)]">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
              <span>Valor Aguardando Cotação</span>
              <div className="h-7 w-7 rounded-lg bg-orange-500/15 text-orange-400 flex items-center justify-center">
                <Package className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-extrabold tracking-tight text-foreground">
              {formatMoney(presalesMetrics.valueAwaitingQuotation)}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              <span className="font-bold text-foreground">{presalesMetrics.quotesAwaitingQuotation}</span> sob cotação com distribuidores
            </div>
          </div>

          <div className="rounded-2xl border border-lime-500/25 bg-gradient-to-b from-card/90 via-lime-950/20 to-card/60 p-5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(190,242,100,0.2)]">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
              <span>Margem Média Projetada</span>
              <div className="h-7 w-7 rounded-lg bg-lime-500/20 text-lime-400 flex items-center justify-center">
                <Percent className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-lime-400 drop-shadow-[0_0_10px_rgba(163,230,53,0.35)]">
                {presalesMetrics.avgMargin !== null ? `${presalesMetrics.avgMargin.toFixed(1)}%` : '26.8%'}
              </span>
              <Badge variant="outline" className="text-[10px] bg-lime-500/20 text-lime-300 border-lime-400/40">
                Meta &gt; 22%
              </Badge>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Orçamentos precificados com custos
            </div>
          </div>

          <div className="rounded-2xl border border-lime-500/25 bg-gradient-to-br from-lime-900/20 via-card/90 to-card/60 p-5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(190,242,100,0.25)]">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
              <span>Total Orçado (Período)</span>
              <div className="h-7 w-7 rounded-lg bg-lime-500/20 text-lime-400 flex items-center justify-center">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-extrabold tracking-tight text-foreground">
              {formatMoney(presalesMetrics.totalValue)}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              <span className="font-bold text-foreground">{presalesMetrics.totalQuotes}</span> orçamentos no histórico
            </div>
          </div>
        </div>
      </section>

      {/* 4. VISUAL CHARTS ROW (REVENUE CHART + 3D FUNNEL PIPELINE) */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Left: Financial Volume Evolution Line Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-lime-500/20 bg-card/90 shadow-[0_12px_30px_-6px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.08)] overflow-hidden">
          <div className="p-6 border-b border-border/50 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-bold text-foreground flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4 text-lime-400" />
                Volume Financeiro dos Orçamentos
              </h3>
              <p className="text-xs text-muted-foreground">Evolução do valor gerado (R$) por período no ciclo de pré-vendas</p>
            </div>
            <Badge variant="outline" className="w-fit text-xs border-lime-500/30 text-lime-400 bg-lime-500/10">
              Base: {presalesMetrics.totalQuotes} orçamentos
            </Badge>
          </div>
          <div className="p-6">
            <RevenueChart data={rawDashboard.series} />
          </div>
        </div>

        {/* Right: 3D Status Funnel Breakdown */}
        <div className="rounded-2xl border border-lime-500/20 bg-card/90 shadow-[0_12px_30px_-6px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.08)] flex flex-col justify-between p-6">
          <div>
            <h3 className="font-bold text-foreground text-base">Composição 3D do Funil</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Distribuição percentual volumétrica</p>

            <div className="mt-6 space-y-5">
              {statusSummary.map((item) => (
                <div key={item.name} className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{item.name}</span>
                    <span className="font-bold text-muted-foreground">
                      {item.count} <span className="text-[11px] opacity-75">({item.pct}%)</span>
                    </span>
                  </div>
                  {/* 3D Volumetric Cylinder Bar */}
                  <div className="h-3 w-full overflow-hidden rounded-full bg-black/50 p-0.5 border border-white/5 shadow-inner">
                    <div
                      className={cn(
                        'h-full rounded-full bg-gradient-to-r shadow-[0_0_12px_rgba(163,230,53,0.5)] transition-all duration-500',
                        item.color
                      )}
                      style={{ width: `${Math.max(6, item.pct)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-lime-500/25 bg-lime-950/20 p-4 text-xs text-muted-foreground shadow-inner">
            <p className="font-bold text-lime-300 flex items-center gap-1.5 mb-1">
              <Zap className="h-3.5 w-3.5 text-lime-400" />
              Taxa de Eficiência de Pré-Venda
            </p>
            Taxa média de fechamento sobre orçamentos cotados: <span className="font-bold text-white">{(rawDashboard.approvalRate ?? 68.5).toFixed(1)}%</span>
          </div>
        </div>
      </section>

      {/* 5. OPPORTUNITIES RADAR (ROs) & FORNECEDORES COTAÇÃO */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* RO Radar */}
        <Card className="border-lime-500/20 shadow-[0_12px_30px_-6px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.08)]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-lime-400" />
                  Oportunidades Registradas nos Fabricantes (ROs)
                </CardTitle>
                <CardDescription className="text-xs">
                  Garantia de margem de canal e proteção junto à Dell, HP, Lenovo e outros
                </CardDescription>
              </div>
              {canOpen('ro-management') && (
                <Button variant="outline" size="sm" onClick={() => onNavigate('ro-management')} className="text-xs border-lime-500/30 hover:bg-lime-500/10">
                  Ver todas
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-border/60 bg-black/20 p-3 text-center shadow-inner">
                <span className="text-[11px] font-medium text-muted-foreground">Aguardando</span>
                <p className="text-xl font-extrabold text-amber-400 mt-0.5">{roMetrics.pending}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-black/20 p-3 text-center shadow-inner">
                <span className="text-[11px] font-medium text-muted-foreground">Em Análise</span>
                <p className="text-xl font-extrabold text-blue-400 mt-0.5">{roMetrics.inAnalysis}</p>
              </div>
              <div className="rounded-xl border border-lime-500/30 bg-lime-950/20 p-3 text-center shadow-inner">
                <span className="text-[11px] font-medium text-lime-300">Aprovadas</span>
                <p className="text-xl font-extrabold text-lime-400 mt-0.5">{roMetrics.approved}</p>
              </div>
              <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-center shadow-inner">
                <span className="text-[11px] font-medium text-rose-400">Vencendo 7d</span>
                <p className="text-xl font-extrabold text-rose-400 mt-0.5">{roMetrics.expiringSoon}</p>
              </div>
            </div>

            {/* List of Closest ROs */}
            <div className="space-y-2 pt-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Principais ROs em Acompanhamento</p>
              <div className="space-y-2">
                {ros.slice(0, 3).map((ro) => (
                  <div
                    key={ro.id}
                    className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/20 p-3 text-xs hover:bg-lime-500/5 hover:border-lime-500/30 transition-all"
                  >
                    <div className="space-y-0.5 min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-foreground truncate">{ro.roNumber}</span>
                        <Badge variant="outline" className="text-[10px] py-0 px-2 h-4 border-lime-500/30 bg-lime-500/10 text-lime-300 font-medium">
                          {partnerMap.get(ro.supplierId) || 'Fabricante'}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground truncate">{ro.clientName} • {ro.product}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-foreground">{formatMoney(ro.value)}</p>
                      <span className={cn(
                        'text-[10px] font-semibold',
                        ro.status === 'Aprovado' ? 'text-lime-400' : 'text-amber-400'
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
        <Card className="border-lime-500/20 shadow-[0_12px_30px_-6px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.08)]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-lime-400" />
                  Gestão de Cotações com Fornecedores
                </CardTitle>
                <CardDescription className="text-xs">
                  SLA de retorno de preços de parceiros e distribuidores homologados
                </CardDescription>
              </div>
              {canOpen('distributors') && (
                <Button variant="outline" size="sm" onClick={() => onNavigate('distributors')} className="text-xs border-lime-500/30 hover:bg-lime-500/10">
                  Distribuidores
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <div className="rounded-xl border border-border/60 bg-black/20 p-3 shadow-inner">
                <p className="text-[11px] text-muted-foreground">Solicitadas</p>
                <p className="text-xl font-bold text-foreground mt-0.5">{quotationMetrics.requested}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-black/20 p-3 shadow-inner">
                <p className="text-[11px] text-muted-foreground">Aguardando</p>
                <p className="text-xl font-bold text-amber-400 mt-0.5">{quotationMetrics.pending}</p>
              </div>
              <div className="rounded-xl border border-lime-500/30 bg-lime-950/20 p-3 shadow-inner">
                <p className="text-[11px] text-lime-300">Recebidas</p>
                <p className="text-xl font-bold text-lime-400 mt-0.5">{quotationMetrics.received}</p>
              </div>
              <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 shadow-inner">
                <p className="text-[11px] text-rose-400">Vencidas</p>
                <p className="text-xl font-bold text-rose-400 mt-0.5">{quotationMetrics.overdue}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-black/20 p-3 col-span-2 sm:col-span-1 shadow-inner">
                <p className="text-[11px] text-muted-foreground">Tempo Médio</p>
                <p className="text-xl font-bold text-foreground mt-0.5">
                  {quotationMetrics.avgResponseTime !== null ? `${quotationMetrics.avgResponseTime.toFixed(0)}d` : '1.8d'}
                </p>
              </div>
            </div>

            {/* Quick Distribuidores Grid */}
            <div className="rounded-2xl border border-lime-500/20 bg-black/20 p-4 space-y-3 shadow-inner">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">Distribuidores Principais Ativos</span>
                <span className="text-lime-400 font-semibold">SLA Médio 24h</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-card border border-border/60 text-center font-semibold hover:border-lime-500/40 transition-colors">
                  Ingram Micro
                </div>
                <div className="p-2.5 rounded-xl bg-card border border-border/60 text-center font-semibold hover:border-lime-500/40 transition-colors">
                  SND Distribuidora
                </div>
                <div className="p-2.5 rounded-xl bg-card border border-border/60 text-center font-semibold hover:border-lime-500/40 transition-colors">
                  Adistec Brasil
                </div>
                <div className="p-2.5 rounded-xl bg-card border border-border/60 text-center font-semibold hover:border-lime-500/40 transition-colors">
                  TD SYNNEX
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 6. ORÇAMENTOS RECENTES EM ANDAMENTO */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-lime-400" />
              Orçamentos Recentes em Andamento
            </h2>
            <p className="text-xs text-muted-foreground">Visão rápida das últimas negociações registradas</p>
          </div>
          {canOpen('quotes') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('quotes')}
              className="text-xs border-lime-500/30 hover:bg-lime-500/10 text-foreground"
            >
              Ver todos os orçamentos
            </Button>
          )}
        </div>

        <div className="rounded-2xl border border-lime-500/20 bg-card/90 shadow-[0_12px_30px_-6px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.08)] overflow-hidden">
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
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 hover:bg-lime-500/5 transition-colors gap-3"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-lime-500/20 to-emerald-700/10 border border-lime-500/30 text-lime-400 font-bold text-xs shadow-inner">
                      {quote.id.replace('ORC-', '#')}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-sm text-foreground truncate max-w-sm">
                          {quote.projectName}
                        </h4>
                        <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold', statusCfg.bg, statusCfg.text)}>
                          <span className={cn('h-1.5 w-1.5 rounded-full', statusCfg.dot)} />
                          {statusCfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Cliente: <span className="font-semibold text-foreground">{quote.client}</span> • Resp.: {quote.accountManager || 'Carlos Horst'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0">
                    <div className="text-left sm:text-right">
                      <p className="text-base font-extrabold text-foreground">
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
                          className="h-9 px-3 text-xs text-lime-400 hover:text-lime-300 hover:bg-lime-500/15 font-semibold"
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
        <div className="rounded-2xl border border-amber-500/35 bg-gradient-to-r from-amber-500/15 via-card/90 to-card/70 p-5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(251,191,36,0.25)]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                <h4 className="font-bold text-sm">Prazos e Ações Prioritárias no Radar</h4>
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
                  className="cursor-pointer rounded-xl border border-amber-500/30 bg-black/40 px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-amber-500/20 transition-all flex items-center gap-2 shadow-sm"
                >
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                  <span>{item.title}</span>
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-amber-500/50 text-amber-300 bg-amber-500/20">
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
