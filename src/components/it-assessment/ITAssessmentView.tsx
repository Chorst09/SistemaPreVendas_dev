"use client";

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    AlertTriangle,
    BarChart3,
    CheckCircle,
    CheckSquare,
    Cloud,
    Database,
    Download,
    FileText,
    Layers,
    Network,
    Plus,
    Printer,
    Server,
    Shield,
    Target,
    TrendingUp,
    Users,
    X,
    XCircle,
} from 'lucide-react';

type AssessmentStatus = 'completed' | 'in-progress' | 'pending';

interface AssessmentCategory {
    id: string;
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
}

interface AssessmentItem {
    id: number;
    category: string;
    title: string;
    description: string;
    status: AssessmentStatus;
    score: number;
    maturity: 'Inicial' | 'Intermediário' | 'Avançado' | 'Crítico';
    findings: string[];
    recommendation: string;
}

const statusStyles = {
    completed: {
        label: 'Concluído',
        badge: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
        icon: CheckCircle,
        progress: 'bg-emerald-400'
    },
    'in-progress': {
        label: 'Em Andamento',
        badge: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
        icon: AlertTriangle,
        progress: 'bg-amber-400'
    },
    pending: {
        label: 'Pendente',
        badge: 'border-muted bg-muted text-muted-foreground',
        icon: XCircle,
        progress: 'bg-muted-foreground'
    }
};

const scoreStyle = (score: number) => {
    if (score >= 80) return { text: 'text-emerald-300', bar: 'bg-emerald-400', label: 'Saudável' };
    if (score >= 60) return { text: 'text-amber-300',   bar: 'bg-amber-400',   label: 'Atenção'  };
    if (score > 0)   return { text: 'text-red-300',     bar: 'bg-red-400',     label: 'Crítico'  };
    return               { text: 'text-muted-foreground', bar: 'bg-muted-foreground', label: 'Não iniciado' };
};

const CATEGORY_OPTIONS = [
    { id: 'infrastructure', name: 'Infraestrutura', icon: Server },
    { id: 'security',       name: 'Segurança',      icon: Shield },
    { id: 'cloud',          name: 'Cloud',           icon: Cloud  },
    { id: 'data',           name: 'Dados',           icon: Database },
    { id: 'network',        name: 'Rede',            icon: Network },
    { id: 'users',          name: 'Usuários',        icon: Users  },
];

const EMPTY_ITEM: Omit<AssessmentItem, 'id'> = {
    category: 'infrastructure',
    title: '',
    description: '',
    status: 'pending',
    score: 0,
    maturity: 'Inicial',
    findings: ['', '', ''],
    recommendation: '',
};

// ── Modal: Novo Assessment ─────────────────────────────────────────────────────

