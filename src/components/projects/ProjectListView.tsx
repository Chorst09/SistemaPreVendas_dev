'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Project, ProjectStatus, ProjectPriority } from '@/lib/types/project';
import {
    FolderKanban,
    Search,
    Trash2,
    Eye,
    Calendar,
    Users,
    DollarSign,
    TrendingUp,
    RefreshCw,
    FileText,
    ChevronRight,
    Clock,
    AlertTriangle,
    CheckCircle2,
    CircleDashed,
    CirclePause,
    XCircle,
    Filter,
    LayoutGrid,
    List,
} from 'lucide-react';
import { ProjectPDFViewerDialog } from './ProjectPDFViewerDialog';

interface ProjectListViewProps {
    projects: Project[];
    onSelectProject: (project: Project) => void;
    onDeleteProject: (projectId: string) => void;
    onRefresh: () => void;
}

/* ── helpers ─────────────────────────────────────────────── */

const STATUS_CONFIG: Record<ProjectStatus, { label: string; icon: React.ReactNode; pill: string }> = {
    [ProjectStatus.PLANNING]: {
        label: 'Planejamento',
        icon: <CircleDashed className="h-3.5 w-3.5" />,
        pill: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    },
    [ProjectStatus.IN_PROGRESS]: {
        label: 'Em Andamento',
        icon: <TrendingUp className="h-3.5 w-3.5" />,
        pill: 'bg-primary/10 text-primary border-primary/20',
    },
    [ProjectStatus.ON_HOLD]: {
        label: 'Pausado',
        icon: <CirclePause className="h-3.5 w-3.5" />,
        pill: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    },
    [ProjectStatus.COMPLETED]: {
        label: 'Concluído',
        icon: <CheckCircle2 className="h-3.5 w-3.5" />,
        pill: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    },
    [ProjectStatus.CANCELLED]: {
        label: 'Cancelado',
        icon: <XCircle className="h-3.5 w-3.5" />,
        pill: 'bg-destructive/10 text-destructive border-destructive/20',
    },
};

const PRIORITY_CONFIG: Record<ProjectPriority, { label: string; dot: string }> = {
    [ProjectPriority.LOW]:      { label: 'Baixa',    dot: 'bg-slate-400' },
    [ProjectPriority.MEDIUM]:   { label: 'Média',    dot: 'bg-amber-400' },
    [ProjectPriority.HIGH]:     { label: 'Alta',     dot: 'bg-orange-500' },
    [ProjectPriority.CRITICAL]: { label: 'Crítica',  dot: 'bg-red-500 animate-pulse' },
};

const HEALTH_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    green:  { label: 'Saudável',   color: 'text-emerald-500', bg: 'bg-emerald-500' },
    yellow: { label: 'Atenção',    color: 'text-amber-500',   bg: 'bg-amber-500' },
    red:    { label: 'Crítico',    color: 'text-red-500',     bg: 'bg-red-500' },
};

function ProgressRing({ value, size = 44, stroke = 4 }: { value: number; size?: number; stroke?: number }) {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (value / 100) * circ;
    return (
        <svg width={size} height={size} className="-rotate-90">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none"
                strokeWidth={stroke} className="stroke-border/40" />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none"
                strokeWidth={stroke}
                strokeDasharray={circ}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="stroke-primary transition-all duration-700" />
        </svg>
    );
}

/* ── component ───────────────────────────────────────────── */

