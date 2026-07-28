'use client';

import { CommercialProposal } from '@/lib/types/commercial-proposal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Download, Printer, Server, Shield, Clock, CheckCircle,
  AlertTriangle, Layers, Users, FileText, Calendar, Wrench,
} from 'lucide-react';

interface ProposalTechnicalTemplateProps {
  proposal: CommercialProposal;
}

const fmtR = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function ProposalTechnicalTemplate({ proposal }: ProposalTechnicalTemplateProps) {
  const handlePrint = () => window.print();
  const handleExport = () => {
    const { ProposalPDFGenerator } = require('@/lib/services/proposal-pdf-generator');
    const generator = new ProposalPDFGenerator();
    generator.downloadPDF(proposal);
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex justify-end gap-2 print:hidden">
        <Button onClick={handlePrint} variant="outline" size="sm">
          <Printer className="h-4 w-4 mr-2" /> Imprimir
        </Button>
        <Button onClick={handleExport} size="sm">
          <Download className="h-4 w-4 mr-2" /> Exportar PDF
        </Button>
      </div>

      {/* Documento */}
      <div className="max-w-4xl mx-auto rounded-2xl overflow-hidden border border-border shadow-xl">

        {/* ── CAPA TÉCNICA ── */}
        <div className="bg-gradient-to-br from-blue-800 via-indigo-800 to-blue-900 text-white p-12 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.15) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.15) 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
                <Server className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-blue-200 text-xs uppercase tracking-widest font-medium">Documento Técnico</p>
                <Badge variant="outline" className="border-white/40 bg-white/10 text-white text-xs mt-1">PROPOSTA TÉCNICA</Badge>
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2 leading-tight">{proposal.cover.proposalTitle || proposal.title}</h1>
            <p className="text-blue-200 mb-8">Especificação técnica elaborada para {proposal.cover.clientName || 'o cliente'}</p>

            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm border-t border-white/20 pt-6">
              {[
                ['Cliente', proposal.cover.clientName],
                ['Referência Técnica', proposal.cover.clientContact],
                ['Fornecedor', proposal.cover.ourCompany],
                ['Consultor', proposal.cover.ourContact],
                ['Emissão', new Date(proposal.cover.proposalDate).toLocaleDateString('pt-BR')],
                ['Validade', `${proposal.cover.validityDays} dias`],
                ['Nº Proposta', proposal.proposalNumber],
                ['Versão', proposal.version],
              ].filter(([, v]) => v).map(([l, v]) => (
                <div key={l} className="flex items-start gap-2">
                  <span className="text-blue-300 shrink-0 w-32 font-medium">{l}:</span>
                  <span className="text-white">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Índice */}
        <div className="bg-blue-950/50 dark:bg-blue-950/80 px-10 py-5 border-b border-border">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3">Sumário</p>
          <div className="grid grid-cols-2 gap-1 text-sm text-blue-200">
            {[
              'Contexto Técnico', 'Arquitetura da Solução', 'Metodologia',
              'Escopo e Entregas', 'Cronograma', 'SLA e Suporte',
              'Equipe Técnica', 'Investimento',
            ].map((item, i) => (
              <div key={item} className="flex items-center gap-2">
                <span className="text-blue-500 font-mono text-xs">{String(i + 1).padStart(2, '0')}</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-background p-10 space-y-10">

          {/* ── CONTEXTO TÉCNICO ── */}
          {(proposal.challengeUnderstanding.currentContext.length > 0 || proposal.executiveSummary.problem) && (
            <section>
              <SectionHeader icon={AlertTriangle} number="01" title="Contexto Técnico" color="text-amber-500" bg="bg-amber-500/10" />
              {proposal.executiveSummary.problem && (
                <div className="rounded-xl border-l-4 border-amber-400 bg-amber-500/5 p-5 mb-4">
                  <p className="text-muted-foreground leading-7">{proposal.executiveSummary.problem}</p>
                </div>
              )}
              {proposal.challengeUnderstanding.currentContext.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Situação Atual</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {proposal.challengeUnderstanding.currentContext.filter(Boolean).map((ctx, i) => (
                      <div key={i} className="flex items-start gap-2 rounded-lg border border-border bg-muted/20 p-3">
                        <span className="text-amber-500 font-mono text-xs shrink-0 mt-0.5">{String(i + 1).padStart(2, '0')}</span>
                        <p className="text-sm text-muted-foreground">{ctx}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ── ARQUITETURA DA SOLUÇÃO ── */}
          {proposal.executiveSummary.solution && (
            <section>
              <SectionHeader icon={Layers} number="02" title="Arquitetura da Solução" color="text-blue-500" bg="bg-blue-500/10" />
              <div className="rounded-xl border border-blue-400/30 bg-blue-500/5 p-5 mb-4">
                <p className="text-muted-foreground leading-7">{proposal.executiveSummary.solution}</p>
              </div>
              {proposal.executiveSummary.mainBenefit && (
                <div className="rounded-xl bg-blue-500/10 border border-blue-400/30 p-4">
                  <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-1">Resultado Técnico Esperado</p>
                  <p className="text-foreground">{proposal.executiveSummary.mainBenefit}</p>
                </div>
              )}
            </section>
          )}

          {/* ── METODOLOGIA ── */}
          {proposal.proposedSolution.methodology && (
            <section>
              <SectionHeader icon={Wrench} number="03" title="Metodologia e Processos" color="text-indigo-500" bg="bg-indigo-500/10" />
              <p className="text-muted-foreground leading-7 mb-5">{proposal.proposedSolution.methodology}</p>
            </section>
          )}

          {/* ── ESCOPO E ENTREGAS ── */}
          {(proposal.detailedScope.includedServices.length > 0 || proposal.detailedScope.excludedServices.length > 0) && (
            <section>
              <SectionHeader icon={CheckCircle} number="04" title="Escopo e Entregas" color="text-emerald-500" bg="bg-emerald-500/10" />
              <div className="grid gap-6 sm:grid-cols-2">
                {proposal.detailedScope.includedServices.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5" /> Itens Incluídos no Escopo
                    </p>
                    <div className="space-y-2">
                      {proposal.detailedScope.includedServices.filter(Boolean).map((s, i) => (
                        <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg border border-emerald-400/20 bg-emerald-500/5">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <p className="text-sm text-muted-foreground">{s}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {proposal.detailedScope.excludedServices.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-red-500 mb-3 flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" /> Fora do Escopo
                    </p>
                    <div className="space-y-2">
                      {proposal.detailedScope.excludedServices.filter(Boolean).map((s, i) => (
                        <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg border border-red-400/20 bg-red-500/5">
                          <span className="text-red-400 shrink-0 mt-0.5 font-bold text-xs">✕</span>
                          <p className="text-sm text-muted-foreground">{s}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ── CRONOGRAMA ── */}
          {(proposal.timeline.totalDuration || proposal.timeline.milestones.length > 0) && (
            <section>
              <SectionHeader icon={Calendar} number="05" title="Cronograma do Projeto" color="text-cyan-500" bg="bg-cyan-500/10" />
              {proposal.timeline.totalDuration && (
                <div className="flex items-center gap-3 mb-5 rounded-xl border border-cyan-400/30 bg-cyan-500/5 p-4">
                  <Clock className="h-5 w-5 text-cyan-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Duração Total Estimada</p>
                    <p className="font-bold text-foreground">{proposal.timeline.totalDuration}</p>
                  </div>
                </div>
              )}
              {proposal.timeline.milestones.length > 0 && (
                <div className="relative pl-6">
                  <div className="absolute left-2.5 top-0 bottom-0 w-px bg-border" />
                  <div className="space-y-4">
                    {proposal.timeline.milestones.filter(m => m.description).map((m, i) => (
                      <div key={m.id} className="relative">
                        <div className="absolute -left-6 top-3 h-2.5 w-2.5 rounded-full bg-cyan-500 border-2 border-background" />
                        <div className="rounded-xl border border-border bg-card p-4">
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant="outline" className="text-xs border-cyan-400/30 text-cyan-500">{m.period || `Marco ${i + 1}`}</Badge>
                            {m.durationDays && <span className="text-xs text-muted-foreground">{m.durationDays} dias</span>}
                          </div>
                          <p className="text-sm text-muted-foreground">{m.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ── SLA E SUPORTE ── */}
          {proposal.investment.contractTerms && (
            <section>
              <SectionHeader icon={Shield} number="06" title="SLA e Condições de Suporte" color="text-violet-500" bg="bg-violet-500/10" />
              <div className="rounded-xl border border-violet-400/30 bg-violet-500/5 p-5">
                <p className="text-muted-foreground leading-7">{proposal.investment.contractTerms}</p>
              </div>
            </section>
          )}

          {/* ── EQUIPE TÉCNICA ── */}
          {proposal.differentials.whoWeAre && (
            <section>
              <SectionHeader icon={Users} number="07" title="Equipe Técnica e Empresa" color="text-teal-500" bg="bg-teal-500/10" />
              <p className="text-muted-foreground leading-7 mb-4">{proposal.differentials.whoWeAre}</p>
              {proposal.differentials.keyDifferentials.length > 0 && (
                <div className="grid gap-2 sm:grid-cols-3">
                  {proposal.differentials.keyDifferentials.filter(Boolean).map((d, i) => (
                    <div key={i} className="rounded-xl border border-border bg-teal-500/5 p-4 text-center">
                      <CheckCircle className="h-5 w-5 text-teal-500 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">{d}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ── INVESTIMENTO ── */}
          {proposal.investment.plans.length > 0 && (
            <section>
              <SectionHeader icon={FileText} number="08" title="Investimento" color="text-amber-500" bg="bg-amber-500/10" />
              <div className="overflow-hidden rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Plano / Serviço</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Valor</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recorrência</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proposal.investment.plans.map((plan, i) => {
                      const rec = { monthly: 'Mensal', quarterly: 'Trimestral', annual: 'Anual', 'one-time': 'Único' }[plan.recurrence] || '';
                      return (
                        <tr key={plan.id} className={`border-t border-border/50 ${i % 2 === 1 ? 'bg-muted/10' : ''}`}>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-foreground">{plan.name}</p>
                            {plan.description && <p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p>}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-amber-500 font-mono">{fmtR(plan.value)}</td>
                          <td className="px-4 py-3 text-right"><Badge variant="outline" className="text-xs">{rec}</Badge></td>
                        </tr>
                      );
                    })}
                    {proposal.investment.setupFee && proposal.investment.setupFee > 0 && (
                      <tr className="border-t border-border/50 bg-muted/10">
                        <td className="px-4 py-3 font-semibold text-foreground">Setup / Implantação</td>
                        <td className="px-4 py-3 text-right font-bold text-amber-500 font-mono">{fmtR(proposal.investment.setupFee)}</td>
                        <td className="px-4 py-3 text-right"><Badge variant="outline" className="text-xs">Único</Badge></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {proposal.investment.paymentConditions && (
                <p className="text-sm text-muted-foreground mt-3 px-1">{proposal.investment.paymentConditions}</p>
              )}
            </section>
          )}

          {/* ── PRÓXIMOS PASSOS ── */}
          {proposal.nextSteps.callToAction && (
            <section className="rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-800 p-8 text-white">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-blue-300" />
                <h2 className="text-xl font-bold">Próximos Passos</h2>
              </div>
              <p className="text-blue-100 leading-7 mb-4">{proposal.nextSteps.callToAction}</p>
              {proposal.nextSteps.contactInfo && (
                <p className="text-blue-200 text-sm">{proposal.nextSteps.contactInfo}</p>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, number, title, color, bg }: {
  icon: React.ComponentType<{ className?: string }>;
  number: string;
  title: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${bg}`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div className="flex items-center gap-2">
        <span className={`font-mono text-sm font-bold ${color} opacity-60`}>{number}</span>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
      </div>
    </div>
  );
}
