'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Eye, User, Calendar, DollarSign, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/lib/dashboard';
import type { Quote } from '@/lib/types';

export interface FunnelStageDetail {
  name: string;
  count: number;
  value: number;
  avgDays: number | null;
  conversionRate: number | null;
  color: string;
  quotes: Quote[];
}

interface InteractiveFunnelChartProps {
  stages: FunnelStageDetail[];
  onNavigate: (module: string, recordId: string) => void;
}

/**
 * InteractiveFunnelChart - Funil com drill-down interativo
 * 
 * Permite expandir cada etapa para ver lista detalhada de orçamentos,
 * com filtros inline e ações rápidas. Ideal para gestão operacional.
 */
export function InteractiveFunnelChart({ stages, onNavigate }: InteractiveFunnelChartProps) {
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const maxValue = Math.max(...stages.map(s => s.value), 1);

  if (stages.length === 0 || stages.every(s => s.count === 0)) {
    return (
      <div className="flex h-[350px] items-center justify-center rounded-lg border border-dashed border-border">
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground">Funil sem dados</p>
          <p className="text-xs text-muted-foreground">Aguardando orçamentos em andamento</p>
        </div>
      </div>
    );
  }

  const toggleStage = (stageName: string) => {
    setExpandedStage(expandedStage === stageName ? null : stageName);
  };

  const getDaysLabel = (quote: Quote) => {
    const date = quote.date ? new Date(quote.date) : null;
    if (!date) return 'sem data';
    
    const now = new Date();
    const days = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'hoje';
    if (days === 1) return 'ontem';
    return `${days}d atrás`;
  };

  return (
    <div className="space-y-3">
      {stages.map((stage, idx) => {
        const widthPercent = (stage.value / maxValue) * 100;
        const isExpanded = expandedStage === stage.name;
        const isLast = idx === stages.length - 1;
        const nextStage = isLast ? null : stages[idx + 1];
        const dropRate = nextStage 
          ? ((stage.count - nextStage.count) / stage.count) * 100 
          : null;

        return (
          <div key={stage.name} className="space-y-2">
            {/* Stage Header - Clickable */}
            <button
              onClick={() => toggleStage(stage.name)}
              className={cn(
                'group relative w-full rounded-lg border border-border bg-card transition-all',
                'hover:border-primary/50 hover:shadow-md',
                isExpanded && 'border-primary/50 shadow-md'
              )}
              style={{
                width: `${Math.max(widthPercent, 40)}%`,
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              {/* Background color */}
              <div
                className="absolute inset-0 rounded-lg opacity-5"
                style={{ backgroundColor: stage.color }}
              />

              {/* Content */}
              <div className="relative p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    <div className="text-left">
                      <h4 className="text-sm font-semibold text-foreground">{stage.name}</h4>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <span className="font-semibold text-foreground">{stage.count}</span>
                          orçamentos
                        </span>
                        <span>•</span>
                        <span className="font-semibold text-foreground">
                          {formatMoney(stage.value)}
                        </span>
                        {stage.avgDays !== null && (
                          <>
                            <span>•</span>
                            <span>{stage.avgDays.toFixed(0)} dias médio</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {stage.conversionRate !== null && (
                      <Badge
                        variant={
                          stage.conversionRate >= 70
                            ? 'default'
                            : stage.conversionRate >= 40
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {stage.conversionRate.toFixed(0)}% conversão
                      </Badge>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>
            </button>

            {/* Expanded Content - Quote List */}
            {isExpanded && stage.quotes.length > 0 && (
              <div
                className="space-y-2 overflow-hidden rounded-lg border border-border bg-muted/30 p-3"
                style={{
                  width: `${Math.max(widthPercent, 40)}%`,
                  marginLeft: 'auto',
                  marginRight: 'auto',
                }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground">
                    {stage.quotes.length} {stage.quotes.length === 1 ? 'orçamento' : 'orçamentos'} nesta etapa
                  </p>
                  {stage.quotes.length > 5 && (
                    <p className="text-xs text-muted-foreground">
                      Mostrando top 5 por valor
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  {stage.quotes
                    .sort((a, b) => b.total - a.total)
                    .slice(0, 5)
                    .map((quote) => (
                      <div
                        key={quote.id}
                        className={cn(
                          'group flex items-center gap-3 rounded-lg border border-border bg-card p-3',
                          'transition-all hover:border-primary/50 hover:shadow-sm'
                        )}
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <h5 className="truncate text-sm font-semibold text-foreground">
                              {quote.projectName || quote.client}
                            </h5>
                            <Badge variant="outline" className="shrink-0 text-xs">
                              {quote.status}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {quote.client}
                            </span>
                            {quote.accountManager && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {quote.accountManager}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {getDaysLabel(quote)}
                            </span>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm font-bold text-foreground">
                              {formatMoney(quote.total)}
                            </p>
                            {quote.monthlyPrice && (
                              <p className="text-xs text-muted-foreground">
                                {formatMoney(quote.monthlyPrice)}/mês
                              </p>
                            )}
                          </div>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigate('quotes', quote.id);
                            }}
                            className="opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>

                {stage.quotes.length > 5 && (
                  <div className="mt-2 text-center">
                    <Button variant="ghost" size="sm" className="text-xs">
                      Ver todos os {stage.quotes.length} orçamentos
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Drop indicator */}
            {!isLast && dropRate !== null && dropRate > 0 && !isExpanded && (
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <div className="h-px w-8 bg-border" />
                <span>
                  {dropRate.toFixed(0)}% perdidos ({stage.count - (nextStage?.count || 0)})
                </span>
                <div className="h-px w-8 bg-border" />
              </div>
            )}
          </div>
        );
      })}

      {/* Summary */}
      <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Conversão Total</p>
            <p className="text-xl font-bold text-foreground">
              {stages.length > 0 && stages[0].count > 0
                ? (((stages[stages.length - 1]?.count || 0) / stages[0].count) * 100).toFixed(1)
                : '0'}%
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Valor Total</p>
            <p className="text-xl font-bold text-foreground">
              {formatMoney(stages.reduce((sum, s) => sum + s.value, 0))}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tempo Médio</p>
            <p className="text-xl font-bold text-foreground">
              {stages.filter(s => s.avgDays !== null).length > 0
                ? (
                    stages
                      .filter(s => s.avgDays !== null)
                      .reduce((sum, s) => sum + s.avgDays!, 0) /
                    stages.filter(s => s.avgDays !== null).length
                  ).toFixed(0)
                : '0'} dias
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
