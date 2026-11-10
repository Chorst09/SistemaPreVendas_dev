"use client";

import React, { useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
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
    AlertCircle,
    AlertTriangle,
    ArrowUpRight,
    BarChart3,
    Building,
    Calendar,
    CheckCircle,
    CheckSquare,
    Circle,
    Clock,
    Download,
    Eye,
    FileText,
    FlaskConical,
    Image,
    Layers,
    Link,
    Paperclip,
    Plus,
    Printer,
    Search,
    ShieldCheck,
    Target,
    Trash2,
    TrendingUp,
    Upload,
    User,
    X,
    XCircle,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

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

interface TestStep {
    id: string;
    scenario: string;
    steps: string;
    expectedResult: string;
    actualResult: string;
    status: 'Pendente' | 'Aprovado' | 'Reprovado' | 'Em Execução';
}

interface TestPlan {
    pocId: string;
    objective: string;
    scope: string;
    steps: TestStep[];
}

interface Evidence {
    id: string;
    title: string;
    description: string;
    type: 'screenshot' | 'documento' | 'link' | 'outro';
    url: string;
    addedAt: string;
    addedBy: string;
}

interface StatusUpdate {
    pocId: string;
    newStatus: POC['status'];
    newProgress: number;
    notes: string;
    updatedAt: string;
}

// ── Style maps ────────────────────────────────────────────────────────────────

const statusStyles = {
    Planejamento: { badge: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300', icon: Clock, accent: 'text-cyan-300', progress: 'bg-cyan-400' },
    'Em Execução': { badge: 'border-amber-400/30 bg-amber-400/10 text-amber-300', icon: TrendingUp, accent: 'text-amber-300', progress: 'bg-amber-400' },
    Concluído:    { badge: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300', icon: CheckCircle, accent: 'text-emerald-300', progress: 'bg-emerald-400' },
    Cancelado:    { badge: 'border-red-400/30 bg-red-400/10 text-red-300', icon: XCircle, accent: 'text-red-300', progress: 'bg-red-400' },
};

const riskStyles = {
    Baixo: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
    Médio: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
    Alto:  'border-red-400/30 bg-red-400/10 text-red-300',
};

const testStepStatusStyles = {
    Pendente:      'border-slate-400/30 bg-slate-400/10 text-slate-300',
    'Em Execução': 'border-amber-400/30 bg-amber-400/10 text-amber-300',
    Aprovado:      'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
    Reprovado:     'border-red-400/30 bg-red-400/10 text-red-300',
};

const evidenceTypeIcons = {
    screenshot: Image,
    documento:  FileText,
    link:       Link,
    outro:      Paperclip,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatCurrency = (v: number, d = 0) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: d });

const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');

function getDaysRemaining(endDate: string) {
    return Math.ceil((new Date(endDate).getTime() - Date.now()) / 86_400_000);
}

function uid() {
    return Math.random().toString(36).slice(2, 10);
}

// ── Default test plan factory ─────────────────────────────────────────────────

function defaultTestPlan(poc: POC): TestPlan {
    return {
        pocId: poc.id,
        objective: `Validar os critérios de sucesso da POC "${poc.title}" em ambiente controlado.`,
        scope: `Tecnologia: ${poc.technology}. Cliente: ${poc.client}. Responsável: ${poc.responsible}.`,
        steps: poc.successCriteria.map((criterion, i) => ({
            id: `step-${poc.id}-${i}`,
            scenario: criterion,
            steps: 'Descreva os passos para validar este critério.',
            expectedResult: 'Descreva o resultado esperado.',
            actualResult: '',
            status: 'Pendente' as const,
        })),
    };
}

// ── Modal: Plano de Testes ─────────────────────────────────────────────────────

function TestPlanModal({ poc, plan, onSave, onClose }: {
    poc: POC;
    plan: TestPlan;
    onSave: (plan: TestPlan) => void;
    onClose: () => void;
}) {
    const [local, setLocal] = useState<TestPlan>(plan);

    const updateStep = (id: string, field: keyof TestStep, value: string) => {
        setLocal(prev => ({
            ...prev,
            steps: prev.steps.map(s => s.id === id ? { ...s, [field]: value } : s),
        }));
    };

    const addStep = () => {
        setLocal(prev => ({
            ...prev,
            steps: [...prev.steps, {
                id: uid(),
                scenario: '',
                steps: '',
                expectedResult: '',
                actualResult: '',
                status: 'Pendente',
            }],
        }));
    };

    const removeStep = (id: string) => {
        setLocal(prev => ({ ...prev, steps: prev.steps.filter(s => s.id !== id) }));
    };

    const approved  = local.steps.filter(s => s.status === 'Aprovado').length;
    const reproved  = local.steps.filter(s => s.status === 'Reprovado').length;
    const pending   = local.steps.filter(s => s.status === 'Pendente').length;
    const running   = local.steps.filter(s => s.status === 'Em Execução').length;

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-cyan-500" />
                        Plano de Testes — {poc.title}
                    </DialogTitle>
                    <DialogDescription>
                        {poc.client} · {poc.technology} · Responsável: {poc.responsible}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-2">
                    {/* Resumo */}
                    <div className="grid grid-cols-4 gap-3">
                        {[
                            { label: 'Total', value: local.steps.length, color: 'text-foreground' },
                            { label: 'Aprovados', value: approved,  color: 'text-emerald-400' },
                            { label: 'Reprovados', value: reproved, color: 'text-red-400' },
                            { label: 'Pendentes', value: pending + running, color: 'text-amber-400' },
                        ].map(s => (
                            <div key={s.label} className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                                <p className="text-xs text-muted-foreground">{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Objetivo e escopo */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label>Objetivo do Plano</Label>
                            <Textarea rows={3} value={local.objective}
                                onChange={e => setLocal(p => ({ ...p, objective: e.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Escopo</Label>
                            <Textarea rows={3} value={local.scope}
                                onChange={e => setLocal(p => ({ ...p, scope: e.target.value }))} />
                        </div>
                    </div>

                    {/* Cenários de teste */}
                    <div>
                        <div className="mb-3 flex items-center justify-between">
                            <p className="font-semibold text-foreground">Cenários de Teste</p>
                            <Button size="sm" variant="outline" onClick={addStep}>
                                <Plus className="mr-1.5 h-3.5 w-3.5" /> Adicionar Cenário
                            </Button>
                        </div>
                        <div className="space-y-4">
                            {local.steps.map((step, idx) => (
                                <div key={step.id} className="rounded-xl border border-border bg-muted/20 p-4">
                                    <div className="mb-3 flex items-center justify-between">
                                        <span className="text-sm font-semibold text-muted-foreground">Cenário {idx + 1}</span>
                                        <div className="flex items-center gap-2">
                                            <Select value={step.status}
                                                onValueChange={v => updateStep(step.id, 'status', v)}>
                                                <SelectTrigger className="h-7 w-36 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {(['Pendente','Em Execução','Aprovado','Reprovado'] as const).map(s => (
                                                        <SelectItem key={s} value={s}>{s}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                onClick={() => removeStep(step.id)}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Cenário / Critério</Label>
                                            <Input value={step.scenario}
                                                onChange={e => updateStep(step.id, 'scenario', e.target.value)}
                                                placeholder="Descreva o cenário a testar" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Resultado Esperado</Label>
                                            <Input value={step.expectedResult}
                                                onChange={e => updateStep(step.id, 'expectedResult', e.target.value)}
                                                placeholder="O que deve acontecer" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Passos de Execução</Label>
                                            <Textarea rows={2} value={step.steps}
                                                onChange={e => updateStep(step.id, 'steps', e.target.value)}
                                                placeholder="Descreva os passos" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Resultado Real</Label>
                                            <Textarea rows={2} value={step.actualResult}
                                                onChange={e => updateStep(step.id, 'actualResult', e.target.value)}
                                                placeholder="Preencha após execução" />
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        <Badge variant="outline" className={`text-xs ${testStepStatusStyles[step.status]}`}>
                                            {step.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Fechar</Button>
                    <Button onClick={() => { onSave(local); onClose(); }}>
                        <CheckSquare className="mr-2 h-4 w-4" /> Salvar Plano
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ── Modal: Evidências ─────────────────────────────────────────────────────────

function EvidencesModal({ poc, evidences, onSave, onClose }: {
    poc: POC;
    evidences: Evidence[];
    onSave: (evidences: Evidence[]) => void;
    onClose: () => void;
}) {
    const [local, setLocal] = useState<Evidence[]>(evidences);
    const [form, setForm] = useState<Omit<Evidence, 'id' | 'addedAt'>>({
        title: '',
        description: '',
        type: 'screenshot',
        url: '',
        addedBy: poc.responsible,
    });
    const [showForm, setShowForm] = useState(false);

    const addEvidence = () => {
        if (!form.title.trim()) return;
        const newEv: Evidence = {
            ...form,
            id: uid(),
            addedAt: new Date().toISOString(),
        };
        setLocal(prev => [newEv, ...prev]);
        setForm({ title: '', description: '', type: 'screenshot', url: '', addedBy: poc.responsible });
        setShowForm(false);
    };

    const removeEvidence = (id: string) => setLocal(prev => prev.filter(e => e.id !== id));

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ArrowUpRight className="h-5 w-5 text-cyan-500" />
                        Evidências — {poc.title}
                    </DialogTitle>
                    <DialogDescription>
                        {poc.client} · {poc.technology} · {local.length} evidência(s) registrada(s)
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Botão adicionar */}
                    <div className="flex justify-end">
                        <Button size="sm" onClick={() => setShowForm(v => !v)}>
                            <Plus className="mr-1.5 h-3.5 w-3.5" />
                            {showForm ? 'Cancelar' : 'Nova Evidência'}
                        </Button>
                    </div>

                    {/* Formulário nova evidência */}
                    {showForm && (
                        <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4 space-y-3">
                            <p className="text-sm font-semibold text-foreground">Registrar Nova Evidência</p>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Título *</Label>
                                    <Input value={form.title}
                                        onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                                        placeholder="Ex: Screenshot do ambiente configurado" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Tipo</Label>
                                    <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v as Evidence['type'] }))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="screenshot">Screenshot</SelectItem>
                                            <SelectItem value="documento">Documento</SelectItem>
                                            <SelectItem value="link">Link</SelectItem>
                                            <SelectItem value="outro">Outro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label className="text-xs">URL / Caminho</Label>
                                    <Input value={form.url}
                                        onChange={e => setForm(p => ({ ...p, url: e.target.value }))}
                                        placeholder="https://... ou caminho do arquivo" />
                                </div>
                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label className="text-xs">Descrição</Label>
                                    <Textarea rows={2} value={form.description}
                                        onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                        placeholder="Descreva o que esta evidência comprova" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Adicionado por</Label>
                                    <Input value={form.addedBy}
                                        onChange={e => setForm(p => ({ ...p, addedBy: e.target.value }))} />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
                                <Button size="sm" onClick={addEvidence} disabled={!form.title.trim()}>
                                    <Upload className="mr-1.5 h-3.5 w-3.5" /> Registrar
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Lista de evidências */}
                    {local.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
                            <Paperclip className="mb-3 h-10 w-10 text-muted-foreground/40" />
                            <p className="font-medium text-muted-foreground">Nenhuma evidência registrada</p>
                            <p className="mt-1 text-sm text-muted-foreground/60">Clique em "Nova Evidência" para adicionar</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {local.map(ev => {
                                const Icon = evidenceTypeIcons[ev.type];
                                return (
                                    <div key={ev.id} className="flex items-start gap-3 rounded-xl border border-border bg-muted/20 p-4">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                            <Icon className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="font-semibold text-foreground">{ev.title}</p>
                                                <Button size="icon" variant="ghost"
                                                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                                                    onClick={() => removeEvidence(ev.id)}>
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                            {ev.description && (
                                                <p className="mt-0.5 text-sm text-muted-foreground">{ev.description}</p>
                                            )}
                                            {ev.url && (
                                                <a href={ev.url} target="_blank" rel="noopener noreferrer"
                                                    className="mt-1 inline-flex items-center gap-1 text-xs text-cyan-400 hover:underline">
                                                    <Link className="h-3 w-3" />
                                                    {ev.url.length > 60 ? ev.url.slice(0, 60) + '...' : ev.url}
                                                </a>
                                            )}
                                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                                <Badge variant="outline" className="text-[10px]">{ev.type}</Badge>
                                                <span>{ev.addedBy}</span>
                                                <span>·</span>
                                                <span>{new Date(ev.addedAt).toLocaleString('pt-BR')}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Fechar</Button>
                    <Button onClick={() => { onSave(local); onClose(); }}>
                        <CheckSquare className="mr-2 h-4 w-4" /> Salvar Evidências
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ── Modal: Atualizar Status ────────────────────────────────────────────────────

function UpdateStatusModal({ poc, onSave, onClose }: {
    poc: POC;
    onSave: (update: StatusUpdate) => void;
    onClose: () => void;
}) {
    const [newStatus, setNewStatus]   = useState<POC['status']>(poc.status);
    const [newProgress, setNewProgress] = useState(poc.progress);
    const [notes, setNotes]           = useState('');

    const handleSave = () => {
        if (!notes.trim()) return;
        onSave({
            pocId: poc.id,
            newStatus,
            newProgress,
            notes,
            updatedAt: new Date().toISOString(),
        });
        onClose();
    };

    const statusColor = statusStyles[newStatus].accent;

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-amber-500" />
                        Atualizar Status — {poc.title}
                    </DialogTitle>
                    <DialogDescription>
                        {poc.client} · Progresso atual: {poc.progress}%
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-2">
                    {/* Status atual vs novo */}
                    <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-4">
                        <div className="flex-1">
                            <p className="text-xs text-muted-foreground mb-1">Status Atual</p>
                            <Badge variant="outline" className={statusStyles[poc.status].badge}>
                                {poc.status}
                            </Badge>
                        </div>
                        <ArrowUpRight className="h-5 w-5 text-muted-foreground/40" />
                        <div className="flex-1">
                            <p className="text-xs text-muted-foreground mb-1">Novo Status</p>
                            <Badge variant="outline" className={statusStyles[newStatus].badge}>
                                {newStatus}
                            </Badge>
                        </div>
                    </div>

                    {/* Seletor de status */}
                    <div className="space-y-1.5">
                        <Label>Novo Status</Label>
                        <Select value={newStatus} onValueChange={v => setNewStatus(v as POC['status'])}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Planejamento">Planejamento</SelectItem>
                                <SelectItem value="Em Execução">Em Execução</SelectItem>
                                <SelectItem value="Concluído">Concluído</SelectItem>
                                <SelectItem value="Cancelado">Cancelado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Progresso */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Progresso da Validação</Label>
                            <span className={`text-lg font-bold ${statusColor}`}>{newProgress}%</span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={100}
                            step={5}
                            value={newProgress}
                            onChange={e => setNewProgress(Number(e.target.value))}
                            className="w-full accent-primary"
                        />
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                                className={`h-full rounded-full transition-all ${statusStyles[newStatus].progress}`}
                                style={{ width: `${newProgress}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>0%</span>
                            <span>25%</span>
                            <span>50%</span>
                            <span>75%</span>
                            <span>100%</span>
                        </div>
                    </div>

                    {/* Notas */}
                    <div className="space-y-1.5">
                        <Label>
                            Notas da Atualização <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                            rows={4}
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Descreva o que foi feito, impedimentos encontrados, próximos passos..."
                        />
                        {!notes.trim() && (
                            <p className="text-xs text-muted-foreground">Campo obrigatório</p>
                        )}
                    </div>

                    {/* Alerta para conclusão */}
                    {newStatus === 'Concluído' && (
                        <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
                            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>Ao marcar como Concluído, a POC será arquivada. Certifique-se de que todas as evidências foram registradas.</span>
                        </div>
                    )}
                    {newStatus === 'Cancelado' && (
                        <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>Ao cancelar a POC, documente o motivo nas notas para referência futura.</span>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={!notes.trim()}>
                        <TrendingUp className="mr-2 h-4 w-4" /> Salvar Atualização
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ── Modal: Nova POC ───────────────────────────────────────────────────────────

const EMPTY_POC: Omit<POC, 'id'> = {
    title: '',
    client: '',
    technology: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 86_400_000).toISOString().split('T')[0],
    status: 'Planejamento',
    responsible: '',
    budget: 0,
    progress: 0,
    description: '',
    risk: 'Médio',
    objective: '',
    successCriteria: ['', '', ''],
};

function NewPOCModal({ onSave, onClose }: {
    onSave: (poc: POC) => void;
    onClose: () => void;
}) {
    const [form, setForm] = useState<Omit<POC, 'id'>>(EMPTY_POC);
    const [errors, setErrors] = useState<Partial<Record<keyof POC, string>>>({});

    const set = <K extends keyof typeof form>(key: K, value: typeof form[K]) =>
        setForm(prev => ({ ...prev, [key]: value }));

    const setCriteria = (idx: number, value: string) =>
        setForm(prev => {
            const c = [...prev.successCriteria];
            c[idx] = value;
            return { ...prev, successCriteria: c };
        });

    const addCriteria  = () => setForm(prev => ({ ...prev, successCriteria: [...prev.successCriteria, ''] }));
    const removeCriteria = (idx: number) =>
        setForm(prev => ({ ...prev, successCriteria: prev.successCriteria.filter((_, i) => i !== idx) }));

    const validate = () => {
        const e: typeof errors = {};
        if (!form.title.trim())       e.title       = 'Título obrigatório';
        if (!form.client.trim())      e.client      = 'Cliente obrigatório';
        if (!form.technology.trim())  e.technology  = 'Tecnologia obrigatória';
        if (!form.responsible.trim()) e.responsible = 'Responsável obrigatório';
        if (!form.objective.trim())   e.objective   = 'Objetivo obrigatório';
        if (form.budget < 0)          e.budget      = 'Orçamento inválido';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = () => {
        if (!validate()) return;
        onSave({
            ...form,
            id: `POC-${String(Date.now()).slice(-4)}`,
            successCriteria: form.successCriteria.filter(c => c.trim()),
        });
        onClose();
    };

    const field = (label: string, key: keyof typeof form, placeholder: string, type: string = 'text') => (
        <div className="space-y-1.5">
            <Label className="text-xs">{label}</Label>
            <Input
                type={type}
                value={form[key] as string}
                onChange={e => set(key, e.target.value as never)}
                placeholder={placeholder}
                className={errors[key] ? 'border-destructive' : ''}
            />
            {errors[key] && <p className="text-xs text-destructive">{errors[key]}</p>}
        </div>
    );

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FlaskConical className="h-5 w-5 text-cyan-500" />
                        Nova Prova de Conceito
                    </DialogTitle>
                    <DialogDescription>
                        Preencha os dados da POC. Os campos marcados com * são obrigatórios.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-2">
                    {/* Identificação */}
                    <div>
                        <p className="mb-3 text-sm font-semibold text-foreground">Identificação</p>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {field('Título *', 'title', 'Ex: Migração para Azure Cloud')}
                            {field('Cliente *', 'client', 'Ex: Empresa Alpha')}
                            {field('Tecnologia *', 'technology', 'Ex: Microsoft Azure')}
                            {field('Responsável *', 'responsible', 'Nome do responsável técnico')}
                        </div>
                    </div>

                    {/* Descrição e objetivo */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs">Descrição</Label>
                            <Textarea rows={3} value={form.description}
                                onChange={e => set('description', e.target.value)}
                                placeholder="Descreva o contexto e motivação da POC" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Objetivo *</Label>
                            <Textarea rows={3} value={form.objective}
                                onChange={e => set('objective', e.target.value)}
                                placeholder="O que esta POC precisa comprovar?"
                                className={errors.objective ? 'border-destructive' : ''} />
                            {errors.objective && <p className="text-xs text-destructive">{errors.objective}</p>}
                        </div>
                    </div>

                    {/* Datas, risco e status */}
                    <div>
                        <p className="mb-3 text-sm font-semibold text-foreground">Planejamento</p>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {field('Data de Início *', 'startDate', '', 'date')}
                            {field('Data de Término *', 'endDate', '', 'date')}
                            <div className="space-y-1.5">
                                <Label className="text-xs">Status Inicial</Label>
                                <Select value={form.status} onValueChange={v => set('status', v as POC['status'])}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Planejamento">Planejamento</SelectItem>
                                        <SelectItem value="Em Execução">Em Execução</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Nível de Risco</Label>
                                <Select value={form.risk} onValueChange={v => set('risk', v as POC['risk'])}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Baixo">Baixo</SelectItem>
                                        <SelectItem value="Médio">Médio</SelectItem>
                                        <SelectItem value="Alto">Alto</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Orçamento */}
                    <div className="space-y-1.5">
                        <Label className="text-xs">Orçamento (R$)</Label>
                        <Input type="number" min={0} value={form.budget}
                            onChange={e => set('budget', Number(e.target.value))}
                            placeholder="0" className={errors.budget ? 'border-destructive' : ''} />
                        {errors.budget && <p className="text-xs text-destructive">{errors.budget}</p>}
                    </div>

                    {/* Critérios de sucesso */}
                    <div>
                        <div className="mb-3 flex items-center justify-between">
                            <p className="text-sm font-semibold text-foreground">Critérios de Sucesso</p>
                            <Button size="sm" variant="outline" onClick={addCriteria}>
                                <Plus className="mr-1.5 h-3.5 w-3.5" /> Adicionar
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {form.successCriteria.map((c, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
                                    <Input value={c} onChange={e => setCriteria(i, e.target.value)}
                                        placeholder={`Critério ${i + 1}`} />
                                    {form.successCriteria.length > 1 && (
                                        <Button size="icon" variant="ghost"
                                            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                                            onClick={() => removeCriteria(i)}>
                                            <X className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave}>
                        <FlaskConical className="mr-2 h-4 w-4" /> Criar POC
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ── Modal: Relatório Executivo ─────────────────────────────────────────────────

function ExecutiveReportModal({ pocs, onClose }: { pocs: POC[]; onClose: () => void }) {
    const [filterStatus, setFilterStatus] = useState<string>('all');

    const filtered = filterStatus === 'all' ? pocs : pocs.filter(p => p.status === filterStatus);

    const stats = {
        total:          pocs.length,
        planejamento:   pocs.filter(p => p.status === 'Planejamento').length,
        emExecucao:     pocs.filter(p => p.status === 'Em Execução').length,
        concluidos:     pocs.filter(p => p.status === 'Concluído').length,
        cancelados:     pocs.filter(p => p.status === 'Cancelado').length,
        orcamentoTotal: pocs.reduce((s, p) => s + p.budget, 0),
        mediaProgresso: pocs.length ? Math.round(pocs.reduce((s, p) => s + p.progress, 0) / pocs.length) : 0,
        altoRisco:      pocs.filter(p => p.risk === 'Alto').length,
        atrasados:      pocs.filter(p => getDaysRemaining(p.endDate) < 0 && p.status !== 'Concluído' && p.status !== 'Cancelado').length,
    };

    const handlePrint = () => window.print();

    const handleExportCSV = () => {
        const headers = ['ID','Título','Cliente','Tecnologia','Responsável','Status','Risco','Progresso','Orçamento','Início','Término'];
        const rows = pocs.map(p => [
            p.id, p.title, p.client, p.technology, p.responsible,
            p.status, p.risk, `${p.progress}%`, formatCurrency(p.budget),
            formatDate(p.startDate), formatDate(p.endDate),
        ]);
        const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href     = url;
        link.download = `relatorio-poc-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                <BarChart3 className="h-5 w-5 text-cyan-500" />
                                Relatório Executivo — Provas de Conceito
                            </DialogTitle>
                            <DialogDescription>
                                Gerado em {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </DialogDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={handleExportCSV}>
                                <Download className="mr-1.5 h-3.5 w-3.5" /> CSV
                            </Button>
                            <Button size="sm" variant="outline" onClick={handlePrint}>
                                <Printer className="mr-1.5 h-3.5 w-3.5" /> Imprimir
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 py-2">
                    {/* KPI cards */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {[
                            { label: 'Total de POCs',     value: stats.total,                          color: 'text-foreground',    bg: 'bg-muted/40'           },
                            { label: 'Em Execução',        value: stats.emExecucao,                     color: 'text-amber-400',     bg: 'bg-amber-500/10'       },
                            { label: 'Concluídas',         value: stats.concluidos,                     color: 'text-emerald-400',   bg: 'bg-emerald-500/10'     },
                            { label: 'Canceladas',         value: stats.cancelados,                     color: 'text-red-400',       bg: 'bg-red-500/10'         },
                            { label: 'Orçamento Total',    value: formatCurrency(stats.orcamentoTotal), color: 'text-cyan-400',      bg: 'bg-cyan-500/10'        },
                            { label: 'Progresso Médio',   value: `${stats.mediaProgresso}%`,           color: 'text-blue-400',      bg: 'bg-blue-500/10'        },
                            { label: 'Alto Risco',         value: stats.altoRisco,                      color: 'text-orange-400',    bg: 'bg-orange-500/10'      },
                            { label: 'Com Atraso',         value: stats.atrasados,                      color: 'text-destructive',   bg: 'bg-destructive/10'     },
                        ].map(kpi => (
                            <div key={kpi.label} className={`rounded-xl border border-border ${kpi.bg} p-4 text-center`}>
                                <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
                                <p className="mt-0.5 text-xs text-muted-foreground">{kpi.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Barra de distribuição de status */}
                    <div className="rounded-xl border border-border bg-muted/20 p-5">
                        <p className="mb-4 font-semibold text-foreground">Distribuição por Status</p>
                        <div className="space-y-3">
                            {([
                                ['Planejamento', stats.planejamento, 'bg-cyan-400'],
                                ['Em Execução',  stats.emExecucao,   'bg-amber-400'],
                                ['Concluído',    stats.concluidos,   'bg-emerald-400'],
                                ['Cancelado',    stats.cancelados,   'bg-red-400'],
                            ] as [string, number, string][]).map(([label, count, color]) => (
                                <div key={label} className="flex items-center gap-3">
                                    <span className="w-28 text-sm text-muted-foreground">{label}</span>
                                    <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                                        <div className={`h-full ${color} rounded-full transition-all`}
                                            style={{ width: stats.total ? `${(count / stats.total) * 100}%` : '0%' }} />
                                    </div>
                                    <span className="w-8 text-right text-sm font-bold text-foreground">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Alertas */}
                    {(stats.atrasados > 0 || stats.altoRisco > 0) && (
                        <div className="space-y-2">
                            {stats.atrasados > 0 && (
                                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                                    <AlertTriangle className="h-4 w-4 shrink-0" />
                                    {stats.atrasados} POC(s) com prazo vencido e ainda não concluída(s)
                                </div>
                            )}
                            {stats.altoRisco > 0 && (
                                <div className="flex items-center gap-2 rounded-lg border border-orange-400/30 bg-orange-400/10 p-3 text-sm text-orange-300">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    {stats.altoRisco} POC(s) classificada(s) como Alto Risco — requer atenção
                                </div>
                            )}
                        </div>
                    )}

                    {/* Filtro + Tabela */}
                    <div>
                        <div className="mb-3 flex items-center justify-between">
                            <p className="font-semibold text-foreground">Listagem de POCs</p>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="w-40 h-8 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os status</SelectItem>
                                    <SelectItem value="Planejamento">Planejamento</SelectItem>
                                    <SelectItem value="Em Execução">Em Execução</SelectItem>
                                    <SelectItem value="Concluído">Concluído</SelectItem>
                                    <SelectItem value="Cancelado">Cancelado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-border">
                            {/* Header */}
                            <div className="grid grid-cols-[80px_1fr_1fr_90px_70px_80px_100px] bg-muted/40 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                <span>ID</span>
                                <span>POC / Cliente</span>
                                <span>Tecnologia</span>
                                <span>Status</span>
                                <span>Risco</span>
                                <span className="text-right">Progresso</span>
                                <span className="text-right">Orçamento</span>
                            </div>
                            {filtered.map((poc, idx) => {
                                const ss = statusStyles[poc.status];
                                const overdue = getDaysRemaining(poc.endDate) < 0 && poc.status !== 'Concluído' && poc.status !== 'Cancelado';
                                return (
                                    <div key={poc.id}
                                        className={`grid grid-cols-[80px_1fr_1fr_90px_70px_80px_100px] items-center gap-1 border-t border-border/50 px-4 py-3 text-sm transition-colors hover:bg-muted/20 ${idx % 2 === 1 ? 'bg-muted/10' : ''}`}>
                                        <span className="text-xs font-mono text-muted-foreground">{poc.id}</span>
                                        <div className="min-w-0">
                                            <p className="truncate font-semibold text-foreground">{poc.title}</p>
                                            <p className="truncate text-xs text-muted-foreground">{poc.client}</p>
                                        </div>
                                        <span className="truncate text-xs text-muted-foreground">{poc.technology}</span>
                                        <Badge variant="outline" className={`w-fit text-[10px] ${ss.badge}`}>{poc.status}</Badge>
                                        <Badge variant="outline" className={`w-fit text-[10px] ${riskStyles[poc.risk]}`}>{poc.risk}</Badge>
                                        <div className="text-right">
                                            <span className={`text-sm font-bold ${ss.accent}`}>{poc.progress}%</span>
                                            {overdue && <span className="ml-1 text-[10px] text-destructive">⚠</span>}
                                        </div>
                                        <p className="text-right text-xs font-semibold text-foreground">{formatCurrency(poc.budget)}</p>
                                    </div>
                                );
                            })}
                        </div>
                        {filtered.length === 0 && (
                            <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma POC para o filtro selecionado.</p>
                        )}
                    </div>

                    {/* Detalhe por POC */}
                    <div>
                        <p className="mb-3 font-semibold text-foreground">Detalhe por POC</p>
                        <div className="space-y-3">
                            {filtered.map(poc => {
                                const daysLeft = getDaysRemaining(poc.endDate);
                                const ss = statusStyles[poc.status];
                                return (
                                    <div key={poc.id} className="rounded-xl border border-border bg-muted/10 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    <span className="text-xs font-mono text-muted-foreground">{poc.id}</span>
                                                    <Badge variant="outline" className={`text-[10px] ${ss.badge}`}>{poc.status}</Badge>
                                                    <Badge variant="outline" className={`text-[10px] ${riskStyles[poc.risk]}`}>Risco {poc.risk}</Badge>
                                                </div>
                                                <p className="font-bold text-foreground">{poc.title}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">{poc.client} · {poc.technology} · {poc.responsible}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className={`text-xl font-bold ${ss.accent}`}>{poc.progress}%</p>
                                                <p className={`text-xs mt-0.5 ${daysLeft < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                                                    {daysLeft < 0 ? `${Math.abs(daysLeft)}d atrasada` : `${daysLeft}d restantes`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-3">
                                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                                <div className={`h-full rounded-full ${ss.progress}`} style={{ width: `${poc.progress}%` }} />
                                            </div>
                                        </div>
                                        <p className="mt-3 text-xs text-muted-foreground leading-5">{poc.objective}</p>
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            {poc.successCriteria.map(c => (
                                                <span key={c} className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-[10px] text-muted-foreground">
                                                    <CheckCircle className="h-2.5 w-2.5 text-emerald-400" />{c}
                                                </span>
                                            ))}
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

// ── Main component ────────────────────────────────────────────────────────────

export function POCManagementView() {
    const [searchTerm, setSearchTerm]     = useState('');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');

    // POC data with local state for updates
    const [pocs, setPocs] = useState<POC[]>([
        {
            id: 'POC-001', title: 'Migração para Azure Cloud', client: 'Empresa Alpha',
            technology: 'Microsoft Azure', startDate: '2026-06-10', endDate: '2026-08-15',
            status: 'Em Execução', responsible: 'João Silva', budget: 50000, progress: 65,
            description: 'Validação da migração de infraestrutura on-premise para Azure com foco em disponibilidade, custo e segurança.',
            risk: 'Médio', objective: 'Comprovar viabilidade técnica e financeira da migração para nuvem.',
            successCriteria: ['Ambiente piloto publicado', 'Custos estimados validados', 'Plano de migração aprovado'],
        },
        {
            id: 'POC-002', title: 'Implementação de IA Generativa', client: 'Startup Beta',
            technology: 'OpenAI GPT-4', startDate: '2026-05-01', endDate: '2026-06-20',
            status: 'Concluído', responsible: 'Maria Santos', budget: 30000, progress: 100,
            description: 'Chatbot inteligente com IA generativa para atendimento e automação de respostas recorrentes.',
            risk: 'Baixo', objective: 'Validar ganho operacional e qualidade das respostas com base de conhecimento controlada.',
            successCriteria: ['Base indexada', 'Taxa de acerto medida', 'Relatório executivo entregue'],
        },
        {
            id: 'POC-003', title: 'Segurança Zero Trust', client: 'Indústria Gama',
            technology: 'Palo Alto Networks', startDate: '2026-08-01', endDate: '2026-09-30',
            status: 'Planejamento', responsible: 'Carlos Oliveira', budget: 75000, progress: 15,
            description: 'Arquitetura Zero Trust com segmentação, identidade, inspeção de tráfego e controles de acesso.',
            risk: 'Alto', objective: 'Validar arquitetura de segurança antes da proposta de implantação corporativa.',
            successCriteria: ['Escopo técnico definido', 'Políticas piloto desenhadas', 'Plano de testes aprovado'],
        },
        {
            id: 'POC-004', title: 'Automação RPA', client: 'Banco Delta',
            technology: 'UiPath', startDate: '2026-04-15', endDate: '2026-05-30',
            status: 'Cancelado', responsible: 'Ana Costa', budget: 40000, progress: 30,
            description: 'Automação de processos financeiros para reduzir atividades manuais e tempo de conciliação.',
            risk: 'Médio', objective: 'Validar redução de esforço operacional em rotinas de backoffice financeiro.',
            successCriteria: ['Processo mapeado', 'Robô piloto criado', 'ROI preliminar estimado'],
        },
        {
            id: 'POC-005', title: 'Kubernetes em Produção', client: 'TechCorp',
            technology: 'Kubernetes + Docker', startDate: '2026-06-20', endDate: '2026-08-30',
            status: 'Em Execução', responsible: 'Pedro Lima', budget: 60000, progress: 45,
            description: 'Orquestração de containers em produção com observabilidade, pipeline e estratégia de rollout.',
            risk: 'Médio', objective: 'Comprovar estabilidade e governança operacional para cargas containerizadas.',
            successCriteria: ['Cluster piloto operacional', 'Monitoramento ativo', 'Esteira CI/CD testada'],
        },
    ]);

    // Modal state
    const [testPlanModal, setTestPlanModal]   = useState<POC | null>(null);
    const [evidencesModal, setEvidencesModal] = useState<POC | null>(null);
    const [statusModal, setStatusModal]       = useState<POC | null>(null);
    const [showNewPOC,  setShowNewPOC]        = useState(false);
    const [showReport,  setShowReport]        = useState(false);

    // Persisted data per POC
    const [testPlans,  setTestPlans]  = useState<Record<string, TestPlan>>({});
    const [evidences,  setEvidences]  = useState<Record<string, Evidence[]>>({});
    const [statusLogs, setStatusLogs] = useState<Record<string, StatusUpdate[]>>({});

    // Handlers
    const handleSaveTestPlan = (plan: TestPlan) => {
        setTestPlans(prev => ({ ...prev, [plan.pocId]: plan }));
    };

    const handleNewPOC = (poc: POC) => {
        setPocs(prev => [poc, ...prev]);
    };

    const handleSaveEvidences = (pocId: string, evs: Evidence[]) => {
        setEvidences(prev => ({ ...prev, [pocId]: evs }));
    };

    const handleSaveStatus = (update: StatusUpdate) => {
        setPocs(prev => prev.map(p =>
            p.id === update.pocId
                ? { ...p, status: update.newStatus, progress: update.newProgress }
                : p
        ));
        setStatusLogs(prev => ({
            ...prev,
            [update.pocId]: [update, ...(prev[update.pocId] ?? [])],
        }));
    };

    const filteredPOCs = useMemo(() => pocs.filter(poc => {
        const s = searchTerm.toLowerCase();
        return (
            (poc.title.toLowerCase().includes(s) || poc.client.toLowerCase().includes(s) ||
             poc.technology.toLowerCase().includes(s) || poc.responsible.toLowerCase().includes(s)) &&
            (selectedStatus === 'all' || poc.status === selectedStatus)
        );
    }), [pocs, searchTerm, selectedStatus]);

    const stats = {
        total:          pocs.length,
        emExecucao:     pocs.filter(p => p.status === 'Em Execução').length,
        concluidos:     pocs.filter(p => p.status === 'Concluído').length,
        orcamentoTotal: pocs.reduce((s, p) => s + p.budget, 0),
        mediaProgresso: Math.round(pocs.reduce((s, p) => s + p.progress, 0) / pocs.length),
    };

    const statusFilters = ['all', 'Planejamento', 'Em Execução', 'Concluído', 'Cancelado'];

    const getStatusBadge = (status: POC['status']) => {
        const style = statusStyles[status];
        const Icon  = style.icon;
        return (
            <Badge variant="outline" className={style.badge}>
                <Icon className="mr-1 h-3 w-3" />{status}
            </Badge>
        );
    };

    return (
        <div className="space-y-6">

            {/* ── Hero banner ── */}
            <PageHeader eyebrow="Soluções e entrega" title="Provas de conceito" description="Valide hipóteses, acompanhe riscos e confira os critérios de sucesso de cada iniciativa." actions={<><Button onClick={() => setShowNewPOC(true)}><Plus className="h-4 w-4" />Nova POC</Button><Button variant="outline" onClick={() => setShowReport(true)}><FileText className="h-4 w-4" />Relatório executivo</Button></>} />

            {/* ── Stats cards ── */}
            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                    { label: 'Total de POCs',   value: stats.total,                          icon: BarChart3,   accent: 'text-cyan-300'   },
                    { label: 'Em Execução',      value: stats.emExecucao,                     icon: TrendingUp,  accent: 'text-amber-300'  },
                    { label: 'Concluídas',       value: stats.concluidos,                     icon: CheckCircle, accent: 'text-emerald-300' },
                    { label: 'Orçamento Total',  value: formatCurrency(stats.orcamentoTotal), icon: FileText,    accent: 'text-orange-300'  },
                ].map(item => {
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

            {/* ── Search & filters ── */}
            <Card className="border-border bg-card shadow-sm">
                <CardContent className="p-4">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por título, cliente, tecnologia ou responsável..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {statusFilters.map(s => (
                                <Button key={s} variant={selectedStatus === s ? 'default' : 'outline'}
                                    onClick={() => setSelectedStatus(s)} size="sm">
                                    {s === 'all' ? 'Todos' : s}
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ── POC cards ── */}
            <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                {filteredPOCs.map(poc => {
                    const statusStyle   = statusStyles[poc.status];
                    const daysRemaining = getDaysRemaining(poc.endDate);
                    const planSteps     = testPlans[poc.id]?.steps ?? [];
                    const evCount       = (evidences[poc.id] ?? []).length;
                    const logs          = statusLogs[poc.id] ?? [];
                    const approvedSteps = planSteps.filter(s => s.status === 'Aprovado').length;

                    return (
                        <Card key={poc.id} className="overflow-hidden border-border bg-card shadow-sm transition-all hover:border-cyan-400/40 hover:shadow-lg">
                            <CardHeader className="border-b border-border/70 bg-background/40">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                        <div className="mb-3 flex flex-wrap items-center gap-2">
                                            <Badge variant="outline" className="border-border bg-background text-muted-foreground">{poc.id}</Badge>
                                            {getStatusBadge(poc.status)}
                                            <Badge variant="outline" className={riskStyles[poc.risk]}>Risco {poc.risk}</Badge>
                                        </div>
                                        <CardTitle className="text-xl text-foreground">{poc.title}</CardTitle>
                                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{poc.description}</p>
                                    </div>
                                    <Button variant="outline" size="sm" className="shrink-0">
                                        <Eye className="mr-2 h-4 w-4" />Ver
                                    </Button>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-5 p-5">
                                {/* Meta grid */}
                                <div className="grid gap-3 text-sm sm:grid-cols-2">
                                    <div className="flex items-center gap-2 rounded-md border border-border bg-background/50 p-3">
                                        <Building className="h-4 w-4 text-cyan-300" />
                                        <div><p className="text-xs text-muted-foreground">Cliente</p><p className="font-semibold text-foreground">{poc.client}</p></div>
                                    </div>
                                    <div className="flex items-center gap-2 rounded-md border border-border bg-background/50 p-3">
                                        <User className="h-4 w-4 text-cyan-300" />
                                        <div><p className="text-xs text-muted-foreground">Responsável</p><p className="font-semibold text-foreground">{poc.responsible}</p></div>
                                    </div>
                                    <div className="flex items-center gap-2 rounded-md border border-border bg-background/50 p-3">
                                        <Layers className="h-4 w-4 text-orange-300" />
                                        <div><p className="text-xs text-muted-foreground">Tecnologia</p><p className="font-semibold text-foreground">{poc.technology}</p></div>
                                    </div>
                                    <div className="flex items-center gap-2 rounded-md border border-border bg-background/50 p-3">
                                        <Calendar className="h-4 w-4 text-orange-300" />
                                        <div><p className="text-xs text-muted-foreground">Prazo</p><p className="font-semibold text-foreground">{formatDate(poc.startDate)} - {formatDate(poc.endDate)}</p></div>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div>
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="text-sm font-medium text-muted-foreground">Progresso da validação</span>
                                        <span className={`text-sm font-bold ${statusStyle.accent}`}>{poc.progress}%</span>
                                    </div>
                                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                                        <div className={`h-full rounded-full ${statusStyle.progress}`} style={{ width: `${poc.progress}%` }} />
                                    </div>
                                </div>

                                {/* Objective + budget */}
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

                                {/* Success criteria */}
                                <div className="rounded-md border border-border bg-background/50 p-4">
                                    <p className="mb-3 font-semibold text-foreground">Critérios de sucesso</p>
                                    <div className="grid gap-2 sm:grid-cols-3">
                                        {poc.successCriteria.map(criterion => (
                                            <div key={criterion} className="flex items-start gap-2 rounded-md bg-card p-3 text-sm text-muted-foreground">
                                                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                                                <span>{criterion}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Activity badges */}
                                {(planSteps.length > 0 || evCount > 0 || logs.length > 0) && (
                                    <div className="flex flex-wrap gap-2">
                                        {planSteps.length > 0 && (
                                            <Badge variant="outline" className="text-xs text-cyan-400 border-cyan-400/30">
                                                <FileText className="mr-1 h-3 w-3" />
                                                {approvedSteps}/{planSteps.length} testes aprovados
                                            </Badge>
                                        )}
                                        {evCount > 0 && (
                                            <Badge variant="outline" className="text-xs text-purple-400 border-purple-400/30">
                                                <Paperclip className="mr-1 h-3 w-3" />
                                                {evCount} evidência{evCount > 1 ? 's' : ''}
                                            </Badge>
                                        )}
                                        {logs.length > 0 && (
                                            <Badge variant="outline" className="text-xs text-amber-400 border-amber-400/30">
                                                <TrendingUp className="mr-1 h-3 w-3" />
                                                {logs.length} atualização{logs.length > 1 ? 'ções' : 'ção'}
                                            </Badge>
                                        )}
                                    </div>
                                )}

                                {/* Action buttons */}
                                <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row">
                                    <Button
                                        variant="outline" size="sm" className="flex-1 gap-1.5"
                                        onClick={() => setTestPlanModal(poc)}
                                    >
                                        <FileText className="h-4 w-4" />
                                        Plano de Testes
                                        {planSteps.length > 0 && (
                                            <Badge className="ml-1 h-4 px-1.5 text-[10px]">{planSteps.length}</Badge>
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline" size="sm" className="flex-1 gap-1.5"
                                        onClick={() => setEvidencesModal(poc)}
                                    >
                                        <ArrowUpRight className="h-4 w-4" />
                                        Evidências
                                        {evCount > 0 && (
                                            <Badge className="ml-1 h-4 px-1.5 text-[10px]">{evCount}</Badge>
                                        )}
                                    </Button>
                                    {(poc.status === 'Em Execução' || poc.status === 'Planejamento') && (
                                        <Button
                                            size="sm" className="flex-1 gap-1.5"
                                            onClick={() => setStatusModal(poc)}
                                        >
                                            <TrendingUp className="h-4 w-4" />
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

            {/* ── Modals ── */}
            {testPlanModal && (
                <TestPlanModal
                    poc={testPlanModal}
                    plan={testPlans[testPlanModal.id] ?? defaultTestPlan(testPlanModal)}
                    onSave={handleSaveTestPlan}
                    onClose={() => setTestPlanModal(null)}
                />
            )}
            {evidencesModal && (
                <EvidencesModal
                    poc={evidencesModal}
                    evidences={evidences[evidencesModal.id] ?? []}
                    onSave={evs => handleSaveEvidences(evidencesModal.id, evs)}
                    onClose={() => setEvidencesModal(null)}
                />
            )}
            {statusModal && (
                <UpdateStatusModal
                    poc={statusModal}
                    onSave={handleSaveStatus}
                    onClose={() => setStatusModal(null)}
                />
            )}
            {showNewPOC && (
                <NewPOCModal
                    onSave={handleNewPOC}
                    onClose={() => setShowNewPOC(false)}
                />
            )}
            {showReport && (
                <ExecutiveReportModal
                    pocs={pocs}
                    onClose={() => setShowReport(false)}
                />
            )}
        </div>
    );
}
