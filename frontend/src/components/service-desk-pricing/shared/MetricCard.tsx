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
    card: 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
    icon: 'text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800',
    value: 'text-gray-900 dark:text-gray-100',
  },
  primary: {
    card: 'bg-white dark:bg-gray-900 border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700',
    icon: 'text-blue-600 dark:text-blue-300 bg-blue-100 dark:bg-blue-900',
    value: 'text-blue-900 dark:text-blue-100',
  },
  success: {
    card: 'bg-white dark:bg-gray-900 border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700',
    icon: 'text-green-600 dark:text-green-300 bg-green-100 dark:bg-green-900',
    value: 'text-green-900 dark:text-green-100',
  },
  warning: {
    card: 'bg-white dark:bg-gray-900 border-yellow-200 dark:border-yellow-800 hover:border-yellow-300 dark:hover:border-yellow-700',
    icon: 'text-yellow-600 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900',
    value: 'text-yellow-900 dark:text-yellow-100',
  },
  danger: {
    card: 'bg-white dark:bg-gray-900 border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700',
    icon: 'text-red-600 dark:text-red-300 bg-red-100 dark:bg-red-900',
    value: 'text-red-900 dark:text-red-100',
  },
};

const trendIcons = {
  up: <TrendingUp className="h-3 w-3" />,
  down: <TrendingDown className="h-3 w-3" />,
  neutral: <Minus className="h-3 w-3" />,
};

const trendColors = {
  up: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950',
  down: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950',
  neutral: 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900',
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
