'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Home, Compass, CheckSquare, Sparkles, Users, FileText,
  BarChart2, LayoutTemplate, MoreHorizontal,
  Search, Bell, Settings, Plus, ChevronDown, CheckCircle2,
  List as ListIcon, Calendar, Activity,
  Users2, GanttChartSquare, ArrowLeft, X, Target, Briefcase, DollarSign
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import KanbanBoard from './components/KanbanBoard';
import ListView from './components/ListView';
import Dashboard from './components/Dashboard';
import TeamView from './components/TeamView';
import CalendarView from './components/CalendarView';
import GanttView from './components/GanttView';
import ActivityView from './components/ActivityView';
import WorkloadView from './components/WorkloadView';
import { HomeView, PlannedView, DocsView, WhiteboardsView } from './components/GlobalViews';
import TaskModal from './components/TaskModal';
import CreateTaskModal from './components/CreateTaskModal';
import { mockIssues } from './data';
import { Space, Issue } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ViewMode = 'board' | 'list' | 'dashboard' | 'team' | 'calendar' | 'gantt' | 'activity' | 'workload';

const emptyProjectForm = {
  name: '',
  client: '',
  sponsor: '',
  manager: '',
  status: 'PLANEJAMENTO' as const,
  priority: 'Normal' as const,
  startDate: '',
  endDate: '',
  budget: '',
  objective: '',
  scope: '',
  deliverables: '',
  successCriteria: '',
  risks: '',
  notes: ''
};

type ProjectForm = typeof emptyProjectForm;

