'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, ArrowLeft, Briefcase, Calculator, DollarSign, Save, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NOCDataManager } from '@/lib/services/noc-data-manager';
import { NOCCalculationEngine } from '@/lib/services/noc-calculation-engine';
import { NOCPricingData, NOCServiceScope } from '@/lib/types/noc-pricing';
import { SecurityTab } from './tabs/SecurityTab';
import { ProjectTab } from './tabs/ProjectTab';
import { TaxesTab } from './tabs/TaxesTab';
import { VariablesTab } from './tabs/VariablesTab';
import type { ProposalClientData } from '@/components/shared/ProposalClientDataForm';
import { mapProposalClientDataToLegacyClientData } from '@/components/shared/proposalClientDataMapper';
import type { ClientData } from '@/components/calculators/ProposalClientForm';
import { usePricingIntegration } from '@/hooks/use-pricing-integration';
import { useToast } from '@/hooks/use-toast';

interface SecurityPricingSystemProps {
  mode: Exclude<NOCServiceScope, 'noc'>;
  onBack?: () => void;
  proposalClientData?: ProposalClientData | null;
  onNavigateToQuotes?: () => void;
}

const SERVICE_COPY = {
  soc: {
    title: 'Calculadora SOC',
    subtitle: 'Security Operations Center com MDR, hunting, triagem e resposta a incidentes',
    accent: 'text-cyan-300',
    primaryMetric: 'Ativos SOC'
  },
  siem: {
    title: 'Calculadora SIEM',
    subtitle: 'SIEM gerenciado por ingestão, retenção, regras, parsers e fontes de log',
    accent: 'text-blue-300',
    primaryMetric: 'GB/dia'
  }
};

const roundCurrency = (value: number) => Math.round(value * 100) / 100;

function applySecurityMode(data: NOCPricingData, mode: Exclude<NOCServiceScope, 'noc'>): NOCPricingData {
  const next: NOCPricingData = {
    ...data,
    devices: [],
    totalDevices: 0,
    totalMetrics: 0,
    estimatedAlertsPerMonth: 0,
    security: {
      ...data.security,
      enabledServices: [mode],
      soc: {
        ...data.security.soc,
        enabled: mode === 'soc',
        endpoints: mode === 'soc' && !data.security.soc.endpoints ? 100 : data.security.soc.endpoints,
        identities: mode === 'soc' && !data.security.soc.identities ? 100 : data.security.soc.identities,
        users: mode === 'soc' && !data.security.soc.users ? 100 : data.security.soc.users
      },
      siem: {
        ...data.security.siem,
        enabled: mode === 'siem',
        ingestionGBPerDay: mode === 'siem' && !data.security.siem.ingestionGBPerDay ? 25 : data.security.siem.ingestionGBPerDay,
        logSources: mode === 'siem' && !data.security.siem.logSources ? 8 : data.security.siem.logSources
      }
    }
  };

  return {
    ...next,
    calculations: NOCCalculationEngine.calculateAll(next)
  };
}

function getSecurityAssetCount(data: NOCPricingData): number {
  const soc = data.security.soc;
  return (soc.endpoints || 0) + (soc.servers || 0) + (soc.networkDevices || 0) + (soc.cloudWorkloads || 0) + (soc.identities || 0);
}

