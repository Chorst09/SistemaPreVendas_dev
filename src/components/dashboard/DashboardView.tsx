"use client"
import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Briefcase, Calendar, DollarSign, Users } from 'lucide-react'
import type { Partner, RO } from '@/lib/types'
import StatCard from './StatCard'
import SalesChart from './SalesChart'
import QuoteStatusChart from './QuoteStatusChart'
import RoDashboardView from './RoDashboardView'
import { RoChartsView } from './RoChartsView'
import '@/components/dashboard/viz.css'

interface DashboardViewProps {
    partners: Partner[]
    salesData: any[]
    quoteStatusData: any[]
    ros: RO[]
}

type Period = '7d' | '30d' | '90d' | '1y'

const PERIODS: Period[] = ['7d', '30d', '90d', '1y']

const PERIOD_LABELS: Record<Period, string> = {
    '7d': '7 dias',
    '30d': '30 dias',
    '90d': '90 dias',
    '1y': '1 ano',
}

const DashboardView: React.FC<DashboardViewProps> = ({ partners, salesData, quoteStatusData, ros }) => {
    const [period, setPeriod] = useState<Period>('30d')

    const last = salesData[salesData.length - 1]
    const prev = salesData[salesData.length - 2]

    const orcamentosDelta = last && prev ? Number(last.Orçamentos) - Number(prev.Orçamentos) : 0
    const vendasDelta = last && prev ? Number(last.Vendas) - Number(prev.Vendas) : 0

    const totalPipeline = useMemo(
        () => quoteStatusData.reduce((sum, d) => sum + Number(d.value || 0), 0),
        [quoteStatusData],
    )
    const aprovados = useMemo(
        () => Number((quoteStatusData.find((d) => d.name === 'Aprovado')?.value) || 0),
        [quoteStatusData],
    )

    const formatCurrency = (v: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

    const orcamentosDeltaLabel = {
        value: `${orcamentosDelta > 0 ? '+' : ''}${orcamentosDelta}`,
        positive: orcamentosDelta >= 0,
        good: true,
        label: 'vs. período anterior',
    } as const

    const vendasDeltaLabel = {
        value: `${vendasDelta > 0 ? '+' : ''}${vendasDelta}`,
        positive: vendasDelta >= 0,
        good: true,
        label: 'vs. período anterior',
    } as const

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="viz space-y-8"
        >
            {/* Filtros — uma única linha acima dos gráficos */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Período</span>
                </div>
                <div className="flex w-full sm:w-auto inline-flex items-center rounded-lg border border-border bg-card/60 px-1">
                    {PERIODS.map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                period === p
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'text-muted-foreground hover:bg-muted/50'
                            }`}
                        >
                            {PERIOD_LABELS[p]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Linha de KPIs */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.08 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
                <StatCard
                    icon={<Briefcase className="w-6 h-6" />}
                    title="Orçamentos no mês"
                    value={last?.Orçamentos ?? 0}
                    subtext="Novos orçamentos criados"
                    delta={orcamentosDeltaLabel}
                    trend={salesData.map((d) => Number(d.Orçamentos || 0))}
                    variant="primary"
                />
                <StatCard
                    icon={<DollarSign className="w-6 h-6" />}
                    title="Vendas convertidas"
                    value={last?.Vendas ?? 0}
                    subtext="Orçamentos fechados no período"
                    delta={vendasDeltaLabel}
                    trend={salesData.map((d) => Number(d.Vendas || 0))}
                    variant="success"
                />
                <StatCard
                    icon={<Users className="w-6 h-6" />}
                    title="Total de parceiros"
                    value={partners.length}
                    subtext="Distribuidores e fornecedores"
                    variant="default"
                />
                <StatCard
                    icon={<Calendar className="w-6 h-6" />}
                    title="Valor no pipeline"
                    value={formatCurrency(totalPipeline)}
                    subtext={
                        aprovados > 0
                            ? `${formatCurrency(aprovados)} aprovados`
                            : 'Somatório dos status'
                    }
                    variant="accent"
                />
            </motion.div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3">
                    <SalesChart data={salesData} />
                </div>
                <div className="lg:col-span-2">
                    <QuoteStatusChart data={quoteStatusData} />
                </div>
            </div>

            {/* Registro de Oportunidades */}
            <div className="space-y-8">
                <RoDashboardView ros={ros} partners={partners} />
                <RoChartsView ros={ros} partners={partners} />
            </div>
        </motion.div>
    )
}

export default DashboardView
