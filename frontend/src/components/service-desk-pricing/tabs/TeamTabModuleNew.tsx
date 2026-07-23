'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, Trash2, Edit, Users, DollarSign, Clock, 
  AlertCircle, Briefcase, Zap, TrendingUp, Save
} from 'lucide-react';
import { FormSection, MetricCard, EnhancedInput } from '../shared';
import { JobPositionsManager, JobPosition } from '../positions/JobPositionsManager';
import { useJobPositions } from '@/hooks/use-job-positions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export interface TeamMemberNew {
  id: string;
  jobPositionId: string;
  quantity: number;
  workingHours: 8 | 6;
  isActive: boolean;
  notes?: string;
}

export interface TeamTabModuleNewProps {
  data: TeamMemberNew[];
  onUpdate: (team: TeamMemberNew[]) => void;
  fullData?: any;
  onUpdateSchedule?: (schedules: any[]) => void;
  isLoading?: boolean;
  validation?: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    completionPercentage: number;
  };
}

const normalizeText = (value?: string) => (value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

const isLeaderPosition = (position?: JobPosition) => {
  const level = normalizeText(position?.level);
  const name = normalizeText(position?.name);
  return position?.id === 'pos-4' || level.includes('lider') || name.includes('lider') || name.includes('supervisor');
};

const isCoordinatorPosition = (position?: JobPosition) => {
  const level = normalizeText(position?.level);
  const name = normalizeText(position?.name);
  if (isLeaderPosition(position)) return false;
  return position?.id === 'pos-5' || name.includes('coordenador') || name.includes('gerente') || level.includes('gestao');
};

export function TeamTabModuleNew({ 
  data: teamProp, 
  onUpdate, 
  validation 
}: TeamTabModuleNewProps) {
  const team = teamProp || [];
  
  const [activeTab, setActiveTab] = useState('team');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMemberNew | null>(null);
  const { jobPositions } = useJobPositions();
  const [hasChanges, setHasChanges] = useState(false);
  const [requiredQuantities, setRequiredQuantities] = useState({
    n1: 0,
    n2: 0,
    n3: 0,
    folguistas: 0,
    total: 0
  });
  
  const [memberForm, setMemberForm] = useState({
    jobPositionId: '',
    quantity: 1,
    workingHours: 8 as 8 | 6,
    notes: ''
  });

  // Listen for schedule generation to get required quantities
  useEffect(() => {
    const handleScheduleGenerated = (event: any) => {
      const { dimensioning } = event.detail;
      
      setRequiredQuantities({
        n1: dimensioning.n1,
        n2: dimensioning.n2,
        n3: dimensioning.n3,
        folguistas: dimensioning.folguistas,
        total: dimensioning.total
      });
    };

    window.addEventListener('scheduleGenerated', handleScheduleGenerated);
    return () => window.removeEventListener('scheduleGenerated', handleScheduleGenerated);
  }, []);

  // Calculate team metrics
  const teamMetrics = useMemo(() => {
    let totalMembers = 0;
    let monthlyCost = 0;
    let n1Count = 0;
    let n2Count = 0;

    team.forEach(member => {
      const position = jobPositions.find(p => p.id === member.jobPositionId);
      if (position) {
        totalMembers += member.quantity;
        const salary = member.workingHours === 8 ? position.salary8h : (position.salary6h || position.salary8h * 0.75);
        monthlyCost += salary * member.quantity;
        
        if (position.level === 'N1') n1Count += member.quantity;
        if (position.level === 'N2') n2Count += member.quantity;
      }
    });

    return {
      totalMembers,
      monthlyCost,
      annualCost: monthlyCost * 12,
      costPerMember: totalMembers > 0 ? monthlyCost / totalMembers : 0,
      n1Count,
      n2Count,
      n3Count: totalMembers - n1Count - n2Count
    };
  }, [team, jobPositions]);

  const handleAddMember = () => {
    setIsAddingMember(true);
    setEditingMember(null);
    setMemberForm({
      jobPositionId: '',
      quantity: 1,
      workingHours: 8,
      notes: ''
    });
  };

  const handleEditMember = (member: TeamMemberNew) => {
    setEditingMember(member);
    setIsAddingMember(true);
    setMemberForm({
      jobPositionId: member.jobPositionId,
      quantity: member.quantity,
      workingHours: member.workingHours,
      notes: member.notes || ''
    });
  };

  const handleSaveMember = () => {
    if (!memberForm.jobPositionId) return;

    const newMember: TeamMemberNew = {
      id: editingMember?.id || `member-${Date.now()}`,
      jobPositionId: memberForm.jobPositionId,
      quantity: memberForm.quantity,
      workingHours: memberForm.workingHours,
      isActive: true,
      notes: memberForm.notes
    };

    let updatedTeam: TeamMemberNew[];
    if (editingMember) {
      updatedTeam = team.map(m => m.id === editingMember.id ? newMember : m);
    } else {
      updatedTeam = [...team, newMember];
    }

    onUpdate(updatedTeam);
    setIsAddingMember(false);
    setEditingMember(null);
    setHasChanges(true);
  };

  const handleDeleteMember = (memberId: string) => {
    const updatedTeam = team.filter(m => m.id !== memberId);
    onUpdate(updatedTeam);
    setHasChanges(true);
  };

  const handleAddTemplate = (template: 'n1' | 'n2' | 'full') => {
    let newMembers: TeamMemberNew[] = [];
    
    // Use required quantities if available, otherwise use defaults
    const n1Qty = requiredQuantities.n1 > 0 ? requiredQuantities.n1 : 4;
    const n2Qty = requiredQuantities.n2 > 0 ? requiredQuantities.n2 : 2;
    const n3Qty = requiredQuantities.n3 > 0 ? requiredQuantities.n3 : 1;
    const folguistasQty = requiredQuantities.folguistas > 0 ? requiredQuantities.folguistas : 2;
    const totalOperationalAgents = n1Qty + n2Qty + n3Qty + folguistasQty;
    const leaderPosition = jobPositions.find(isLeaderPosition) || jobPositions.find(position => position.id === 'pos-4');
    const coordinatorPosition = jobPositions.find(isCoordinatorPosition) || jobPositions.find(position => position.id === 'pos-5');
    
    switch (template) {
      case 'n1':
        newMembers = [{
          id: `member-${Date.now()}`,
          jobPositionId: 'pos-1',
          quantity: n1Qty,
          workingHours: 8,
          isActive: true,
          notes: `Equipe N1 - ${n1Qty} agentes conforme dimensionamento`
        }];
        break;
      case 'n2':
        newMembers = [{
          id: `member-${Date.now()}`,
          jobPositionId: 'pos-2',
          quantity: n2Qty,
          workingHours: 8,
          isActive: true,
          notes: `Equipe N2 - ${n2Qty} agentes conforme dimensionamento`
        }];
        break;
      case 'full':
        newMembers = [
          {
            id: `member-${Date.now()}-1`,
            jobPositionId: 'pos-1',
            quantity: n1Qty,
            workingHours: 8,
            isActive: true,
            notes: `Equipe N1 - ${n1Qty} agentes`
          },
          {
            id: `member-${Date.now()}-2`,
            jobPositionId: 'pos-2',
            quantity: n2Qty,
            workingHours: 8,
            isActive: true,
            notes: `Equipe N2 - ${n2Qty} agentes`
          }
        ];
        
        // Add N3 if required
        if (n3Qty > 0) {
          newMembers.push({
            id: `member-${Date.now()}-3`,
            jobPositionId: 'pos-3',
            quantity: n3Qty,
            workingHours: 8,
            isActive: true,
            notes: `Equipe N3 - ${n3Qty} agentes`
          });
        }
        
        // Add folguistas if required
        if (folguistasQty > 0) {
          newMembers.push({
            id: `member-${Date.now()}-4`,
            jobPositionId: 'pos-1', // Folguistas are usually N1 level
            quantity: folguistasQty,
            workingHours: 8,
            isActive: true,
            notes: `Folguistas - ${folguistasQty} agentes para cobertura de folgas`
          });
        }
        
        if (totalOperationalAgents >= 8 && leaderPosition) {
          newMembers.push({
            id: `member-${Date.now()}-5`,
            jobPositionId: leaderPosition.id,
            quantity: 1,
            workingHours: 8,
            isActive: true,
            notes: 'Líder técnico adicionado automaticamente para equipe de grande porte'
          });
        }

        if (totalOperationalAgents >= 15 && coordinatorPosition) {
          newMembers.push({
            id: `member-${Date.now()}-6`,
            jobPositionId: coordinatorPosition.id,
            quantity: 1,
            workingHours: 8,
            isActive: true,
            notes: 'Coordenador adicionado automaticamente para equipe de grande porte'
          });
        }
        break;
    }

    onUpdate([...team, ...newMembers]);
    setHasChanges(true);
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Equipe</h2>
          <p className="text-muted-foreground mt-1">
            Configure a equipe de atendimento e seus cargos
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <Badge variant="secondary" className="animate-pulse">
              <Clock className="h-3 w-3 mr-1" />
              Alterações pendentes
            </Badge>
          )}
          {validation && (
            <Badge variant={validation.isValid ? 'default' : 'destructive'}>
              {validation.completionPercentage}% completo
            </Badge>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total de Membros"
          value={teamMetrics.totalMembers}
          icon={<Users className="h-5 w-5" />}
          variant="primary"
          subtitle={`N1: ${teamMetrics.n1Count} | N2: ${teamMetrics.n2Count}`}
          tooltip="Número total de pessoas na equipe"
        />
        <MetricCard
          title="Custo Mensal"
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(teamMetrics.monthlyCost)}
          icon={<DollarSign className="h-5 w-5" />}
          variant="success"
          tooltip="Custo total mensal da equipe"
        />
        <MetricCard
          title="Custo Anual"
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(teamMetrics.annualCost)}
          icon={<TrendingUp className="h-5 w-5" />}
          variant="default"
          tooltip="Projeção de custo anual"
        />
        <MetricCard
          title="Custo por Membro"
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(teamMetrics.costPerMember)}
          icon={<Briefcase className="h-5 w-5" />}
          variant="warning"
          tooltip="Custo médio por membro da equipe"
        />
      </div>

      {/* Required Quantities from Schedule */}
      {requiredQuantities.total > 0 && (
        <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-900 dark:text-blue-100">
            <div className="font-semibold mb-2">Dimensionamento da Escala Gerada:</div>
            <div className="grid grid-cols-5 gap-4 text-sm">
              <div>
                <div className="font-bold text-lg">{requiredQuantities.n1}</div>
                <div className="text-xs">Agentes N1</div>
              </div>
              <div>
                <div className="font-bold text-lg">{requiredQuantities.n2}</div>
                <div className="text-xs">Agentes N2</div>
              </div>
              <div>
                <div className="font-bold text-lg">{requiredQuantities.n3}</div>
                <div className="text-xs">Agentes N3</div>
              </div>
              <div>
                <div className="font-bold text-lg">{requiredQuantities.folguistas}</div>
                <div className="text-xs">Folguistas</div>
              </div>
              <div>
                <div className="font-bold text-lg text-blue-600 dark:text-blue-400">{requiredQuantities.total}</div>
                <div className="text-xs">Total Necessário</div>
              </div>
            </div>
            <div className="mt-2 text-xs">
              Use os templates rápidos abaixo para preencher automaticamente com base neste dimensionamento.
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="team">
            <Users className="h-4 w-4 mr-2" />
            Equipe
          </TabsTrigger>
          <TabsTrigger value="positions">
            <Briefcase className="h-4 w-4 mr-2" />
            Cargos
          </TabsTrigger>
        </TabsList>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-6">
          {/* Quick Actions */}
          <FormSection
            title="Ações Rápidas"
            description="Adicione equipes pré-configuradas"
            icon={<Zap className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />}
            variant="warning"
            collapsible
            defaultExpanded={team.length === 0}
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Button
                variant="outline"
                onClick={() => handleAddTemplate('n1')}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Equipe N1 ({requiredQuantities.n1 > 0 ? requiredQuantities.n1 : 4} pessoas)
              </Button>
              <Button
                variant="outline"
                onClick={() => handleAddTemplate('n2')}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Equipe N2 ({requiredQuantities.n2 > 0 ? requiredQuantities.n2 : 2} pessoas)
              </Button>
              <Button
                variant="outline"
                onClick={() => handleAddTemplate('full')}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Equipe Completa {requiredQuantities.total > 0 ? `(${requiredQuantities.total} pessoas)` : ''}
              </Button>
              <Button
                onClick={handleAddMember}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Cargo Customizado
              </Button>
            </div>
          </FormSection>

          {/* Team Table */}
          <FormSection
            title="Membros da Equipe"
            description={`${team.length} ${team.length === 1 ? 'cargo configurado' : 'cargos configurados'}`}
            icon={<Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
            variant="primary"
          >
            {team.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Nenhum membro adicionado ainda. Use as ações rápidas acima ou adicione um cargo customizado.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cargo</TableHead>
                      <TableHead className="text-center">Quantidade</TableHead>
                      <TableHead className="text-center">Jornada</TableHead>
                      <TableHead className="text-right">Salário Unit.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {team.map((member) => {
                      const position = jobPositions.find(p => p.id === member.jobPositionId);
                      if (!position) return null;
                      
                      const salary = member.workingHours === 8 ? position.salary8h : (position.salary6h || position.salary8h * 0.75);
                      const total = salary * member.quantity;

                      return (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium">
                            <div>
                              <div>{position.name}</div>
                              <div className="text-xs text-muted-foreground">{position.level}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{member.quantity}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">{member.workingHours}h</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(salary)}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditMember(member)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteMember(member.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </FormSection>
        </TabsContent>

        {/* Positions Tab */}
        <TabsContent value="positions">
          <JobPositionsManager />
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddingMember} onOpenChange={setIsAddingMember}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMember ? 'Editar Membro' : 'Adicionar Membro'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Cargo *</label>
              <Select
                value={memberForm.jobPositionId}
                onValueChange={(value) => setMemberForm({ ...memberForm, jobPositionId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cargo" />
                </SelectTrigger>
                <SelectContent>
                  {jobPositions.filter(p => p.isActive).map((position) => (
                    <SelectItem key={position.id} value={position.id}>
                      {position.name} - {position.level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <EnhancedInput
              label="Quantidade"
              type="number"
              min="1"
              value={memberForm.quantity}
              onChange={(e) => setMemberForm({ ...memberForm, quantity: parseInt(e.target.value) || 1 })}
              required
              tooltip="Número de pessoas neste cargo"
            />

            <div className="space-y-2">
              <label className="text-sm font-medium">Jornada de Trabalho *</label>
              <Select
                value={memberForm.workingHours.toString()}
                onValueChange={(value) => setMemberForm({ ...memberForm, workingHours: parseInt(value) as 8 | 6 })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="8">8 horas/dia</SelectItem>
                  <SelectItem value="6">6 horas/dia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Observações</label>
              <Textarea
                value={memberForm.notes}
                onChange={(e) => setMemberForm({ ...memberForm, notes: e.target.value })}
                placeholder="Observações sobre este cargo..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingMember(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveMember} disabled={!memberForm.jobPositionId}>
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
