'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, User, Calendar, Clock, FileText, 
  Users, Phone, Target, TrendingUp, Save, AlertCircle, Zap 
} from 'lucide-react';
import { ProjectData, TabValidationStatus } from '@/lib/types/service-desk-pricing';

// Extended interface for easier form handling
interface ProjectDataForm extends Partial<ProjectData> {
  projectName?: string;
  projectCode?: string;
  projectDescription?: string;
  clientName?: string;
  clientCNPJ?: string;
  clientContact?: string;
  clientEmail?: string;
  contractStartDate?: Date;
  contractEndDate?: Date;
  userQuantity?: number;
  incidentsPerUser?: number;
  slaTarget?: number;
  coverageType?: '8x5' | '12x5' | '24x7';
  updatedAt?: Date;
}
import { FormSection, MetricCard, EnhancedInput } from '../shared';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export interface DataTabModuleProps {
  data: ProjectData;
  onUpdate: (data: ProjectData) => void;
  validation?: TabValidationStatus;
  isLoading?: boolean;
  onAutoSave?: (data: ProjectData) => void;
}

export function DataTabModule({ 
  data, 
  onUpdate, 
  validation, 
  isLoading = false,
  onAutoSave 
}: DataTabModuleProps) {
  const [localData, setLocalData] = useState<ProjectDataForm>(data as ProjectDataForm);
  const [hasChanges, setHasChanges] = useState(false);

  // Auto-save functionality
  useEffect(() => {
    if (hasChanges && onAutoSave) {
      const timeoutId = setTimeout(() => {
        onAutoSave(localData);
        setHasChanges(false);
      }, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [localData, hasChanges, onAutoSave]);

  useEffect(() => {
    setLocalData(data);
    setHasChanges(false);
  }, [data]);

  const handleFieldChange = useCallback((field: keyof ProjectDataForm, value: any) => {
    setLocalData(prev => ({
      ...prev,
      [field]: value,
      updatedAt: new Date()
    }));
    setHasChanges(true);
  }, []);

  const handleSave = useCallback(() => {
    onUpdate(localData);
    setHasChanges(false);
  }, [localData, onUpdate]);

  const handleGenerateSchedule = useCallback(() => {
    // 1. Calculate dimensioning using Erlang C
    const monthlyCalls = (localData.userQuantity || 0) * (localData.incidentsPerUser || 0);
    const dailyCalls = Math.round(monthlyCalls / 22); // 22 working days
    const hourlyCalls = dailyCalls / 8; // Assuming 8 hour workday
    
    // Simplified Erlang C calculation
    const tma = 15; // Average handling time in minutes
    const occupancy = 0.85; // 85% occupancy target
    const sla = (localData.slaTarget || 80) / 100;
    
    // Calculate required agents (simplified formula)
    const trafficIntensity = (hourlyCalls * tma) / 60; // Erlangs
    const baseAgents = Math.ceil(trafficIntensity / occupancy);
    
    // Distribution: 60% N1, 30% N2, 10% N3
    const n1Count = Math.max(Math.ceil(baseAgents * 0.6), 2);
    const n2Count = Math.max(Math.ceil(baseAgents * 0.3), 1);
    const n3Count = Math.max(Math.ceil(baseAgents * 0.1), 1);
    const totalAgents = n1Count + n2Count + n3Count;
    
    // 2. Calculate folguistas based on coverage type
    let folguistaFactor = 0.20; // Default 20% for 8x5
    if (localData.coverageType === '12x5') {
      folguistaFactor = 0.25; // 25% for extended hours
    } else if (localData.coverageType === '24x7') {
      folguistaFactor = 0.40; // 40% for 24x7
    }
    
    const folguistas = Math.ceil(totalAgents * folguistaFactor);
    const totalWithFolguistas = totalAgents + folguistas;
    
    // 3. Generate shifts based on coverage type
    const shifts: any[] = [];
    
    if (localData.coverageType === '8x5') {
      // Business hours: 8am-6pm, Mon-Fri
      shifts.push({
        id: `shift-${Date.now()}-1`,
        name: 'Turno Comercial',
        startTime: '08:00',
        endTime: '18:00',
        daysOfWeek: [1, 2, 3, 4, 5],
        teamMembers: [],
        isSpecialShift: false,
        multiplier: 1.0,
        requiredN1: n1Count,
        requiredN2: n2Count,
        requiredN3: n3Count,
        requiredFolguistas: folguistas
      });
    } else if (localData.coverageType === '12x5') {
      // Extended hours: 7am-7pm, Mon-Fri
      shifts.push({
        id: `shift-${Date.now()}-1`,
        name: 'Turno Manhã/Tarde',
        startTime: '07:00',
        endTime: '19:00',
        daysOfWeek: [1, 2, 3, 4, 5],
        teamMembers: [],
        isSpecialShift: false,
        multiplier: 1.0,
        requiredN1: n1Count,
        requiredN2: n2Count,
        requiredN3: n3Count,
        requiredFolguistas: folguistas
      });
    } else if (localData.coverageType === '24x7') {
      // 24x7 coverage: 3 shifts of 8 hours
      const shiftsPerDay = Math.ceil(n1Count / 3);
      const n2PerShift = Math.ceil(n2Count / 3);
      
      shifts.push(
        {
          id: `shift-${Date.now()}-1`,
          name: 'Turno Madrugada (00h-08h)',
          startTime: '00:00',
          endTime: '08:00',
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
          teamMembers: [],
          isSpecialShift: true,
          multiplier: 1.5, // Night shift premium
          requiredN1: shiftsPerDay,
          requiredN2: n2PerShift,
          requiredN3: 0,
          requiredFolguistas: Math.ceil(folguistas / 3)
        },
        {
          id: `shift-${Date.now()}-2`,
          name: 'Turno Manhã (08h-16h)',
          startTime: '08:00',
          endTime: '16:00',
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
          teamMembers: [],
          isSpecialShift: false,
          multiplier: 1.0,
          requiredN1: shiftsPerDay,
          requiredN2: n2PerShift,
          requiredN3: n3Count, // N3 works during business hours
          requiredFolguistas: Math.ceil(folguistas / 3)
        },
        {
          id: `shift-${Date.now()}-3`,
          name: 'Turno Tarde (16h-00h)',
          startTime: '16:00',
          endTime: '23:59',
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
          teamMembers: [],
          isSpecialShift: true,
          multiplier: 1.3, // Evening shift premium
          requiredN1: shiftsPerDay,
          requiredN2: n2PerShift,
          requiredN3: 0,
          requiredFolguistas: Math.ceil(folguistas / 3)
        }
      );
    }
    
    // 4. Create schedule object
    const generatedSchedule = {
      id: `schedule-${Date.now()}`,
      name: `Escala ${localData.coverageType}`,
      shifts: shifts,
      coverage: {
        minimumStaff: totalAgents,
        preferredStaff: totalWithFolguistas,
        skillRequirements: [],
        availabilityHours: []
      },
      specialRates: [],
      dimensioning: {
        n1: n1Count,
        n2: n2Count,
        n3: n3Count,
        folguistas: folguistas,
        total: totalWithFolguistas,
        coverageType: localData.coverageType
      }
    };
    
    // 5. Save data and dispatch event
    onUpdate(localData);
    
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('scheduleGenerated', {
        detail: {
          schedule: generatedSchedule,
          dimensioning: {
            n1: n1Count,
            n2: n2Count,
            n3: n3Count,
            folguistas: folguistas,
            total: totalWithFolguistas
          },
          projectData: localData
        }
      });
      window.dispatchEvent(event);
    }
    
    // Show success message
    alert(`Escala gerada com sucesso!\n\nDimensionamento:\n- N1: ${n1Count} agentes\n- N2: ${n2Count} agentes\n- N3: ${n3Count} agentes\n- Folguistas: ${folguistas} agentes\n- Total: ${totalWithFolguistas} agentes\n\nNavegue para a aba "Escala" para conferir.`);
  }, [localData, onUpdate]);

  // Cálculos automáticos
  const monthlyCalls = localData.userQuantity * (localData.incidentsPerUser || 0);
  const contractDuration = localData.contractStartDate && localData.contractEndDate
    ? Math.ceil((new Date(localData.contractEndDate).getTime() - new Date(localData.contractStartDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
    : 0;

  return (
    <div className="space-y-6 pb-6">
      {/* Header com Status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Dados do Projeto</h2>
          <p className="text-muted-foreground mt-1">
            Configure as informações básicas do projeto e cliente
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <Badge variant="secondary" className="animate-pulse">
              <Clock className="h-3 w-3 mr-1" />
              Salvando...
            </Badge>
          )}
          {validation && (
            <Badge variant={validation.isValid ? 'default' : 'destructive'}>
              {validation.isValid ? (
                <>
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {validation.completionPercentage}% completo
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {validation.errors.length} erros
                </>
              )}
            </Badge>
          )}
        </div>
      </div>

      {/* Métricas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Usuários"
          value={localData.userQuantity || 0}
          icon={<Users className="h-5 w-5" />}
          variant="primary"
          tooltip="Número total de usuários atendidos"
        />
        <MetricCard
          title="Chamados/Mês"
          value={monthlyCalls}
          icon={<Phone className="h-5 w-5" />}
          variant="success"
          tooltip="Volume mensal estimado de chamados"
        />
        <MetricCard
          title="Duração Contrato"
          value={`${contractDuration} meses`}
          icon={<Calendar className="h-5 w-5" />}
          variant="default"
          tooltip="Período total do contrato"
        />
        <MetricCard
          title="SLA Alvo"
          value={`${localData.slaTarget || 0}%`}
          icon={<Target className="h-5 w-5" />}
          variant="warning"
          tooltip="Nível de serviço acordado"
        />
      </div>

      {/* Informações do Projeto */}
      <FormSection
        title="Informações do Projeto"
        description="Dados básicos de identificação do projeto"
        icon={<FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
        variant="primary"
        required
        helpText="Preencha os dados principais do projeto para identificação e controle"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EnhancedInput
            label="Nome do Projeto"
            placeholder="Ex: Service Desk Empresa XYZ"
            value={localData.projectName || ''}
            onChange={(e) => handleFieldChange('projectName', e.target.value)}
            required
            tooltip="Nome que identifica este projeto internamente"
            icon={<FileText className="h-4 w-4" />}
          />
          
          <EnhancedInput
            label="Código do Projeto"
            placeholder="Ex: SD-2024-001"
            value={localData.projectCode || ''}
            onChange={(e) => handleFieldChange('projectCode', e.target.value)}
            tooltip="Código único para rastreamento"
            icon={<FileText className="h-4 w-4" />}
            showOptional
          />
        </div>

        <div className="mt-4">
          <label className="text-sm font-medium mb-2 block">
            Descrição do Projeto
          </label>
          <Textarea
            placeholder="Descreva o escopo e objetivos do projeto..."
            value={localData.projectDescription || ''}
            onChange={(e) => handleFieldChange('projectDescription', e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>
      </FormSection>

      {/* Informações do Cliente */}
      <FormSection
        title="Informações do Cliente"
        description="Dados do cliente que receberá o serviço"
        icon={<Building2 className="h-5 w-5 text-green-600 dark:text-green-400" />}
        variant="success"
        required
        helpText="Informações do cliente para a proposta comercial"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EnhancedInput
            label="Nome do Cliente"
            placeholder="Ex: Empresa XYZ Ltda"
            value={localData.clientName || ''}
            onChange={(e) => handleFieldChange('clientName', e.target.value)}
            required
            tooltip="Razão social ou nome fantasia do cliente"
            icon={<Building2 className="h-4 w-4" />}
          />
          
          <EnhancedInput
            label="CNPJ"
            placeholder="00.000.000/0000-00"
            value={localData.clientCNPJ || ''}
            onChange={(e) => handleFieldChange('clientCNPJ', e.target.value)}
            tooltip="CNPJ do cliente"
            showOptional
          />

          <EnhancedInput
            label="Contato Principal"
            placeholder="Nome do responsável"
            value={localData.clientContact || ''}
            onChange={(e) => handleFieldChange('clientContact', e.target.value)}
            icon={<User className="h-4 w-4" />}
            showOptional
          />

          <EnhancedInput
            label="E-mail"
            type="email"
            placeholder="contato@empresa.com"
            value={localData.clientEmail || ''}
            onChange={(e) => handleFieldChange('clientEmail', e.target.value)}
            showOptional
          />
        </div>
      </FormSection>

      {/* Período do Contrato */}
      <FormSection
        title="Período do Contrato"
        description="Defina a vigência do contrato de serviço"
        icon={<Calendar className="h-5 w-5 text-purple-600" />}
        variant="default"
        required
        helpText="Período de vigência do contrato de prestação de serviços"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Data de Início <span className="text-red-500">*</span>
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !localData.contractStartDate && 'text-muted-foreground'
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {localData.contractStartDate ? (
                    format(new Date(localData.contractStartDate), 'PPP', { locale: ptBR })
                  ) : (
                    'Selecione a data'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={localData.contractStartDate ? new Date(localData.contractStartDate) : undefined}
                  onSelect={(date) => handleFieldChange('contractStartDate', date)}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Data de Término <span className="text-red-500">*</span>
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !localData.contractEndDate && 'text-muted-foreground'
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {localData.contractEndDate ? (
                    format(new Date(localData.contractEndDate), 'PPP', { locale: ptBR })
                  ) : (
                    'Selecione a data'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={localData.contractEndDate ? new Date(localData.contractEndDate) : undefined}
                  onSelect={(date) => handleFieldChange('contractEndDate', date)}
                  locale={ptBR}
                  disabled={(date) =>
                    localData.contractStartDate ? date < new Date(localData.contractStartDate) : false
                  }
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {contractDuration > 0 && (
          <Alert className="mt-4">
            <TrendingUp className="h-4 w-4" />
            <AlertDescription>
              Duração do contrato: <strong>{contractDuration} meses</strong>
            </AlertDescription>
          </Alert>
        )}
      </FormSection>

      {/* Dimensionamento */}
      <FormSection
        title="Dimensionamento do Serviço"
        description="Parâmetros para cálculo da equipe necessária"
        icon={<Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />}
        variant="warning"
        required
        helpText="Dados para dimensionar a equipe de atendimento"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <EnhancedInput
            label="Quantidade de Usuários"
            type="number"
            placeholder="100"
            value={localData.userQuantity || ''}
            onChange={(e) => handleFieldChange('userQuantity', parseInt(e.target.value) || 0)}
            required
            tooltip="Número total de usuários que serão atendidos"
            icon={<Users className="h-4 w-4" />}
            helperText="Total de usuários finais"
          />

          <EnhancedInput
            label="Incidentes por Usuário/Mês"
            type="number"
            step="0.1"
            placeholder="1.5"
            value={localData.incidentsPerUser || ''}
            onChange={(e) => handleFieldChange('incidentsPerUser', parseFloat(e.target.value) || 0)}
            required
            tooltip="Média de chamados por usuário por mês"
            icon={<Phone className="h-4 w-4" />}
            helperText="Média mensal por usuário"
          />

          <EnhancedInput
            label="SLA Alvo (%)"
            type="number"
            placeholder="80"
            value={localData.slaTarget || ''}
            onChange={(e) => handleFieldChange('slaTarget', parseInt(e.target.value) || 0)}
            required
            tooltip="Percentual de chamados atendidos dentro do prazo"
            icon={<Target className="h-4 w-4" />}
            helperText="Meta de nível de serviço"
          />
        </div>

        {/* Tipo de Cobertura */}
        <div className="mt-4">
          <label className="text-sm font-medium mb-2 block">
            Tipo de Cobertura <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: '8x5', label: '8x5 - Comercial', desc: 'Seg-Sex, 8h/dia' },
              { value: '12x5', label: '12x5 - Estendido', desc: 'Seg-Sex, 12h/dia' },
              { value: '24x7', label: '24x7 - Integral', desc: '24h, 7 dias' }
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleFieldChange('coverageType', option.value)}
                className={cn(
                  'p-4 rounded-lg border-2 transition-all text-left',
                  localData.coverageType === option.value
                    ? 'border-orange-600 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-300'
                )}
              >
                <div className="font-semibold text-sm">{option.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{option.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {monthlyCalls > 0 && (
          <Alert className="mt-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-900 dark:text-blue-100">
              Volume estimado: <strong>{monthlyCalls} chamados/mês</strong> 
              {' '}({Math.round(monthlyCalls / 22)} chamados/dia útil)
            </AlertDescription>
          </Alert>
        )}

        {/* Botão Gerar Escala */}
        {localData.userQuantity && localData.incidentsPerUser && localData.coverageType && (
          <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border-2 border-orange-200">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="font-semibold text-orange-900 mb-1 flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Pronto para Gerar Escala
                </h4>
                <p className="text-sm text-orange-700">
                  Com base nos dados informados, podemos gerar automaticamente a escala de trabalho 
                  para cobertura <strong>{localData.coverageType}</strong>.
                </p>
              </div>
              <Button
                size="lg"
                onClick={handleGenerateSchedule}
                className="bg-orange-600 hover:bg-orange-700 flex-shrink-0"
              >
                <Zap className="h-5 w-5 mr-2" />
                Gerar Escala Automaticamente
              </Button>
            </div>
          </div>
        )}
      </FormSection>

      {/* Botões de Ação */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="text-sm text-muted-foreground">
          {hasChanges ? (
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 animate-pulse" />
              Salvando automaticamente...
            </span>
          ) : (
            <span className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <AlertCircle className="h-4 w-4" />
              Todas as alterações salvas
            </span>
          )}
        </div>

        <Button
          onClick={handleSave}
          disabled={!hasChanges || isLoading}
          size="lg"
        >
          <Save className="h-4 w-4 mr-2" />
          Salvar Manualmente
        </Button>
      </div>
    </div>
  );
}
