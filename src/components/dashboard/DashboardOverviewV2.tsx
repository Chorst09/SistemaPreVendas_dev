'use client';

import { useMemo, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  Clock,
  FileText,
  Plus,
  TrendingDown,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Calendar,
  Filter,
  Timer,
  Zap,
  UserCheck,
  TrendingDown as LossIcon,
  Hourglass,
  Bell,
} from 'lucide-react';
import { useQuotes } from '@/contexts/QuoteContext';
import type { Edital, Partner, Proposal, RO } from '@/lib/types';
import {
  attentionItems,
  dashboardMetrics,
  calculateAdvancedMetrics,
  calculateTemporalEvolution,
  calculateSalesFunnel,
  calculateSalesPerformance,
  calculateLossAnalysis,
  calculateRecentMovements,
  calculateActivities,
  dueLabel,
  formatMoney,
  PERIOD_LABELS,
  type DashboardPeriod,
} from '@/lib/dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from '@/components/ui/enhanced-card';
import { MiniMetric } from '@/components/ui/mini-metric';
import { PageHeader, SectionHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RevenueChart } from './RevenueChart';
import { PipelineChart } from './PipelineChart';
import { TemporalEvolutionChart } from './TemporalEvolutionChart';
import { SalesFunnelChart } from './SalesFunnelChart';
import { SalesPerformanceChart } from './SalesPerformanceChart';
import { LossAnalysisChart } from './LossAnalysisChart';
import { ActivityCenter } from './ActivityCenter';
import { RecentMovementsTable } from './RecentMovementsTable';
import { cn } from '@/lib/utils';

interface DashboardOverviewV2Props {
  partners: Partner[];
  ros: RO[];
  proposals?: Proposal[];
  editais?: Edital[];
  onNavigate: (module: string, record?: string) => void;
  allowedModules?: string[];
}

