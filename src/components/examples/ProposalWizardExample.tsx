'use client';

import React, { useState } from 'react';
import {
  Building,
  FileText,
  DollarSign,
  CheckCircle,
  User,
  Calendar,
  Briefcase,
} from 'lucide-react';
import { FormWizard, WizardStepContent, useFormWizard } from '@/components/ui/form-wizard';
import { FormField, FormSection } from '@/components/ui/form-section';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InfoCard } from '@/components/ui/enhanced-card';
import { validators, validateForm, masks } from '@/lib/form-validation';
import type { Proposal } from '@/lib/types';

interface ProposalWizardExampleProps {
  onSave: (proposal: Proposal) => void;
  onCancel: () => void;
}

export function ProposalWizardExample({
  onSave,
  onCancel,
}: ProposalWizardExampleProps) {
  const wizard = useFormWizard(4);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    // Step 1: Informações Básicas
    title: '',
    client: '',
    clientContact: '',
    clientEmail: '',
    clientPhone: '',

    // Step 2: Detalhes da Proposta
    description: '',
    status: 'Rascunho' as Proposal['status'],
    date: new Date().toISOString().split('T')[0],
    expiryDate: '',

    // Step 3: Valores
    value: '',
    accountManager: '',
    distributorId: '',

    // Step 4: Documentação (opcional)
    proposalFile: '',
    technicalSpecs: '',
    commercialTerms: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps = [
    {
      id: 'basic',
      title: 'Informações Básicas',
      description: 'Cliente e identificação da proposta',
      icon: <Building className="h-5 w-5" />,
    },
    {
      id: 'details',
      title: 'Detalhes',
      description: 'Descrição e escopo da proposta',
      icon: <FileText className="h-5 w-5" />,
    },
    {
      id: 'values',
      title: 'Valores',
      description: 'Precificação e responsável',
      icon: <DollarSign className="h-5 w-5" />,
    },
    {
      id: 'review',
      title: 'Revisão',
      description: 'Confirme as informações',
      icon: <CheckCircle className="h-5 w-5" />,
      optional: true,
    },
  ];

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpar erro do campo quando usuário digitar
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep = (stepId: string): boolean => {
    let stepErrors: Record<string, string> = {};

    switch (stepId) {
      case 'basic':
        const basicValidation = validateForm(formData, {
          title: [validators.required('Título é obrigatório')],
          client: [validators.required('Cliente é obrigatório')],
          clientEmail: [validators.email()],
          clientPhone: [validators.phone()],
        });
        stepErrors = basicValidation.errors;
        break;

      case 'details':
        const detailsValidation = validateForm(formData, {
          description: [
            validators.required('Descrição é obrigatória'),
            validators.minLength(10, 'Descrição deve ter pelo menos 10 caracteres'),
          ],
          expiryDate: [validators.required('Data de validade é obrigatória')],
        });
        stepErrors = detailsValidation.errors;
        break;

      case 'values':
        const valuesValidation = validateForm(formData, {
          value: [
            validators.required('Valor é obrigatório'),
            validators.min(0, 'Valor deve ser positivo'),
          ],
          accountManager: [validators.required('Responsável é obrigatório')],
        });
        stepErrors = valuesValidation.errors;
        break;
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    const currentStepId = steps[wizard.currentStep].id;
    if (validateStep(currentStepId)) {
      wizard.nextStep();
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    
    // Simular salvamento
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const proposal: Proposal = {
      id: `PROP-${Date.now()}`,
      title: formData.title,
      client: formData.client,
      description: formData.description,
      status: formData.status,
      value: parseFloat(formData.value),
      date: formData.date,
      expiryDate: formData.expiryDate,
      accountManager: formData.accountManager,
      distributorId: formData.distributorId || 'local',
      proposalFile: formData.proposalFile || undefined,
      technicalSpecs: formData.technicalSpecs || undefined,
      commercialTerms: formData.commercialTerms || undefined,
    };

    onSave(proposal);
    setIsSubmitting(false);
  };

  const formatCurrency = (value: string) => {
    const numericValue = parseFloat(value) || 0;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(numericValue);
  };

  return (
    <FormWizard
      steps={steps}
      currentStep={wizard.currentStep}
      onStepChange={wizard.goToStep}
      onComplete={handleComplete}
      onCancel={onCancel}
      isSubmitting={isSubmitting}
      canGoNext={Object.keys(errors).length === 0}
    >
      {/* Step 1: Informações Básicas */}
      <WizardStepContent stepId="basic" currentStepId={steps[wizard.currentStep].id}>
        <FormSection
          title="Dados do Cliente"
          description="Informações para identificação do cliente"
          icon={<Building className="h-5 w-5" />}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Título da Proposta"
              required
              error={errors.title}
              help="Nome descritivo para identificar a proposta"
              className="sm:col-span-2"
            >
              <Input
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="Ex: Infraestrutura Cloud AWS"
              />
            </FormField>

            <FormField
              label="Nome do Cliente"
              required
              error={errors.client}
              help="Razão social ou nome fantasia"
            >
              <Input
                value={formData.client}
                onChange={(e) => updateField('client', e.target.value)}
                placeholder="Ex: Empresa XYZ Ltda"
              />
            </FormField>

            <FormField label="Contato" hint="Nome do contato principal">
              <Input
                value={formData.clientContact}
                onChange={(e) => updateField('clientContact', e.target.value)}
                placeholder="Ex: João Silva"
              />
            </FormField>

            <FormField label="E-mail" error={errors.clientEmail}>
              <Input
                type="email"
                value={formData.clientEmail}
                onChange={(e) => updateField('clientEmail', e.target.value)}
                placeholder="contato@empresa.com"
              />
            </FormField>

            <FormField label="Telefone" error={errors.clientPhone}>
              <Input
                value={formData.clientPhone}
                onChange={(e) =>
                  updateField('clientPhone', masks.phone(e.target.value))
                }
                placeholder="(11) 98765-4321"
              />
            </FormField>
          </div>
        </FormSection>
      </WizardStepContent>

      {/* Step 2: Detalhes */}
      <WizardStepContent stepId="details" currentStepId={steps[wizard.currentStep].id}>
        <FormSection
          title="Detalhes da Proposta"
          description="Escopo e informações complementares"
          icon={<FileText className="h-5 w-5" />}
        >
          <div className="space-y-4">
            <FormField
              label="Descrição"
              required
              error={errors.description}
              hint="Descreva o escopo da proposta (mínimo 10 caracteres)"
            >
              <Textarea
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Descreva os serviços ou produtos oferecidos..."
                rows={4}
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Status">
                <Select
                  value={formData.status}
                  onValueChange={(value) => updateField('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Rascunho">Rascunho</SelectItem>
                    <SelectItem value="Enviada">Enviada</SelectItem>
                    <SelectItem value="Em Análise">Em Análise</SelectItem>
                    <SelectItem value="Aprovada">Aprovada</SelectItem>
                    <SelectItem value="Rejeitada">Rejeitada</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Data de Criação">
                <Input type="date" value={formData.date} disabled />
              </FormField>

              <FormField
                label="Data de Validade"
                required
                error={errors.expiryDate}
                hint="Até quando a proposta é válida"
              >
                <Input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => updateField('expiryDate', e.target.value)}
                  min={formData.date}
                />
              </FormField>
            </div>
          </div>
        </FormSection>
      </WizardStepContent>

      {/* Step 3: Valores */}
      <WizardStepContent stepId="values" currentStepId={steps[wizard.currentStep].id}>
        <FormSection
          title="Precificação"
          description="Valores e responsável comercial"
          icon={<DollarSign className="h-5 w-5" />}
        >
          <div className="space-y-4">
            <FormField
              label="Valor da Proposta"
              required
              error={errors.value}
              hint="Valor total em reais"
            >
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.value}
                onChange={(e) => updateField('value', e.target.value)}
                placeholder="0,00"
              />
              {formData.value && (
                <p className="mt-1 text-sm font-medium text-primary">
                  {formatCurrency(formData.value)}
                </p>
              )}
            </FormField>

            <FormField
              label="Responsável Comercial"
              required
              error={errors.accountManager}
              help="Gerente de contas responsável"
            >
              <Input
                value={formData.accountManager}
                onChange={(e) => updateField('accountManager', e.target.value)}
                placeholder="Ex: João da Silva"
              />
            </FormField>

            <InfoCard
              variant="info"
              title="Documentação Opcional"
              description="Você poderá anexar arquivos técnicos e comerciais na próxima etapa"
            />
          </div>
        </FormSection>
      </WizardStepContent>

      {/* Step 4: Revisão */}
      <WizardStepContent stepId="review" currentStepId={steps[wizard.currentStep].id}>
        <FormSection
          title="Revisão Final"
          description="Confira as informações antes de salvar"
          icon={<CheckCircle className="h-5 w-5" />}
        >
          <div className="space-y-6">
            {/* Informações Básicas */}
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <h4 className="mb-3 flex items-center gap-2 font-semibold text-foreground">
                <Building className="h-4 w-4" />
                Informações Básicas
              </h4>
              <dl className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Título:</dt>
                  <dd className="font-medium">{formData.title}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Cliente:</dt>
                  <dd className="font-medium">{formData.client}</dd>
                </div>
                {formData.clientEmail && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">E-mail:</dt>
                    <dd className="font-medium">{formData.clientEmail}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Valores */}
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <h4 className="mb-3 flex items-center gap-2 font-semibold text-foreground">
                <DollarSign className="h-4 w-4" />
                Valores
              </h4>
              <dl className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Valor Total:</dt>
                  <dd className="text-lg font-bold text-primary">
                    {formatCurrency(formData.value)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Responsável:</dt>
                  <dd className="font-medium">{formData.accountManager}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Validade:</dt>
                  <dd className="font-medium">
                    {new Date(formData.expiryDate).toLocaleDateString('pt-BR')}
                  </dd>
                </div>
              </dl>
            </div>

            <InfoCard
              variant="success"
              title="Pronto para salvar!"
              description="Clique em 'Concluir' para salvar a proposta. Você poderá editá-la posteriormente."
            />
          </div>
        </FormSection>
      </WizardStepContent>
    </FormWizard>
  );
}
