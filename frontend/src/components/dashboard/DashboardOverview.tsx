'use client';
import { useMemo, useState } from 'react';
import { ArrowRight, BadgeCheck, BriefcaseBusiness, CalendarDays, Clock3, FileText, Plus, TrendingUp } from 'lucide-react';
import { useQuotes } from '@/contexts/QuoteContext';
import { initialQuotes } from '@/lib/data';
import type { Edital, Partner, Proposal, RO } from '@/lib/types';
import { attentionItems, dashboardMetrics, dueLabel, formatMoney, PERIOD_LABELS, type DashboardPeriod } from '@/lib/dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { MetricCard } from './MetricCard';
import { RevenueChart } from './RevenueChart';
import { PipelineChart } from './PipelineChart';

interface DashboardProps {
  partners: Partner[]; ros: RO[]; proposals?: Proposal[]; editais?: Edital[];
  onNavigate: (module: string, record?: string) => void; allowedModules?: string[];
}
export default function DashboardOverview({ partners, ros, proposals = [], editais = [], onNavigate, allowedModules }: DashboardProps) {
  const { quotes } = useQuotes();
  const [period, setPeriod] = useState<DashboardPeriod>('30d');
  const [manager, setManager] = useState('all');
  const [attentionFilter, setAttentionFilter] = useState<'upcoming' | 'overdue'>('upcoming');
  const [today] = useState(() => new Date());
  const canOpen = (module: string) => !allowedModules || allowedModules.includes(module);
  const managers = [...new Set(quotes.map(q => q.accountManager).filter(Boolean))] as string[];
  const visibleQuotes = useMemo(() => quotes.filter(q => manager === 'all' || q.accountManager === manager), [quotes, manager]);
  const metrics = useMemo(() => dashboardMetrics(visibleQuotes, period, today), [visibleQuotes, period, today]);
  const attention = useMemo(() => attentionItems({ quotes: visibleQuotes, ros: ros.filter(ro => manager === 'all' || ro.accountManager === manager), proposals: proposals.filter(p => manager === 'all' || p.accountManager === manager), editais: manager === 'all' ? editais : [] }, today).filter(item => !allowedModules || allowedModules.includes(item.module)), [visibleQuotes, ros, proposals, editais, manager, today, allowedModules]);
  const upcoming = attention.filter(item => !item.overdue);
  const overdue = attention.filter(item => item.overdue);
  const rows = (attentionFilter === 'upcoming' ? upcoming : overdue).slice(0, 5);
  const hasDemo = quotes.some(q => initialQuotes.some(initial => initial.id === q.id && initial.client === q.client && initial.date === q.date && initial.total === q.total));
  const range = `${metrics.start.toLocaleDateString('pt-BR')} – ${metrics.end.toLocaleDateString('pt-BR')}`;
  return <div className="dashboard-page">
    <PageHeader eyebrow="Seu negócio, em perspectiva" title="Visão geral" description="Resultados, oportunidades e próximos passos em um só lugar." actions={canOpen('quotes') && <Button onClick={() => onNavigate('quotes', 'new')}><Plus />Novo orçamento</Button>} />
    <div className="dashboard-toolbar"><div className="flex items-center gap-2 text-xs text-muted-foreground"><CalendarDays className="h-4 w-4" /><span>{range}</span></div><div className="flex flex-wrap items-center gap-3">{managers.length > 0 && <select className="dashboard-manager" aria-label="Filtrar por responsável" value={manager} onChange={event => setManager(event.target.value)}><option value="all">Todos os responsáveis</option>{managers.map(name => <option key={name}>{name}</option>)}</select>}<div className="period-switcher" role="group" aria-label="Período do dashboard">{Object.entries(PERIOD_LABELS).map(([id, label]) => <button type="button" key={id} aria-pressed={period === id} onClick={() => setPeriod(id as DashboardPeriod)}>{label}</button>)}</div></div></div>
    <div className="dashboard-metrics" aria-live="polite"><MetricCard icon={<BriefcaseBusiness />} title="Pipeline aberto" value={formatMoney(metrics.pipelineValue)} context={`${metrics.pipelineCount} orçamento(s) abertos · carteira atual`} /><MetricCard icon={<BadgeCheck />} title="Valor aprovado" value={formatMoney(metrics.approvedValue)} context={`${metrics.approvedCount} aprovado(s) criados no período`} /><MetricCard icon={<TrendingUp />} title="Taxa de aprovação" value={metrics.approvalRate === null ? '—' : `${metrics.approvalRate.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`} context={metrics.decidedCount ? `${metrics.approvedCount} aprovado(s) / ${metrics.decidedCount} decidido(s)` : 'Nenhum orçamento decidido no intervalo'} /><MetricCard icon={<FileText />} title="Orçamentos criados" value={metrics.total} context={period === 'all' ? `${partners.length} parceiros cadastrados` : `${metrics.previous.length} no intervalo anterior equivalente`} /></div>
    {hasDemo && <p className="data-origin-note"><span className="data-origin-dot" />Esta carteira ainda inclui registros iniciais de demonstração. Os indicadores usam os orçamentos cadastrados.</p>}
    {metrics.total === 0 && quotes.length > 0 && <div className="dashboard-no-period-data"><p>Você possui orçamentos fora deste período.</p><Button variant="link" onClick={() => setPeriod('all')}>Ver todo o histórico<ArrowRight /></Button></div>}
    <div className="dashboard-charts"><RevenueChart data={metrics.series} /><PipelineChart data={metrics.statuses} /></div>
    <Card><CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle>Precisa de atenção</CardTitle><CardDescription>Prazos e itens que precisam do próximo passo.</CardDescription></div><div className="period-switcher" role="group" aria-label="Situação das pendências"><button type="button" aria-pressed={attentionFilter === 'upcoming'} onClick={() => setAttentionFilter('upcoming')}>Em andamento <span>{upcoming.length}</span></button><button type="button" aria-pressed={attentionFilter === 'overdue'} onClick={() => setAttentionFilter('overdue')}>Vencidos <span>{overdue.length}</span></button></div></CardHeader><CardContent className="pt-0">{rows.length ? <div className="attention-list">{rows.map(item => <button type="button" key={item.id} className="attention-row" onClick={() => onNavigate(item.module, item.recordId)}><span className="attention-icon"><Clock3 /></span><span className="min-w-0 flex-1"><span className="attention-kind">{item.kind}</span><strong>{item.title}</strong><small>{item.description}</small></span><span className={item.overdue || item.days <= 7 ? 'due-tag is-urgent' : 'due-tag'}>{dueLabel(item)}</span><ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" /></button>)}</div> : <div className="attention-empty"><BadgeCheck className="h-6 w-6" /><p>{attentionFilter === 'upcoming' ? 'Nenhuma pendência em andamento.' : 'Nenhum prazo vencido.'}</p></div>}</CardContent></Card>
    <div className="dashboard-footer"><p>Valores globais dos orçamentos. Aprovação e evolução consideram a data de criação e o status atual, não a data de fechamento.</p>{canOpen('ro-charts') && <Button variant="link" onClick={() => onNavigate('ro-charts')}>Explorar registros de oportunidade<ArrowRight /></Button>}</div>
  </div>;
}
