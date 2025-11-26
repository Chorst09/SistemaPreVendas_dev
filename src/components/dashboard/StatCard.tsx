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
    // Variantes específicas para cards coloridos (primary, accent, success)
    switch (variant) {
      case 'primary':
        return 'gradient-primary border-primary/20 hover:tech-glow';
      case 'accent':
        return 'gradient-accent border-accent-orange/20 hover:tech-glow-orange';
      case 'success':
        return 'bg-gradient-to-br from-card to-accent-green/10 border-accent-green/20 hover:shadow-[0_0_20px_hsl(var(--accent-green)/0.4)]';
      default:
        return ''; // Premium variant é aplicado via Card component
    }
  };

  const getIconClasses = () => {
    switch (variant) {
      case 'primary':
        return 'text-primary-foreground';
      case 'accent':
        return 'text-accent-foreground';
      case 'success':
        return 'text-accent-green';
      default:
        return 'text-accent-green';
    }
  };

  const getValueClasses = () => {
    switch (variant) {
      case 'primary':
        return 'text-primary-foreground';
      case 'accent':
        return 'text-accent-foreground';
      case 'success':
        return 'text-foreground';
      default:
        return 'text-foreground';
    }
  };

  // Use premium variant for default/success, but use specific variants for primary/accent
  const cardVariant = (variant === 'primary' || variant === 'accent') ? 'default' : 'premium';
  
  return (
    <Card variant={cardVariant} className={cn(
      'glass-effect hover-lift transition-all duration-300 group',
      'backdrop-blur-sm',
      getVariantClasses(),
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className={cn(
          "text-sm font-medium transition-colors duration-300",
          variant === 'primary' || variant === 'accent' 
            ? 'text-primary-foreground/80' 
            : variant === 'success'
            ? 'text-muted-foreground'
            : 'text-cyan-400' // Premium/default cards get cyan title
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
          variant === 'primary' || variant === 'accent' 
            ? 'text-primary-foreground/70' 
            : 'text-muted-foreground'
        )}>
          {subtext}
        </p>
      </CardContent>
    </Card>
  );
};

export default StatCard;
