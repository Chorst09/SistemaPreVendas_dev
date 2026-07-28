"use client"

import { useState, useMemo } from "react"
import {
  ArrowLeft, BarChart3, Users, Package, TrendingUp, DollarSign,
  FileText, Settings, Eye, Package2, UserCheck, Calendar, Plus,
  Search, Edit, Trash2, Save, X, Download, Printer, ShoppingCart,
  Wrench, AlertTriangle, CheckCircle, Clock, XCircle, Building,
  Mail, Phone, Filter, RefreshCw,
} from "lucide-react"
import { ConfigurationModule } from "./ConfigurationModule"
import { ProposalsManagement } from "./ProposalsManagement"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { useProposalStore } from "@/lib/stores/proposal-store"
import type { ProposalData } from "@/lib/types/proposals"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
  id: string
  name: string
  category: "hardware" | "software" | "service" | "license" | "support"
  description: string
  unitPrice: number
  unit: string
  active: boolean
  createdAt: string
}

interface AdminModuleProps {
  onBack: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })

const fmtFull = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

const STATUS_MAP: Record<ProposalData["status"], { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  draft:     { label: "Rascunho",  color: "border-slate-400/30 bg-slate-400/10 text-slate-400",   icon: Clock },
  active:    { label: "Ativa",     color: "border-emerald-400/30 bg-emerald-400/10 text-emerald-400", icon: CheckCircle },
  completed: { label: "Concluída", color: "border-blue-400/30 bg-blue-400/10 text-blue-400",      icon: CheckCircle },
  cancelled: { label: "Cancelada", color: "border-red-400/30 bg-red-400/10 text-red-400",         icon: XCircle },
}

const MODULE_MAP: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  sales:    { label: "Vendas",   color: "text-teal-400",   icon: ShoppingCart },
  rental:   { label: "Locação",  color: "text-purple-400", icon: Calendar },
  services: { label: "Serviços", color: "text-orange-400", icon: Wrench },
}

const CAT_MAP: Record<Product["category"], string> = {
  hardware: "Hardware",
  software: "Software",
  service:  "Serviço",
  license:  "Licença",
  support:  "Suporte",
}

const EMPTY_PRODUCT: Omit<Product, "id" | "createdAt"> = {
  name: "", category: "hardware", description: "",
  unitPrice: 0, unit: "un", active: true,
}

// ─── ProductModal ─────────────────────────────────────────────────────────────

