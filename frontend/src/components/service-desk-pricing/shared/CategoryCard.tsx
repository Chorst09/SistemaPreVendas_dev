'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CategoryCardProps {
  title: string;
  icon: React.ReactNode;
  total: number;
  items: number;
  color?: 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'gray';
  onClick?: () => void;
  active?: boolean;
  className?: string;
}

const colorStyles = {
  blue: {
    card: 'border-blue-200 hover:border-blue-400 hover:bg-blue-50/50',
    active: 'border-blue-500 bg-blue-50',
    icon: 'text-blue-600 bg-blue-100',
    badge: 'bg-blue-100 text-blue-700',
  },
  purple: {
    card: 'border-purple-200 hover:border-purple-400 hover:bg-purple-50/50',
    active: 'border-purple-500 bg-purple-50',
    icon: 'text-purple-600 bg-purple-100',
    badge: 'bg-purple-100 text-purple-700',
  },
  green: {
    card: 'border-green-200 hover:border-green-400 hover:bg-green-50/50',
    active: 'border-green-500 bg-green-50',
    icon: 'text-green-600 bg-green-100',
    badge: 'bg-green-100 text-green-700',
  },
  orange: {
    card: 'border-orange-200 hover:border-orange-400 hover:bg-orange-50/50',
    active: 'border-orange-500 bg-orange-50',
    icon: 'text-orange-600 bg-orange-100',
    badge: 'bg-orange-100 text-orange-700',
  },
  red: {
    card: 'border-red-200 hover:border-red-400 hover:bg-red-50/50',
    active: 'border-red-500 bg-red-50',
    icon: 'text-red-600 bg-red-100',
    badge: 'bg-red-100 text-red-700',
  },
  gray: {
    card: 'border-gray-200 hover:border-gray-400 hover:bg-gray-50/50',
    active: 'border-gray-500 bg-gray-50',
    icon: 'text-gray-600 bg-gray-100',
    badge: 'bg-gray-100 text-gray-700',
  },
};

export function CategoryCard({
  title,
  icon,
  total,
  items,
  color = 'blue',
  onClick,
  active = false,
  className,
}: CategoryCardProps) {
  const styles = colorStyles[color];

  return (
    <Card
      className={cn(
        'border-2 transition-all cursor-pointer hover:shadow-lg',
        active ? styles.active : styles.card,
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={cn('p-3 rounded-lg', styles.icon)}>
            {icon}
          </div>
          <Badge variant="secondary" className={styles.badge}>
            {items} {items === 1 ? 'item' : 'itens'}
          </Badge>
        </div>
        
        <h3 className="font-semibold text-lg mb-2 text-foreground">
          {title}
        </h3>
        
        <p className="text-2xl font-bold text-foreground">
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(total)}
        </p>
        
        <p className="text-xs text-muted-foreground mt-1">
          Total da categoria
        </p>
      </CardContent>
    </Card>
  );
}
