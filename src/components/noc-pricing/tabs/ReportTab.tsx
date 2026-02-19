'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NOCPricingData, NOCCalculations } from '@/lib/types/noc-pricing';
import { Download, FileText, Send, CheckCircle, AlertCircle, TrendingUp, Users, Server, DollarSign } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ReportTabProps {
  data: NOCPricingData;
  onSaveProposal: (proposalData: any) => Promise<unknown> | unknown;
  onGenerateBudget: () => Promise<unknown> | unknown;
  onExportPDF: () => void;
}

export function ReportTab({ data, onSaveProposal, onGenerateBudget, onExportPDF }: ReportTabProps) {
  const [proposalTitle, setProposalTitle] = useState(data.project.projectName || 'Proposta NOC');
  const [proposalDescription, setProposalDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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

  if (!calculations) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Dados Incompletos</h3>
          <p className="text-gray-500">
            Preencha todas as abas anteriores para gerar o relatório final
          </p>
        </div>
      </div>
    );
  }

  const getCompetitivenessBadgeClass = (comp: string) => {
    switch (comp) {
      case 'competitive':
        return 'border-cyan-300/40 bg-cyan-900/45 text-cyan-100';
      case 'low':
        return 'border-blue-300/35 bg-blue-900/45 text-blue-100';
      case 'high':
        return 'border-blue-300/45 bg-blue-950/65 text-blue-100';
      default:
        return 'border-blue-300/30 bg-slate-900/35 text-slate-200';
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

  return (
    <div className="space-y-6">
      {/* Header do Relatório */}
      <Card className="border-blue-300/30 bg-slate-900/60">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-blue-100">Relatório Final - NOC</CardTitle>
              <p className="text-blue-200 mt-1">{data.project.projectName}</p>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2 border-cyan-300/40 bg-cyan-900/40 text-cyan-100">
              {data.project.serviceLevel.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Resumo Executivo */}
      <Card className="border-blue-300/20 bg-slate-900/55">
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
                  <span className="text-blue-200">Cliente:</span>
                  <span className="font-medium">{data.project.clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-200">Duração:</span>
                  <span className="font-medium">{data.project.contractDuration} meses</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-200">Cobertura:</span>
                  <span className="font-medium">{data.project.coverage}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-200">Nível de Serviço:</span>
                  <span className="font-medium capitalize">{data.project.serviceLevel}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">SLA Garantido</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-200">Disponibilidade:</span>
                  <span className="font-medium">{data.sla.availability}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-200">Resposta Padrão:</span>
                  <span className="font-medium">{data.sla.responseTime} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-200">Resposta Crítica:</span>
                  <span className="font-medium text-blue-300">{data.sla.criticalIncidentResponse} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-200">Resolução:</span>
                  <span className="font-medium">{data.sla.resolutionTime}h</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-blue-300/20 bg-slate-900/55">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Server className="h-4 w-4 text-blue-600" />
              <span>Dispositivos</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.totalDevices}</div>
            <p className="text-xs text-blue-300/70 mt-1">{data.totalMetrics} métricas</p>
          </CardContent>
        </Card>

        <Card className="border-blue-300/20 bg-slate-900/55">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Users className="h-4 w-4 text-green-600" />
              <span>Equipe</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.teamSize}</div>
            <p className="text-xs text-blue-300/70 mt-1">profissionais</p>
          </CardContent>
        </Card>

        <Card className="border-blue-300/20 bg-slate-900/55">
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
            <p className="text-xs text-blue-300/70 mt-1">por mês</p>
          </CardContent>
        </Card>

        <Card className="border-blue-300/20 bg-slate-900/55">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span>Rentabilidade</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-300">
              {calculations.profitability.toFixed(1)}%
            </div>
            <p className="text-xs text-blue-300/70 mt-1">margem</p>
          </CardContent>
        </Card>
      </div>

      {/* Análise Financeira */}
      <Card className="border-blue-300/20 bg-slate-900/55">
        <CardHeader>
          <CardTitle>Análise Financeira</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-blue-100">Custos Mensais</h4>
              <div className="space-y-2">
                <div className="flex justify-between p-3 bg-slate-900/45 border border-blue-300/20 rounded">
                  <span className="text-blue-200">Equipe</span>
                  <span className="font-medium text-blue-100">
                    {data.project.currency} {calculations.monthlyTeamCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-slate-900/45 border border-blue-300/20 rounded">
                  <span className="text-blue-200">Infraestrutura</span>
                  <span className="font-medium text-blue-100">
                    {data.project.currency} {calculations.monthlyInfrastructureCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-slate-900/45 border border-blue-300/20 rounded">
                  <span className="text-blue-200">Licenças</span>
                  <span className="font-medium text-blue-100">
                    {data.project.currency} {calculations.monthlyLicenseCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-slate-900/45 border border-blue-300/20 rounded">
                  <span className="text-blue-200">Operacional</span>
                  <span className="font-medium text-blue-100">
                    {data.project.currency} {calculations.monthlyOperationalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-blue-900/45 border border-blue-300/30 rounded font-bold">
                  <span className="text-blue-100">Total Mensal</span>
                  <span className="text-blue-600">
                    {data.project.currency} {calculations.monthlyTotalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-blue-100">Precificação</h4>
              <div className="space-y-2">
                <div className="flex justify-between p-3 bg-slate-900/45 border border-blue-300/20 rounded">
                  <span className="text-blue-200">Custo Base</span>
                  <span className="font-medium text-blue-100">
                    {data.project.currency} {calculations.monthlyTotalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-slate-900/45 border border-blue-300/20 rounded">
                  <span className="text-blue-200">Com Margens</span>
                  <span className="font-medium text-blue-100">
                    {data.project.currency} {calculations.priceWithMargin.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-slate-900/45 border border-blue-300/20 rounded">
                  <span className="text-blue-200">Com Impostos</span>
                  <span className="font-medium text-blue-100">
                    {data.project.currency} {calculations.priceWithTaxes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-blue-900/45 border border-blue-300/25 rounded font-bold">
                  <span className="text-blue-100">Preço Final Mensal</span>
                  <span className="text-blue-300">
                    {data.project.currency} {calculations.finalMonthlyPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-slate-900/45 border border-blue-300/20 rounded">
                  <span className="text-blue-200">Preço Anual</span>
                  <span className="font-medium text-blue-200">
                    {data.project.currency} {calculations.finalAnnualPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Análise de Mercado */}
      <Card className="border-blue-300/20 bg-slate-900/55">
        <CardHeader>
          <CardTitle>Análise de Competitividade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border border-blue-300/20 bg-slate-900/45 rounded-lg">
              <div className="text-sm text-blue-200 mb-2">Seu Preço/Dispositivo</div>
              <div className="text-2xl font-bold">
                {data.project.currency} {calculations.costPerDevice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="text-center p-4 border border-blue-300/20 bg-slate-900/45 rounded-lg">
              <div className="text-sm text-blue-200 mb-2">Média de Mercado</div>
              <div className="text-2xl font-bold text-blue-600">
                {data.project.currency} {calculations.marketAverage.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="text-center p-4 border border-blue-300/20 bg-slate-900/45 rounded-lg">
              <div className="text-sm text-blue-200 mb-2">Competitividade</div>
              <Badge variant="outline" className={`text-lg px-4 py-2 ${getCompetitivenessBadgeClass(calculations.competitiveness)}`}>
                {getCompetitivenessLabel(calculations.competitiveness)}
              </Badge>
            </div>
          </div>

          <div className="mt-4 p-4 bg-slate-900/45 border border-blue-300/20 rounded-lg">
            <h4 className="font-semibold text-blue-100 mb-2">Análise</h4>
            <p className="text-sm text-blue-200">
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
      <Card className="border-blue-300/20 bg-slate-900/55">
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
              className="bg-slate-900/40 border-blue-300/20 text-blue-100 placeholder:text-blue-300/60"
            />
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={proposalDescription}
              onChange={(e) => setProposalDescription(e.target.value)}
              placeholder="Adicione uma descrição para esta proposta..."
              rows={4}
              className="bg-slate-900/40 border-blue-300/20 text-blue-100 placeholder:text-blue-300/60"
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
              onClick={onExportPDF}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          </div>

          {/* Debug: Verificar localStorage */}
          <div className="mt-4 p-3 bg-slate-900/45 border border-blue-300/20 rounded text-xs">
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
      <Card className="border-blue-300/30 bg-slate-900/55">
        <CardHeader>
          <CardTitle className="text-blue-100">Recomendações</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-blue-200">
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
    </div>
  );
}