export default function DashboardOverviewV2({
  partners,
  ros,
  proposals = [],
  editais = [],
  onNavigate,
  allowedModules,
}: DashboardOverviewV2Props) {
  const { quotes } = useQuotes();
  const [period, setPeriod] = useState<DashboardPeriod>('30d');
  const [manager, setManager] = useState('all');
  const [attentionFilter, setAttentionFilter] = useState<'upcoming' | 'overdue'>('upcoming');
  const [today] = useState(() => new Date());

  const canOpen = (module: string) => !allowedModules || allowedModules.includes(module);
  const managers = [...new Set(quotes.map((q) => q.accountManager).filter(Boolean))] as string[];

  const visibleQuotes = useMemo(
    () => quotes.filter((q) => manager === 'all' || q.accountManager === manager),
    [quotes, manager]
  );

  const metrics = useMemo(
    () => dashboardMetrics(visibleQuotes, period, today),
    [visibleQuotes, period, today]
  );

  const advancedMetrics = useMemo(
    () => calculateAdvancedMetrics(visibleQuotes, period, today),
    [visibleQuotes, period, today]
  );

  const temporalData = useMemo(
    () => calculateTemporalEvolution(visibleQuotes, 6, today),
    [visibleQuotes, today]
  );

  const funnelData = useMemo(
    () => calculateSalesFunnel(visibleQuotes, today),
    [visibleQuotes, today]
  );

  const performanceData = useMemo(
    () => calculateSalesPerformance(visibleQuotes),
    [visibleQuotes]
  );

  const lossData = useMemo(
    () => calculateLossAnalysis(visibleQuotes),
    [visibleQuotes]
  );

  const recentMovements = useMemo(
    () => calculateRecentMovements(visibleQuotes, proposals, 7, today),
    [visibleQuotes, proposals, today]
  );

  const activities = useMemo(
    () => calculateActivities(visibleQuotes, proposals, ros, today),
    [visibleQuotes, proposals, ros, today]
  );

  const [performanceMetric, setPerformanceMetric] = useState<'conversion' | 'volume'>('conversion');

  const attention = useMemo(
    () =>
      attentionItems(
        {
          quotes: visibleQuotes,
          ros: ros.filter((ro) => manager === 'all' || ro.accountManager === manager),
          proposals: proposals.filter((p) => manager === 'all' || p.accountManager === manager),
          editais: manager === 'all' ? editais : [],
        },
        today
      ).filter((item) => !allowedModules || allowedModules.includes(item.module)),
    [visibleQuotes, ros, proposals, editais, manager, today, allowedModules]
  );

  const upcoming = attention.filter((item) => !item.overdue);
  const overdue = attention.filter((item) => item.overdue);
  const attentionRows = attentionFilter === 'upcoming' ? upcoming : overdue;

  // Calcular trend comparado ao período anterior
  const getTrend = (current: number, previous: number): { value: string; trend: 'up' | 'down' | 'neutral' } => {
    if (previous === 0) return { value: '—', trend: 'neutral' };
    const percentChange = ((current - previous) / previous) * 100;
    if (Math.abs(percentChange) < 0.1) return { value: '—', trend: 'neutral' };
    return {
      value: `${percentChange > 0 ? '+' : ''}${percentChange.toFixed(1)}%`,
      trend: percentChange > 0 ? 'up' : 'down',
    };
  };

  const range = `${metrics.start.toLocaleDateString('pt-BR')} – ${metrics.end.toLocaleDateString('pt-BR')}`;

  return (
    <div className="min-h-screen space-y-8 pb-8">
      {/* Header */}
      <PageHeader
        title="Visão geral"
        description="Seu negócio em perspectiva. Resultados, oportunidades e próximos passos em um só lugar."
        icon={<TrendingUp className="h-6 w-6" />}
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
          <CalendarDays className="h-4 w-4" />
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

      {/* KPI Cards - Primary Metrics (2x3 grid) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Pipeline aberto"
          value={formatMoney(metrics.pipelineValue)}
          change={getTrend(metrics.pipelineCount, metrics.previous.filter((q) => q.status === 'Pendente' || q.status === 'Enviado').length)}
          icon={<BriefcaseBusiness className="h-5 w-5" />}
          description={`${metrics.pipelineCount} orçamentos ativos`}
          variant="primary"
        />

        <MetricCard
          title="Valor aprovado"
          value={formatMoney(metrics.approvedValue)}
          change={getTrend(
            metrics.approvedValue,
            metrics.previous.filter((q) => q.status === 'Aprovado').reduce((sum, q) => sum + q.total, 0)
          )}
          icon={<BadgeCheck className="h-5 w-5" />}
          description={`${metrics.approvedCount} aprovados no período`}
          variant="success"
        />

        <MetricCard
          title="Taxa de conversão"
          value={advancedMetrics.winRate === null ? '—' : `${advancedMetrics.winRate.toFixed(1)}%`}
          change={
            advancedMetrics.winRate !== null
              ? {
                  value: advancedMetrics.winRate > 50 ? 'Acima da meta' : 'Abaixo da meta',
                  trend: advancedMetrics.winRate > 50 ? 'up' : 'down',
                }
              : undefined
          }
          icon={<Target className="h-5 w-5" />}
          description={metrics.decidedCount ? `${metrics.approvedCount}/${metrics.decidedCount} decididos` : 'Sem dados'}
        />

        <MetricCard
          title="Ticket médio"
          value={formatMoney(advancedMetrics.avgTicket)}
          icon={<DollarSign className="h-5 w-5" />}
          description={`Aprovados: ${formatMoney(advancedMetrics.avgTicketApproved)}`}
        />

        <MetricCard
          title="Tempo médio de fechamento"
          value={advancedMetrics.avgTimeToClose === null ? '—' : `${advancedMetrics.avgTimeToClose.toFixed(0)} dias`}
          icon={<Timer className="h-5 w-5" />}
          description={advancedMetrics.avgTimeInProgress !== null ? `Em andamento: ${advancedMetrics.avgTimeInProgress.toFixed(0)} dias` : 'Sem dados'}
        />

        <MetricCard
          title="Total de orçamentos"
          value={metrics.total}
          icon={<FileText className="h-5 w-5" />}
          description={period === 'all' ? `${partners.length} parceiros ativos` : `${metrics.previous.length} no período anterior`}
        />
      </div>

      {/* Secondary Metrics - Mini Cards (1x6 grid) */}
      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
        <MiniMetric
          label="Parados >7 dias"
          value={advancedMetrics.stalledCount}
          icon={<Hourglass className="h-5 w-5" />}
          variant={advancedMetrics.stalledCount > 5 ? 'warning' : 'default'}
          subtitle={advancedMetrics.stalledCount > 0 ? 'Necessita ação' : 'Fluxo saudável'}
        />

        <MiniMetric
          label="Follow-ups atrasados"
          value={advancedMetrics.overdueFollowUps}
          icon={<Bell className="h-5 w-5" />}
          variant={advancedMetrics.overdueFollowUps > 0 ? 'danger' : 'success'}
          subtitle={advancedMetrics.overdueFollowUps > 0 ? 'Urgente' : 'Em dia'}
        />

        <MiniMetric
          label="Taxa de perda"
          value={advancedMetrics.lossRate === null ? '—' : `${advancedMetrics.lossRate.toFixed(1)}%`}
          icon={<LossIcon className="h-5 w-5" />}
          variant={advancedMetrics.lossRate !== null && advancedMetrics.lossRate > 30 ? 'warning' : 'default'}
          subtitle={`Ticket médio: ${formatMoney(advancedMetrics.avgTicketLost)}`}
        />

        <MiniMetric
          label="Top vendedor"
          value={advancedMetrics.conversionByManager[0]?.rate.toFixed(0) + '%' || '—'}
          icon={<UserCheck className="h-5 w-5" />}
          variant="success"
          subtitle={advancedMetrics.conversionByManager[0]?.manager || 'Sem dados'}
        />

        <MiniMetric
          label="Pipeline ativo"
          value={`${metrics.pipelineCount}`}
          icon={<Zap className="h-5 w-5" />}
          variant="info"
          subtitle={`${formatMoney(metrics.pipelineValue / (metrics.pipelineCount || 1))} médio`}
        />

        <MiniMetric
          label="Parceiros ativos"
          value={advancedMetrics.topPartners.length}
          icon={<Users className="h-5 w-5" />}
          variant="default"
          subtitle={advancedMetrics.topPartners[0]?.partner || 'Nenhum'}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Temporal Evolution */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Evolução Temporal</CardTitle>
            <CardDescription>Orçamentos criados vs aprovados nos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <TemporalEvolutionChart data={temporalData} />
          </CardContent>
        </Card>

        {/* Sales Funnel */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Funil de Vendas</CardTitle>
            <CardDescription>Pipeline com taxas de conversão entre etapas</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <SalesFunnelChart stages={funnelData} />
          </CardContent>
        </Card>

        {/* Sales Performance */}
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Performance de Vendedores</CardTitle>
              <CardDescription>Ranking por {performanceMetric === 'conversion' ? 'taxa de conversão' : 'volume de vendas'}</CardDescription>
            </div>
            <Select value={performanceMetric} onValueChange={(v) => setPerformanceMetric(v as 'conversion' | 'volume')}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="conversion">Por conversão</SelectItem>
                <SelectItem value="volume">Por volume</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="pt-0">
            <SalesPerformanceChart data={performanceData} metric={performanceMetric} />
          </CardContent>
        </Card>

        {/* Loss Analysis */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Análise de Perdas</CardTitle>
            <CardDescription>Distribuição de orçamentos perdidos por motivo</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <LossAnalysisChart
              data={lossData.data}
              totalLost={lossData.totalLost}
              totalLostValue={lossData.totalLostValue}
            />
          </CardContent>
        </Card>
      </div>

      {/* Legacy Charts (mantidos para compatibilidade) */}
      <details className="rounded-lg border border-border">
        <summary className="cursor-pointer p-4 text-sm font-semibold text-muted-foreground hover:text-foreground">
          Ver gráficos anteriores (legado)
        </summary>
        <div className="grid gap-6 p-4 lg:grid-cols-2">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Evolução de Receita</CardTitle>
              <CardDescription>Comparativo entre orçamentos criados e aprovados</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <RevenueChart data={metrics.series} />
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Pipeline por Status</CardTitle>
              <CardDescription>Distribuição de valor por etapa do funil</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <PipelineChart data={metrics.statuses} />
            </CardContent>
          </Card>
        </div>
      </details>

      {/* Activity Center */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Centro de Atividades
          </CardTitle>
          <CardDescription>
            Tarefas urgentes e próximas que precisam de atenção
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <ActivityCenter activities={activities} onNavigate={onNavigate} />
        </CardContent>
      </Card>

      {/* Recent Movements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-accent-green" />
            Movimentações Recentes
          </CardTitle>
          <CardDescription>
            Últimas mudanças no pipeline (últimos 7 dias)
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <RecentMovementsTable
            movements={recentMovements}
            onNavigate={onNavigate}
            onSendFollowUp={(recordId) => {
              // Implementar envio de follow-up
              console.log('Send follow-up:', recordId);
            }}
            onScheduleMeeting={(recordId) => {
              // Implementar agendamento de reunião
              console.log('Schedule meeting:', recordId);
            }}
          />
        </CardContent>
      </Card>

      {/* Attention Items */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-accent-orange" />
                Precisa de atenção
              </CardTitle>
              <CardDescription>Prazos e itens que precisam do próximo passo</CardDescription>
            </div>

            <Tabs value={attentionFilter} onValueChange={(v) => setAttentionFilter(v as 'upcoming' | 'overdue')}>
              <TabsList>
                <TabsTrigger value="upcoming" className="gap-2">
                  <Clock className="h-4 w-4" />
                  Em andamento
                  {upcoming.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {upcoming.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="overdue" className="gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Vencidos
                  {overdue.length > 0 && (
                    <Badge variant="destructive" className="ml-1">
                      {overdue.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {attentionRows.length > 0 ? (
            <div className="space-y-2">
              {attentionRows.slice(0, 10).map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.module, item.recordId)}
                  className={cn(
                    'group flex w-full items-center gap-4 rounded-lg border border-border bg-card p-4 text-left transition-all',
                    'hover:border-primary/50 hover:bg-accent/5 hover:shadow-md'
                  )}
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                      item.overdue
                        ? 'bg-destructive/10 text-destructive'
                        : item.days <= 3
                        ? 'bg-accent-yellow/10 text-accent-yellow'
                        : 'bg-primary/10 text-primary'
                    )}
                  >
                    {item.overdue ? (
                      <XCircle className="h-5 w-5" />
                    ) : item.days <= 3 ? (
                      <AlertCircle className="h-5 w-5" />
                    ) : (
                      <Clock className="h-5 w-5" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {item.kind}
                      </Badge>
                      <span className="text-sm font-semibold text-foreground">{item.title}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>

                  {/* Due Date */}
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant={item.overdue || item.days <= 7 ? 'destructive' : 'secondary'}>
                      {dueLabel(item)}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<CheckCircle2 className="h-12 w-12" />}
              title={attentionFilter === 'upcoming' ? 'Tudo em dia!' : 'Nenhum prazo vencido'}
              description={
                attentionFilter === 'upcoming'
                  ? 'Não há pendências urgentes no momento. Continue o excelente trabalho!'
                  : 'Todas as suas tarefas estão dentro do prazo. Parabéns!'
              }
            />
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      {canOpen('quotes') && (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-gradient-to-br from-primary/5 to-accent/5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Pronto para criar mais oportunidades?</h3>
            <p className="text-sm text-muted-foreground">Inicie um novo orçamento ou explore registros de oportunidade</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => onNavigate('quotes', 'new')} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo orçamento
            </Button>
            {canOpen('ro-charts') && (
              <Button variant="outline" onClick={() => onNavigate('ro-charts')} className="gap-2">
                Ver ROs
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
