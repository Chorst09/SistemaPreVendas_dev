"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  TrendingUp, TrendingDown, DollarSign, BarChart3, FileText,
  Download, Printer, AlertTriangle, CheckCircle, Info,
  ArrowUpRight, ArrowDownRight, Minus, Calendar, Search,
  ChevronDown, ChevronRight, Building,
} from "lucide-react"
import { useProposalStore } from "@/lib/stores/proposal-store"
import { useConfigurationStore } from "@/lib/stores/configuration-store"
import type { ProposalData } from "@/lib/types/proposals"

// ─── Formatadores ─────────────────────────────────────────────────────────────

const fmtR = (v: number, digits = 0) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: digits })

const fmtPct = (v: number) => `${v.toFixed(2)}%`

const fmtSign = (v: number) =>
  v >= 0
    ? <span className="text-emerald-400">{fmtR(v)}</span>
    : <span className="text-red-400">({fmtR(Math.abs(v))})</span>

// ─── Tipos internos ───────────────────────────────────────────────────────────

interface DRELine {
  label: string
  value: number
  pct?: number        // % sobre Receita Bruta
  indent?: number     // 0=grupo, 1=subitem, 2=detalhe
  bold?: boolean
  separator?: boolean
  highlight?: "green" | "red" | "amber" | "blue"
}

interface MonthData {
  month: string
  receita: number
  deducoes: number
  cmv: number
  despOp: number
  ebitda: number
  ircsll: number
  lucroLiq: number
}

// ─── Engine de cálculo do DRE ─────────────────────────────────────────────────

