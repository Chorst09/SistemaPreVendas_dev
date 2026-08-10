'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { MonitoringConfig, MonitoringTool, ToolLicenseConfig } from '@/lib/types/noc-pricing';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Trash2, ChevronDown, ChevronUp, Plus, Info } from 'lucide-react';

interface MonitoringTabProps {
  data: MonitoringConfig;
  onChange: (data: MonitoringConfig) => void;
}

const MONITORING_TOOLS: { value: MonitoringTool; label: string; type: 'open-source' | 'commercial' | 'saas' }[] = [
  { value: 'zabbix', label: 'Zabbix', type: 'open-source' },
  { value: 'nagios', label: 'Nagios', type: 'open-source' },
  { value: 'prometheus', label: 'Prometheus', type: 'open-source' },
  { value: 'grafana', label: 'Grafana', type: 'open-source' },
  { value: 'prtg', label: 'PRTG Network Monitor', type: 'commercial' },
  { value: 'solarwinds', label: 'SolarWinds', type: 'commercial' },
  { value: 'datadog', label: 'Datadog', type: 'saas' },
  { value: 'new-relic', label: 'New Relic', type: 'saas' },
  { value: 'dynatrace', label: 'Dynatrace', type: 'saas' },
  { value: 'sentinel', label: 'Microsoft Sentinel', type: 'saas' },
  { value: 'splunk', label: 'Splunk', type: 'saas' },
  { value: 'elastic', label: 'Elastic Stack', type: 'saas' },
  { value: 'qradar', label: 'IBM QRadar', type: 'commercial' },
  { value: 'crowdstrike', label: 'CrowdStrike Falcon', type: 'saas' },
  { value: 'defender', label: 'Microsoft Defender', type: 'saas' },
  { value: 'custom', label: 'Customizado', type: 'commercial' }
];

const ALERT_CHANNELS = [
  { value: 'email', label: 'E-mail' },
  { value: 'sms', label: 'SMS' },
  { value: 'slack', label: 'Slack' },
  { value: 'teams', label: 'Microsoft Teams' },
  { value: 'webhook', label: 'Webhook' }
];

