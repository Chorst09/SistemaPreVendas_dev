import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface MiniMetricProps {
  label: string;
  value: string | number;
  icon: React.ReactElement<LucideIcon>;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  subtitle?: string;
  className?: string;
}

/**
 * MiniMetric - Indicador compacto para métricas secundárias
 * 
 * Componente minimalista otimizado para alta densidade de informação
 * sem poluição visual. Ideal para grids com 6+ indicadores secundários.
 */
export function MiniMetric({
  label,
  value,
  icon,
  variant = 'default',
  subtitle,
  className,
}: MiniMetricProps) {
  const variantStyles = {
    default: 'bg-muted/50 text-muted-foreground',
    success: 'bg-accent-green/10 text-accent-green',
    warning: 'bg-accent-yellow/10 text-accent-yellow',
    danger: 'bg-destructive/10 text-destructive',
    info: 'bg-primary/10 text-primary',
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-all hover:shadow-sm',
        className
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-md',
          variantStyles[variant]
        )}
      >
        {icon}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-lg font-bold text-foreground">{value}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
