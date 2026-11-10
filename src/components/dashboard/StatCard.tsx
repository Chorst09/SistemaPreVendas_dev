"use client"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import React from 'react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'

export interface StatCardDelta {
  value: string
  label?: string
  positive?: boolean   // direção da variação
  good?: boolean       // se a direção positiva é favorável
}

export interface StatCardProps {
  icon: React.ReactNode
  title: string
  value: string | number
  subtext: string
  variant?: 'default' | 'primary' | 'accent' | 'success'
  delta?: StatCardDelta
  trend?: number[]     // pontos do sparkline
  className?: string
}

const VARIANT_ICON: Record<string, string> = {
  primary: 'text-primary',
  accent: 'text-accent-orange',
  success: 'text-accent-green',
  default: 'text-accent-green',
}

/* Sparkline enxuto: 12 pontos, cor de ênfase secundária. */
function Sparkline({ data }: { data: number[] }) {
  if (!data || data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 100
      const y = 100 - ((v - min) / range) * 100
      return `${x},${y}`
    })
    .join(' ')
  return (
    <svg className="w-full h-5" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points={points} className="text-muted-foreground/60" />
    </svg>
  )
}

export default function StatCard({
  icon,
  title,
  value,
  subtext,
  variant = 'default',
  delta,
  trend,
  className,
}: StatCardProps) {
  const iconClass = VARIANT_ICON[variant] ?? VARIANT_ICON.default
  const hasDelta = !!delta
  const isGoodDelta = hasDelta ? (delta.positive ?? true) === (delta.good ?? true) : true
  const deltaColor = isGoodDelta ? 'text-accent-green' : 'text-destructive'
  const TrendIcon = hasDelta ? ((delta.positive ?? true) ? TrendingUp : TrendingDown) : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -4 }}
      className={cn('glass-effect', className)}
    >
      <Card className="border border-border/60 bg-card/80 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className={cn(
            'text-sm font-medium',
            variant === 'primary' || variant === 'accent' ? 'text-primary-foreground/80' : 'text-muted-foreground'
          )}>
            {title}
          </CardTitle>
          <div className={cn('p-2 rounded-lg transition-colors duration-300', iconClass)}>
            {icon}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-baseline gap-2">
            {/* Hero figure: algarismos proporcionais (sem tabular-nums) */}
            <span className="text-3xl font-bold text-foreground tracking-tight">{value}</span>
            {hasDelta && (
              <span className="text-xs font-semibold flex items-center gap-1">
                <TrendIcon className="h-3 w-3" />
                <span className={cn(deltaColor, 'font-medium')}>{delta.value}</span>
                {delta.label && <span className="text-muted-foreground/70"> {delta.label}</span>}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
          {trend && trend.length >= 2 && (
            <div className="mt-2 h-5 w-full">
              <Sparkline data={trend} />
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
