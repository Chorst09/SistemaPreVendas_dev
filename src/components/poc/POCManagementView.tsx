"use client";

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    AlertCircle,
    ArrowUpRight,
    BarChart3,
    Building,
    Calendar,
    CheckCircle,
    Clock,
    Eye,
    FileText,
    FlaskConical,
    Layers,
    Plus,
    Search,
    ShieldCheck,
    Target,
    TrendingUp,
    User,
    XCircle
} from 'lucide-react';

interface POC {
    id: string;
    title: string;
    client: string;
    technology: string;
    startDate: string;
    endDate: string;
    status: 'Planejamento' | 'Em Execução' | 'Concluído' | 'Cancelado';
    responsible: string;
    budget: number;
    progress: number;
    description: string;
    risk: 'Baixo' | 'Médio' | 'Alto';
    objective: string;
    successCriteria: string[];
}

const statusStyles = {
    Planejamento: {
        badge: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300',
        icon: Clock,
        accent: 'text-cyan-300',
        progress: 'bg-cyan-400'
    },
    'Em Execução': {
        badge: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
        icon: TrendingUp,
        accent: 'text-amber-300',
        progress: 'bg-amber-400'
    },
    Concluído: {
        badge: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
        icon: CheckCircle,
        accent: 'text-emerald-300',
        progress: 'bg-emerald-400'
    },
    Cancelado: {
        badge: 'border-red-400/30 bg-red-400/10 text-red-300',
        icon: XCircle,
        accent: 'text-red-300',
        progress: 'bg-red-400'
    }
};

const riskStyles = {
    Baixo: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
    Médio: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
    Alto: 'border-red-400/30 bg-red-400/10 text-red-300'
};

const formatCurrency = (value: number, maximumFractionDigits = 0) =>
    value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits
    });

const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');

