"use client"
import React from 'react'
import { Area, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface SalesChartProps {
  data: any[]
}

export default function SalesChart({ data }: SalesChartProps) {
  return (
    <Card variant="premium" className="glass-effect hover-lift h-full viz">
      <CardHeader>
        <CardTitle className="text-foreground">Performance de Vendas</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 8, right: 22, bottom: 8, left: 0 }}>
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
              cursor={{ stroke: 'hsl(var(--border))', strokeDasharray: '2 2' }}
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                color: 'hsl(var(--foreground))',
                borderRadius: 'var(--radius)',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '13px' }} />
            {/* Contexto: Orçamentos (cinza, sem ênfase) — uma cor, tom de destaque secundário */}
            <Line
              type="monotone"
              dataKey="Orçamentos"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={1.5}
              dot={false}
              name="Orçamentos"
            />
            {/* Ênfase: Vendas (azul validado) com preenchimento suave (~10%) */}
            <Area type="monotone" dataKey="Vendas" fill="var(--viz-1)" fillOpacity={0.1} />
            <Line
              type="monotone"
              dataKey="Vendas"
              stroke="var(--viz-1)"
              strokeWidth={2.5}
              dot={{ fill: 'var(--viz-1)', stroke: '#ffffff', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: 'var(--viz-1)', stroke: '#ffffff', strokeWidth: 2 }}
              name="Vendas"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
