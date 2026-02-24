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
    card: 'bg-white dark:bg-gray-900 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600',
    active: 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-950',
    icon: 'text-blue-600 dark:text-blue-300 bg-blue-100 dark:bg-blue-900',
    badge: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
  },
  purple: {
    card: 'bg-white dark:bg-gray-900 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600',
    active: 'border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-950',
    icon: 'text-purple-600 dark:text-purple-300 bg-purple-100 dark:bg-purple-900',
    badge: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
  },
  green: {
    card: 'bg-white dark:bg-gray-900 border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600',
    active: 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-950',
    icon: 'text-green-600 dark:text-green-300 bg-green-100 dark:bg-green-900',
    badge: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
  },
  orange: {
    card: 'bg-white dark:bg-gray-900 border-orange-200 dark:border-orange-800 hover:border-orange-400 dark:hover:border-orange-600',
    active: 'border-orange-500 dark:border-orange-400 bg-orange-50 dark:bg-orange-950',
    icon: 'text-orange-600 dark:text-orange-300 bg-orange-100 dark:bg-orange-900',
    badge: 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300',
  },
  red: {
    card: 'bg-white dark:bg-gray-900 border-red-200 dark:border-red-800 hover:border-red-400 dark:hover:border-red-600',
    active: 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-950',
    icon: 'text-red-600 dark:text-red-300 bg-red-100 dark:bg-red-900',
    badge: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
  },
  gray: {
    card: 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600',
    active: 'border-gray-500 dark:border-gray-400 bg-gray-50 dark:bg-gray-900',
    icon: 'text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800',
    badge: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
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
