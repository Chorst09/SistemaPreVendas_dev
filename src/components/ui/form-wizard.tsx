'use client';

import * as React from 'react';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { Button } from './button';
import { Progress } from './progress';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  optional?: boolean;
}

export interface FormWizardProps {
  steps: WizardStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onComplete?: () => void;
  onCancel?: () => void;
  children: React.ReactNode;
  isSubmitting?: boolean;
  canGoNext?: boolean;
  canGoPrevious?: boolean;
  className?: string;
}

// ============================================================================
// FORM WIZARD
// ============================================================================

export function FormWizard({
  steps,
  currentStep,
  onStepChange,
  onComplete,
  onCancel,
  children,
  isSubmitting = false,
  canGoNext = true,
  canGoPrevious = true,
  className,
}: FormWizardProps) {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (isLastStep && onComplete) {
      onComplete();
    } else if (currentStep < steps.length - 1) {
      onStepChange(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      onStepChange(currentStep - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    // Só permite navegar para steps anteriores ou o próximo step
    if (stepIndex <= currentStep || stepIndex === currentStep + 1) {
      onStepChange(stepIndex);
    }
  };

  return (
    <div className={cn('space-y-8', className)}>
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">
            Etapa {currentStep + 1} de {steps.length}
          </span>
          <span className="text-muted-foreground">{Math.round(progress)}% completo</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Steps Navigation */}
      <div className="relative">
        <div className="flex justify-between">
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            const isAccessible = index <= currentStep || index === currentStep + 1;

            return (
              <div key={step.id} className="flex flex-1 flex-col items-center">
                {/* Step Circle */}
                <button
                  type="button"
                  onClick={() => handleStepClick(index)}
                  disabled={!isAccessible}
                  className={cn(
                    'relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all',
                    isCompleted && 'border-primary bg-primary text-primary-foreground',
                    isActive && 'border-primary bg-background text-primary',
                    !isActive &&
                      !isCompleted &&
                      'border-border bg-muted text-muted-foreground',
                    isAccessible && 'cursor-pointer hover:scale-110',
                    !isAccessible && 'cursor-not-allowed opacity-50'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : step.icon ? (
                    <div className="h-5 w-5">{step.icon}</div>
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </button>

                {/* Step Label */}
                <div className="mt-2 text-center">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      isActive && 'text-foreground',
                      !isActive && 'text-muted-foreground'
                    )}
                  >
                    {step.title}
                    {step.optional && (
                      <span className="ml-1 text-xs">(opcional)</span>
                    )}
                  </p>
                  {step.description && isActive && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {step.description}
                    </p>
                  )}
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'absolute top-6 h-0.5 w-full -translate-y-1/2',
                      index < currentStep ? 'bg-primary' : 'bg-border'
                    )}
                    style={{
                      left: `${(100 / steps.length) * (index + 0.5)}%`,
                      width: `${100 / steps.length}%`,
                      zIndex: 0,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="rounded-xl border border-border bg-card p-6">{children}</div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
          )}
          {!isFirstStep && (
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={!canGoPrevious || isSubmitting}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Anterior
            </Button>
          )}
        </div>

        <Button
          type="button"
          onClick={handleNext}
          disabled={!canGoNext || isSubmitting}
          className="gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : isLastStep ? (
            <>
              Concluir
              <Check className="h-4 w-4" />
            </>
          ) : (
            <>
              Próximo
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// WIZARD STEP CONTENT WRAPPER
// ============================================================================

interface WizardStepContentProps {
  stepId: string;
  currentStepId: string;
  children: React.ReactNode;
}

export function WizardStepContent({
  stepId,
  currentStepId,
  children,
}: WizardStepContentProps) {
  if (stepId !== currentStepId) return null;

  return (
    <div className="animate-in fade-in-50 slide-in-from-bottom-5 duration-300">
      {children}
    </div>
  );
}

// ============================================================================
// HOOK PARA GERENCIAR WIZARD
// ============================================================================

export function useFormWizard(totalSteps: number, initialStep = 0) {
  const [currentStep, setCurrentStep] = React.useState(initialStep);
  const [completedSteps, setCompletedSteps] = React.useState<Set<number>>(
    new Set()
  );
  const [visitedSteps, setVisitedSteps] = React.useState<Set<number>>(
    new Set([initialStep])
  );

  const goToStep = React.useCallback((step: number) => {
    if (step >= 0 && step < totalSteps) {
      setCurrentStep(step);
      setVisitedSteps((prev) => new Set([...prev, step]));
    }
  }, [totalSteps]);

  const nextStep = React.useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCompletedSteps((prev) => new Set([...prev, currentStep]));
      goToStep(currentStep + 1);
    }
  }, [currentStep, totalSteps, goToStep]);

  const previousStep = React.useCallback(() => {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  }, [currentStep, goToStep]);

  const reset = React.useCallback(() => {
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setVisitedSteps(new Set([0]));
  }, []);

  const isStepCompleted = React.useCallback(
    (step: number) => completedSteps.has(step),
    [completedSteps]
  );

  const isStepVisited = React.useCallback(
    (step: number) => visitedSteps.has(step),
    [visitedSteps]
  );

  return {
    currentStep,
    completedSteps,
    visitedSteps,
    goToStep,
    nextStep,
    previousStep,
    reset,
    isStepCompleted,
    isStepVisited,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === totalSteps - 1,
    progress: ((currentStep + 1) / totalSteps) * 100,
  };
}
