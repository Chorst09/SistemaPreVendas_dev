"use client"
import React from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface QuoteStatusChartProps {
  data: any[]
}

export default function QuoteStatusChart({ data }: QuoteStatusChartProps) {
  return (
    <Card variant="premium" className="glass-effect hover-lift h-full viz">
      <CardHeader>
        <CardTitle className="text-foreground">Status dos Orçamentos</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 8, right: 22, bottom: 24, left: 0 }}>
            {/* Grid: cabelo, sólido, recedente (nunca tracejado) */}
            <CartesianGrid stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              hide={true}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                color: 'hsl(var(--foreground))',
                borderRadius: 'var(--radius)',
              }}
            />
            {/* Série única: uma cor validada (slot 1), título nomeia a série.
                 Barras finas, ponta arredondada, base quadrada; valor na haste. */}
            <Bar
              dataKey="value"
              fill="var(--viz-1)"
              radius={[4, 4, 0, 0]}
              label={{ position: 'top', offset: 4, fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 600 }}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