export default function App({ onBack }: { onBack?: () => void }) {
  const router = useRouter();
  const navigate = (path: string) => router.push(path);
  const [activeView, setActiveView] = useState<ViewMode>('board');
  const [globalView, setGlobalView] = useState('home');

  // Try to load issues from localStorage, fallback to mockIssues
  const [issues, setIssues] = useState<Issue[]>(() => {
    if (typeof window === 'undefined') return mockIssues;
    const saved = localStorage.getItem('pm_issues_v4');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return mockIssues;
  });

  // Save issues to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('pm_issues_v4', JSON.stringify(issues));
  }, [issues]);

  const [spaces, setSpaces] = useState<Space[]>(() => {
    if (typeof window === 'undefined') {
      return [{
        id: 's1',
        name: 'Projeto Paranacidade',
        initial: 'P',
        color: 'bg-primary',
        client: 'Paranacidade',
        manager: 'Carlos Horst',
        status: 'PLANEJAMENTO',
        priority: 'Alta',
        objective: 'Implantar e acompanhar as etapas do projeto com controle executivo.',
        scope: 'Escopo inicial do projeto com fases de acesso, kick-off, plano de implantação e migração.',
        deliverables: 'Plano de implantação, cronograma, atas, evidências e acompanhamento por fases.',
        createdAt: new Date().toISOString()
      }];
    }
    const saved = localStorage.getItem('pm_projects_v1');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [{
      id: 's1',
      name: 'Projeto Paranacidade',
      initial: 'P',
      color: 'bg-primary',
      client: 'Paranacidade',
      manager: 'Carlos Horst',
      status: 'PLANEJAMENTO',
      priority: 'Alta',
      objective: 'Implantar e acompanhar as etapas do projeto com controle executivo.',
      scope: 'Escopo inicial do projeto com fases de acesso, kick-off, plano de implantação e migração.',
      deliverables: 'Plano de implantação, cronograma, atas, evidências e acompanhamento por fases.',
      createdAt: new Date().toISOString()
    }];
  });
  const [activeSpaceId, setActiveSpaceId] = useState<string>('s1');
  const [expandedSpaces, setExpandedSpaces] = useState<Record<string, boolean>>({ 's1': true });

  // New States
  const [selectedTask, setSelectedTask] = useState<Issue | null>(null);
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);
  const [projectForm, setProjectForm] = useState(emptyProjectForm);
  const [projectFormError, setProjectFormError] = useState('');

  useEffect(() => {
    localStorage.setItem('pm_projects_v1', JSON.stringify(spaces));
  }, [spaces]);

  const activeProject = spaces.find(s => s.id === activeSpaceId) || spaces[0];
  const activeProjectIssues = issues.filter(issue => {
    if (!activeProject) return false;
    if (issue.projectId === activeProject.id) return true;
    return !issue.projectId && activeProject.id === spaces[0]?.id;
  });
  const isDashboardFocus = (globalView === 'spaces' && activeView === 'dashboard') || globalView === 'dashboards';

  const submitNewSpace = () => {
    const name = projectForm.name.trim();
    const scope = projectForm.scope.trim();
    const objective = projectForm.objective.trim();

    if (!name || !scope || !objective) {
      setProjectFormError('Informe nome, objetivo e escopo do projeto antes de criar as fases.');
      return;
    }

    if (isCreatingSpace) {
      const colors = ['bg-primary', 'bg-accent-cyan', 'bg-accent-green', 'bg-primary', 'bg-[#1f7fe5]'];
      const randomColor = colors[spaces.length % colors.length];
      const newSpace: Space = {
        id: `s-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...projectForm,
        name,
        scope,
        objective,
        initial: name.charAt(0).toUpperCase(),
        color: randomColor,
        createdAt: new Date().toISOString()
      };
      setSpaces(prev => [...prev, newSpace]);
      setActiveSpaceId(newSpace.id);
      setExpandedSpaces(prev => ({ ...prev, [newSpace.id]: true }));
      setGlobalView('home');
      setActiveView('dashboard');
    }
    setIsCreatingSpace(false);
    setProjectForm(emptyProjectForm);
    setProjectFormError('');
  };

  const toggleSpace = (id: string) => {
    setExpandedSpaces(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const [isCreatingTaskGlobal, setIsCreatingTaskGlobal] = useState(false);

  // Create a new task test flow
  const handleCreateTask = () => {
    setIsCreatingTaskGlobal(true);
  };

  const handleGlobalCreateTaskSubmit = (title: string, data: any) => {
    const normalizedTitle = title.trim();
    const newTask: Issue = {
      id: `new-${Date.now()}`,
      key: `TSK-${Math.floor(Math.random() * 1000) + 100}`,
      title: normalizedTitle,
      description: data.description || '',
      status: data.status || 'PENDENTE',
      projectId: activeSpaceId,
      priority: data.priority || 'Normal',
      assignee: data.assignee,
      dueDate: data.dueDate,
      customFields: data.customFields || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setIssues(prev => [newTask, ...prev]);
    setIsCreatingTaskGlobal(false);

    if (data.phaseKind === 'KICKOFF_INTERNO' || data.phaseKind === 'KICKOFF_EXTERNO') {
      const kickoffContext = {
        source: 'project-management',
        projectId: activeProject?.id,
        projectName: activeProject?.name,
        projectClient: activeProject?.client,
        projectManager: activeProject?.manager,
        projectScope: activeProject?.scope,
        projectObjective: activeProject?.objective,
        phaseId: newTask.id,
        phaseTitle: normalizedTitle,
        phaseDescription: data.description || '',
        kickoffType: data.phaseKind === 'KICKOFF_INTERNO' ? 'internal' : 'external',
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('pm_kickoff_context', JSON.stringify(kickoffContext));
      navigate(`/kickoff?from=project&openCreate=1&type=${kickoffContext.kickoffType}`);
    }
  };

  const handleUpdateIssue = (updatedIssue: Issue) => {
    setIssues(prev => prev.map(issue => issue.id === updatedIssue.id ? updatedIssue : issue));
    setSelectedTask(updatedIssue);
  };

  return (
    <div className="project-workspace relative flex h-[calc(100dvh-108px)] min-h-[640px] flex-col md:flex-row bg-background font-body overflow-hidden text-foreground text-sm">
      {isDashboardFocus && onBack && (
        <button
          type="button"
          onClick={onBack}
          className="absolute left-4 top-4 z-20 flex h-9 items-center gap-2 rounded-md border border-border bg-card/95 px-3 text-xs font-bold uppercase tracking-wide text-foreground shadow-xl shadow-black/30 transition-colors hover:border-primary hover:bg-muted hover:text-foreground"
          title="Voltar"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
      )}

      {/* Far Left Thin Navigation */}
      {!isDashboardFocus && (
      <nav className="project-local-nav w-full md:w-16 bg-card flex-shrink-0 flex flex-row md:flex-col items-center p-2 md:py-4 border-b md:border-r border-border z-20">
        <div
          onClick={onBack}
          className="w-8 h-8 bg-accent-green rounded text-foreground flex items-center justify-center font-bold mb-6 cursor-pointer shadow-[0_0_22px_rgba(34,197,94,0.25)]"
          title="Voltar"
        >
          C
        </div>

        <div className="flex flex-row md:flex-col gap-1 md:gap-4 w-full overflow-x-auto md:px-2">
          <NavItem icon={Home} label="Início" active={globalView === 'home'} onClick={() => setGlobalView('home')} />
          <NavItem icon={Compass} label="Projetos" active={globalView === 'spaces'} onClick={() => setGlobalView('spaces')} />
          <NavItem icon={CheckSquare} label="Planejado" active={globalView === 'planned'} onClick={() => setGlobalView('planned')} />
          <NavItem icon={Users} label="Equipes" active={globalView === 'teams'} onClick={() => setGlobalView('teams')} />
          <NavItem icon={FileText} label="Documentos" active={globalView === 'docs'} onClick={() => setGlobalView('docs')} />
          <NavItem icon={BarChart2} label="Painéis" active={globalView === 'dashboards'} onClick={() => setGlobalView('dashboards')} />
          <NavItem icon={LayoutTemplate} label="Quadros" active={globalView === 'whiteboards'} onClick={() => setGlobalView('whiteboards')} />
        </div>
      </nav>
      )}

      {/* Second Sidebar (Spaces) */}
      {globalView === 'spaces' && !isDashboardFocus && (
        <aside className="hidden lg:flex w-[240px] bg-card flex-shrink-0 flex-col h-full border-r border-border z-20">
          <div className="p-4 flex items-center justify-between border-b border-border bg-[linear-gradient(90deg,rgba(255,122,0,0.13),transparent)]">
          <h2 className="font-semibold text-foreground">Projetos</h2>
          <button onClick={() => setIsCreatingSpace(true)} className="bg-primary hover:bg-primary text-primary-foreground hover:text-primary-foreground text-xs font-semibold px-3 py-2 rounded flex items-center gap-1 transition-colors">
            <Plus className="w-3 h-3" /> Criar
          </button>
        </div>

        <div className="p-3 flex-1 overflow-y-auto">
          <div className="flex items-center gap-2 text-muted-foreground hover:bg-muted p-1.5 rounded cursor-pointer mb-4">
            <LayoutTemplate className="w-4 h-4" />
            <span className="text-sm">Todos os projetos</span>
          </div>

          <div className="flex flex-col gap-2">
            {spaces.map(space => (
              <div key={space.id}>
                <div
                  className={cn("flex items-center justify-between p-2 rounded cursor-pointer group", activeSpaceId === space.id ? "bg-secondary text-foreground ring-1 ring-[#ff7a00]/35" : "text-foreground hover:bg-muted")}
                  onClick={() => setActiveSpaceId(space.id)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("w-4 h-4 rounded-sm text-[8px] flex items-center justify-center font-bold text-foreground", space.color)}>{space.initial}</div>
                    <div className="min-w-0">
                      <span className="block truncate font-medium text-sm">{space.name}</span>
                      <span className="block truncate text-[10px] text-muted-foreground">{space.client || space.status || 'Projeto'}</span>
                    </div>
                  </div>
                  <ChevronDown
                    className={cn("w-4 h-4 transition-transform", expandedSpaces[space.id] ? "rotate-180 text-foreground" : "opacity-0 group-hover:opacity-100")}
                    onClick={(e) => { e.stopPropagation(); toggleSpace(space.id); }}
                  />
                </div>

                {expandedSpaces[space.id] && (
                  <div className="ml-5 mt-1 border-l border-slate-700 pl-2 flex flex-col gap-1">
                    <div
                      className={cn("flex items-center justify-between p-1.5 rounded cursor-pointer", activeView === 'list' && activeSpaceId === space.id ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-muted')}
                      onClick={() => { setActiveView('list'); setActiveSpaceId(space.id); }}
                    >
                      <div className="flex items-center gap-2">
                        <ListIcon className="w-4 h-4" />
                        <span className="text-sm">Fases</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{activeSpaceId === space.id ? issues.length : 0}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div onClick={() => setIsCreatingSpace(true)} className="flex items-center gap-2 text-muted-foreground hover:text-primary p-1.5 ml-5 rounded cursor-pointer mt-1">
              <Plus className="w-3.5 h-3.5" />
              <span className="text-sm">Novo Projeto</span>
            </div>
          </div>
        </div>
      </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-background">

        {globalView === 'spaces' && <div className="flex flex-wrap items-center gap-3 border-b border-border bg-card p-3 lg:hidden"><label className="text-xs text-muted-foreground" htmlFor="project-selector">Projeto</label><select id="project-selector" className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm" value={activeSpaceId} onChange={event => setActiveSpaceId(event.target.value)}>{spaces.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select></div>}
        {globalView === 'spaces' ? (
          isDashboardFocus ? (
            <div className="flex-1 overflow-hidden bg-background">
              <Dashboard
                projects={spaces}
                issues={issues}
                activeProjectId={activeSpaceId}
                onProjectChange={setActiveSpaceId}
                onBack={() => setActiveView('list')}
                onCreateProject={() => setIsCreatingSpace(true)}
              />
            </div>
          ) : (
          <>
            {/* Project Header & Tabs */}
            <div className="bg-card border-b border-border flex-shrink-0">
          <div className="px-6 pt-4 pb-0 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xl font-bold text-foreground">
                <div className={cn("w-5 h-5 rounded-sm text-[10px] flex items-center justify-center font-bold text-foreground mr-1", activeProject?.color || "bg-slate-700")}>
                  {activeProject?.initial || "P"}
                </div>
                {activeProject?.name || "Projeto Paranacidade"} <span className="text-muted-foreground font-normal">/</span>
                <ListIcon className="w-5 h-5 text-muted-foreground ml-1" /> Fases
                <ChevronDown className="w-5 h-5 text-muted-foreground cursor-pointer" />
              </div>

              <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                <button onClick={() => alert('Funcionalidade de Agentes será lançada em breve')} className="hover:text-foreground flex items-center gap-1"><Users2 className="w-4 h-4" /> Agentes</button>
                <button onClick={() => alert('ClickUp Brain em processamento...')} className="hover:text-foreground flex items-center gap-1"><Sparkles className="w-4 h-4 text-teal-400" /> Brain</button>
                <button onClick={() => alert('Compartilhar este projeto com outras pessoas')} className="hover:text-foreground flex items-center gap-1"><Users className="w-4 h-4" /> Compartilhar</button>
              </div>
            </div>

            <div className="flex items-center gap-6 overflow-x-auto text-sm font-medium hide-scrollbar">
              <Tab icon={Users} label="Equipe" active={activeView === 'team'} onClick={() => setActiveView('team')} />
              <Tab icon={BarChart2} label="Painéis" active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
              <Tab icon={ListIcon} label="Lista" active={activeView === 'list'} onClick={() => setActiveView('list')} />
              <Tab icon={LayoutTemplate} label="Quadro" active={activeView === 'board'} onClick={() => setActiveView('board')} />
              <Tab icon={Calendar} label="Calendário" active={activeView === 'calendar'} onClick={() => setActiveView('calendar')} />
              <Tab icon={GanttChartSquare} label="Gantt" active={activeView === 'gantt'} onClick={() => setActiveView('gantt')} />
              <Tab icon={Activity} label="Atividade" active={activeView === 'activity'} onClick={() => setActiveView('activity')} />
              <Tab icon={ListIcon} label="Carga de trabalho" active={activeView === 'workload'} onClick={() => setActiveView('workload')} />
              <div className="flex items-center gap-1 text-muted-foreground hover:text-foreground cursor-pointer pb-2">
                <Plus className="w-4 h-4" /> Visualização
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 flex flex-col gap-3 flex-shrink-0 bg-background border-b border-border">
          {activeProject && (
            <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr_1fr]">
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Escopo</p>
                <p className="mt-1 line-clamp-2 text-xs text-foreground">{activeProject.scope || 'Escopo ainda não informado.'}</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Objetivo</p>
                <p className="mt-1 line-clamp-2 text-xs text-foreground">{activeProject.objective || 'Objetivo ainda não informado.'}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-[linear-gradient(140deg,rgba(255,122,0,0.16),rgba(17,24,39,0.98))] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Status</p>
                  <p className="mt-1 text-sm font-semibold text-primary">{activeProject.status || 'PLANEJAMENTO'}</p>
                </div>
                <div className="rounded-lg border border-border bg-[linear-gradient(140deg,rgba(34,197,94,0.14),rgba(17,24,39,0.98))] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Fases</p>
                  <p className="mt-1 text-sm font-semibold text-accent-green">{activeProjectIssues.length}</p>
                </div>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <button onClick={() => alert('Controles de Visão (Filtros, Agrupamento)')} className="bg-card hover:bg-muted text-foreground px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 border border-border">
              <LayersIcon className="w-4 h-4 text-primary" /> Controles
            </button>

          <div className="ml-auto flex items-center gap-3 text-muted-foreground">
            <button onClick={() => alert('Busca específica na lista atual')} className="hover:bg-card p-1.5 rounded"><Search className="w-4 h-4" /></button>
            <button onClick={() => alert('Configurações da visualização atual')} className="hover:bg-card p-1.5 rounded"><Settings className="w-4 h-4" /></button>
            <div className="h-4 w-px bg-slate-700 mx-1"></div>
            <button onClick={handleCreateTask} className="bg-primary hover:bg-primary text-primary-foreground hover:text-primary-foreground px-4 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Fase <ChevronDown className="w-3 h-3 ml-1" />
            </button>
          </div>
          </div>
        </div>

        {/* View Renderer */}
        <div className="flex-1 overflow-hidden relative bg-background">
          {activeView === 'board' && <KanbanBoard issues={issues} setIssues={setIssues} onTaskClick={setSelectedTask} onCreateTask={handleGlobalCreateTaskSubmit} />}
          {activeView === 'list' && <ListView issues={issues} onTaskClick={setSelectedTask} />}
          {activeView === 'dashboard' && (
            <Dashboard
              projects={spaces}
              issues={issues}
              activeProjectId={activeSpaceId}
              onProjectChange={setActiveSpaceId}
              onBack={() => setActiveView('list')}
              onCreateProject={() => setIsCreatingSpace(true)}
            />
          )}
          {activeView === 'team' && <TeamView />}
          {activeView === 'calendar' && <CalendarView issues={issues} onTaskClick={setSelectedTask} />}
          {activeView === 'gantt' && <GanttView issues={issues} />}
          {activeView === 'activity' && <ActivityView />}
          {activeView === 'workload' && <WorkloadView issues={issues} />}
        </div>

          </>
          )
        ) : (
          <div className="flex-1 overflow-hidden relative bg-background">
            {globalView === 'home' && (
              <HomeView
                projects={spaces}
                issues={issues}
                onCreateProject={() => {
                  setIsCreatingSpace(true);
                  setGlobalView('spaces');
                }}
                onOpenDashboard={() => {
                  setGlobalView('spaces');
                  setActiveView('dashboard');
                }}
                onOpenProject={(projectId) => {
                  setActiveSpaceId(projectId);
                  setExpandedSpaces(prev => ({ ...prev, [projectId]: true }));
                  setGlobalView('spaces');
                  setActiveView('dashboard');
                }}
              />
            )}
            {globalView === 'planned' && <PlannedView />}
            {globalView === 'teams' && <TeamView />}
            {globalView === 'docs' && <DocsView />}
            {globalView === 'dashboards' && (
              <Dashboard
                projects={spaces}
                issues={issues}
                activeProjectId={activeSpaceId}
                onProjectChange={setActiveSpaceId}
                onBack={() => setGlobalView('home')}
                onCreateProject={() => {
                  setGlobalView('spaces');
                  setIsCreatingSpace(true);
                }}
              />
            )}
            {globalView === 'whiteboards' && <WhiteboardsView />}
          </div>
        )}
      </main>

      {selectedTask && (
        <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} onUpdate={handleUpdateIssue} />
      )}

      {isCreatingTaskGlobal && (
        <CreateTaskModal
          onClose={() => setIsCreatingTaskGlobal(false)}
          onCreate={handleGlobalCreateTaskSubmit}
        />
      )}

      {isCreatingSpace && (
        <ProjectCreateModal
          form={projectForm}
          error={projectFormError}
          onChange={(patch) => {
            setProjectForm(prev => ({ ...prev, ...patch }));
            setProjectFormError('');
          }}
          onCancel={() => {
            setIsCreatingSpace(false);
            setProjectForm(emptyProjectForm);
            setProjectFormError('');
          }}
          onSubmit={submitNewSpace}
        />
      )}
    </div>
  );
}

function ProjectCreateModal({
  form,
  error,
  onChange,
  onCancel,
  onSubmit
}: {
  form: ProjectForm;
  error: string;
  onChange: (patch: Partial<ProjectForm>) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const fieldClass = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-[#ff7a00]/20";
  const labelClass = "text-[11px] font-bold uppercase tracking-wide text-muted-foreground";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-border bg-card shadow-2xl">
        <div className="relative overflow-hidden border-b border-border bg-[radial-gradient(circle_at_12%_0%,rgba(255,122,0,0.28),transparent_28%),linear-gradient(120deg,#111827,#070b16_58%,#111827)] px-6 py-5">
          <div className="absolute right-10 top-0 h-24 w-24 rounded-full bg-accent-green/10 blur-2xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-[0_0_24px_rgba(255,122,0,0.28)]">
                  <Briefcase className="h-5 w-5" />
                </span>
                <span className="rounded-full border border-accent-yellow/40 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-accent-yellow">
                  Novo projeto
                </span>
              </div>
              <h2 className="text-2xl font-semibold text-foreground">Cadastro completo do projeto</h2>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Escopo, objetivo, responsáveis e critérios entram antes da criação das fases.</p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md border border-border bg-card/80 p-2 text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          {error && (
            <div className="mb-4 rounded-md border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">
              {error}
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-3">
            <label className="flex flex-col gap-1.5 lg:col-span-2">
              <span className={labelClass}>Nome do projeto *</span>
              <input className={fieldClass} value={form.name} onChange={(e) => onChange({ name: e.target.value })} placeholder="Ex.: Implantação Paranacidade" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Cliente</span>
              <input className={fieldClass} value={form.client} onChange={(e) => onChange({ client: e.target.value })} placeholder="Cliente ou órgão" />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Patrocinador</span>
              <input className={fieldClass} value={form.sponsor} onChange={(e) => onChange({ sponsor: e.target.value })} placeholder="Sponsor" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Gerente</span>
              <input className={fieldClass} value={form.manager} onChange={(e) => onChange({ manager: e.target.value })} placeholder="Responsável" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Orçamento</span>
              <div className="relative">
                <DollarSign className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-accent-green" />
                <input className={`${fieldClass} pl-9`} value={form.budget} onChange={(e) => onChange({ budget: e.target.value })} placeholder="R$ 0,00" />
              </div>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Status</span>
              <select className={fieldClass} value={form.status} onChange={(e) => onChange({ status: e.target.value as ProjectForm['status'] })}>
                <option>PLANEJAMENTO</option>
                <option>EM EXECUCAO</option>
                <option>EM RISCO</option>
                <option>CONCLUIDO</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Prioridade</span>
              <select className={fieldClass} value={form.priority} onChange={(e) => onChange({ priority: e.target.value as ProjectForm['priority'] })}>
                <option>Baixa</option>
                <option>Normal</option>
                <option>Alta</option>
                <option>Urgente</option>
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>Início</span>
                <input type="date" className={fieldClass} value={form.startDate} onChange={(e) => onChange({ startDate: e.target.value })} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>Fim</span>
                <input type="date" className={fieldClass} value={form.endDate} onChange={(e) => onChange({ endDate: e.target.value })} />
              </label>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Objetivo *</span>
              <textarea className={`${fieldClass} min-h-[110px] resize-none`} value={form.objective} onChange={(e) => onChange({ objective: e.target.value })} placeholder="Resultado esperado e impacto do projeto" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Escopo *</span>
              <textarea className={`${fieldClass} min-h-[110px] resize-none`} value={form.scope} onChange={(e) => onChange({ scope: e.target.value })} placeholder="O que entra e os limites principais do projeto" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Entregáveis</span>
              <textarea className={`${fieldClass} min-h-[90px] resize-none`} value={form.deliverables} onChange={(e) => onChange({ deliverables: e.target.value })} placeholder="Pacotes, documentos, homologações e entregas" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Critérios de sucesso</span>
              <textarea className={`${fieldClass} min-h-[90px] resize-none`} value={form.successCriteria} onChange={(e) => onChange({ successCriteria: e.target.value })} placeholder="Indicadores, aceite e metas" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Riscos</span>
              <textarea className={`${fieldClass} min-h-[90px] resize-none`} value={form.risks} onChange={(e) => onChange({ risks: e.target.value })} placeholder="Dependências, bloqueios e pontos de atenção" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Observações</span>
              <textarea className={`${fieldClass} min-h-[90px] resize-none`} value={form.notes} onChange={(e) => onChange({ notes: e.target.value })} placeholder="Contexto adicional" />
            </label>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-border bg-[linear-gradient(140deg,rgba(255,122,0,0.16),rgba(17,24,39,0.96))] p-3">
              <Target className="mb-3 h-5 w-5 text-primary" />
              <p className="text-xs font-bold text-foreground">Objetivo definido</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{form.objective.trim() ? 'Pronto para validação executiva.' : 'Pendente'}</p>
            </div>
            <div className="rounded-lg border border-border bg-[linear-gradient(140deg,rgba(246,180,11,0.14),rgba(17,24,39,0.96))] p-3">
              <FileText className="mb-3 h-5 w-5 text-accent-yellow" />
              <p className="text-xs font-bold text-foreground">Escopo registrado</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{form.scope.trim() ? 'Base para montar as fases.' : 'Pendente'}</p>
            </div>
            <div className="rounded-lg border border-border bg-[linear-gradient(140deg,rgba(34,197,94,0.14),rgba(17,24,39,0.96))] p-3">
              <CheckCircle2 className="mb-3 h-5 w-5 text-accent-green" />
              <p className="text-xs font-bold text-foreground">Governança</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{form.manager.trim() || form.sponsor.trim() ? 'Responsáveis informados.' : 'Pendente'}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border bg-card px-6 py-4">
          <button type="button" onClick={onCancel} className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted hover:text-foreground">
            Cancelar
          </button>
          <button type="button" onClick={onSubmit} className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-[0_0_24px_rgba(255,122,0,0.2)] transition-colors hover:bg-primary hover:text-primary-foreground">
            Criar projeto
          </button>
        </div>
      </div>
    </div>
  );
}

// Helpers
function NavItem({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1 w-full py-2 px-1 rounded-md transition-colors group",
      active ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
    )}>
      <Icon className="w-5 h-5" />
      <span className="text-[10px] font-medium leading-none">{label}</span>
    </button>
  );
}

function Tab({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 pb-2 border-b-2 transition-colors whitespace-nowrap",
        active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground hover:border-slate-600"
      )}
    >
      <Icon className={cn("w-4 h-4", active ? "text-primary" : "")} />
      {label}
    </button>
  );
}

function LayersIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="12 2 2 7 12 12 22 7 12 2"/>
      <polyline points="2 12 12 17 22 12"/>
      <polyline points="2 17 12 22 22 17"/>
    </svg>
  );
}
