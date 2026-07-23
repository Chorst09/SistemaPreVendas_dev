"use client";

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    AlertTriangle,
    CheckCircle,
    CheckSquare,
    Cloud,
    Database,
    FileText,
    Layers,
    Network,
    Plus,
    Server,
    Shield,
    Target,
    TrendingUp,
    Users,
    XCircle
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
    if (score >= 60) return { text: 'text-amber-300', bar: 'bg-amber-400', label: 'Atenção' };
    if (score > 0) return { text: 'text-red-300', bar: 'bg-red-400', label: 'Crítico' };
    return { text: 'text-muted-foreground', bar: 'bg-muted-foreground', label: 'Não iniciado' };
};

export function ITAssessmentView() {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const categories: AssessmentCategory[] = [
        { id: 'infrastructure', name: 'Infraestrutura', icon: Server, description: 'Servidores, virtualização, capacidade e continuidade.' },
        { id: 'security', name: 'Segurança', icon: Shield, description: 'Políticas, controles, identidade e postura de risco.' },
        { id: 'cloud', name: 'Cloud', icon: Cloud, description: 'Prontidão para nuvem, custos, governança e arquitetura.' },
        { id: 'data', name: 'Dados', icon: Database, description: 'Backup, recuperação, retenção e disponibilidade.' },
        { id: 'network', name: 'Rede', icon: Network, description: 'Topologia, performance, segmentação e conectividade.' },
        { id: 'users', name: 'Usuários', icon: Users, description: 'Acessos, perfis, produtividade e suporte ao negócio.' }
    ];

    const assessmentItems: AssessmentItem[] = [
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
    ];

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
                            <Button className="bg-orange-500 text-white hover:bg-orange-600">
                                <Plus className="mr-2 h-4 w-4" />
                                Novo Assessment
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
        </div>
    );
}
