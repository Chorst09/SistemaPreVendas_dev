'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NOCPricingData, NOCCalculations } from '@/lib/types/noc-pricing';
import { Download, FileText, Send, CheckCircle, AlertCircle, TrendingUp, Users, Server, DollarSign, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { NOCPDFExportPayload } from '@/lib/services/noc-pdf-generator';

interface ReportTabProps {
  data: NOCPricingData;
  onSaveProposal: (proposalData: any) => Promise<unknown> | unknown;
  onGenerateBudget: () => Promise<unknown> | unknown;
  onPreviewPDF: (payload?: NOCPDFExportPayload) => Promise<unknown> | unknown;
  onExportPDF: (payload?: NOCPDFExportPayload) => Promise<unknown> | unknown;
}

export function ReportTab({ data, onSaveProposal, onGenerateBudget, onPreviewPDF, onExportPDF }: ReportTabProps) {
  const [proposalTitle, setProposalTitle] = useState(data.project.projectName || 'Proposta NOC');
  const [proposalDescription, setProposalDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewingPDF, setIsPreviewingPDF] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const calculations = data.calculations;

  const handleSaveProposal = async () => {
    setIsSaving(true);
    try {
      console.log('ReportTab.handleSaveProposal - Iniciando...');
      console.log('ReportTab.handleSaveProposal - Título:', proposalTitle);
      console.log('ReportTab.handleSaveProposal - Cliente:', data.project.clientName);
      console.log('ReportTab.handleSaveProposal - Descrição:', proposalDescription);
      
      const proposalData = {
        title: proposalTitle,
        description: proposalDescription,
        type: 'NOC' as const,
        client: data.project.clientName,
        data: data,
        calculations: calculations,
        createdAt: new Date().toISOString()
      };
      
      console.log('ReportTab.handleSaveProposal - Dados da proposta:', proposalData);
      
      const result = await onSaveProposal(proposalData);
      console.log('ReportTab.handleSaveProposal - Proposta salva com sucesso:', result);
      
      // Limpar formulário após salvar
      setProposalDescription('');
    } catch (error) {
      console.error('ReportTab.handleSaveProposal - Erro ao salvar proposta:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateBudget = async () => {
    setIsSaving(true);
    try {
      await onGenerateBudget();
    } catch (error) {
      console.error('ReportTab.handleGenerateBudget - Erro ao gerar orçamento:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      await onExportPDF({
        proposalTitle,
        proposalDescription,
      });
    } catch (error) {
      console.error('ReportTab.handleExportPDF - Erro ao exportar PDF:', error);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handlePreviewPDF = async () => {
    setIsPreviewingPDF(true);
    try {
      await onPreviewPDF({
        proposalTitle,
        proposalDescription,
      });
    } catch (error) {
      console.error('ReportTab.handlePreviewPDF - Erro ao visualizar PDF:', error);
    } finally {
      setIsPreviewingPDF(false);
    }
  };

  if (!calculations) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Dados Incompletos</h3>
          <p className="text-muted-foreground">
            Preencha todas as abas anteriores para gerar o relatório final
          </p>
        </div>
      </div>
    );
  }

  const getCompetitivenessBadgeClass = (comp: string) => {
    switch (comp) {
      case 'competitive':
        return 'border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-200';
      case 'low':
        return 'border-yellow-500/40 bg-yellow-500/10 text-yellow-700 dark:text-yellow-200';
      case 'high':
        return 'border-destructive/40 bg-destructive/10 text-destructive';
      default:
        return 'border-border bg-muted/40 text-foreground';
    }
  };

  const getCompetitivenessLabel = (comp: string) => {
    switch (comp) {
      case 'competitive': return 'Competitivo';
      case 'low': return 'Abaixo do Mercado';
      case 'high': return 'Acima do Mercado';
      default: return 'N/A';
    }
  };

  const monthlyTaxAmount = calculations.finalMonthlyPrice - calculations.priceWithMargin;
  const monthlyNetRevenue = calculations.finalMonthlyPrice - monthlyTaxAmount;
  const monthlyContributionMargin = monthlyNetRevenue - calculations.monthlyTotalCost;
  const monthlyRiskProvision = calculations.monthlyTotalCost * ((data.variables.riskMargin || 0) / 100);
  const monthlyOperatingResult = monthlyContributionMargin - monthlyRiskProvision;
  const contractMonths = Math.max(data.project.contractDuration || 12, 1);
  const contractGrossRevenue = calculations.finalMonthlyPrice * contractMonths;
  const contractTaxAmount = monthlyTaxAmount * contractMonths;
  const contractNetRevenue = monthlyNetRevenue * contractMonths;
  const contractOperationalCost = calculations.monthlyTotalCost * contractMonths;
  const contractRiskProvision = monthlyRiskProvision * contractMonths;
  const contractOperatingResult = monthlyOperatingResult * contractMonths;
  const monthlyNetMargin = monthlyNetRevenue > 0 ? (monthlyOperatingResult / monthlyNetRevenue) * 100 : 0;
  const contractNetMargin = contractNetRevenue > 0 ? (contractOperatingResult / contractNetRevenue) * 100 : 0;

  const dreRows = [
    { label: 'Receita Bruta de Serviços', monthly: calculations.finalMonthlyPrice, annual: calculations.finalMonthlyPrice * 12, emphasized: false },
    { label: '(-) Impostos sobre Receita', monthly: -monthlyTaxAmount, annual: -(monthlyTaxAmount * 12), emphasized: false },
    { label: 'Receita Líquida', monthly: monthlyNetRevenue, annual: monthlyNetRevenue * 12, emphasized: true },
    { label: '(-) Custos Operacionais Totais', monthly: -calculations.monthlyTotalCost, annual: -(calculations.monthlyTotalCost * 12), emphasized: false },
    { label: 'Margem de Contribuição', monthly: monthlyContributionMargin, annual: monthlyContributionMargin * 12, emphasized: true },
    { label: '(-) Provisão de Risco', monthly: -monthlyRiskProvision, annual: -(monthlyRiskProvision * 12), emphasized: false },
    { label: 'Resultado Operacional (Lucro)', monthly: monthlyOperatingResult, annual: monthlyOperatingResult * 12, emphasized: true },
  ];

  return (
    <div className="space-y-6">
      {/* Header do Relatório */}
      <Card className="border-border/70 bg-card/95">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-foreground">Relatório Final - NOC</CardTitle>
              <p className="text-muted-foreground mt-1">{data.project.projectName}</p>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2 border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300">
              {data.project.serviceLevel.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Resumo Executivo */}
      <Card className="border-border/70 bg-card/95">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Resumo Executivo</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Informações do Projeto</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cliente:</span>
                  <span className="font-medium">{data.project.clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duração:</span>
                  <span className="font-medium">{data.project.contractDuration} meses</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cobertura:</span>
                  <span className="font-medium">{data.project.coverage}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nível de Serviço:</span>
                  <span className="font-medium capitalize">{data.project.serviceLevel}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">SLA Garantido</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Disponibilidade:</span>
                  <span className="font-medium">{data.sla.availability}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resposta Padrão:</span>
                  <span className="font-medium">{data.sla.responseTime} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resposta Crítica:</span>
                  <span className="font-medium text-blue-700 dark:text-blue-300">{data.sla.criticalIncidentResponse} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resolução:</span>
                  <span className="font-medium">{data.sla.resolutionTime}h</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/70 bg-card/95">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Server className="h-4 w-4 text-blue-600" />
              <span>Dispositivos</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.totalDevices}</div>
            <p className="text-xs text-muted-foreground mt-1">{data.totalMetrics} métricas</p>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/95">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Users className="h-4 w-4 text-green-600" />
              <span>Equipe</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.teamSize}</div>
            <p className="text-xs text-muted-foreground mt-1">profissionais</p>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/95">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-orange-600" />
              <span>Custo/Dispositivo</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.project.currency} {calculations.costPerDevice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">por mês</p>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/95">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span>Rentabilidade</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
              {calculations.profitability.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">margem</p>
          </CardContent>
        </Card>
      </div>

      {/* Análise Financeira */}
      <Card className="border-border/70 bg-card/95">
        <CardHeader>
          <CardTitle>Análise Financeira</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Custos Mensais</h4>
              <div className="space-y-2">
                <div className="flex justify-between p-3 bg-muted/30 border border-border/60 rounded">
                  <span className="text-muted-foreground">Equipe</span>
                  <span className="font-medium text-foreground">
                    {data.project.currency} {calculations.monthlyTeamCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-muted/30 border border-border/60 rounded">
                  <span className="text-muted-foreground">Infraestrutura</span>
                  <span className="font-medium text-foreground">
                    {data.project.currency} {calculations.monthlyInfrastructureCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-muted/30 border border-border/60 rounded">
                  <span className="text-muted-foreground">Licenças</span>
                  <span className="font-medium text-foreground">
                    {data.project.currency} {calculations.monthlyLicenseCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-muted/30 border border-border/60 rounded">
                  <span className="text-muted-foreground">Operacional</span>
                  <span className="font-medium text-foreground">
                    {data.project.currency} {calculations.monthlyOperationalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-blue-500/10 border border-blue-500/30 rounded font-bold">
                  <span className="text-foreground">Total Mensal</span>
                  <span className="text-blue-600">
                    {data.project.currency} {calculations.monthlyTotalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Precificação</h4>
              <div className="space-y-2">
                <div className="flex justify-between p-3 bg-muted/30 border border-border/60 rounded">
                  <span className="text-muted-foreground">Custo Base</span>
                  <span className="font-medium text-foreground">
                    {data.project.currency} {calculations.monthlyTotalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-muted/30 border border-border/60 rounded">
                  <span className="text-muted-foreground">Com Margens</span>
                  <span className="font-medium text-foreground">
                    {data.project.currency} {calculations.priceWithMargin.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-muted/30 border border-border/60 rounded">
                  <span className="text-muted-foreground">Com Impostos</span>
                  <span className="font-medium text-foreground">
                    {data.project.currency} {calculations.priceWithTaxes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-blue-500/10 border border-blue-500/30 rounded font-bold">
                  <span className="text-foreground">Preço Final Mensal</span>
                  <span className="text-blue-700 dark:text-blue-300">
                    {data.project.currency} {calculations.finalMonthlyPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-muted/30 border border-border/60 rounded">
                  <span className="text-muted-foreground">Preço Anual</span>
                  <span className="font-medium text-muted-foreground">
                    {data.project.currency} {calculations.finalAnnualPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DRE */}
      <Card className="border-border/70 bg-card/95">
        <CardHeader>
          <CardTitle>DRE (Demonstrativo de Resultado)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 text-left font-semibold">Linha</th>
                  <th className="py-2 text-right font-semibold">Mensal</th>
                  <th className="py-2 text-right font-semibold">Anual</th>
                </tr>
              </thead>
              <tbody>
                {dreRows.map((row) => (
                  <tr key={row.label} className={`border-b border-border/60 ${row.emphasized ? 'bg-blue-500/5' : ''}`}>
                    <td className="py-2 pr-4">{row.label}</td>
                    <td className={`py-2 text-right font-medium ${row.monthly < 0 ? 'text-destructive' : ''}`}>
                      {row.monthly < 0 ? '- ' : ''}{data.project.currency} {Math.abs(row.monthly).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`py-2 text-right font-medium ${row.annual < 0 ? 'text-destructive' : ''}`}>
                      {row.annual < 0 ? '- ' : ''}{data.project.currency} {Math.abs(row.annual).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Análise de Mercado */}
      <Card className="border-border/70 bg-card/95">
        <CardHeader>
          <CardTitle>Análise de Competitividade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border border-border/60 bg-muted/30 rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">Seu Preço/Dispositivo</div>
              <div className="text-2xl font-bold">
                {data.project.currency} {calculations.costPerDevice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="text-center p-4 border border-border/60 bg-muted/30 rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">Média de Mercado</div>
              <div className="text-2xl font-bold text-blue-600">
                {data.project.currency} {calculations.marketAverage.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="text-center p-4 border border-border/60 bg-muted/30 rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">Competitividade</div>
              <Badge variant="outline" className={`text-lg px-4 py-2 ${getCompetitivenessBadgeClass(calculations.competitiveness)}`}>
                {getCompetitivenessLabel(calculations.competitiveness)}
              </Badge>
            </div>
          </div>

          <div className="mt-4 p-4 bg-muted/30 border border-border/60 rounded-lg">
            <h4 className="font-semibold text-foreground mb-2">Análise</h4>
            <p className="text-sm text-muted-foreground">
              {calculations.competitiveness === 'competitive' && 
                'Seu preço está alinhado com o mercado, oferecendo boa competitividade.'}
              {calculations.competitiveness === 'low' && 
                'Seu preço está abaixo da média de mercado. Considere aumentar as margens ou verificar se todos os custos foram incluídos.'}
              {calculations.competitiveness === 'high' && 
                'Seu preço está acima da média de mercado. Pode ser necessário revisar custos ou justificar o valor agregado.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Salvar Proposta */}
      <Card className="border-border/70 bg-card/95">
        <CardHeader>
          <CardTitle>Salvar como Proposta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Título da Proposta</Label>
            <Input
              value={proposalTitle}
              onChange={(e) => setProposalTitle(e.target.value)}
              placeholder="Ex: Proposta NOC - Empresa XYZ"
              className="border-border/70 bg-background text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={proposalDescription}
              onChange={(e) => setProposalDescription(e.target.value)}
              placeholder="Adicione uma descrição para esta proposta..."
              rows={4}
              className="border-border/70 bg-background text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleSaveProposal}
              disabled={isSaving || !proposalTitle}
              className="flex-1"
            >
              {isSaving ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Salvar em Propostas
                </>
              )}
            </Button>

            <Button
              onClick={handleGenerateBudget}
              disabled={isSaving}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {isSaving ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Gerar Orçamento
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={handlePreviewPDF}
              disabled={isSaving || isPreviewingPDF || isExportingPDF}
              className="flex-1 border-blue-500/40 bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 dark:text-blue-200"
            >
              {isPreviewingPDF ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2 animate-spin" />
                  Abrindo...
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Visualizar PDF
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={handleExportPDF}
              disabled={isSaving || isExportingPDF || isPreviewingPDF}
              className="flex-1"
            >
              {isExportingPDF ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar PDF
                </>
              )}
            </Button>
          </div>

          {/* Debug: Verificar localStorage */}
          <div className="mt-4 p-3 bg-muted/30 border border-border/60 rounded text-xs">
            <div className="font-semibold mb-2">Debug - LocalStorage:</div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const stored = localStorage.getItem('unified-proposals');
                console.log('=== DEBUG LOCALSTORAGE ===');
                console.log('Chave: unified-proposals');
                console.log('Conteúdo:', stored);
                if (stored) {
                  const parsed = JSON.parse(stored);
                  console.log('Propostas encontradas:', parsed.length);
                  console.log('Propostas:', parsed);
                  alert(`Encontradas ${parsed.length} propostas no localStorage`);
                } else {
                  console.log('Nenhuma proposta encontrada');
                  alert('Nenhuma proposta encontrada no localStorage');
                }
              }}
            >
              Verificar Propostas Salvas
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recomendações */}
      <Card className="border-border/70 bg-card/95">
        <CardHeader>
          <CardTitle className="text-foreground">Recomendações</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Revise os custos operacionais periodicamente para manter a competitividade</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Considere automação avançada para reduzir custos de equipe em longo prazo</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Monitore o SLA continuamente para garantir conformidade</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Invista em treinamento da equipe para melhorar eficiência</span>
            </li>
            {data.monitoring.aiEnabled && (
              <li className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Com IA habilitada, você pode reduzir incidentes em até 40%</span>
              </li>
            )}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-blue-500/35 bg-gradient-to-br from-blue-500/10 via-card to-card">
        <CardHeader>
          <CardTitle className="text-blue-800 dark:text-blue-200">DRE Final da Proposta</CardTitle>
          <p className="text-sm text-muted-foreground">
            Fechamento final do Demonstrativo de Resultado para validação comercial.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div
            className={`rounded-xl border p-4 ${
              contractOperatingResult >= 0
                ? 'border-green-500/40 bg-green-500/10'
                : 'border-red-500/40 bg-red-500/10'
            }`}
          >
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Resultado Final do Contrato</p>
            <p className={`mt-1 text-3xl font-extrabold ${contractOperatingResult >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
              {contractOperatingResult < 0 ? '- ' : ''}{data.project.currency} {Math.abs(contractOperatingResult).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {contractOperatingResult >= 0 ? 'Lucro projetado' : 'Prejuízo projetado'} para {contractMonths} meses
              com margem líquida de {contractNetMargin.toFixed(1)}%.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-lg border border-border/70 bg-card/80 p-3">
              <p className="text-xs text-muted-foreground">Receita Bruta (Contrato)</p>
              <p className="text-lg font-bold text-foreground">
                {data.project.currency} {contractGrossRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="rounded-lg border border-border/70 bg-card/80 p-3">
              <p className="text-xs text-muted-foreground">Receita Líquida (Contrato)</p>
              <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                {data.project.currency} {contractNetRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="rounded-lg border border-border/70 bg-card/80 p-3">
              <p className="text-xs text-muted-foreground">Custos + Provisão (Contrato)</p>
              <p className="text-lg font-bold text-foreground">
                {data.project.currency} {(contractOperationalCost + contractRiskProvision).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="rounded-lg border border-border/70 bg-card/80 p-3">
              <p className="text-xs text-muted-foreground">Margem Líquida</p>
              <p className={`text-lg font-bold ${contractNetMargin >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                {contractNetMargin.toFixed(1)}%
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Mensal: {monthlyNetMargin.toFixed(1)}%</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-blue-500/30">
                  <th className="py-2 text-left font-semibold">Linha</th>
                  <th className="py-2 text-right font-semibold">Mensal</th>
                  <th className="py-2 text-right font-semibold">Anual</th>
                  <th className="py-2 text-right font-semibold">Contrato ({contractMonths}m)</th>
                </tr>
              </thead>
              <tbody>
                {dreRows.map((row) => (
                  <tr key={`final-${row.label}`} className={`border-b border-border/60 ${row.emphasized ? 'bg-blue-500/10' : ''}`}>
                    <td className="py-2 pr-4 font-medium">{row.label}</td>
                    <td className={`py-2 text-right font-semibold ${row.monthly < 0 ? 'text-destructive' : 'text-foreground'}`}>
                      {row.monthly < 0 ? '- ' : ''}{data.project.currency} {Math.abs(row.monthly).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`py-2 text-right font-semibold ${row.annual < 0 ? 'text-destructive' : 'text-foreground'}`}>
                      {row.annual < 0 ? '- ' : ''}{data.project.currency} {Math.abs(row.annual).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`py-2 text-right font-semibold ${(row.monthly * contractMonths) < 0 ? 'text-destructive' : 'text-foreground'}`}>
                      {(row.monthly * contractMonths) < 0 ? '- ' : ''}{data.project.currency} {Math.abs(row.monthly * contractMonths).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-lg border border-border/70 bg-card/70 p-4">
            <h4 className="text-sm font-semibold text-foreground mb-2">Totais Executivos do Contrato</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">(-) Impostos Totais</span>
                <span className="font-medium">{data.project.currency} {contractTaxAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">(-) Custos Operacionais Totais</span>
                <span className="font-medium">{data.project.currency} {contractOperationalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">(-) Provisão de Risco Total</span>
                <span className="font-medium">{data.project.currency} {contractRiskProvision.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Resultado Operacional do Contrato</span>
                <span className={`font-semibold ${contractOperatingResult >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                  {contractOperatingResult < 0 ? '- ' : ''}{data.project.currency} {Math.abs(contractOperatingResult).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
