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
import { useQuotes } from "@/contexts/QuoteContext"
import type { ProposalData } from "@/lib/types/proposals"
import type { Quote } from "@/lib/types/base"

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

// ─── Engine DRE a partir de Quotes (Orçamentos) ──────────────────────────────

function useDREFromQuotes(quotes: Quote[], period: string) {
  const { costsExpenses, laborCosts, getActiveTaxRegime } = useConfigurationStore()
  const regime = getActiveTaxRegime()

  return useMemo(() => {
    // Filtrar orçamentos aprovados pelo período
    const approved = quotes.filter(q => {
      if (q.status !== "Aprovado") return false
      if (period === "all") return true
      const d = new Date(q.date)
      const year = d.getFullYear()
      const month = d.getMonth() + 1
      const now = new Date()
      if (period === "year") return year === now.getFullYear()
      if (period === "quarter") {
        const q4 = Math.floor(now.getMonth() / 3)
        const pq = Math.floor((month - 1) / 3)
        return year === now.getFullYear() && pq === q4
      }
      if (period === "month") return year === now.getFullYear() && month === now.getMonth() + 1
      return true
    })

    // Receita por módulo/modalidade
    const receitaVendas   = approved.filter(q => q.modality === "Venda"    || q.module === "sales")   .reduce((s, q) => s + (q.total || 0), 0)
    const receitaLocacao  = approved.filter(q => q.modality === "Locação"  || q.module === "rental")  .reduce((s, q) => s + (q.total || 0), 0)
    const receitaServicos = approved.filter(q => q.modality === "Serviços" || q.module === "services").reduce((s, q) => s + (q.total || 0), 0)
    // Outros módulos (NOC, Service Desk, etc)
    const receitaOutros   = approved
      .filter(q => !["Venda","Locação","Serviços"].includes(q.modality || "") && !["sales","rental","services"].includes(q.module || ""))
      .reduce((s, q) => s + (q.total || 0), 0)
    const receitaBruta    = receitaVendas + receitaLocacao + receitaServicos + receitaOutros

    // Deduções
    let pisPct = 0, cofinsPct = 0, issPct = 0, simplesAnexoPct = 0, ivaPct = 0
    if (regime) {
      if (regime.type === "presumido" || regime.type === "real") {
        pisPct = regime.pis; cofinsPct = regime.cofins
        issPct = receitaServicos > 0 ? regime.iss : 0
      } else if (regime.type === "simples") {
        simplesAnexoPct = receitaServicos > 0 ? regime.anexoIII : regime.anexoI
      } else if (regime.type === "iva") { ivaPct = regime.ivaTotal }
    }
    const dedPis      = receitaBruta * (pisPct / 100)
    const dedCofins   = receitaBruta * (cofinsPct / 100)
    const dedIss      = receitaServicos * (issPct / 100)
    const dedSimples  = receitaBruta * (simplesAnexoPct / 100)
    const dedIva      = receitaBruta * (ivaPct / 100)
    const totalDedRec = dedPis + dedCofins + dedIss + dedSimples + dedIva
    const receitaLiq  = receitaBruta - totalDedRec

    // CMV / CSP
    const cmvV       = receitaVendas   * ((costsExpenses?.comissaoVenda    || 0) / 100)
    const cmvL       = receitaLocacao  * ((costsExpenses?.comissaoLocacao  || 0) / 100)
    const cmvS       = receitaServicos * ((costsExpenses?.comissaoServico  || 0) / 100)
    const qtdService = approved.filter(q => q.modality === "Serviços" || q.module === "services").length
    const cmvMO      = qtdService * (laborCosts?.custoHora || 0) * 160
    const totalCMV   = cmvV + cmvL + cmvS + cmvMO
    const lucroBruto = receitaLiq - totalCMV
    const margemBruta = receitaBruta > 0 ? (lucroBruto / receitaBruta) * 100 : 0

    // Despesas Operacionais
    const despAdmin   = receitaBruta * ((costsExpenses?.despesasAdmin            || 0) / 100)
    const despOutras  = receitaBruta * ((costsExpenses?.outrasDespesas           || 0) / 100)
    const despFinanc  = receitaBruta * ((costsExpenses?.custoFinanceiroMensal    || 0) / 100)
    const despDeprec  = receitaBruta * ((costsExpenses?.depreciacao              || 0) / 100)
    const totalDespOp = despAdmin + despOutras + despFinanc + despDeprec
    const ebitda      = lucroBruto - totalDespOp
    const ebitdaAjustado = ebitda + despDeprec
    const margemEbitda   = receitaBruta > 0 ? (ebitda / receitaBruta) * 100 : 0

    // IR + CSLL
    const resultAntesIR = ebitda - despFinanc
    let irpj = 0, csll = 0
    if (regime && resultAntesIR > 0) {
      if (regime.type === "presumido") {
        const base = receitaBruta * (regime.basePresuncaoServico / 100)
        irpj = base * (regime.irpj / 100); csll = base * (regime.csll / 100)
      } else if (regime.type === "real") {
        irpj = resultAntesIR * (regime.irpj / 100); csll = resultAntesIR * (regime.csll / 100)
      }
    }
    const totalIR      = irpj + csll
    const lucroLiquido = resultAntesIR - totalIR
    const margemLiq    = receitaBruta > 0 ? (lucroLiquido / receitaBruta) * 100 : 0
    const cargaTributaria = receitaBruta > 0 ? ((totalDedRec + totalIR) / receitaBruta) * 100 : 0
    const ticketMedio     = approved.length > 0 ? receitaBruta / approved.length : 0
    const pontoEquilibrio = receitaBruta > 0 && lucroBruto > 0
      ? (totalDespOp / (lucroBruto / receitaBruta)) : 0

    const pct = (v: number) => receitaBruta > 0 ? (v / receitaBruta) * 100 : 0

    const lines: DRELine[] = [
      { label: "RECEITA OPERACIONAL BRUTA",             value: receitaBruta,    bold: true, highlight: "blue", indent: 0 },
      { label: "Vendas de Produtos (Hardware/Software)", value: receitaVendas,   pct: pct(receitaVendas),   indent: 1 },
      { label: "Receita de Locação",                    value: receitaLocacao,  pct: pct(receitaLocacao),  indent: 1 },
      { label: "Receita de Serviços e Projetos",        value: receitaServicos, pct: pct(receitaServicos), indent: 1 },
      ...(receitaOutros > 0 ? [{ label: "Outros (NOC, Service Desk, etc.)", value: receitaOutros, pct: pct(receitaOutros), indent: 1 } as DRELine] : []),
      { label: "", value: 0, separator: true },
      { label: "(-) DEDUÇÕES DA RECEITA BRUTA",         value: -totalDedRec,   bold: true, indent: 0, pct: pct(totalDedRec) },
      ...(pisPct    > 0 ? [{ label: `PIS (${fmtPct(pisPct)})`,             value: -dedPis,    pct: pct(dedPis),    indent: 1 } as DRELine] : []),
      ...(cofinsPct > 0 ? [{ label: `COFINS (${fmtPct(cofinsPct)})`,       value: -dedCofins, pct: pct(dedCofins), indent: 1 } as DRELine] : []),
      ...(issPct    > 0 ? [{ label: `ISS (${fmtPct(issPct)})`,             value: -dedIss,    pct: pct(dedIss),    indent: 1 } as DRELine] : []),
      ...(simplesAnexoPct > 0 ? [{ label: `Simples Nacional (${fmtPct(simplesAnexoPct)})`, value: -dedSimples, pct: pct(dedSimples), indent: 1 } as DRELine] : []),
      ...(ivaPct    > 0 ? [{ label: `IVA/CBS/IBS (${fmtPct(ivaPct)})`,     value: -dedIva,    pct: pct(dedIva),    indent: 1 } as DRELine] : []),
      { label: "", value: 0, separator: true },
      { label: "= RECEITA OPERACIONAL LÍQUIDA",         value: receitaLiq,     bold: true, indent: 0, pct: pct(receitaLiq), highlight: "blue" },
      { label: "", value: 0, separator: true },
      { label: "(-) CUSTO DOS PRODUTOS/SERVIÇOS (CPV/CSP)", value: -totalCMV,  bold: true, indent: 0, pct: pct(totalCMV) },
      { label: `Comissão de Vendas (${fmtPct(costsExpenses?.comissaoVenda || 0)})`,   value: -cmvV,  pct: pct(cmvV),  indent: 1 },
      { label: `Comissão de Locação (${fmtPct(costsExpenses?.comissaoLocacao || 0)})`, value: -cmvL,  pct: pct(cmvL),  indent: 1 },
      { label: `Comissão de Serviços (${fmtPct(costsExpenses?.comissaoServico || 0)})`,value: -cmvS,  pct: pct(cmvS),  indent: 1 },
      { label: `Mão de Obra (${qtdService} proj × 160h × ${fmtR(laborCosts?.custoHora || 0)}/h)`, value: -cmvMO, pct: pct(cmvMO), indent: 1 },
      { label: "", value: 0, separator: true },
      { label: "= LUCRO BRUTO",                         value: lucroBruto,     bold: true, indent: 0, pct: margemBruta, highlight: lucroBruto >= 0 ? "green" : "red" },
      { label: "", value: 0, separator: true },
      { label: "(-) DESPESAS OPERACIONAIS",             value: -totalDespOp,   bold: true, indent: 0, pct: pct(totalDespOp) },
      { label: `Despesas Administrativas (${fmtPct(costsExpenses?.despesasAdmin || 0)})`,          value: -despAdmin,  pct: pct(despAdmin),  indent: 1 },
      { label: `Outras Despesas (${fmtPct(costsExpenses?.outrasDespesas || 0)})`,                  value: -despOutras, pct: pct(despOutras), indent: 1 },
      { label: `Custo Financeiro (${fmtPct(costsExpenses?.custoFinanceiroMensal || 0)})`,          value: -despFinanc, pct: pct(despFinanc), indent: 1 },
      ...(despDeprec > 0 ? [{ label: `Depreciação (${fmtPct(costsExpenses?.depreciacao || 0)})`,  value: -despDeprec, pct: pct(despDeprec), indent: 1 } as DRELine] : []),
      { label: "", value: 0, separator: true },
      { label: "= EBITDA",                              value: ebitda,         bold: true, indent: 0, pct: margemEbitda, highlight: ebitda >= 0 ? "green" : "red" },
      { label: "EBITDA Ajustado (+deprec.)",            value: ebitdaAjustado, pct: receitaBruta > 0 ? (ebitdaAjustado/receitaBruta)*100 : 0, indent: 1 },
      { label: "", value: 0, separator: true },
      { label: "(-) IMPOSTO DE RENDA E CSLL",           value: -totalIR,       bold: true, indent: 0, pct: pct(totalIR) },
      ...(irpj > 0 ? [{ label: `IRPJ (${regime?.irpj}% s/ base)`, value: -irpj, pct: pct(irpj), indent: 1 } as DRELine] : []),
      ...(csll > 0 ? [{ label: `CSLL (${regime?.csll}% s/ base)`, value: -csll, pct: pct(csll), indent: 1 } as DRELine] : []),
      { label: "", value: 0, separator: true },
      { label: "= LUCRO LÍQUIDO DO EXERCÍCIO",          value: lucroLiquido,   bold: true, indent: 0, pct: margemLiq, highlight: lucroLiquido >= 0 ? "green" : "red" },
    ]

    return {
      lines, approved, receitaBruta, receitaLiq, lucroBruto, ebitda, ebitdaAjustado,
      lucroLiquido, totalDedRec, totalCMV, totalDespOp, totalIR,
      margemBruta, margemEbitda, margemLiq, cargaTributaria,
      ticketMedio, pontoEquilibrio,
      receitaVendas, receitaLocacao, receitaServicos, receitaOutros, regime,
    }
  }, [quotes, period, costsExpenses, laborCosts, regime])
}
// ─── Fluxo mensal a partir de Quotes ─────────────────────────────────────────

