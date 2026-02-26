import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import React from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtext: string;
  variant?: 'default' | 'primary' | 'accent' | 'success';
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  icon, 
  title, 
  value, 
  subtext, 
  variant = 'default',
  className 
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'gradient-primary border-primary/20 hover:tech-glow';
      case 'accent':
        return 'gradient-accent border-accent-orange/20 hover:tech-glow-orange';
      case 'success':
        return 'bg-gradient-to-br from-card to-accent-green/10 border-accent-green/20 hover:shadow-[0_0_20px_hsl(var(--accent-green)/0.4)]';
      default:
        return 'gradient-card border-border/50 hover:tech-glow';
    }
  };

  const getIconClasses = () => {
    switch (variant) {
      case 'primary':
        return 'text-foreground dark:text-primary-foreground';
      case 'accent':
        return 'text-foreground dark:text-accent-foreground';
      case 'success':
        return 'text-accent-green';
      default:
        return 'text-primary';
    }
  };

  const getValueClasses = () => {
    switch (variant) {
      case 'primary':
        return 'text-foreground dark:text-primary-foreground';
      case 'accent':
        return 'text-foreground dark:text-accent-foreground';
      case 'success':
        return 'text-foreground';
      default:
        return 'text-foreground';
    }
  };

  const getTitleClasses = () => {
    switch (variant) {
      case 'primary':
        return 'text-foreground/80 dark:text-primary-foreground/80';
      case 'accent':
        return 'text-foreground/80 dark:text-accent-foreground/80';
      default:
        return 'text-muted-foreground';
    }
  };

  const getSubtextClasses = () => {
    switch (variant) {
      case 'primary':
        return 'text-muted-foreground dark:text-primary-foreground/70';
      case 'accent':
        return 'text-muted-foreground dark:text-accent-foreground/70';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Card className={cn(
      'glass-effect hover-lift transition-all duration-300 group',
      'border backdrop-blur-sm',
      getVariantClasses(),
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className={cn(
          "text-sm font-medium transition-colors duration-300",
          getTitleClasses()
        )}>
          {title}
        </CardTitle>
        <div className={cn(
          'transition-all duration-300 group-hover:scale-110',
          getIconClasses()
        )}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn(
          'text-2xl font-bold transition-colors duration-300',
          getValueClasses()
        )}>
          {value}
        </div>
        <p className={cn(
          'text-xs transition-colors duration-300',
          getSubtextClasses()
        )}>
          {subtext}
        </p>
      </CardContent>
    </Card>
  );
};

export default StatCard;
