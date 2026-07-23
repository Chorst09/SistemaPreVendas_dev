'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Shield, Database, Search, Siren } from 'lucide-react';
import { NOCSecurityServices, NOCServiceScope, SIEMPlatform } from '@/lib/types/noc-pricing';

interface SecurityTabProps {
  data: NOCSecurityServices;
  currency: string;
  mode: Exclude<NOCServiceScope, 'noc'>;
  onChange: (data: NOCSecurityServices) => void;
}

const toNumber = (value: string) => Number.isFinite(Number(value)) ? Number(value) : 0;

export function SecurityTab({ data, currency, mode, onChange }: SecurityTabProps) {
  const enabledServices = data.enabledServices || ['noc'];
  const socAssets = (data.soc.endpoints || 0) + (data.soc.servers || 0) + (data.soc.networkDevices || 0) + (data.soc.cloudWorkloads || 0) + (data.soc.identities || 0);
  const billableGB = Math.max(0, (data.siem.ingestionGBPerDay || 0) - (data.siem.includedGBPerDay || 0));
  const estimatedSOC = Math.max(data.soc.minimumMonthly || 0, socAssets * (data.soc.pricePerAsset || 0));
  const estimatedSIEM = (data.siem.baseMonthly || 0) + (billableGB * 30 * (data.siem.pricePerGBIngested || 0));

  const updateServices = (service: NOCServiceScope, checked: boolean) => {
    const nextServices = checked
      ? Array.from(new Set([...enabledServices, service]))
      : enabledServices.filter(item => item !== service);

    onChange({
      ...data,
      enabledServices: nextServices,
      soc: service === 'soc' ? { ...data.soc, enabled: checked } : data.soc,
      siem: service === 'siem' ? { ...data.siem, enabled: checked } : data.siem
    });
  };

  const updateSOC = (field: keyof NOCSecurityServices['soc'], value: any) => {
    const nextSOC = { ...data.soc, [field]: value };
    onChange({
      ...data,
      enabledServices: nextSOC.enabled ? Array.from(new Set([...enabledServices, 'soc'])) : enabledServices.filter(item => item !== 'soc'),
      soc: nextSOC
    });
  };

  const updateSIEM = (field: keyof NOCSecurityServices['siem'], value: any) => {
    const nextSIEM = { ...data.siem, [field]: value };
    onChange({
      ...data,
      enabledServices: nextSIEM.enabled ? Array.from(new Set([...enabledServices, 'siem'])) : enabledServices.filter(item => item !== 'siem'),
      siem: nextSIEM
    });
  };

  const updateSetup = (field: keyof NOCSecurityServices['setup'], value: number) => {
    onChange({ ...data, setup: { ...data.setup, [field]: value } });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            Calculadora {mode.toUpperCase()}
          </CardTitle>
        </CardHeader>
        <CardContent className="rounded-lg border border-blue-300/20 bg-slate-900/40 p-4 text-sm text-blue-100">
          {mode === 'soc'
            ? 'Precificação dedicada de SOC por ativos protegidos, MDR, hunting, triagem e resposta a incidentes.'
            : 'Precificação dedicada de SIEM por ingestão de logs, retenção, plataforma, fontes, regras e parsers.'}
        </CardContent>
      </Card>

      {mode === 'soc' && <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <Siren className="h-5 w-5 text-cyan-400" />
              Precificação SOC
            </CardTitle>
            <Badge variant="outline">{socAssets} ativos</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              ['endpoints', 'Endpoints'],
              ['servers', 'Servidores'],
              ['networkDevices', 'Dispositivos de rede'],
              ['cloudWorkloads', 'Workloads cloud'],
              ['identities', 'Identidades'],
              ['users', 'Usuários atendidos']
            ].map(([field, label]) => (
              <div key={field} className="space-y-2">
                <Label>{label}</Label>
                <Input
                  type="number"
                  min={0}
                  value={(data.soc as any)[field]}
                  onChange={(event) => updateSOC(field as any, toNumber(event.target.value))}
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Preço SOC por ativo/mês ({currency})</Label>
              <Input type="number" min={0} value={data.soc.pricePerAsset} onChange={(event) => updateSOC('pricePerAsset', toNumber(event.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Piso mensal SOC ({currency})</Label>
              <Input type="number" min={0} value={data.soc.minimumMonthly} onChange={(event) => updateSOC('minimumMonthly', toNumber(event.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Hora analista ({currency})</Label>
              <Input type="number" min={0} value={data.soc.analystHourRate} onChange={(event) => updateSOC('analystHourRate', toNumber(event.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Threat hunting/mês (h)</Label>
              <Input type="number" min={0} value={data.soc.threatHuntingHours} onChange={(event) => updateSOC('threatHuntingHours', toNumber(event.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Resposta a incidente/mês (h)</Label>
              <Input type="number" min={0} value={data.soc.incidentResponseHours} onChange={(event) => updateSOC('incidentResponseHours', toNumber(event.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Relatórios compliance/mês</Label>
              <Input type="number" min={0} value={data.soc.complianceReports} onChange={(event) => updateSOC('complianceReports', toNumber(event.target.value))} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center gap-3 rounded-lg border border-blue-300/20 bg-slate-900/40 p-3">
              <Checkbox checked={data.soc.mdrEnabled} onCheckedChange={(checked) => updateSOC('mdrEnabled', checked === true)} />
              <span>MDR 24x7 incluso</span>
            </label>
            <label className="flex items-center gap-3 rounded-lg border border-blue-300/20 bg-slate-900/40 p-3">
              <Checkbox checked={data.soc.vulnerabilityTriage} onCheckedChange={(checked) => updateSOC('vulnerabilityTriage', checked === true)} />
              <span>Triagem de vulnerabilidades</span>
            </label>
          </div>

          <div className="rounded-lg border border-cyan-300/20 bg-cyan-950/30 p-4 text-sm text-cyan-100">
            Estimativa SOC antes de margens/impostos: <strong>{currency} {estimatedSOC.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês</strong>
          </div>
        </CardContent>
      </Card>}

      {mode === 'siem' && <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-400" />
              Precificação SIEM
            </CardTitle>
            <Badge variant="outline">{data.siem.ingestionGBPerDay || 0} GB/dia</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Plataforma SIEM</Label>
              <Select value={data.siem.platform} onValueChange={(value: SIEMPlatform) => updateSIEM('platform', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sentinel">Microsoft Sentinel</SelectItem>
                  <SelectItem value="splunk">Splunk</SelectItem>
                  <SelectItem value="elastic">Elastic Security</SelectItem>
                  <SelectItem value="qradar">IBM QRadar</SelectItem>
                  <SelectItem value="google-secops">Google SecOps</SelectItem>
                  <SelectItem value="custom">Customizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ingestão total (GB/dia)</Label>
              <Input type="number" min={0} value={data.siem.ingestionGBPerDay} onChange={(event) => updateSIEM('ingestionGBPerDay', toNumber(event.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>GB/dia incluído na base</Label>
              <Input type="number" min={0} value={data.siem.includedGBPerDay} onChange={(event) => updateSIEM('includedGBPerDay', toNumber(event.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Base mensal SIEM ({currency})</Label>
              <Input type="number" min={0} value={data.siem.baseMonthly} onChange={(event) => updateSIEM('baseMonthly', toNumber(event.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Preço por GB ingerido ({currency})</Label>
              <Input type="number" min={0} value={data.siem.pricePerGBIngested} onChange={(event) => updateSIEM('pricePerGBIngested', toNumber(event.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Retenção quente (dias)</Label>
              <Input type="number" min={0} value={data.siem.retentionHotDays} onChange={(event) => updateSIEM('retentionHotDays', toNumber(event.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Retenção arquivo (meses)</Label>
              <Input type="number" min={0} value={data.siem.retentionArchiveMonths} onChange={(event) => updateSIEM('retentionArchiveMonths', toNumber(event.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Fontes de log</Label>
              <Input type="number" min={0} value={data.siem.logSources} onChange={(event) => updateSIEM('logSources', toNumber(event.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Regras de correlação</Label>
              <Input type="number" min={0} value={data.siem.correlationRules} onChange={(event) => updateSIEM('correlationRules', toNumber(event.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Parsers customizados</Label>
              <Input type="number" min={0} value={data.siem.customParsers} onChange={(event) => updateSIEM('customParsers', toNumber(event.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Custo regra/mês ({currency})</Label>
              <Input type="number" min={0} value={data.siem.ruleMonthlyCost} onChange={(event) => updateSIEM('ruleMonthlyCost', toNumber(event.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Custo parser/mês ({currency})</Label>
              <Input type="number" min={0} value={data.siem.parserMonthlyCost} onChange={(event) => updateSIEM('parserMonthlyCost', toNumber(event.target.value))} />
            </div>
          </div>

          <label className="flex items-center gap-3 rounded-lg border border-blue-300/20 bg-slate-900/40 p-3">
            <Checkbox checked={data.siem.dataLakeEnabled} onCheckedChange={(checked) => updateSIEM('dataLakeEnabled', checked === true)} />
            <span>Usar camada de data lake/arquivo para reduzir custo de retenção</span>
          </label>

          <div className="rounded-lg border border-blue-300/20 bg-blue-950/30 p-4 text-sm text-blue-100">
            Estimativa SIEM antes de margens/impostos: <strong>{currency} {estimatedSIEM.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês</strong> ({billableGB} GB/dia faturável)
          </div>
        </CardContent>
      </Card>}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-500" />
            Implantação e Onboarding
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Taxa de onboarding ({currency})</Label>
            <Input type="number" min={0} value={data.setup.onboardingFee} onChange={(event) => updateSetup('onboardingFee', toNumber(event.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Amortização do setup (meses)</Label>
            <Input type="number" min={1} value={data.setup.amortizationMonths} onChange={(event) => updateSetup('amortizationMonths', Math.max(1, toNumber(event.target.value)))} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
