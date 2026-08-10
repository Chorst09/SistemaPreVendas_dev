'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { NOCProjectData, NOCServiceLevel, NOCCoverage } from '@/lib/types/noc-pricing';
import { TrendingUp, Target, ShieldCheck, Info } from 'lucide-react';

interface ProjectTabProps {
  data: NOCProjectData;
  onChange: (data: NOCProjectData) => void;
  // Dados de cálculo para preview de margem (opcionais)
  calculations?: {
    monthlyTotalCost?: number;
    finalMonthlyPrice?: number;
    priceWithMargin?: number;
    profitability?: number;
  };
  variables?: {
    profitMargin: number;
    riskMargin: number;
  };
  onVariablesChange?: (variables: any) => void;
}

export function ProjectTab({ data, onChange, calculations, variables, onVariablesChange }: ProjectTabProps) {
  const handleChange = (field: keyof NOCProjectData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const fmtR = (v?: number) =>
    (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const totalMargin = (variables?.profitMargin ?? 0) + (variables?.riskMargin ?? 0);
  const custo = calculations?.monthlyTotalCost ?? 0;
  const precoFinal = calculations?.finalMonthlyPrice ?? 0;
  const lucroMensal = precoFinal - custo;

  const marginColor = totalMargin >= 30
    ? 'text-emerald-600 dark:text-emerald-400'
    : totalMargin >= 15
    ? 'text-amber-600 dark:text-amber-400'
    : 'text-red-600 dark:text-red-400';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projectName">Nome do Projeto *</Label>
              <Input
                id="projectName"
                value={data.projectName}
                onChange={(e) => handleChange('projectName', e.target.value)}
                placeholder="Ex: NOC/SOC/SIEM Empresa XYZ"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientName">Nome do Cliente *</Label>
              <Input
                id="clientName"
                value={data.clientName}
                onChange={(e) => handleChange('clientName', e.target.value)}
                placeholder="Ex: Empresa XYZ Ltda"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Data de Início *</Label>
              <Input
                id="startDate"
                type="date"
                value={data.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contractDuration">Duração do Contrato (meses) *</Label>
              <Select
                value={String(data.contractDuration || 12)}
                onValueChange={(value) => handleChange('contractDuration', parseInt(value, 10) || 12)}
              >
                <SelectTrigger id="contractDuration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12 meses</SelectItem>
                  <SelectItem value="24">24 meses</SelectItem>
                  <SelectItem value="36">36 meses</SelectItem>
                  <SelectItem value="48">48 meses</SelectItem>
                  <SelectItem value="60">60 meses</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Localização</Label>
              <Input
                id="location"
                value={data.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="Ex: São Paulo, Brasil"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Moeda</Label>
              <Select value={data.currency} onValueChange={(value) => handleChange('currency', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRL">BRL - Real Brasileiro</SelectItem>
                  <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuração do Serviço NOC/SOC/SIEM</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serviceLevel">Nível de Serviço *</Label>
              <Select value={data.serviceLevel} onValueChange={(value: NOCServiceLevel) => handleChange('serviceLevel', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">
                    <div className="flex flex-col">
                      <span className="font-medium">Básico</span>
                      <span className="text-xs text-gray-500">Monitoramento essencial</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="standard">
                    <div className="flex flex-col">
                      <span className="font-medium">Padrão</span>
                      <span className="text-xs text-gray-500">Monitoramento completo</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="advanced">
                    <div className="flex flex-col">
                      <span className="font-medium">Avançado</span>
                      <span className="text-xs text-gray-500">Monitoramento + Automação</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="premium">
                    <div className="flex flex-col">
                      <span className="font-medium">Premium</span>
                      <span className="text-xs text-gray-500">Monitoramento + IA + Predição</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverage">Cobertura de Atendimento *</Label>
              <Select value={data.coverage} onValueChange={(value: NOCCoverage) => handleChange('coverage', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="8x5">
                    <div className="flex flex-col">
                      <span className="font-medium">8x5</span>
                      <span className="text-xs text-gray-500">8h/dia, 5 dias/semana (comercial)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="12x5">
                    <div className="flex flex-col">
                      <span className="font-medium">12x5</span>
                      <span className="text-xs text-gray-500">12h/dia, 5 dias/semana</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="12x6">
                    <div className="flex flex-col">
                      <span className="font-medium">12x6</span>
                      <span className="text-xs text-gray-500">12h/dia, 6 dias/semana</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="24x5">
                    <div className="flex flex-col">
                      <span className="font-medium">24x5</span>
                      <span className="text-xs text-gray-500">24h/dia, 5 dias/semana</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="24x7">
                    <div className="flex flex-col">
                      <span className="font-medium">24x7</span>
                      <span className="text-xs text-gray-500">24h/dia, 7 dias/semana (ininterrupto)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Sobre os Níveis de Serviço</h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• <strong>Básico:</strong> Monitoramento essencial, alertas e operação NOC</li>
              <li>• <strong>Padrão:</strong> Monitoramento completo com métricas, SOC ou SIEM gerenciado</li>
              <li>• <strong>Avançado:</strong> Inclui automação, correlação, MDR e análise proativa</li>
              <li>• <strong>Premium:</strong> IA, threat hunting, resposta a incidente e otimização contínua</li>
            </ul>
          </div>
        </CardContent>
      </Card>
      {/* ── MARGEM DESEJADA ───────────────────────────────────────── */}
      {onVariablesChange && variables && (
        <Card className="border-border/80 bg-card/95">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <CardTitle className="text-foreground">Margem Desejada</CardTitle>
              <Badge variant="outline" className={`ml-auto text-sm font-bold px-3 py-1 ${marginColor} border-current`}>
                {totalMargin.toFixed(1)}% total
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Configure as margens de lucro e risco para compor o preço final.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Margem de Lucro */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                    Margem de Lucro (%)
                  </Label>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {(variables.profitMargin ?? 0).toFixed(1)}%
                  </span>
                </div>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={variables.profitMargin ?? 0}
                  onChange={e => onVariablesChange({ ...variables, profitMargin: parseFloat(e.target.value.replace(',', '.')) || 0 })}
                  className="h-10"
                />
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.min(variables.profitMargin, 100)}%` }} />
                </div>
                <p className="text-xs text-muted-foreground">Recomendado: 15% – 30%</p>
              </div>

              {/* Margem de Risco */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
                    Margem de Risco / Contingência (%)
                  </Label>
                  <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                    {(variables.riskMargin ?? 0).toFixed(1)}%
                  </span>
                </div>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={variables.riskMargin ?? 0}
                  onChange={e => onVariablesChange({ ...variables, riskMargin: parseFloat(e.target.value.replace(',', '.')) || 0 })}
                  className="h-10"
                />
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${Math.min(variables.riskMargin, 100)}%` }} />
                </div>
                <p className="text-xs text-muted-foreground">Recomendado: 5% – 15%</p>
              </div>
            </div>

            {/* Preview do impacto no preço */}
            {custo > 0 && (
              <div className="grid grid-cols-3 gap-3 rounded-xl border border-border bg-muted/30 p-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Custo Base/Mês</p>
                  <p className="text-base font-bold text-foreground">{fmtR(custo)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Margem Aplicada</p>
                  <p className={`text-base font-bold ${marginColor}`}>+{totalMargin.toFixed(1)}%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Preço Final/Mês</p>
                  <p className="text-base font-bold text-primary">{fmtR(precoFinal)}</p>
                </div>
              </div>
            )}

            {custo > 0 && lucroMensal > 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5">
                <TrendingUp className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-sm text-emerald-700 dark:text-emerald-300">
                  Lucro estimado: <strong>{fmtR(lucroMensal)}/mês</strong> · {fmtR(lucroMensal * (data.contractDuration || 12))} no contrato de {data.contractDuration || 12} meses
                </span>
              </div>
            )}

            <div className="flex items-start gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-2.5 text-xs text-blue-700 dark:text-blue-300">
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>As margens são aplicadas sobre o custo total mensal (equipe + operacional + licenças + segurança). O preço final considera também o preço mínimo de mercado.</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
