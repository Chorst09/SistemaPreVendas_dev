// @ts-nocheck
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { createId } from '@/lib/utils/id';
import { ProjectData, TabValidationStatus, ServiceType, RenewalOption, CoverageType } from '@/lib/types/service-desk-pricing';
import { calculateServiceDeskDimensioning } from '@/lib/services/service-desk-dimensioning';
import styles from './DataTabModule.module.css';
import { Checkbox } from '@/components/ui/checkbox';

export interface DataTabModuleProps {
  data: ProjectData;
  onUpdate: (data: ProjectData) => void;
  validation?: TabValidationStatus;
  isLoading?: boolean;
  onAutoSave?: (data: ProjectData) => void;
  onDimensionTeam?: (projectData: ProjectData, dimensionedTeam: any[], generatedSchedules?: any[]) => void;
}

export function DataTabModule({
  data,
  onUpdate,
  validation,
  isLoading = false,
  onAutoSave,
  onDimensionTeam
}: DataTabModuleProps) {
  const [localData, setLocalData] = useState<ProjectData>(data);
  const [hasChanges, setHasChanges] = useState(false);

  // Helpers de cálculo posicionados antes para evitar TDZ
  function calculateMonthlyCalls(userQuantity: number, incidentsPerUser: number): number {
    return Math.round(userQuantity * incidentsPerUser);
  }

  function calculateN1Agents(
    userQuantity: number,
    incidentsPerUser: number,
    n1Distribution: number,
    n1Capacity: number,
    n1SixHourShift: boolean
  ): number {
    const totalCalls = userQuantity * incidentsPerUser;
    const n1Calls = totalCalls * (n1Distribution / 100);
    const adjustedCapacity = n1SixHourShift ? n1Capacity * 0.75 : n1Capacity;
    const agents = Math.ceil(n1Calls / adjustedCapacity);
    return Math.max(1, agents);
  }

  function calculateN2Agents(
    userQuantity: number,
    incidentsPerUser: number,
    n1Distribution: number,
    n2Capacity: number
  ): number {
    const totalCalls = userQuantity * incidentsPerUser;
    const n2Calls = totalCalls * ((100 - n1Distribution) / 100);
    const agents = Math.ceil(n2Calls / n2Capacity);
    return Math.max(1, agents);
  }

  function getCoverageMultiplier(coverageType?: CoverageType | string): number {
    switch (coverageType) {
      case CoverageType.EXTENDED_HOURS:
      case 'EXTENDED_HOURS':
      case '12x5':
        return 1.5;
      case CoverageType.FULL_TIME:
      case 'FULL_TIME':
      case '24x7':
        return 4.2;
      case CoverageType.BUSINESS_HOURS:
      case 'BUSINESS_HOURS':
      case '8x5':
      default:
        return 1;
    }
  }

  function calculateFolguistas(baseAgents: number, coverageType?: CoverageType | string): number {
    const safeBase = Math.max(0, Math.ceil(baseAgents || 0));

    switch (coverageType) {
      case CoverageType.FULL_TIME:
      case 'FULL_TIME':
      case '24x7':
        return Math.max(1, Math.ceil(safeBase * 0.4));
      case CoverageType.EXTENDED_HOURS:
      case 'EXTENDED_HOURS':
      case '12x5':
        return Math.max(1, Math.ceil(safeBase * 0.2));
      case CoverageType.BUSINESS_HOURS:
      case 'BUSINESS_HOURS':
      case '8x5':
      default:
        return 0;
    }
  }

  // Auto-save functionality with debouncing
  useEffect(() => {
    if (hasChanges && onAutoSave) {
      const timeoutId = setTimeout(() => {
        onAutoSave(localData);
        setHasChanges(false);
      }, 2000); // 2 second delay

      return () => clearTimeout(timeoutId);
    }
  }, [localData, hasChanges, onAutoSave]);

  // Update local data when prop changes (only if values actually changed)
  const dataRef = useRef(data);
  useEffect(() => {
    if (JSON.stringify(data) !== JSON.stringify(dataRef.current)) {
      setLocalData(data);
      setHasChanges(false);
    }
    dataRef.current = data;
  }, [data]);

  const handleFieldChange = useCallback((field: string, value: any) => {
    setLocalData(prev => {
      const newData: ProjectData = JSON.parse(JSON.stringify(prev));
      // Reidrata datas principais
      if (newData.project?.contractPeriod?.startDate) {
        newData.project.contractPeriod.startDate = new Date(newData.project.contractPeriod.startDate);
      }
      if (newData.project?.contractPeriod?.endDate) {
        newData.project.contractPeriod.endDate = new Date(newData.project.contractPeriod.endDate);
      }
      newData.createdAt = new Date(newData.createdAt || Date.now());
      newData.updatedAt = new Date();
      const fieldPath = field.split('.');

      let current: any = newData;
      for (let i = 0; i < fieldPath.length - 1; i++) {
        if (!current[fieldPath[i]]) {
          current[fieldPath[i]] = {};
        }
        current = current[fieldPath[i]];
      }

      current[fieldPath[fieldPath.length - 1]] = value;
      // Atualiza cálculos derivados para manter preview e persistência consistentes
      const userQty = newData.generalInfo?.userQuantity || 0;
      const incidentsPerUser = newData.dimensioning?.incidentsPerUser || newData.generalInfo?.incidentsPerUser || 0;
      const monthlyCalls = calculateMonthlyCalls(userQty, incidentsPerUser);
      if (newData.generalInfo) newData.generalInfo.monthlyCalls = monthlyCalls;

      const n1Dist = newData.dimensioning?.n1Distribution ?? 80;
      const n1Cap = newData.dimensioning?.n1Capacity ?? 100;
      const n1Cap6h = newData.dimensioning?.n1Capacity6h ?? Math.round(n1Cap * 0.75);
      const n2Cap = newData.dimensioning?.n2Capacity ?? 75;
      const sixHour = newData.dimensioning?.n1SixHourShift ?? false;
      const coverageType = newData.dimensioning?.coverageType || CoverageType.BUSINESS_HOURS;
      const dimensioning = calculateServiceDeskDimensioning({
        userQuantity: userQty,
        incidentsPerUser,
        tmaMinutes: newData.dimensioning?.tmaMinutes || 10,
        occupancyRate: newData.dimensioning?.occupancyRate || 80,
        n1Distribution: n1Dist,
        n1SixHourShift: sixHour,
        coverageType,
        n1Capacity: n1Cap,
        n1Capacity6h: n1Cap6h,
        n2Capacity: n2Cap
      });
      if (newData.dimensioning) {
        newData.dimensioning.suggestedN1 = dimensioning.n1Agents;
        newData.dimensioning.suggestedN2 = dimensioning.n2Agents;
        newData.dimensioning.suggestedFolguistas = dimensioning.folguistas;
      }

      return newData;
    });
    setHasChanges(true);
  }, [calculateMonthlyCalls]);

  const toggleAdditionalService = useCallback((serviceField: 'needsSoftware' | 'needs0800' | 'needsDirectCall' | 'needsInfrastructure') => {
    const currentValue = !!localData.additionalServices?.[serviceField];
    handleFieldChange(`additionalServices.${serviceField}`, !currentValue);
  }, [localData.additionalServices, handleFieldChange]);

  const handleSave = useCallback(() => {
    onUpdate(localData);
    setHasChanges(false);
  }, [localData, onUpdate]);

  const calculateContractDuration = useCallback((startDate: Date, endDate: Date): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) return 1;
    let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    if (end.getDate() > start.getDate()) months += 1;
    return Math.max(1, months);
  }, []);

  const addContractMonths = useCallback((startDate: Date, months: number): Date => {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + Math.max(1, months));
    return end;
  }, []);

  // Função para calcular dimensionamento baseado em Erlang C (simplificado)
  const calculateErlangDimensioning = useCallback((
    userQuantity: number,
    incidentsPerUser: number,
    tmaMinutes: number,
    occupancyRate: number,
    n1Distribution: number,
    n1SixHourShift: boolean = false,
    coverageType: CoverageType | string = CoverageType.BUSINESS_HOURS
  ) => {
    return calculateServiceDeskDimensioning({
      userQuantity,
      incidentsPerUser,
      tmaMinutes,
      occupancyRate,
      n1Distribution,
      n1SixHourShift,
      coverageType,
      n1Capacity: localData.dimensioning?.n1Capacity || 100,
      n1Capacity6h: localData.dimensioning?.n1Capacity6h || Math.round((localData.dimensioning?.n1Capacity || 100) * 0.75),
      n2Capacity: localData.dimensioning?.n2Capacity || 75
    });
  }, [localData.dimensioning?.n1Capacity, localData.dimensioning?.n1Capacity6h, localData.dimensioning?.n2Capacity]);

  // Função para criar escalas automáticas baseadas no tipo de cobertura
  const createAutomaticSchedules = useCallback((
    n1Agents: number,
    n2Agents: number,
    coverageType: string,
    n1SixHourShift: boolean,
    n1MemberId: string = 'n1-agent',
    n2MemberId: string = 'n2-agent'
  ) => {
    const schedules = [];
    const n1MemberIds = Array.from({ length: n1Agents }, (_, i) => `${n1MemberId}-${i}`);
    const n2MemberIds = Array.from({ length: n2Agents }, (_, i) => `${n2MemberId}-${i}`);
    const allMemberIds = [...n1MemberIds, ...n2MemberIds];

    switch (coverageType) {
      case CoverageType.BUSINESS_HOURS: // 8x5
        // Turno único: Segunda a Sexta, 8h às 17h
        schedules.push({
          id: createId(),
          name: 'Horário Comercial',
          shifts: [
            {
              id: createId(),
              name: n1SixHourShift ? 'N1 - Manhã (6h)' : 'N1 - Comercial (8h)',
              startTime: '08:00',
              endTime: n1SixHourShift ? '14:00' : '17:00',
              daysOfWeek: [1, 2, 3, 4, 5], // Segunda a Sexta
              teamMembers: n1MemberIds,
              isSpecialShift: false,
              multiplier: 1.0
            },
            {
              id: createId(),
              name: 'N2 - Comercial (8h)',
              startTime: '08:00',
              endTime: '17:00',
              daysOfWeek: [1, 2, 3, 4, 5],
              teamMembers: n2MemberIds,
              isSpecialShift: false,
              multiplier: 1.0
            }
          ],
          coverage: {
            minimumStaff: Math.min(n1Agents + n2Agents, 2),
            preferredStaff: n1Agents + n2Agents,
            skillRequirements: [],
            availabilityHours: [
              {
                startTime: '08:00',
                endTime: '17:00',
                daysOfWeek: [1, 2, 3, 4, 5],
                priority: 'high' as const
              }
            ]
          },
          specialRates: []
        });
        break;

      case CoverageType.EXTENDED_HOURS: // 12x5
        schedules.push({
          id: createId(),
          name: 'Horário Estendido',
          shifts: [
            {
              id: createId(),
              name: n1SixHourShift ? 'N1 - Manhã (6h)' : 'N1 - Manhã (8h)',
              startTime: '07:00',
              endTime: n1SixHourShift ? '13:00' : '15:00',
              daysOfWeek: [1, 2, 3, 4, 5],
              teamMembers: n1MemberIds.slice(0, Math.ceil(n1Agents / 2)),
              isSpecialShift: false,
              multiplier: 1.0
            },
            {
              id: createId(),
              name: n1SixHourShift ? 'N1 - Tarde (6h)' : 'N1 - Tarde (8h)',
              startTime: n1SixHourShift ? '13:00' : '11:00',
              endTime: '19:00',
              daysOfWeek: [1, 2, 3, 4, 5],
              teamMembers: n1MemberIds.slice(Math.ceil(n1Agents / 2)),
              isSpecialShift: false,
              multiplier: 1.0
            },
            {
              id: createId(),
              name: 'N2 - Estendido (12h)',
              startTime: '07:00',
              endTime: '19:00',
              daysOfWeek: [1, 2, 3, 4, 5],
              teamMembers: n2MemberIds,
              isSpecialShift: false,
              multiplier: 1.0
            }
          ],
          coverage: {
            minimumStaff: Math.min(n1Agents + n2Agents, 3),
            preferredStaff: n1Agents + n2Agents,
            skillRequirements: [],
            availabilityHours: [
              {
                startTime: '07:00',
                endTime: '19:00',
                daysOfWeek: [1, 2, 3, 4, 5],
                priority: 'high' as const
              }
            ]
          },
          specialRates: []
        });
        break;

      case CoverageType.FULL_TIME: // 24x7
        const totalAgents = n1Agents + n2Agents;
        const agentsPerShift = Math.ceil(totalAgents / 4); // 4 turnos de 6h
        const shiftMembers = [0, 1, 2, 3].map(shiftIndex =>
          allMemberIds.filter((_, memberIndex) => memberIndex % 4 === shiftIndex)
        );

        schedules.push({
          id: createId(),
          name: 'Cobertura 24x7',
          shifts: [
            {
              id: createId(),
              name: 'Turno 1 - Madrugada (00h-06h)',
              startTime: '00:00',
              endTime: '06:00',
              daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Todos os dias
              teamMembers: shiftMembers[0],
              isSpecialShift: true,
              multiplier: 1.3 // Adicional noturno
            },
            {
              id: createId(),
              name: 'Turno 2 - Manhã (06h-12h)',
              startTime: '06:00',
              endTime: '12:00',
              daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
              teamMembers: shiftMembers[1],
              isSpecialShift: false,
              multiplier: 1.0
            },
            {
              id: createId(),
              name: 'Turno 3 - Tarde (12h-18h)',
              startTime: '12:00',
              endTime: '18:00',
              daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
              teamMembers: shiftMembers[2],
              isSpecialShift: false,
              multiplier: 1.0
            },
            {
              id: createId(),
              name: 'Turno 4 - Noite (18h-00h)',
              startTime: '18:00',
              endTime: '23:59',
              daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
              teamMembers: shiftMembers[3],
              isSpecialShift: true,
              multiplier: 1.2 // Adicional noturno
            }
          ],
          coverage: {
            minimumStaff: agentsPerShift,
            preferredStaff: agentsPerShift + 1,
            skillRequirements: [],
            availabilityHours: [
              {
                startTime: '00:00',
                endTime: '23:59',
                daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
                priority: 'critical' as const
              }
            ]
          },
          specialRates: [
            {
              name: 'Adicional Noturno',
              condition: 'night',
              multiplier: 1.2,
              applicableShifts: ['shift1', 'shift4']
            },
            {
              name: 'Adicional Fim de Semana',
              condition: 'weekend',
              multiplier: 1.1,
              applicableShifts: ['shift1', 'shift2', 'shift3', 'shift4']
            }
          ]
        });
        break;
    }

    return schedules;
  }, []);

  const handleDimensionAndGoToTeam = useCallback(() => {
    const erlangResult = calculateErlangDimensioning(
      localData.generalInfo?.userQuantity || 100,
      localData.dimensioning?.incidentsPerUser || 1.5,
      localData.dimensioning?.tmaMinutes || 10,
      localData.dimensioning?.occupancyRate || 80,
      localData.dimensioning?.n1Distribution || 80,
      localData.dimensioning?.n1SixHourShift || false,
      localData.dimensioning?.coverageType || CoverageType.BUSINESS_HOURS
    );

    const coverageType = localData.dimensioning?.coverageType || CoverageType.BUSINESS_HOURS;
    const n1SixHourShift = localData.dimensioning?.n1SixHourShift || false;

    const updatedData: ProjectData = {
      ...localData,
      generalInfo: {
        userQuantity: localData.generalInfo?.userQuantity || 100,
        monthlyCalls: erlangResult.totalCallsPerMonth
      },
      dimensioning: {
        incidentsPerUser: localData.dimensioning?.incidentsPerUser || 1.5,
        tmaMinutes: localData.dimensioning?.tmaMinutes || 10,
        occupancyRate: localData.dimensioning?.occupancyRate || 80,
        n1Distribution: localData.dimensioning?.n1Distribution || 80,
        n1Capacity: localData.dimensioning?.n1Capacity || 100,
        n1Capacity6h: localData.dimensioning?.n1Capacity6h || Math.round((localData.dimensioning?.n1Capacity || 100) * 0.75),
        n2Capacity: localData.dimensioning?.n2Capacity || 75,
        n1SixHourShift,
        coverageType,
        suggestedN1: erlangResult.n1Agents,
        suggestedN2: erlangResult.n2Agents,
        suggestedFolguistas: erlangResult.folguistas,
        suggestedLeader: erlangResult.suggestedLeader,
        suggestedCoordinator: erlangResult.suggestedCoordinator
      }
    };

    const timestamp = Date.now();
    const n1TeamMemberId = `auto-n1-${timestamp}`;
    const n2TeamMemberId = `auto-n2-${timestamp + 1}`;
    const generatedSchedules = createAutomaticSchedules(
      erlangResult.n1Agents,
      erlangResult.n2Agents,
      coverageType,
      n1SixHourShift,
      n1TeamMemberId,
      n2TeamMemberId
    );
    const dimensionedTeam = [
      {
        id: n1TeamMemberId,
        jobPositionId: 'pos-1',
        quantity: erlangResult.n1Agents,
        workingHours: n1SixHourShift ? 6 : 8,
        isActive: true,
        role: 'Analista de Service Desk N1',
        salary: n1SixHourShift ? 1580 : 1780,
        workload: n1SixHourShift ? 30 : 40,
        notes: erlangResult.folguistas > 0
          ? `Dimensionado automaticamente na aba Dados, incluindo ${erlangResult.folguistas} folguistas para cobertura de folgas`
          : 'Dimensionado automaticamente na aba Dados'
      },
      {
        id: n2TeamMemberId,
        jobPositionId: 'pos-2',
        quantity: erlangResult.n2Agents,
        workingHours: 8,
        isActive: true,
        role: 'Analista de Service Desk N2',
        salary: 2880,
        workload: 40,
        notes: 'Dimensionado automaticamente na aba Dados'
      }
    ];

    const totalAgents = erlangResult.n1Agents + erlangResult.n2Agents;
    if (erlangResult.suggestedLeader || totalAgents >= 8) {
      dimensionedTeam.push({
        id: `auto-leader-${timestamp + 2}`,
        jobPositionId: 'pos-4',
        quantity: 1,
        workingHours: 8,
        isActive: true,
        role: 'Líder Técnico',
        salary: 5200,
        workload: 40,
        notes: 'Líder técnico adicionado automaticamente para equipe de grande porte'
      });
    }
    if (erlangResult.suggestedCoordinator || totalAgents >= 15) {
      dimensionedTeam.push({
        id: `auto-coord-${timestamp + 3}`,
        jobPositionId: 'pos-5',
        quantity: 1,
        workingHours: 8,
        isActive: true,
        role: 'Coordenador',
        salary: 9800,
        workload: 40,
        notes: 'Coordenador adicionado automaticamente para equipe de grande porte'
      });
    }

    if (onDimensionTeam) {
      onDimensionTeam(updatedData, dimensionedTeam, generatedSchedules);
      return;
    }

    onUpdate(updatedData);
    alert(
      `Dimensionamento aplicado com sucesso!\n\n` +
      `• N1: ${erlangResult.n1Agents} agentes${n1SixHourShift ? ' (6h)' : ' (8h)'}\n` +
      `• N2: ${erlangResult.n2Agents} agentes (8h)\n` +
      `• Líderes: ${erlangResult.suggestedLeader || 0}\n` +
      `• Coordenadores: ${erlangResult.suggestedCoordinator || 0}\n` +
      `• Folguistas: ${erlangResult.folguistas}\n` +
      `• Cobertura: ${coverageType === CoverageType.BUSINESS_HOURS ? '8x5' :
        coverageType === CoverageType.EXTENDED_HOURS ? '12x5' : '24x7'}`
    );
  }, [calculateErlangDimensioning, createAutomaticSchedules, localData, onDimensionTeam, onUpdate]);

  // Preview dinâmico para cards de KPI no topo da aba
  const summary = useMemo(() => {
    const userQty = localData.generalInfo?.userQuantity || 0;
    const incidents = localData.dimensioning?.incidentsPerUser || localData.generalInfo?.incidentsPerUser || 0;
    const monthlyCalls = localData.generalInfo?.monthlyCalls ?? calculateMonthlyCalls(userQty, incidents);
    const coverage = localData.dimensioning?.coverageType || CoverageType.BUSINESS_HOURS;
    const dimensioningPreview = calculateErlangDimensioning(
      userQty || 100,
      incidents || 1.5,
      localData.dimensioning?.tmaMinutes || 10,
      localData.dimensioning?.occupancyRate || 80,
      localData.dimensioning?.n1Distribution || 80,
      localData.dimensioning?.n1SixHourShift || false,
      coverage
    );
    const n1 = localData.dimensioning?.suggestedN1 || dimensioningPreview.n1Agents;
    const n2 = localData.dimensioning?.suggestedN2 || dimensioningPreview.n2Agents;
    const folguistas = localData.dimensioning?.suggestedFolguistas ?? dimensioningPreview.folguistas;

    return { monthlyCalls, n1, n2, folguistas, coverage, userQty, incidents };
  }, [localData, calculateMonthlyCalls, calculateErlangDimensioning]);

  const handleDateChange = useCallback((field: string, date: Date | undefined) => {
    if (!date) return;

    handleFieldChange(field, date);

    if (field === 'contractPeriod.startDate') {
      const duration = Math.max(1, Number(localData.contractPeriod.durationMonths || 12));
      handleFieldChange('contractPeriod.endDate', addContractMonths(date, duration));
    } else if (field === 'contractPeriod.endDate' && localData.contractPeriod.startDate) {
      const duration = calculateContractDuration(localData.contractPeriod.startDate, date);
      handleFieldChange('contractPeriod.durationMonths', duration);
    }
  }, [localData.contractPeriod, handleFieldChange, calculateContractDuration, addContractMonths]);

  const handleContractDurationChange = useCallback((value: number) => {
    const duration = Math.max(1, Math.min(120, Number(value) || 1));
    handleFieldChange('contractPeriod.durationMonths', duration);
    const startDate = asDate(localData.contractPeriod.startDate) || new Date();
    handleFieldChange('contractPeriod.endDate', addContractMonths(startDate, duration));
  }, [localData.contractPeriod.startDate, handleFieldChange, addContractMonths]);

  const asDate = (value: any): Date | undefined => {
    if (!value) return undefined;
    return value instanceof Date ? value : new Date(value);
  };



  const getFieldError = (fieldName: string) => {
    return validation?.errors.find(error => error.field === fieldName);
  };

  const getFieldWarning = (fieldName: string) => {
    return validation?.warnings.find(warning => warning.field === fieldName);
  };

  const getValidationIcon = () => {
    if (!validation) return <Clock className="h-4 w-4 text-muted-foreground" />;
    if (validation.isValid) return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    return <AlertCircle className="h-4 w-4 text-red-500" />;
  };

  const getCompletionBadge = () => {
    if (!validation) return null;

    const percentage = validation.completionPercentage;
    const variant = percentage >= 80 ? 'default' : percentage >= 50 ? 'secondary' : 'destructive';

    return (
      <Badge variant={variant} className="ml-2">
        {percentage}% completo
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with validation status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CardTitle className="flex items-center space-x-2">
                {getValidationIcon()}
                <span>Dados do Projeto</span>
              </CardTitle>
              {getCompletionBadge()}
            </div>
            <div className="flex items-center space-x-2">
              {hasChanges && (
                <Badge variant="outline" className="text-orange-600">
                  <Clock className="h-3 w-3 mr-1" />
                  Salvando...
                </Badge>
              )}
              <Button
                onClick={handleSave}
                disabled={!hasChanges || isLoading}
                size="sm"
              >
                Salvar
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Validation Alerts */}
      {validation && validation.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">Campos obrigatórios não preenchidos:</p>
              <ul className="list-disc list-inside space-y-1">
                {validation.errors.map((error, index) => (
                  <li key={index} className="text-sm">{error.message}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {validation && validation.warnings.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">Atenção:</p>
              <ul className="list-disc list-inside space-y-1">
                {validation.warnings.map((warning, index) => (
                  <li key={index} className="text-sm">
                    {warning.message}
                    {warning.suggestion && (
                      <span className="text-muted-foreground"> - {warning.suggestion}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Dados do Projeto */}
      <Card variant="surface" className="card-surface">
        <CardHeader>
          <CardTitle>Dados do Projeto</CardTitle>
          <p className="text-sm text-muted-foreground">
            Preencha as informações do projeto e dimensione a equipe.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* KPIs rápidos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Card variant="surface" className="card-surface p-4 border border-primary/20">
              <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Volume estimado</p>
              <div className="text-xl font-semibold text-primary">{summary.monthlyCalls.toLocaleString('pt-BR')} chamados/mês</div>
              <p className="text-[11px] text-muted-foreground">Usuários x incidentes por usuário</p>
            </Card>
            <Card variant="surface" className="card-surface p-4 border border-border/50">
              <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Equipe sugerida N1</p>
              <div className="text-xl font-semibold text-foreground">{summary.n1} analistas</div>
              <p className="text-[11px] text-muted-foreground">
                {summary.folguistas > 0 ? `Inclui ${summary.folguistas} folguistas` : 'Baseado em distribuição N1 e TMA'}
              </p>
            </Card>
            <Card variant="surface" className="card-surface p-4 border border-border/50">
              <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Equipe sugerida N2</p>
              <div className="text-xl font-semibold text-foreground">{summary.n2} especialistas</div>
              <p className="text-[11px] text-muted-foreground">Capacidade mensal e distribuição</p>
            </Card>
            <Card variant="surface" className="card-surface p-4 border border-accent/40">
              <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Cobertura</p>
              <div className="text-xl font-semibold text-foreground">{summary.coverage}</div>
              <p className="text-[11px] text-muted-foreground">Ajuste em “Escala” conforme necessidade</p>
            </Card>
          </div>

          {/* Informações do Projeto */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className={styles.sectionTitle}>Informações do Projeto</h3>

              <div className="space-y-2">
                <Label htmlFor="project-name">Nome do Projeto</Label>
                <Input
                  id="project-name"
                  value={localData.name || 'Novo Projeto de Service Desk'}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  placeholder="Novo Projeto de Service Desk"
                  className={cn(getFieldError('name') && "border-red-500")}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-type">Tipo do Projeto</Label>
                <Select
                  value={localData.serviceType || 'STANDARD'}
                  onValueChange={(value) => handleFieldChange('serviceType', value as ServiceType)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Balcão de atendimento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BASIC">Suporte Básico</SelectItem>
                    <SelectItem value="STANDARD">Balcão de atendimento</SelectItem>
                    <SelectItem value="PREMIUM">Service Desk Avançado</SelectItem>
                    <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                    <SelectItem value="CUSTOM">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Serviços Adicionais */}
            <div className="space-y-4">
              <h3 className={styles.sectionTitle}>Serviços Adicionais</h3>

              <div className="space-y-3">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleAdditionalService('needsSoftware')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleAdditionalService('needsSoftware');
                    }
                  }}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border bg-background/60 p-3 cursor-pointer transition-colors",
                    localData.additionalServices?.needsSoftware ? "border-cyan-400/70" : "border-border/60 hover:border-cyan-400/40"
                  )}
                >
                  <Checkbox
                    id="needs-software"
                    checked={localData.additionalServices?.needsSoftware || false}
                    onCheckedChange={(checked) => handleFieldChange('additionalServices.needsSoftware', !!checked)}
                    onClick={(e) => e.stopPropagation()}
                    disabled={isLoading}
                  />
                  <div>
                    <Label htmlFor="needs-software" className="leading-5">Precisa de um software de Service Desk?</Label>
                    <p className="text-xs text-muted-foreground">Inclui licenciamento e implantação básica.</p>
                  </div>
                </div>

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleAdditionalService('needs0800')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleAdditionalService('needs0800');
                    }
                  }}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border bg-background/60 p-3 cursor-pointer transition-colors",
                    localData.additionalServices?.needs0800 ? "border-cyan-400/70" : "border-border/60 hover:border-cyan-400/40"
                  )}
                >
                  <Checkbox
                    id="needs-0800"
                    checked={localData.additionalServices?.needs0800 || false}
                    onCheckedChange={(checked) => handleFieldChange('additionalServices.needs0800', !!checked)}
                    onClick={(e) => e.stopPropagation()}
                    disabled={isLoading}
                  />
                  <div>
                    <Label htmlFor="needs-0800" className="leading-5">Necessita um nº 0800?</Label>
                    <p className="text-xs text-muted-foreground">Provisionamos URA e roteamento com SLA 24/7.</p>
                  </div>
                </div>

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleAdditionalService('needsDirectCall')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleAdditionalService('needsDirectCall');
                    }
                  }}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border bg-background/60 p-3 cursor-pointer transition-colors",
                    localData.additionalServices?.needsDirectCall ? "border-cyan-400/70" : "border-border/60 hover:border-cyan-400/40"
                  )}
                >
                  <Checkbox
                    id="needs-directcall"
                    checked={localData.additionalServices?.needsDirectCall || false}
                    onCheckedChange={(checked) => handleFieldChange('additionalServices.needsDirectCall', !!checked)}
                    onClick={(e) => e.stopPropagation()}
                    disabled={isLoading}
                  />
                  <div>
                    <Label htmlFor="needs-directcall" className="leading-5">Precisa de uma linha telefônica Directcall?</Label>
                    <p className="text-xs text-muted-foreground">Telefonia dedicada para fila de suporte.</p>
                  </div>
                </div>

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleAdditionalService('needsInfrastructure')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleAdditionalService('needsInfrastructure');
                    }
                  }}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border bg-background/60 p-3 cursor-pointer transition-colors",
                    localData.additionalServices?.needsInfrastructure ? "border-cyan-400/70" : "border-border/60 hover:border-cyan-400/40"
                  )}
                >
                  <Checkbox
                    id="needs-infrastructure"
                    checked={localData.additionalServices?.needsInfrastructure || false}
                    onCheckedChange={(checked) => handleFieldChange('additionalServices.needsInfrastructure', !!checked)}
                    onClick={(e) => e.stopPropagation()}
                    disabled={isLoading}
                  />
                  <div>
                    <Label htmlFor="needs-infrastructure" className="leading-5">Fornecedor de infraestrutura NR17?</Label>
                    <p className="text-xs text-muted-foreground">Mobiliário/ergonomia e kits de headset.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações Gerais */}
      <Card variant="surface" className="card-surface">
        <CardHeader>
          <CardTitle className={styles.cyanTitle}>Informações Gerais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="user-quantity">Quantidade de Usuários</Label>
              <Input
                id="user-quantity"
                type="number"
                value={localData.generalInfo?.userQuantity || 100}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  handleFieldChange('generalInfo.userQuantity', value);
                }}
                placeholder="100"
                min="1"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthly-calls">Volume de Chamados/Mês</Label>
              <div className={styles.inputWithIcon}>
                <Input
                  id="monthly-calls"
                  type="number"
                  value={calculateMonthlyCalls(
                    localData.generalInfo?.userQuantity || 100,
                    localData.dimensioning?.incidentsPerUser || 1.5
                  )}
                  placeholder="150"
                  min="1"
                  disabled={true}
                  readOnly
                  className="bg-slate-100 text-slate-600"
                />
                <div className={styles.lockIcon}>
                  <span>🔒</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dimensionamento Automático (Erlang C Simplificado) */}
      <Card variant="surface" className="card-surface">
        <CardHeader>
          <CardTitle className={styles.cyanTitle}>Dimensionamento Automático (Erlang C Simplificado)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Ajuste as configurações para ver a sugestão de equipe. Clique em "Aplicar" para usar os valores.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="incidents-per-user">Incidentes por Usuário/Mês</Label>
              <Input
                id="incidents-per-user"
                type="number"
                step="0.1"
                value={localData.dimensioning?.incidentsPerUser || 1.5}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  handleFieldChange('dimensioning.incidentsPerUser', value);
                }}
                placeholder="1.5"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tma-minutes">TMA (minutos)</Label>
              <Input
                id="tma-minutes"
                type="number"
                value={localData.dimensioning?.tmaMinutes || 10}
                onChange={(e) => handleFieldChange('dimensioning.tmaMinutes', parseInt(e.target.value) || 0)}
                placeholder="10"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="occupancy-rate">Taxa de Ocupação (%)</Label>
              <Input
                id="occupancy-rate"
                type="number"
                value={localData.dimensioning?.occupancyRate || 80}
                onChange={(e) => handleFieldChange('dimensioning.occupancyRate', parseInt(e.target.value) || 0)}
                placeholder="80"
                min="1"
                max="100"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="n1-distribution">Distribuição N1 (%)</Label>
              <Input
                id="n1-distribution"
                type="number"
                value={localData.dimensioning?.n1Distribution || 80}
                onChange={(e) => handleFieldChange('dimensioning.n1Distribution', parseInt(e.target.value) || 0)}
                placeholder="80"
                min="0"
                max="100"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="n1-capacity">Capacidade N1 (chamados/mês/8h)</Label>
              <div className={styles.inputWithIcon}>
                <Input
                  id="n1-capacity"
                  type="number"
                  value={localData.dimensioning?.n1Capacity || 100}
                  onChange={(e) => handleFieldChange('dimensioning.n1Capacity', parseInt(e.target.value) || 0)}
                  placeholder="100"
                  disabled={isLoading}
                />
                <div className={styles.lockIcon}>
                  <span>🔒</span>
                </div>
              </div>
              <p className={styles.referenceText}>
                Referência (80-120): Média 100 chamados/mês por atendente.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="n1-capacity-6h">Capacidade N1 (chamados/mês/6h)</Label>
              <div className={styles.inputWithIcon}>
                <Input
                  id="n1-capacity-6h"
                  type="number"
                  value={localData.dimensioning?.n1Capacity6h || Math.round((localData.dimensioning?.n1Capacity || 100) * 0.75)}
                  onChange={(e) => handleFieldChange('dimensioning.n1Capacity6h', parseInt(e.target.value) || 0)}
                  placeholder="75"
                  disabled={isLoading}
                />
                <div className={styles.lockIcon}>
                  <span>🔒</span>
                </div>
              </div>
              <p className={styles.referenceText}>
                Usada quando N1 fizer 6h. Base Erlang/capacidade: 75% da jornada de 8h.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="n2-capacity">Capacidade N2 (chamados/mês/8h)</Label>
              <div className={styles.inputWithIcon}>
                <Input
                  id="n2-capacity"
                  type="number"
                  value={localData.dimensioning?.n2Capacity || 75}
                  onChange={(e) => handleFieldChange('dimensioning.n2Capacity', parseInt(e.target.value) || 0)}
                  placeholder="75"
                  disabled={isLoading}
                />
                <div className={styles.lockIcon}>
                  <span>🔒</span>
                </div>
              </div>
              <p className={styles.referenceText}>
                Referência (60-90): Média 75 chamados/mês por atendente.
              </p>
            </div>

            <div className="space-y-3">
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (!isLoading) {
                    handleFieldChange('dimensioning.n1SixHourShift', !localData.dimensioning?.n1SixHourShift);
                  }
                }}
                onKeyDown={(e) => {
                  if (!isLoading && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    handleFieldChange('dimensioning.n1SixHourShift', !localData.dimensioning?.n1SixHourShift);
                  }
                }}
                className={cn(
                  "flex items-start gap-3 rounded-lg border bg-background/60 p-3 transition-colors",
                  isLoading ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-cyan-400/40",
                  localData.dimensioning?.n1SixHourShift ? "border-cyan-400/70" : "border-border/60"
                )}
              >
                <Checkbox
                  id="n1-6hour-shift"
                  checked={!!localData.dimensioning?.n1SixHourShift}
                  onCheckedChange={(checked) => handleFieldChange('dimensioning.n1SixHourShift', checked === true)}
                  onClick={(e) => e.stopPropagation()}
                  disabled={isLoading}
                />
                <div className="space-y-1">
                  <Label htmlFor="n1-6hour-shift" className="leading-5 cursor-pointer">
                    Analista N1 fará turno de 6 horas?
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Ajusta automaticamente capacidade, dimensionamento e escala sugerida do N1.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coverage-type">Tipo de Cobertura</Label>
                <Select
                  value={localData.dimensioning?.coverageType || CoverageType.BUSINESS_HOURS}
                  onValueChange={(value) => handleFieldChange('dimensioning.coverageType', value as CoverageType)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de cobertura" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={CoverageType.BUSINESS_HOURS}>8x5 - Horário Comercial</SelectItem>
                    <SelectItem value={CoverageType.EXTENDED_HOURS}>12x5 - Horário Estendido</SelectItem>
                    <SelectItem value={CoverageType.FULL_TIME}>24x7 - Tempo Integral</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {localData.dimensioning?.coverageType === CoverageType.BUSINESS_HOURS && 'Segunda a Sexta: 8h às 17h'}
                  {localData.dimensioning?.coverageType === CoverageType.EXTENDED_HOURS && 'Segunda a Sexta: 7h às 19h'}
                  {localData.dimensioning?.coverageType === CoverageType.FULL_TIME && 'Todos os dias: 24 horas'}
                </p>
              </div>
            </div>
          </div>

          {/* Resultados do Dimensionamento */}
          <div className={styles.gridResults}>
            <Card className={styles.resultCard}>
              <CardContent className="p-4 text-center">
                <div className={styles.resultNumber}>
                  {(() => {
                    const erlangResult = calculateErlangDimensioning(
                      localData.generalInfo?.userQuantity || 100,
                      localData.dimensioning?.incidentsPerUser || 1.5,
                      localData.dimensioning?.tmaMinutes || 10,
                      localData.dimensioning?.occupancyRate || 80,
                      localData.dimensioning?.n1Distribution || 80,
                      localData.dimensioning?.n1SixHourShift || false,
                      localData.dimensioning?.coverageType || CoverageType.BUSINESS_HOURS
                    );
                    return erlangResult.n1Agents;
                  })()}
                </div>
                <p className={styles.resultLabel}>Atendentes Sugeridos N1</p>
                <p className="text-xs text-slate-400 mt-1">
                  {Math.round((localData.generalInfo?.userQuantity || 100) * (localData.dimensioning?.incidentsPerUser || 1.5) * (localData.dimensioning?.n1Distribution || 80) / 100)} chamados/mês
                  {localData.dimensioning?.n1SixHourShift && ' (6h/dia)'}
                  {summary.folguistas > 0 && ` + ${summary.folguistas} folguistas`}
                </p>
              </CardContent>
            </Card>

            <Card className={styles.resultCard}>
              <CardContent className="p-4 text-center">
                <div className={styles.resultNumber}>
                  {(() => {
                    const erlangResult = calculateErlangDimensioning(
                      localData.generalInfo?.userQuantity || 100,
                      localData.dimensioning?.incidentsPerUser || 1.5,
                      localData.dimensioning?.tmaMinutes || 10,
                      localData.dimensioning?.occupancyRate || 80,
                      localData.dimensioning?.n1Distribution || 80,
                      localData.dimensioning?.n1SixHourShift || false,
                      localData.dimensioning?.coverageType || CoverageType.BUSINESS_HOURS
                    );
                    return erlangResult.n2Agents;
                  })()}
                </div>
                <p className={styles.resultLabel}>Atendentes Sugeridos N2</p>
                <p className="text-xs text-slate-400 mt-1">
                  {Math.round((localData.generalInfo?.userQuantity || 100) * (localData.dimensioning?.incidentsPerUser || 1.5) * (100 - (localData.dimensioning?.n1Distribution || 80)) / 100)} chamados/mês
                </p>
              </CardContent>
            </Card>

            <div className="flex flex-col items-center justify-center space-y-3">
              <Button
                className={styles.applyButton}
                onClick={handleDimensionAndGoToTeam}
                disabled={isLoading}
              >
                Dimensionar Equipe
              </Button>

              {/* Informações do Cálculo */}
              <div className="text-center">
                <p className="text-xs text-slate-400">
                  Carga de trabalho: {(() => {
                    const erlangResult = calculateErlangDimensioning(
                      localData.generalInfo?.userQuantity || 100,
                      localData.dimensioning?.incidentsPerUser || 1.5,
                      localData.dimensioning?.tmaMinutes || 10,
                      localData.dimensioning?.occupancyRate || 80,
                      localData.dimensioning?.n1Distribution || 80,
                      localData.dimensioning?.n1SixHourShift || false,
                      localData.dimensioning?.coverageType || CoverageType.BUSINESS_HOURS
                    );
                    return erlangResult.workloadErlang;
                  })()} Erlangs
                </p>
                <p className="text-xs text-slate-400">
                  Total: {calculateMonthlyCalls(
                    localData.generalInfo?.userQuantity || 100,
                    localData.dimensioning?.incidentsPerUser || 1.5
                  )} chamados/mês
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contract Period */}
      <Card>
        <CardHeader>
          <CardTitle>Período do Contrato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Data de Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !localData.contractPeriod.startDate && "text-muted-foreground",
                      getFieldError('contractPeriod') && "border-red-500"
                    )}
                    disabled={isLoading}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {localData.contractPeriod.startDate ? (
                      format(asDate(localData.contractPeriod.startDate) || new Date(), "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecione a data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={asDate(localData.contractPeriod.startDate)}
                    onSelect={(date) => handleDateChange('contractPeriod.startDate', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Data de Fim</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !localData.contractPeriod.endDate && "text-muted-foreground",
                      getFieldError('contractPeriod') && "border-red-500"
                    )}
                    disabled={isLoading}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {localData.contractPeriod.endDate ? (
                      format(asDate(localData.contractPeriod.endDate) || new Date(), "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecione a data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={asDate(localData.contractPeriod.endDate)}
                    onSelect={(date) => handleDateChange('contractPeriod.endDate', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duração (meses)</Label>
              <Input
                id="duration"
                type="number"
                value={localData.contractPeriod.durationMonths}
                onChange={(e) => handleContractDurationChange(parseInt(e.target.value, 10))}
                placeholder="12"
                min="1"
                max="120"
                disabled={isLoading}
              />
            </div>
          </div>

          {getFieldError('contractPeriod') && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {getFieldError('contractPeriod')?.message}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