function getDaysRemaining(endDate: string) {
    const today = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function POCManagementView() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');

    const pocs: POC[] = [
        {
            id: 'POC-001',
            title: 'Migração para Azure Cloud',
            client: 'Empresa Alpha',
            technology: 'Microsoft Azure',
            startDate: '2026-06-10',
            endDate: '2026-08-15',
            status: 'Em Execução',
            responsible: 'João Silva',
            budget: 50000,
            progress: 65,
            description: 'Validação da migração de infraestrutura on-premise para Azure com foco em disponibilidade, custo e segurança.',
            risk: 'Médio',
            objective: 'Comprovar viabilidade técnica e financeira da migração para nuvem.',
            successCriteria: ['Ambiente piloto publicado', 'Custos estimados validados', 'Plano de migração aprovado']
        },
        {
            id: 'POC-002',
            title: 'Implementação de IA Generativa',
            client: 'Startup Beta',
            technology: 'OpenAI GPT-4',
            startDate: '2026-05-01',
            endDate: '2026-06-20',
            status: 'Concluído',
            responsible: 'Maria Santos',
            budget: 30000,
            progress: 100,
            description: 'Chatbot inteligente com IA generativa para atendimento e automação de respostas recorrentes.',
            risk: 'Baixo',
            objective: 'Validar ganho operacional e qualidade das respostas com base de conhecimento controlada.',
            successCriteria: ['Base indexada', 'Taxa de acerto medida', 'Relatório executivo entregue']
        },
        {
            id: 'POC-003',
            title: 'Segurança Zero Trust',
            client: 'Indústria Gama',
            technology: 'Palo Alto Networks',
            startDate: '2026-08-01',
            endDate: '2026-09-30',
            status: 'Planejamento',
            responsible: 'Carlos Oliveira',
            budget: 75000,
            progress: 15,
            description: 'Arquitetura Zero Trust com segmentação, identidade, inspeção de tráfego e controles de acesso.',
            risk: 'Alto',
            objective: 'Validar arquitetura de segurança antes da proposta de implantação corporativa.',
            successCriteria: ['Escopo técnico definido', 'Políticas piloto desenhadas', 'Plano de testes aprovado']
        },
        {
            id: 'POC-004',
            title: 'Automação RPA',
            client: 'Banco Delta',
            technology: 'UiPath',
            startDate: '2026-04-15',
            endDate: '2026-05-30',
            status: 'Cancelado',
            responsible: 'Ana Costa',
            budget: 40000,
            progress: 30,
            description: 'Automação de processos financeiros para reduzir atividades manuais e tempo de conciliação.',
            risk: 'Médio',
            objective: 'Validar redução de esforço operacional em rotinas de backoffice financeiro.',
            successCriteria: ['Processo mapeado', 'Robô piloto criado', 'ROI preliminar estimado']
        },
        {
            id: 'POC-005',
            title: 'Kubernetes em Produção',
            client: 'TechCorp',
            technology: 'Kubernetes + Docker',
            startDate: '2026-06-20',
            endDate: '2026-08-30',
            status: 'Em Execução',
            responsible: 'Pedro Lima',
            budget: 60000,
            progress: 45,
            description: 'Orquestração de containers em produção com observabilidade, pipeline e estratégia de rollout.',
            risk: 'Médio',
            objective: 'Comprovar estabilidade e governança operacional para cargas containerizadas.',
            successCriteria: ['Cluster piloto operacional', 'Monitoramento ativo', 'Esteira CI/CD testada']
        }
    ];

    const filteredPOCs = useMemo(() => {
        return pocs.filter(poc => {
            const normalizedSearch = searchTerm.toLowerCase();
            const matchesSearch = poc.title.toLowerCase().includes(normalizedSearch) ||
                poc.client.toLowerCase().includes(normalizedSearch) ||
                poc.technology.toLowerCase().includes(normalizedSearch) ||
                poc.responsible.toLowerCase().includes(normalizedSearch);
            const matchesStatus = selectedStatus === 'all' || poc.status === selectedStatus;
            return matchesSearch && matchesStatus;
        });
    }, [pocs, searchTerm, selectedStatus]);

    const stats = {
        total: pocs.length,
        emExecucao: pocs.filter(p => p.status === 'Em Execução').length,
        concluidos: pocs.filter(p => p.status === 'Concluído').length,
        orcamentoTotal: pocs.reduce((sum, p) => sum + p.budget, 0),
        mediaProgresso: Math.round(pocs.reduce((sum, p) => sum + p.progress, 0) / pocs.length)
    };

    const statusFilters = ['all', 'Planejamento', 'Em Execução', 'Concluído', 'Cancelado'];

    const getStatusBadge = (status: POC['status']) => {
        const style = statusStyles[status];
        const Icon = style.icon;
        return (
            <Badge variant="outline" className={style.badge}>
                <Icon className="mr-1 h-3 w-3" />
                {status}
            </Badge>
        );
    };

    return (
        <div className="space-y-7 p-4 sm:p-6">
            <section className="relative overflow-hidden rounded-lg border border-cyan-400/20 bg-card shadow-xl">
                <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(6,14,30,0.96)_0%,rgba(11,24,48,0.86)_48%,rgba(255,115,45,0.16)_100%)]" />
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-25"
                    style={{ backgroundImage: "url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80')" }}
                />
                <div className="relative z-10 grid gap-6 p-6 text-white lg:grid-cols-[1fr_380px] lg:p-8">
                    <div className="flex flex-col justify-center">
                        <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-100">
                            <FlaskConical className="h-4 w-4 text-cyan-300" />
                            Gestão de validações técnicas e provas controladas
                        </div>
                        <h1 className="max-w-4xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                            Provas de Conceito (POC)
                        </h1>
                        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-200">
                            Acompanhe objetivos, critérios de sucesso, orçamento, riscos e evolução das POCs antes de transformar uma validação técnica em proposta ou projeto.
                        </p>
                        <div className="mt-6 flex flex-wrap gap-3">
                            <Button className="bg-orange-500 text-white hover:bg-orange-600">
                                <Plus className="mr-2 h-4 w-4" />
                                Nova POC
                            </Button>
                            <Button variant="outline" className="border-cyan-300/50 bg-slate-950/30 text-white hover:bg-cyan-300/10 hover:text-white">
                                <FileText className="mr-2 h-4 w-4" />
                                Relatório Executivo
                            </Button>
                        </div>
                    </div>

                    <Card className="border-white/15 bg-slate-950/50 text-white backdrop-blur">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg text-white">
                                <ShieldCheck className="h-5 w-5 text-cyan-300" />
                                Governança da POC
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-md border border-white/10 bg-white/5 p-3">
                                    <p className="text-xs text-slate-300">Progresso médio</p>
                                    <p className="mt-1 text-2xl font-bold">{stats.mediaProgresso}%</p>
                                </div>
                                <div className="rounded-md border border-white/10 bg-white/5 p-3">
                                    <p className="text-xs text-slate-300">Em execução</p>
                                    <p className="mt-1 text-2xl font-bold text-amber-300">{stats.emExecucao}</p>
                                </div>
                            </div>
                            <div className="rounded-md border border-white/10 bg-white/5 p-3">
                                <p className="text-xs text-slate-300">Orçamento total em validação</p>
                                <p className="mt-1 text-xl font-bold">{formatCurrency(stats.orcamentoTotal)}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                    { label: 'Total de POCs', value: stats.total, icon: BarChart3, accent: 'text-cyan-300' },
                    { label: 'Em Execução', value: stats.emExecucao, icon: TrendingUp, accent: 'text-amber-300' },
                    { label: 'Concluídas', value: stats.concluidos, icon: CheckCircle, accent: 'text-emerald-300' },
                    { label: 'Orçamento Total', value: formatCurrency(stats.orcamentoTotal), icon: FileText, accent: 'text-orange-300' }
                ].map((item) => {
                    const Icon = item.icon;
                    return (
                        <Card key={item.label} className="border-border bg-card shadow-sm">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                                        <p className="mt-2 text-2xl font-bold text-foreground">{item.value}</p>
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
                <CardContent className="p-4">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por título, cliente, tecnologia ou responsável..."
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {statusFilters.map((status) => (
                                <Button
                                    key={status}
                                    variant={selectedStatus === status ? 'default' : 'outline'}
                                    onClick={() => setSelectedStatus(status)}
                                    size="sm"
                                >
                                    {status === 'all' ? 'Todos' : status}
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                {filteredPOCs.map((poc) => {
                    const statusStyle = statusStyles[poc.status];
                    const daysRemaining = getDaysRemaining(poc.endDate);
                    return (
                        <Card key={poc.id} className="overflow-hidden border-border bg-card shadow-sm transition-all hover:border-cyan-400/40 hover:shadow-lg">
                            <CardHeader className="border-b border-border/70 bg-background/40">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                        <div className="mb-3 flex flex-wrap items-center gap-2">
                                            <Badge variant="outline" className="border-border bg-background text-muted-foreground">{poc.id}</Badge>
                                            {getStatusBadge(poc.status)}
                                            <Badge variant="outline" className={riskStyles[poc.risk]}>
                                                Risco {poc.risk}
                                            </Badge>
                                        </div>
                                        <CardTitle className="text-xl text-foreground">{poc.title}</CardTitle>
                                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{poc.description}</p>
                                    </div>
                                    <Button variant="outline" size="sm" className="shrink-0">
                                        <Eye className="mr-2 h-4 w-4" />
                                        Ver
                                    </Button>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-5 p-5">
                                <div className="grid gap-3 text-sm sm:grid-cols-2">
                                    <div className="flex items-center gap-2 rounded-md border border-border bg-background/50 p-3">
                                        <Building className="h-4 w-4 text-cyan-300" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Cliente</p>
                                            <p className="font-semibold text-foreground">{poc.client}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 rounded-md border border-border bg-background/50 p-3">
                                        <User className="h-4 w-4 text-cyan-300" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Responsável</p>
                                            <p className="font-semibold text-foreground">{poc.responsible}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 rounded-md border border-border bg-background/50 p-3">
                                        <Layers className="h-4 w-4 text-orange-300" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Tecnologia</p>
                                            <p className="font-semibold text-foreground">{poc.technology}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 rounded-md border border-border bg-background/50 p-3">
                                        <Calendar className="h-4 w-4 text-orange-300" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Prazo</p>
                                            <p className="font-semibold text-foreground">{formatDate(poc.startDate)} - {formatDate(poc.endDate)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="text-sm font-medium text-muted-foreground">Progresso da validação</span>
                                        <span className={`text-sm font-bold ${statusStyle.accent}`}>{poc.progress}%</span>
                                    </div>
                                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                                        <div
                                            className={`h-full rounded-full ${statusStyle.progress}`}
                                            style={{ width: `${poc.progress}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
                                    <div className="rounded-md border border-border bg-background/50 p-4">
                                        <div className="mb-2 flex items-center gap-2">
                                            <Target className="h-4 w-4 text-cyan-300" />
                                            <p className="font-semibold text-foreground">Objetivo da POC</p>
                                        </div>
                                        <p className="text-sm leading-6 text-muted-foreground">{poc.objective}</p>
                                    </div>
                                    <div className="rounded-md border border-border bg-background/50 p-4">
                                        <p className="text-xs text-muted-foreground">Orçamento</p>
                                        <p className="mt-1 text-lg font-bold text-foreground">{formatCurrency(poc.budget, 2)}</p>
                                        <p className="mt-3 text-xs text-muted-foreground">Dias restantes</p>
                                        <p className={`mt-1 font-semibold ${daysRemaining < 0 ? 'text-red-300' : 'text-cyan-300'}`}>
                                            {daysRemaining < 0 ? `${Math.abs(daysRemaining)} dias em atraso` : `${daysRemaining} dias`}
                                        </p>
                                    </div>
                                </div>

                                <div className="rounded-md border border-border bg-background/50 p-4">
                                    <p className="mb-3 font-semibold text-foreground">Critérios de sucesso</p>
                                    <div className="grid gap-2 sm:grid-cols-3">
                                        {poc.successCriteria.map((criterion) => (
                                            <div key={criterion} className="flex items-start gap-2 rounded-md bg-card p-3 text-sm text-muted-foreground">
                                                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                                                <span>{criterion}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row">
                                    <Button variant="outline" size="sm" className="flex-1">
                                        <FileText className="mr-2 h-4 w-4" />
                                        Plano de Testes
                                    </Button>
                                    <Button variant="outline" size="sm" className="flex-1">
                                        <ArrowUpRight className="mr-2 h-4 w-4" />
                                        Evidências
                                    </Button>
                                    {poc.status === 'Em Execução' && (
                                        <Button size="sm" className="flex-1">
                                            Atualizar Status
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </section>

            {filteredPOCs.length === 0 && (
                <Card className="border-border bg-card">
                    <CardContent className="p-12 text-center">
                        <BarChart3 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                        <p className="font-semibold text-foreground">Nenhuma POC encontrada</p>
                        <p className="mt-2 text-sm text-muted-foreground">Ajuste os filtros ou busque por outro cliente, tecnologia ou responsável.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
