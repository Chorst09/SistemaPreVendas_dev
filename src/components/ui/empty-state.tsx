import { ReactNode } from 'react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  primary?: boolean;
  icon?: ReactNode;
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  actions?: EmptyStateAction[];
  illustration?: string;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actions = [],
  illustration,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex min-h-[400px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/60 bg-muted/20 px-6 py-12 text-center',
        className
      )}
    >
      {/* Illustration or Icon */}
      {illustration ? (
        <div className="mb-6 h-48 w-48">
          <img
            src={illustration}
            alt=""
            className="h-full w-full object-contain opacity-60"
          />
        </div>
      ) : icon ? (
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {icon}
        </div>
      ) : null}

      {/* Content */}
      <div className="max-w-md space-y-3">
        <h3 className="text-xl font-semibold text-foreground">{title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>

      {/* Actions */}
      {actions.length > 0 && (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.primary ? 'default' : 'outline'}
              onClick={action.onClick}
              className="gap-2"
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