function useDRE(proposals: ProposalData[], period: string) {
  const { costsExpenses, laborCosts, getActiveTaxRegime } = useConfigurationStore()
  const regime = getActiveTaxRegime()

  return useMemo(() => {
    // Filtrar por período e status aprovados (completed + active)
    const approved = proposals.filter(p => {
      if (p.status !== "completed" && p.status !== "active") return false
      if (period === "all") return true
      const created = new Date(p.createdAt)
      const year  = created.getFullYear()
      const month = created.getMonth() + 1
      if (period === "year") return year === new Date().getFullYear()
      if (period === "quarter") {
        const now = new Date()
        const q = Math.floor((now.getMonth()) / 3)
        const pq = Math.floor((month - 1) / 3)
        return year === now.getFullYear() && pq === q
      }
      if (period === "month") {
        const now = new Date()
        return year === now.getFullYear() && month === now.getMonth() + 1
      }
      return true
    })

    // ── Receita Bruta ──────────────────────────────────────────────────────
    const receitaVendas    = approved.filter(p => p.budgets.some(b => b.module === "sales"))
      .reduce((s, p) => s + p.budgets.filter(b => b.module === "sales").reduce((x, b) => x + b.totalValue, 0), 0)
    const receitaLocacao   = approved.filter(p => p.budgets.some(b => b.module === "rental"))
      .reduce((s, p) => s + p.budgets.filter(b => b.module === "rental").reduce((x, b) => x + b.totalValue, 0), 0)
    const receitaServicos  = approved.filter(p => p.budgets.some(b => b.module === "services"))
      .reduce((s, p) => s + p.budgets.filter(b => b.module === "services").reduce((x, b) => x + b.totalValue, 0), 0)
    const receitaBruta     = receitaVendas + receitaLocacao + receitaServicos

    // ── Deduções da Receita ────────────────────────────────────────────────
    let pisPct = 0, cofinsPct = 0, issPct = 0, simplesAnexoPct = 0, ivaPct = 0

    if (regime) {
      if (regime.type === "presumido" || regime.type === "real") {
        pisPct    = regime.pis
        cofinsPct = regime.cofins
        issPct    = receitaServicos > 0 ? regime.iss : 0
      } else if (regime.type === "simples") {
        simplesAnexoPct = receitaServicos > 0 ? regime.anexoIII : regime.anexoI
      } else if (regime.type === "iva") {
        ivaPct = regime.ivaTotal
      }
    }

    const dedPis      = receitaBruta * (pisPct / 100)
    const dedCofins   = receitaBruta * (cofinsPct / 100)
    const dedIss      = receitaServicos * (issPct / 100)
    const dedSimples  = receitaBruta * (simplesAnexoPct / 100)
    const dedIva      = receitaBruta * (ivaPct / 100)
    const totalDedRec = dedPis + dedCofins + dedIss + dedSimples + dedIva
    const receitaLiq  = receitaBruta - totalDedRec

    // ── CMV / Custo dos Serviços Prestados ────────────────────────────────
    const cmvComissaoVenda    = receitaVendas   * ((costsExpenses?.comissaoVenda    || 0) / 100)
    const cmvComissaoLocacao  = receitaLocacao  * ((costsExpenses?.comissaoLocacao  || 0) / 100)
    const cmvComissaoServico  = receitaServicos * ((costsExpenses?.comissaoServico  || 0) / 100)
    // Custo hora × horas estimadas: aprox 160h/mês × nº propostas de serviço
    const servicePropCount    = approved.filter(p => p.budgets.some(b => b.module === "services")).length
    const cmvMaoDeObra        = servicePropCount * (laborCosts?.custoHora || 0) * 160
    const totalCMV            = cmvComissaoVenda + cmvComissaoLocacao + cmvComissaoServico + cmvMaoDeObra
    const lucroBruto          = receitaLiq - totalCMV
    const margemBruta         = receitaBruta > 0 ? (lucroBruto / receitaBruta) * 100 : 0

    // ── Despesas Operacionais ─────────────────────────────────────────────
    const despAdmin   = receitaBruta * ((costsExpenses?.despesasAdmin   || 0) / 100)
    const despOutras  = receitaBruta * ((costsExpenses?.outrasDespesas  || 0) / 100)
    const despFinanc  = receitaBruta * ((costsExpenses?.custoFinanceiroMensal || 0) / 100)
    const despDeprec  = receitaBruta * ((costsExpenses?.depreciacao    || 0) / 100)
    const totalDespOp = despAdmin + despOutras + despFinanc + despDeprec
    const ebitda      = lucroBruto - totalDespOp
    const margemEbitda = receitaBruta > 0 ? (ebitda / receitaBruta) * 100 : 0

    // ── Resultado Financeiro ──────────────────────────────────────────────
    // Já incluso em despFinanc acima; aqui saldo líquido
    const resultFinanc  = -despFinanc
    const ebit          = ebitda
    const resultAntesIR = ebit + resultFinanc

    // ── IR + CSLL ─────────────────────────────────────────────────────────
    let irpj = 0, csll = 0
    if (regime && resultAntesIR > 0) {
      if (regime.type === "presumido") {
        const baseIR  = receitaBruta * (regime.basePresuncaoServico / 100)
        irpj = baseIR * (regime.irpj / 100)
        csll = baseIR * (regime.csll / 100)
      } else if (regime.type === "real") {
        irpj = Math.max(0, resultAntesIR) * (regime.irpj / 100)
        csll = Math.max(0, resultAntesIR) * (regime.csll / 100)
      }
    }
    const totalIR      = irpj + csll
    const lucroLiquido = resultAntesIR - totalIR
    const margemLiq    = receitaBruta > 0 ? (lucroLiquido / receitaBruta) * 100 : 0

    // ── EBITDA ajustado ───────────────────────────────────────────────────
    const ebitdaAjustado = ebitda + despDeprec

    // ── Indicadores ───────────────────────────────────────────────────────
    const ticketMedio      = approved.length > 0 ? receitaBruta / approved.length : 0
    const cargaTributaria  = receitaBruta > 0 ? ((totalDedRec + totalIR) / receitaBruta) * 100 : 0
    const pontoEquilibrio  = receitaBruta > 0 && lucroBruto > 0
      ? (totalDespOp / (lucroBruto / receitaBruta))
      : 0

    // ── Linhas do DRE ────────────────────────────────────────────────────
    const pct = (v: number) => receitaBruta > 0 ? (v / receitaBruta) * 100 : 0

    const lines: DRELine[] = [
      // RECEITA BRUTA
      { label: "RECEITA OPERACIONAL BRUTA",           value: receitaBruta,    bold: true,  highlight: "blue",  indent: 0 },
      { label: "Vendas de Produtos (Hardware/Software)", value: receitaVendas,  pct: pct(receitaVendas),  indent: 1 },
      { label: "Receita de Locação",                  value: receitaLocacao,  pct: pct(receitaLocacao), indent: 1 },
      { label: "Receita de Serviços e Projetos",      value: receitaServicos, pct: pct(receitaServicos),indent: 1 },
      { label: "", value: 0, separator: true },

      // DEDUÇÕES
      { label: "(-) DEDUÇÕES DA RECEITA BRUTA",       value: -totalDedRec,   bold: true,  indent: 0, pct: pct(totalDedRec) },
      ...(pisPct    > 0 ? [{ label: `PIS (${fmtPct(pisPct)})`,          value: -dedPis,    pct: pct(dedPis),    indent: 1 } as DRELine] : []),
      ...(cofinsPct > 0 ? [{ label: `COFINS (${fmtPct(cofinsPct)})`,    value: -dedCofins, pct: pct(dedCofins), indent: 1 } as DRELine] : []),
      ...(issPct    > 0 ? [{ label: `ISS (${fmtPct(issPct)})`,          value: -dedIss,    pct: pct(dedIss),    indent: 1 } as DRELine] : []),
      ...(simplesAnexoPct > 0 ? [{ label: `Simples Nacional (${fmtPct(simplesAnexoPct)})`, value: -dedSimples, pct: pct(dedSimples), indent: 1 } as DRELine] : []),
      ...(ivaPct    > 0 ? [{ label: `IVA/CBS/IBS (${fmtPct(ivaPct)})`,  value: -dedIva,    pct: pct(dedIva),    indent: 1 } as DRELine] : []),
      { label: "", value: 0, separator: true },

      // RECEITA LÍQUIDA
      { label: "= RECEITA OPERACIONAL LÍQUIDA",       value: receitaLiq,     bold: true,  indent: 0, pct: pct(receitaLiq), highlight: "blue" },
      { label: "", value: 0, separator: true },

      // CMV / CSP
      { label: "(-) CUSTO DOS PRODUTOS/SERVIÇOS (CPV/CSP)", value: -totalCMV, bold: true, indent: 0, pct: pct(totalCMV) },
      { label: `Comissão de Vendas (${fmtPct(costsExpenses?.comissaoVenda || 0)})`, value: -cmvComissaoVenda, pct: pct(cmvComissaoVenda), indent: 1 },
      { label: `Comissão de Locação (${fmtPct(costsExpenses?.comissaoLocacao || 0)})`, value: -cmvComissaoLocacao, pct: pct(cmvComissaoLocacao), indent: 1 },
      { label: `Comissão de Serviços (${fmtPct(costsExpenses?.comissaoServico || 0)})`, value: -cmvComissaoServico, pct: pct(cmvComissaoServico), indent: 1 },
      { label: `Mão de Obra (${servicePropCount} proj × 160h × ${fmtR(laborCosts?.custoHora || 0)}/h)`, value: -cmvMaoDeObra, pct: pct(cmvMaoDeObra), indent: 1 },
      { label: "", value: 0, separator: true },

      // LUCRO BRUTO
      { label: "= LUCRO BRUTO",                      value: lucroBruto,     bold: true,  indent: 0, pct: margemBruta, highlight: lucroBruto >= 0 ? "green" : "red" },
      { label: "", value: 0, separator: true },

      // DESPESAS OPERACIONAIS
      { label: "(-) DESPESAS OPERACIONAIS",           value: -totalDespOp,   bold: true,  indent: 0, pct: pct(totalDespOp) },
      { label: `Despesas Administrativas (${fmtPct(costsExpenses?.despesasAdmin || 0)})`,     value: -despAdmin,  pct: pct(despAdmin),  indent: 1 },
      { label: `Outras Despesas (${fmtPct(costsExpenses?.outrasDespesas || 0)})`,            value: -despOutras, pct: pct(despOutras), indent: 1 },
      { label: `Custo Financeiro/Mês (${fmtPct(costsExpenses?.custoFinanceiroMensal || 0)})`,value: -despFinanc, pct: pct(despFinanc), indent: 1 },
      ...(despDeprec > 0 ? [{ label: `Depreciação (${fmtPct(costsExpenses?.depreciacao || 0)})`, value: -despDeprec, pct: pct(despDeprec), indent: 1 } as DRELine] : []),
      { label: "", value: 0, separator: true },

      // EBITDA
      { label: "= EBITDA",                            value: ebitda,         bold: true,  indent: 0, pct: margemEbitda, highlight: ebitda >= 0 ? "green" : "red" },
      { label: `EBITDA Ajustado (+deprec.)`,          value: ebitdaAjustado, pct: receitaBruta > 0 ? (ebitdaAjustado/receitaBruta)*100 : 0, indent: 1 },
      { label: "", value: 0, separator: true },

      // IR + CSLL
      { label: "(-) IMPOSTO DE RENDA E CSLL",         value: -totalIR,       bold: true,  indent: 0, pct: pct(totalIR) },
      ...(irpj > 0 ? [{ label: `IRPJ (${regime?.irpj}% s/ base)`, value: -irpj, pct: pct(irpj), indent: 1 } as DRELine] : []),
      ...(csll > 0 ? [{ label: `CSLL (${regime?.csll}% s/ base)`, value: -csll, pct: pct(csll), indent: 1 } as DRELine] : []),
      { label: "", value: 0, separator: true },

      // LUCRO LÍQUIDO
      { label: "= LUCRO LÍQUIDO DO EXERCÍCIO",        value: lucroLiquido,   bold: true,  indent: 0, pct: margemLiq, highlight: lucroLiquido >= 0 ? "green" : "red" },
    ]

    return {
      lines, approved,
      receitaBruta, receitaLiq, lucroBruto, ebitda, ebitdaAjustado,
      lucroLiquido, totalDedRec, totalCMV, totalDespOp, totalIR,
      margemBruta, margemEbitda, margemLiq, cargaTributaria,
      ticketMedio, pontoEquilibrio,
      receitaVendas, receitaLocacao, receitaServicos,
      regime,
    }
  }, [proposals, period, costsExpenses, laborCosts, regime])
}

