'use client';

import { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { formatMoney } from '@/lib/dashboard';

interface TemporalData {
  month: string;
  created: number;
  approved: number;
  createdCount: number;
  approvedCount: number;
}

interface TemporalEvolutionChartProps {
  data: TemporalData[];
}

/**
 * TemporalEvolutionChart - Gráfico de evolução temporal mês a mês
 * 
 * Exibe a evolução de orçamentos criados vs aprovados ao longo do tempo,
 * permitindo identificar tendências, sazonalidade e performance histórica.
 */
export function TemporalEvolutionChart({ data }: TemporalEvolutionChartProps) {
  const hasData = data.some(item => item.created > 0 || item.approved > 0);

  // Calcular tendência (média móvel simples de 3 meses)
  const withTrend = useMemo(() => {
    if (data.length < 3) return data;
    
    return data.map((item, idx) => {
      if (idx < 2) return { ...item, trend: null };
      
      const window = data.slice(idx - 2, idx + 1);
      const trend = window.reduce((sum, d) => sum + d.approved, 0) / 3;
      
      return { ...item, trend };
    });
  }, [data]);

  if (!hasData) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed border-border">
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground">Sem dados temporais</p>
          <p className="text-xs text-muted-foreground">Crie orçamentos para visualizar a evolução</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={withTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--accent-green))" stopOpacity={0.4} />
              <stop offset="95%" stopColor="hsl(var(--accent-green))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            width={70}
            tickFormatter={(value) => new Intl.NumberFormat('pt-BR', {
              notation: 'compact',
              maximumFractionDigits: 0,
            }).format(value)}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload || !payload.length) return null;
              
              const data = payload[0].payload as TemporalData;
              
              return (
                <div className="rounded-lg border border-border bg-popover p-3 shadow-lg">
                  <p className="mb-2 text-sm font-semibold text-foreground">{data.month}</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between gap-4">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="h-2 w-2 rounded-full bg-chart-1" />
                        Criados
                      </span>
                      <span className="font-semibold text-foreground">
                        {formatMoney(data.created)} ({data.createdCount})
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="h-2 w-2 rounded-full bg-accent-green" />
                        Aprovados
                      </span>
                      <span className="font-semibold text-accent-green">
                        {formatMoney(data.approved)} ({data.approvedCount})
                      </span>
                    </div>
                    {data.createdCount > 0 && (
                      <div className="mt-2 border-t border-border pt-1.5">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-muted-foreground">Taxa de conversão</span>
                          <span className="font-semibold">
                            {((data.approvedCount / data.createdCount) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            content={() => (
              <div className="flex items-center justify-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-sm bg-chart-1 opacity-50" />
                  <span className="text-muted-foreground">Orçamentos criados</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-sm bg-accent-green opacity-50" />
                  <span className="text-muted-foreground">Orçamentos aprovados</span>
                </div>
              </div>
            )}
          />
          <Area
            type="monotone"
            dataKey="created"
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorCreated)"
          />
          <Area
            type="monotone"
            dataKey="approved"
            stroke="hsl(var(--accent-green))"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#colorApproved)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
