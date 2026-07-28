'use client';

import { CommercialProposal } from '@/lib/types/commercial-proposal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Printer, TrendingUp, CheckCircle, Star, ArrowRight, DollarSign, Users, Award } from 'lucide-react';

interface ProposalCommercialTemplateProps {
  proposal: CommercialProposal;
}

const fmtR = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function ProposalCommercialTemplate({ proposal }: ProposalCommercialTemplateProps) {
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
      <div className="max-w-4xl mx-auto space-y-0 rounded-2xl overflow-hidden border border-border shadow-xl">

        {/* ── CAPA EXECUTIVA ── */}
        <div className="bg-gradient-to-br from-emerald-700 via-teal-700 to-emerald-900 text-white p-12 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '28px 28px' }} />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-8">
              <div className="h-px flex-1 bg-white/30" />
              <Badge variant="outline" className="border-white/40 bg-white/10 text-white text-xs px-3">PROPOSTA COMERCIAL</Badge>
              <div className="h-px flex-1 bg-white/30" />
            </div>
            <h1 className="text-4xl font-bold mb-3 leading-tight">{proposal.cover.proposalTitle || proposal.title}</h1>
            <p className="text-emerald-100 text-lg mb-8">Proposta de valor elaborada para {proposal.cover.clientName || 'seu negócio'}</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ['Para', proposal.cover.clientName],
                ['A/C', proposal.cover.clientContact],
                ['De', proposal.cover.ourCompany],
                ['Data', new Date(proposal.cover.proposalDate).toLocaleDateString('pt-BR')],
              ].filter(([, v]) => v).map(([l, v]) => (
                <div key={l} className="flex items-start gap-2">
                  <span className="text-emerald-300 shrink-0 font-medium w-12">{l}:</span>
                  <span className="text-white">{v}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-white/20 flex items-center gap-2 text-sm text-emerald-200">
              <span>Validade: {proposal.cover.validityDays} dias</span>
              <span className="opacity-40">·</span>
              <span>Proposta Nº {proposal.proposalNumber}</span>
              <span className="opacity-40">·</span>
              <span>Versão {proposal.version}</span>
            </div>
          </div>
        </div>

        <div className="bg-background p-10 space-y-10">

          {/* ── CONTEXTO E DOR ── */}
          {proposal.executiveSummary.problem && (
            <section>
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10">
                  <TrendingUp className="h-5 w-5 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-foreground">O Desafio do seu Negócio</h2>
              </div>
              <div className="rounded-xl border-l-4 border-red-400 bg-red-500/5 p-5">
                <p className="text-muted-foreground leading-7">{proposal.executiveSummary.problem}</p>
              </div>
              {proposal.challengeUnderstanding.businessObjectives.length > 0 && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {proposal.challengeUnderstanding.businessObjectives.map((obj, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg border border-border bg-muted/20 p-3">
                      <ArrowRight className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground">{obj}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ── PROPOSTA DE VALOR ── */}
          {proposal.executiveSummary.solution && (
            <section>
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Nossa Proposta de Valor</h2>
              </div>
              <div className="rounded-xl border-l-4 border-emerald-400 bg-emerald-500/5 p-5 mb-4">
                <p className="text-muted-foreground leading-7">{proposal.executiveSummary.solution}</p>
              </div>
              {proposal.executiveSummary.mainBenefit && (
                <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800 p-5">
                  <div className="flex items-start gap-3">
                    <Star className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide mb-1">Benefício Principal</p>
                      <p className="text-foreground font-medium">{proposal.executiveSummary.mainBenefit}</p>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ── PLANO DE IMPLEMENTAÇÃO ── */}
          {proposal.proposedSolution.phases.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10">
                  <ArrowRight className="h-5 w-5 text-blue-500" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Plano de Implementação</h2>
              </div>
              {proposal.proposedSolution.methodology && (
                <p className="text-muted-foreground mb-5 leading-7">{proposal.proposedSolution.methodology}</p>
              )}
              <div className="space-y-3">
                {proposal.proposedSolution.phases.map((phase, i) => (
                  <div key={phase.id} className="flex items-start gap-4 rounded-xl border border-border bg-card p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 font-bold text-sm">{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-semibold text-foreground">{phase.title}</p>
                        {phase.duration && <Badge variant="outline" className="text-xs shrink-0">{phase.duration}</Badge>}
                      </div>
                      {phase.description && <p className="text-sm text-muted-foreground">{phase.description}</p>}
                      {phase.deliverables.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {phase.deliverables.map((d, j) => d && (
                            <span key={j} className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] text-blue-600 dark:text-blue-400">{d}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── INVESTIMENTO ── */}
          {proposal.investment.plans.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10">
                  <DollarSign className="h-5 w-5 text-amber-500" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Investimento</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {proposal.investment.plans.map((plan) => {
                  const rec = { monthly: '/ mês', quarterly: '/ trimestre', annual: '/ ano', 'one-time': '' }[plan.recurrence] || '';
                  return (
                    <div key={plan.id} className="rounded-xl border-2 border-emerald-400/30 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 p-6">
                      <p className="text-sm font-semibold text-muted-foreground mb-2">{plan.name}</p>
                      <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                        {fmtR(plan.value)}
                        {rec && <span className="text-base font-normal text-muted-foreground ml-1">{rec}</span>}
                      </p>
                      {plan.description && <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>}
                    </div>
                  );
                })}
              </div>
              {proposal.investment.setupFee && proposal.investment.setupFee > 0 && (
                <p className="text-sm text-muted-foreground mt-3">+ Setup: {fmtR(proposal.investment.setupFee)}</p>
              )}
              {proposal.investment.paymentConditions && (
                <div className="mt-4 rounded-xl border border-border bg-muted/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Condições de Pagamento</p>
                  <p className="text-sm text-foreground">{proposal.investment.paymentConditions}</p>
                </div>
              )}
            </section>
          )}

          {/* ── CASES DE SUCESSO ── */}
          {proposal.differentials.socialProof.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10">
                  <Award className="h-5 w-5 text-purple-500" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Cases de Sucesso</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {proposal.differentials.socialProof.map((item) => (
                  item.description && (
                    <div key={item.id} className="rounded-xl border border-border bg-muted/10 p-5">
                      <p className="text-muted-foreground italic leading-6">"{item.description}"</p>
                      {item.author && (
                        <div className="mt-3 flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-purple-500/20 flex items-center justify-center text-xs font-bold text-purple-500">
                            {item.author[0]}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{item.author}</p>
                            {item.authorRole && <p className="text-xs text-muted-foreground">{item.authorRole}</p>}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                ))}
              </div>
            </section>
          )}

          {/* ── POR QUE NÓS ── */}
          {proposal.differentials.whoWeAre && (
            <section>
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/10">
                  <Users className="h-5 w-5 text-teal-500" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Por que {proposal.cover.ourCompany || 'nós'}?</h2>
              </div>
              <p className="text-muted-foreground leading-7 mb-4">{proposal.differentials.whoWeAre}</p>
              {proposal.differentials.keyDifferentials.length > 0 && (
                <div className="grid gap-2 sm:grid-cols-2">
                  {proposal.differentials.keyDifferentials.filter(Boolean).map((diff, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg border border-border bg-teal-500/5 p-3">
                      <CheckCircle className="h-4 w-4 text-teal-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground">{diff}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ── PRÓXIMOS PASSOS ── */}
          {proposal.nextSteps.callToAction && (
            <section className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-8 text-white">
              <h2 className="text-xl font-bold mb-3">Próximos Passos</h2>
              <p className="text-emerald-100 leading-7 mb-4">{proposal.nextSteps.callToAction}</p>
              {proposal.nextSteps.contactInfo && (
                <p className="text-emerald-200 text-sm">{proposal.nextSteps.contactInfo}</p>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
