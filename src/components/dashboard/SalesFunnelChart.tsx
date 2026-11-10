'use client';

import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react';
import { formatMoney } from '@/lib/dashboard';
import { cn } from '@/lib/utils';

export interface FunnelStage {
  name: string;
  count: number;
  value: number;
  avgDays: number | null;
  conversionRate: number | null; // % que passou para próxima etapa
  color: string;
}

interface SalesFunnelChartProps {
  stages: FunnelStage[];
}

/**
 * SalesFunnelChart - Funil visual de vendas com conversão entre etapas
 * 
 * Exibe o pipeline em formato de funil, mostrando taxa de conversão,
 * tempo médio e gargalos entre as etapas do processo comercial.
 */
export function SalesFunnelChart({ stages }: SalesFunnelChartProps) {
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

  return (
    <div className="space-y-3">
      {stages.map((stage, idx) => {
        const widthPercent = (stage.value / maxValue) * 100;
        const isLast = idx === stages.length - 1;
        const nextStage = isLast ? null : stages[idx + 1];
        
        // Taxa de conversão para próxima etapa
        const dropRate = nextStage 
          ? ((stage.count - nextStage.count) / stage.count) * 100 
          : null;

        return (
          <div key={stage.name} className="space-y-2">
            {/* Stage Card */}
            <div
              className={cn(
                'group relative rounded-lg border border-border bg-card transition-all hover:shadow-md',
                'overflow-hidden'
              )}
              style={{
                width: `${Math.max(widthPercent, 30)}%`,
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              {/* Background color indicator */}
              <div
                className="absolute inset-0 opacity-5"
                style={{ backgroundColor: stage.color }}
              />

              {/* Content */}
              <div className="relative p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: stage.color }}
                      />
                      <h4 className="text-sm font-semibold text-foreground">{stage.name}</h4>
                    </div>
                    
                    <div className="mt-2 flex items-center gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Quantidade</p>
                        <p className="text-lg font-bold text-foreground">{stage.count}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Valor</p>
                        <p className="text-lg font-bold text-foreground">
                          {formatMoney(stage.value)}
                        </p>
                      </div>
                      {stage.avgDays !== null && (
                        <div>
                          <p className="text-xs text-muted-foreground">Tempo médio</p>
                          <p className="text-sm font-semibold text-muted-foreground">
                            {stage.avgDays.toFixed(0)} dias
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Conversion Badge */}
                  {stage.conversionRate !== null && (
                    <div className="shrink-0">
                      <div
                        className={cn(
                          'rounded-lg px-2.5 py-1 text-xs font-semibold',
                          stage.conversionRate >= 70
                            ? 'bg-accent-green/10 text-accent-green'
                            : stage.conversionRate >= 40
                            ? 'bg-accent-yellow/10 text-accent-yellow'
                            : 'bg-destructive/10 text-destructive'
                        )}
                      >
                        {stage.conversionRate.toFixed(1)}% conversão
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Drop Rate Indicator */}
            {!isLast && dropRate !== null && dropRate > 0 && (
              <div className="flex items-center justify-center gap-2 text-xs">
                <TrendingDown className="h-4 w-4 text-destructive" />
                <span className="text-muted-foreground">
                  {dropRate.toFixed(1)}% perdidos ({stage.count - (nextStage?.count || 0)} orçamentos)
                </span>
              </div>
            )}

            {/* Arrow to next stage */}
            {!isLast && (
              <div className="flex justify-center">
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
          </div>
        );
      })}

      {/* Summary */}
      <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Conversão Total</p>
            <p className="text-xl font-bold text-foreground">
              {stages.length > 0 && stages[0].count > 0
                ? (((stages[stages.length - 1]?.count || 0) / stages[0].count) * 100).toFixed(1)
                : '0'}%
            </p>
            <p className="text-xs text-muted-foreground">
              {stages[0]?.count || 0} → {stages[stages.length - 1]?.count || 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Valor em Jogo</p>
            <p className="text-xl font-bold text-foreground">
              {formatMoney(stages.reduce((sum, s) => sum + s.value, 0))}
            </p>
            <p className="text-xs text-muted-foreground">Pipeline total</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Maior Gargalo</p>
            {(() => {
              const maxDrop = stages
                .map((s, idx) => ({
                  stage: s.name,
                  drop: idx < stages.length - 1 ? s.count - stages[idx + 1].count : 0,
                }))
                .sort((a, b) => b.drop - a.drop)[0];
              
              return (
                <>
                  <p className="text-xl font-bold text-destructive">{maxDrop.drop}</p>
                  <p className="text-xs text-muted-foreground">{maxDrop.stage}</p>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
