import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';

// ============================================================================
// ENHANCED CARD VARIANTS
// ============================================================================

interface EnhancedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'interactive' | 'accent' | 'success' | 'warning' | 'danger';
  hover?: boolean;
}

const EnhancedCard = React.forwardRef<HTMLDivElement, EnhancedCardProps>(
  ({ className, variant = 'default', hover = false, ...props }, ref) => {
    const variants = {
      default: 'border border-border bg-card',
      elevated:
        'border border-border/60 bg-gradient-to-br from-card to-card/80 shadow-lg hover:shadow-xl transition-shadow',
      interactive:
        'border border-border bg-card cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-primary/50',
      accent: 'border-l-4 border-l-primary border-t border-r border-b border-border bg-card',
      success:
        'border-l-4 border-l-accent-green border-t border-r border-b border-border bg-accent-green/5',
      warning:
        'border-l-4 border-l-accent-yellow border-t border-r border-b border-border bg-accent-yellow/5',
      danger:
        'border-l-4 border-l-destructive border-t border-r border-b border-border bg-destructive/5',
    };

    const hoverClasses = hover
      ? 'transition-all duration-300 hover:-translate-y-1 hover:shadow-lg'
      : '';

    return (
      <div
        ref={ref}
        className={cn('rounded-xl', variants[variant], hoverClasses, className)}
        {...props}
      />
    );
  }
);
EnhancedCard.displayName = 'EnhancedCard';

// ============================================================================
// METRIC CARD - Para KPIs e estatísticas
// ============================================================================

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    trend: 'up' | 'down' | 'neutral';
  };
  icon?: React.ReactNode;
  description?: string;
  className?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

function MetricCard({
  title,
  value,
  change,
  icon,
  description,
  className,
  variant = 'default',
}: MetricCardProps) {
  const trendColors = {
    up: 'text-accent-green',
    down: 'text-destructive',
    neutral: 'text-muted-foreground',
  };

  const variantStyles = {
    default: '',
    primary: 'border-l-4 border-l-primary',
    success: 'border-l-4 border-l-accent-green',
    warning: 'border-l-4 border-l-accent-yellow',
    danger: 'border-l-4 border-l-destructive',
  };

  return (
    <Card className={cn('relative overflow-hidden', variantStyles[variant], className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardDescription className="text-xs font-medium uppercase tracking-wide">
            {title}
          </CardDescription>
          {icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="text-3xl font-bold tracking-tight text-foreground">{value}</div>
          {(change || description) && (
            <div className="flex items-center gap-2 text-sm">
              {change && (
                <span className={cn('font-medium', trendColors[change.trend])}>
                  {change.trend === 'up' && '↗'} {change.trend === 'down' && '↘'}{' '}
                  {change.value}
                </span>
              )}
              {description && (
                <span className="text-muted-foreground">{description}</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// STAT CARD - Versão compacta para estatísticas
// ============================================================================

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  className?: string;
}

function StatCard({ label, value, icon, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/5',
        className
      )}
    >
      {icon && (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-muted-foreground">{label}</p>
        <p className="truncate text-2xl font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}

// ============================================================================
// INFO CARD - Para destaque de informações importantes
// ============================================================================

interface InfoCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'danger';
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

function InfoCard({
  title,
  description,
  icon,
  variant = 'info',
  action,
  className,
}: InfoCardProps) {
  const variantStyles = {
    info: 'border-primary/20 bg-primary/5',
    success: 'border-accent-green/20 bg-accent-green/5',
    warning: 'border-accent-yellow/20 bg-accent-yellow/5',
    danger: 'border-destructive/20 bg-destructive/5',
  };

  const iconColors = {
    info: 'text-primary',
    success: 'text-accent-green',
    warning: 'text-accent-yellow',
    danger: 'text-destructive',
  };

  return (
    <div
      className={cn(
        'flex gap-4 rounded-lg border p-4',
        variantStyles[variant],
        className
      )}
    >
      {icon && (
        <div className={cn('shrink-0', iconColors[variant])}>{icon}</div>
      )}
      <div className="flex-1 space-y-1">
        <h4 className="font-semibold text-foreground">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
        {action && (
          <button
            onClick={action.onClick}
            className="mt-2 text-sm font-medium underline-offset-4 hover:underline"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}

export {
  EnhancedCard,
  MetricCard,
  StatCard,
  InfoCard,
  type EnhancedCardProps,
  type MetricCardProps,
  type StatCardProps,
  type InfoCardProps,
};
