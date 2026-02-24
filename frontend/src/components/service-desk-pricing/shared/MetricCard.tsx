'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  tooltip?: string;
  subtitle?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
  onClick?: () => void;
}

const variantStyles = {
  default: {
    card: 'border-gray-200 hover:border-gray-300',
    icon: 'text-gray-600 bg-gray-100',
    value: 'text-gray-900',
  },
  primary: {
    card: 'border-blue-200 hover:border-blue-300 bg-blue-50/30',
    icon: 'text-blue-600 bg-blue-100',
    value: 'text-blue-900',
  },
  success: {
    card: 'border-green-200 hover:border-green-300 bg-green-50/30',
    icon: 'text-green-600 bg-green-100',
    value: 'text-green-900',
  },
  warning: {
    card: 'border-yellow-200 hover:border-yellow-300 bg-yellow-50/30',
    icon: 'text-yellow-600 bg-yellow-100',
    value: 'text-yellow-900',
  },
  danger: {
    card: 'border-red-200 hover:border-red-300 bg-red-50/30',
    icon: 'text-red-600 bg-red-100',
    value: 'text-red-900',
  },
};

const trendIcons = {
  up: <TrendingUp className="h-3 w-3" />,
  down: <TrendingDown className="h-3 w-3" />,
  neutral: <Minus className="h-3 w-3" />,
};

const trendColors = {
  up: 'text-green-600 bg-green-50',
  down: 'text-red-600 bg-red-50',
  neutral: 'text-gray-600 bg-gray-50',
};

export function MetricCard({
  title,
  value,
  icon,
  change,
  trend,
  tooltip,
  subtitle,
  variant = 'default',
  className,
  onClick,
}: MetricCardProps) {
  const styles = variantStyles[variant];

  const CardWrapper = onClick ? 'button' : 'div';
  const cardProps = onClick ? { onClick, type: 'button' as const } : {};

  return (
    <Card
      className={cn(
        'transition-all hover:shadow-md',
        styles.card,
        onClick && 'cursor-pointer hover:scale-105',
        className
      )}
      {...(onClick ? { onClick } : {})}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-sm font-medium text-muted-foreground truncate">
                {title}
              </p>
              {tooltip && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">{tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            
            <div className="flex items-baseline gap-2 flex-wrap">
              <p className={cn('text-2xl font-bold truncate', styles.value)}>
                {value}
              </p>
              {change && trend && (
                <Badge
                  variant="secondary"
                  className={cn('text-xs font-medium', trendColors[trend])}
                >
                  {trendIcons[trend]}
                  <span className="ml-1">{change}</span>
                </Badge>
              )}
            </div>
            
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {subtitle}
              </p>
            )}
          </div>
          
          {icon && (
            <div className={cn('p-3 rounded-lg flex-shrink-0', styles.icon)}>
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
