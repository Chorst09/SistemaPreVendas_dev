import * as React from 'react';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  icon?: React.ReactNode;
  badge?: {
    label: string;
    variant?: 'default' | 'success' | 'warning' | 'danger';
  };
  actions?: React.ReactNode;
  backButton?: {
    label?: string;
    onClick: () => void;
  };
  className?: string;
}

export function PageHeader({
  title,
  description,
  eyebrow,
  icon,
  badge,
  actions,
  backButton,
  className,
}: PageHeaderProps) {
  const badgeVariants = {
    default: 'bg-primary/10 text-primary border-primary/20',
    success: 'bg-accent-green/10 text-accent-green border-accent-green/20',
    warning: 'bg-accent-yellow/10 text-accent-yellow border-accent-yellow/20',
    danger: 'bg-destructive/10 text-destructive border-destructive/20',
  };

  return (
    <div className={cn('space-y-4 pb-6', className)}>
      {/* Back Button */}
      {backButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={backButton.onClick}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {backButton.label || 'Voltar'}
        </Button>
      )}

      {/* Header Content */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          {icon && (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {icon}
            </div>
          )}
          <div className="space-y-2">
            {eyebrow && (
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {eyebrow}
              </p>
            )}
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {title}
              </h1>
              {badge && (
                <span
                  className={cn(
                    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                    badgeVariants[badge.variant || 'default']
                  )}
                >
                  {badge.label}
                </span>
              )}
            </div>
            {description && (
              <p className="text-base text-muted-foreground max-w-2xl">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SECTION HEADER - Para seções dentro de páginas
// ============================================================================

interface SectionHeaderProps {
  title: string;
  description?: string;
  badge?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  description,
  badge,
  actions,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          {badge && (
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
