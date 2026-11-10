"use client"

import { useMemo, useState } from "react"
import { ShoppingCart, Calendar, Wrench, BarChart3, Users, Settings, Zap, Shield, TrendingUp, FileText } from "lucide-react"
import { ModuleLauncher } from '@/components/shared/ModuleLauncher'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { MobileNav } from "@/components/mobile-nav"
import { SalesModule } from "./SalesModule"
import { RentalModule } from "./RentalModule"
import { ServiceModule } from "./ServiceModule"
import { AdminModule } from "./AdminModule"
import { ProposalCreation } from "./ProposalCreation"
import { ProposalsManagement } from "./ProposalsManagement"
import { useProposalStore } from "@/lib/stores/proposal-store"
import type { ProposalClientData } from "@/components/shared/ProposalClientDataForm"

type ModuleType = "home" | "sales" | "rental" | "services" | "admin" | "proposal" | "proposals"

interface ITPricingModuleProps {
    onNavigateToProposals?: () => void
}

export function ITPricingModule({ onNavigateToProposals }: ITPricingModuleProps = {}) {
    const [currentModule, setCurrentModule] = useState<ModuleType>("home")
    const [useProposalDataForCalculator, setUseProposalDataForCalculator] = useState(false)
    const currentProposal = useProposalStore((state) => state.currentProposal)

    const proposalClientData = useMemo<ProposalClientData | null>(() => {
        if (!useProposalDataForCalculator || !currentProposal) {
            return null
        }

        return {
            clientName: currentProposal.clientName,
            clientEmail: currentProposal.clientEmail,
            clientPhone: currentProposal.clientPhone,
            companyName: currentProposal.clientCompany,
            cnpj: currentProposal.clientCNPJ || "",
            address: currentProposal.clientAddress || "",
            projectName: currentProposal.projectName,
            projectType: currentProposal.projectType || "",
            projectDescription: currentProposal.projectDescription || "",
            deliveryDate: currentProposal.deliveryDate || "",
            estimatedBudget: currentProposal.estimatedBudget || "",
            managerName: currentProposal.managerName,
            managerEmail: currentProposal.managerEmail,
            managerPhone: currentProposal.managerPhone,
            department: currentProposal.managerDepartment || "",
        }
    }, [currentProposal, useProposalDataForCalculator])

    const handleBack = () => {
        setUseProposalDataForCalculator(false)
        setCurrentModule("home")
    }

    const handleNavigate = (module: string) => {
        setCurrentModule(module as ModuleType)
    }

    const handleModuleChange = (module: 'sales' | 'rental' | 'services') => {
        setCurrentModule(module)
    }

    if (currentModule === "sales") {
        return <SalesModule onBack={handleBack} onModuleChange={handleModuleChange} onNavigateToProposals={onNavigateToProposals} proposalClientData={proposalClientData} />
    }

    if (currentModule === "rental") {
        return <RentalModule onBack={handleBack} onModuleChange={handleModuleChange} onNavigateToProposals={onNavigateToProposals} proposalClientData={proposalClientData} />
    }

    if (currentModule === "services") {
        return <ServiceModule onBack={handleBack} onModuleChange={handleModuleChange} onNavigateToProposals={onNavigateToProposals} proposalClientData={proposalClientData} />
    }

    if (currentModule === "admin") {
        return <AdminModule onBack={handleBack} />
    }

    if (currentModule === "proposal") {
        return (
            <ProposalCreation
                onBack={handleBack}
                onSelectModule={(module) => {
                    if (module === "sales" || module === "rental" || module === "services") {
                        setUseProposalDataForCalculator(true)
                    } else {
                        setUseProposalDataForCalculator(false)
                    }
                    setCurrentModule(module as ModuleType)
                }}
            />
        )
    }

    if (currentModule === "proposals") {
        return <ProposalsManagement onBack={handleBack} />
    }

    return <ModuleLauncher title="Venda, locação e serviços" description="Crie composições comerciais com custos, impostos, margens e recorrência no mesmo contexto." module="IT Sales/Rental/Services" onConfigure={() => setCurrentModule('admin')} onOpenQuotes={onNavigateToProposals} extraActions={<Button onClick={() => setCurrentModule('proposal')}><FileText className="h-4 w-4" />Nova proposta</Button>} actions={[
      { title: 'Venda de produtos', description: 'Organize itens, custo de aquisição, impostos e margem para uma venda.', icon: <ShoppingCart className="h-5 w-5" />, label: 'Precificar venda', onClick: () => { setUseProposalDataForCalculator(false); setCurrentModule('sales'); } },
      { title: 'Locação', description: 'Avalie investimentos, prazo contratual, custos e valor recorrente.', icon: <Calendar className="h-5 w-5" />, label: 'Precificar locação', onClick: () => { setUseProposalDataForCalculator(false); setCurrentModule('rental'); } },
      { title: 'Serviços', description: 'Componha atividades, recursos e custos para uma prestação de serviços.', icon: <Wrench className="h-5 w-5" />, label: 'Precificar serviço', onClick: () => { setUseProposalDataForCalculator(false); setCurrentModule('services'); } }
    ]} help="Escolha a modalidade, informe os itens e revise custos, impostos e margem. Identifique o cliente na proposta e confira os valores e o prazo contratual antes de salvar ou exportar." />
}
