'use client';

import {
  CheckCircle2,
  XCircle,
  Send,
  RefreshCw,
  FileText,
  DollarSign,
  ArrowRight,
  Eye,
  Mail,
  Calendar,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatMoney } from '@/lib/dashboard';

export interface Movement {
  id: string;
  type: 'quote_created' | 'quote_approved' | 'quote_rejected' | 'proposal_sent' | 'status_updated' | 'meeting_scheduled';
  title: string;
  client: string;
  description: string;
  timestamp: Date;
  value?: number;
  status?: string;
  module: string;
  recordId: string;
  user?: string;
}

interface RecentMovementsTableProps {
  movements: Movement[];
  onNavigate: (module: string, recordId: string) => void;
  onSendFollowUp?: (recordId: string) => void;
  onScheduleMeeting?: (recordId: string) => void;
}

/**
 * RecentMovementsTable - Tabela de movimentações recentes com ações rápidas
 * 
 * Exibe as últimas mudanças no pipeline com timeline visual e ações contextuais
 * para cada registro (ver detalhes, enviar follow-up, agendar reunião).
 */
export function RecentMovementsTable({
  movements,
  onNavigate,
  onSendFollowUp,
  onScheduleMeeting,
}: RecentMovementsTableProps) {
  const getMovementConfig = (type: Movement['type']) => {
    switch (type) {
      case 'quote_created':
        return {
          icon: FileText,
          color: 'text-chart-1',
          bg: 'bg-chart-1/10',
          label: 'Orçamento criado',
        };
      case 'quote_approved':
        return {
          icon: CheckCircle2,
          color: 'text-accent-green',
          bg: 'bg-accent-green/10',
          label: 'Orçamento aprovado',
        };
      case 'quote_rejected':
        return {
          icon: XCircle,
          color: 'text-destructive',
          bg: 'bg-destructive/10',
          label: 'Orçamento rejeitado',
        };
      case 'proposal_sent':
        return {
          icon: Send,
          color: 'text-primary',
          bg: 'bg-primary/10',
          label: 'Proposta enviada',
        };
      case 'status_updated':
        return {
          icon: RefreshCw,
          color: 'text-accent-yellow',
          bg: 'bg-accent-yellow/10',
          label: 'Status atualizado',
        };
      case 'meeting_scheduled':
        return {
          icon: Calendar,
          color: 'text-accent-orange',
          bg: 'bg-accent-orange/10',
          label: 'Reunião agendada',
        };
    }
  };

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'agora mesmo';
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays === 1) return 'ontem';
    if (diffDays < 7) return `${diffDays}d atrás`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  if (movements.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed border-border">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">Nenhuma movimentação recente</p>
          <p className="text-xs text-muted-foreground">As atividades aparecerão aqui</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {movements.map((movement, idx) => {
        const config = getMovementConfig(movement.type);
        const Icon = config.icon;

        return (
          <div
            key={movement.id}
            className={cn(
              'group relative flex items-center gap-4 rounded-lg border border-border bg-card p-3 transition-all',
              'hover:border-primary/50 hover:bg-accent/5 hover:shadow-sm'
            )}
          >
            {/* Timeline line (não no último item) */}
            {idx < movements.length - 1 && (
              <div className="absolute left-[27px] top-[52px] h-[calc(100%+8px)] w-px bg-border" />
            )}

            {/* Icon */}
            <div className={cn('z-10 shrink-0 rounded-lg p-2', config.bg)}>
              <Icon className={cn('h-5 w-5', config.color)} />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {config.label}
                    </Badge>
                    {movement.value && (
                      <span className="text-xs font-semibold text-foreground">
                        {formatMoney(movement.value)}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {getRelativeTime(movement.timestamp)}
                    </span>
                  </div>
                  
                  <h4 className="mt-1 truncate text-sm font-semibold text-foreground">
                    {movement.title}
                  </h4>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium">{movement.client}</span>
                    {movement.user && (
                      <>
                        <span>•</span>
                        <span>por {movement.user}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onNavigate(movement.module, movement.recordId)}
                    className="h-8 gap-1.5 px-2"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span className="text-xs">Ver</span>
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => onNavigate(movement.module, movement.recordId)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalhes
                      </DropdownMenuItem>
                      {onSendFollowUp && (
                        <DropdownMenuItem
                          onClick={() => onSendFollowUp(movement.recordId)}
                        >
                          <Mail className="mr-2 h-4 w-4" />
                          Enviar follow-up
                        </DropdownMenuItem>
                      )}
                      {onScheduleMeeting && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onScheduleMeeting(movement.recordId)}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            Agendar reunião
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {movement.description && (
                <p className="text-xs text-muted-foreground">{movement.description}</p>
              )}

              {movement.status && (
                <Badge variant="secondary" className="text-xs">
                  {movement.status}
                </Badge>
              )}
            </div>
          </div>
        );
      })}

      {movements.length > 10 && (
        <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
          <p className="text-xs text-muted-foreground">
            Exibindo as 10 movimentações mais recentes
          </p>
        </div>
      )}
    </div>
  );
}