export function ProjectListView({ projects, onSelectProject, onDeleteProject, onRefresh }: ProjectListViewProps) {
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<ProjectStatus | 'ALL'>('ALL');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [pdfProject, setPdfProject] = useState<Project | null>(null);

    const filtered = projects.filter(p => {
        const matchSearch =
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.description.toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus === 'ALL' || p.status === filterStatus;
        return matchSearch && matchStatus;
    });

    /* ── aggregate stats ── */
    const total = projects.length;
    const inProgress = projects.filter(p => p.status === ProjectStatus.IN_PROGRESS).length;
    const completed  = projects.filter(p => p.status === ProjectStatus.COMPLETED).length;
    const atRisk     = projects.filter(p => p.progress.healthStatus !== 'green').length;

    /* ── empty state ── */
    if (projects.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/20 py-20 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                    <FolderKanban className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Nenhum projeto ainda</h3>
                <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                    Crie um projeto manual ou gere a partir de uma proposta aprovada.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-5">

            {/* ── Summary stats ── */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                    { label: 'Total', value: total,      icon: <FolderKanban className="h-4 w-4" />, color: 'text-primary',         bg: 'bg-primary/10' },
                    { label: 'Em Andamento', value: inProgress, icon: <TrendingUp className="h-4 w-4" />,   color: 'text-blue-500',       bg: 'bg-blue-500/10' },
                    { label: 'Concluídos',  value: completed,  icon: <CheckCircle2 className="h-4 w-4" />, color: 'text-emerald-500',    bg: 'bg-emerald-500/10' },
                    { label: 'Em Risco',    value: atRisk,     icon: <AlertTriangle className="h-4 w-4" />,color: 'text-amber-500',     bg: 'bg-amber-500/10' },
                ].map(s => (
                    <div key={s.label} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/80 p-4 shadow-sm">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${s.bg} ${s.color}`}>
                            {s.icon}
                        </div>
                        <div>
                            <p className="text-xl font-bold text-foreground leading-none">{s.value}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Toolbar ── */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative min-w-[220px] flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                    <Input
                        placeholder="Buscar projetos..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="h-9 pl-9 text-sm"
                    />
                </div>

                {/* Status filter pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                    <Filter className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                    {(['ALL', ...Object.values(ProjectStatus)] as Array<'ALL' | ProjectStatus>).map(s => (
                        <button
                            key={s}
                            onClick={() => setFilterStatus(s)}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                                filterStatus === s
                                    ? 'border-primary/40 bg-primary/10 text-primary'
                                    : 'border-border/50 bg-transparent text-muted-foreground hover:border-border hover:text-foreground'
                            }`}
                        >
                            {s === 'ALL' ? 'Todos' : STATUS_CONFIG[s].label}
                        </button>
                    ))}
                </div>

                {/* View toggle + refresh */}
                <div className="ml-auto flex items-center gap-1.5">
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setViewMode('grid')} title="Grade">
                        <LayoutGrid className={`h-4 w-4 ${viewMode === 'grid' ? 'text-primary' : 'text-muted-foreground'}`} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setViewMode('list')} title="Lista">
                        <List className={`h-4 w-4 ${viewMode === 'list' ? 'text-primary' : 'text-muted-foreground'}`} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onRefresh} title="Atualizar">
                        <RefreshCw className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </div>
            </div>

            {/* ── No results ── */}
            {filtered.length === 0 && (
                <p className="py-10 text-center text-sm text-muted-foreground">Nenhum projeto encontrado para os filtros selecionados.</p>
            )}

            {/* ── Grid view ── */}
            {viewMode === 'grid' && filtered.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {filtered.map(project => {
                        const sc = STATUS_CONFIG[project.status];
                        const pc = PRIORITY_CONFIG[project.priority];
                        const hc = HEALTH_CONFIG[project.progress.healthStatus] ?? HEALTH_CONFIG.green;
                        const budgetPct = project.budget.totalBudget > 0
                            ? Math.round((project.budget.spentBudget / project.budget.totalBudget) * 100)
                            : 0;

                        return (
                            <div
                                key={project.id}
                                className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/90 shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
                            >
                                {/* Color accent top bar */}
                                <div className={`h-1 w-full ${
                                    project.progress.healthStatus === 'green'  ? 'bg-emerald-500' :
                                    project.progress.healthStatus === 'yellow' ? 'bg-amber-500' :
                                    'bg-red-500'
                                }`} />

                                <div className="flex flex-1 flex-col p-5">

                                    {/* Header row */}
                                    <div className="mb-3 flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            {/* Priority dot + name */}
                                            <div className="flex items-center gap-2">
                                                <span className={`h-2 w-2 shrink-0 rounded-full ${pc.dot}`} title={`Prioridade ${pc.label}`} />
                                                <h3 className="truncate text-[15px] font-bold text-foreground">{project.name}</h3>
                                            </div>
                                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{project.description}</p>
                                        </div>
                                        {/* Status pill */}
                                        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${sc.pill}`}>
                                            {sc.icon}
                                            {sc.label}
                                        </span>
                                    </div>

                                    {/* Progress ring + metrics */}
                                    <div className="mb-4 flex items-center gap-4">
                                        <div className="relative flex shrink-0 items-center justify-center">
                                            <ProgressRing value={project.progress.overallProgress} size={48} stroke={4.5} />
                                            <span className="absolute text-[11px] font-bold text-foreground">
                                                {project.progress.overallProgress}%
                                            </span>
                                        </div>
                                        <div className="grid flex-1 grid-cols-2 gap-x-3 gap-y-1.5">
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Users className="h-3.5 w-3.5 shrink-0" />
                                                <span>{project.team.length} membros</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Calendar className="h-3.5 w-3.5 shrink-0" />
                                                <span>{project.timeline.phases.length} fases</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <DollarSign className="h-3.5 w-3.5 shrink-0" />
                                                <span className="truncate">R$ {(project.budget.totalBudget || 0).toLocaleString('pt-BR')}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                                <span>{project.risks.length} riscos</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Budget bar */}
                                    <div className="mb-4">
                                        <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                                            <span>Orçamento utilizado</span>
                                            <span className="font-semibold">{budgetPct}%</span>
                                        </div>
                                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border/40">
                                            <div
                                                className={`h-full rounded-full transition-all ${
                                                    budgetPct > 90 ? 'bg-red-500' :
                                                    budgetPct > 70 ? 'bg-amber-500' :
                                                    'bg-emerald-500'
                                                }`}
                                                style={{ width: `${Math.min(budgetPct, 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Health + type + dates */}
                                    <div className="mb-4 flex flex-wrap items-center gap-2">
                                        <div className={`flex items-center gap-1 text-[11px] font-semibold ${hc.color}`}>
                                            <span className={`h-1.5 w-1.5 rounded-full ${hc.bg}`} />
                                            {hc.label}
                                        </div>
                                        <span className="rounded-full border border-border/50 px-2 py-0.5 text-[11px] text-muted-foreground">
                                            {project.type}
                                        </span>
                                        {project.endDate && (
                                            <span className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground">
                                                <Clock className="h-3 w-3" />
                                                {new Date(project.endDate).toLocaleDateString('pt-BR')}
                                            </span>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="mt-auto flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            className="h-8 flex-1 gap-1.5 text-xs"
                                            onClick={() => onSelectProject(project)}
                                        >
                                            <Eye className="h-3.5 w-3.5" />
                                            Ver Detalhes
                                            <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-60" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            className="h-8 w-8 shrink-0"
                                            onClick={() => setPdfProject(project)}
                                            title="Exportar PDF"
                                        >
                                            <FileText className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                            onClick={() => onDeleteProject(project.id)}
                                            title="Excluir projeto"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── List view ── */}
            {viewMode === 'list' && filtered.length > 0 && (
                <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/90 shadow-sm">
                    {/* Table header */}
                    <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 border-b border-border/60 bg-muted/30 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                        <span>Projeto</span>
                        <span>Status</span>
                        <span>Progresso</span>
                        <span>Saúde</span>
                        <span>Ações</span>
                    </div>

                    {filtered.map((project, idx) => {
                        const sc = STATUS_CONFIG[project.status];
                        const pc = PRIORITY_CONFIG[project.priority];
                        const hc = HEALTH_CONFIG[project.progress.healthStatus] ?? HEALTH_CONFIG.green;

                        return (
                            <div
                                key={project.id}
                                className={`grid grid-cols-[2fr_1fr_1fr_1fr_auto] items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/20 ${
                                    idx < filtered.length - 1 ? 'border-b border-border/40' : ''
                                }`}
                            >
                                {/* Name */}
                                <div className="flex min-w-0 items-center gap-3">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                        <FolderKanban className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${pc.dot}`} />
                                            <p className="truncate text-sm font-semibold text-foreground">{project.name}</p>
                                        </div>
                                        <p className="truncate text-xs text-muted-foreground">{project.type}</p>
                                    </div>
                                </div>

                                {/* Status */}
                                <span className={`inline-flex w-fit items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${sc.pill}`}>
                                    {sc.icon}{sc.label}
                                </span>

                                {/* Progress */}
                                <div className="flex items-center gap-2">
                                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border/40">
                                        <div className="h-full rounded-full bg-primary transition-all"
                                            style={{ width: `${project.progress.overallProgress}%` }} />
                                    </div>
                                    <span className="w-8 text-right text-xs font-semibold text-foreground">
                                        {project.progress.overallProgress}%
                                    </span>
                                </div>

                                {/* Health */}
                                <div className={`flex items-center gap-1.5 text-xs font-semibold ${hc.color}`}>
                                    <span className={`h-2 w-2 rounded-full ${hc.bg}`} />
                                    {hc.label}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1.5">
                                    <Button size="sm" className="h-7 gap-1 text-xs" onClick={() => onSelectProject(project)}>
                                        <Eye className="h-3 w-3" />Detalhes
                                    </Button>
                                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setPdfProject(project)}>
                                        <FileText className="h-3 w-3" />
                                    </Button>
                                    <Button size="icon" variant="ghost"
                                        className="h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                        onClick={() => onDeleteProject(project.id)}>
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <ProjectPDFViewerDialog
                project={pdfProject}
                open={!!pdfProject}
                onOpenChange={open => { if (!open) setPdfProject(null); }}
            />
        </div>
    );
}
