'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, User, Calendar, Clock, FileText, 
  Users, Phone, Target, TrendingUp, Save, AlertCircle 
} from 'lucide-react';
import { ProjectData, TabValidationStatus } from '@/lib/types/service-desk-pricing';
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

export function DataTabModuleImproved({ 
  data, 
  onUpdate, 
  validation, 
  isLoading = false,
  onAutoSave 
}: DataTabModuleProps) {
  const [localData, setLocalData] = useState<ProjectData>(data);
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

  const handleFieldChange = useCallback((field: keyof ProjectData, value: any) => {
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
        icon={<FileText className="h-5 w-5 text-blue-600" />}
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
        icon={<Building2 className="h-5 w-5 text-green-600" />}
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
        icon={<Users className="h-5 w-5 text-orange-600" />}
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

        {monthlyCalls > 0 && (
          <Alert className="mt-4 bg-blue-50 border-blue-200">
            <Phone className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              Volume estimado: <strong>{monthlyCalls} chamados/mês</strong> 
              {' '}({Math.round(monthlyCalls / 22)} chamados/dia útil)
            </AlertDescription>
          </Alert>
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
            <span className="flex items-center gap-2 text-green-600">
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
