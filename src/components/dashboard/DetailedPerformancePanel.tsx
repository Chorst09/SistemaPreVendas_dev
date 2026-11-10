'use client';

import { useState } from 'react';
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  Zap,
  Award,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatMoney } from '@/lib/dashboard';

export interface DetailedPerformance {
  name: string;
  stats: {
    total: number;
    approved: number;
    rejected: number;
    pending: number;
    approvedValue: number;
    rejectedValue: number;
    totalValue: number;
    conversionRate: number;
    avgTicket: number;
    avgTimeToClose: number | null;
  };
  trends: {
    conversionTrend: number; // vs período anterior
    valueTrend: number;
    activityTrend: number;
  };
  achievements: string[];
  rank: number;
}

interface DetailedPerformancePanelProps {
  data: DetailedPerformance[];
}

/**
 * DetailedPerformancePanel - Painel detalhado de performance individual
 * 
 * Exibe métricas aprofundadas por vendedor: conversão, volume, velocidade,
 * tendências e conquistas. Ideal para análise de performance e coaching.
 */
export function DetailedPerformancePanel({ data }: DetailedPerformancePanelProps) {
  const [selectedSeller, setSelectedSeller] = useState<string | null>(
    data.length > 0 ? data[0].name : null
  );
  const [view, setView] = useState<'overview' | 'detailed'>('overview');

  if (data.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed border-border">
        <div className="text-center">
          <BarChart3 className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">Sem dados de performance</p>
          <p className="text-xs text-muted-foreground">Aguardando atividade dos vendedores</p>
        </div>
      </div>
    );
  }

  const selected = data.find(d => d.name === selectedSeller) || data[0];

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { icon: Trophy, color: 'text-accent-yellow', bg: 'bg-accent-yellow/10', label: '1º Lugar' };
    if (rank === 2) return { icon: Award, color: 'text-muted-foreground', bg: 'bg-muted', label: '2º Lugar' };
    if (rank === 3) return { icon: Award, color: 'text-accent-orange', bg: 'bg-accent-orange/10', label: '3º Lugar' };
    return { icon: Award, color: 'text-muted-foreground', bg: 'bg-muted', label: `${rank}º Lugar` };
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 5) return { icon: TrendingUp, color: 'text-accent-green' };
    if (trend < -5) return { icon: TrendingDown, color: 'text-destructive' };
    return { icon: Target, color: 'text-muted-foreground' };
  };

  const rankBadge = getRankBadge(selected.rank);
  const RankIcon = rankBadge.icon;

  return (
    <div className="space-y-4">
      {/* Tabs de Visão */}
      <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="detailed">Análise Detalhada</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Seletor de Vendedor */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {data.map((person) => {
          const personRank = getRankBadge(person.rank);
          const PersonIcon = personRank.icon;
          
          return (
            <button
              key={person.name}
              onClick={() => setSelectedSeller(person.name)}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 transition-all',
                selectedSeller === person.name
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border bg-card hover:border-primary/50'
              )}
            >
              <div className={cn('rounded-md p-1', personRank.bg)}>
                <PersonIcon className={cn('h-4 w-4', personRank.color)} />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">{person.name}</p>
                <p className="text-xs text-muted-foreground">
                  {person.stats.conversionRate.toFixed(0)}% conversão
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Overview View */}
      {view === 'overview' && (
        <div className="space-y-4">
          {/* Header com Ranking */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">{selected.name}</h3>
                <p className="text-sm text-muted-foreground">Performance no período</p>
              </div>
              <div className={cn('rounded-lg px-4 py-2', rankBadge.bg)}>
                <div className="flex items-center gap-2">
                  <RankIcon className={cn('h-5 w-5', rankBadge.color)} />
                  <span className={cn('text-lg font-bold', rankBadge.color)}>
                    {rankBadge.label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Métricas Principais */}
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Target className="h-4 w-4" />
                Taxa de Conversão
              </div>
              <p className="mt-2 text-2xl font-bold text-foreground">
                {selected.stats.conversionRate.toFixed(1)}%
              </p>
              <div className="mt-1 flex items-center gap-1 text-xs">
                {(() => {
                  const trend = getTrendIcon(selected.trends.conversionTrend);
                  const TrendIcon = trend.icon;
                  return (
                    <>
                      <TrendIcon className={cn('h-3 w-3', trend.color)} />
                      <span className={trend.color}>
                        {selected.trends.conversionTrend > 0 ? '+' : ''}
                        {selected.trends.conversionTrend.toFixed(1)}% vs anterior
                      </span>
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                Valor Aprovado
              </div>
              <p className="mt-2 text-2xl font-bold text-accent-green">
                {formatMoney(selected.stats.approvedValue)}
              </p>
              <div className="mt-1 flex items-center gap-1 text-xs">
                {(() => {
                  const trend = getTrendIcon(selected.trends.valueTrend);
                  const TrendIcon = trend.icon;
                  return (
                    <>
                      <TrendIcon className={cn('h-3 w-3', trend.color)} />
                      <span className={trend.color}>
                        {selected.trends.valueTrend > 0 ? '+' : ''}
                        {selected.trends.valueTrend.toFixed(1)}% vs anterior
                      </span>
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Zap className="h-4 w-4" />
                Ticket Médio
              </div>
              <p className="mt-2 text-2xl font-bold text-foreground">
                {formatMoney(selected.stats.avgTicket)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {selected.stats.approved} aprovados
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-4 w-4" />
                Tempo Médio
              </div>
              <p className="mt-2 text-2xl font-bold text-foreground">
                {selected.stats.avgTimeToClose !== null
                  ? `${selected.stats.avgTimeToClose.toFixed(0)}d`
                  : '—'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                até fechamento
              </p>
            </div>
          </div>

          {/* Conquistas */}
          {selected.achievements.length > 0 && (
            <div className="rounded-lg border border-accent-green/20 bg-accent-green/5 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-accent-green" />
                <h4 className="font-semibold text-foreground">Conquistas</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {selected.achievements.map((achievement, idx) => (
                  <Badge key={idx} variant="outline" className="bg-card">
                    {achievement}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detailed View */}
      {view === 'detailed' && (
        <div className="space-y-4">
          {/* Breakdown de Status */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h4 className="mb-3 font-semibold text-foreground">Distribuição de Orçamentos</h4>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-green/10">
                  <CheckCircle2 className="h-5 w-5 text-accent-green" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{selected.stats.approved}</p>
                  <p className="text-xs text-muted-foreground">Aprovados</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                  <XCircle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{selected.stats.rejected}</p>
                  <p className="text-xs text-muted-foreground">Rejeitados</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-yellow/10">
                  <Clock className="h-5 w-5 text-accent-yellow" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{selected.stats.pending}</p>
                  <p className="text-xs text-muted-foreground">Em andamento</p>
                </div>
              </div>
            </div>
          </div>

          {/* Análise de Valores */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h4 className="mb-3 font-semibold text-foreground">Análise de Valores</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total negociado</span>
                <span className="text-lg font-bold text-foreground">
                  {formatMoney(selected.stats.totalValue)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Valor aprovado</span>
                <span className="text-lg font-bold text-accent-green">
                  {formatMoney(selected.stats.approvedValue)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Valor perdido</span>
                <span className="text-lg font-bold text-destructive">
                  {formatMoney(selected.stats.rejectedValue)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
                <span className="text-sm font-semibold text-foreground">Efetividade</span>
                <span className="text-lg font-bold text-primary">
                  {selected.stats.totalValue > 0
                    ? ((selected.stats.approvedValue / selected.stats.totalValue) * 100).toFixed(1)
                    : '0'}%
                </span>
              </div>
            </div>
          </div>

          {/* Comparação com Média */}
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <h4 className="mb-3 font-semibold text-foreground">vs Média do Time</h4>
            <div className="space-y-2 text-sm">
              {(() => {
                const avgConversion = data.reduce((sum, d) => sum + d.stats.conversionRate, 0) / data.length;
                const avgValue = data.reduce((sum, d) => sum + d.stats.approvedValue, 0) / data.length;
                const diffConversion = selected.stats.conversionRate - avgConversion;
                const diffValue = selected.stats.approvedValue - avgValue;

                return (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Taxa de conversão</span>
                      <span className={cn('font-semibold', diffConversion > 0 ? 'text-accent-green' : 'text-destructive')}>
                        {diffConversion > 0 ? '+' : ''}{diffConversion.toFixed(1)}% da média
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Valor aprovado</span>
                      <span className={cn('font-semibold', diffValue > 0 ? 'text-accent-green' : 'text-destructive')}>
                        {diffValue > 0 ? '+' : ''}{formatMoney(Math.abs(diffValue))}
                      </span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
