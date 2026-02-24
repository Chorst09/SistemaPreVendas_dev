'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HelpCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface EnhancedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  tooltip?: string;
  error?: string;
  success?: string;
  helperText?: string;
  icon?: React.ReactNode;
  required?: boolean;
  showOptional?: boolean;
}

export function EnhancedInput({
  label,
  tooltip,
  error,
  success,
  helperText,
  icon,
  required = false,
  showOptional = false,
  className,
  ...props
}: EnhancedInputProps) {
  const hasError = !!error;
  const hasSuccess = !!success && !hasError;

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center gap-2">
          <Label htmlFor={props.id} className="text-sm font-medium">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
            {showOptional && !required && (
              <span className="text-muted-foreground text-xs ml-1">(opcional)</span>
            )}
          </Label>
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </div>
        )}
        
        <Input
          className={cn(
            icon && 'pl-10',
            (hasError || hasSuccess) && 'pr-10',
            hasError && 'border-red-500 dark:border-red-400 focus-visible:ring-red-500 dark:focus-visible:ring-red-400',
            hasSuccess && 'border-green-500 dark:border-green-400 focus-visible:ring-green-500 dark:focus-visible:ring-green-400',
            className
          )}
          {...props}
        />
        
        {hasError && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
          </div>
        )}
        
        {hasSuccess && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        )}
      </div>
      
      {(error || success || helperText) && (
        <div className="flex items-start gap-1.5">
          {error && (
            <>
              <AlertCircle className="h-3.5 w-3.5 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
            </>
          )}
          {success && !error && (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-green-500 dark:text-green-400">{success}</p>
            </>
          )}
          {helperText && !error && !success && (
            <p className="text-sm text-muted-foreground">{helperText}</p>
          )}
        </div>
      )}
    </div>
  );
}