function NewAssessmentModal({ onSave, onClose }: {
    onSave: (item: AssessmentItem) => void;
    onClose: () => void;
}) {
    const [form, setForm]   = useState<Omit<AssessmentItem, 'id'>>(EMPTY_ITEM);
    const [errors, setErrors] = useState<Partial<Record<keyof AssessmentItem, string>>>({});

    const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
        setForm(prev => ({ ...prev, [k]: v }));

    const setFinding = (i: number, v: string) =>
        setForm(prev => { const f = [...prev.findings]; f[i] = v; return { ...prev, findings: f }; });

    const addFinding    = () => setForm(prev => ({ ...prev, findings: [...prev.findings, ''] }));
    const removeFinding = (i: number) =>
        setForm(prev => ({ ...prev, findings: prev.findings.filter((_, idx) => idx !== i) }));

    const validate = () => {
        const e: typeof errors = {};
        if (!form.title.trim())          e.title          = 'Título obrigatório';
        if (!form.description.trim())    e.description    = 'Descrição obrigatória';
        if (!form.recommendation.trim()) e.recommendation = 'Recomendação obrigatória';
        if (form.score < 0 || form.score > 100) e.score   = 'Score deve ser 0–100';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = () => {
        if (!validate()) return;
        onSave({
            ...form,
            id: Date.now(),
            findings: form.findings.filter(f => f.trim()),
        });
        onClose();
    };

    const scoreInfo = scoreStyle(form.score);

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CheckSquare className="h-5 w-5 text-cyan-500" />
                        Novo Assessment de TI
                    </DialogTitle>
                    <DialogDescription>
                        Preencha os dados do controle a ser avaliado. Campos * são obrigatórios.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-2">
                    {/* Identificação */}
                    <div>
                        <p className="mb-3 text-sm font-semibold text-foreground">Identificação</p>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5 sm:col-span-2">
                                <Label className="text-xs">Título *</Label>
                                <Input value={form.title}
                                    onChange={e => set('title', e.target.value)}
                                    placeholder="Ex: Políticas de Segurança"
                                    className={errors.title ? 'border-destructive' : ''} />
                                {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Categoria</Label>
                                <Select value={form.category} onValueChange={v => set('category', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {CATEGORY_OPTIONS.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Status</Label>
                                <Select value={form.status} onValueChange={v => set('status', v as AssessmentStatus)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">Pendente</SelectItem>
                                        <SelectItem value="in-progress">Em Andamento</SelectItem>
                                        <SelectItem value="completed">Concluído</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5 sm:col-span-2">
                                <Label className="text-xs">Descrição *</Label>
                                <Textarea rows={3} value={form.description}
                                    onChange={e => set('description', e.target.value)}
                                    placeholder="Descreva o escopo e contexto da avaliação"
                                    className={errors.description ? 'border-destructive' : ''} />
                                {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Score e Maturidade */}
                    <div>
                        <p className="mb-3 text-sm font-semibold text-foreground">Pontuação e Maturidade</p>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs">Score (0–100)</Label>
                                    <span className={`text-lg font-bold ${scoreInfo.text}`}>
                                        {form.score}% — {scoreInfo.label}
                                    </span>
                                </div>
                                <input type="range" min={0} max={100} step={5} value={form.score}
                                    onChange={e => set('score', Number(e.target.value))}
                                    className="w-full accent-primary" />
                                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                    <div className={`h-full rounded-full transition-all ${scoreInfo.bar}`}
                                        style={{ width: `${form.score}%` }} />
                                </div>
                                {errors.score && <p className="text-xs text-destructive">{errors.score}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Nível de Maturidade</Label>
                                <Select value={form.maturity} onValueChange={v => set('maturity', v as AssessmentItem['maturity'])}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Crítico">Crítico</SelectItem>
                                        <SelectItem value="Inicial">Inicial</SelectItem>
                                        <SelectItem value="Intermediário">Intermediário</SelectItem>
                                        <SelectItem value="Avançado">Avançado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Achados */}
                    <div>
                        <div className="mb-3 flex items-center justify-between">
                            <p className="text-sm font-semibold text-foreground">Principais Achados</p>
                            <Button size="sm" variant="outline" onClick={addFinding}>
                                <Plus className="mr-1.5 h-3.5 w-3.5" /> Adicionar
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {form.findings.map((f, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 shrink-0 text-cyan-400" />
                                    <Input value={f} onChange={e => setFinding(i, e.target.value)}
                                        placeholder={`Achado ${i + 1}`} />
                                    {form.findings.length > 1 && (
                                        <Button size="icon" variant="ghost"
                                            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                                            onClick={() => removeFinding(i)}>
                                            <X className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recomendação */}
                    <div className="space-y-1.5">
                        <Label className="text-xs">Recomendação *</Label>
                        <Textarea rows={3} value={form.recommendation}
                            onChange={e => set('recommendation', e.target.value)}
                            placeholder="Descreva as ações recomendadas para evolução"
                            className={errors.recommendation ? 'border-destructive' : ''} />
                        {errors.recommendation && <p className="text-xs text-destructive">{errors.recommendation}</p>}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave}>
                        <CheckSquare className="mr-2 h-4 w-4" /> Criar Assessment
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ── Modal: Relatório Executivo ─────────────────────────────────────────────────

function ExecutiveReportModal({ items, categories, onClose }: {
    items: AssessmentItem[];
    categories: AssessmentCategory[];
    onClose: () => void;
}) {
    const [filterCat, setFilterCat] = useState('all');

    const filtered = filterCat === 'all' ? items : items.filter(i => i.category === filterCat);

    const overall       = items.length ? Math.round(items.reduce((s, i) => s + i.score, 0) / items.length) : 0;
    const completed     = items.filter(i => i.status === 'completed').length;
    const inProgress    = items.filter(i => i.status === 'in-progress').length;
    const pending       = items.filter(i => i.status === 'pending').length;
    const critical      = items.filter(i => i.score > 0 && i.score < 60).length;
    const healthy       = items.filter(i => i.score >= 80).length;
    const notStarted    = items.filter(i => i.score === 0).length;

    const handleExportCSV = () => {
        const headers = ['ID', 'Categoria', 'Título', 'Status', 'Score', 'Maturidade', 'Achados', 'Recomendação'];
        const rows = items.map(i => [
            i.id,
            categories.find(c => c.id === i.category)?.name ?? i.category,
            i.title,
            statusStyles[i.status].label,
            `${i.score}%`,
            i.maturity,
            i.findings.join(' | '),
            i.recommendation,
        ]);
        const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `assessment-ti-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const scoreInfo = scoreStyle(overall);

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                <BarChart3 className="h-5 w-5 text-cyan-500" />
                                Relatório Executivo — Assessment de TI
                            </DialogTitle>
                            <DialogDescription>
                                Gerado em {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </DialogDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={handleExportCSV}>
                                <Download className="mr-1.5 h-3.5 w-3.5" /> CSV
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => window.print()}>
                                <Printer className="mr-1.5 h-3.5 w-3.5" /> Imprimir
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 py-2">
                    {/* Score geral + KPIs */}
                    <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
                        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-muted/20 p-6 text-center">
                            <p className="text-xs text-muted-foreground mb-2">Score Geral de Maturidade</p>
                            <p className={`text-5xl font-bold ${scoreInfo.text}`}>{overall}%</p>
                            <p className={`mt-1 text-sm font-semibold ${scoreInfo.text}`}>{scoreInfo.label}</p>
                            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                                <div className={`h-full rounded-full ${scoreInfo.bar}`} style={{ width: `${overall}%` }} />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: 'Concluídos',   value: completed,   color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                                { label: 'Em Andamento', value: inProgress,  color: 'text-amber-400',   bg: 'bg-amber-500/10'   },
                                { label: 'Pendentes',    value: pending,     color: 'text-muted-foreground', bg: 'bg-muted/40'  },
                                { label: 'Saudáveis ≥80%', value: healthy,   color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                                { label: 'Críticos <60%', value: critical,   color: 'text-red-400',     bg: 'bg-red-500/10'     },
                                { label: 'Não Iniciados', value: notStarted, color: 'text-muted-foreground', bg: 'bg-muted/40'  },
                            ].map(k => (
                                <div key={k.label} className={`rounded-xl border border-border ${k.bg} p-3 text-center`}>
                                    <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
                                    <p className="mt-0.5 text-[11px] text-muted-foreground">{k.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Barra por categoria */}
                    <div className="rounded-xl border border-border bg-muted/20 p-5">
                        <p className="mb-4 font-semibold text-foreground">Score por Categoria</p>
                        <div className="space-y-3">
                            {categories.map(cat => {
                                const catItems = items.filter(i => i.category === cat.id);
                                const catScore = catItems.length
                                    ? Math.round(catItems.reduce((s, i) => s + i.score, 0) / catItems.length) : 0;
                                const si = scoreStyle(catScore);
                                const Icon = cat.icon;
                                return (
                                    <div key={cat.id} className="flex items-center gap-3">
                                        <div className="flex w-36 items-center gap-2 shrink-0">
                                            <Icon className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm text-muted-foreground">{cat.name}</span>
                                        </div>
                                        <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                                            <div className={`h-full ${si.bar} rounded-full transition-all`}
                                                style={{ width: `${catScore}%` }} />
                                        </div>
                                        <span className={`w-12 text-right text-sm font-bold ${si.text}`}>{catScore}%</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Alertas */}
                    {critical > 0 && (
                        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            {critical} controle(s) com score abaixo de 60% — ação imediata recomendada
                        </div>
                    )}
                    {notStarted > 0 && (
                        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            {notStarted} controle(s) ainda não avaliado(s) — execute a análise para completar o diagnóstico
                        </div>
                    )}

                    {/* Tabela */}
                    <div>
                        <div className="mb-3 flex items-center justify-between">
                            <p className="font-semibold text-foreground">Detalhamento por Controle</p>
                            <Select value={filterCat} onValueChange={setFilterCat}>
                                <SelectTrigger className="w-44 h-8 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas as categorias</SelectItem>
                                    {categories.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-border">
                            <div className="grid grid-cols-[1fr_100px_70px_80px] bg-muted/40 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                <span>Controle</span>
                                <span>Status</span>
                                <span>Score</span>
                                <span>Maturidade</span>
                            </div>
                            {filtered.map((item, idx) => {
                                const si = scoreStyle(item.score);
                                const cat = categories.find(c => c.id === item.category);
                                return (
                                    <div key={item.id}
                                        className={`grid grid-cols-[1fr_100px_70px_80px] items-center gap-2 border-t border-border/50 px-4 py-3 text-sm hover:bg-muted/20 ${idx % 2 === 1 ? 'bg-muted/10' : ''}`}>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-foreground truncate">{item.title}</p>
                                            <p className="text-xs text-muted-foreground">{cat?.name ?? item.category}</p>
                                        </div>
                                        <Badge variant="outline" className={`w-fit text-[10px] ${statusStyles[item.status].badge}`}>
                                            {statusStyles[item.status].label}
                                        </Badge>
                                        <span className={`text-sm font-bold ${si.text}`}>{item.score}%</span>
                                        <span className="text-xs text-muted-foreground">{item.maturity}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Achados e recomendações */}
                    <div>
                        <p className="mb-3 font-semibold text-foreground">Achados e Recomendações</p>
                        <div className="space-y-3">
                            {filtered.filter(i => i.findings.length > 0 || i.recommendation).map(item => {
                                const si = scoreStyle(item.score);
                                return (
                                    <div key={item.id} className="rounded-xl border border-border bg-muted/10 p-4">
                                        <div className="mb-3 flex items-center justify-between">
                                            <p className="font-bold text-foreground">{item.title}</p>
                                            <span className={`text-sm font-bold ${si.text}`}>{item.score}%</span>
                                        </div>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div>
                                                <p className="mb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Achados</p>
                                                <ul className="space-y-1">
                                                    {item.findings.map(f => (
                                                        <li key={f} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                                            <CheckCircle className="mt-0.5 h-3 w-3 shrink-0 text-cyan-400" />
                                                            {f}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div>
                                                <p className="mb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recomendação</p>
                                                <p className="text-xs text-muted-foreground leading-5">{item.recommendation}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Fechar</Button>
                    <Button onClick={handleExportCSV}>
                        <Download className="mr-2 h-4 w-4" /> Exportar CSV
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function ITAssessmentView() {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [showNewAssessment, setShowNewAssessment] = useState(false);
    const [showReport,        setShowReport]        = useState(false);

    const categories: AssessmentCategory[] = [
        { id: 'infrastructure', name: 'Infraestrutura', icon: Server,   description: 'Servidores, virtualização, capacidade e continuidade.' },
        { id: 'security',       name: 'Segurança',      icon: Shield,   description: 'Políticas, controles, identidade e postura de risco.' },
        { id: 'cloud',          name: 'Cloud',           icon: Cloud,    description: 'Prontidão para nuvem, custos, governança e arquitetura.' },
        { id: 'data',           name: 'Dados',           icon: Database, description: 'Backup, recuperação, retenção e disponibilidade.' },
        { id: 'network',        name: 'Rede',            icon: Network,  description: 'Topologia, performance, segmentação e conectividade.' },
        { id: 'users',          name: 'Usuários',        icon: Users,    description: 'Acessos, perfis, produtividade e suporte ao negócio.' },
    ];

    const [assessmentItems, setAssessmentItems] = useState<AssessmentItem[]>([
        {
            id: 1,
            category: 'infrastructure',
            title: 'Servidores e Hardware',
            description: 'Avaliação da infraestrutura física e virtual, capacidade, ciclo de vida e disponibilidade.',
            status: 'completed',
            score: 85,
            maturity: 'Avançado',
            findings: ['Capacidade adequada', 'Inventário consistente', 'Renovação planejada'],
            recommendation: 'Manter governança de capacidade e padronizar plano de atualização.'
        },
        {
            id: 2,
            category: 'security',
            title: 'Políticas de Segurança',
            description: 'Análise de políticas, MFA, segregação de acesso, logs e controles preventivos.',
            status: 'in-progress',
            score: 70,
            maturity: 'Intermediário',
            findings: ['MFA parcial', 'Logs descentralizados', 'Políticas em revisão'],
            recommendation: 'Priorizar identidade, trilhas de auditoria e resposta a incidentes.'
        },
        {
            id: 3,
            category: 'cloud',
            title: 'Migração para Cloud',
            description: 'Avaliação de workloads, dependências, custos, landing zone e governança cloud.',
            status: 'pending',
            score: 0,
            maturity: 'Inicial',
            findings: ['Inventário pendente', 'Custos não estimados', 'Dependências a mapear'],
            recommendation: 'Executar discovery técnico e business case antes da migração.'
        },
        {
            id: 4,
            category: 'data',
            title: 'Backup e Recuperação',
            description: 'Análise de backup, RPO, RTO, restauração, retenção e proteção contra perda de dados.',
            status: 'completed',
            score: 90,
            maturity: 'Avançado',
            findings: ['Backups testados', 'RPO definido', 'Restauração documentada'],
            recommendation: 'Evoluir para testes automatizados e relatórios periódicos.'
        },
        {
            id: 5,
            category: 'network',
            title: 'Infraestrutura de Rede',
            description: 'Avaliação de topologia, redundância, performance, segmentação e observabilidade.',
            status: 'completed',
            score: 75,
            maturity: 'Intermediário',
            findings: ['Redundância parcial', 'Monitoramento ativo', 'Segmentação a melhorar'],
            recommendation: 'Revisar desenho de VLANs, links críticos e monitoramento proativo.'
        },
        {
            id: 6,
            category: 'users',
            title: 'Gestão de Usuários',
            description: 'Análise de ciclo de vida de acessos, perfis, onboarding, offboarding e suporte.',
            status: 'in-progress',
            score: 65,
            maturity: 'Intermediário',
            findings: ['Perfis duplicados', 'Offboarding manual', 'Catálogo em construção'],
            recommendation: 'Implantar revisão periódica de acessos e automação de desligamentos.'
        }
    ]);

    const handleNewAssessment = (item: AssessmentItem) => {
        setAssessmentItems(prev => [item, ...prev]);
    };

    const filteredItems = selectedCategory === 'all'
        ? assessmentItems
        : assessmentItems.filter(item => item.category === selectedCategory);

    const overallScore = Math.round(assessmentItems.reduce((sum, item) => sum + item.score, 0) / assessmentItems.length);
    const completedCount = assessmentItems.filter(item => item.status === 'completed').length;
    const criticalCount = assessmentItems.filter(item => item.score > 0 && item.score < 60).length;
    const progressPercent = Math.round((completedCount / assessmentItems.length) * 100);

    const selectedCategoryData = useMemo(
        () => categories.find(category => category.id === selectedCategory),
        [categories, selectedCategory]
    );

    const getStatusBadge = (status: AssessmentStatus) => {
        const style = statusStyles[status];
        const Icon = style.icon;
        return (
            <Badge variant="outline" className={style.badge}>
                <Icon className="mr-1 h-3 w-3" />
                {style.label}
            </Badge>
        );
    };

    return (
        <div className="space-y-7 p-4 sm:p-6">
            <section className="relative overflow-hidden rounded-lg border border-cyan-400/20 bg-card shadow-xl">
                <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(6,14,30,0.96)_0%,rgba(11,24,48,0.86)_50%,rgba(255,115,45,0.16)_100%)]" />
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-25"
                    style={{ backgroundImage: "url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=80')" }}
                />
                <div className="relative z-10 grid gap-6 p-6 text-white lg:grid-cols-[1fr_360px] lg:p-8">
                    <div>
                        <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-100">
                            <CheckSquare className="h-4 w-4 text-cyan-300" />
                            Diagnóstico técnico para arquitetura, risco e roadmap
                        </div>
                        <h1 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">Assessment de TI</h1>
                        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-200">
                            Avalie infraestrutura, segurança, cloud, dados, rede e usuários com pontuação, maturidade, achados e recomendações executivas.
                        </p>
                        <div className="mt-6 flex flex-wrap gap-3">
                            <Button className="bg-orange-500 text-white hover:bg-orange-600"
                                onClick={() => setShowNewAssessment(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Novo Assessment
                            </Button>
                            <Button variant="outline" className="border-cyan-300/50 bg-slate-950/30 text-white hover:bg-cyan-300/10 hover:text-white"
                                onClick={() => setShowReport(true)}>
                                <FileText className="mr-2 h-4 w-4" />
                                Relatório Executivo
                            </Button>
                        </div>
                    </div>

                    <Card className="border-white/15 bg-slate-950/50 text-white backdrop-blur">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg text-white">
                                <TrendingUp className="h-5 w-5 text-cyan-300" />
                                Maturidade Geral
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="flex items-end gap-3">
                                    <span className={`text-5xl font-bold ${scoreStyle(overallScore).text}`}>{overallScore}%</span>
                                    <span className="pb-2 text-sm text-slate-300">{scoreStyle(overallScore).label}</span>
                                </div>
                                <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                                    <div className={`h-full rounded-full ${scoreStyle(overallScore).bar}`} style={{ width: `${overallScore}%` }} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-md border border-white/10 bg-white/5 p-3">
                                    <p className="text-xs text-slate-300">Concluídos</p>
                                    <p className="mt-1 text-2xl font-bold text-emerald-300">{completedCount}/{assessmentItems.length}</p>
                                </div>
                                <div className="rounded-md border border-white/10 bg-white/5 p-3">
                                    <p className="text-xs text-slate-300">Críticos</p>
                                    <p className="mt-1 text-2xl font-bold text-red-300">{criticalCount}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                    { label: 'Score Geral', value: `${overallScore}%`, icon: Target, accent: scoreStyle(overallScore).text },
                    { label: 'Conclusão', value: `${progressPercent}%`, icon: CheckCircle, accent: 'text-emerald-300' },
                    { label: 'Categorias', value: categories.length, icon: Layers, accent: 'text-cyan-300' },
                    { label: 'Itens Avaliados', value: assessmentItems.length, icon: FileText, accent: 'text-orange-300' }
                ].map((item) => {
                    const Icon = item.icon;
                    return (
                        <Card key={item.label} className="border-border bg-card shadow-sm">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                                        <p className={`mt-2 text-2xl font-bold ${item.accent}`}>{item.value}</p>
                                    </div>
                                    <div className={`flex h-12 w-12 items-center justify-center rounded-md bg-background ${item.accent}`}>
                                        <Icon className="h-6 w-6" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </section>

            <Card className="border-border bg-card shadow-sm">
                <CardHeader>
                    <CardTitle>Categorias do Assessment</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-7">
                        <Button
                            variant={selectedCategory === 'all' ? 'default' : 'outline'}
                            onClick={() => setSelectedCategory('all')}
                            className="h-auto justify-start p-4"
                        >
                            Todas
                        </Button>
                        {categories.map(category => {
                            const Icon = category.icon;
                            return (
                                <Button
                                    key={category.id}
                                    variant={selectedCategory === category.id ? 'default' : 'outline'}
                                    onClick={() => setSelectedCategory(category.id)}
                                    className="h-auto justify-start gap-2 p-4"
                                >
                                    <Icon className="h-4 w-4" />
                                    {category.name}
                                </Button>
                            );
                        })}
                    </div>
                    {selectedCategoryData && (
                        <div className="mt-4 rounded-md border border-border bg-background/50 p-4 text-sm text-muted-foreground">
                            {selectedCategoryData.description}
                        </div>
                    )}
                </CardContent>
            </Card>

            <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                {filteredItems.map(item => {
                    const category = categories.find(c => c.id === item.category);
                    const Icon = category?.icon || Server;
                    const score = scoreStyle(item.score);
                    return (
                        <Card key={item.id} className="border-border bg-card shadow-sm transition-all hover:border-cyan-400/40 hover:shadow-lg">
                            <CardHeader className="border-b border-border/70 bg-background/40">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <div className="mb-3 flex flex-wrap items-center gap-2">
                                            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-cyan-400/12 text-cyan-300">
                                                <Icon className="h-5 w-5" />
                                            </span>
                                            {getStatusBadge(item.status)}
                                            <Badge variant="outline" className="border-border bg-background text-muted-foreground">
                                                {item.maturity}
                                            </Badge>
                                        </div>
                                        <CardTitle className="text-xl text-foreground">{item.title}</CardTitle>
                                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-3xl font-bold ${score.text}`}>{item.score}%</p>
                                        <p className="text-xs text-muted-foreground">{score.label}</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-5 p-5">
                                {item.score > 0 && (
                                    <div>
                                        <div className="mb-2 flex items-center justify-between">
                                            <span className="text-sm font-medium text-muted-foreground">Score do controle</span>
                                            <span className={`text-sm font-bold ${score.text}`}>{item.score}%</span>
                                        </div>
                                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                                            <div className={`h-full rounded-full ${score.bar}`} style={{ width: `${item.score}%` }} />
                                        </div>
                                    </div>
                                )}

                                <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
                                    <div className="rounded-md border border-border bg-background/50 p-4">
                                        <p className="font-semibold text-foreground">Principais achados</p>
                                        <div className="mt-3 space-y-2">
                                            {item.findings.map((finding) => (
                                                <div key={finding} className="flex items-start gap-2 text-sm text-muted-foreground">
                                                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                                                    <span>{finding}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="rounded-md border border-border bg-background/50 p-4">
                                        <p className="font-semibold text-foreground">Recomendação</p>
                                        <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.recommendation}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row">
                                    <Button variant="outline" size="sm" className="flex-1">Ver Detalhes</Button>
                                    {item.status !== 'completed' && <Button size="sm" className="flex-1">Continuar Avaliação</Button>}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </section>

            {filteredItems.length === 0 && (
                <Card className="border-border bg-card">
                    <CardContent className="p-12 text-center">
                        <CheckSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                        <p className="font-semibold text-foreground">Nenhum assessment encontrado</p>
                        <p className="mt-2 text-sm text-muted-foreground">Selecione outra categoria para visualizar os controles avaliados.</p>
                    </CardContent>
                </Card>
            )}

            {/* ── Modals ── */}
            {showNewAssessment && (
                <NewAssessmentModal
                    onSave={handleNewAssessment}
                    onClose={() => setShowNewAssessment(false)}
                />
            )}
            {showReport && (
                <ExecutiveReportModal
                    items={assessmentItems}
                    categories={categories}
                    onClose={() => setShowReport(false)}
                />
            )}
        </div>
    );
}
