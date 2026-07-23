'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Project, ProjectStatus, ProjectType } from '@/lib/types/project';
import { 
  Info, 
  Calendar, 
  DollarSign, 
  AlertTriangle, 
  CheckSquare, 
  Users,
  TrendingUp,
  FileText,
  ArrowLeft,
  Edit,
  Download,
  Play,
  Pause,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PhaseManagementModal } from './PhaseManagementModal';

interface ProjectDetailViewProps {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
  onBack: () => void;
}

export function ProjectDetailView({ project, onUpdate, onBack }: ProjectDetailViewProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPhaseManagementOpen, setIsPhaseManagementOpen] = useState(false);
  const [editedProject, setEditedProject] = useState<Partial<Project>>(project);

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.PLANNING: return 'secondary';
      case ProjectStatus.IN_PROGRESS: return 'default';
      case ProjectStatus.ON_HOLD: return 'outline';
      case ProjectStatus.COMPLETED: return 'default';
      case ProjectStatus.CANCELLED: return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.PLANNING: return 'Planejamento';
      case ProjectStatus.IN_PROGRESS: return 'Em Andamento';
      case ProjectStatus.ON_HOLD: return 'Pausado';
      case ProjectStatus.COMPLETED: return 'Concluído';
      case ProjectStatus.CANCELLED: return 'Cancelado';
      default: return status;
    }
  };

  const handleStatusChange = (newStatus: ProjectStatus) => {
    onUpdate({ status: newStatus });
  };

  const handleSaveEdit = () => {
    onUpdate(editedProject);
    setIsEditDialogOpen(false);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(project, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `projeto-${project.id}.json`;
    link.click();
  };

  const getBudgetPercentage = () => {
    return (project.budget.spentBudget / project.budget.totalBudget) * 100;
  };

  const getTimeProgress = () => {
    if (!project.startDate || !project.endDate) return 0;
    const start = new Date(project.startDate).getTime();
    const end = new Date(project.endDate).getTime();
    const now = Date.now();
    const total = end - start;
    const elapsed = now - start;
    return Math.min(Math.max((elapsed / total) * 100, 0), 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-slate-900 dark:to-gray-900 pb-8">
      <div className="max-w-7xl mx-auto px-6 pt-6 space-y-6">
      {/* Header com Ações */}
      <Card className="border-none shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
        <CardHeader className="border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <Button variant="ghost" size="sm" onClick={onBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </div>
              <div className="flex items-center space-x-3 mb-2">
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">{project.name}</CardTitle>
                <Badge variant={getStatusColor(project.status)}>
                  {getStatusLabel(project.status)}
                </Badge>
                <Badge variant="outline">{project.type}</Badge>
              </div>
              <p className="text-muted-foreground">{project.description}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={project.status} onValueChange={(value) => handleStatusChange(value as ProjectStatus)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ProjectStatus.PLANNING}>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Planejamento
                    </div>
                  </SelectItem>
                  <SelectItem value={ProjectStatus.IN_PROGRESS}>
                    <div className="flex items-center">
                      <Play className="h-4 w-4 mr-2" />
                      Em Andamento
                    </div>
                  </SelectItem>
                  <SelectItem value={ProjectStatus.ON_HOLD}>
                    <div className="flex items-center">
                      <Pause className="h-4 w-4 mr-2" />
                      Pausado
                    </div>
                  </SelectItem>
                  <SelectItem value={ProjectStatus.COMPLETED}>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Concluído
                    </div>
                  </SelectItem>
                  <SelectItem value={ProjectStatus.CANCELLED}>
                    <div className="flex items-center">
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancelado
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Métricas Principais - Melhoradas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card Progresso Geral - Melhorado */}
        <Card className="group hover:shadow-2xl transition-all duration-300 border-l-4 border-l-blue-600 hover:-translate-y-1 bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span>Progresso Geral</span>
              </div>
              <Badge variant={project.progress.overallProgress >= 80 ? "default" : "secondary"} className="text-xs">
                {project.progress.overallProgress >= 80 ? "Quase lá!" : "Em andamento"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-end space-x-2">
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {project.progress.overallProgress}%
              </div>
              <div className="text-sm text-muted-foreground mb-1">completo</div>
            </div>
            <Progress value={project.progress.overallProgress} className="h-2" />
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex flex-col space-y-1 p-2 bg-blue-50 dark:bg-blue-950 rounded">
                <span className="text-muted-foreground">Tempo</span>
                <span className="font-bold text-blue-600">{getTimeProgress().toFixed(0)}%</span>
              </div>
              <div className="flex flex-col space-y-1 p-2 bg-purple-50 dark:bg-purple-950 rounded">
                <span className="text-muted-foreground">Tarefas</span>
                <span className="font-bold text-purple-600">
                  {project.progress.tasksCompleted}/{project.progress.totalTasks}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
              <span>Taxa de conclusão</span>
              <span className="font-semibold">
                {project.progress.totalTasks > 0 
                  ? ((project.progress.tasksCompleted / project.progress.totalTasks) * 100).toFixed(1) 
                  : 0}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card Orçamento - Melhorado */}
        <Card className="group hover:shadow-2xl transition-all duration-300 border-l-4 border-l-green-600 hover:-translate-y-1 bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-green-900/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <span>Orçamento</span>
              </div>
              <Badge 
                variant={getBudgetPercentage() > 90 ? "destructive" : getBudgetPercentage() > 75 ? "secondary" : "outline"} 
                className="text-xs"
              >
                {getBudgetPercentage() > 90 ? "Atenção!" : getBudgetPercentage() > 75 ? "Monitorar" : "Saudável"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col space-y-1">
              <span className="text-xs text-muted-foreground">Total Disponível</span>
              <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {project.budget.currency} {(project.budget.totalBudget || 0).toLocaleString('pt-BR')}
              </div>
            </div>
            <Progress value={getBudgetPercentage()} className="h-2" />
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-orange-50 dark:bg-orange-950 rounded">
                <div className="text-xs text-muted-foreground mb-1">Consumido</div>
                <div className="font-bold text-orange-600 text-sm">
                  {project.budget.currency} {(project.budget.spentBudget || 0).toLocaleString('pt-BR')}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {getBudgetPercentage().toFixed(1)}% do total
                </div>
              </div>
              <div className="p-2 bg-green-50 dark:bg-green-950 rounded">
                <div className="text-xs text-muted-foreground mb-1">Disponível</div>
                <div className="font-bold text-green-600 text-sm">
                  {project.budget.currency} {(project.budget.remainingBudget || 0).toLocaleString('pt-BR')}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {(100 - getBudgetPercentage()).toFixed(1)}% restante
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card Equipe - Melhorado */}
        <Card className="group hover:shadow-2xl transition-all duration-300 border-l-4 border-l-purple-600 hover:-translate-y-1 bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-purple-900/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <span>Equipe</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {project.team.length > 5 ? "Grande" : project.team.length > 2 ? "Média" : "Pequena"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-end space-x-2">
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {project.team.length}
              </div>
              <div className="text-sm text-muted-foreground mb-1">
                {project.team.length === 1 ? 'membro' : 'membros'}
              </div>
            </div>
            
            {/* Avatares da equipe */}
            {project.team.length > 0 && (
              <div className="flex -space-x-2 overflow-hidden">
                {project.team.slice(0, 5).map((member, i) => (
                  <div
                    key={member.id}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs font-bold"
                    title={member.name}
                  >
                    {member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                ))}
                {project.team.length > 5 && (
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 bg-gray-300 dark:bg-gray-700 text-xs font-bold">
                    +{project.team.length - 5}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex flex-col space-y-1 p-2 bg-purple-50 dark:bg-purple-950 rounded">
                <span className="text-muted-foreground">Alocação Média</span>
                <span className="font-bold text-purple-600">
                  {project.team.length > 0 
                    ? (project.team.reduce((sum, m) => sum + m.allocation, 0) / project.team.length).toFixed(0)
                    : 0}%
                </span>
              </div>
              <div className="flex flex-col space-y-1 p-2 bg-pink-50 dark:bg-pink-950 rounded">
                <span className="text-muted-foreground">Funções</span>
                <span className="font-bold text-pink-600">
                  {new Set(project.team.map(m => m.role)).size}
                </span>
              </div>
            </div>

            {project.projectManager && (
              <div className="flex items-center text-xs text-muted-foreground pt-1 border-t">
                <span className="truncate">
                  PM: <span className="font-semibold text-foreground">{project.projectManager}</span>
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card Riscos - Melhorado */}
        <Card className="group hover:shadow-2xl transition-all duration-300 border-l-4 border-l-orange-600 hover:-translate-y-1 bg-gradient-to-br from-white to-orange-50 dark:from-gray-800 dark:to-orange-900/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <span>Riscos</span>
              </div>
              <Badge 
                variant={project.risks.filter(r => r.riskScore >= 8).length > 0 ? "destructive" : "outline"} 
                className="text-xs"
              >
                {project.risks.filter(r => r.riskScore >= 8).length > 0 ? "Crítico" : "Sob Controle"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-end space-x-2">
              <div className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                {project.risks.length}
              </div>
              <div className="text-sm text-muted-foreground mb-1">
                {project.risks.length === 1 ? 'risco' : 'riscos'}
              </div>
            </div>
            
            {project.risks.length > 0 ? (
              <>
                <div className="grid grid-cols-3 gap-1">
                  <div className="p-2 bg-red-50 dark:bg-red-950 rounded text-center">
                    <div className="text-xl font-bold text-red-600">
                      {project.risks.filter(r => r.riskScore >= 8).length}
                    </div>
                    <div className="text-xs text-muted-foreground">Alto</div>
                  </div>
                  <div className="p-2 bg-orange-50 dark:bg-orange-950 rounded text-center">
                    <div className="text-xl font-bold text-orange-600">
                      {project.risks.filter(r => r.riskScore >= 5 && r.riskScore < 8).length}
                    </div>
                    <div className="text-xs text-muted-foreground">Médio</div>
                  </div>
                  <div className="p-2 bg-yellow-50 dark:bg-yellow-950 rounded text-center">
                    <div className="text-xl font-bold text-yellow-600">
                      {project.risks.filter(r => r.riskScore < 5).length}
                    </div>
                    <div className="text-xs text-muted-foreground">Baixo</div>
                  </div>
                </div>

                {/* Indicador de risco mais crítico */}
                {(() => {
                  const highestRisk = project.risks.reduce((max, r) => r.riskScore > max.riskScore ? r : max, project.risks[0]);
                  return (
                    <div className="p-2 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 rounded border border-red-200 dark:border-red-800">
                      <div className="text-xs text-muted-foreground mb-1">Risco Mais Crítico:</div>
                      <div className="text-xs font-semibold text-foreground truncate" title={highestRisk.title}>
                        {highestRisk.title}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-muted-foreground">Score:</span>
                        <Badge variant="destructive" className="text-xs">
                          {highestRisk.riskScore}/10
                        </Badge>
                      </div>
                    </div>
                  );
                })()}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
                <p className="text-xs text-muted-foreground">Nenhum risco identificado</p>
                <p className="text-xs text-green-600 font-semibold mt-1">Projeto saudável! 🎉</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 w-full bg-white dark:bg-gray-800 p-1.5 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-xl transition-all">
            <Info className="h-4 w-4 mr-2" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="timeline" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white rounded-xl transition-all">
            <Calendar className="h-4 w-4 mr-2" />
            Cronograma
          </TabsTrigger>
          <TabsTrigger value="budget" className="data-[state=active]:bg-green-500 data-[state=active]:text-white rounded-xl transition-all">
            <DollarSign className="h-4 w-4 mr-2" />
            Orçamento
          </TabsTrigger>
          <TabsTrigger value="team" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white rounded-xl transition-all">
            <Users className="h-4 w-4 mr-2" />
            Equipe
          </TabsTrigger>
          <TabsTrigger value="risks" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-xl transition-all">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Riscos
          </TabsTrigger>
          <TabsTrigger value="deliverables" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white rounded-xl transition-all">
            <FileText className="h-4 w-4 mr-2" />
            Entregas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-6">
          {/* Status de Saúde do Projeto */}
          {(() => {
            const health = project.progress.healthStatus;
            const cardBorder = health === 'green' ? 'border-t-green-500' : health === 'yellow' ? 'border-t-amber-500' : 'border-t-red-500';
            const getIndicatorClasses = (status: string) => ({
              card: status === 'on-track'
                ? 'bg-green-50 border-green-300 dark:bg-green-950/40 dark:border-green-700'
                : status === 'at-risk'
                ? 'bg-amber-50 border-amber-300 dark:bg-amber-950/40 dark:border-amber-700'
                : 'bg-red-50 border-red-300 dark:bg-red-950/40 dark:border-red-700',
              icon: status === 'on-track'
                ? 'bg-green-500'
                : status === 'at-risk'
                ? 'bg-amber-500'
                : 'bg-red-500',
              text: status === 'on-track'
                ? 'text-green-700 dark:text-green-400'
                : status === 'at-risk'
                ? 'text-amber-700 dark:text-amber-400'
                : 'text-red-700 dark:text-red-400',
            });
            const healthCardClasses = health === 'green'
              ? 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-300 dark:from-green-950/40 dark:to-emerald-950/40 dark:border-green-700'
              : health === 'yellow'
              ? 'bg-gradient-to-br from-amber-50 to-yellow-100 border-amber-300 dark:from-amber-950/40 dark:to-yellow-950/40 dark:border-amber-700'
              : 'bg-gradient-to-br from-red-50 to-rose-100 border-red-300 dark:from-red-950/40 dark:to-rose-950/40 dark:border-red-700';
            const healthIconClasses = health === 'green' ? 'bg-green-500' : health === 'yellow' ? 'bg-amber-500' : 'bg-red-500';
            const healthTextClasses = health === 'green' ? 'text-green-700 dark:text-green-400' : health === 'yellow' ? 'text-amber-700 dark:text-amber-400' : 'text-red-700 dark:text-red-400';

            const sched = getIndicatorClasses(project.progress.healthIndicators.schedule);
            const budg = getIndicatorClasses(project.progress.healthIndicators.budget);
            const scop = getIndicatorClasses(project.progress.healthIndicators.scope);
            const qual = getIndicatorClasses(project.progress.healthIndicators.quality);

            return (
              <Card className={`border-t-4 ${cardBorder} hover:shadow-2xl transition-all duration-300 bg-white dark:bg-gray-900`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5" />
                      <span>Status de Saúde do Projeto</span>
                    </CardTitle>
                    <Badge
                      variant={health === 'green' ? 'default' : health === 'yellow' ? 'secondary' : 'destructive'}
                      className="text-sm px-3 py-1"
                    >
                      {health === 'green' ? '✓ Saudável' : health === 'yellow' ? '⚠ Atenção' : '✕ Crítico'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {/* Cronograma */}
                    <div className="group hover:scale-105 transition-transform">
                      <div className={`text-center p-4 rounded-xl border-2 hover:shadow-lg transition-all ${sched.card}`}>
                        <div className={`p-2 rounded-full inline-block mb-2 ${sched.icon}`}>
                          <Calendar className="h-6 w-6 text-white" />
                        </div>
                        <div className="text-sm font-bold text-foreground">Cronograma</div>
                        <div className={`text-xs mt-1 font-semibold ${sched.text}`}>
                          {project.progress.healthIndicators.schedule === 'on-track' ? '✓ No Prazo' :
                           project.progress.healthIndicators.schedule === 'at-risk' ? '⚠ Em Risco' : '✕ Atrasado'}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          {getTimeProgress().toFixed(0)}% do tempo decorrido
                        </div>
                      </div>
                    </div>

                    {/* Orçamento */}
                    <div className="group hover:scale-105 transition-transform">
                      <div className={`text-center p-4 rounded-xl border-2 hover:shadow-lg transition-all ${budg.card}`}>
                        <div className={`p-2 rounded-full inline-block mb-2 ${budg.icon}`}>
                          <DollarSign className="h-6 w-6 text-white" />
                        </div>
                        <div className="text-sm font-bold text-foreground">Orçamento</div>
                        <div className={`text-xs mt-1 font-semibold ${budg.text}`}>
                          {project.progress.healthIndicators.budget === 'on-track' ? '✓ No Orçamento' :
                           project.progress.healthIndicators.budget === 'at-risk' ? '⚠ Em Risco' : '✕ Acima'}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          {getBudgetPercentage().toFixed(0)}% consumido
                        </div>
                      </div>
                    </div>

                    {/* Escopo */}
                    <div className="group hover:scale-105 transition-transform">
                      <div className={`text-center p-4 rounded-xl border-2 hover:shadow-lg transition-all ${scop.card}`}>
                        <div className={`p-2 rounded-full inline-block mb-2 ${scop.icon}`}>
                          <FileText className="h-6 w-6 text-white" />
                        </div>
                        <div className="text-sm font-bold text-foreground">Escopo</div>
                        <div className={`text-xs mt-1 font-semibold ${scop.text}`}>
                          {project.progress.healthIndicators.scope === 'on-track' ? '✓ Controlado' :
                           project.progress.healthIndicators.scope === 'at-risk' ? '⚠ Em Risco' : '✕ Expandindo'}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          {project.scope.deliverables.length} entregas definidas
                        </div>
                      </div>
                    </div>

                    {/* Qualidade */}
                    <div className="group hover:scale-105 transition-transform">
                      <div className={`text-center p-4 rounded-xl border-2 hover:shadow-lg transition-all ${qual.card}`}>
                        <div className={`p-2 rounded-full inline-block mb-2 ${qual.icon}`}>
                          <CheckSquare className="h-6 w-6 text-white" />
                        </div>
                        <div className="text-sm font-bold text-foreground">Qualidade</div>
                        <div className={`text-xs mt-1 font-semibold ${qual.text}`}>
                          {project.progress.healthIndicators.quality === 'on-track' ? '✓ Boa' :
                           project.progress.healthIndicators.quality === 'at-risk' ? '⚠ Em Risco' : '✕ Com Problemas'}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          Monitoramento ativo
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Geral Resumido */}
                  <div className={`p-6 rounded-xl border-2 hover:shadow-lg transition-all ${healthCardClasses}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center animate-pulse ${healthIconClasses}`}>
                          {health === 'green' ? (
                            <CheckCircle className="h-6 w-6 text-white" />
                          ) : health === 'yellow' ? (
                            <AlertTriangle className="h-6 w-6 text-white" />
                          ) : (
                            <XCircle className="h-6 w-6 text-white" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground font-medium">Status Geral do Projeto</div>
                          <div className={`text-2xl font-bold ${healthTextClasses}`}>
                            {health === 'green' ? '🎉 Projeto Saudável' :
                             health === 'yellow' ? '⚠️ Requer Atenção' : '🚨 Situação Crítica'}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {health === 'green'
                              ? 'Todos os indicadores estão dentro do esperado'
                              : health === 'yellow'
                              ? 'Alguns indicadores requerem monitoramento'
                              : 'Ação imediata necessária para recuperar o projeto'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-4xl font-bold ${healthTextClasses}`}>
                          {project.progress.overallProgress}%
                        </div>
                        <div className="text-xs text-muted-foreground">Conclusão</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          <Card className="hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20 border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Info className="h-5 w-5 text-blue-600" />
                <span>Informações Gerais</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cliente */}
                <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-medium text-muted-foreground">Cliente</span>
                  </div>
                  <p className="font-bold text-lg text-blue-900 dark:text-blue-100">
                    {project.clientId || 'Não informado'}
                  </p>
                </div>

                {/* Gerente do Projeto */}
                <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="h-4 w-4 text-purple-600" />
                    <span className="text-xs font-medium text-muted-foreground">Gerente do Projeto</span>
                  </div>
                  <p className="font-bold text-lg text-purple-900 dark:text-purple-100">
                    {project.projectManager || 'Não atribuído'}
                  </p>
                </div>

                {/* Criado em */}
                <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="h-4 w-4 text-green-600" />
                    <span className="text-xs font-medium text-muted-foreground">Data de Criação</span>
                  </div>
                  <p className="font-bold text-lg text-green-900 dark:text-green-100">
                    {new Date(project.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.floor((Date.now() - new Date(project.createdAt).getTime()) / (1000 * 60 * 60 * 24))} dias atrás
                  </p>
                </div>

                {/* Última Atualização */}
                <div className="p-3 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="h-4 w-4 text-orange-600" />
                    <span className="text-xs font-medium text-muted-foreground">Última Atualização</span>
                  </div>
                  <p className="font-bold text-lg text-orange-900 dark:text-orange-100">
                    {new Date(project.updatedAt).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.floor((Date.now() - new Date(project.updatedAt).getTime()) / (1000 * 60 * 60 * 24))} dias atrás
                  </p>
                </div>
              </div>

              {/* Timeline do Projeto */}
              <div className="p-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <h4 className="text-sm font-semibold mb-3 flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-indigo-600" />
                  Timeline do Projeto
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="text-center p-2 bg-white/50 dark:bg-black/30 rounded">
                    <div className="text-xs text-muted-foreground mb-1">Início</div>
                    <div className="font-bold text-indigo-900 dark:text-indigo-100">
                      {project.startDate ? new Date(project.startDate).toLocaleDateString('pt-BR') : 'Não definido'}
                    </div>
                  </div>
                  {project.estimatedDuration && (
                    <div className="text-center p-2 bg-white/50 dark:bg-black/30 rounded">
                      <div className="text-xs text-muted-foreground mb-1">Duração</div>
                      <div className="font-bold text-purple-900 dark:text-purple-100">
                        {project.estimatedDuration} dias
                      </div>
                    </div>
                  )}
                  <div className="text-center p-2 bg-white/50 dark:bg-black/30 rounded">
                    <div className="text-xs text-muted-foreground mb-1">Término Previsto</div>
                    <div className="font-bold text-pink-900 dark:text-pink-100">
                      {project.endDate ? new Date(project.endDate).toLocaleDateString('pt-BR') : 'Não definido'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Prioridade e Tipo */}
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-slate-100 dark:from-gray-900 dark:to-slate-900 rounded-lg border border-gray-200 dark:border-gray-800">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Prioridade</div>
                  <Badge variant={
                    project.priority === 'CRITICAL' ? 'destructive' :
                    project.priority === 'HIGH' ? 'secondary' : 'outline'
                  } className="text-sm">
                    {project.priority === 'CRITICAL' ? '🔥 Crítica' :
                     project.priority === 'HIGH' ? '⚡ Alta' :
                     project.priority === 'MEDIUM' ? '📋 Média' : '📌 Baixa'}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground mb-1">Tipo de Projeto</div>
                  <Badge variant="outline" className="text-sm">
                    {project.type}
                  </Badge>
                </div>
              </div>

              {/* Tags */}
              {project.tags && project.tags.length > 0 && (
                <div className="p-3 bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-cyan-950 dark:to-teal-950 rounded-lg border border-cyan-200 dark:border-cyan-800">
                  <div className="flex items-center space-x-2 mb-2">
                    <FileText className="h-4 w-4 text-cyan-600" />
                    <span className="text-xs font-medium text-muted-foreground">Tags do Projeto</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-indigo-50 dark:from-gray-800 dark:to-indigo-900/20 border-l-4 border-l-indigo-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  <span>Escopo do Projeto</span>
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {project.scope.objectives.length + project.scope.deliverables.length} itens
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Objetivos */}
              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-semibold mb-3 flex items-center">
                  <div className="p-1.5 bg-green-500 rounded-lg mr-2">
                    <CheckSquare className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-green-900 dark:text-green-100">Objetivos</span>
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {project.scope.objectives.length}
                  </Badge>
                </h4>
                <ul className="space-y-2">
                  {project.scope.objectives.map((obj, i) => (
                    <li key={i} className="flex items-start space-x-2 p-2 bg-white/50 dark:bg-black/30 rounded">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white text-xs font-bold flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-sm text-foreground font-medium">{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Entregas Principais */}
              <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold mb-3 flex items-center">
                  <div className="p-1.5 bg-blue-500 rounded-lg mr-2">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-blue-900 dark:text-blue-100">Entregas Principais</span>
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {project.scope.deliverables.length}
                  </Badge>
                </h4>
                <ul className="space-y-2">
                  {project.scope.deliverables.map((del, i) => (
                    <li key={i} className="flex items-start space-x-2 p-2 bg-white/50 dark:bg-black/30 rounded">
                      <CheckSquare className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground font-medium">{del}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Fora do Escopo */}
              {project.scope.outOfScope && project.scope.outOfScope.length > 0 && (
                <div className="p-4 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950 dark:to-rose-950 rounded-lg border border-red-200 dark:border-red-800">
                  <h4 className="font-semibold mb-3 flex items-center">
                    <div className="p-1.5 bg-red-500 rounded-lg mr-2">
                      <XCircle className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-red-900 dark:text-red-100">Fora do Escopo</span>
                    <Badge variant="destructive" className="ml-2 text-xs">
                      {project.scope.outOfScope.length}
                    </Badge>
                  </h4>
                  <ul className="space-y-2">
                    {project.scope.outOfScope.map((item, i) => (
                      <li key={i} className="flex items-start space-x-2 p-2 bg-white/50 dark:bg-black/30 rounded">
                        <XCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground font-medium line-through opacity-70">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Grid com Premissas e Restrições */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Premissas */}
                {project.scope.assumptions && project.scope.assumptions.length > 0 && (
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950 rounded-lg border border-purple-200 dark:border-purple-800">
                    <h4 className="font-semibold mb-3 flex items-center">
                      <div className="p-1.5 bg-purple-500 rounded-lg mr-2">
                        <Info className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-purple-900 dark:text-purple-100 text-sm">Premissas</span>
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {project.scope.assumptions.length}
                      </Badge>
                    </h4>
                    <ul className="space-y-2">
                      {project.scope.assumptions.map((item, i) => (
                        <li key={i} className="flex items-start space-x-2 text-xs p-2 bg-white/50 dark:bg-black/30 rounded">
                          <Info className="h-3 w-3 text-purple-600 flex-shrink-0 mt-0.5" />
                          <span className="text-foreground font-medium">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Restrições */}
                {project.scope.constraints && project.scope.constraints.length > 0 && (
                  <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 rounded-lg border border-orange-200 dark:border-orange-800">
                    <h4 className="font-semibold mb-3 flex items-center">
                      <div className="p-1.5 bg-orange-500 rounded-lg mr-2">
                        <AlertTriangle className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-orange-900 dark:text-orange-100 text-sm">Restrições</span>
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {project.scope.constraints.length}
                      </Badge>
                    </h4>
                    <ul className="space-y-2">
                      {project.scope.constraints.map((item, i) => (
                        <li key={i} className="flex items-start space-x-2 text-xs p-2 bg-white/50 dark:bg-black/30 rounded">
                          <AlertTriangle className="h-3 w-3 text-orange-600 flex-shrink-0 mt-0.5" />
                          <span className="text-foreground font-medium">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {project.notes && (
            <Card className="hover:shadow-2xl transition-all duration-300 border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
                    <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span>Notas do Projeto</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-foreground whitespace-pre-wrap font-medium leading-relaxed">
                    {project.notes}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4 mt-6">
          {(() => {
            // Calcular limites de tempo para o Gantt
            const allDates = project.timeline.phases.flatMap(p => [new Date(p.startDate), new Date(p.endDate)]);
            const ganttStart = allDates.length > 0 ? new Date(Math.min(...allDates.map(d => d.getTime()))) : new Date(project.startDate || Date.now());
            const ganttEnd   = allDates.length > 0 ? new Date(Math.max(...allDates.map(d => d.getTime()))) : new Date(project.endDate   || Date.now());
            const totalMs    = ganttEnd.getTime() - ganttStart.getTime() || 1;

            // Gerar meses para o cabeçalho
            const months: Date[] = [];
            const cur = new Date(ganttStart.getFullYear(), ganttStart.getMonth(), 1);
            const endMonth = new Date(ganttEnd.getFullYear(), ganttEnd.getMonth() + 1, 1);
            while (cur < endMonth) {
              months.push(new Date(cur));
              cur.setMonth(cur.getMonth() + 1);
            }
            const monthNames = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

            const PHASE_COLORS = [
              { bar: 'from-blue-500 to-blue-400',    bg: 'bg-blue-500/10 dark:bg-blue-500/20',    border: 'border-blue-400/30', text: 'text-blue-400',    dot: 'bg-blue-400'    },
              { bar: 'from-violet-500 to-violet-400', bg: 'bg-violet-500/10 dark:bg-violet-500/20', border: 'border-violet-400/30', text: 'text-violet-400', dot: 'bg-violet-400' },
              { bar: 'from-emerald-500 to-teal-400', bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', border: 'border-emerald-400/30', text: 'text-emerald-400', dot: 'bg-emerald-400' },
              { bar: 'from-amber-500 to-orange-400', bg: 'bg-amber-500/10 dark:bg-amber-500/20',  border: 'border-amber-400/30',  text: 'text-amber-400',  dot: 'bg-amber-400'  },
              { bar: 'from-pink-500 to-rose-400',    bg: 'bg-pink-500/10 dark:bg-pink-500/20',    border: 'border-pink-400/30',   text: 'text-pink-400',   dot: 'bg-pink-400'   },
              { bar: 'from-cyan-500 to-sky-400',     bg: 'bg-cyan-500/10 dark:bg-cyan-500/20',    border: 'border-cyan-400/30',   text: 'text-cyan-400',   dot: 'bg-cyan-400'   },
            ];

            return (
              <Card className="border border-border/60 bg-card/95 shadow-xl overflow-hidden">
                <CardHeader className="border-b border-border/40 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2 text-lg">
                      <Calendar className="h-5 w-5 text-purple-500" />
                      <span>Cronograma do Projeto</span>
                    </CardTitle>
                    <Button size="sm" onClick={() => setIsPhaseManagementOpen(true)} className="bg-primary/90 hover:bg-primary gap-1.5">
                      <Edit className="h-3.5 w-3.5" />
                      Gerenciar Fases
                    </Button>
                  </div>

                  {/* Barra de progresso geral */}
                  <div className="mt-4 p-3 rounded-xl bg-muted/40 border border-border/40">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Progresso do Cronograma</span>
                      <span className="text-sm font-bold text-foreground">{getTimeProgress().toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-border/40 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 via-violet-500 to-purple-500 rounded-full transition-all duration-700"
                        style={{ width: `${getTimeProgress()}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-muted-foreground mt-1.5">
                      <span>Início: {project.startDate ? new Date(project.startDate).toLocaleDateString('pt-BR') : 'N/A'}</span>
                      <span>Término: {project.endDate ? new Date(project.endDate).toLocaleDateString('pt-BR') : 'N/A'}</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  {project.timeline.phases.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                      <Calendar className="h-12 w-12 mb-3 opacity-30" />
                      <p className="text-sm">Nenhuma fase cadastrada</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      {/* Layout: coluna esquerda fixa (info) + coluna direita (gantt) */}
                      <div className="min-w-[700px]">

                        {/* Cabeçalho dos meses */}
                        <div className="flex border-b border-border/40 bg-muted/30">
                          {/* Coluna de label */}
                          <div className="w-52 shrink-0 px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide border-r border-border/40">
                            Fase
                          </div>
                          {/* Meses */}
                          <div className="flex-1 flex">
                            {months.map((m, i) => (
                              <div
                                key={i}
                                className="flex-1 text-center text-[11px] font-semibold text-muted-foreground py-2.5 border-r border-border/20 last:border-r-0"
                              >
                                {monthNames[m.getMonth()]} {m.getFullYear() !== ganttStart.getFullYear() ? String(m.getFullYear()).slice(2) : ''}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Linhas de fases */}
                        {project.timeline.phases.map((phase, idx) => {
                          const color = PHASE_COLORS[idx % PHASE_COLORS.length];
                          const phaseStart = new Date(phase.startDate);
                          const phaseEnd   = new Date(phase.endDate);
                          const leftPct  = ((phaseStart.getTime() - ganttStart.getTime()) / totalMs) * 100;
                          const widthPct = ((phaseEnd.getTime()   - phaseStart.getTime()) / totalMs) * 100;
                          const phaseProgress = phase.tasks.length > 0
                            ? (phase.tasks.filter(t => t.status === 'done').length / phase.tasks.length) * 100
                            : 0;
                          const statusLabel =
                            phase.status === 'completed'  ? '✓ Concluída'    :
                            phase.status === 'in-progress'? '⚡ Em Andamento' :
                            phase.status === 'delayed'    ? '⏰ Atrasada'     : '📋 Pendente';

                          return (
                            <div
                              key={phase.id}
                              className={`flex items-stretch border-b border-border/30 last:border-b-0 hover:bg-muted/20 transition-colors group ${idx % 2 === 1 ? 'bg-muted/10' : ''}`}
                            >
                              {/* Info lateral */}
                              <div className={`w-52 shrink-0 px-4 py-3.5 border-r border-border/40 ${color.bg}`}>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${color.dot}`} />
                                  <span className="text-sm font-bold text-foreground truncate" title={phase.name}>
                                    {phase.name}
                                  </span>
                                </div>
                                <div className={`text-[11px] font-medium mb-2 ${color.text}`}>{statusLabel}</div>
                                <div className="text-[10px] text-muted-foreground space-y-0.5">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>{phaseStart.toLocaleDateString('pt-BR', { day:'2-digit', month:'short' })}</span>
                                    <span>→</span>
                                    <span>{phaseEnd.toLocaleDateString('pt-BR', { day:'2-digit', month:'short' })}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <CheckSquare className="h-3 w-3" />
                                    <span>{phase.tasks.filter(t => t.status === 'done').length}/{phase.tasks.length} tarefas</span>
                                  </div>
                                </div>
                              </div>

                              {/* Área Gantt */}
                              <div className="flex-1 relative py-4 px-1">
                                {/* Grid de meses */}
                                <div className="absolute inset-0 flex pointer-events-none">
                                  {months.map((_, i) => (
                                    <div key={i} className="flex-1 border-r border-border/15 last:border-r-0" />
                                  ))}
                                </div>

                                {/* Barra da fase */}
                                <div className="relative h-8 mx-1">
                                  <div
                                    className={`absolute top-0 h-full rounded-full bg-gradient-to-r ${color.bar} shadow-sm flex items-center px-3 overflow-hidden group-hover:shadow-md transition-shadow`}
                                    style={{
                                      left:  `${Math.max(0, leftPct)}%`,
                                      width: `${Math.max(2, Math.min(widthPct, 100 - Math.max(0, leftPct)))}%`,
                                    }}
                                  >
                                    {/* Progresso interno */}
                                    {phaseProgress > 0 && (
                                      <div
                                        className="absolute left-0 top-0 h-full rounded-full bg-white/20"
                                        style={{ width: `${phaseProgress}%` }}
                                      />
                                    )}
                                    <span className="relative text-[11px] font-bold text-white truncate z-10">
                                      {widthPct > 12 ? `${phaseProgress.toFixed(0)}%` : ''}
                                    </span>
                                    {/* Bolinha terminal */}
                                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white/50 border border-white/80 z-10" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* Linha de "hoje" */}
                        {project.startDate && project.endDate && (() => {
                          const todayPct = ((Date.now() - ganttStart.getTime()) / totalMs) * 100;
                          if (todayPct < 0 || todayPct > 100) return null;
                          return (
                            <div className="flex border-t border-border/40 bg-muted/20">
                              <div className="w-52 shrink-0 px-4 py-2 border-r border-border/40 text-[11px] text-muted-foreground font-medium">
                                Hoje
                              </div>
                              <div className="flex-1 relative h-8">
                                <div
                                  className="absolute top-0 bottom-0 w-px bg-red-500/60 z-10"
                                  style={{ left: `${todayPct}%` }}
                                >
                                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-red-500" />
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Detalhe das tarefas por fase (collapsible summary abaixo do gantt) */}
                  {project.timeline.phases.some(p => p.tasks.length > 0) && (
                    <div className="border-t border-border/40 px-4 py-4 space-y-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Detalhe de Tarefas</p>
                      {project.timeline.phases.map((phase, idx) => {
                        if (phase.tasks.length === 0) return null;
                        const color = PHASE_COLORS[idx % PHASE_COLORS.length];
                        return (
                          <div key={phase.id} className={`rounded-xl border ${color.border} ${color.bg} p-4`}>
                            <div className="flex items-center gap-2 mb-3">
                              <span className={`h-2.5 w-2.5 rounded-full ${color.dot}`} />
                              <span className="text-sm font-bold text-foreground">{phase.name}</span>
                              <Badge variant="outline" className={`text-xs ml-auto ${color.text}`}>
                                {phase.tasks.filter(t => t.status === 'done').length}/{phase.tasks.length}
                              </Badge>
                            </div>
                            <div className="space-y-1.5 max-h-48 overflow-y-auto">
                              {phase.tasks.map(task => (
                                <div key={task.id} className="flex items-center justify-between py-1.5 px-3 bg-background/60 rounded-lg border border-border/30">
                                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                      task.status === 'done' ? 'bg-emerald-500 border-emerald-500' : 'border-border'
                                    }`}>
                                      {task.status === 'done' && <CheckSquare className="h-2.5 w-2.5 text-white" />}
                                    </div>
                                    <span className={`text-xs font-medium truncate ${
                                      task.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'
                                    }`}>
                                      {task.name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                    {task.assignedTo && (
                                      <span className="text-[10px] text-muted-foreground border border-border/50 rounded px-1.5 py-0.5">
                                        {task.assignedTo}
                                      </span>
                                    )}
                                    <Badge variant={
                                      task.status === 'done' ? 'default' :
                                      task.status === 'in-progress' ? 'secondary' : 'outline'
                                    } className="text-[10px] px-1.5">
                                      {task.status === 'done' ? '✓' : task.status === 'in-progress' ? '⚡' : task.status === 'review' ? '👁' : '📋'}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })()}

          {/* Milestones */}
          {project.timeline.milestones && project.timeline.milestones.length > 0 && (
            <Card className="border-l-4 border-l-amber-400 bg-gradient-to-br from-amber-50/50 to-yellow-50/50 dark:from-amber-900/10 dark:to-yellow-900/10">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-amber-600" />
                  <span>Marcos do Projeto</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {project.timeline.milestones.map(milestone => (
                    <div key={milestone.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          milestone.status === 'achieved' 
                            ? 'bg-green-100 dark:bg-green-900/30' 
                            : milestone.status === 'missed'
                            ? 'bg-red-100 dark:bg-red-900/30'
                            : 'bg-gray-100 dark:bg-gray-800'
                        }`}>
                          <CheckCircle className={`h-5 w-5 ${
                            milestone.status === 'achieved' ? 'text-green-600' :
                            milestone.status === 'missed' ? 'text-red-600' : 'text-gray-400'
                          }`} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{milestone.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{milestone.description}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Prazo: {new Date(milestone.dueDate).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <Badge variant={
                        milestone.status === 'achieved' ? 'default' :
                        milestone.status === 'missed' ? 'destructive' : 'outline'
                      }>
                        {milestone.status === 'achieved' ? '✓ Alcançado' : 
                         milestone.status === 'missed' ? '✕ Perdido' : '⏳ Pendente'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="budget" className="space-y-4 mt-6">
          <Card className="hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span>Orçamento do Projeto</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Cards de Resumo Financeiro */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="group hover:scale-105 transition-transform">
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-xl border-2 border-blue-200 dark:border-blue-800 hover:shadow-lg">
                    <div className="inline-flex p-3 bg-blue-500 rounded-full mb-3">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                      Orçamento Total
                    </div>
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                      {project.budget.currency} {(project.budget.totalBudget || 0).toLocaleString('pt-BR')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      100% do projeto
                    </div>
                  </div>
                </div>

                <div className="group hover:scale-105 transition-transform">
                  <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 rounded-xl border-2 border-orange-200 dark:border-orange-800 hover:shadow-lg">
                    <div className="inline-flex p-3 bg-orange-500 rounded-full mb-3">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                      Gasto até Agora
                    </div>
                    <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                      {project.budget.currency} {(project.budget.spentBudget || 0).toLocaleString('pt-BR')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {getBudgetPercentage().toFixed(1)}% consumido
                    </div>
                  </div>
                </div>

                <div className="group hover:scale-105 transition-transform">
                  <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-xl border-2 border-green-200 dark:border-green-800 hover:shadow-lg">
                    <div className="inline-flex p-3 bg-green-500 rounded-full mb-3">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                      Saldo Restante
                    </div>
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                      {project.budget.currency} {(project.budget.remainingBudget || 0).toLocaleString('pt-BR')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {(100 - getBudgetPercentage()).toFixed(1)}% disponível
                    </div>
                  </div>
                </div>
              </div>

              {/* Barra de Progresso do Orçamento */}
              <div className="p-6 bg-gradient-to-r from-gray-50 to-slate-100 dark:from-gray-900 dark:to-slate-900 rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold">Consumo do Orçamento</span>
                  <Badge variant={
                    getBudgetPercentage() > 90 ? "destructive" : 
                    getBudgetPercentage() > 75 ? "secondary" : "default"
                  }>
                    {getBudgetPercentage().toFixed(1)}%
                  </Badge>
                </div>
                <Progress value={getBudgetPercentage()} className="h-3 mb-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>R$ 0</span>
                  <span>R$ {(project.budget.totalBudget || 0).toLocaleString('pt-BR')}</span>
                </div>
              </div>

              {/* Breakdown de Custos */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-lg flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-indigo-600" />
                    Breakdown de Custos por Categoria
                  </h4>
                  <Badge variant="outline">
                    {project.budget.breakdown.length} categorias
                  </Badge>
                </div>
                <div className="space-y-3">
                  {project.budget.breakdown.map((item, index) => {
                    const itemPercentage = (item.plannedCost / project.budget.totalBudget) * 100;
                    const spentPercentage = (item.actualCost / item.plannedCost) * 100;
                    const colors = [
                      'from-blue-500 to-cyan-500',
                      'from-purple-500 to-pink-500',
                      'from-green-500 to-emerald-500',
                      'from-orange-500 to-red-500',
                      'from-indigo-500 to-purple-500',
                      'from-yellow-500 to-orange-500'
                    ];
                    const borderColors = [
                      'border-blue-200 dark:border-blue-800',
                      'border-purple-200 dark:border-purple-800',
                      'border-green-200 dark:border-green-800',
                      'border-orange-200 dark:border-orange-800',
                      'border-indigo-200 dark:border-indigo-800',
                      'border-yellow-200 dark:border-yellow-800'
                    ];
                    const bgColors = [
                      'bg-blue-50 dark:bg-blue-950',
                      'bg-purple-50 dark:bg-purple-950',
                      'bg-green-50 dark:bg-green-950',
                      'bg-orange-50 dark:bg-orange-950',
                      'bg-indigo-50 dark:bg-indigo-950',
                      'bg-yellow-50 dark:bg-yellow-950'
                    ];

                    return (
                      <div 
                        key={item.id} 
                        className={`p-4 rounded-lg border-2 hover:shadow-lg transition-all ${borderColors[index % borderColors.length]} ${bgColors[index % bgColors.length]}`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${colors[index % colors.length]}`} />
                              <h5 className="font-bold text-foreground">{item.category}</h5>
                              <Badge variant="outline" className="text-xs">
                                {itemPercentage.toFixed(1)}% do total
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground ml-5">{item.description}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="text-center p-2 bg-white/50 dark:bg-black/30 rounded">
                            <div className="text-xs text-muted-foreground mb-1">Planejado</div>
                            <div className="font-bold text-foreground">
                              {project.budget.currency} {(item.plannedCost || 0).toLocaleString('pt-BR')}
                            </div>
                          </div>
                          <div className="text-center p-2 bg-white/50 dark:bg-black/30 rounded">
                            <div className="text-xs text-muted-foreground mb-1">Gasto Real</div>
                            <div className="font-bold text-foreground">
                              {project.budget.currency} {(item.actualCost || 0).toLocaleString('pt-BR')}
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-muted-foreground">Execução</span>
                            <span className="text-xs font-semibold">
                              {spentPercentage.toFixed(1)}%
                            </span>
                          </div>
                          <Progress value={spentPercentage} className="h-2" />
                          {spentPercentage > 100 && (
                            <div className="flex items-center text-xs text-red-600 mt-1">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Acima do planejado
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-4 mt-6">
          <Card className="hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-l-4 border-l-indigo-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  <span>Equipe do Projeto</span>
                </CardTitle>
                <Badge variant="secondary">
                  {project.team.length} {project.team.length === 1 ? 'membro' : 'membros'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {project.team.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                    <Users className="h-12 w-12 text-gray-400" />
                  </div>
                  <p className="text-center text-gray-500 text-lg font-medium">Nenhum membro na equipe</p>
                  <p className="text-center text-gray-400 text-sm mt-2">Adicione membros para começar a colaborar</p>
                </div>
              ) : (
                <>
                  {/* Estatísticas da Equipe */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Total de Membros</div>
                          <div className="text-2xl font-bold text-purple-600">{project.team.length}</div>
                        </div>
                        <Users className="h-8 w-8 text-purple-400" />
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Alocação Média</div>
                          <div className="text-2xl font-bold text-blue-600">
                            {project.team.length > 0 
                              ? (project.team.reduce((sum, m) => sum + m.allocation, 0) / project.team.length).toFixed(0)
                              : 0}%
                          </div>
                        </div>
                        <TrendingUp className="h-8 w-8 text-blue-400" />
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Funções Únicas</div>
                          <div className="text-2xl font-bold text-green-600">
                            {new Set(project.team.map(m => m.role)).size}
                          </div>
                        </div>
                        <CheckSquare className="h-8 w-8 text-green-400" />
                      </div>
                    </div>
                  </div>

                  {/* Lista de Membros */}
                  <div className="space-y-3">
                    {project.team.map((member, index) => {
                      const colors = [
                        'from-purple-500 to-pink-500',
                        'from-blue-500 to-cyan-500',
                        'from-green-500 to-emerald-500',
                        'from-orange-500 to-red-500',
                        'from-indigo-500 to-purple-500',
                        'from-yellow-500 to-orange-500'
                      ];
                      const bgColors = [
                        'from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950',
                        'from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950',
                        'from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950',
                        'from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950',
                        'from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950',
                        'from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950'
                      ];
                      const borderColors = [
                        'border-purple-200 dark:border-purple-800',
                        'border-blue-200 dark:border-blue-800',
                        'border-green-200 dark:border-green-800',
                        'border-orange-200 dark:border-orange-800',
                        'border-indigo-200 dark:border-indigo-800',
                        'border-yellow-200 dark:border-yellow-800'
                      ];

                      return (
                        <div 
                          key={member.id} 
                          className={`p-4 rounded-lg border-2 hover:shadow-lg transition-all bg-gradient-to-r ${bgColors[index % bgColors.length]} ${borderColors[index % borderColors.length]}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 flex-1">
                              {/* Avatar */}
                              <div 
                                className={`w-14 h-14 rounded-full bg-gradient-to-br ${colors[index % colors.length]} flex items-center justify-center text-white font-bold text-lg shadow-lg`}
                                title={member.name}
                              >
                                {member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </div>

                              {/* Info do Membro */}
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h5 className="font-bold text-lg text-foreground">{member.name}</h5>
                                  {member.name === project.projectManager && (
                                    <Badge variant="default" className="text-xs">
                                      PM
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground flex items-center">
                                  <FileText className="h-3 w-3 mr-1" />
                                  {member.role}
                                </p>
                              </div>
                            </div>

                            {/* Alocação */}
                            <div className="text-right ml-4">
                              <div className="mb-2">
                                <Badge 
                                  variant={
                                    member.allocation === 100 ? "default" : 
                                    member.allocation >= 75 ? "secondary" : "outline"
                                  }
                                  className="text-sm px-3 py-1"
                                >
                                  {member.allocation}% alocado
                                </Badge>
                              </div>
                              <div className="w-32">
                                <Progress value={member.allocation} className="h-2" />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Distribuição por Função */}
                  <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-slate-100 dark:from-gray-900 dark:to-slate-900 rounded-lg border border-gray-200 dark:border-gray-800">
                    <h4 className="font-semibold mb-3 flex items-center">
                      <CheckSquare className="h-4 w-4 mr-2 text-indigo-600" />
                      Distribuição por Função
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(new Set(project.team.map(m => m.role))).map((role, i) => {
                        const count = project.team.filter(m => m.role === role).length;
                        return (
                          <Badge key={i} variant="secondary" className="text-sm">
                            {role} ({count})
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risks" className="space-y-4 mt-6">
          <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-l-4 border-l-orange-500 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <span>Análise de Riscos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {project.risks.length === 0 ? (
                <div className="text-center py-12">
                  <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Nenhum risco identificado</p>
                  <p className="text-xs text-gray-400 mt-1">Isso é ótimo! Continue monitorando o projeto.</p>
                </div>
              ) : (
                <>
                  {/* Resumo de Riscos */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 rounded-xl border-2 border-red-200 dark:border-red-800 hover:shadow-lg transition-all">
                      <div className="inline-flex p-2 bg-red-500 rounded-full mb-2">
                        <AlertTriangle className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {project.risks.filter(r => r.riskScore >= 8).length}
                      </div>
                      <div className="text-xs text-red-700 dark:text-red-300 mt-1 font-medium">Riscos Altos</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 rounded-xl border-2 border-orange-200 dark:border-orange-800 hover:shadow-lg transition-all">
                      <div className="inline-flex p-2 bg-orange-500 rounded-full mb-2">
                        <AlertTriangle className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {project.risks.filter(r => r.riskScore >= 5 && r.riskScore < 8).length}
                      </div>
                      <div className="text-xs text-orange-700 dark:text-orange-300 mt-1 font-medium">Riscos Médios</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 rounded-xl border-2 border-yellow-200 dark:border-yellow-800 hover:shadow-lg transition-all">
                      <div className="inline-flex p-2 bg-yellow-500 rounded-full mb-2">
                        <AlertTriangle className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        {project.risks.filter(r => r.riskScore < 5).length}
                      </div>
                      <div className="text-xs text-yellow-700 dark:text-yellow-300 mt-1 font-medium">Riscos Baixos</div>
                    </div>
                  </div>

                  {/* Lista de Riscos */}
                  <div className="space-y-4">
                    {project.risks
                      .sort((a, b) => b.riskScore - a.riskScore)
                      .map(risk => {
                        const riskLevel = risk.riskScore >= 8 ? 'high' : risk.riskScore >= 5 ? 'medium' : 'low';
                        const riskCardClass = riskLevel === 'high'
                          ? 'border-l-red-400 bg-gradient-to-br from-red-50/50 to-rose-50/50 dark:from-red-950/20 dark:to-rose-950/20 border-red-200 dark:border-red-800'
                          : riskLevel === 'medium'
                          ? 'border-l-orange-400 bg-gradient-to-br from-orange-50/50 to-amber-50/50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200 dark:border-orange-800'
                          : 'border-l-yellow-400 bg-gradient-to-br from-yellow-50/50 to-lime-50/50 dark:from-yellow-950/20 dark:to-lime-950/20 border-yellow-200 dark:border-yellow-800';
                        const iconColor = riskLevel === 'high' ? 'text-red-600' : riskLevel === 'medium' ? 'text-orange-600' : 'text-yellow-600';

                        return (
                        <div key={risk.id} className={`rounded-xl border-l-4 border-2 p-5 hover:shadow-lg transition-all ${riskCardClass}`}>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-start space-x-3 flex-1">
                              <div className={`p-2 rounded-lg ${riskLevel === 'high' ? 'bg-red-100 dark:bg-red-900/40' : riskLevel === 'medium' ? 'bg-orange-100 dark:bg-orange-900/40' : 'bg-yellow-100 dark:bg-yellow-900/40'}`}>
                                <AlertTriangle className={`h-5 w-5 ${iconColor}`} />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-bold text-lg mb-1 text-gray-900 dark:text-white">{risk.title}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{risk.description}</p>
                              </div>
                            </div>
                            <Badge variant={
                              riskLevel === 'high' ? 'destructive' :
                              riskLevel === 'medium' ? 'secondary' : 'outline'
                            } className="ml-2 text-sm font-bold">
                              {risk.riskScore}/10
                            </Badge>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <Badge variant="outline" className="text-xs">
                              {risk.category === 'technical' ? '⚙ Técnico' :
                               risk.category === 'financial' ? '💰 Financeiro' :
                               risk.category === 'resource' ? '👥 Recursos' :
                               risk.category === 'schedule' ? '📅 Cronograma' : '🌐 Externo'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Prob: {risk.probability === 'high' ? '🔴 Alta' : risk.probability === 'medium' ? '🟡 Média' : '🟢 Baixa'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Impacto: {risk.impact === 'high' ? '🔴 Alto' : risk.impact === 'medium' ? '🟡 Médio' : '🟢 Baixo'}
                            </Badge>
                            <Badge variant={
                              risk.status === 'mitigating' ? 'default' :
                              risk.status === 'closed' ? 'secondary' : 'outline'
                            } className="text-xs">
                              {risk.status === 'identified' ? '🔍 Identificado' :
                               risk.status === 'analyzing' ? '🔬 Analisando' :
                               risk.status === 'mitigating' ? '🛡 Mitigando' : '✓ Fechado'}
                            </Badge>
                          </div>

                          {risk.mitigationPlan && (
                            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-800">
                              <p className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-1">🛡 Plano de Mitigação:</p>
                              <p className="text-xs text-blue-800 dark:text-blue-400">{risk.mitigationPlan}</p>
                            </div>
                          )}

                          {risk.owner && (
                            <div className="mt-2 flex items-center text-xs text-muted-foreground">
                              <Users className="h-3 w-3 mr-1" />
                              Responsável: <span className="font-semibold ml-1 text-foreground">{risk.owner}</span>
                            </div>
                          )}
                        </div>
                        );
                      })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deliverables" className="space-y-4 mt-6">
          <Card className="hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 border-l-4 border-l-pink-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  <span>Entregas do Projeto</span>
                </CardTitle>
                <Badge variant="secondary">
                  {project.deliverables.length} {project.deliverables.length === 1 ? 'entrega' : 'entregas'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {project.deliverables.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                    <FileText className="h-12 w-12 text-gray-400" />
                  </div>
                  <p className="text-center text-gray-500 text-lg font-medium">Nenhuma entrega definida</p>
                  <p className="text-center text-gray-400 text-sm mt-2">Defina as entregas para acompanhar o progresso</p>
                </div>
              ) : (
                <>
                  {/* Resumo de Entregas */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg border border-green-200 dark:border-green-800 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {project.deliverables.filter(d => d.status === 'approved').length}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Aprovadas</div>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 rounded-lg border border-blue-200 dark:border-blue-800 text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {project.deliverables.filter(d => d.status === 'delivered').length}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Entregues</div>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 rounded-lg border border-orange-200 dark:border-orange-800 text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {project.deliverables.filter(d => d.status === 'in-progress').length}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Em Progresso</div>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900 dark:to-slate-900 rounded-lg border border-gray-200 dark:border-gray-800 text-center">
                      <div className="text-2xl font-bold text-gray-600">
                        {project.deliverables.filter(d => d.status === 'pending').length}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Pendentes</div>
                    </div>
                  </div>

                  {/* Barra de Progresso Geral */}
                  <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 rounded-lg border border-indigo-200 dark:border-indigo-800 mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold">Progresso das Entregas</span>
                      <span className="text-sm font-bold">
                        {((project.deliverables.filter(d => d.status === 'approved' || d.status === 'delivered').length / project.deliverables.length) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Progress 
                      value={(project.deliverables.filter(d => d.status === 'approved' || d.status === 'delivered').length / project.deliverables.length) * 100} 
                      className="h-3"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                      <span>
                        {project.deliverables.filter(d => d.status === 'approved' || d.status === 'delivered').length} de {project.deliverables.length} concluídas
                      </span>
                      <span>
                        {project.deliverables.filter(d => d.status === 'pending' || d.status === 'in-progress').length} restantes
                      </span>
                    </div>
                  </div>

                  {/* Lista de Entregas */}
                  <div className="space-y-4">
                    {project.deliverables.map((deliverable, index) => {
                      const getDeliverableConfig = (status: string) => {
                        switch (status) {
                          case 'approved':
                            return {
                              bg: 'from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950',
                              border: 'border-green-300 dark:border-green-700',
                              icon: CheckCircle,
                              iconColor: 'text-green-600',
                              iconBg: 'bg-green-500',
                              badgeClass: 'bg-green-500 hover:bg-green-600 text-white',
                              label: '✓ Aprovada'
                            };
                          case 'delivered':
                            return {
                              bg: 'from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950',
                              border: 'border-blue-300 dark:border-blue-700',
                              icon: CheckSquare,
                              iconColor: 'text-blue-600',
                              iconBg: 'bg-blue-500',
                              badgeClass: 'bg-blue-500 hover:bg-blue-600 text-white',
                              label: '📦 Entregue'
                            };
                          case 'in-progress':
                            return {
                              bg: 'from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950',
                              border: 'border-orange-300 dark:border-orange-700',
                              icon: TrendingUp,
                              iconColor: 'text-orange-600',
                              iconBg: 'bg-orange-500',
                              badgeClass: 'bg-orange-500 hover:bg-orange-600 text-white',
                              label: '⚡ Em Progresso'
                            };
                          default:
                            return {
                              bg: 'from-gray-50 to-slate-50 dark:from-gray-900 dark:to-slate-900',
                              border: 'border-gray-300 dark:border-gray-700',
                              icon: Calendar,
                              iconColor: 'text-gray-600',
                              iconBg: 'bg-gray-500',
                              badgeClass: 'bg-gray-500 hover:bg-gray-600 text-white',
                              label: '📋 Pendente'
                            };
                        }
                      };

                      const config = getDeliverableConfig(deliverable.status);
                      const Icon = config.icon;
                      const daysUntilDue = Math.ceil((new Date(deliverable.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                      const isOverdue = daysUntilDue < 0 && deliverable.status !== 'approved' && deliverable.status !== 'delivered';

                      return (
                        <div 
                          key={deliverable.id} 
                          className={`group hover:scale-[1.02] transition-all rounded-xl p-5 border-2 bg-gradient-to-r ${config.bg} ${config.border} hover:shadow-xl`}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start space-x-4 flex-1">
                              {/* Ícone */}
                              <div className={`p-3 ${config.iconBg} rounded-full shadow-lg`}>
                                <Icon className="h-6 w-6 text-white" />
                              </div>

                              {/* Informações */}
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h4 className="font-bold text-lg text-foreground">{deliverable.name}</h4>
                                  {isOverdue && (
                                    <Badge variant="destructive" className="text-xs animate-pulse">
                                      Atrasado
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                                  {deliverable.description}
                                </p>

                                {/* Informações de Data */}
                                <div className="flex items-center space-x-4 text-xs">
                                  <div className="flex items-center space-x-1">
                                    <Calendar className="h-3 w-3" />
                                    <span className="font-medium">
                                      Prazo: {new Date(deliverable.dueDate).toLocaleDateString('pt-BR')}
                                    </span>
                                  </div>
                                  {!isOverdue && deliverable.status !== 'approved' && deliverable.status !== 'delivered' && (
                                    <Badge variant="outline" className="text-xs">
                                      {daysUntilDue === 0 ? 'Vence hoje' : 
                                       daysUntilDue === 1 ? 'Vence amanhã' :
                                       daysUntilDue > 0 ? `${daysUntilDue} dias restantes` : ''}
                                    </Badge>
                                  )}
                                  {isOverdue && (
                                    <Badge variant="destructive" className="text-xs">
                                      {Math.abs(daysUntilDue)} {Math.abs(daysUntilDue) === 1 ? 'dia' : 'dias'} de atraso
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Status Badge */}
                            <Badge 
                              className={`text-sm px-3 py-1 font-bold border-0 ${config.badgeClass}`}
                            >
                              {config.label}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Projeto</DialogTitle>
            <DialogDescription>
              Atualize as informações básicas do projeto
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Projeto</Label>
              <Input
                id="name"
                value={editedProject.name || ''}
                onChange={(e) => setEditedProject({ ...editedProject, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={editedProject.description || ''}
                onChange={(e) => setEditedProject({ ...editedProject, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data de Início</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={editedProject.startDate ? new Date(editedProject.startDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditedProject({ ...editedProject, startDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Data de Término</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={editedProject.endDate ? new Date(editedProject.endDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditedProject({ ...editedProject, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Projeto</Label>
              <Select
                value={editedProject.type || project.type}
                onValueChange={(value) => setEditedProject({ ...editedProject, type: value as ProjectType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ProjectType.NOC}>NOC</SelectItem>
                  <SelectItem value={ProjectType.SERVICE_DESK}>Service Desk</SelectItem>
                  <SelectItem value={ProjectType.INFRASTRUCTURE}>Infraestrutura</SelectItem>
                  <SelectItem value={ProjectType.CLOUD_MIGRATION}>Migração Cloud</SelectItem>
                  <SelectItem value={ProjectType.SECURITY}>Segurança</SelectItem>
                  <SelectItem value={ProjectType.CUSTOM}>Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientId">Cliente</Label>
              <Input
                id="clientId"
                value={editedProject.clientId || ''}
                onChange={(e) => setEditedProject({ ...editedProject, clientId: e.target.value })}
                placeholder="ID ou nome do cliente"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      </div> {/* Fecha max-w-7xl */}

      <PhaseManagementModal
        phases={project.timeline.phases}
        onUpdate={(phases) => onUpdate({ timeline: { ...project.timeline, phases } })}
        isOpen={isPhaseManagementOpen}
        onClose={() => setIsPhaseManagementOpen(false)}
      />
    </div>
  );
}
