'use client';

import type { ReactNode } from 'react';
import { ArrowRight, FileText, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuotes } from '@/contexts/QuoteContext';
import { formatMoney, recordDate } from '@/lib/dashboard';

interface LauncherAction { title: string; description: string; icon: ReactNode; label: string; onClick: () => void }
export function ModuleLauncher({ title, description, module, actions, onConfigure, onOpenQuotes, extraActions, help }: {
  title: string; description: string; module: string; actions: LauncherAction[];
  onConfigure?: () => void; onOpenQuotes?: () => void; extraActions?: ReactNode; help: string;
}) {
  const { quotes } = useQuotes();
  const recent = quotes.filter(quote => quote.module === module).sort((a, b) => (recordDate(b.date)?.getTime() || 0) - (recordDate(a.date)?.getTime() || 0)).slice(0, 5);
  return <div className="module-launcher"><PageHeader eyebrow="Centro de precificação" title={title} description={description} actions={<>{extraActions}{onConfigure && <Button variant="outline" onClick={onConfigure}><Settings2 />Configurações de cálculo</Button>}</>} />
    <div className="launcher-grid">{actions.map(action => <section className="launcher-card" key={action.title}><span className="launcher-card-icon">{action.icon}</span><h2>{action.title}</h2><p>{action.description}</p><Button onClick={action.onClick}>{action.label}<ArrowRight /></Button></section>)}</div>
    <Card><CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3"><CardTitle>Orçamentos recentes</CardTitle>{onOpenQuotes && <Button size="sm" variant="ghost" onClick={onOpenQuotes}>Ver todos<ArrowRight /></Button>}</CardHeader><CardContent>{recent.length ? <div className="recent-quotes">{recent.map(quote => <div className="recent-quote" key={quote.id}><div><strong>{quote.projectName || quote.id}</strong><small>{quote.client} · {quote.status}</small></div><div className="text-right"><strong>{formatMoney(quote.total)}</strong><small>Valor global · {recordDate(quote.date)?.toLocaleDateString('pt-BR') || 'Sem data'}</small></div></div>)}</div> : <div className="flex flex-col items-center gap-3 py-8 text-center text-muted-foreground"><FileText className="h-6 w-6" /><p className="text-sm">Nenhum orçamento deste módulo por aqui.</p><p className="text-xs">Escolha uma opção acima para começar uma nova composição.</p></div>}</CardContent></Card>
    <details className="launcher-help"><summary>Como funciona esta precificação?</summary><p>{help}</p></details>
  </div>;
}
