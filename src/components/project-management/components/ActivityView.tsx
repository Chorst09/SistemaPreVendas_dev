import React from 'react';
import { mockActivities } from '../data';
import { MessageSquare, RefreshCw, PlusCircle } from 'lucide-react';

export default function ActivityView() {
  return (
    <div className="h-full bg-background overflow-y-auto p-6 text-foreground">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-xl font-semibold text-foreground mb-8">Atividade Recente</h2>

        <div className="relative border-l border-border ml-4 space-y-8 pb-12">
          {mockActivities.map(activity => {
            let Icon = RefreshCw;
            if (activity.action.includes('criou')) Icon = PlusCircle;
            if (activity.action.includes('comentário')) Icon = MessageSquare;

            return (
              <div key={activity.id} className="relative pl-8">
                <div className="absolute -left-[17px] top-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-foreground ring-4 ring-[#141517] ${activity.user.color}`}>
                    {activity.user.initials}
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-4 shadow-sm hover:border-border transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm">
                      <span className="font-semibold text-foreground">{activity.user.name}</span>{' '}
                      <span className="text-muted-foreground">{activity.action}</span>{' '}
                      <span className="font-medium text-primary cursor-pointer hover:underline">{activity.target}</span>
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Icon className="w-3 h-3" />
                      {activity.timestamp}
                    </span>
                  </div>

                  {activity.action.includes('comentário') && (
                    <div className="mt-3 bg-card p-3 rounded border border-border text-sm text-foreground italic">
                      "Precisamos revisar os requisitos do banco de dados antes de avançar com essa etapa."
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
