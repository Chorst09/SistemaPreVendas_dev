'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, Legend } from 'recharts';
import { Trophy, TrendingUp, Target } from 'lucide-react';
import { formatMoney } from '@/lib/dashboard';
import { cn } from '@/lib/utils';

export interface SalespersonData {
  name: string;
  approved: number;
  approvedValue: number;
  total: number;
  conversionRate: number;
  rank: number;
}

interface SalesPerformanceChartProps {
  data: SalespersonData[];
  metric: 'conversion' | 'volume';
}

/**
 * SalesPerformanceChart - Ranking de performance individual de vendedores
 * 
 * Exibe comparativo de performance com ranking visual, permitindo análise
 * por taxa de conversão ou volume de vendas. Incentiva competição saudável.
 */
export function SalesPerformanceChart({ data, metric }: SalesPerformanceChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[350px] items-center justify-center rounded-lg border border-dashed border-border">
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground">Sem dados de performance</p>
          <p className="text-xs text-muted-foreground">Aguardando atividade dos vendedores</p>
        </div>
      </div>
    );
  }

  // Top 5 por métrica selecionada
  const sortedData = [...data]
    .sort((a, b) => {
      if (metric === 'conversion') return b.conversionRate - a.conversionRate;
      return b.approvedValue - a.approvedValue;
    })
    .slice(0, 5);

  const chartData = sortedData.map((item, idx) => ({
    ...item,
    displayValue: metric === 'conversion' ? item.conversionRate : item.approvedValue / 1000, // k
    rank: idx + 1,
  }));

  // Cores por posição (ouro, prata, bronze, demais)
  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'hsl(var(--accent-yellow))'; // Ouro
      case 2: return 'hsl(var(--muted-foreground))'; // Prata
      case 3: return 'hsl(var(--accent-orange))'; // Bronze
      default: return 'hsl(var(--chart-1))';
    }
  };

  const avgValue = metric === 'conversion'
    ? data.reduce((sum, d) => sum + d.conversionRate, 0) / data.length
    : data.reduce((sum, d) => sum + d.approvedValue, 0) / data.length;

  return (
    <div className="space-y-4">
      {/* Podium - Top 3 */}
      <div className="grid grid-cols-3 gap-2">
        {chartData.slice(0, 3).map((person, idx) => {
          const position = idx + 1;
          const Icon = position === 1 ? Trophy : position === 2 ? TrendingUp : Target;
          
          return (
            <div
              key={person.name}
              className={cn(
                'relative rounded-lg border p-3 text-center transition-all',
                position === 1 && 'border-accent-yellow bg-accent-yellow/5',
                position === 2 && 'border-muted-foreground/30 bg-muted/30',
                position === 3 && 'border-accent-orange/50 bg-accent-orange/5'
              )}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <div
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                    position === 1 && 'bg-accent-yellow text-black',
                    position === 2 && 'bg-muted-foreground text-white',
                    position === 3 && 'bg-accent-orange text-white'
                  )}
                >
                  {position}
                </div>
              </div>
              
              <Icon
                className={cn(
                  'mx-auto mb-2 mt-2 h-6 w-6',
                  position === 1 && 'text-accent-yellow',
                  position === 2 && 'text-muted-foreground',
                  position === 3 && 'text-accent-orange'
                )}
              />
              
              <p className="mb-1 text-xs font-semibold text-foreground">{person.name}</p>
              
              <p className="text-lg font-bold text-foreground">
                {metric === 'conversion'
                  ? `${person.conversionRate.toFixed(1)}%`
                  : formatMoney(person.approvedValue)}
              </p>
              
              <p className="text-xs text-muted-foreground">
                {person.approved}/{person.total} aprovados
              </p>
            </div>
          );
        })}
      </div>

      {/* Bar Chart */}
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            width={60}
            tickFormatter={(value) =>
              metric === 'conversion'
                ? `${value}%`
                : new Intl.NumberFormat('pt-BR', {
                    notation: 'compact',
                    maximumFractionDigits: 0,
                  }).format(value * 1000)
            }
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload || !payload.length) return null;
              
              const data = payload[0].payload as SalespersonData & { rank: number };
              
              return (
                <div className="rounded-lg border border-border bg-popover p-3 shadow-lg">
                  <div className="mb-2 flex items-center gap-2">
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: getRankColor(data.rank) }}
                    >
                      {data.rank}
                    </div>
                    <p className="text-sm font-semibold text-foreground">{data.name}</p>
                  </div>
                  
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Taxa de conversão</span>
                      <span className="font-semibold text-foreground">
                        {data.conversionRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Valor aprovado</span>
                      <span className="font-semibold text-accent-green">
                        {formatMoney(data.approvedValue)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Orçamentos</span>
                      <span className="font-semibold text-foreground">
                        {data.approved}/{data.total}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }}
          />
          <Bar dataKey="displayValue" radius={[6, 6, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getRankColor(entry.rank)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Stats Summary */}
      <div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-3 md:grid-cols-3">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Média do time</p>
          <p className="text-lg font-bold text-foreground">
            {metric === 'conversion'
              ? `${avgValue.toFixed(1)}%`
              : formatMoney(avgValue)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Melhor performance</p>
          <p className="text-lg font-bold text-accent-green">
            {metric === 'conversion'
              ? `${chartData[0]?.conversionRate.toFixed(1)}%`
              : formatMoney(chartData[0]?.approvedValue || 0)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Total vendedores</p>
          <p className="text-lg font-bold text-foreground">{data.length}</p>
        </div>
      </div>
    </div>
  );
}