function useMonthlyFromQuotes(quotes: Quote[]) {
  const { costsExpenses, laborCosts, getActiveTaxRegime } = useConfigurationStore()
  const regime = getActiveTaxRegime()

  return useMemo((): MonthData[] => {
    const approved = quotes.filter(q => q.status === "Aprovado")
    const byMonth: Record<string, Quote[]> = {}
    approved.forEach(q => {
      const d = new Date(q.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      if (!byMonth[key]) byMonth[key] = []
      byMonth[key].push(q)
    })
    return Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)).slice(-12).map(([key, qs]) => {
      const receita = qs.reduce((s, q) => s + (q.total || 0), 0)
      let deducPct  = 0
      if (regime?.type === "presumido" || regime?.type === "real") deducPct = (regime.pis + regime.cofins) / 100
      else if (regime?.type === "simples") deducPct = (regime.anexoIII || regime.anexoI) / 100
      else if (regime?.type === "iva") deducPct = regime.ivaTotal / 100
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
  }, [quotes, costsExpenses, laborCosts, regime])
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

function DRETab({ dre }: { dre: ReturnType<typeof useDREFromQuotes> }) {
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
            <p className="font-semibold">Nenhum orçamento aprovado no período</p>
            <p className="text-xs text-amber-400/80 mt-0.5">O DRE exibe dados de orçamentos de <strong>Comercial → Orçamentos</strong> com status <strong>Aprovado</strong>. Aprove orçamentos na aba Comercial para ver o DRE.</p>
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

function IndicatorsTab({ dre }: { dre: ReturnType<typeof useDREFromQuotes> }) {
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

// ─── Aba Orçamentos Aprovados ──────────────────────────────────────────────────

function ApprovedQuotesTab({ quotes }: { quotes: Quote[] }) {
  const [search, setSearch] = useState("")
  const [moduleFilter, setModuleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const allApproved = useMemo(() =>
    quotes.filter(q => q.status === "Aprovado"),
  [quotes])

  const filtered = useMemo(() => {
    const src = statusFilter === "all" ? quotes : quotes.filter(q => q.status === statusFilter)
    return src.filter(q => {
      const s = search.toLowerCase()
      const matchSearch = (q.client || "").toLowerCase().includes(s) || (q.projectName || "").toLowerCase().includes(s)
      const matchMod = moduleFilter === "all" ||
        q.modality === (moduleFilter === "sales" ? "Venda" : moduleFilter === "rental" ? "Locação" : "Serviços") ||
        q.module === moduleFilter
      return matchSearch && matchMod
    })
  }, [quotes, search, moduleFilter, statusFilter])

  const totalApproved = useMemo(() =>
    allApproved.reduce((s, q) => s + (q.total || 0), 0),
  [allApproved])

  const STATUS_COLORS: Record<string, string> = {
    "Aprovado":               "border-emerald-400/30 bg-emerald-400/10 text-emerald-400",
    "Pendente":               "border-amber-400/30 bg-amber-400/10 text-amber-400",
    "Enviado":                "border-blue-400/30 bg-blue-400/10 text-blue-400",
    "Rejeitado":              "border-red-400/30 bg-red-400/10 text-red-400",
    "Aguardando Distribuidor":"border-purple-400/30 bg-purple-400/10 text-purple-400",
  }

  const exportCSV = () => {
    const headers = ["Cliente","Projeto","Gerente","Módulo","Modalidade","Status","Valor Total","Data"]
    const rows = filtered.map(q => [q.client, q.projectName, q.accountManager, q.module, q.modality, q.status, fmtR(q.total || 0), new Date(q.date).toLocaleDateString("pt-BR")])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v || ""}"`).join(",")).join("\n")
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
      download: `orcamentos-${new Date().toISOString().split("T")[0]}.csv`,
    })
    a.click()
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{allApproved.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Orçamentos Aprovados</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xl font-bold text-cyan-400">{fmtR(totalApproved)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Receita Total (Aprovados)</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xl font-bold text-foreground">{allApproved.length > 0 ? fmtR(totalApproved / allApproved.length) : "R$ 0"}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Ticket Médio</p>
        </CardContent></Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar cliente ou projeto..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
        <Select value={moduleFilter} onValueChange={setModuleFilter}>
          <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Módulo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os módulos</SelectItem>
            <SelectItem value="sales">Venda</SelectItem>
            <SelectItem value="rental">Locação</SelectItem>
            <SelectItem value="services">Serviços</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="Aprovado">Aprovado</SelectItem>
            <SelectItem value="Pendente">Pendente</SelectItem>
            <SelectItem value="Enviado">Enviado</SelectItem>
            <SelectItem value="Rejeitado">Rejeitado</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={exportCSV}><Download className="mr-1.5 h-3.5 w-3.5" />CSV</Button>
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground text-sm">
          {quotes.length === 0
            ? "Nenhum orçamento cadastrado. Acesse Comercial → Orçamentos para criar."
            : "Nenhum orçamento encontrado para os filtros."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Cliente / Projeto","Gerente","Módulo","Status","Valor Total","Data"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((q, i) => (
                <tr key={q.id} className={`border-t border-border/50 hover:bg-muted/20 ${i % 2 === 1 ? "bg-muted/10" : ""}`}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-foreground">{q.client || "—"}</p>
                    <p className="text-xs text-muted-foreground">{q.projectName || "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{q.accountManager || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-[10px]">{q.modality || q.module || "—"}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[q.status] || ""}`}>{q.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-bold font-mono text-foreground">{fmtR(q.total || 0)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(q.date).toLocaleDateString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
// ─── Waterfall Geral ──────────────────────────────────────────────────────────

function WaterfallChart({ dre }: { dre: ReturnType<typeof useDREFromQuotes> }) {
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
  const { proposals } = useProposalStore()
  const { companyData } = useConfigurationStore()
  const { quotes } = useQuotes()
  const [period, setPeriod] = useState("year")
  const [activeTab, setActiveTab] = useState("dre")

  // DRE baseado nos orçamentos de Comercial → Orçamentos (QuoteContext)
  const dre     = useDREFromQuotes(quotes, period)
  // Fluxo mensal também dos orçamentos
  const monthly = useMonthlyFromQuotes(quotes)

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
        <TabsContent value="por-orcamento" className="mt-4"><DREByQuoteTab quotes={quotes} /></TabsContent>
        <TabsContent value="indicators"    className="mt-4"><IndicatorsTab dre={dre} /></TabsContent>
        <TabsContent value="cashflow"      className="mt-4"><CashFlowTab monthly={monthly} /></TabsContent>
        <TabsContent value="proposals"     className="mt-4"><ApprovedQuotesTab quotes={quotes} /></TabsContent>
      </Tabs>
    </div>
  )
}
