import * as React from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

interface FormSectionProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  required?: boolean;
  help?: string;
  className?: string;
}

export function FormSection({
  title,
  description,
  icon,
  children,
  collapsible = false,
  defaultExpanded = true,
  required = false,
  help,
  className,
}: FormSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultExpanded);

  const headerContent = (
    <div className="flex items-start gap-3">
      {icon && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
      )}
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-foreground">
            {title}
            {required && <span className="text-destructive">*</span>}
          </h3>
          {help && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p className="text-sm">{help}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {collapsible && (
        <ChevronDown
          className={cn(
            'h-5 w-5 text-muted-foreground transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      )}
    </div>
  );

  if (collapsible) {
    return (
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className={cn('space-y-4', className)}
      >
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-accent/5"
          >
            {headerContent}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="rounded-lg border border-border bg-card p-6">{children}</div>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="rounded-lg border border-border bg-card p-4">
        {headerContent}
      </div>
      <div className="rounded-lg border border-border bg-card p-6">{children}</div>
    </div>
  );
}

// ============================================================================
// FORM FIELD - Campo com label, hint e validação
// ============================================================================

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  hint?: string;
  error?: string;
  required?: boolean;
  help?: string;
  className?: string;
}

export function FormField({
  label,
  children,
  hint,
  error,
  required,
  help,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-destructive">*</span>}
        </label>
        {help && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p className="text-sm">{help}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      {children}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
