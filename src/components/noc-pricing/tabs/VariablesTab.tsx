'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, ShieldCheck, DollarSign, BarChart3, Info, AlertTriangle } from 'lucide-react';

interface VariablesTabProps {
  data: {
    inflationRate: number;
    dollarRate: number;
    profitMargin: number;
    riskMargin: number;
  };
  calculations?: {
    monthlyTotalCost?: number;
    finalMonthlyPrice?: number;
    priceWithMargin?: number;
    priceWithTaxes?: number;
    profitability?: number;
    roi?: number;
    annualTotalCost?: number;
  };
  onChange: (data: any) => void;
}

export function VariablesTab({ data, calculations, onChange }: VariablesTabProps) {
  const handleChange = (field: string, value: number) => {
    onChange({ ...data, [field]: value });
  };

  const totalMargin = (data.profitMargin ?? 0) + (data.riskMargin ?? 0);

  const fmtR = (v?: number) =>
    (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const fmtPct = (v?: number) => `${(v ?? 0).toFixed(1)}%`;

  const custo        = calculations?.monthlyTotalCost ?? 0;
  const precoMargem  = calculations?.priceWithMargin ?? 0;
  const precoImpost  = calculations?.priceWithTaxes ?? 0;
  const precoFinal   = calculations?.finalMonthlyPrice ?? 0;
  const lucro        = precoFinal - custo;
  const lucroMargem  = custo * (totalMargin / 100);

  const marginStatus = totalMargin >= 30 ? 'ok' : totalMargin >= 15 ? 'warn' : 'low';
  const marginColor  = marginStatus === 'ok'
    ? 'text-emerald-600 dark:text-emerald-400'
    : marginStatus === 'warn'
    ? 'text-amber-600 dark:text-amber-400'
    : 'text-red-600 dark:text-red-400';
  const marginBg = marginStatus === 'ok'
    ? 'bg-emerald-500/10 border-emerald-500/30'
    : marginStatus === 'warn'
    ? 'bg-amber-500/10 border-amber-500/30'
    : 'bg-red-500/10 border-red-500/30';

  return (
    <div className="space-y-6">

      {/* ── Margens ──────────────────────────────────────────────────────── */}
      <Card className="border-border/80 bg-card/95">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle className="text-foreground">Margens de Precificação</CardTitle>
            </div>
            <Badge variant="outline" className={`${marginColor} border-current font-bold px-3 py-1`}>
              {fmtPct(totalMargin)} total
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Margem de Lucro */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5 text-sm font-medium">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                  Margem de Lucro (%)
                </Label>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {fmtPct(data.profitMargin)}
                </span>
              </div>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={data.profitMargin}
                onChange={e => handleChange('profitMargin', parseFloat(e.target.value.replace(',', '.')) || 0)}
                className="h-10"
              />
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(data.profitMargin ?? 0, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">Recomendado para NOC: <strong>15% – 30%</strong></p>
            </div>

            {/* Margem de Risco */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5 text-sm font-medium">
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
                  Margem de Risco / Contingência (%)
                </Label>
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                  {fmtPct(data.riskMargin)}
                </span>
              </div>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={data.riskMargin}
                onChange={e => handleChange('riskMargin', parseFloat(e.target.value.replace(',', '.')) || 0)}
                className="h-10"
              />
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(data.riskMargin ?? 0, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">Recomendado: <strong>5% – 15%</strong></p>
            </div>
          </div>

          {/* Indicador de margem total */}
          <div className={`rounded-xl border p-4 ${marginBg}`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-sm font-semibold ${marginColor}`}>Margem Total Combinada</span>
              <span className={`text-2xl font-bold ${marginColor}`}>{fmtPct(totalMargin)}</span>
            </div>
            <div className="h-3 w-full bg-muted/60 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  marginStatus === 'ok' ? 'bg-emerald-500' : marginStatus === 'warn' ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(totalMargin, 60) / 60 * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>0%</span><span>15%</span><span>30%</span><span>45%</span><span>60%</span>
            </div>
            {marginStatus === 'low' && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-red-600 dark:text-red-400">
                <AlertTriangle className="h-3.5 w-3.5" />
                Margem abaixo do recomendado — risco de prejuízo em imprevistos
              </div>
            )}
          </div>

          {/* Decomposição do cálculo */}
          {custo > 0 && (
            <div className="rounded-xl border border-border bg-muted/20 overflow-hidden">
              <div className="px-4 py-2.5 bg-muted/40 border-b border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Decomposição do Preço Mensal</p>
              </div>
              <div className="divide-y divide-border/50">
                {[
                  { label: 'Custo Base Mensal',        value: custo,       sub: 'Equipe + Operacional + Licenças + Segurança',  color: 'text-foreground' },
                  { label: `+ Margem (${fmtPct(totalMargin)})`, value: lucroMargem, sub: `${fmtPct(data.profitMargin)} lucro + ${fmtPct(data.riskMargin)} risco`, color: 'text-emerald-600 dark:text-emerald-400' },
                  { label: '= Preço com Margens',       value: precoMargem, sub: 'Base × (1 + margem)',                          color: 'text-blue-600 dark:text-blue-400' },
                  { label: '÷ (1 - impostos)',          value: precoImpost, sub: 'Impostos aplicados por dentro',                color: 'text-amber-600 dark:text-amber-400' },
                  { label: '= Preço Final Sugerido',    value: precoFinal,  sub: 'Máximo entre preço calculado e mercado',       color: 'text-primary font-bold' },
                ].map((row, i) => (
                  <div key={i} className={`flex items-center justify-between px-4 py-2.5 ${i === 4 ? 'bg-primary/5' : ''}`}>
                    <div>
                      <p className={`text-sm font-medium ${row.color}`}>{row.label}</p>
                      <p className="text-[11px] text-muted-foreground">{row.sub}</p>
                    </div>
                    <span className={`text-sm font-bold font-mono ${row.color}`}>{fmtR(row.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Variáveis Econômicas ─────────────────────────────────────────── */}
      <Card className="border-border/80 bg-card/95">
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-cyan-500" />
            <CardTitle className="text-foreground">Variáveis Econômicas</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Taxa de Inflação Anual (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={data.inflationRate}
                onChange={e => handleChange('inflationRate', parseFloat(e.target.value.replace(',', '.')) || 0)}
                className="h-10"
              />
              <p className="text-xs text-muted-foreground">
                Inflação projetada para o período do contrato. Usada para reajuste anual.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Cotação do Dólar (R$)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={data.dollarRate}
                onChange={e => handleChange('dollarRate', parseFloat(e.target.value.replace(',', '.')) || 0)}
                className="h-10"
              />
              <p className="text-xs text-muted-foreground">
                Taxa de câmbio de referência para licenças e serviços em USD.
              </p>
            </div>
          </div>

          {(data.inflationRate > 0 || data.dollarRate > 0) && custo > 0 && (
            <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Impacto no Contrato</p>
              {data.inflationRate > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Reajuste anual estimado ({fmtPct(data.inflationRate)} IGP-M/IPCA)</span>
                  <span className="font-semibold text-foreground">+ {fmtR(precoFinal * data.inflationRate / 100)}/mês (ano 2)</span>
                </div>
              )}
              {data.dollarRate > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Exposição cambial (~20% dos custos em USD)</span>
                  <span className="font-semibold text-foreground">{fmtR(custo * 0.2)} · USD {(custo * 0.2 / data.dollarRate).toFixed(0)}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Benchmarks de Mercado ────────────────────────────────────────── */}
      <Card className="border-border/80 bg-card/95">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-500" />
            <CardTitle className="text-foreground">Referências de Mercado</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: 'Margem de Lucro Típica — NOC',         ref: '15% – 30%',   mine: data.profitMargin, ok: data.profitMargin >= 15 && data.profitMargin <= 35 },
            { label: 'Margem de Risco Recomendada',          ref: '5% – 15%',    mine: data.riskMargin,   ok: data.riskMargin >= 5 && data.riskMargin <= 20 },
            { label: 'Margem Total Competitiva',             ref: '20% – 40%',   mine: totalMargin,       ok: totalMargin >= 20 && totalMargin <= 45 },
            { label: 'Inflação Anual (referência IPCA 2025)', ref: '4% – 6%',    mine: data.inflationRate, ok: true },
          ].map((item, i) => (
            <div key={i} className={`flex items-center justify-between rounded-lg border p-3 ${
              item.ok
                ? 'border-emerald-500/20 bg-emerald-500/5'
                : 'border-amber-500/20 bg-amber-500/5'
            }`}>
              <div className="flex items-center gap-2 min-w-0">
                <span className={`text-[10px] font-bold ${item.ok ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {item.ok ? '✓' : '⚠'}
                </span>
                <span className="text-sm text-foreground">{item.label}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-2">
                <span className="text-xs text-muted-foreground">{item.ref}</span>
                <Badge variant="outline" className={`text-xs ${item.ok ? 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400' : 'border-amber-500/40 text-amber-600 dark:text-amber-400'}`}>
                  Atual: {fmtPct(item.mine)}
                </Badge>
              </div>
            </div>
          ))}

          <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/10 px-3 py-2.5 text-xs text-muted-foreground mt-1">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>Valores de referência para serviços de NOC/SOC/SIEM no mercado brasileiro. Ajuste conforme o perfil de risco, complexidade e posicionamento competitivo.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
