'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Clock
} from 'lucide-react';

interface SimpleTabButtonProps {
  id: string;
  label: string;
  shortLabel?: string;
  index: number;
  isActive: boolean;
  canAccess: boolean;
  status: 'valid' | 'invalid' | 'warning' | 'pending';
  validationData?: {
    errors: any[];
    warnings: any[];
    completionPercentage: number;
  };
  onClick: () => void;
  tooltip?: string;
}

export function SimpleTabButton({
  id,
  label,
  shortLabel,
  index,
  isActive,
  canAccess,
  status,
  validationData,
  onClick,
  tooltip
}: SimpleTabButtonProps) {
  // Get status icon
  const getStatusIcon = () => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'invalid':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  // Get status badge
  const getStatusBadge = () => {
    switch (status) {
      case 'valid':
        return <Badge variant="default" className="ml-2 bg-green-500 text-white">✓</Badge>;
      case 'invalid':
        return (
          <Badge variant="destructive" className="ml-2">
            {validationData?.errors.length || '!'}
          </Badge>
        );
      case 'warning':
        return (
          <Badge variant="secondary" className="ml-2 bg-yellow-500 text-white">
            {validationData?.warnings.length || '⚠'}
          </Badge>
        );
      default:
        return validationData?.completionPercentage ? (
          <Badge variant="outline" className="ml-2">
            {Math.round(validationData.completionPercentage)}%
          </Badge>
        ) : null;
    }
  };

  const baseClasses = `
    group inline-flex items-center justify-between whitespace-nowrap rounded-full text-xs font-semibold
    ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 
    focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none 
    h-10 px-4 min-w-[9rem] max-w-[12rem] shadow-sm backdrop-blur-sm
  `;

  const variantClasses = isActive 
    ? 'bg-gradient-to-r from-primary/90 via-primary/80 to-[hsl(var(--accent-cyan))]/80 text-primary-foreground shadow-lg shadow-primary/25'
    : 'bg-background/80 border border-border/60 hover:border-primary/40 hover:bg-primary/5 text-foreground/90';

  const statusClasses = `
    ${isActive ? 'ring-2 ring-primary/70 ring-offset-2' : ''}
    ${!canAccess ? 'opacity-50 cursor-not-allowed' : ''}
    ${status === 'invalid' ? 'border-red-300/70 hover:border-red-400/80' : ''}
    ${status === 'warning' ? 'border-yellow-300/70 hover:border-yellow-400/80' : ''}
    ${status === 'valid' ? 'border-green-300/70 hover:border-green-400/80' : ''}
  `;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!canAccess}
      title={tooltip}
      aria-pressed={isActive}
      className={`${baseClasses} ${variantClasses} ${statusClasses}`}
    >
      <span className="flex items-center space-x-2 text-foreground/80">
        <span className="text-[11px] font-semibold pill-soft px-2 py-0.5 rounded-full border border-border/60">
          {index + 1}
        </span>
        <span className="shrink-0">{getStatusIcon()}</span>
      </span>
      <span className="truncate text-[11px]">
        {shortLabel || label}
      </span>
      {getStatusBadge()}
    </button>
  );
}