export function SecurityPricingSystem({
  mode,
  onBack,
  proposalClientData,
  onNavigateToQuotes
}: SecurityPricingSystemProps) {
  const [data, setData] = useState<NOCPricingData>(() => applySecurityMode(NOCDataManager.createEmptyData(), mode));
  const [isSaving, setIsSaving] = useState(false);

  const dataManager = useMemo(() => new NOCDataManager(), []);
  const { createQuoteFromPricingData } = usePricingIntegration();
  const { toast } = useToast();
  const copy = SERVICE_COPY[mode];
  const calculations = data.calculations;

  useEffect(() => {
    let mounted = true;
    dataManager.loadData().then(loaded => {
      if (mounted) setData(applySecurityMode(loaded, mode));
    });
    return () => {
      mounted = false;
    };
  }, [dataManager, mode]);

  const updateData = useCallback(async (updater: (current: NOCPricingData) => NOCPricingData) => {
    const next = applySecurityMode(updater(data), mode);
    setData(next);
    await dataManager.persistData(next);
  }, [data, dataManager, mode]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await dataManager.persistData(data);
      await dataManager.createBackup(data);
      toast({ title: `${mode.toUpperCase()} salvo`, description: 'Dados da calculadora salvos com sucesso.' });
    } finally {
      setIsSaving(false);
    }
  }, [data, dataManager, mode, toast]);

  const handleGenerateBudget = useCallback(() => {
    if (!calculations?.finalMonthlyPrice) {
      toast({ title: 'Dados incompletos', description: 'Revise o escopo antes de gerar o orçamento.', variant: 'destructive' });
      return;
    }

    const clientData: ClientData = proposalClientData
      ? mapProposalClientDataToLegacyClientData(proposalClientData)
      : {
          razaoSocial: data.project.clientName || `Cliente ${mode.toUpperCase()}`,
          nomeContato: data.project.clientName || 'Contato não informado',
          telefoneCliente: '',
          emailCliente: '',
          nomeProjeto: data.project.projectName || `Projeto ${mode.toUpperCase()}`,
          nomeGerente: '',
          telefoneGerente: '',
          emailGerente: ''
        };

    const contractMonths = Math.max(data.project.contractDuration || 12, 1);
    const monthlyPrice = roundCurrency(calculations.finalMonthlyPrice);
    const totalPrice = roundCurrency(monthlyPrice * contractMonths);

    createQuoteFromPricingData({
      name: `${mode.toUpperCase()} - ${contractMonths} meses`,
      clientName: clientData.razaoSocial,
      totalPrice,
      module: mode.toUpperCase(),
      technicalSpecs: {
        serviceType: mode,
        monthlyPrice,
        contractDurationMonths: contractMonths,
        monthlyCost: roundCurrency(calculations.monthlyTotalCost),
        monthlySOCCost: roundCurrency(calculations.monthlySOCCost),
        monthlySIEMCost: roundCurrency(calculations.monthlySIEMCost),
        marketSuggestedMonthly: roundCurrency(calculations.marketSuggestedMonthly),
        soc: data.security.soc,
        siem: data.security.siem,
        taxes: data.taxes,
        variables: data.variables
      },
      clientData
    });

    toast({ title: `Orçamento ${mode.toUpperCase()} gerado`, description: 'O orçamento foi salvo em Orçamentos.' });
    if (onNavigateToQuotes) setTimeout(() => onNavigateToQuotes(), 900);
  }, [calculations, createQuoteFromPricingData, data, mode, onNavigateToQuotes, proposalClientData, toast]);

  const primaryVolume = mode === 'soc' ? getSecurityAssetCount(data) : data.security.siem.ingestionGBPerDay;
  const securityCost = mode === 'soc' ? calculations?.monthlySOCCost || 0 : calculations?.monthlySIEMCost || 0;

  return (
    <div className="noc-theme w-full max-w-7xl mx-auto p-6 space-y-6 rounded-2xl">
      <Card className="card-surface border-border/60 backdrop-blur-md">
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg border border-blue-300/25 bg-blue-500/10 p-3">
                {mode === 'soc' ? <Shield className="h-6 w-6 text-cyan-300" /> : <Activity className="h-6 w-6 text-blue-300" />}
              </div>
              <div>
                <CardTitle className="text-2xl">{copy.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{copy.subtitle}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {onBack && (
                <Button variant="outline" onClick={onBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
              )}
              <Button variant="outline" onClick={handleSave} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                Salvar
              </Button>
              <Button onClick={handleGenerateBudget}>
                <Briefcase className="mr-2 h-4 w-4" />
                Gerar Orçamento
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-surface border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">{copy.primaryMetric}</CardTitle></CardHeader>
          <CardContent><div className={`text-3xl font-bold ${copy.accent}`}>{primaryVolume.toLocaleString('pt-BR')}</div></CardContent>
        </Card>
        <Card className="card-surface border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Custo Mensal</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{data.project.currency} {securityCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div></CardContent>
        </Card>
        <Card className="card-surface border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Preço Mensal</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-300">{data.project.currency} {(calculations?.finalMonthlyPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div></CardContent>
        </Card>
        <Card className="card-surface border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Benchmark</CardTitle></CardHeader>
          <CardContent>
            <Badge variant="outline" className="text-sm">
              {data.project.currency} {(calculations?.marketSuggestedMonthly || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <ProjectTab
        data={data.project}
        onChange={(project) => updateData(current => ({ ...current, project }))}
      />

      <SecurityTab
        data={data.security}
        currency={data.project.currency}
        mode={mode}
        onChange={(security) => updateData(current => ({ ...current, security }))}
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <TaxesTab
          data={data.taxes}
          onChange={(taxes) => updateData(current => ({ ...current, taxes }))}
        />
        <VariablesTab
          data={data.variables}
          onChange={(variables) => updateData(current => ({ ...current, variables }))}
        />
      </div>

      <Card className="card-surface border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Resultado Comercial {mode.toUpperCase()}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-blue-300/20 bg-slate-900/40 p-4">
            <div className="text-sm text-blue-200">Custo com margens</div>
            <div className="text-xl font-bold">{data.project.currency} {(calculations?.priceWithMargin || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="rounded-lg border border-blue-300/20 bg-slate-900/40 p-4">
            <div className="text-sm text-blue-200">Com impostos</div>
            <div className="text-xl font-bold">{data.project.currency} {(calculations?.priceWithTaxes || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="rounded-lg border border-green-300/25 bg-green-950/30 p-4">
            <div className="flex items-center gap-2 text-sm text-green-200"><DollarSign className="h-4 w-4" /> Venda mensal</div>
            <div className="text-xl font-bold text-green-200">{data.project.currency} {(calculations?.finalMonthlyPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function SOCPricingSystem(props: Omit<SecurityPricingSystemProps, 'mode'>) {
  return <SecurityPricingSystem {...props} mode="soc" />;
}

export function SIEMPricingSystem(props: Omit<SecurityPricingSystemProps, 'mode'>) {
  return <SecurityPricingSystem {...props} mode="siem" />;
}
