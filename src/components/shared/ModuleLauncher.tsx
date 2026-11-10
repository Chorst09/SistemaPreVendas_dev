'use client';

import type { ReactNode } from 'react';
import { ArrowRight, FileText, Settings2, Sparkles, HelpCircle, Layers, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuotes } from '@/contexts/QuoteContext';
import { formatMoney, recordDate } from '@/lib/dashboard';
import { cn } from '@/lib/utils';

interface LauncherAction {
  title: string;
  description: string;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}

export function ModuleLauncher({
  title,
  description,
  module,
  actions,
  onConfigure,
  onOpenQuotes,
  extraActions,
  help,
}: {
  title: string;
  description: string;
  module: string;
  actions: LauncherAction[];
  onConfigure?: () => void;
  onOpenQuotes?: () => void;
  extraActions?: ReactNode;
  help: string;
}) {
  const { quotes } = useQuotes();
  const recent = quotes
    .filter(quote => !module || quote.module === module || quote.projectName?.toLowerCase().includes(module.toLowerCase()))
    .sort((a, b) => (recordDate(b.date)?.getTime() || 0) - (recordDate(a.date)?.getTime() || 0))
    .slice(0, 4);

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card/90 to-primary/5 p-6 shadow-sm backdrop-blur-md">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Motor de Precificação Especializado
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              {description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {extraActions}
            {onConfigure && (
              <Button
                variant="outline"
                onClick={onConfigure}
                className="gap-2 border-border/80 hover:bg-muted"
              >
                <Settings2 className="h-4 w-4 text-primary" />
                Configurações de Cálculo
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Action Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {actions.map((action, idx) => {
          const gradients = [
            'from-blue-500 to-indigo-600',
            'from-emerald-500 to-teal-600',
            'from-violet-500 to-purple-600',
            'from-amber-500 to-orange-600',
          ];
          const grad = gradients[idx % gradients.length];

          return (
            <div
              key={action.title}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg"
            >
              {/* Gradient Accent Bar */}
              <div className={cn('absolute top-0 left-0 right-0 h-1 bg-gradient-to-r', grad)} />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform shadow-sm">
                    {action.icon}
                  </div>
                  <Badge variant="outline" className="text-[11px] font-mono">
                    Módulo Ativo
                  </Badge>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                    {action.title}
                  </h3>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    {action.description}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border/50">
                <Button
                  onClick={action.onClick}
                  className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm group-hover:shadow transition-all"
                >
                  <span>{action.label}</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Quotes for this module */}
      <Card className="border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="p-5 border-b border-border/50 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <CardTitle className="text-base font-semibold">Orçamentos Recentes Deste Módulo</CardTitle>
          </div>
          {onOpenQuotes && (
            <Button size="sm" variant="ghost" onClick={onOpenQuotes} className="text-xs text-primary gap-1">
              Ver todos na carteira <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {recent.length ? (
            <div className="divide-y divide-border/50">
              {recent.map((quote) => (
                <div
                  key={quote.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-muted/30 transition-colors gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs">
                      {quote.id.replace('ORC-', '#')}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">
                        {quote.projectName || quote.id}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {quote.client} • <span className="font-medium text-foreground">{quote.status}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <p className="text-sm font-bold text-foreground">
                      {formatMoney(quote.total)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {recordDate(quote.date)?.toLocaleDateString('pt-BR') || 'Sem data'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <FileText className="h-8 w-8 text-muted-foreground/60 mb-2" />
              <p className="text-sm font-medium text-foreground">Nenhum orçamento deste módulo por aqui ainda</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Escolha uma das opções de precificação acima para iniciar uma nova composição de custos e margens.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Banner */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground">
        <div className="flex items-start gap-2.5">
          <HelpCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-foreground">Metodologia de Precificação & Composição</p>
            <p className="leading-relaxed">{help}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
