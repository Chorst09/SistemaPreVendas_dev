'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, TrendingUp, Wrench, FileText } from 'lucide-react';
import type { ProposalTemplateType } from '@/lib/types/commercial-proposal';

interface TemplateSelectorProps {
  onSelect: (type: ProposalTemplateType) => void;
  onClose: () => void;
}

const TEMPLATES: {
  type: ProposalTemplateType;
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  badge: string;
  badgeColor: string;
  description: string;
  audience: string;
  accentColor: string;
  borderColor: string;
  sections: string[];
}[] = [
  {
    type: 'standard',
    icon: FileText,
    name: 'Proposta Padrão',
    badge: 'Clássico',
    badgeColor: 'border-slate-400/30 bg-slate-400/10 text-slate-400',
    description: 'Template completo com todas as 10 seções da proposta comercial. Ideal para projetos gerais de TI com escopo amplo.',
    audience: 'Todos os perfis de cliente',
    accentColor: 'from-slate-600 to-slate-700',
    borderColor: 'border-slate-400/40 hover:border-slate-400/80',
    sections: ['Capa', 'Sumário Executivo', 'Desafio', 'Solução', 'Escopo', 'Cronograma', 'Investimento', 'Diferenciais', 'Próximos Passos'],
  },
  {
    type: 'commercial',
    icon: TrendingUp,
    name: 'Proposta Comercial',
    badge: 'Negócios',
    badgeColor: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-400',
    description: 'Foco em valor de negócio, ROI, cases de sucesso e impacto financeiro. Linguagem executiva voltada para decisores C-level e diretores.',
    audience: 'C-level, Diretores, Gestores de negócio',
    accentColor: 'from-emerald-600 to-teal-600',
    borderColor: 'border-emerald-400/40 hover:border-emerald-400/80',
    sections: ['Capa Executiva', 'Contexto e Dor', 'Proposta de Valor', 'ROI e Benefícios', 'Plano de Implementação', 'Investimento e Planos', 'Cases de Sucesso', 'Por que nós?', 'Próximos Passos'],
  },
  {
    type: 'technical',
    icon: Wrench,
    name: 'Proposta Técnica',
    badge: 'Técnico',
    badgeColor: 'border-blue-400/30 bg-blue-400/10 text-blue-400',
    description: 'Detalhamento técnico completo: arquitetura, especificações, metodologia, SLAs e requisitos. Para equipes técnicas e arquitetos.',
    audience: 'CTO, Arquitetos, Equipes de TI',
    accentColor: 'from-blue-600 to-indigo-600',
    borderColor: 'border-blue-400/40 hover:border-blue-400/80',
    sections: ['Capa Técnica', 'Arquitetura da Solução', 'Especificações Técnicas', 'Metodologia e Processos', 'Escopo e Entregas', 'Cronograma Detalhado', 'SLA e Suporte', 'Requisitos e Premissas', 'Equipe Técnica', 'Investimento'],
  },
];

export function TemplateSelector({ onSelect, onClose }: TemplateSelectorProps) {
  const [selected, setSelected] = useState<ProposalTemplateType>('standard');

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5 text-primary" />
            Escolha o Template da Proposta
          </DialogTitle>
          <DialogDescription>
            Selecione o modelo que melhor se adapta ao seu cliente e objetivo. Você poderá editar todas as seções depois.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2 md:grid-cols-3">
          {TEMPLATES.map((t) => {
            const Icon = t.icon;
            const isSelected = selected === t.type;
            return (
              <button
                key={t.type}
                onClick={() => setSelected(t.type)}
                className={`relative flex flex-col text-left rounded-2xl border-2 transition-all duration-200 overflow-hidden ${t.borderColor} ${
                  isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
                }`}
              >
                {/* Header colorido */}
                <div className={`bg-gradient-to-br ${t.accentColor} p-5`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    {isSelected && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-white">{t.name}</h3>
                  <Badge variant="outline" className={`mt-1 text-xs ${t.badgeColor} border-white/30 bg-white/10 text-white`}>
                    {t.badge}
                  </Badge>
                </div>

                {/* Corpo */}
                <div className="flex-1 bg-card p-4 space-y-3">
                  <p className="text-sm text-muted-foreground leading-5">{t.description}</p>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Público-alvo</p>
                    <p className="text-xs text-foreground">{t.audience}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Seções incluídas</p>
                    <div className="flex flex-wrap gap-1">
                      {t.sections.map((s) => (
                        <span key={s} className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Template selecionado: <span className="font-semibold text-foreground">{TEMPLATES.find(t => t.type === selected)?.name}</span>
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={() => onSelect(selected)}>
              Criar com este Template
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