// ─── Cálculo mensal para fluxo de caixa ───────────────────────────────────────

function useMonthlyData(proposals: ProposalData[]) {
  const { costsExpenses, laborCosts, getActiveTaxRegime } = useConfigurationStore()
  const regime = getActiveTaxRegime()

  return useMemo((): MonthData[] => {
    const approved = proposals.filter(p => p.status === "completed" || p.status === "active")
    const byMonth: Record<string, ProposalData[]> = {}

    approved.forEach(p => {
      const d = new Date(p.createdAt)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      if (!byMonth[key]) byMonth[key] = []
      byMonth[key].push(p)
    })

    return Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)).slice(-12).map(([key, props]) => {
      const receita  = props.reduce((s, p) => s + p.budgets.reduce((b, bg) => b + bg.totalValue, 0), 0)
      let deducPct   = 0
      if (regime?.type === "presumido" || regime?.type === "real") deducPct = (regime.pis + regime.cofins) / 100
      else if (regime?.type === "simples") deducPct = (regime.anexoIII || regime.anexoI) / 100
      else if (regime?.type === "iva")     deducPct = regime.ivaTotal / 100
      const deducoes = receita * deducPct
      const recLiq   = receita - deducoes
      const cmvPct   = ((costsExpenses?.comissaoVenda || 0) + (costsExpenses?.comissaoServico || 0)) / 100
      const cmv      = receita * cmvPct
      const lbr      = recLiq - cmv
      const despOp   = receita * (((costsExpenses?.despesasAdmin || 0) + (costsExpenses?.outrasDespesas || 0) + (costsExpenses?.custoFinanceiroMensal || 0)) / 100)
      const ebt      = lbr - despOp
      let ircsll     = 0
      if (regime && ebt > 0) {
        if (regime.type === "presumido") ircsll = receita * (regime.basePresuncaoServico / 100) * ((regime.irpj + regime.csll) / 100)
        else if (regime.type === "real") ircsll = ebt * ((regime.irpj + regime.csll) / 100)
      }
      const [yr, mo] = key.split("-")
      const monthLabel = new Date(Number(yr), Number(mo) - 1, 1).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })
      return { month: monthLabel, receita, deducoes, cmv, despOp, ebitda: ebt, ircsll, lucroLiq: ebt - ircsll }
    })
  }, [proposals, costsExpenses, laborCosts, regime])
}

// ─── Linha do DRE ─────────────────────────────────────────────────────────────

