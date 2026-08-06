"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, Settings, Building, Calculator, BarChart3, Users, Edit, Save, Printer, Monitor, Headphones } from "lucide-react"
import type { TaxRegime } from "@/lib/types/tax-regimes"
import type { CostsExpenses } from "@/lib/types/costs-expenses"
import { initialCostsExpenses } from "@/lib/types/costs-expenses"
import type { LaborCosts } from "@/lib/types/labor-costs"
import { initialLaborCosts } from "@/lib/types/labor-costs"
import type { CompanyData } from "@/lib/types/company-data"
import type { OutsourcingConfig, ModuleTaxConfig } from "@/lib/stores/configuration-store"
import { defaultICMSRates, stateNames, type ICMSInterstateRates } from "@/lib/types/pricing"
import { useConfigurationStore } from "@/lib/stores/configuration-store"

export function ConfigurationModule() {
  const { 
    taxRegimes, 
    costsExpenses, 
    laborCosts, 
    companyData: storeCompanyData,
    icmsRates: storeIcmsRates,
    outsourcingConfig: storeOutsourcingConfig,
    nocConfig: storeNocConfig,
    serviceDeskConfig: storeServiceDeskConfig,
    setTaxRegimes, 
    setCostsExpenses, 
    setLaborCosts,
    setCompanyData,
    setIcmsRates,
    setOutsourcingConfig,
    setNocConfig,
    setServiceDeskConfig,
  } = useConfigurationStore()
  
  // Estados locais para edição — sempre merge com valores iniciais para evitar NaN
  const [localTaxRegimes, setLocalTaxRegimes] = useState<TaxRegime[]>(taxRegimes || [])
  const [localCostsExpenses, setLocalCostsExpenses] = useState<CostsExpenses>({
    ...initialCostsExpenses,
    ...(costsExpenses || {}),
  })
  const [localLaborCosts, setLocalLaborCosts] = useState<LaborCosts>({
    ...initialLaborCosts,
    ...(laborCosts || {}),
  })
  const [companyData, setCompanyDataLocal] = useState<CompanyData>(storeCompanyData)
  const [icmsRates, setIcmsRatesLocal] = useState<ICMSInterstateRates>(storeIcmsRates || defaultICMSRates)
  
  const [isEditingCosts, setIsEditingCosts] = useState(false)
  const [isEditingLabor, setIsEditingLabor] = useState(false)
  const [isEditingCompany, setIsEditingCompany] = useState(false)
  const [isEditingICMS, setIsEditingICMS] = useState(false)
  const [isEditingOutsourcing, setIsEditingOutsourcing] = useState(false)
  const [editingRegime, setEditingRegime] = useState<TaxRegime | null>(null)
  const [localOutsourcingConfig, setLocalOutsourcingConfig] = useState<OutsourcingConfig>(storeOutsourcingConfig)
  const [localNocConfig, setLocalNocConfig] = useState<ModuleTaxConfig>(storeNocConfig)
  const [localServiceDeskConfig, setLocalServiceDeskConfig] = useState<ModuleTaxConfig>(storeServiceDeskConfig)

  // Sincronizar estados locais quando o store muda
  useEffect(() => {
    if (taxRegimes) {
      setLocalTaxRegimes(taxRegimes)
    }
  }, [taxRegimes])

  useEffect(() => {
    if (costsExpenses) {
      setLocalCostsExpenses({ ...initialCostsExpenses, ...costsExpenses })
    }
  }, [costsExpenses])

  useEffect(() => {
    if (laborCosts) {
      setLocalLaborCosts({ ...initialLaborCosts, ...laborCosts })
    }
  }, [laborCosts])

  useEffect(() => {
    if (storeCompanyData) {
      setCompanyDataLocal(storeCompanyData)
    }
  }, [storeCompanyData])

  useEffect(() => {
    if (storeIcmsRates) {
      setIcmsRatesLocal(storeIcmsRates)
    }
  }, [storeIcmsRates])

  useEffect(() => {
    setLocalOutsourcingConfig(storeOutsourcingConfig)
  }, [storeOutsourcingConfig])

  useEffect(() => {
    setLocalNocConfig(storeNocConfig)
  }, [storeNocConfig])

  useEffect(() => {
    setLocalServiceDeskConfig(storeServiceDeskConfig)
  }, [storeServiceDeskConfig])

  const handleToggleActive = (id: string) => {
    const current = (taxRegimes || []).find((r) => r.id === id)
    const willActivate = !(current?.active ?? false)

    const updatedRegimes = (taxRegimes || []).map((regime) => {
      if (regime.id === id) {
        return { ...regime, active: willActivate, updatedAt: new Date() }
      }
      return willActivate ? { ...regime, active: false, updatedAt: new Date() } : regime
    })
    setTaxRegimes(updatedRegimes)
  }

  const handleUpdateRegime = (field: keyof TaxRegime, value: any, id: string) => {
    const updatedRegimes = (taxRegimes || []).map((regime) =>
      regime.id === id ? { ...regime, [field]: value, updatedAt: new Date() } : regime,
    )
    setTaxRegimes(updatedRegimes)
  }

  const handleSaveCosts = () => {
    setCostsExpenses({ ...localCostsExpenses, updatedAt: new Date() })
    setIsEditingCosts(false)
  }

  const handleSaveLabor = () => {
    // Recalcular valores
    const totalEncargos = (localLaborCosts.ferias ?? 0) + (localLaborCosts.umTercoFerias ?? 0) + (localLaborCosts.decimoTerceiro ?? 0) + 
                         (localLaborCosts.inssBase ?? 0) + (localLaborCosts.inssSistemaS ?? 0) + (localLaborCosts.inssFeriasDecimo ?? 0) +
                         (localLaborCosts.fgts ?? 0) + (localLaborCosts.fgtsFeriasDecimo ?? 0) + (localLaborCosts.multaFgtsRescisao ?? 0) + (localLaborCosts.outros ?? 0)
    
    const totalBeneficios = (localLaborCosts.valeTransporte ?? 0) + (localLaborCosts.planoSaude ?? 0) + (localLaborCosts.valeAlimentacao ?? 0)
    
    const horasMes = (localLaborCosts.diasUteisNoMes ?? 1) * (localLaborCosts.horasPorDia ?? 1)
    const custoHora = ((localLaborCosts.salarioBasePadrao ?? 0) * (1 + totalEncargos / 100) + totalBeneficios) / horasMes
    const valorVendaHora = custoHora * 1.66 // Aplicando margem padrão
    
    const updatedLaborCosts = {
      ...localLaborCosts,
      totalEncargos,
      totalBeneficios,
      custoHora,
      valorVendaHora,
      updatedAt: new Date()
    }
    
    setLaborCosts(updatedLaborCosts)
    setLocalLaborCosts(updatedLaborCosts)
    setIsEditingLabor(false)
  }

  const handleSaveCompany = () => {
    setCompanyData(companyData)
    setIsEditingCompany(false)
  }

  const handleSaveICMS = () => {
    setIcmsRates(icmsRates)
    setIsEditingICMS(false)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Configurações Gerais e Tributárias</h2>
          <p className="text-muted-foreground">Gerencie regimes tributários, custos e dados da empresa</p>
        </div>
      </div>

      <Tabs defaultValue="regimes" className="space-y-6">
        <TabsList className="flex flex-wrap w-full gap-1">
          <TabsTrigger value="regimes" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Regimes Tributários
          </TabsTrigger>
          <TabsTrigger value="custos" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Custos e Despesas
          </TabsTrigger>
          <TabsTrigger value="mao-obra" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Mão de Obra
          </TabsTrigger>
          <TabsTrigger value="outsourcing" className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Outsourcing
          </TabsTrigger>
          <TabsTrigger value="noc" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            NOC/SOC/SIEM
          </TabsTrigger>
          <TabsTrigger value="service-desk" className="flex items-center gap-2">
            <Headphones className="h-4 w-4" />
            Service Desk
          </TabsTrigger>
          <TabsTrigger value="icms" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            ICMS Interestadual
          </TabsTrigger>
          <TabsTrigger value="empresa" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Dados da Empresa
          </TabsTrigger>
        </TabsList>

        {/* Regimes Tributários */}
        <TabsContent value="regimes" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Gerenciar Regimes</h3>
          </div>

          <div className="space-y-4">
            {(taxRegimes || []).map((regime) => (
              <Card key={regime.id} className="border-2">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">{regime.name}</CardTitle>
                      <Badge variant={regime.active ? "default" : "secondary"}>
                        {regime.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={regime.active} onCheckedChange={() => handleToggleActive(regime.id)} />
                      <Button variant="ghost" size="sm" onClick={() => setEditingRegime(regime)}>
                        <Edit className="h-4 w-4" />
                        Editar
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Tipo</Label>
                      <select
                        value={regime.type}
                        onChange={(e) => handleUpdateRegime("type", e.target.value, regime.id)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="presumido">Lucro Presumido</option>
                        <option value="real">Lucro Real</option>
                        <option value="simples">Simples Nacional</option>
                        <option value="mei">MEI</option>
                        <option value="iva">IVA (IBS + CBS)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">PIS</Label>
                      <div className="flex items-center gap-1">
                        <Input 
                          value={regime.pis} 
                          onChange={(e) => handleUpdateRegime('pis', e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0), regime.id)}
                          className="text-center" 
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">COFINS</Label>
                      <div className="flex items-center gap-1">
                        <Input 
                          value={regime.cofins} 
                          onChange={(e) => handleUpdateRegime('cofins', e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0), regime.id)}
                          className="text-center" 
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">CSLL</Label>
                      <div className="flex items-center gap-1">
                        <Input 
                          value={regime.csll} 
                          onChange={(e) => handleUpdateRegime('csll', e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0), regime.id)}
                          className="text-center" 
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">IRPJ</Label>
                      <div className="flex items-center gap-1">
                        <Input 
                          value={regime.irpj} 
                          onChange={(e) => handleUpdateRegime('irpj', e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0), regime.id)}
                          className="text-center" 
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">ICMS</Label>
                      <div className="flex items-center gap-1">
                        <Input 
                          value={regime.icms} 
                          onChange={(e) => handleUpdateRegime('icms', e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0), regime.id)}
                          className="text-center" 
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">ISS</Label>
                      <div className="flex items-center gap-1">
                        <Input 
                          value={regime.iss} 
                          onChange={(e) => handleUpdateRegime('iss', e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0), regime.id)}
                          className="text-center" 
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Base Presunção Venda</Label>
                      <div className="flex items-center gap-1">
                        <Input 
                          value={regime.basePresuncaoVenda} 
                          onChange={(e) => handleUpdateRegime('basePresuncaoVenda', e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0), regime.id)}
                          className="text-center" 
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Base Presunção Serviço</Label>
                      <div className="flex items-center gap-1">
                        <Input 
                          value={regime.basePresuncaoServico} 
                          onChange={(e) => handleUpdateRegime('basePresuncaoServico', e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0), regime.id)}
                          className="text-center" 
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Simples (Anexo I)</Label>
                      <div className="flex items-center gap-1">
                        <Input
                          value={regime.anexoI}
                          onChange={(e) => handleUpdateRegime('anexoI', e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0), regime.id)}
                          className="text-center"
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Simples (Anexo III)</Label>
                      <div className="flex items-center gap-1">
                        <Input
                          value={regime.anexoIII}
                          onChange={(e) => handleUpdateRegime('anexoIII', e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0), regime.id)}
                          className="text-center"
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">MEI (Taxa)</Label>
                      <div className="flex items-center gap-1">
                        <Input
                          value={regime.meiTaxa}
                          onChange={(e) => handleUpdateRegime('meiTaxa', e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0), regime.id)}
                          className="text-center"
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    </div>
                  </div>

                  {/* IVA Fields - only visible when type is IVA */}
                  {regime.type === 'iva' && (
                    <div className="mt-4 p-4 border border-blue-200 bg-blue-50 rounded-lg">
                      <h4 className="text-sm font-semibold text-blue-800 mb-3">IVA - Reforma Tributária (EC 132/2023)</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">CBS (Federal)</Label>
                          <div className="flex items-center gap-1">
                            <Input
                              value={regime.ivaCbs}
                              onChange={(e) => handleUpdateRegime('ivaCbs', e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0), regime.id)}
                              className="text-center"
                            />
                            <span className="text-sm text-muted-foreground">%</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">IBS (Estadual/Municipal)</Label>
                          <div className="flex items-center gap-1">
                            <Input
                              value={regime.ivaIbs}
                              onChange={(e) => handleUpdateRegime('ivaIbs', e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0), regime.id)}
                              className="text-center"
                            />
                            <span className="text-sm text-muted-foreground">%</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Total IVA</Label>
                          <div className="flex items-center gap-1">
                            <Input
                              value={regime.ivaTotal}
                              onChange={(e) => handleUpdateRegime('ivaTotal', e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0), regime.id)}
                              className="text-center font-bold"
                            />
                            <span className="text-sm text-muted-foreground">%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Custos e Despesas */}
        <TabsContent value="custos">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Custos e Despesas Globais (%)</CardTitle>
                <Button onClick={() => setIsEditingCosts(!isEditingCosts)} className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  {isEditingCosts ? 'Salvar' : 'Editar'} Configurações
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Comissão Venda</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      value={localCostsExpenses.comissaoVenda ?? 0} 
                      onChange={(e) => setLocalCostsExpenses({...localCostsExpenses, comissaoVenda: e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0)})}
                      readOnly={!isEditingCosts}
                      className="text-center" 
                    />
                    <span className="text-sm text-primary font-medium">%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Comissão Locação</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      value={localCostsExpenses.comissaoLocacao ?? 0} 
                      onChange={(e) => setLocalCostsExpenses({...localCostsExpenses, comissaoLocacao: e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0)})}
                      readOnly={!isEditingCosts}
                      className="text-center" 
                    />
                    <span className="text-sm text-primary font-medium">%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Comissão Serviço</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      value={localCostsExpenses.comissaoServico ?? 0} 
                      onChange={(e) => setLocalCostsExpenses({...localCostsExpenses, comissaoServico: e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0)})}
                      readOnly={!isEditingCosts}
                      className="text-center" 
                    />
                    <span className="text-sm text-primary font-medium">%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Margem Lucro Serviço</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      value={localCostsExpenses.margemLucroServico ?? 0} 
                      onChange={(e) => setLocalCostsExpenses({...localCostsExpenses, margemLucroServico: e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0)})}
                      readOnly={!isEditingCosts}
                      className="text-center" 
                    />
                    <span className="text-sm text-primary font-medium">%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Despesas Admin.</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      value={localCostsExpenses.despesasAdmin ?? 0} 
                      onChange={(e) => setLocalCostsExpenses({...localCostsExpenses, despesasAdmin: e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0)})}
                      readOnly={!isEditingCosts}
                      className="text-center" 
                    />
                    <span className="text-sm text-primary font-medium">%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Outras Despesas</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      value={localCostsExpenses.outrasDespesas ?? 0} 
                      onChange={(e) => setLocalCostsExpenses({...localCostsExpenses, outrasDespesas: e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0)})}
                      readOnly={!isEditingCosts}
                      className="text-center" 
                    />
                    <span className="text-sm text-primary font-medium">%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Custo Financeiro Mensal</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      value={localCostsExpenses.custoFinanceiroMensal ?? 0} 
                      onChange={(e) => setLocalCostsExpenses({...localCostsExpenses, custoFinanceiroMensal: e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0)})}
                      readOnly={!isEditingCosts}
                      className="text-center" 
                    />
                    <span className="text-sm text-primary font-medium">%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Taxa Desconto VPL</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      value={localCostsExpenses.taxaDescontoVPL ?? 0} 
                      onChange={(e) => setLocalCostsExpenses({...localCostsExpenses, taxaDescontoVPL: e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0)})}
                      readOnly={!isEditingCosts}
                      className="text-center" 
                    />
                    <span className="text-sm text-primary font-medium">%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Depreciação</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      value={localCostsExpenses.depreciacao ?? 0} 
                      onChange={(e) => setLocalCostsExpenses({...localCostsExpenses, depreciacao: e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0)})}
                      readOnly={!isEditingCosts}
                      className="text-center" 
                    />
                    <span className="text-sm text-primary font-medium">%</span>
                  </div>
                </div>
              </div>
              {isEditingCosts && (
                <div className="flex justify-end mt-4">
                  <Button onClick={handleSaveCosts} className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Salvar Alterações
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mão de Obra */}
        <TabsContent value="mao-obra">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Gasto com Mão de Obra</CardTitle>
                <Button onClick={() => setIsEditingLabor(!isEditingLabor)} className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  {isEditingLabor ? 'Salvar' : 'Editar'} Configurações
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Encargos Sociais */}
                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-lg text-primary">Encargos Sociais (CLT)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Férias</Label>
                        <div className="flex items-center gap-2">
                          <Input 
                            value={localLaborCosts.ferias ?? 0} 
                            onChange={(e) => setLocalLaborCosts({...localLaborCosts, ferias: e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0)})}
                            readOnly={!isEditingLabor}
                            className="text-center" 
                          />
                          <span className="text-sm text-primary font-medium">%</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">1/3 Férias</Label>
                        <div className="flex items-center gap-2">
                          <Input 
                            value={localLaborCosts.umTercoFerias ?? 0} 
                            onChange={(e) => setLocalLaborCosts({...localLaborCosts, umTercoFerias: e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0)})}
                            readOnly={!isEditingLabor}
                            className="text-center" 
                          />
                          <span className="text-sm text-primary font-medium">%</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">13º Salário</Label>
                        <div className="flex items-center gap-2">
                          <Input 
                            value={localLaborCosts.decimoTerceiro ?? 0} 
                            onChange={(e) => setLocalLaborCosts({...localLaborCosts, decimoTerceiro: e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0)})}
                            readOnly={!isEditingLabor}
                            className="text-center" 
                          />
                          <span className="text-sm text-primary font-medium">%</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">INSS (Base)</Label>
                        <div className="flex items-center gap-2">
                          <Input 
                            value={localLaborCosts.inssBase ?? 0} 
                            onChange={(e) => setLocalLaborCosts({...localLaborCosts, inssBase: e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0)})}
                            readOnly={!isEditingLabor}
                            className="text-center" 
                          />
                          <span className="text-sm text-primary font-medium">%</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">FGTS</Label>
                        <div className="flex items-center gap-2">
                          <Input 
                            value={localLaborCosts.fgts ?? 0} 
                            onChange={(e) => setLocalLaborCosts({...localLaborCosts, fgts: e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0)})}
                            readOnly={!isEditingLabor}
                            className="text-center" 
                          />
                          <span className="text-sm text-primary font-medium">%</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Outros</Label>
                        <div className="flex items-center gap-2">
                          <Input 
                            value={localLaborCosts.outros ?? 0} 
                            onChange={(e) => setLocalLaborCosts({...localLaborCosts, outros: e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0)})}
                            readOnly={!isEditingLabor}
                            className="text-center" 
                          />
                          <span className="text-sm text-primary font-medium">%</span>
                        </div>
                      </div>
                    </div>
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Total Encargos:</span>
                        <span className="text-lg font-bold text-primary">{(localLaborCosts.totalEncargos ?? 0).toFixed(2)}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Benefícios */}
                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-lg text-primary">Benefícios (CLT)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Vale Transporte</Label>
                        <div className="flex items-center gap-2">
                          <Input 
                            value={localLaborCosts.valeTransporte ?? 0} 
                            onChange={(e) => setLocalLaborCosts({...localLaborCosts, valeTransporte: e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0)})}
                            readOnly={!isEditingLabor}
                            className="text-center" 
                          />
                          <span className="text-sm text-primary font-medium">R$</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Plano de Saúde</Label>
                        <div className="flex items-center gap-2">
                          <Input 
                            value={localLaborCosts.planoSaude ?? 0} 
                            onChange={(e) => setLocalLaborCosts({...localLaborCosts, planoSaude: e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0)})}
                            readOnly={!isEditingLabor}
                            className="text-center" 
                          />
                          <span className="text-sm text-primary font-medium">R$</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Vale Alimentação</Label>
                        <div className="flex items-center gap-2">
                          <Input 
                            value={localLaborCosts.valeAlimentacao ?? 0} 
                            onChange={(e) => setLocalLaborCosts({...localLaborCosts, valeAlimentacao: e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0)})}
                            readOnly={!isEditingLabor}
                            className="text-center" 
                          />
                          <span className="text-sm text-primary font-medium">R$</span>
                        </div>
                      </div>
                    </div>
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Total Benefícios:</span>
                        <span className="text-lg font-bold text-primary">
                          R$ {localLaborCosts.totalBeneficios.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Parâmetros Gerais */}
                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-lg text-primary">Parâmetros Gerais</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Salário Base Padrão</Label>
                        <div className="flex items-center gap-2">
                          <Input 
                            value={localLaborCosts.salarioBasePadrao ?? 0} 
                            onChange={(e) => setLocalLaborCosts({...localLaborCosts, salarioBasePadrao: e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0)})}
                            readOnly={!isEditingLabor}
                            className="text-center" 
                          />
                          <span className="text-sm text-primary font-medium">R$</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Dias Úteis no Mês</Label>
                        <Input 
                          value={localLaborCosts.diasUteisNoMes ?? 0} 
                          onChange={(e) => setLocalLaborCosts({...localLaborCosts, diasUteisNoMes: e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0)})}
                          readOnly={!isEditingLabor}
                          className="text-center" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Horas/Dia</Label>
                        <Input 
                          value={localLaborCosts.horasPorDia ?? 0} 
                          onChange={(e) => setLocalLaborCosts({...localLaborCosts, horasPorDia: e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0)})}
                          readOnly={!isEditingLabor}
                          className="text-center" 
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calculator className="h-4 w-4 text-primary" />
                          <span className="font-medium">Custo/Hora (CLT)</span>
                        </div>
                        <span className="text-lg font-bold text-primary">
                          R$ {localLaborCosts.custoHora.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">💰</span>
                          <span className="font-medium">Valor/Venda (Hora)</span>
                        </div>
                        <span className="text-lg font-bold text-green-600">
                          R$ {localLaborCosts.valorVendaHora.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              {isEditingLabor && (
                <div className="flex justify-end mt-4">
                  <Button onClick={handleSaveLabor} className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Salvar e Recalcular
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Outsourcing de Impressão */}
        <TabsContent value="outsourcing">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Configuração de Outsourcing de Impressão</CardTitle>
                <Button onClick={() => {
                  if (isEditingOutsourcing) {
                    setOutsourcingConfig(localOutsourcingConfig)
                    setIsEditingOutsourcing(false)
                  } else {
                    setIsEditingOutsourcing(true)
                  }
                }} className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  {isEditingOutsourcing ? 'Salvar' : 'Editar'} Configurações
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Regime Tributário */}
              <div className="p-4 border rounded-lg bg-muted/30">
                <h3 className="font-semibold mb-3">Regime Tributário para Outsourcing</h3>
                <div className="space-y-2">
                  <Label>Selecione o Regime Tributário</Label>
                  <select
                    value={localOutsourcingConfig.taxRegimeId || ''}
                    onChange={(e) => setLocalOutsourcingConfig({
                      ...localOutsourcingConfig,
                      taxRegimeId: e.target.value || null
                    })}
                    disabled={!isEditingOutsourcing}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Usar regime ativo do sistema</option>
                    {taxRegimes.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name} {r.active ? '(Ativo)' : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Se nenhum regime for selecionado, o regime ativo nas configurações gerais será usado.
                  </p>
                </div>
              </div>

              {/* Comissões e Custos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Comissão de Venda (%)</Label>
                  <Input
                    value={localOutsourcingConfig.comissaoVenda}
                    onChange={(e) => setLocalOutsourcingConfig({...localOutsourcingConfig, comissaoVenda: e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0)})}
                    readOnly={!isEditingOutsourcing}
                    className="text-center"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Custos Operacionais (%)</Label>
                  <Input
                    value={localOutsourcingConfig.custosOperacionais}
                    onChange={(e) => setLocalOutsourcingConfig({...localOutsourcingConfig, custosOperacionais: e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0)})}
                    readOnly={!isEditingOutsourcing}
                    className="text-center"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Margem Padrão (%)</Label>
                  <Input
                    value={localOutsourcingConfig.margemPadrao}
                    onChange={(e) => setLocalOutsourcingConfig({...localOutsourcingConfig, margemPadrao: e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0)})}
                    readOnly={!isEditingOutsourcing}
                    className="text-center"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Taxa Financeira Mensal (%)</Label>
                <div className="flex items-center gap-2 max-w-xs">
                  <Input
                    value={localOutsourcingConfig.taxaFinanceiraMensal}
                    onChange={(e) => setLocalOutsourcingConfig({...localOutsourcingConfig, taxaFinanceiraMensal: e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0)})}
                    readOnly={!isEditingOutsourcing}
                    className="text-center"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>

              {/* Custos Base por Tipo de Impressão */}
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-3">Custos Base por Tipo de Impressão (R$/página)</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Usados como referência quando não há cálculo detalhado disponível
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(localOutsourcingConfig.custosBase).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <Label className="text-sm">{key}</Label>
                      <Input
                        value={value}
                        step="0.001"
                        onChange={(e) => setLocalOutsourcingConfig({
                          ...localOutsourcingConfig,
                          custosBase: { ...localOutsourcingConfig.custosBase, [key]: e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0) }
                        })}
                        readOnly={!isEditingOutsourcing}
                        className="text-center"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {isEditingOutsourcing && (
                <div className="flex justify-end">
                  <Button onClick={() => {
                    setOutsourcingConfig(localOutsourcingConfig)
                    setIsEditingOutsourcing(false)
                  }} className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Salvar Configurações
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* NOC/SOC/SIEM */}
        <TabsContent value="noc">
          <Card>
            <CardHeader>
              <CardTitle>Configuração de NOC/SOC/SIEM</CardTitle>
              <p className="text-sm text-muted-foreground">
                Selecione o regime tributário para os módulos de NOC, SOC e SIEM
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 border rounded-lg bg-muted/30">
                <h3 className="font-semibold mb-3">Regime Tributário</h3>
                <div className="space-y-2">
                  <Label>Selecione o Regime</Label>
                  <select
                    value={localNocConfig.taxRegimeId || ''}
                    onChange={(e) => setLocalNocConfig({
                      taxRegimeId: e.target.value || null
                    })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Usar regime ativo do sistema</option>
                    {taxRegimes.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name} {r.active ? '(Ativo)' : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Se nenhum regime for selecionado, o regime ativo nas configurações gerais será usado.
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => {
                  setNocConfig(localNocConfig)
                }} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Salvar Configuração
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Service Desk */}
        <TabsContent value="service-desk">
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Service Desk</CardTitle>
              <p className="text-sm text-muted-foreground">
                Selecione o regime tributário para o módulo de Service Desk
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 border rounded-lg bg-muted/30">
                <h3 className="font-semibold mb-3">Regime Tributário</h3>
                <div className="space-y-2">
                  <Label>Selecione o Regime</Label>
                  <select
                    value={localServiceDeskConfig.taxRegimeId || ''}
                    onChange={(e) => setLocalServiceDeskConfig({
                      taxRegimeId: e.target.value || null
                    })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Usar regime ativo do sistema</option>
                    {taxRegimes.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name} {r.active ? '(Ativo)' : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Se nenhum regime for selecionado, o regime ativo nas configurações gerais será usado.
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => {
                  setServiceDeskConfig(localServiceDeskConfig)
                }} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Salvar Configuração
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ICMS Interestadual */}
        <TabsContent value="icms">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Taxas ICMS Interestaduais (%)</CardTitle>
                <Button onClick={() => setIsEditingICMS(!isEditingICMS)} className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  {isEditingICMS ? 'Salvar' : 'Editar'} Taxas
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-6 gap-4">
                {Object.entries(stateNames).map(([uf, name]) => (
                  <div key={uf} className="space-y-2">
                    <Label className="text-sm font-medium">{uf}</Label>
                    <div className="flex items-center gap-1">
                      <Input
                        value={icmsRates[uf as keyof ICMSInterstateRates]}
                        onChange={(e) => setIcmsRatesLocal({...icmsRates, [uf]: e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0)})}
                        readOnly={!isEditingICMS}
                        className="text-center text-sm"
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                  </div>
                ))}
              </div>
              {isEditingICMS && (
                <div className="flex justify-end mt-4">
                  <Button onClick={handleSaveICMS} className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Salvar Taxas
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dados da Empresa */}
        <TabsContent value="empresa">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Dados da Empresa</CardTitle>
                <Button onClick={() => setIsEditingCompany(!isEditingCompany)} className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  {isEditingCompany ? 'Salvar' : 'Editar'} Dados
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Razão Social / Nome Fantasia</Label>
                  <Input
                    value={companyData.name}
                    onChange={(e) => setCompanyDataLocal({...companyData, name: e.target.value})}
                    readOnly={!isEditingCompany}
                    placeholder="Nome da sua empresa"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">CNPJ</Label>
                  <Input
                    value={companyData.cnpj}
                    onChange={(e) => setCompanyDataLocal({...companyData, cnpj: e.target.value})}
                    readOnly={!isEditingCompany}
                    placeholder="00.000.000/0001-00"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Endereço</Label>
                  <Input
                    value={companyData.address}
                    onChange={(e) => setCompanyDataLocal({...companyData, address: e.target.value})}
                    readOnly={!isEditingCompany}
                    placeholder="Rua, número, bairro"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Cidade - Estado</Label>
                  <Input
                    value={companyData.cityState}
                    onChange={(e) => setCompanyDataLocal({...companyData, cityState: e.target.value})}
                    readOnly={!isEditingCompany}
                    placeholder="Cidade - UF"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Telefone</Label>
                  <Input
                    value={companyData.phone}
                    onChange={(e) => setCompanyDataLocal({...companyData, phone: e.target.value})}
                    readOnly={!isEditingCompany}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">E-mail</Label>
                  <Input
                    value={companyData.email}
                    onChange={(e) => setCompanyDataLocal({...companyData, email: e.target.value})}
                    readOnly={!isEditingCompany}
                    placeholder="contato@empresa.com"
                  />
                </div>
              </div>
              {isEditingCompany && (
                <div className="flex justify-end mt-4">
                  <Button onClick={handleSaveCompany} className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Salvar Dados
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
