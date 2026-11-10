import React from 'react';
import { Issue, IssueStatus } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CheckCircle2, CircleDashed, CircleDot, Clock, User as UserIcon } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const statusColors: Record<IssueStatus, string> = {
  'PENDENTE': 'bg-card text-foreground',
  'PLANEJAMENTO': 'bg-card text-foreground',
  'EM PROGRESSO': 'bg-[#3b82f6] text-foreground',
  'EM RISCO': 'bg-primary text-primary-foreground',
  'ATUALIZAÇÃO NECESSÁRIA': 'bg-[#eab308] text-slate-900',
  'EM ESPERA': 'bg-[#78716c] text-foreground',
  'CONCLUÍDO': 'bg-accent-green text-foreground',
  'CANCELADO': 'bg-accent-green text-foreground'
};

const priorityColors: Record<string, string> = {
  'Urgente': 'text-red-500',
  'Alta': 'text-yellow-500',
  'Normal': 'text-blue-500',
  'Baixa': 'text-muted-foreground',
};

export default function ListView({ issues, onTaskClick }: { issues: Issue[], onTaskClick?: (issue: Issue) => void }) {
  return (
    <div className="h-full bg-background flex flex-col text-foreground">
      <div className="flex-1 overflow-auto p-6">
        <div className="border border-border rounded-lg shadow-sm overflow-hidden bg-card">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-card border-b border-border text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-semibold w-full">Nome da Fase</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Prioridade</th>
                <th className="px-6 py-3 font-semibold">Responsável</th>
                <th className="px-6 py-3 font-semibold">Data Final</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0d1423]">
              {issues.map(issue => (
                <tr
                  key={issue.id}
                  className="hover:bg-card transition-colors group cursor-pointer"
                  onClick={() => onTaskClick?.(issue)}
                >
                  <td className="px-6 py-3 font-medium text-foreground group-hover:text-foreground transition-colors truncate max-w-md flex items-center gap-2">
                    <span className="text-muted-foreground text-[10px] font-mono">{issue.key || `PRJ-${issue.id.slice(-3)}`}</span>
                    {issue.title}
                  </td>
                  <td className="px-6 py-3">
                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold tracking-wider", statusColors[issue.status])}>
                      {issue.status}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className={cn("flex items-center gap-1 font-medium", priorityColors[issue.priority])}>
                      {issue.priority}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    {issue.assignee ? (
                      <div className="flex items-center gap-2">
                        <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-foreground", issue.assignee.color)}>
                          {issue.assignee.initials}
                        </div>
                        <span className="text-foreground text-xs">{issue.assignee.name}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground text-xs">
                        <div className="w-5 h-5 rounded-full border border-dashed border-slate-600 flex items-center justify-center">
                          <UserIcon className="w-3 h-3" />
                        </div>
                        <span>Vazio</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-3 text-muted-foreground text-xs">
                    {issue.dueDate ? issue.dueDate : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