export function MonitoringTab({ data, onChange }: MonitoringTabProps) {
  const [expandedLicenses, setExpandedLicenses] = useState<Record<string, boolean>>({});

  const toggleLicenseExpand = (tool: string) =>
    setExpandedLicenses(prev => ({ ...prev, [tool]: !prev[tool] }));

  const toolLicenses: ToolLicenseConfig[] = data.toolLicenses ?? [];

  const getLicense = (tool: MonitoringTool): ToolLicenseConfig | undefined =>
    toolLicenses.find(l => l.tool === tool);

  const updateLicense = (tool: MonitoringTool, patch: Partial<ToolLicenseConfig>) => {
    const existing = getLicense(tool);
    const base: ToolLicenseConfig = existing ?? {
      tool,
      licenseType: 'flat-rate',
      quantity: 1,
      unitCost: 0,
      billingCycle: 'monthly',
    };
    const updated = toolLicenses.some(l => l.tool === tool)
      ? toolLicenses.map(l => l.tool === tool ? { ...l, ...patch } : l)
      : [...toolLicenses, { ...base, ...patch }];
    onChange({ ...data, toolLicenses: updated });
  };

  const removeLicense = (tool: MonitoringTool) => {
    onChange({ ...data, toolLicenses: toolLicenses.filter(l => l.tool !== tool) });
  };

  // Custo mensal total das licenças cadastradas
  const totalLicenseCost = toolLicenses.reduce((sum, l) => {
    const monthly = l.billingCycle === 'annual' ? (l.unitCost / 12) : l.unitCost;
    return sum + (l.licenseType === 'flat-rate' ? monthly : monthly * (l.quantity || 1));
  }, 0);

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const handleToolToggle = (tool: MonitoringTool) => {
    const tools = data.tools.includes(tool)
      ? data.tools.filter(t => t !== tool)
      : [...data.tools, tool];
    onChange({ ...data, tools });
  };

  const handleChannelToggle = (channel: any) => {
    const channels = data.alertChannels.includes(channel)
      ? data.alertChannels.filter(c => c !== channel)
      : [...data.alertChannels, channel];
    onChange({ ...data, alertChannels: channels });
  };

  const getToolTypeBadgeClass = (type: 'open-source' | 'commercial' | 'saas', isSelected: boolean) => {
    if (type === 'open-source') {
      return isSelected
        ? 'border-emerald-600/60 bg-emerald-500/20 text-emerald-900 dark:text-emerald-200'
        : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200';
    }

    if (type === 'commercial') {
      return isSelected
        ? 'border-amber-600/60 bg-amber-500/20 text-amber-900 dark:text-amber-200'
        : 'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200';
    }

    return isSelected
      ? 'border-violet-600/60 bg-violet-500/20 text-violet-900 dark:text-violet-200'
      : 'border-violet-500/40 bg-violet-500/10 text-violet-800 dark:text-violet-200';
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/80 bg-card/95">
        <CardHeader>
          <CardTitle className="text-foreground">Ferramentas de Monitoramento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MONITORING_TOOLS.map((tool) => {
                const isSelected = data.tools.includes(tool.value);
                return (
                  <div
                    key={tool.value}
                    className={`border rounded-xl p-4 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-emerald-500/60 bg-gradient-to-br from-emerald-500/20 via-emerald-500/12 to-transparent shadow-[0_12px_30px_-18px_rgba(16,185,129,0.7)]'
                        : 'border-slate-300/80 bg-card/95 hover:border-blue-500/45 hover:bg-blue-500/10'
                    }`}
                    onClick={() => handleToolToggle(tool.value)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleToolToggle(tool.value)}
                          />
                          <span className={`font-semibold ${isSelected ? 'text-emerald-900 dark:text-emerald-200' : 'text-foreground'}`}>
                            {tool.label}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className={`mt-2 text-xs ${getToolTypeBadgeClass(tool.type, isSelected)}`}
                        >
                          {tool.type === 'open-source' ? 'Open Source' :
                           tool.type === 'commercial' ? 'Comercial' : 'SaaS'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="bg-gradient-to-r from-blue-500/16 via-cyan-500/10 to-transparent border border-blue-500/35 rounded-xl p-4 mt-4">
            <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">Ferramentas Selecionadas</h4>
            <p className="text-sm text-blue-900/85 dark:text-blue-200/90">
              {data.tools.length === 0 ? 'Nenhuma ferramenta selecionada' :
               `${data.tools.length} ferramenta(s): ${data.tools.map(t => 
                 MONITORING_TOOLS.find(mt => mt.value === t)?.label
               ).join(', ')}`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── LICENCIAMENTO DE SOFTWARE ────────────────────────────────────────── */}
      <Card className="border-border/80 bg-card/95">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-500" />
              <CardTitle className="text-foreground">Licenciamento de Software</CardTitle>
            </div>
            {totalLicenseCost > 0 && (
              <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-sm font-semibold px-3 py-1">
                Total: {fmt(totalLicenseCost)}/mês
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Informe o valor real de cada licença para um cálculo preciso dos custos operacionais.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.tools.length === 0 ? (
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-border p-6 text-center justify-center text-muted-foreground text-sm">
              <Info className="h-4 w-4" />
              Selecione ferramentas acima para cadastrar seus custos de licença.
            </div>
          ) : (
            <div className="space-y-2">
              {data.tools.map(toolValue => {
                const toolMeta = MONITORING_TOOLS.find(t => t.value === toolValue);
                const license = getLicense(toolValue);
                const isExpanded = expandedLicenses[toolValue] ?? false;
                const monthly = license
                  ? (license.billingCycle === 'annual' ? license.unitCost / 12 : license.unitCost) *
                    (license.licenseType === 'flat-rate' ? 1 : (license.quantity || 1))
                  : 0;

                return (
                  <div key={toolValue} className={`rounded-xl border transition-all ${license?.unitCost ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-border bg-card/60'}`}>
                    {/* Header do item */}
                    <div className="flex items-center justify-between px-4 py-3 cursor-pointer"
                      onClick={() => toggleLicenseExpand(toolValue)}>
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${license?.unitCost ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
                        <span className="font-medium text-foreground text-sm">{toolMeta?.label}</span>
                        <Badge variant="outline" className={`text-[10px] ${getToolTypeBadgeClass(toolMeta?.type ?? 'commercial', false)}`}>
                          {toolMeta?.type === 'open-source' ? 'Open Source' : toolMeta?.type === 'commercial' ? 'Comercial' : 'SaaS'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {license?.unitCost ? (
                          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{fmt(monthly)}/mês</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sem custo cadastrado</span>
                        )}
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </div>

                    {/* Painel expandido */}
                    {isExpanded && (
                      <div className="border-t border-border/50 px-4 pb-4 pt-3 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          {/* Tipo de licença */}
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Tipo de Licença</Label>
                            <Select
                              value={license?.licenseType ?? 'flat-rate'}
                              onValueChange={v => updateLicense(toolValue, { licenseType: v as any })}
                            >
                              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="flat-rate">Valor Fixo (Flat Rate)</SelectItem>
                                <SelectItem value="per-device">Por Dispositivo</SelectItem>
                                <SelectItem value="per-user">Por Usuário</SelectItem>
                                <SelectItem value="per-metric">Por Métrica</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Quantidade (oculto para flat-rate) */}
                          {(license?.licenseType ?? 'flat-rate') !== 'flat-rate' && (
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">
                                Quantidade ({license?.licenseType === 'per-device' ? 'dispositivos' : license?.licenseType === 'per-user' ? 'usuários' : 'métricas'})
                              </Label>
                              <Input
                                type="number"
                                min={1}
                                className="h-9 text-sm"
                                value={license?.quantity ?? 1}
                                onChange={e => updateLicense(toolValue, { quantity: parseInt(e.target.value) || 1 })}
                              />
                            </div>
                          )}

                          {/* Custo unitário */}
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">
                              {(license?.licenseType ?? 'flat-rate') === 'flat-rate' ? 'Custo Total' : 'Custo Unitário'} (R$)
                            </Label>
                            <Input
                              type="number"
                              min={0}
                              step={0.01}
                              className="h-9 text-sm"
                              value={license?.unitCost ?? ''}
                              placeholder="0,00"
                              onChange={e => updateLicense(toolValue, { unitCost: parseFloat(e.target.value.replace(',', '.')) || 0 })}
                            />
                          </div>

                          {/* Ciclo de cobrança */}
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Ciclo de Cobrança</Label>
                            <Select
                              value={license?.billingCycle ?? 'monthly'}
                              onValueChange={v => updateLicense(toolValue, { billingCycle: v as any })}
                            >
                              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="monthly">Mensal</SelectItem>
                                <SelectItem value="annual">Anual (÷12)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Fornecedor */}
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Fornecedor / Distribuidor</Label>
                            <Input
                              className="h-9 text-sm"
                              placeholder="Ex: AWS Marketplace, Microsoft..."
                              value={license?.vendor ?? ''}
                              onChange={e => updateLicense(toolValue, { vendor: e.target.value })}
                            />
                          </div>

                          {/* Observações */}
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Observações</Label>
                            <Input
                              className="h-9 text-sm"
                              placeholder="Ex: inclui suporte, contrato anual..."
                              value={license?.notes ?? ''}
                              onChange={e => updateLicense(toolValue, { notes: e.target.value })}
                            />
                          </div>
                        </div>

                        {/* Resumo de custo */}
                        {license?.unitCost ? (
                          <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5">
                            <span className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">Custo mensal desta licença</span>
                            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">{fmt(monthly)}</span>
                          </div>
                        ) : null}

                        {license && (
                          <div className="flex justify-end">
                            <Button size="sm" variant="ghost"
                              className="text-xs text-muted-foreground hover:text-destructive"
                              onClick={() => removeLicense(toolValue)}>
                              <Trash2 className="h-3.5 w-3.5 mr-1" /> Remover licença
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Resumo total */}
          {totalLicenseCost > 0 && (
            <div className="mt-2 rounded-xl border border-emerald-500/40 bg-gradient-to-r from-emerald-500/15 to-teal-500/10 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Total de Licenças de Software</p>
                <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
                  {toolLicenses.filter(l => l.unitCost > 0).length} ferramenta(s) com custo cadastrado
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{fmt(totalLicenseCost)}</p>
                <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">por mês</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 rounded-xl border border-blue-500/25 bg-blue-500/5 px-4 py-3 text-xs text-blue-700 dark:text-blue-300">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>Os valores de licença cadastrados aqui entram diretamente no cálculo do custo operacional mensal do NOC, substituindo a estimativa automática por ferramenta.</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/95">
        <CardHeader>
          <CardTitle className="text-foreground">Configurações de Alertas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-foreground">Canais de Alerta</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {ALERT_CHANNELS.map((channel) => {
                  const isSelected = data.alertChannels.includes(channel.value as any);
                  return (
                    <div
                      key={channel.value}
                      className={`border rounded-lg p-3 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500/55 bg-blue-500/15 shadow-[0_10px_24px_-16px_rgba(59,130,246,0.7)]'
                          : 'border-slate-300/80 bg-card/95 hover:border-blue-500/45 hover:bg-blue-500/10'
                      }`}
                      onClick={() => handleChannelToggle(channel.value)}
                    >
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleChannelToggle(channel.value)}
                        />
                        <span className={`text-sm font-semibold ${
                          isSelected
                            ? 'text-blue-900 dark:text-blue-200'
                            : 'text-foreground'
                        }`}>
                          {channel.label}
                        </span>
                      </div>
                    </div>
                );
                })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/95">
        <CardHeader>
          <CardTitle className="text-foreground">Dashboards e Relatórios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-foreground">Dashboards Personalizados</Label>
              <Input
                type="number"
                min="0"
                value={data.customDashboards}
                onChange={(e) => onChange({ ...data, customDashboards: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">Número de dashboards customizados</p>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Relatórios Customizados</Label>
              <Input
                type="number"
                min="0"
                value={data.customReports}
                onChange={(e) => onChange({ ...data, customReports: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">Número de relatórios personalizados</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              checked={data.reportingEnabled}
              onCheckedChange={(checked) => onChange({ ...data, reportingEnabled: checked as boolean })}
            />
            <Label className="text-foreground">Habilitar sistema de relatórios automáticos</Label>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/95">
        <CardHeader>
          <CardTitle className="text-foreground">Automação e IA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-foreground">Nível de Automação</Label>
            <Select
              value={data.automationLevel}
              onValueChange={(value: any) => onChange({ ...data, automationLevel: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <div className="flex flex-col">
                    <span className="font-medium">Nenhuma</span>
                    <span className="text-xs text-muted-foreground">Apenas alertas manuais</span>
                  </div>
                </SelectItem>
                <SelectItem value="basic">
                  <div className="flex flex-col">
                    <span className="font-medium">Básica</span>
                    <span className="text-xs text-muted-foreground">Respostas automáticas simples</span>
                  </div>
                </SelectItem>
                <SelectItem value="advanced">
                  <div className="flex flex-col">
                    <span className="font-medium">Avançada</span>
                    <span className="text-xs text-muted-foreground">Automação de processos complexos</span>
                  </div>
                </SelectItem>
                <SelectItem value="full">
                  <div className="flex flex-col">
                    <span className="font-medium">Completa</span>
                    <span className="text-xs text-muted-foreground">Auto-remediação e orquestração</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              checked={data.aiEnabled}
              onCheckedChange={(checked) => onChange({ ...data, aiEnabled: checked as boolean })}
            />
            <div className="flex-1">
              <Label className="text-foreground">Habilitar IA para Predição de Falhas</Label>
              <p className="text-xs text-muted-foreground">
                Machine Learning para análise preditiva e detecção de anomalias
              </p>
            </div>
          </div>

          {data.aiEnabled && (
            <div className="bg-gradient-to-r from-violet-500/18 via-fuchsia-500/10 to-transparent border border-violet-500/40 rounded-xl p-4">
              <h4 className="font-semibold text-violet-900 dark:text-violet-200 mb-2">Recursos de IA Inclusos</h4>
              <ul className="text-sm text-violet-900/90 dark:text-violet-200/90 space-y-1">
                <li>• Predição de falhas antes que ocorram</li>
                <li>• Detecção de anomalias em tempo real</li>
                <li>• Análise de tendências e padrões</li>
                <li>• Recomendações automáticas de otimização</li>
                <li>• Correlação inteligente de eventos</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