function ProductModal({ product, onSave, onClose }: {
  product?: Product
  onSave: (p: Omit<Product, "id" | "createdAt">) => void
  onClose: () => void
}) {
  const [form, setForm] = useState<Omit<Product, "id" | "createdAt">>(
    product ? { name: product.name, category: product.category, description: product.description,
                unitPrice: product.unitPrice, unit: product.unit, active: product.active }
            : EMPTY_PRODUCT
  )
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({})

  const validate = () => {
    const e: typeof errors = {}
    if (!form.name.trim())    e.name      = "Nome obrigatório"
    if (form.unitPrice <= 0)  e.unitPrice = "Preço deve ser maior que zero"
    if (!form.unit.trim())    e.unit      = "Unidade obrigatória"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{product ? "Editar Produto" : "Novo Produto"}</DialogTitle>
          <DialogDescription>Preencha os dados do produto / serviço</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Nome *</Label>
            <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Ex: Switch 24 portas" className={errors.name ? "border-destructive" : ""} />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Categoria</Label>
              <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v as Product["category"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CAT_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select value={form.active ? "active" : "inactive"} onValueChange={v => setForm(p => ({ ...p, active: v === "active" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Preço Unitário (R$) *</Label>
              <Input type="number" min={0} value={form.unitPrice}
                onChange={e => setForm(p => ({ ...p, unitPrice: Number(e.target.value) }))}
                className={errors.unitPrice ? "border-destructive" : ""} />
              {errors.unitPrice && <p className="text-xs text-destructive">{errors.unitPrice}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Unidade *</Label>
              <Input value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
                placeholder="un, mês, hr, item" className={errors.unit ? "border-destructive" : ""} />
              {errors.unit && <p className="text-xs text-destructive">{errors.unit}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Descrição</Label>
            <Textarea rows={2} value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Descrição detalhada do produto ou serviço" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => { if (validate()) onSave(form) }}>
            <Save className="mr-2 h-4 w-4" /> {product ? "Salvar Alterações" : "Adicionar Produto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Tab: Produtos ────────────────────────────────────────────────────────────

function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([
    { id: "p1", name: "Switch 24 Portas PoE", category: "hardware", description: "Switch gerenciável 24 portas PoE+, 1Gbps", unitPrice: 4800, unit: "un", active: true, createdAt: new Date().toISOString() },
    { id: "p2", name: "Firewall UTM",          category: "hardware", description: "Appliance de segurança de rede", unitPrice: 12000, unit: "un", active: true, createdAt: new Date().toISOString() },
    { id: "p3", name: "Windows Server",         category: "license", description: "Licença Windows Server 2022 Standard", unitPrice: 8500, unit: "licença", active: true, createdAt: new Date().toISOString() },
    { id: "p4", name: "Monitoramento NOC 24x7", category: "service", description: "Serviço de monitoramento proativo", unitPrice: 3500, unit: "mês", active: true, createdAt: new Date().toISOString() },
    { id: "p5", name: "Suporte Técnico On-Site", category: "support", description: "Suporte presencial SLA 4h", unitPrice: 1800, unit: "mês", active: true, createdAt: new Date().toISOString() },
    { id: "p6", name: "Microsoft 365 Business", category: "software", description: "Suite Office + Teams + SharePoint", unitPrice: 120, unit: "usuário/mês", active: true, createdAt: new Date().toISOString() },
  ])
  const [search, setSearch] = useState("")
  const [catFilter, setCatFilter] = useState("all")
  const [modal, setModal] = useState<"new" | Product | null>(null)

  const filtered = useMemo(() => products.filter(p => {
    const s = search.toLowerCase()
    return (p.name.toLowerCase().includes(s) || p.description.toLowerCase().includes(s)) &&
           (catFilter === "all" || p.category === catFilter)
  }), [products, search, catFilter])

  const handleSave = (data: Omit<Product, "id" | "createdAt">) => {
    if (modal === "new") {
      setProducts(prev => [...prev, { ...data, id: `p${Date.now()}`, createdAt: new Date().toISOString() }])
    } else if (modal && typeof modal === "object") {
      setProducts(prev => prev.map(p => p.id === modal.id ? { ...p, ...data } : p))
    }
    setModal(null)
  }

  const handleDelete = (id: string) => {
    if (confirm("Deseja remover este produto?")) setProducts(prev => prev.filter(p => p.id !== id))
  }

  const handleExportCSV = () => {
    const headers = ["Nome", "Categoria", "Preço Unit.", "Unidade", "Status", "Descrição"]
    const rows = products.map(p => [p.name, CAT_MAP[p.category], fmtFull(p.unitPrice), p.unit, p.active ? "Ativo" : "Inativo", p.description])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n")
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })), download: "produtos.csv" })
    a.click()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 flex-1">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar produto..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {Object.entries(CAT_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleExportCSV}><Download className="mr-1.5 h-3.5 w-3.5" /> CSV</Button>
          <Button size="sm" onClick={() => setModal("new")}><Plus className="mr-1.5 h-3.5 w-3.5" /> Novo Produto</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total",   value: products.length,                    color: "text-foreground"   },
          { label: "Ativos",  value: products.filter(p => p.active).length, color: "text-emerald-400" },
          { label: "Inativos",value: products.filter(p => !p.active).length, color: "text-red-400"   },
          { label: "Categorias", value: new Set(products.map(p => p.category)).size, color: "text-cyan-400" },
        ].map(k => (
          <Card key={k.label}><CardContent className="p-4 text-center">
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{k.label}</p>
          </CardContent></Card>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <div className="grid grid-cols-[1fr_100px_100px_80px_90px_80px] bg-muted/40 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          <span>Produto</span><span>Categoria</span><span className="text-right">Preço Unit.</span>
          <span className="text-center">Unidade</span><span className="text-center">Status</span><span className="text-center">Ações</span>
        </div>
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">Nenhum produto encontrado.</div>
        ) : filtered.map((p, i) => (
          <div key={p.id} className={`grid grid-cols-[1fr_100px_100px_80px_90px_80px] items-center gap-2 border-t border-border/50 px-4 py-3 hover:bg-muted/20 ${i % 2 === 1 ? "bg-muted/10" : ""}`}>
            <div>
              <p className="font-semibold text-foreground text-sm">{p.name}</p>
              <p className="text-xs text-muted-foreground truncate">{p.description}</p>
            </div>
            <Badge variant="outline" className="w-fit text-[10px]">{CAT_MAP[p.category]}</Badge>
            <p className="text-right text-sm font-semibold text-foreground">{fmtFull(p.unitPrice)}</p>
            <p className="text-center text-xs text-muted-foreground">{p.unit}</p>
            <div className="flex justify-center">
              <Badge variant="outline" className={`text-[10px] ${p.active ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-400" : "border-red-400/30 bg-red-400/10 text-red-400"}`}>
                {p.active ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            <div className="flex justify-center gap-1">
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setModal(p)}><Edit className="h-3.5 w-3.5" /></Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        ))}
      </div>

      {modal !== null && (
        <ProductModal
          product={modal === "new" ? undefined : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

// ─── Tab: Analytics ───────────────────────────────────────────────────────────

function AnalyticsTab({ proposals }: { proposals: ProposalData[] }) {
  const stats = useMemo(() => {
    const totalReceita = proposals.reduce((s, p) => s + p.budgets.reduce((b, bg) => b + bg.totalValue, 0), 0)
    const ativas       = proposals.filter(p => p.status === "active").length
    const concluidas   = proposals.filter(p => p.status === "completed").length
    const canceladas   = proposals.filter(p => p.status === "cancelled").length
    const rascunhos    = proposals.filter(p => p.status === "draft").length
    const clientes     = new Set(proposals.map(p => p.clientCompany)).size

    const byModule: Record<string, { count: number; value: number }> = {}
    proposals.forEach(p => p.budgets.forEach(b => {
      if (!byModule[b.module]) byModule[b.module] = { count: 0, value: 0 }
      byModule[b.module].count++
      byModule[b.module].value += b.totalValue
    }))

    const byType: Record<string, number> = {}
    proposals.forEach(p => { byType[p.projectType || "Outros"] = (byType[p.projectType || "Outros"] || 0) + 1 })

    const ticketMedio = proposals.length > 0 ? totalReceita / proposals.length : 0

    const byMonth: Record<string, number> = {}
    proposals.forEach(p => {
      const m = new Date(p.createdAt).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })
      byMonth[m] = (byMonth[m] || 0) + p.budgets.reduce((s, b) => s + b.totalValue, 0)
    })

    return { totalReceita, ativas, concluidas, canceladas, rascunhos, clientes, byModule, byType, ticketMedio, byMonth }
  }, [proposals])

  const maxMonth = Math.max(...Object.values(stats.byMonth), 1)

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Receita Total",   value: fmt(stats.totalReceita), color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Ticket Médio",    value: fmt(stats.ticketMedio),  color: "text-cyan-400",    bg: "bg-cyan-500/10"    },
          { label: "Clientes Únicos", value: stats.clientes,          color: "text-purple-400",  bg: "bg-purple-500/10"  },
          { label: "Propostas Ativas",value: stats.ativas,            color: "text-amber-400",   bg: "bg-amber-500/10"   },
        ].map(k => (
          <Card key={k.label} className="border-border">
            <CardContent className={`p-5 text-center ${k.bg} rounded-xl`}>
              <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Status */}
        <Card><CardHeader><CardTitle className="text-base">Distribuição por Status</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {([
              ["Ativas",    stats.ativas,    "bg-emerald-400"],
              ["Concluídas",stats.concluidas,"bg-blue-400"],
              ["Rascunhos", stats.rascunhos, "bg-slate-400"],
              ["Canceladas",stats.canceladas,"bg-red-400"],
            ] as [string, number, string][]).map(([label, count, color]) => (
              <div key={label} className="flex items-center gap-3">
                <span className="w-24 text-sm text-muted-foreground">{label}</span>
                <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full transition-all`}
                    style={{ width: proposals.length ? `${(count / proposals.length) * 100}%` : "0%" }} />
                </div>
                <span className="w-8 text-right text-sm font-bold text-foreground">{count}</span>
              </div>
            ))}
            {proposals.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma proposta cadastrada.</p>}
          </CardContent>
        </Card>

        {/* Por módulo */}
        <Card><CardHeader><CardTitle className="text-base">Receita por Módulo</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(stats.byModule).length === 0
              ? <p className="text-sm text-muted-foreground text-center py-4">Nenhum orçamento cadastrado ainda.</p>
              : Object.entries(stats.byModule).map(([mod, data]) => {
                  const m = MODULE_MAP[mod] || { label: mod, color: "text-muted-foreground", icon: FileText }
                  const Icon = m.icon
                  const pct = stats.totalReceita > 0 ? (data.value / stats.totalReceita) * 100 : 0
                  return (
                    <div key={mod} className="flex items-center gap-3">
                      <Icon className={`h-4 w-4 shrink-0 ${m.color}`} />
                      <span className="w-20 text-sm text-muted-foreground">{m.label}</span>
                      <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-24 text-right text-xs text-muted-foreground">{fmt(data.value)}</span>
                    </div>
                  )
                })
            }
          </CardContent>
        </Card>

        {/* Evolução mensal */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Evolução de Receita por Mês</CardTitle></CardHeader>
          <CardContent>
            {Object.keys(stats.byMonth).length === 0
              ? <p className="text-sm text-muted-foreground text-center py-8">Sem dados mensais ainda.</p>
              : <div className="flex items-end gap-2 h-32">
                  {Object.entries(stats.byMonth).slice(-12).map(([month, value]) => (
                    <div key={month} className="flex flex-1 flex-col items-center gap-1">
                      <div className="w-full bg-primary/80 rounded-t-sm transition-all hover:bg-primary"
                        style={{ height: `${(value / maxMonth) * 100}%`, minHeight: "4px" }}
                        title={fmt(value)} />
                      <span className="text-[9px] text-muted-foreground">{month}</span>
                    </div>
                  ))}
                </div>
            }
          </CardContent>
        </Card>
      </div>

      {/* Por tipo de projeto */}
      {Object.keys(stats.byType).length > 0 && (
        <Card><CardHeader><CardTitle className="text-base">Propostas por Tipo de Projeto</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.byType).map(([type, count]) => (
                <div key={type} className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2">
                  <span className="text-sm font-semibold text-foreground">{count}</span>
                  <span className="text-sm text-muted-foreground">{type}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ─── Tab: Relatórios ──────────────────────────────────────────────────────────

function ReportsTab({ proposals }: { proposals: ProposalData[] }) {
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFrom, setDateFrom]         = useState("")
  const [dateTo,   setDateTo]           = useState("")

  const filtered = useMemo(() => proposals.filter(p => {
    const matchStatus = statusFilter === "all" || p.status === statusFilter
    const created     = new Date(p.createdAt)
    const matchFrom   = !dateFrom || created >= new Date(dateFrom)
    const matchTo     = !dateTo   || created <= new Date(dateTo)
    return matchStatus && matchFrom && matchTo
  }), [proposals, statusFilter, dateFrom, dateTo])

  const totalFiltered = filtered.reduce((s, p) => s + p.budgets.reduce((b, bg) => b + bg.totalValue, 0), 0)

  const exportCSV = () => {
    const headers = ["ID", "Cliente", "Empresa", "CNPJ", "Projeto", "Tipo", "Status", "Gerente", "E-mail Gerente", "Valor Total", "Criado em"]
    const rows = filtered.map(p => [
      p.id, p.clientName, p.clientCompany, p.clientCNPJ, p.projectName, p.projectType,
      STATUS_MAP[p.status].label, p.managerName, p.managerEmail,
      fmtFull(p.budgets.reduce((s, b) => s + b.totalValue, 0)),
      new Date(p.createdAt).toLocaleDateString("pt-BR"),
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v || ""}"`).join(",")).join("\n")
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" })),
      download: `relatorio-propostas-${new Date().toISOString().split("T")[0]}.csv`,
    })
    a.click(); URL.revokeObjectURL(a.href)
  }

  const exportBudgetCSV = () => {
    const headers = ["ID Proposta", "Cliente", "Módulo", "Valor Total", "Nº Itens", "Criado em"]
    const rows: string[][] = []
    filtered.forEach(p => p.budgets.forEach(b => rows.push([
      p.id, p.clientCompany, MODULE_MAP[b.module]?.label || b.module,
      fmtFull(b.totalValue), String(b.items.length),
      new Date(b.createdAt).toLocaleDateString("pt-BR"),
    ])))
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n")
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" })),
      download: `relatorio-orcamentos-${new Date().toISOString().split("T")[0]}.csv`,
    })
    a.click(); URL.revokeObjectURL(a.href)
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Filter className="h-4 w-4" />Filtros do Relatório</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Label className="text-xs shrink-0">De:</Label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-36" />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs shrink-0">Até:</Label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-36" />
            </div>
            <Button variant="outline" size="sm" onClick={() => { setStatusFilter("all"); setDateFrom(""); setDateTo("") }}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resumo do período */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Propostas no período", value: filtered.length, color: "text-foreground" },
          { label: "Valor total", value: fmt(totalFiltered), color: "text-emerald-400" },
          { label: "Orçamentos", value: filtered.reduce((s, p) => s + p.budgets.length, 0), color: "text-cyan-400" },
        ].map(k => (
          <Card key={k.label}><CardContent className="p-4 text-center">
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{k.label}</p>
          </CardContent></Card>
        ))}
      </div>

      {/* Exportações */}
      <Card><CardHeader><CardTitle className="text-base">Exportar Relatórios</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-muted/10 p-4 flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground text-sm">Relatório de Propostas</p>
              <p className="text-xs text-muted-foreground mt-0.5 mb-3">Exporta todas as propostas com dados do cliente, projeto e valores</p>
              <div className="flex gap-2">
                <Button size="sm" onClick={exportCSV}><Download className="mr-1.5 h-3.5 w-3.5" /> CSV</Button>
                <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="mr-1.5 h-3.5 w-3.5" /> Imprimir</Button>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-muted/10 p-4 flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10">
              <BarChart3 className="h-5 w-5 text-cyan-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground text-sm">Relatório de Orçamentos</p>
              <p className="text-xs text-muted-foreground mt-0.5 mb-3">Exporta todos os orçamentos com módulo, valor e itens por proposta</p>
              <Button size="sm" onClick={exportBudgetCSV}><Download className="mr-1.5 h-3.5 w-3.5" /> CSV</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prévia da tabela */}
      <Card><CardHeader><CardTitle className="text-base">Prévia — {filtered.length} proposta(s)</CardTitle></CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0
            ? <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma proposta para os filtros selecionados.</p>
            : <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border bg-muted/30">
                    {["Cliente / Empresa","Projeto","Status","Módulos","Valor Total","Data"].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {filtered.map((p, i) => {
                      const sm = STATUS_MAP[p.status]
                      const Icon = sm.icon
                      return (
                        <tr key={p.id} className={`border-t border-border/50 hover:bg-muted/20 ${i % 2 === 1 ? "bg-muted/10" : ""}`}>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-foreground">{p.clientName}</p>
                            <p className="text-xs text-muted-foreground">{p.clientCompany}</p>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">{p.projectName}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={`text-[10px] ${sm.color}`}><Icon className="mr-1 h-2.5 w-2.5" />{sm.label}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {[...new Set(p.budgets.map(b => b.module))].map(m => {
                                const mm = MODULE_MAP[m]
                                return mm ? <Badge key={m} variant="outline" className="text-[10px]">{mm.label}</Badge> : null
                              })}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-foreground">
                            {fmt(p.budgets.reduce((s, b) => s + b.totalValue, 0))}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {new Date(p.createdAt).toLocaleDateString("pt-BR")}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
          }
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Tab: Clientes ────────────────────────────────────────────────────────────

function ClientsTab({ proposals }: { proposals: ProposalData[] }) {
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<string | null>(null)

  const clients = useMemo(() => {
    const map: Record<string, {
      company: string; name: string; email: string; phone: string; cnpj: string
      proposals: ProposalData[]; totalValue: number; lastContact: Date
    }> = {}
    proposals.forEach(p => {
      const key = p.clientCompany || p.clientName
      if (!map[key]) map[key] = { company: p.clientCompany, name: p.clientName, email: p.clientEmail,
        phone: p.clientPhone, cnpj: p.clientCNPJ, proposals: [], totalValue: 0, lastContact: new Date(p.createdAt) }
      map[key].proposals.push(p)
      map[key].totalValue += p.budgets.reduce((s, b) => s + b.totalValue, 0)
      const d = new Date(p.createdAt)
      if (d > map[key].lastContact) map[key].lastContact = d
    })
    return Object.values(map)
  }, [proposals])

  const filtered = clients.filter(c => {
    const s = search.toLowerCase()
    return c.company.toLowerCase().includes(s) || c.name.toLowerCase().includes(s) || c.email.toLowerCase().includes(s)
  })

  const selectedClient = selected ? filtered.find(c => c.company === selected) : null

  const exportCSV = () => {
    const headers = ["Empresa", "Contato", "E-mail", "Telefone", "CNPJ", "Propostas", "Valor Total", "Último Contato"]
    const rows = clients.map(c => [c.company, c.name, c.email, c.phone, c.cnpj,
      String(c.proposals.length), fmtFull(c.totalValue), c.lastContact.toLocaleDateString("pt-BR")])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v || ""}"`).join(",")).join("\n")
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
      download: `clientes-${new Date().toISOString().split("T")[0]}.csv`,
    })
    a.click()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por empresa, nome ou e-mail..." value={search}
            onChange={e => { setSearch(e.target.value); setSelected(null) }} className="pl-9" />
        </div>
        <Button size="sm" variant="outline" onClick={exportCSV}><Download className="mr-1.5 h-3.5 w-3.5" /> CSV</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Clientes Únicos", value: clients.length, color: "text-purple-400" },
          { label: "Com Propostas Ativas", value: clients.filter(c => c.proposals.some(p => p.status === "active")).length, color: "text-emerald-400" },
          { label: "Receita Total", value: fmt(clients.reduce((s, c) => s + c.totalValue, 0)), color: "text-cyan-400" },
          { label: "Ticket Médio/Cliente", value: clients.length ? fmt(clients.reduce((s, c) => s + c.totalValue, 0) / clients.length) : "R$ 0", color: "text-amber-400" },
        ].map(k => (
          <Card key={k.label}><CardContent className="p-4 text-center">
            <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{k.label}</p>
          </CardContent></Card>
        ))}
      </div>

      {filtered.length === 0
        ? <div className="py-12 text-center text-muted-foreground text-sm">
            {proposals.length === 0 ? "Nenhuma proposta cadastrada. Crie propostas na aba Propostas." : "Nenhum cliente encontrado."}
          </div>
        : <div className="grid gap-3">
            {filtered.map(c => (
              <div key={c.company}
                className={`rounded-xl border cursor-pointer transition-all hover:shadow-md ${selected === c.company ? "border-primary/50 bg-primary/5" : "border-border bg-card hover:border-primary/30"}`}
                onClick={() => setSelected(selected === c.company ? null : c.company)}>
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                      {c.company.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-foreground truncate">{c.company}</p>
                      <p className="text-xs text-muted-foreground">{c.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-muted-foreground">Propostas</p>
                      <p className="font-bold text-foreground">{c.proposals.length}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Valor Total</p>
                      <p className="font-bold text-emerald-400">{fmt(c.totalValue)}</p>
                    </div>
                  </div>
                </div>

                {selected === c.company && (
                  <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground truncate">{c.email || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">{c.phone || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Building className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">{c.cnpj || "—"}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Histórico de Propostas</p>
                      <div className="space-y-1.5">
                        {c.proposals.map(p => {
                          const sm = STATUS_MAP[p.status]
                          const Icon = sm.icon
                          return (
                            <div key={p.id} className="flex items-center justify-between rounded-lg border border-border bg-background/60 px-3 py-2">
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-foreground truncate">{p.projectName}</p>
                                <p className="text-[10px] text-muted-foreground">{new Date(p.createdAt).toLocaleDateString("pt-BR")}</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <Badge variant="outline" className={`text-[10px] ${sm.color}`}><Icon className="mr-1 h-2.5 w-2.5" />{sm.label}</Badge>
                                <span className="text-xs font-semibold text-foreground">{fmt(p.budgets.reduce((s, b) => s + b.totalValue, 0))}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
      }
    </div>
  )
}

// ─── Main AdminModule ─────────────────────────────────────────────────────────

export function AdminModule({ onBack }: AdminModuleProps) {
  const [activeTab, setActiveTab] = useState("visao-geral")
  const { proposals } = useProposalStore()

  // KPIs reais derivados do ProposalStore
  const kpis = useMemo(() => {
    const totalReceita    = proposals.reduce((s, p) => s + p.budgets.reduce((b, bg) => b + bg.totalValue, 0), 0)
    const propostasAtivas = proposals.filter(p => p.status === "active").length
    const clientesAtivos  = new Set(proposals.map(p => p.clientCompany)).size
    const totalPropostas  = proposals.length
    const concluidas      = proposals.filter(p => p.status === "completed").length

    const byModule: Record<string, number> = {}
    proposals.forEach(p => p.budgets.forEach(b => {
      byModule[b.module] = (byModule[b.module] || 0) + b.totalValue
    }))

    return { totalReceita, propostasAtivas, clientesAtivos, totalPropostas, concluidas, byModule }
  }, [proposals])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="px-6 pt-6 pb-2">
        <Button onClick={onBack} variant="outline" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
        <h1 className="text-3xl font-bold mb-1">Dashboard Administrativo</h1>
        <p className="text-muted-foreground">Gerencie o sistema de precificação de produtos e serviços de TI</p>
      </div>

      <div className="px-6 pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7 mb-6">
            <TabsTrigger value="visao-geral"   className="flex items-center gap-1.5 text-xs"><Eye className="h-3.5 w-3.5" />Visão Geral</TabsTrigger>
            <TabsTrigger value="propostas"     className="flex items-center gap-1.5 text-xs"><FileText className="h-3.5 w-3.5" />Propostas</TabsTrigger>
            <TabsTrigger value="produtos"      className="flex items-center gap-1.5 text-xs"><Package className="h-3.5 w-3.5" />Produtos</TabsTrigger>
            <TabsTrigger value="analytics"     className="flex items-center gap-1.5 text-xs"><BarChart3 className="h-3.5 w-3.5" />Analytics</TabsTrigger>
            <TabsTrigger value="relatorios"    className="flex items-center gap-1.5 text-xs"><TrendingUp className="h-3.5 w-3.5" />Relatórios</TabsTrigger>
            <TabsTrigger value="clientes"      className="flex items-center gap-1.5 text-xs"><Users className="h-3.5 w-3.5" />Clientes</TabsTrigger>
            <TabsTrigger value="configuracoes" className="flex items-center gap-1.5 text-xs"><Settings className="h-3.5 w-3.5" />Configurações</TabsTrigger>
          </TabsList>

          {/* ── Visão Geral ── */}
          <TabsContent value="visao-geral" className="space-y-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                { label: "Receita Total",      value: fmt(kpis.totalReceita),   icon: DollarSign,  color: "text-emerald-400", note: `${kpis.totalPropostas} propostas`   },
                { label: "Propostas Ativas",   value: kpis.propostasAtivas,     icon: FileText,    color: "text-amber-400",   note: `${kpis.concluidas} concluídas`      },
                { label: "Clientes Únicos",    value: kpis.clientesAtivos,      icon: UserCheck,   color: "text-purple-400",  note: "extraídos das propostas"            },
                { label: "Total de Propostas", value: kpis.totalPropostas,      icon: Calendar,    color: "text-cyan-400",    note: "todos os status"                    },
              ].map(item => {
                const Icon = item.icon
                return (
                  <Card key={item.label}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
                      <p className="text-xs text-muted-foreground mt-1">{item.note}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card><CardHeader><CardTitle>Receita por Módulo</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {Object.keys(kpis.byModule).length === 0
                    ? <p className="text-sm text-center py-6 text-muted-foreground">Nenhum orçamento cadastrado ainda.<br/><span className="text-xs">Crie propostas na aba Propostas para ver dados reais.</span></p>
                    : Object.entries(kpis.byModule).map(([mod, value]) => {
                        const m = MODULE_MAP[mod] || { label: mod, color: "text-muted-foreground" }
                        const pct = kpis.totalReceita > 0 ? (value / kpis.totalReceita) * 100 : 0
                        return (
                          <div key={mod} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className={`font-medium ${m.color}`}>{m.label}</span>
                              <span className="text-muted-foreground">{pct.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <div className="text-right text-xs text-muted-foreground">{fmt(value)}</div>
                          </div>
                        )
                      })
                  }
                </CardContent>
              </Card>

              <Card><CardHeader><CardTitle>Status das Propostas</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(STATUS_MAP).map(([key, sm]) => {
                    const count = proposals.filter(p => p.status === key).length
                    const Icon  = sm.icon
                    return (
                      <div key={key} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{sm.label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: proposals.length ? `${(count/proposals.length)*100}%` : "0%" }} />
                          </div>
                          <Badge variant="outline" className={`text-xs ${sm.color}`}>{count}</Badge>
                        </div>
                      </div>
                    )
                  })}
                  {proposals.length === 0 && (
                    <p className="text-sm text-center py-4 text-muted-foreground">Nenhuma proposta ainda. Use a aba Propostas para criar.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Propostas ── */}
          <TabsContent value="propostas" className="space-y-6">
            <ProposalsManagement />
          </TabsContent>

          {/* ── Produtos ── */}
          <TabsContent value="produtos" className="space-y-6">
            <ProductsTab />
          </TabsContent>

          {/* ── Analytics ── */}
          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsTab proposals={proposals} />
          </TabsContent>

          {/* ── Relatórios ── */}
          <TabsContent value="relatorios" className="space-y-6">
            <ReportsTab proposals={proposals} />
          </TabsContent>

          {/* ── Clientes ── */}
          <TabsContent value="clientes" className="space-y-6">
            <ClientsTab proposals={proposals} />
          </TabsContent>

          {/* ── Configurações ── */}
          <TabsContent value="configuracoes" className="space-y-6">
            <ConfigurationModule />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
