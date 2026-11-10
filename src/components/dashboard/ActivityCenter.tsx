'use client';

import { Calendar, Clock, AlertTriangle, CheckCircle2, ArrowRight, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { formatMoney } from '@/lib/dashboard';

export interface Activity {
  id: string;
  type: 'quote' | 'proposal' | 'ro' | 'meeting' | 'followup';
  title: string;
  client: string;
  description: string;
  dueDate: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed';
  value?: number;
  assignee?: string;
  module: string;
  recordId: string;
}

interface ActivityCenterProps {
  activities: Activity[];
  onNavigate: (module: string, recordId: string) => void;
}

/**
 * ActivityCenter - Centro de atividades com tarefas urgentes e próximas
 * 
 * Layout em 2 colunas:
 * - Esquerda: Atividades URGENTES (hoje/vencidas)
 * - Direita: Atividades PRÓXIMAS (próximos 7 dias)
 */
export function ActivityCenter({ activities, onNavigate }: ActivityCenterProps) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const next7Days = new Date(today);
  next7Days.setDate(next7Days.getDate() + 7);

  // Atividades urgentes (hoje ou vencidas)
  const urgent = activities.filter(a => {
    const dueDate = new Date(a.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate <= today && a.status !== 'completed';
  }).sort((a, b) => {
    // Ordenar por prioridade e depois por data
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return a.dueDate.getTime() - b.dueDate.getTime();
  });

  // Atividades próximas (próximos 7 dias, excluindo urgentes)
  const upcoming = activities.filter(a => {
    const dueDate = new Date(a.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate > today && dueDate <= next7Days && a.status !== 'completed';
  }).sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  const getPriorityConfig = (priority: Activity['priority']) => {
    switch (priority) {
      case 'urgent':
        return { color: 'text-destructive', bg: 'bg-destructive/10', icon: AlertTriangle };
      case 'high':
        return { color: 'text-accent-orange', bg: 'bg-accent-orange/10', icon: Flag };
      case 'medium':
        return { color: 'text-accent-yellow', bg: 'bg-accent-yellow/10', icon: Flag };
      case 'low':
        return { color: 'text-muted-foreground', bg: 'bg-muted', icon: Flag };
    }
  };

  const getTypeLabel = (type: Activity['type']) => {
    switch (type) {
      case 'quote': return 'Orçamento';
      case 'proposal': return 'Proposta';
      case 'ro': return 'RO';
      case 'meeting': return 'Reunião';
      case 'followup': return 'Follow-up';
    }
  };

  const getRelativeDate = (date: Date) => {
    const daysDiff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff < 0) {
      const absDays = Math.abs(daysDiff);
      return { label: `${absDays}d atrasado`, variant: 'destructive' as const };
    }
    if (daysDiff === 0) return { label: 'Hoje', variant: 'destructive' as const };
    if (daysDiff === 1) return { label: 'Amanhã', variant: 'warning' as const };
    if (daysDiff <= 3) return { label: `${daysDiff} dias`, variant: 'warning' as const };
    return { label: `${daysDiff} dias`, variant: 'secondary' as const };
  };

  const ActivityCard = ({ activity }: { activity: Activity }) => {
    const priorityConfig = getPriorityConfig(activity.priority);
    const PriorityIcon = priorityConfig.icon;
    const relativeDate = getRelativeDate(activity.dueDate);

    return (
      <button
        onClick={() => onNavigate(activity.module, activity.recordId)}
        className={cn(
          'group w-full rounded-lg border border-border bg-card p-3 text-left transition-all',
          'hover:border-primary/50 hover:bg-accent/5 hover:shadow-md'
        )}
      >
        <div className="flex items-start gap-3">
          {/* Priority Icon */}
          <div className={cn('mt-0.5 rounded-md p-2', priorityConfig.bg)}>
            <PriorityIcon className={cn('h-4 w-4', priorityConfig.color)} />
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1 space-y-1.5">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {getTypeLabel(activity.type)}
                  </Badge>
                  {activity.value && (
                    <span className="text-xs font-semibold text-accent-green">
                      {formatMoney(activity.value)}
                    </span>
                  )}
                </div>
                <h4 className="mt-1 truncate text-sm font-semibold text-foreground">
                  {activity.title}
                </h4>
              </div>

              <Badge variant={relativeDate.variant} className="shrink-0">
                {relativeDate.label}
              </Badge>
            </div>

            {/* Details */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Cliente:</span> {activity.client}
              </p>
              <p className="text-xs text-muted-foreground">{activity.description}</p>
              {activity.assignee && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Responsável:</span> {activity.assignee}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {activity.dueDate.toLocaleDateString('pt-BR')}
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </button>
    );
  };

  const EmptyColumn = ({ title }: { title: string }) => (
    <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed border-border">
      <div className="text-center">
        <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-accent-green" />
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">Continue o bom trabalho!</p>
      </div>
    </div>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Coluna Esquerda: Urgentes */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Atividades Urgentes</h3>
            <p className="text-xs text-muted-foreground">
              {urgent.length} {urgent.length === 1 ? 'item' : 'itens'} precisando atenção imediata
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {urgent.length > 0 ? (
            urgent.slice(0, 5).map(activity => (
              <ActivityCard key={activity.id} activity={activity} />
            ))
          ) : (
            <EmptyColumn title="Nenhuma atividade urgente" />
          )}
        </div>

        {urgent.length > 5 && (
          <p className="text-center text-xs text-muted-foreground">
            +{urgent.length - 5} atividades urgentes não exibidas
          </p>
        )}
      </div>

      {/* Coluna Direita: Próximas */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Clock className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Próximas Atividades</h3>
            <p className="text-xs text-muted-foreground">
              {upcoming.length} {upcoming.length === 1 ? 'item' : 'itens'} nos próximos 7 dias
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {upcoming.length > 0 ? (
            upcoming.slice(0, 5).map(activity => (
              <ActivityCard key={activity.id} activity={activity} />
            ))
          ) : (
            <EmptyColumn title="Nenhuma atividade próxima" />
          )}
        </div>

        {upcoming.length > 5 && (
          <p className="text-center text-xs text-muted-foreground">
            +{upcoming.length - 5} atividades futuras não exibidas
          </p>
        )}
      </div>
    </div>
  );
}
