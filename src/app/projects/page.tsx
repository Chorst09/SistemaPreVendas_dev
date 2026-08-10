'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    Plus,
    FolderKanban,
    Wand2,
    FilePlus,
    RefreshCw,
    LayoutDashboard,
} from 'lucide-react';
import { ProjectGeneratorService } from '@/lib/services/project-generator-service';
import { Project, ProjectStatus, ProjectPriority, ProjectType } from '@/lib/types/project';
import { ProjectListView } from '@/components/projects/ProjectListView';
import { ProjectDetailView } from '@/components/projects/ProjectDetailView';
import { ProjectGeneratorModal } from '@/components/projects/ProjectGeneratorModal';
import { ManualProjectModal } from '@/components/projects/ManualProjectModal';
import { AuthGate } from '@/components/auth/AuthGate';

type ViewMode = 'list' | 'detail';

export default function ProjectsPage() {
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [showGeneratorModal, setShowGeneratorModal] = useState(false);
    const [showManualModal, setShowManualModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = () => {
        setIsLoading(true);
        const allProjects = ProjectGeneratorService.getAllProjects();
        if (allProjects.length === 0) {
            createExampleProject();
        } else {
            setProjects(allProjects);
        }
        setIsLoading(false);
    };

    const createExampleProject = () => {
        const now = Date.now();
        const day = 24 * 60 * 60 * 1000;
        const exampleProject: Project = {
            id: `proj-example-${now}`,
            name: 'Implementação NOC — Banco ABC',
            description: 'Projeto de implementação de Network Operations Center para o Banco ABC com monitoramento 24x7 de infraestrutura crítica.',
            type: ProjectType.NOC,
            status: ProjectStatus.IN_PROGRESS,
            priority: ProjectPriority.HIGH,
            proposalId: undefined,
            clientId: 'Banco ABC',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            startDate: new Date(now - 30 * day).toISOString(),
            endDate: new Date(now + 60 * day).toISOString(),
            projectManager: 'Carlos Silva',
            team: [
                { id: 't1', name: 'Carlos Silva',   role: 'Gerente de Projeto',        allocation: 100 },
                { id: 't2', name: 'Ana Santos',     role: 'Arquiteta de Sistemas',     allocation: 80  },
                { id: 't3', name: 'João Oliveira',  role: 'Engenheiro NOC',            allocation: 100 },
                { id: 't4', name: 'Maria Costa',    role: 'Especialista em Segurança', allocation: 60  },
            ],
            scope: {
                objectives: [
                    'Implementar NOC com monitoramento 24x7',
                    'Configurar alertas e escalação automática',
                    'Treinar equipe do cliente',
                    'Documentar processos e procedimentos',
                ],
                deliverables: ['Infraestrutura NOC', 'Dashboards de Monitoramento', 'Documentação Técnica', 'Treinamento'],
                outOfScope: ['Desenvolvimento de aplicações customizadas', 'Migração de dados legados'],
                assumptions: ['Cliente fornecerá acesso à infraestrutura', 'Equipe disponível para treinamento'],
                constraints: ['Implementação em 90 dias', 'Sem downtime durante implementação'],
            },
            timeline: {
                phases: [
                    {
                        id: 'phase-1', name: 'Fase 1: Planejamento e Design',
                        description: 'Análise de requisitos e design da solução',
                        startDate: new Date(now - 30 * day).toISOString(),
                        endDate: new Date(now - 15 * day).toISOString(),
                        status: 'completed', tasks: [], dependencies: [],
                    },
                    {
                        id: 'phase-2', name: 'Fase 2: Implementação',
                        description: 'Instalação e configuração da infraestrutura NOC',
                        startDate: new Date(now - 15 * day).toISOString(),
                        endDate: new Date(now + 30 * day).toISOString(),
                        status: 'in-progress', tasks: [], dependencies: ['phase-1'],
                    },
                    {
                        id: 'phase-3', name: 'Fase 3: Testes e Validação',
                        description: 'Testes de funcionalidade e validação com cliente',
                        startDate: new Date(now + 30 * day).toISOString(),
                        endDate: new Date(now + 45 * day).toISOString(),
                        status: 'not-started', tasks: [], dependencies: ['phase-2'],
                    },
                    {
                        id: 'phase-4', name: 'Fase 4: Treinamento e Go-Live',
                        description: 'Treinamento da equipe e ativação do NOC',
                        startDate: new Date(now + 45 * day).toISOString(),
                        endDate: new Date(now + 60 * day).toISOString(),
                        status: 'not-started', tasks: [], dependencies: ['phase-3'],
                    },
                ],
                milestones: [
                    { id: 'ms-1', name: 'Design Aprovado',        description: 'Design aprovado pelo cliente',      dueDate: new Date(now - 15 * day).toISOString(), status: 'achieved', deliverables: [] },
                    { id: 'ms-2', name: 'Infraestrutura Instalada', description: 'Infraestrutura completamente instalada', dueDate: new Date(now + 15 * day).toISOString(), status: 'pending',  deliverables: [] },
                    { id: 'ms-3', name: 'Testes Concluídos',      description: 'Todos os testes concluídos',        dueDate: new Date(now + 45 * day).toISOString(), status: 'pending',  deliverables: [] },
                ],
            },
            budget: {
                totalBudget: 450000, spentBudget: 180000, remainingBudget: 270000, currency: 'BRL',
                breakdown: [
                    { id: 'b1', category: 'Infraestrutura',        description: 'Equipamentos',    plannedCost: 200000, actualCost: 80000,  variance: 120000 },
                    { id: 'b2', category: 'Licenças de Software',  description: 'Ferramentas NOC', plannedCost: 150000, actualCost: 60000,  variance: 90000  },
                    { id: 'b3', category: 'Serviços Profissionais',description: 'Implantação',     plannedCost: 100000, actualCost: 40000,  variance: 60000  },
                ],
                costVariance: 0, costPerformanceIndex: 1.0,
            },
            risks: [
                { id: 'r1', title: 'Atraso na Entrega de Hardware', description: 'Possível atraso dos servidores', probability: 'medium', impact: 'high', category: 'schedule', riskScore: 6, status: 'mitigating', mitigationPlan: 'Manter contato com fornecedor', identifiedDate: new Date().toISOString() },
                { id: 'r2', title: 'Resistência da Equipe', description: 'Equipe pode resistir às mudanças', probability: 'low', impact: 'medium', category: 'resource', riskScore: 3, status: 'analyzing', mitigationPlan: 'Treinamento abrangente', identifiedDate: new Date().toISOString() },
            ],
            deliverables: [
                { id: 'd1', name: 'Infraestrutura NOC',      description: 'Servidores e equipamentos de rede', type: 'hardware',  status: 'in-progress', dueDate: new Date(now + 15 * day).toISOString(), assignedTo: 'João Oliveira', acceptanceCriteria: ['Todos os servidores operacionais'] },
                { id: 'd2', name: 'Dashboards',              description: 'Painéis de controle',              type: 'software',  status: 'in-progress', dueDate: new Date(now + 20 * day).toISOString(), assignedTo: 'Ana Santos',    acceptanceCriteria: ['Alertas em tempo real'] },
                { id: 'd3', name: 'Documentação Técnica',    description: 'Manuais e guias',                  type: 'document',  status: 'pending',     dueDate: new Date(now + 50 * day).toISOString(), assignedTo: 'Maria Costa',   acceptanceCriteria: ['Documentação completa'] },
            ],
            progress: {
                overallProgress: 65, phasesCompleted: 1, tasksCompleted: 12, totalTasks: 20,
                milestonesAchieved: 1, totalMilestones: 3, scheduleVariance: 0, schedulePerformanceIndex: 1.0,
                healthStatus: 'green',
                healthIndicators: { schedule: 'on-track', budget: 'on-track', scope: 'on-track', quality: 'on-track' },
            },
            documents: [],
            notes: 'Projeto de exemplo para demonstração do sistema de gerenciamento de projetos.',
            tags: ['NOC', 'Infraestrutura', 'Banco ABC', 'Crítico'],
        };
        ProjectGeneratorService.saveProject(exampleProject);
        setProjects([exampleProject]);
    };

    const handleSelectProject  = (p: Project) => { setSelectedProject(p); setViewMode('detail'); };
    const handleBackToList     = () => { setViewMode('list'); setSelectedProject(null); loadProjects(); };
    const handleDeleteProject  = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este projeto?')) return;
        await ProjectGeneratorService.deleteProject(id);
        loadProjects();
    };
    const handleProjectGenerated = (p: Project) => { setShowGeneratorModal(false); loadProjects(); setSelectedProject(p); setViewMode('detail'); };
    const handleProjectCreated   = (p: Project) => { setShowManualModal(false);    loadProjects(); setSelectedProject(p); setViewMode('detail'); };

    /* ── Detail view ── */
    if (viewMode === 'detail' && selectedProject) {
        return (
            <AuthGate>
                <div className="space-y-0">
                    {/* Back bar */}
                    <div className="mb-4 flex items-center gap-3">
                        <Button variant="ghost" size="sm" onClick={handleBackToList} className="gap-1.5 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-4 w-4" />
                            Projetos
                        </Button>
                        <span className="text-muted-foreground/40">/</span>
                        <span className="text-sm font-semibold text-foreground truncate">{selectedProject.name}</span>
                    </div>

                    <ProjectDetailView
                        project={selectedProject}
                        onUpdate={(updates) => {
                            ProjectGeneratorService.updateProject(selectedProject.id, updates);
                            setSelectedProject({ ...selectedProject, ...updates });
                            loadProjects();
                        }}
                        onBack={handleBackToList}
                    />
                </div>
            </AuthGate>
        );
    }

    /* ── List view ── */
    return (
        <AuthGate>
            <div className="space-y-5">

                {/* ── Module header ── */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                            <FolderKanban className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Gestão de Projetos</h1>
                            <p className="text-sm text-muted-foreground">
                                Acompanhe escopo, cronograma, orçamento e equipe de cada entrega.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                            onClick={() => window.location.href = '/'}
                        >
                            <LayoutDashboard className="h-4 w-4" />
                            Sistema
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 gap-1.5 text-sm"
                            onClick={loadProjects}
                        >
                            <RefreshCw className="h-4 w-4" />
                            Atualizar
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 gap-1.5 text-sm"
                            onClick={() => setShowManualModal(true)}
                        >
                            <FilePlus className="h-4 w-4" />
                            Novo Projeto
                        </Button>
                        <Button
                            size="sm"
                            className="h-9 gap-1.5 text-sm"
                            onClick={() => setShowGeneratorModal(true)}
                        >
                            <Wand2 className="h-4 w-4" />
                            Gerar de Proposta
                        </Button>
                    </div>
                </div>

                {/* ── Project list ── */}
                <ProjectListView
                    projects={projects}
                    onSelectProject={handleSelectProject}
                    onDeleteProject={handleDeleteProject}
                    onRefresh={loadProjects}
                />

                {/* ── Modals ── */}
                {showGeneratorModal && (
                    <ProjectGeneratorModal
                        onClose={() => setShowGeneratorModal(false)}
                        onGenerate={handleProjectGenerated}
                    />
                )}
                {showManualModal && (
                    <ManualProjectModal
                        onClose={() => setShowManualModal(false)}
                        onCreate={handleProjectCreated}
                    />
                )}
            </div>
        </AuthGate>
    );
}