function DRERow({ line }: { line: DRELine }) {
  if (line.separator) return <tr><td colSpan={3}><div className="border-t border-border/40 my-1" /></td></tr>

  const indentClass = line.indent === 2 ? "pl-12" : line.indent === 1 ? "pl-8" : "pl-2"
  const hlClass =
    line.highlight === "green" ? "bg-emerald-500/8 border-l-2 border-emerald-500" :
    line.highlight === "red"   ? "bg-red-500/8 border-l-2 border-red-500" :
    line.highlight === "amber" ? "bg-amber-500/8 border-l-2 border-amber-500" :
    line.highlight === "blue"  ? "bg-blue-500/8 border-l-2 border-blue-500" : ""

  const valColor = line.value < 0 ? "text-red-400" : line.value > 0 ? "text-foreground" : "text-muted-foreground"

  return (
    <tr className={`hover:bg-muted/20 ${hlClass}`}>
      <td className={`py-1.5 text-sm ${indentClass} ${line.bold ? "font-bold text-foreground" : "text-muted-foreground"}`}>
        {line.label}
      </td>
      <td className={`py-1.5 pr-4 text-right text-sm font-mono ${line.bold ? "font-bold " + valColor : valColor}`}>
        {line.value !== 0 ? (line.value < 0 ? `(${fmtR(Math.abs(line.value))})` : fmtR(line.value)) : ""}
      </td>
      <td className="py-1.5 pr-3 text-right text-xs text-muted-foreground font-mono w-16">
        {line.pct !== undefined && line.pct !== 0 ? `${line.pct.toFixed(1)}%` : ""}
      </td>
    </tr>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KPICard({ label, value, sub, trend, color = "text-foreground", icon: Icon }:
  { label: string; value: string; sub?: string; trend?: number; color?: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Card className="border-border">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-1 font-medium">{label}</p>
            <p className={`text-xl font-bold ${color} break-all`}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/40 ml-3 ${color}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 mt-2 text-xs ${trend >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(trend).toFixed(1)}% margem
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Aba DRE ──────────────────────────────────────────────────────────────────

function DRETab({ dre }: { dre: ReturnType<typeof useDRE> }) {
  const exportCSV = () => {
    const rows = dre.lines
      .filter(l => !l.separator && l.label)
      .map(l => [`"${l.label}"`, `"${fmtR(l.value)}"`, `"${l.pct !== undefined ? fmtPct(l.pct) : ""}"`].join(","))
    const csv = ["Descrição,Valor,% Receita Bruta", ...rows].join("\n")
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" })),
      download: `dre-${new Date().toISOString().split("T")[0]}.csv`,
    })
    a.click(); URL.revokeObjectURL(a.href)
  }

  return (
    <div className="space-y-4">
      {/* Alertas */}
      {dre.receitaBruta === 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Nenhuma receita no período selecionado</p>
            <p className="text-xs text-amber-400/80 mt-0.5">O DRE exibe apenas propostas com status <strong>Ativa</strong> ou <strong>Concluída</strong>. Verifique os filtros de período ou aprove propostas.</p>
          </div>
        </div>
      )}
      {!dre.regime && (
        <div className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 text-sm text-blue-300">
          <Info className="h-4 w-4 shrink-0" />
          Nenhum regime tributário ativo. Configure em <strong>Configurações → Regimes Tributários</strong>.
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">{dre.approved.length} proposta(s) no período</Badge>
          {dre.regime && <Badge variant="outline" className="text-xs border-cyan-400/30 text-cyan-400">{dre.regime.name}</Badge>}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={exportCSV}><Download className="mr-1.5 h-3.5 w-3.5" />CSV</Button>
          <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="mr-1.5 h-3.5 w-3.5" />Imprimir</Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-cyan-400" />
            Demonstração do Resultado do Exercício (DRE)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="py-2 pl-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Descrição</th>
                <th className="py-2 pr-4 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Valor (R$)</th>
                <th className="py-2 pr-3 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground w-16">AV %</th>
              </tr>
            </thead>
            <tbody>
              {dre.lines.map((line, i) => <DRERow key={i} line={line} />)}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Nota metodológica */}
      <div className="rounded-xl border border-border bg-muted/10 p-4 text-xs text-muted-foreground space-y-1">
        <p className="font-semibold text-foreground text-xs">Notas Metodológicas</p>
        <p>• <strong>Receita Bruta:</strong> soma dos orçamentos de propostas com status Ativa ou Concluída no período selecionado.</p>
        <p>• <strong>Deduções:</strong> calculadas com base no regime tributário ativo configurado em Configurações.</p>
        <p>• <strong>CMV/CSP:</strong> comissões configuradas em Custos e Despesas + estimativa de mão de obra (160h × custo/hora × nº projetos de serviço).</p>
        <p>• <strong>Despesas Operacionais:</strong> percentuais aplicados sobre a receita bruta conforme configuração.</p>
        <p>• <strong>IR/CSLL:</strong> calculado sobre base de presunção (Lucro Presumido) ou resultado antes do IR (Lucro Real).</p>
        <p>• AV% = Análise Vertical: percentual de cada linha em relação à Receita Bruta.</p>
      </div>
    </div>
  )
}

// ─── Aba Indicadores ──────────────────────────────────────────────────────────

function IndicatorsTab({ dre }: { dre: ReturnType<typeof useDRE> }) {
  const indicators = [
    {
      group: "Rentabilidade",
      items: [
        { label: "Margem Bruta",    value: fmtPct(dre.margemBruta),   status: dre.margemBruta >= 30 ? "ok" : dre.margemBruta >= 15 ? "warn" : "bad",  ref: "≥ 30% saudável"  },
        { label: "Margem EBITDA",   value: fmtPct(dre.margemEbitda),  status: dre.margemEbitda >= 20 ? "ok" : dre.margemEbitda >= 8 ? "warn" : "bad",  ref: "≥ 20% saudável"  },
        { label: "Margem Líquida",  value: fmtPct(dre.margemLiq),     status: dre.margemLiq >= 10 ? "ok" : dre.margemLiq >= 5 ? "warn" : "bad",        ref: "≥ 10% saudável"  },
      ],
    },
    {
      group: "Eficiência",
      items: [
        { label: "Carga Tributária",      value: fmtPct(dre.cargaTributaria),
          status: dre.cargaTributaria <= 20 ? "ok" : dre.cargaTributaria <= 35 ? "warn" : "bad", ref: "≤ 20% ideal" },
        { label: "% CMV / Receita Bruta", value: fmtPct(dre.receitaBruta > 0 ? (dre.totalCMV/dre.receitaBruta)*100 : 0),
          status: (dre.totalCMV/Math.max(dre.receitaBruta,1))*100 <= 40 ? "ok" : "warn", ref: "≤ 40% ideal" },
        { label: "% Desp. Op. / Rec. Bruta", value: fmtPct(dre.receitaBruta > 0 ? (dre.totalDespOp/dre.receitaBruta)*100 : 0),
          status: (dre.totalDespOp/Math.max(dre.receitaBruta,1))*100 <= 20 ? "ok" : "warn", ref: "≤ 20% ideal" },
      ],
    },
    {
      group: "Negócio",
      items: [
        { label: "Ticket Médio por Proposta", value: fmtR(dre.ticketMedio),   status: "neutral", ref: `${dre.approved.length} propostas` },
        { label: "Ponto de Equilíbrio",       value: fmtR(dre.pontoEquilibrio), status: dre.receitaBruta >= dre.pontoEquilibrio ? "ok" : "bad", ref: "Receita mínima p/ cobrir custos" },
        { label: "Receita Total no Período",  value: fmtR(dre.receitaBruta),  status: "neutral", ref: "Bruta (ativas + concluídas)" },
      ],
    },
  ]

  const statusConfig = {
    ok:      { icon: CheckCircle,    color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    warn:    { icon: AlertTriangle,  color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20"   },
    bad:     { icon: TrendingDown,   color: "text-red-400",     bg: "bg-red-500/10 border-red-500/20"       },
    neutral: { icon: Minus,          color: "text-muted-foreground", bg: "bg-muted/20 border-border"        },
  }

  return (
    <div className="space-y-6">
      {/* Score cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Margem Líquida", value: fmtPct(dre.margemLiq), color: dre.margemLiq >= 10 ? "text-emerald-400" : dre.margemLiq >= 0 ? "text-amber-400" : "text-red-400" },
          { label: "Margem EBITDA",  value: fmtPct(dre.margemEbitda), color: dre.margemEbitda >= 20 ? "text-emerald-400" : "text-amber-400" },
          { label: "Carga Tributária", value: fmtPct(dre.cargaTributaria), color: dre.cargaTributaria <= 25 ? "text-emerald-400" : "text-amber-400" },
          { label: "Lucro Líquido",  value: fmtR(dre.lucroLiquido), color: dre.lucroLiquido >= 0 ? "text-emerald-400" : "text-red-400" },
        ].map(k => (
          <Card key={k.label}><CardContent className="p-4 text-center">
            <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{k.label}</p>
          </CardContent></Card>
        ))}
      </div>

      {/* Indicadores detalhados */}
      {indicators.map(group => (
        <Card key={group.group}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{group.group}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {group.items.map(item => {
              const sc = statusConfig[item.status as keyof typeof statusConfig]
              const Icon = sc.icon
              return (
                <div key={item.label} className={`flex items-center justify-between rounded-xl border p-3 ${sc.bg}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`h-4 w-4 shrink-0 ${sc.color}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.ref}</p>
                    </div>
                  </div>
                  <span className={`text-base font-bold shrink-0 ml-4 ${sc.color}`}>{item.value}</span>
                </div>
              )
            })}
          </CardContent>
        </Card>
      ))}

      {/* Composição da receita */}
      {dre.receitaBruta > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Composição da Receita Bruta</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Vendas (Hardware/Software)", value: dre.receitaVendas,   color: "bg-teal-400"   },
              { label: "Locação",                    value: dre.receitaLocacao,  color: "bg-purple-400" },
              { label: "Serviços e Projetos",        value: dre.receitaServicos, color: "bg-orange-400" },
            ].map(item => {
              const pct = dre.receitaBruta > 0 ? (item.value / dre.receitaBruta) * 100 : 0
              return (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="w-44 text-sm text-muted-foreground shrink-0">{item.label}</span>
                  <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-24 text-right text-xs text-muted-foreground shrink-0">{fmtR(item.value)}</span>
                  <span className="w-10 text-right text-xs font-bold text-foreground shrink-0">{pct.toFixed(1)}%</span>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ─── Aba Fluxo de Caixa ───────────────────────────────────────────────────────

function CashFlowTab({ monthly }: { monthly: MonthData[] }) {
  const exportCSV = () => {
    const headers = ["Mês","Receita Bruta","Deduções","CMV","Desp. Operacionais","EBITDA","IR+CSLL","Lucro Líquido"]
    const rows = monthly.map(m => [m.month, fmtR(m.receita), fmtR(m.deducoes), fmtR(m.cmv), fmtR(m.despOp), fmtR(m.ebitda), fmtR(m.ircsll), fmtR(m.lucroLiq)])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n")
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
      download: `fluxo-caixa-${new Date().toISOString().split("T")[0]}.csv`,
    })
    a.click()
  }

  const maxVal = Math.max(...monthly.map(m => m.receita), 1)

  if (monthly.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Calendar className="h-12 w-12 text-muted-foreground/40 mb-3" />
      <p className="font-medium text-muted-foreground">Sem dados mensais disponíveis</p>
      <p className="text-sm text-muted-foreground/60 mt-1">Propostas aprovadas aparecerão aqui agrupadas por mês</p>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={exportCSV}><Download className="mr-1.5 h-3.5 w-3.5" />Exportar CSV</Button>
      </div>

      {/* Gráfico de barras */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Evolução Mensal — Receita vs Lucro Líquido</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-40 mb-3">
            {monthly.map(m => (
              <div key={m.month} className="flex flex-1 flex-col items-center gap-0.5">
                <div className="w-full flex flex-col justify-end gap-0.5 h-32">
                  {/* Receita */}
                  <div className="w-full bg-primary/60 rounded-t-sm transition-all hover:bg-primary cursor-pointer"
                    title={`Receita: ${fmtR(m.receita)}`}
                    style={{ height: `${(m.receita / maxVal) * 100}%`, minHeight: m.receita > 0 ? "4px" : "0" }} />
                </div>
                {/* Lucro líquido como linha */}
                <div className="relative w-full h-0">
                  <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full ${m.lucroLiq >= 0 ? "bg-emerald-400" : "bg-red-400"}`}
                    title={`Lucro: ${fmtR(m.lucroLiq)}`} />
                </div>
                <span className="text-[9px] text-muted-foreground mt-1">{m.month}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-primary/60 inline-block" /> Receita Bruta</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Lucro Líquido</span>
          </div>
        </CardContent>
      </Card>

      {/* Tabela mensal */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Detalhe Mensal</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["Mês","Receita Bruta","Deduções","CMV","Desp. Op.","EBITDA","IR+CSLL","Lucro Líquido"].map(h => (
                    <th key={h} className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground first:text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthly.map((m, i) => (
                  <tr key={m.month} className={`border-t border-border/50 hover:bg-muted/20 ${i % 2 === 1 ? "bg-muted/10" : ""}`}>
                    <td className="px-3 py-2.5 text-sm font-semibold text-foreground">{m.month}</td>
                    <td className="px-3 py-2.5 text-right text-sm font-mono text-foreground">{fmtR(m.receita)}</td>
                    <td className="px-3 py-2.5 text-right text-sm font-mono text-red-400">({fmtR(m.deducoes)})</td>
                    <td className="px-3 py-2.5 text-right text-sm font-mono text-red-400">({fmtR(m.cmv)})</td>
                    <td className="px-3 py-2.5 text-right text-sm font-mono text-red-400">({fmtR(m.despOp)})</td>
                    <td className={`px-3 py-2.5 text-right text-sm font-bold font-mono ${m.ebitda >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {m.ebitda < 0 ? `(${fmtR(Math.abs(m.ebitda))})` : fmtR(m.ebitda)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-sm font-mono text-muted-foreground">({fmtR(m.ircsll)})</td>
                    <td className={`px-3 py-2.5 text-right text-sm font-bold font-mono ${m.lucroLiq >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {m.lucroLiq < 0 ? `(${fmtR(Math.abs(m.lucroLiq))})` : fmtR(m.lucroLiq)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-muted/30">
                  <td className="px-3 py-2.5 text-sm font-bold text-foreground">TOTAL</td>
                  {[
                    monthly.reduce((s, m) => s + m.receita, 0),
                    -monthly.reduce((s, m) => s + m.deducoes, 0),
                    -monthly.reduce((s, m) => s + m.cmv, 0),
                    -monthly.reduce((s, m) => s + m.despOp, 0),
                    monthly.reduce((s, m) => s + m.ebitda, 0),
                    -monthly.reduce((s, m) => s + m.ircsll, 0),
                    monthly.reduce((s, m) => s + m.lucroLiq, 0),
                  ].map((total, i) => (
                    <td key={i} className={`px-3 py-2.5 text-right text-sm font-bold font-mono ${total < 0 ? "text-red-400" : total > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                      {total < 0 ? `(${fmtR(Math.abs(total))})` : fmtR(total)}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Aba Propostas Aprovadas ───────────────────────────────────────────────────

function ApprovedProposalsTab({ proposals }: { proposals: ProposalData[] }) {
  const [search, setSearch] = useState("")
  const [moduleFilter, setModuleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const approved = proposals.filter(p => p.status === "completed" || p.status === "active")

  const filtered = approved.filter(p => {
    const s = search.toLowerCase()
    const matchSearch = p.clientName.toLowerCase().includes(s) || p.clientCompany.toLowerCase().includes(s) || p.projectName.toLowerCase().includes(s)
    const matchMod = moduleFilter === "all" || p.budgets.some(b => b.module === moduleFilter)
    const matchStatus = statusFilter === "all" || p.status === statusFilter
    return matchSearch && matchMod && matchStatus
  })

  const totalApproved = approved.reduce((s, p) => s + p.budgets.reduce((b, bg) => b + bg.totalValue, 0), 0)

  const STATUS_COLORS: Record<string, string> = {
    active:    "border-emerald-400/30 bg-emerald-400/10 text-emerald-400",
    completed: "border-blue-400/30 bg-blue-400/10 text-blue-400",
  }

  const MODULE_COLORS: Record<string, string> = {
    sales:    "border-teal-400/30 bg-teal-400/10 text-teal-400",
    rental:   "border-purple-400/30 bg-purple-400/10 text-purple-400",
    services: "border-orange-400/30 bg-orange-400/10 text-orange-400",
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{approved.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Propostas Aprovadas</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xl font-bold text-cyan-400">{fmtR(totalApproved)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Receita Total</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xl font-bold text-foreground">{approved.length > 0 ? fmtR(totalApproved / approved.length) : "R$ 0"}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Ticket Médio</p>
        </CardContent></Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <input
            className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Buscar por cliente, empresa ou projeto..."
            value={search} onChange={e => setSearch(e.target.value)}
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <Select value={moduleFilter} onValueChange={setModuleFilter}>
          <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Módulo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os módulos</SelectItem>
            <SelectItem value="sales">Vendas</SelectItem>
            <SelectItem value="rental">Locação</SelectItem>
            <SelectItem value="services">Serviços</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativas</SelectItem>
            <SelectItem value="completed">Concluídas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground text-sm">
          {approved.length === 0 ? "Nenhuma proposta aprovada. Altere o status de propostas para 'Ativa' ou 'Concluída'." : "Nenhuma proposta encontrada para a busca."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Cliente / Empresa","Projeto","Status","Módulos","Valor Total","Data"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const total = p.budgets.reduce((s, b) => s + b.totalValue, 0)
                const modules = [...new Set(p.budgets.map(b => b.module))]
                return (
                  <tr key={p.id} className={`border-t border-border/50 hover:bg-muted/20 ${i % 2 === 1 ? "bg-muted/10" : ""}`}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-foreground">{p.clientName}</p>
                      <p className="text-xs text-muted-foreground">{p.clientCompany}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs max-w-[140px] truncate">{p.projectName}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[p.status] || ""}`}>
                        {p.status === "active" ? "Ativa" : "Concluída"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {modules.map(m => (
                          <Badge key={m} variant="outline" className={`text-[10px] ${MODULE_COLORS[m] || ""}`}>
                            {m === "sales" ? "Vendas" : m === "rental" ? "Locação" : "Serviços"}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-400 font-mono">{fmtR(total)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString("pt-BR")}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Engine DRE por proposta individual ───────────────────────────────────────

function calcProposalDRE(p: ProposalData, costsExpenses: any, laborCosts: any, regime: any) {
  const receita = p.budgets.reduce((s, b) => s + b.totalValue, 0)
  const recVendas = p.budgets.filter(b => b.module === "sales").reduce((s, b) => s + b.totalValue, 0)
  const recLocacao = p.budgets.filter(b => b.module === "rental").reduce((s, b) => s + b.totalValue, 0)
  const recServicos = p.budgets.filter(b => b.module === "services").reduce((s, b) => s + b.totalValue, 0)

  let dedPct = 0
  if (regime?.type === "presumido" || regime?.type === "real")
    dedPct = (regime.pis + regime.cofins + (recServicos > 0 ? regime.iss : 0)) / 100
  else if (regime?.type === "simples")
    dedPct = (recServicos > 0 ? regime.anexoIII : regime.anexoI) / 100
  else if (regime?.type === "iva") dedPct = regime.ivaTotal / 100

  const deducoes = receita * dedPct
  const recLiq = receita - deducoes

  const cmvV = recVendas * ((costsExpenses?.comissaoVenda || 0) / 100)
  const cmvL = recLocacao * ((costsExpenses?.comissaoLocacao || 0) / 100)
  const cmvS = recServicos * ((costsExpenses?.comissaoServico || 0) / 100)
  const maoObra = recServicos > 0 ? (laborCosts?.custoHora || 0) * 160 : 0
  const cmv = cmvV + cmvL + cmvS + maoObra
  const lucroBruto = recLiq - cmv
  const margBruta = receita > 0 ? (lucroBruto / receita) * 100 : 0

  const despOp = receita * (((costsExpenses?.despesasAdmin || 0) + (costsExpenses?.outrasDespesas || 0) + (costsExpenses?.custoFinanceiroMensal || 0)) / 100)
  const ebitda = lucroBruto - despOp
  const margEbitda = receita > 0 ? (ebitda / receita) * 100 : 0

  let ircsll = 0
  if (regime && ebitda > 0) {
    if (regime.type === "presumido") ircsll = receita * (regime.basePresuncaoServico / 100) * ((regime.irpj + regime.csll) / 100)
    else if (regime.type === "real") ircsll = ebitda * ((regime.irpj + regime.csll) / 100)
  }

  const lucroLiq = ebitda - ircsll
  const margLiq = receita > 0 ? (lucroLiq / receita) * 100 : 0
  const cargaTrib = receita > 0 ? ((deducoes + ircsll) / receita) * 100 : 0

  return { receita, recVendas, recLocacao, recServicos, deducoes, recLiq, cmv, cmvV, cmvL, cmvS, maoObra, lucroBruto, despOp, ebitda, ircsll, lucroLiq, margBruta, margEbitda, margLiq, cargaTrib }
}

// ─── Aba DRE por Orçamento ─────────────────────────────────────────────────────

function DREByProposalTab({ proposals }: { proposals: ProposalData[] }) {
  const { costsExpenses, laborCosts, getActiveTaxRegime } = useConfigurationStore()
  const regime = getActiveTaxRegime()
  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [moduleFilter, setModuleFilter] = useState("all")

  const approved = proposals.filter(p => p.status === "completed" || p.status === "active")

  const filtered = useMemo(() => approved.filter(p => {
    const s = search.toLowerCase()
    const matchSearch = p.clientName.toLowerCase().includes(s) || p.clientCompany.toLowerCase().includes(s) || p.projectName.toLowerCase().includes(s)
    const matchMod = moduleFilter === "all" || p.budgets.some(b => b.module === moduleFilter)
    return matchSearch && matchMod
  }), [approved, search, moduleFilter])

  const selectedProposal = selectedId ? filtered.find(p => p.id === selectedId) : null
  const selectedDRE = selectedProposal ? calcProposalDRE(selectedProposal, costsExpenses, laborCosts, regime) : null

  const exportCSV = () => {
    if (!selectedProposal || !selectedDRE) return
    const d = selectedDRE
    const rows = [
      ["Receita Bruta", fmtR(d.receita), "100%"],
      ["  Vendas", fmtR(d.recVendas), `${d.receita > 0 ? ((d.recVendas/d.receita)*100).toFixed(1) : 0}%`],
      ["  Locação", fmtR(d.recLocacao), `${d.receita > 0 ? ((d.recLocacao/d.receita)*100).toFixed(1) : 0}%`],
      ["  Serviços", fmtR(d.recServicos), `${d.receita > 0 ? ((d.recServicos/d.receita)*100).toFixed(1) : 0}%`],
      ["(-) Deduções", `(${fmtR(d.deducoes)})`, `${d.receita > 0 ? ((d.deducoes/d.receita)*100).toFixed(1) : 0}%`],
      ["= Receita Líquida", fmtR(d.recLiq), `${d.receita > 0 ? ((d.recLiq/d.receita)*100).toFixed(1) : 0}%`],
      ["(-) CMV/CSP", `(${fmtR(d.cmv)})`, `${d.receita > 0 ? ((d.cmv/d.receita)*100).toFixed(1) : 0}%`],
      ["= Lucro Bruto", fmtR(d.lucroBruto), `${d.margBruta.toFixed(1)}%`],
      ["(-) Despesas Op.", `(${fmtR(d.despOp)})`, `${d.receita > 0 ? ((d.despOp/d.receita)*100).toFixed(1) : 0}%`],
      ["= EBITDA", fmtR(d.ebitda), `${d.margEbitda.toFixed(1)}%`],
      ["(-) IR+CSLL", `(${fmtR(d.ircsll)})`, `${d.receita > 0 ? ((d.ircsll/d.receita)*100).toFixed(1) : 0}%`],
      ["= Lucro Líquido", fmtR(d.lucroLiq), `${d.margLiq.toFixed(1)}%`],
    ]
    const csv = [["Descrição","Valor","AV%"], ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n")
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
      download: `dre-${selectedProposal.id}.csv`,
    })
    a.click()
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar cliente, empresa ou projeto..." value={search}
            onChange={e => { setSearch(e.target.value); setSelectedId(null) }} className="pl-9 h-9" />
        </div>
        <Select value={moduleFilter} onValueChange={v => { setModuleFilter(v); setSelectedId(null) }}>
          <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Módulo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os módulos</SelectItem>
            <SelectItem value="sales">Vendas</SelectItem>
            <SelectItem value="rental">Locação</SelectItem>
            <SelectItem value="services">Serviços</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center text-muted-foreground text-sm">
          {approved.length === 0 ? "Nenhuma proposta aprovada. Altere o status para Ativa ou Concluída." : "Nenhuma proposta encontrada."}
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-[360px_1fr]">
        {/* Lista lateral */}
        <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
          {filtered.map(p => {
            const d = calcProposalDRE(p, costsExpenses, laborCosts, regime)
            const isSelected = selectedId === p.id
            const modules = [...new Set(p.budgets.map(b => b.module))]
            return (
              <button key={p.id} onClick={() => setSelectedId(isSelected ? null : p.id)}
                className={`w-full text-left rounded-xl border p-3 transition-all ${isSelected ? "border-primary/60 bg-primary/5 ring-1 ring-primary/30" : "border-border bg-card hover:border-primary/30 hover:bg-muted/20"}`}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{p.clientName}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.projectName}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-foreground font-mono">{fmtR(d.receita)}</p>
                    <p className={`text-xs font-semibold ${d.margLiq >= 10 ? "text-emerald-400" : d.margLiq >= 0 ? "text-amber-400" : "text-red-400"}`}>
                      {d.margLiq.toFixed(1)}% líq.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {modules.map(m => (
                    <span key={m} className={`text-[10px] rounded-full border px-1.5 py-0.5 ${m === "sales" ? "border-teal-400/30 text-teal-400" : m === "rental" ? "border-purple-400/30 text-purple-400" : "border-orange-400/30 text-orange-400"}`}>
                      {m === "sales" ? "Vendas" : m === "rental" ? "Locação" : "Serviços"}
                    </span>
                  ))}
                  <span className={`text-[10px] rounded-full border px-1.5 py-0.5 ${p.status === "active" ? "border-emerald-400/30 text-emerald-400" : "border-blue-400/30 text-blue-400"}`}>
                    {p.status === "active" ? "Ativa" : "Concluída"}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* DRE Individual */}
        {selectedProposal && selectedDRE ? (
          <div className="space-y-3">
            {/* Header da proposta */}
            <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <p className="font-bold text-foreground">{selectedProposal.clientName}</p>
                  <Badge variant="outline" className="text-[10px]">{selectedProposal.clientCompany}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{selectedProposal.projectName} · {new Date(selectedProposal.createdAt).toLocaleDateString("pt-BR")}</p>
              </div>
              <Button size="sm" variant="outline" onClick={exportCSV}>
                <Download className="mr-1.5 h-3.5 w-3.5" /> CSV
              </Button>
            </div>

            {/* KPIs rápidos */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Receita", value: fmtR(selectedDRE.receita), color: "text-cyan-400" },
                { label: "Margem Bruta", value: fmtPct(selectedDRE.margBruta), color: selectedDRE.margBruta >= 30 ? "text-emerald-400" : "text-amber-400" },
                { label: "EBITDA", value: fmtPct(selectedDRE.margEbitda), color: selectedDRE.margEbitda >= 20 ? "text-emerald-400" : "text-amber-400" },
                { label: "Lucro Líquido", value: fmtPct(selectedDRE.margLiq), color: selectedDRE.margLiq >= 10 ? "text-emerald-400" : selectedDRE.margLiq >= 0 ? "text-amber-400" : "text-red-400" },
              ].map(k => (
                <div key={k.label} className="rounded-xl border border-border bg-card p-3 text-center">
                  <p className={`text-lg font-bold ${k.color}`}>{k.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{k.label}</p>
                </div>
              ))}
            </div>

            {/* Waterfall visual */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Cascata do Resultado</CardTitle></CardHeader>
              <CardContent>
                {(() => {
                  const d = selectedDRE
                  const steps = [
                    { label: "Receita Bruta", value: d.receita, type: "positive" },
                    { label: "(-) Deduções", value: -d.deducoes, type: "negative" },
                    { label: "(-) CMV/CSP", value: -d.cmv, type: "negative" },
                    { label: "(-) Despesas Op.", value: -d.despOp, type: "negative" },
                    { label: "(-) IR + CSLL", value: -d.ircsll, type: "negative" },
                    { label: "= Lucro Líquido", value: d.lucroLiq, type: d.lucroLiq >= 0 ? "result-pos" : "result-neg" },
                  ]
                  const maxAbs = Math.max(...steps.map(s => Math.abs(s.value)), 1)
                  return (
                    <div className="space-y-2">
                      {steps.map((step, i) => {
                        const pct = (Math.abs(step.value) / maxAbs) * 100
                        const barColor = step.type === "positive" ? "bg-cyan-500"
                          : step.type === "negative" ? "bg-red-500/60"
                          : step.type === "result-pos" ? "bg-emerald-500"
                          : "bg-red-500"
                        const valColor = step.type === "positive" ? "text-cyan-400"
                          : step.type === "negative" ? "text-red-400"
                          : step.type === "result-pos" ? "text-emerald-400"
                          : "text-red-400"
                        return (
                          <div key={i} className="flex items-center gap-3">
                            <span className="w-32 text-xs text-muted-foreground shrink-0">{step.label}</span>
                            <div className="flex-1 h-5 bg-muted/30 rounded-full overflow-hidden">
                              <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className={`w-28 text-right text-xs font-bold font-mono shrink-0 ${valColor}`}>
                              {step.value < 0 ? `(${fmtR(Math.abs(step.value))})` : fmtR(step.value)}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
              </CardContent>
            </Card>

            {/* DRE detalhado */}
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-cyan-400" />
                  DRE Individual — {selectedProposal.projectName}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="py-2 pl-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Descrição</th>
                      <th className="py-2 pr-4 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Valor (R$)</th>
                      <th className="py-2 pr-3 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground w-14">AV%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const d = selectedDRE
                      const r = d.receita || 1
                      const pct = (v: number) => `${((v / r) * 100).toFixed(1)}%`
                      const rows: [string, number, string, boolean, string?][] = [
                        ["RECEITA BRUTA", d.receita, "100%", true, "blue"],
                        ["  Vendas", d.recVendas, pct(d.recVendas), false],
                        ["  Locação", d.recLocacao, pct(d.recLocacao), false],
                        ["  Serviços", d.recServicos, pct(d.recServicos), false],
                        ["(-) DEDUÇÕES", -d.deducoes, pct(d.deducoes), true],
                        ["= RECEITA LÍQUIDA", d.recLiq, pct(d.recLiq), true, "blue"],
                        ["(-) CMV/CSP", -d.cmv, pct(d.cmv), true],
                        ["  Comissão Vendas", -d.cmvV, pct(d.cmvV), false],
                        ["  Comissão Locação", -d.cmvL, pct(d.cmvL), false],
                        ["  Comissão Serviços", -d.cmvS, pct(d.cmvS), false],
                        ["  Mão de Obra", -d.maoObra, pct(d.maoObra), false],
                        ["= LUCRO BRUTO", d.lucroBruto, `${d.margBruta.toFixed(1)}%`, true, d.lucroBruto >= 0 ? "green" : "red"],
                        ["(-) DESPESAS OPERACIONAIS", -d.despOp, pct(d.despOp), true],
                        ["= EBITDA", d.ebitda, `${d.margEbitda.toFixed(1)}%`, true, d.ebitda >= 0 ? "green" : "red"],
                        ["(-) IR + CSLL", -d.ircsll, pct(d.ircsll), true],
                        ["= LUCRO LÍQUIDO", d.lucroLiq, `${d.margLiq.toFixed(1)}%`, true, d.lucroLiq >= 0 ? "green" : "red"],
                      ]
                      return rows.map(([label, value, avpct, bold, hl], i) => {
                        const hlClass = hl === "green" ? "bg-emerald-500/5 border-l-2 border-emerald-500"
                          : hl === "red" ? "bg-red-500/5 border-l-2 border-red-500"
                          : hl === "blue" ? "bg-blue-500/5 border-l-2 border-blue-500" : ""
                        const valColor = value < 0 ? "text-red-400" : value > 0 ? "text-foreground" : "text-muted-foreground"
                        return (
                          <tr key={i} className={`hover:bg-muted/20 ${hlClass}`}>
                            <td className={`py-1.5 pl-3 text-sm ${bold ? "font-bold text-foreground" : "text-muted-foreground"}`}>{label}</td>
                            <td className={`py-1.5 pr-4 text-right text-sm font-mono ${bold ? "font-bold " + valColor : valColor}`}>
                              {value !== 0 ? (value < 0 ? `(${fmtR(Math.abs(value))})` : fmtR(value)) : "—"}
                            </td>
                            <td className="py-1.5 pr-3 text-right text-xs text-muted-foreground font-mono">{value !== 0 ? avpct : ""}</td>
                          </tr>
                        )
                      })
                    })()}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/10 py-16 text-center">
            <BarChart3 className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="font-medium text-muted-foreground">Selecione uma proposta</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Clique em qualquer item da lista para ver o DRE individual</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Waterfall Geral ──────────────────────────────────────────────────────────

function WaterfallChart({ dre }: { dre: ReturnType<typeof useDRE> }) {
  const d = dre
  const steps = [
    { label: "Receita Bruta",   value: d.receitaBruta,   type: "positive" as const },
    { label: "(-) Deduções",    value: -d.totalDedRec,   type: "negative" as const },
    { label: "(-) CMV/CSP",     value: -d.totalCMV,      type: "negative" as const },
    { label: "= Lucro Bruto",   value: d.lucroBruto,     type: d.lucroBruto >= 0 ? "neutral" as const : "result-neg" as const },
    { label: "(-) Desp. Op.",   value: -d.totalDespOp,   type: "negative" as const },
    { label: "= EBITDA",        value: d.ebitda,          type: d.ebitda >= 0 ? "neutral" as const : "result-neg" as const },
    { label: "(-) IR+CSLL",     value: -d.totalIR,       type: "negative" as const },
    { label: "= Lucro Líquido", value: d.lucroLiquido,    type: d.lucroLiquido >= 0 ? "result-pos" as const : "result-neg" as const },
  ]
  const maxAbs = Math.max(...steps.map(s => Math.abs(s.value)), 1)

  const barColor = (type: string) =>
    type === "positive" ? "bg-cyan-500" :
    type === "negative" ? "bg-red-500/60" :
    type === "result-pos" ? "bg-emerald-500" :
    type === "result-neg" ? "bg-red-600" : "bg-blue-400"

  const valColor = (type: string) =>
    type === "positive" ? "text-cyan-400" :
    type === "negative" ? "text-red-400" :
    type === "result-pos" ? "text-emerald-400" :
    type === "result-neg" ? "text-red-400" : "text-blue-400"

  if (d.receitaBruta === 0) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-cyan-400" /> Cascata do Resultado Geral
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {steps.map((step, i) => {
          const pct = (Math.abs(step.value) / maxAbs) * 100
          const avPct = d.receitaBruta > 0 ? `${Math.abs((step.value / d.receitaBruta) * 100).toFixed(1)}%` : ""
          return (
            <div key={i} className="flex items-center gap-3">
              <span className="w-32 text-xs text-muted-foreground shrink-0 text-right">{step.label}</span>
              <div className="flex-1 h-6 bg-muted/30 rounded-full overflow-hidden">
                <div className={`h-full ${barColor(step.type)} rounded-full transition-all duration-500`}
                  style={{ width: `${pct}%` }} />
              </div>
              <span className={`w-32 text-right text-xs font-bold font-mono shrink-0 ${valColor(step.type)}`}>
                {step.value < 0 ? `(${fmtR(Math.abs(step.value))})` : fmtR(step.value)}
              </span>
              <span className="w-10 text-right text-[10px] text-muted-foreground shrink-0">{avPct}</span>
            </div>
          )
        })}
        {/* Legenda */}
        <div className="flex flex-wrap gap-4 pt-2 border-t border-border/40 text-[10px] text-muted-foreground">
          {[["bg-cyan-500","Receita"],["bg-red-500/60","Deduções / Custos"],["bg-emerald-500","Resultado Positivo"],["bg-red-600","Resultado Negativo"]].map(([c,l]) => (
            <span key={l} className="flex items-center gap-1"><span className={`w-2.5 h-2.5 rounded-sm inline-block ${c}`}/>{l}</span>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export function FinancialModule() {

  const dre     = useDRE(proposals, period)
  const monthly = useMonthlyData(proposals)

  const kpiColor = (v: number, okThreshold: number, warnThreshold: number) =>
    v >= okThreshold ? "text-emerald-400" : v >= warnThreshold ? "text-amber-400" : "text-red-400"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-5 w-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-foreground">Módulo Financeiro</h2>
            <Badge variant="outline" className="text-xs border-cyan-400/30 text-cyan-400">DRE</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{companyData?.name || "Empresa"} · Regime: {dre.regime?.name || "Não configurado"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Mês Atual</SelectItem>
              <SelectItem value="quarter">Trimestre Atual</SelectItem>
              <SelectItem value="year">Ano Atual</SelectItem>
              <SelectItem value="all">Todo o Período</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI top bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KPICard label="Receita Bruta"  value={fmtR(dre.receitaBruta)}  icon={DollarSign}   color="text-cyan-400"
          sub={`${dre.approved.length} propostas aprovadas`} />
        <KPICard label="Lucro Bruto"    value={fmtR(dre.lucroBruto)}    icon={TrendingUp}   color={kpiColor(dre.margemBruta, 30, 15)}
          trend={dre.margemBruta} />
        <KPICard label="EBITDA"         value={fmtR(dre.ebitda)}        icon={BarChart3}    color={kpiColor(dre.margemEbitda, 20, 8)}
          trend={dre.margemEbitda} />
        <KPICard label="Lucro Líquido"  value={fmtR(dre.lucroLiquido)}  icon={ArrowUpRight} color={kpiColor(dre.margemLiq, 10, 5)}
          trend={dre.margemLiq} />
      </div>

      {/* Abas */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dre"         className="text-xs gap-1"><FileText   className="h-3.5 w-3.5" />DRE Geral</TabsTrigger>
          <TabsTrigger value="por-orcamento" className="text-xs gap-1"><Building className="h-3.5 w-3.5" />Por Orçamento</TabsTrigger>
          <TabsTrigger value="indicators"  className="text-xs gap-1"><BarChart3  className="h-3.5 w-3.5" />Indicadores</TabsTrigger>
          <TabsTrigger value="cashflow"    className="text-xs gap-1"><TrendingUp className="h-3.5 w-3.5" />Fluxo Mensal</TabsTrigger>
          <TabsTrigger value="proposals"   className="text-xs gap-1"><CheckCircle className="h-3.5 w-3.5" />Aprovadas</TabsTrigger>
        </TabsList>

        <TabsContent value="dre" className="mt-4 space-y-4">
          <WaterfallChart dre={dre} />
          <DRETab dre={dre} />
        </TabsContent>
        <TabsContent value="por-orcamento" className="mt-4"><DREByProposalTab proposals={proposals} /></TabsContent>
        <TabsContent value="indicators"    className="mt-4"><IndicatorsTab dre={dre} /></TabsContent>
        <TabsContent value="cashflow"      className="mt-4"><CashFlowTab monthly={monthly} /></TabsContent>
        <TabsContent value="proposals"     className="mt-4"><ApprovedProposalsTab proposals={proposals} /></TabsContent>
      </Tabs>
    </div>
  )
}
