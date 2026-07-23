'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { MonitoringConfig, MonitoringTool } from '@/lib/types/noc-pricing';
import { Badge } from '@/components/ui/badge';

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
