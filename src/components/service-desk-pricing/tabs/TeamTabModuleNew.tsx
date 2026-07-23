'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Users, 
  DollarSign, 
  Clock, 
  AlertCircle, 
  CheckCircle2,
  Briefcase,
  Settings,
  Calculator,
  Save,
  X
} from 'lucide-react';
import { JobPositionsManager } from '../positions/JobPositionsManager';
import { useJobPositions } from '@/hooks/use-job-positions';
import { CoverageType } from '@/lib/types/service-desk-pricing';
import { calculateServiceDeskDimensioning } from '@/lib/services/service-desk-dimensioning';

export interface JobPosition {
  id: string;
  name: string;
  level?: string;
  salary8h: number;
  salary6h?: number;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMemberNew {
  id: string;
  jobPositionId: string;
  quantity: number; // Number of people in this position
  workingHours: 8 | 6; // 8 or 6 hours
  isActive: boolean;
  notes?: string;
  role?: string;
  salary?: number;
  workload?: number;
  // Legacy fields for backward compatibility
  name?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface TeamTabModuleNewProps {
  data: TeamMemberNew[]; // Team data from the system
  onUpdate: (team: TeamMemberNew[]) => void;
  fullData?: any; // Full ServiceDeskData for dimensioning
  onUpdateSchedule?: (schedules: any[]) => void; // Callback to update schedules
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

const isOperationalPosition = (position?: JobPosition) => {
  const level = normalizeText(position?.level);
  return ['n1', 'n2', 'n3'].includes(level);
};

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
  fullData,
  onUpdateSchedule,
  isLoading = false,
  validation 
}: TeamTabModuleNewProps) {
  // Ensure team is always an array
  const team = teamProp || [];
  
  const [activeTab, setActiveTab] = useState('team');
  const [selectedPosition, setSelectedPosition] = useState<JobPosition | null>(null);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMemberNew | null>(null);
  
  const [memberForm, setMemberForm] = useState({
    jobPositionId: '',
    quantity: 1,
    workingHours: 8 as 8 | 6,
    notes: ''
  });

  const {
    jobPositions,
    isLoading: isLoadingPositions,
    error: positionsError
  } = useJobPositions();

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

  const enrichTeamMembers = useCallback((members: TeamMemberNew[]): TeamMemberNew[] => {
    return members.map(member => {
      const position = jobPositions.find(p => p.id === member.jobPositionId);
      const calculatedSalary = member.salary && member.salary > 0
        ? member.salary
        : (member.workingHours === 8
          ? (position?.salary8h || 0)
          : (position?.salary6h || position?.salary8h || 0));

      return {
        ...member,
        role: member.role || position?.name || member.jobPositionId,
        salary: calculatedSalary,
        workload: typeof member.workload === 'number'
          ? member.workload
          : (member.workingHours === 6 ? 30 : 40)
      };
    });
  }, [jobPositions]);

  const handleEditMember = (member: TeamMemberNew) => {
    setEditingMember(member);
    setIsAddingMember(false);
    setMemberForm({
      jobPositionId: member.jobPositionId,
      quantity: member.quantity,
      workingHours: member.workingHours,
      notes: member.notes || ''
    });
  };

  const handleSaveMember = () => {
    if (!memberForm.jobPositionId || memberForm.quantity < 1) {
      return;
    }

    const memberData: TeamMemberNew = {
      id: editingMember?.id || `member-${Date.now()}`,
      jobPositionId: memberForm.jobPositionId,
      quantity: memberForm.quantity,
      workingHours: memberForm.workingHours,
      isActive: true,
      notes: memberForm.notes || undefined
    };

    if (editingMember) {
      // Update existing member
      const updatedTeam = team.map(member => 
        member.id === editingMember.id ? memberData : member
      );
      onUpdate(enrichTeamMembers(updatedTeam));
    } else {
      // Add new member
      onUpdate(enrichTeamMembers([...team, memberData]));
    }

    // Reset form
    setIsAddingMember(false);
    setEditingMember(null);
    setMemberForm({
      jobPositionId: '',
      quantity: 1,
      workingHours: 8,
      notes: ''
    });
  };

  const handleDeleteMember = (memberId: string) => {
    if (confirm('Tem certeza que deseja remover este membro da equipe?')) {
      const updatedTeam = team.filter(member => member.id !== memberId);
      onUpdate(enrichTeamMembers(updatedTeam));
    }
  };

  const handleCancel = () => {
    setIsAddingMember(false);
    setEditingMember(null);
    setMemberForm({
      jobPositionId: '',
      quantity: 1,
      workingHours: 8,
      notes: ''
    });
  };

  // Função para gerar escala básica automaticamente
  const generateBasicSchedule = useCallback((teamMembers: TeamMemberNew[], fullData: any) => {
    if (!fullData?.project?.dimensioning) return;

    const coverageType = fullData.project.dimensioning.coverageType;
    const schedules = [];

    // Criar escala baseada no tipo de cobertura
    if (coverageType === 'BUSINESS_HOURS' || coverageType === '8x5') {
      // Escala 8x5 (Segunda a Sexta, 8h às 18h)
      const operationalTeamMembers = teamMembers.filter(member => {
        const position = jobPositions.find(p => p.id === member.jobPositionId);
        return isOperationalPosition(position);
      });
      const totalMembers = operationalTeamMembers.reduce((sum, member) => sum + member.quantity, 0);
      schedules.push({
        id: `schedule-${Date.now()}`,
        name: 'Horário Comercial',
        shifts: [
          {
            id: `shift-${Date.now()}-1`,
            name: 'Turno Comercial',
            startTime: '08:00',
            endTime: '18:00',
            daysOfWeek: [1, 2, 3, 4, 5], // Segunda a Sexta
            teamMembers: operationalTeamMembers.flatMap(member => {
              const entries = [];
              for (let i = 0; i < member.quantity; i++) {
                entries.push(`${member.id}-${i}`);
              }
              return entries;
            }),
            isSpecialShift: false,
            multiplier: 1.0
          }
        ],
        coverage: {
          minimumStaff: Math.max(1, Math.floor(totalMembers * 0.6)),
          preferredStaff: totalMembers,
          skillRequirements: [],
          availabilityHours: [
            {
              startTime: '08:00',
              endTime: '18:00',
              daysOfWeek: [1, 2, 3, 4, 5],
              priority: 'high'
            }
          ]
        },
        specialRates: []
      });
    } else if (coverageType === 'EXTENDED_HOURS' || coverageType === '12x5') {
      // Escala 12x5 (Segunda a Sexta, 6h às 18h)
      const operationalTeamMembers = teamMembers.filter(member => {
        const position = jobPositions.find(p => p.id === member.jobPositionId);
        return isOperationalPosition(position);
      });
      const totalMembers = operationalTeamMembers.reduce((sum, member) => sum + member.quantity, 0);
      schedules.push({
        id: `schedule-${Date.now()}`,
        name: 'Horário Estendido',
        shifts: [
          {
            id: `shift-${Date.now()}-1`,
            name: 'Turno Manhã',
            startTime: '06:00',
            endTime: '14:00',
            daysOfWeek: [1, 2, 3, 4, 5],
            teamMembers: operationalTeamMembers.filter(member => {
              const pos = jobPositions.find(p => p.id === member.jobPositionId);
              return pos?.level === 'N1';
            }).flatMap(member => {
              const entries = [];
              const halfQuantity = Math.ceil(member.quantity / 2);
              for (let i = 0; i < halfQuantity; i++) {
                entries.push(`${member.id}-${i}`);
              }
              return entries;
            }),
            isSpecialShift: false,
            multiplier: 1.0
          },
          {
            id: `shift-${Date.now()}-2`,
            name: 'Turno Tarde',
            startTime: '10:00',
            endTime: '18:00',
            daysOfWeek: [1, 2, 3, 4, 5],
            teamMembers: operationalTeamMembers.flatMap(member => {
              const pos = jobPositions.find(p => p.id === member.jobPositionId);
              if (pos?.level === 'N1') {
                const entries = [];
                const halfQuantity = Math.floor(member.quantity / 2);
                for (let i = Math.ceil(member.quantity / 2); i < member.quantity; i++) {
                  entries.push(`${member.id}-${i}`);
                }
                return entries;
              } else if (pos?.level === 'N2') {
                // N2 trabalha no turno da tarde
                const entries = [];
                for (let i = 0; i < member.quantity; i++) {
                  entries.push(`${member.id}-${i}`);
                }
                return entries;
              }
              return [];
            }),
            isSpecialShift: false,
            multiplier: 1.0
          }
        ],
        coverage: {
          minimumStaff: Math.max(1, Math.floor(totalMembers * 0.5)),
          preferredStaff: Math.ceil(totalMembers * 0.8),
          skillRequirements: [],
          availabilityHours: [
            {
              startTime: '06:00',
              endTime: '18:00',
              daysOfWeek: [1, 2, 3, 4, 5],
              priority: 'high'
            }
          ]
        },
        specialRates: []
      });
    } else if (coverageType === 'FULL_TIME' || coverageType === '24x7') {
      // Escala 24x7 com 3 turnos
      const operationalTeamMembers = teamMembers.filter(member => {
        const position = jobPositions.find(p => p.id === member.jobPositionId);
        return isOperationalPosition(position);
      });
      const totalMembers = operationalTeamMembers.reduce((sum, member) => sum + member.quantity, 0);
      schedules.push({
        id: `schedule-${Date.now()}`,
        name: 'Atendimento 24x7',
        shifts: [
          {
            id: `shift-${Date.now()}-1`,
            name: 'Turno Manhã (6h-14h)',
            startTime: '06:00',
            endTime: '14:00',
            daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Todos os dias
            teamMembers: operationalTeamMembers.flatMap(member => {
              const entries = [];
              const thirdQuantity = Math.ceil(member.quantity / 3);
              for (let i = 0; i < thirdQuantity; i++) {
                entries.push(`${member.id}-${i}`);
              }
              return entries;
            }),
            isSpecialShift: false,
            multiplier: 1.0
          },
          {
            id: `shift-${Date.now()}-2`,
            name: 'Turno Tarde (14h-22h)',
            startTime: '14:00',
            endTime: '22:00',
            daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
            teamMembers: operationalTeamMembers.flatMap(member => {
              const entries = [];
              const thirdQuantity = Math.ceil(member.quantity / 3);
              const startIndex = Math.ceil(member.quantity / 3);
              for (let i = startIndex; i < startIndex + thirdQuantity && i < member.quantity; i++) {
                entries.push(`${member.id}-${i}`);
              }
              return entries;
            }),
            isSpecialShift: false,
            multiplier: 1.2
          },
          {
            id: `shift-${Date.now()}-3`,
            name: 'Turno Noite (22h-6h)',
            startTime: '22:00',
            endTime: '06:00',
            daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
            teamMembers: operationalTeamMembers.flatMap(member => {
              const entries = [];
              const thirdQuantity = Math.ceil(member.quantity / 3);
              const startIndex = Math.ceil(member.quantity / 3) * 2;
              for (let i = startIndex; i < member.quantity; i++) {
                entries.push(`${member.id}-${i}`);
              }
              return entries;
            }),
            isSpecialShift: true,
            multiplier: 1.5
          }
        ],
        coverage: {
          minimumStaff: Math.max(1, Math.floor(totalMembers * 0.3)),
          preferredStaff: Math.ceil(totalMembers * 0.6),
          skillRequirements: [],
          availabilityHours: [
            {
              startTime: '00:00',
              endTime: '23:59',
              daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
              priority: 'critical'
            }
          ]
        },
        specialRates: [
          {
            name: 'Adicional Noturno',
            condition: 'night',
            multiplier: 1.5,
            applicableShifts: [`shift-${Date.now()}-3`]
          }
        ]
      });
    }

    // Atualizar os dados do sistema com a nova escala
    if (schedules.length > 0) {
      console.log('Escala gerada:', schedules);
      
      // Usar callback se disponível, senão usar localStorage como fallback
      if (onUpdateSchedule) {
        onUpdateSchedule(schedules);
      } else {
        // Fallback: salvar no localStorage para que o ScaleTab possa pegar
        localStorage.setItem('generatedSchedule', JSON.stringify(schedules));
      }
    }
  }, [jobPositions, onUpdateSchedule]);

  // Função para dimensionar equipe automaticamente baseado nos dados
  const handleDimensionTeam = useCallback(() => {
    if (!fullData?.project?.dimensioning || !fullData?.project?.generalInfo) {
      alert('Dados de dimensionamento não encontrados. Preencha a aba DADOS primeiro.');
      return;
    }

    const erlangResult = calculateServiceDeskDimensioning({
      userQuantity: fullData.project.generalInfo?.userQuantity || 100,
      incidentsPerUser: fullData.project.dimensioning?.incidentsPerUser || 1.5,
      tmaMinutes: fullData.project.dimensioning?.tmaMinutes || 10,
      occupancyRate: fullData.project.dimensioning?.occupancyRate || 80,
      n1Distribution: fullData.project.dimensioning?.n1Distribution || 80,
      n1SixHourShift: fullData.project.dimensioning?.n1SixHourShift || false,
      coverageType: fullData.project.dimensioning?.coverageType || CoverageType.BUSINESS_HOURS,
      n1Capacity: fullData.project.dimensioning?.n1Capacity || 100,
      n1Capacity6h: fullData.project.dimensioning?.n1Capacity6h || Math.round((fullData.project.dimensioning?.n1Capacity || 100) * 0.75),
      n2Capacity: fullData.project.dimensioning?.n2Capacity || 75
    });

    // Encontrar IDs dos cargos N1 e N2
    const n1Position = jobPositions.find(p => p.level === 'N1');
    const n2Position = jobPositions.find(p => p.level === 'N2');

    if (!n1Position || !n2Position) {
      alert('Cargos N1 e N2 não encontrados. Verifique se os cargos estão cadastrados.');
      return;
    }

    // Criar nova equipe dimensionada
    const dimensionedTeam: TeamMemberNew[] = [];

    // Adicionar N1
    if (erlangResult.n1Agents > 0) {
      dimensionedTeam.push({
        id: `n1-${Date.now()}`,
        jobPositionId: n1Position.id,
        quantity: erlangResult.n1Agents,
        workingHours: fullData.project.dimensioning?.n1SixHourShift ? 6 : 8,
        isActive: true,
        notes: erlangResult.folguistas > 0
          ? `Dimensionado automaticamente, incluindo ${erlangResult.folguistas} folguistas`
          : 'Dimensionado automaticamente'
      });
    }

    // Adicionar N2
    if (erlangResult.n2Agents > 0) {
      dimensionedTeam.push({
        id: `n2-${Date.now()}`,
        jobPositionId: n2Position.id,
        quantity: erlangResult.n2Agents,
        workingHours: 8, // N2 sempre 8h
        isActive: true,
        notes: 'Dimensionado automaticamente'
      });
    }

    // Verificar se líder/coordenador já existem na equipe
    const leaderPosition = jobPositions.find(isLeaderPosition) || jobPositions.find(position => position.id === 'pos-4');
    const coordinatorPosition = jobPositions.find(isCoordinatorPosition) || jobPositions.find(position => position.id === 'pos-5');

    const otherPositions = team.filter(member => {
      const position = jobPositions.find(p => p.id === member.jobPositionId);
      return position && !['N1', 'N2'].includes(position.level || '');
    });

    // Adicionar líder automaticamente para equipes grandes
    const totalAgents = erlangResult.n1Agents + erlangResult.n2Agents;
    const hasLeader = otherPositions.some(m => {
      const p = jobPositions.find(j => j.id === m.jobPositionId);
      return isLeaderPosition(p);
    });
    const hasCoordinator = otherPositions.some(m => {
      const p = jobPositions.find(j => j.id === m.jobPositionId);
      return isCoordinatorPosition(p);
    });

    if ((erlangResult.suggestedLeader || totalAgents >= 8) && leaderPosition && !hasLeader) {
      dimensionedTeam.push({
        id: `leader-${Date.now()}`,
        jobPositionId: leaderPosition.id,
        quantity: 1,
        workingHours: 8,
        isActive: true,
        notes: 'Líder técnico adicionado automaticamente para equipe de grande porte'
      });
    }
    if ((erlangResult.suggestedCoordinator || totalAgents >= 15) && coordinatorPosition && !hasCoordinator) {
      dimensionedTeam.push({
        id: `coord-${Date.now() + 1}`,
        jobPositionId: coordinatorPosition.id,
        quantity: 1,
        workingHours: 8,
        isActive: true,
        notes: 'Coordenador adicionado automaticamente para equipe de grande porte'
      });
    }

    const finalTeam = [...dimensionedTeam, ...otherPositions];
    onUpdate(enrichTeamMembers(finalTeam));

    // Gerar escala básica automaticamente
    generateBasicSchedule(finalTeam, fullData);

    alert(`Equipe dimensionada com sucesso!\\n\\nN1: ${erlangResult.n1Agents} pessoas\\nN2: ${erlangResult.n2Agents} pessoas\\nLíderes: ${erlangResult.suggestedLeader || 0}\\nCoordenadores: ${erlangResult.suggestedCoordinator || 0}\\nFolguistas: ${erlangResult.folguistas}\\n\\nEscala básica gerada automaticamente somente com cargos operacionais.\\n\\nBaseado em ${Math.round(erlangResult.totalCallsPerMonth)} chamados/mês`);
  }, [fullData, jobPositions, team, onUpdate, enrichTeamMembers]);

  // Calculate team costs
  const teamCosts = useMemo(() => {
    let totalCost = 0;
    let totalMembers = team.length;
    let costByPosition: Record<string, { count: number; cost: number }> = {};

    team.forEach(member => {
      const position = jobPositions.find(p => p.id === member.jobPositionId);
      if (position) {
        const salary = member.workingHours === 8 ? position.salary8h : (position.salary6h || position.salary8h);
        const memberTotalCost = salary * member.quantity;
        totalCost += memberTotalCost;

        if (!costByPosition[position.name]) {
          costByPosition[position.name] = { count: 0, cost: 0 };
        }
        costByPosition[position.name].count += member.quantity;
        costByPosition[position.name].cost += memberTotalCost;
      }
    });

    const actualTotalMembers = team.reduce((sum, member) => sum + member.quantity, 0);
    
    return {
      totalCost,
      totalMembers: actualTotalMembers,
      averageCost: actualTotalMembers > 0 ? totalCost / actualTotalMembers : 0,
      costByPosition
    };
  }, [team, jobPositions]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getPositionById = (id: string) => {
    return jobPositions.find(p => p.id === id);
  };

  const getLevelColor = (level?: string) => {
    switch (level) {
      case 'N1':
        return 'bg-blue-100 text-blue-800';
      case 'N2':
        return 'bg-green-100 text-green-800';
      case 'N3':
        return 'bg-purple-100 text-purple-800';
      case 'Liderança':
        return 'bg-orange-100 text-orange-800';
      case 'Gestão':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <span>Gestão de Equipe</span>
                  {validation && (
                    <Badge variant={validation.isValid ? 'default' : 'secondary'}>
                      {validation.completionPercentage}% completo
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure a equipe do projeto com base nos cargos e salários cadastrados
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="flex items-center space-x-1">
                <Users className="h-3 w-3" />
                <span>{team.length} membros</span>
              </Badge>
              <Badge variant="outline" className="flex items-center space-x-1">
                <DollarSign className="h-3 w-3" />
                <span>{formatCurrency(teamCosts.totalCost)}</span>
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Validation Status */}
      {validation && !validation.isValid && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">Problemas encontrados:</p>
              <ul className="list-disc list-inside space-y-1">
                {validation.errors.map((error: any, index: number) => (
                  <li key={index} className="text-sm">{error.message || error}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="team" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Equipe</span>
            {team.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {team.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="positions" className="flex items-center space-x-2">
            <Briefcase className="h-4 w-4" />
            <span>Cargos</span>
          </TabsTrigger>
          <TabsTrigger value="costs" className="flex items-center space-x-2">
            <Calculator className="h-4 w-4" />
            <span>Custos</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="space-y-6">
          {/* Add/Edit Member Form */}
          {(isAddingMember || editingMember) && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingMember ? 'Editar Cargo' : 'Adicionar Cargo'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="job-position">Cargo *</Label>
                    <Select
                      value={memberForm.jobPositionId}
                      onValueChange={(value) => setMemberForm(prev => ({ ...prev, jobPositionId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cargo" />
                      </SelectTrigger>
                      <SelectContent>
                        {jobPositions.map((position) => (
                          <SelectItem key={position.id} value={position.id}>
                            <div className="flex items-center space-x-2">
                              <span>{position.name}</span>
                              {position.level && (
                                <Badge className={getLevelColor(position.level)} variant="secondary">
                                  {position.level}
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantidade *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={memberForm.quantity}
                      onChange={(e) => setMemberForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                      placeholder="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="working-hours">Carga Horária</Label>
                    <Select
                      value={memberForm.workingHours.toString()}
                      onValueChange={(value) => setMemberForm(prev => ({ 
                        ...prev, 
                        workingHours: parseInt(value) as 8 | 6 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="8">8 horas</SelectItem>
                        <SelectItem value="6">6 horas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Input
                    id="notes"
                    value={memberForm.notes}
                    onChange={(e) => setMemberForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Observações adicionais"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Button onClick={handleSaveMember} className="flex items-center space-x-2">
                    <Save className="h-4 w-4" />
                    <span>Salvar</span>
                  </Button>
                  <Button variant="outline" onClick={handleCancel} className="flex items-center space-x-2">
                    <X className="h-4 w-4" />
                    <span>Cancelar</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dimensioning Info */}
          {fullData?.project?.dimensioning && fullData?.project?.generalInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calculator className="h-5 w-5" />
                  <span>Informações de Dimensionamento</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Usuários</p>
                    <p className="text-muted-foreground">{fullData.project.generalInfo.userQuantity || 0}</p>
                  </div>
                  <div>
                    <p className="font-medium">Chamados/mês</p>
                    <p className="text-muted-foreground">
                      {Math.round((fullData.project.generalInfo.userQuantity || 0) * (fullData.project.dimensioning.incidentsPerUser || 1.5))}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Distribuição N1</p>
                    <p className="text-muted-foreground">{fullData.project.dimensioning.n1Distribution || 80}%</p>
                  </div>
                  <div>
                    <p className="font-medium">Cobertura</p>
                    <p className="text-muted-foreground">
                      {fullData.project.dimensioning.coverageType === 'BUSINESS_HOURS' && '8x5'}
                      {fullData.project.dimensioning.coverageType === 'EXTENDED_HOURS' && '12x5'}
                      {fullData.project.dimensioning.coverageType === 'FULL_TIME' && '24x7'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Team Members List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Membros da Equipe</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button 
                    onClick={handleDimensionTeam}
                    variant="outline"
                    className="flex items-center space-x-2"
                    disabled={!fullData?.project?.dimensioning || !fullData?.project?.generalInfo}
                  >
                    <Calculator className="h-4 w-4" />
                    <span>Dimensionar Equipe</span>
                  </Button>
                  <Button onClick={handleAddMember} className="flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Adicionar Cargo</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {team.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum cargo na equipe</h3>
                  <p className="text-muted-foreground mb-4">
                    Use "Dimensionar Equipe" para calcular automaticamente ou adicione cargos manualmente
                  </p>
                  <div className="flex items-center justify-center space-x-2">
                    <Button 
                      onClick={handleDimensionTeam}
                      disabled={!fullData?.project?.dimensioning || !fullData?.project?.generalInfo}
                    >
                      <Calculator className="h-4 w-4 mr-2" />
                      Dimensionar Equipe
                    </Button>
                    <Button variant="outline" onClick={handleAddMember}>
                      Adicionar Cargo
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {team.map((member) => {
                    const position = getPositionById(member.jobPositionId);
                    const salary = position ? (
                      member.workingHours === 8 ? position.salary8h : (position.salary6h || position.salary8h)
                    ) : 0;

                    return (
                      <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold">{position?.name || 'Cargo não encontrado'}</h3>
                            <Badge variant="outline">
                              {member.quantity} {member.quantity === 1 ? 'pessoa' : 'pessoas'}
                            </Badge>
                            {position?.level && (
                              <Badge className={getLevelColor(position.level)}>
                                {position.level}
                              </Badge>
                            )}
                            <Badge variant="outline">
                              {member.workingHours}h
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                            <span className="flex items-center space-x-1">
                              <DollarSign className="h-4 w-4" />
                              <span>{formatCurrency(salary)} por pessoa</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <DollarSign className="h-4 w-4" />
                              <span className="font-semibold text-primary">{formatCurrency(salary * member.quantity)} total</span>
                            </span>
                          </div>
                          {member.notes && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Obs: {member.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditMember(member)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteMember(member.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="positions" className="space-y-6">
          {isLoadingPositions ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p>Carregando cargos...</p>
                </div>
              </CardContent>
            </Card>
          ) : positionsError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{positionsError}</AlertDescription>
            </Alert>
          ) : (
            <JobPositionsManager />
          )}
        </TabsContent>

        <TabsContent value="costs" className="space-y-6">
          {/* Cost Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo de Custos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{teamCosts.totalMembers}</div>
                  <div className="text-sm text-muted-foreground">Total de Membros</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(teamCosts.totalCost)}
                  </div>
                  <div className="text-sm text-muted-foreground">Custo Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(teamCosts.averageCost)}
                  </div>
                  <div className="text-sm text-muted-foreground">Custo Médio</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(teamCosts.totalCost * 12)}
                  </div>
                  <div className="text-sm text-muted-foreground">Custo Anual</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cost Breakdown by Position */}
          {Object.keys(teamCosts.costByPosition).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Custos por Cargo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(teamCosts.costByPosition).map(([positionName, data]) => (
                    <div key={positionName} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <h4 className="font-medium">{positionName}</h4>
                        <p className="text-sm text-muted-foreground">
                          {data.count} {data.count === 1 ? 'membro' : 'membros'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(data.cost)}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(data.cost / data.count)} por membro
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
