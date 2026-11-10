'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { XCircle, DollarSign, Percent, TrendingDown } from 'lucide-react';
import { formatMoney } from '@/lib/dashboard';
import { cn } from '@/lib/utils';

export interface LossData {
  reason: string;
  count: number;
  value: number;
  percentage: number;
}

interface LossAnalysisChartProps {
  data: LossData[];
  totalLost: number;
  totalLostValue: number;
}

/**
 * LossAnalysisChart - Análise de perdas com motivos e valores
 * 
 * Exibe distribuição de orçamentos perdidos por motivo, identificando
 * padrões e oportunidades de melhoria no processo comercial.
 */
export function LossAnalysisChart({ data, totalLost, totalLostValue }: LossAnalysisChartProps) {
  if (data.length === 0 || totalLost === 0) {
    return (
      <div className="flex h-[350px] items-center justify-center rounded-lg border border-dashed border-border">
        <div className="text-center">
          <p className="text-sm font-medium text-accent-green">Sem perdas registradas!</p>
          <p className="text-xs text-muted-foreground">Continue o excelente trabalho</p>
        </div>
      </div>
    );
  }

  // Cores para diferentes motivos
  const COLORS = [
    'hsl(var(--destructive))',
    'hsl(var(--accent-orange))',
    'hsl(var(--accent-yellow))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-4))',
    'hsl(var(--muted-foreground))',
  ];

  const chartData = data.map((item, idx) => ({
    ...item,
    fill: COLORS[idx % COLORS.length],
  }));

  // Top 3 motivos
  const topReasons = [...data]
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Pie Chart */}
        <div className="flex flex-col items-center justify-center">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ percentage }) => `${percentage.toFixed(0)}%`}
                outerRadius={80}
                innerRadius={40}
                fill="#8884d8"
                dataKey="count"
                paddingAngle={2}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  
                  const data = payload[0].payload as LossData;
                  
                  return (
                    <div className="rounded-lg border border-border bg-popover p-3 shadow-lg">
                      <p className="mb-2 text-sm font-semibold text-foreground">{data.reason}</p>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-muted-foreground">Quantidade</span>
                          <span className="font-semibold text-foreground">{data.count}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-muted-foreground">Valor perdido</span>
                          <span className="font-semibold text-destructive">
                            {formatMoney(data.value)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-muted-foreground">% do total</span>
                          <span className="font-semibold text-foreground">
                            {data.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="mt-2 text-center">
            <p className="text-xs text-muted-foreground">Distribuição de perdas</p>
          </div>
        </div>

        {/* Legend & Stats */}
        <div className="space-y-3">
          {/* Summary Cards */}
          <div className="grid gap-2">
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-destructive" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Total de perdas</p>
                  <p className="text-xl font-bold text-destructive">{totalLost}</p>
                </div>
              </div>
            </div>
            
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-destructive" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Valor perdido</p>
                  <p className="text-xl font-bold text-destructive">
                    {formatMoney(totalLostValue)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Reasons */}
          <div className="rounded-lg border border-border bg-card p-3">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <TrendingDown className="h-4 w-4" />
              Top 3 Motivos
            </h4>
            
            <div className="space-y-2">
              {topReasons.map((reason, idx) => (
                <div
                  key={reason.reason}
                  className="flex items-center gap-3 rounded-md border border-border p-2"
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: COLORS[idx] }}
                  >
                    {idx + 1}
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {reason.reason}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {reason.count} orçamentos · {formatMoney(reason.value)}
                    </p>
                  </div>
                  
                  <div className="shrink-0 text-right">
                    <p className="text-lg font-bold text-foreground">
                      {reason.percentage.toFixed(0)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Full Legend */}
      <div className="rounded-lg border border-border bg-muted/30 p-3">
        <p className="mb-2 text-xs font-semibold text-muted-foreground">Todos os motivos</p>
        <div className="flex flex-wrap gap-2">
          {chartData.map((item) => (
            <div
              key={item.reason}
              className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 text-xs"
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.fill }}
              />
              <span className="text-foreground">{item.reason}</span>
              <span className="font-semibold text-muted-foreground">({item.count})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
