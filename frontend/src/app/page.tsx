// src/app/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react'; // Mantenha todos os hooks necessários
// Importação de useAuth removida
// import { useAuth } from "@/hooks/use-auth";
import { useRouter } from 'next/navigation';
import {
    Loader2, LogOut, User, Briefcase, BarChart, Search, Menu,
    Users, DollarSign, Archive, Calculator, PlusCircle,
    Trash2, Edit, Building, ShoppingCart, ExternalLink, FileDown, Paperclip,
    X, Server, Headset, Printer, ChevronDown, Tag, Info, Settings, FileText,
    BarChart2, TrendingUp, Percent, ShoppingBag, Repeat, Wrench, Zap,
    CheckCircle, Award, Gavel, Moon, Sun, Brain, CheckSquare, BarChart3, Globe // Ícones para o botão de tema
} from 'lucide-react'; // Importe todos os ícones usados diretamente aqui

// Importe seus componentes de UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Header } from '@/components/ui/header';

// Importe seus componentes de View
import DashboardView from '@/components/dashboard/DashboardOverview';
import { ApplicationShell } from '@/components/layout/application-shell';
import { useModuleNavigation } from '@/hooks/use-module-navigation';
import PartnerView from '@/components/partners/PartnerView';
import QuotesView from '@/components/quotes/QuotesView';
import ProposalsView from '@/components/proposals/ProposalsView';
import RoManagementView from '@/components/ro-management/RoManagementView';
import TrainingManagementView from '@/components/training-management/TrainingManagementView';
import CalculatorFrame from '@/components/calculators/CalculatorFrame';
import BidsAnalysis from '@/components/bids/BidsAnalysis';
import BidsDocumentationView from '@/components/bids/BidsDocumentationView';
import PortalBusca from '@/components/bids/PortalBusca';
import RFPView from '@/components/rfp/RFPView';
import PriceRecordView from '@/components/price-records/PriceRecordView';
import EditalAnalysisView from '@/components/edital-analysis/EditalAnalysisView';
import AIBidAnalyzer from '@/components/ai-bid-analyzer/AIBidAnalyzer';
import { ITAssessmentView } from '@/components/it-assessment';
import { POCManagementView } from '@/components/poc';

import { ITPricingModule } from '@/components/it-pricing/ITPricingModule';
import { SettingsView } from '@/components/settings/SettingsView';
import { RoChartsView } from '@/components/dashboard/RoChartsView';
import { NOCModuleWrapper } from '@/components/noc-pricing/NOCModuleWrapper';
import { ServiceDeskModuleWrapper } from '@/components/service-desk-pricing/ServiceDeskModuleWrapper';
import { PrinterModuleWrapper } from '@/components/printer-outsourcing/PrinterModuleWrapper';
import { ProposalListManager } from '@/components/pdf-generation/managers/ProposalListManager';


// Importe dados e tipos se ainda usados aqui
import type { Partner, Quote, RO, Training, BidDocs, NavItem, NavSubItem, Proposal, RFP, PriceRecord, Edital } from '@/lib/types';
import { initialPartners, initialQuotes, initialRos, initialTrainings, initialBidDocs, initialProposals, initialRFPs, initialPriceRecords, initialEditais, salesData, quoteStatusData } from '@/lib/data';

// Importe o hook useTheme
import { useTheme } from 'next-themes'; // <--- ADICIONADO ESTE IMPORT
import { useLogo } from '@/hooks/use-logo';
import { QuoteProvider } from '@/contexts/QuoteContext';


const ACTIVE_TAB_STORAGE_KEY = 'sistema-pre-active-tab';

export default function App() { // Ou Home
    // Chamada e uso de useAuth removidos
    // const { user, loading, logout } = useAuth();
    const router = useRouter();
    // Use useTheme() para gerenciar o tema (chamado incondicionalmente)
    const { theme, setTheme } = useTheme(); // <-- useTheme chamado incondicionalmente
    const [mounted, setMounted] = useState(false); // Estado para verificar se montou no cliente
    const { logoSrc } = useLogo(); // Hook para gerenciar logo personalizado

    const [activeTab, setActiveTab, activeTabRestored] = useModuleNavigation();
    const [editingProposalId, setEditingProposalId] = useState<string | null>(null); // Estado para edição de propostas
    // Você pode remover ou adaptar estes estados se os componentes de view gerenciarem seus próprios dados carregados do Firestore
    const [partners, setPartners] = useState<Partner[]>(initialPartners); // Exemplo: Manter se necessário para dados locais/testes
    const [quotes, setQuotes] = useState<Quote[]>(initialQuotes);
    const [proposals, setProposals] = useState<Proposal[]>(initialProposals);
    const [rfps, setRfps] = useState<RFP[]>(initialRFPs);
    const [priceRecords, setPriceRecords] = useState<PriceRecord[]>(initialPriceRecords);
    const [editais, setEditais] = useState<Edital[]>(initialEditais);
    const [ros, setRos] = useState<RO[]>(initialRos);
    const [trainings, setTrainings] = useState<Training[]>(initialTrainings);
    const [bidDocs, setBidDocs] = useState<BidDocs>(initialBidDocs);

    // Estado para controlar se as seções colapsáveis estão abertas (adapte)
    const [openSections, setOpenSections] = useState({
        suppliers: true,
        pricing: true,
        bids: true,
    });


    // Efeito para verificar montagem no cliente (útil para coisas como useTheme)
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!activeTabRestored) return;
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, activeTab);
        }
    }, [activeTab, activeTabRestored]);


    // Efeito para redirecionamento removido
    // useEffect(() => { ... }, [user, loading, router]);


    // Definição dos Itens de Navegação (adapte do seu código original)
    const navItems: NavItem[] = [
        { id: 'dashboard', label: 'Dashboard', icon: <BarChart size={20} /> },
        { id: 'projects', label: 'Projetos', icon: <Briefcase size={20} /> },
        { id: 'distributors', label: 'Distribuidores', icon: <ShoppingCart size={20} /> },
        {
            id: 'suppliers',
            label: 'Fornecedores',
            icon: <Building size={20} />,
            subItems: [
                { id: 'suppliers-register', label: 'Cadastro', icon: <Users size={16} /> },
                { id: 'ro-management', label: 'Gestão de RO’s', icon: <FileText size={16} /> },
                { id: 'ro-charts', label: 'Gráficos de ROs', icon: <BarChart2 size={16} /> },
                { id: 'training-management', label: 'Gestão de Treinamentos', icon: <Award size={16} /> },
            ]
        },
        { id: 'quotes', label: 'Orçamentos', icon: <Briefcase size={20} /> },
        { id: 'proposals', label: 'Propostas', icon: <FileText size={20} /> },
        { id: 'generated-proposals', label: 'Propostas Geradas', icon: <FileDown size={20} /> },
        {
            id: 'pricing',
            label: 'Precificação',
            icon: <Calculator size={20} />,
            subItems: [
                { id: 'calculator-ti-vls', label: 'Venda/Locação/Serviços', icon: <Briefcase size={16} />, openInNewTab: false } as NavSubItem & { openInNewTab?: boolean; url?: string },
                { id: 'calculator-noc', label: 'NOC/SOC/SIEM', icon: <Headset size={16} />, openInNewTab: false } as NavSubItem & { openInNewTab?: boolean; url?: string },
                { id: 'calculator-servicedesk-advanced', label: 'Service Desk Avançado', icon: <Server size={16} />, openInNewTab: false } as NavSubItem & { openInNewTab?: boolean; url?: string },
                { id: 'calculator-printer', label: 'Outsourcing de Impressão', icon: <Printer size={16} />, openInNewTab: false } as NavSubItem & { openInNewTab?: boolean; url?: string },
            ]
        },
        {
            id: 'bids',
            label: 'Licitações/Editais',
            icon: <Gavel size={20} />,
            subItems: [
                { id: 'portal-busca', label: 'Portal de Busca', icon: <Globe size={16} /> },
                { id: 'bids-analysis', label: 'Editais Analisados', icon: <Search size={16} /> },
                { id: 'ai-bid-analyzer', label: 'Analisar Edital com IA', icon: <Brain size={16} /> },
                { id: 'bids-docs', label: 'Documentações para Editais', icon: <FileText size={16} /> },
            ]
        },
        { id: 'price-records', label: 'Atas de Registro de Preços', icon: <Award size={20} /> },
        { id: 'rfp', label: 'RFP/RFI', icon: <FileText size={20} /> },
        { id: 'it-assessment', label: 'Assessment de TI', icon: <CheckSquare size={20} /> },
        { id: 'poc', label: 'Provas de Conceito POC', icon: <BarChart3 size={20} /> },
        { id: 'settings', label: 'Configurações', icon: <Settings size={20} /> },
    ];

    // Lógica para encontrar o item de navegação atual (adapte)
    const currentNavItem = useMemo(() => {
        for (const item of navItems) {
            if (item.id === activeTab) return { ...item, parentLabel: null };
            if (item.subItems) {
                const subItem = item.subItems.find(sub => sub.id === activeTab);
                if (subItem) return { ...subItem, parentLabel: item.label };
            }
        }
        return { ...navItems[0], parentLabel: null };
    }, [activeTab]);

    // Função para lidar com navegação
    const handleNavigation = (item: any) => {
        if (item.openInNewTab && item.url) {
            window.open(item.url, '_blank');
        } else {
            setActiveTab(item.id);
        }
    };

    // Função para Renderizar o Conteúdo da View Ativa (adapte do seu código original)
    const renderContent = () => {
        // NOTA: Os componentes de view (DashboardView, PartnerView, etc.) agora devem gerenciar seus próprios dados.
        // Remova a dependência de useAuth() dentro deles, se houver.

        switch (activeTab) {
            case 'dashboard': return <DashboardView partners={partners} ros={ros} proposals={proposals} editais={editais} onNavigate={setActiveTab} allowedModules={navItems.flatMap(item => item.subItems ? item.subItems.map(sub => sub.id) : [item.id])} />;
            case 'projects': return (
                <div className="p-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold mb-4">Gestão de Projetos</h2>
                        <p className="text-muted-foreground mb-6">
                            Gerencie e acompanhe todos os seus projetos de TI
                        </p>
                        <div className="flex items-center justify-center space-x-4">
                            <a
                                href="/projects"
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                            >
                                <Briefcase className="h-4 w-4 mr-2" />
                                Acessar Projetos
                            </a>
                            <a
                                href="/dashboard"
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                            >
                                <BarChart3 className="h-4 w-4 mr-2" />
                                Ver Dashboard
                            </a>
                        </div>
                    </div>
                </div>
            );
            case 'distributors': return <PartnerView partnerType="Distribuidor" />; // PartnerView pode precisar adaptação
            case 'suppliers-register': return <PartnerView partnerType="Fornecedor" />; // PartnerView pode precisar adaptação
            case 'ro-management': return <RoManagementView
                partners={partners}
                ros={ros}
                onSave={(ro) => {
                    setRos(prevRos => {
                        const existingIndex = prevRos.findIndex(r => r.id === ro.id);

                        if (existingIndex !== -1) {
                            // Editando RO existente
                            const updatedRos = [...prevRos];
                            updatedRos[existingIndex] = ro;
                            return updatedRos;
                        } else {
                            // Adicionando novo RO
                            const newRo = {
                                ...ro,
                                id: ro.id || Date.now()
                            };
                            return [...prevRos, newRo];
                        }
                    });
                }}
                onDelete={(id) => {
                    setRos(prevRos => prevRos.filter(r => r.id !== id));
                }}
            />;
            case 'ro-charts': return <RoChartsView ros={ros} partners={partners} />;
            case 'training-management': return <TrainingManagementView
                partners={partners}
                trainings={trainings}
                onSave={(training) => {
                    setTrainings(prevTrainings => {
                        const existingIndex = prevTrainings.findIndex(t => t.id === training.id);

                        if (existingIndex !== -1) {
                            // Editando training existente
                            const updatedTrainings = [...prevTrainings];
                            updatedTrainings[existingIndex] = training;
                            return updatedTrainings;
                        } else {
                            // Adicionando novo training
                            const newTraining = {
                                ...training,
                                id: training.id || Date.now()
                            };
                            return [...prevTrainings, newTraining];
                        }
                    });
                }}
                onDelete={(id) => {
                    setTrainings(prevTrainings => prevTrainings.filter(t => t.id !== id));
                }}
            />;
            case 'quotes': return <QuotesView partners={partners} />;
            case 'proposals': return <ProposalsView proposals={proposals} partners={partners} onSave={(proposal) => setProposals(prev => [...prev.filter(p => p.id !== proposal.id), proposal])} onDelete={(id) => setProposals(prev => prev.filter(p => p.id !== id))} />;
            case 'generated-proposals': return (
                <div className="p-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold mb-4">Gestão de Propostas</h2>
                        <p className="text-muted-foreground mb-6">
                            Gerencie todas as suas propostas: Comerciais, NOC/SOC/SIEM, Service Desk, Outsourcing de Impressão e Venda/Locação/Serviços
                        </p>
                        <div className="flex items-center justify-center space-x-4">
                            <a
                                href="/propostas"
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                            >
                                <FileDown className="h-4 w-4 mr-2" />
                                Acessar Propostas Geradas
                            </a>
                        </div>
                    </div>
                </div>
            );
            case 'calculator-ti-vls': return <ITPricingModule onNavigateToProposals={() => setActiveTab('quotes')} />;
            case 'calculator-noc': return <NOCModuleWrapper onNavigateToQuotes={() => setActiveTab('quotes')} />;
            case 'calculator-servicedesk-advanced': return <ServiceDeskModuleWrapper onNavigateToQuotes={() => setActiveTab('quotes')} />;
            case 'calculator-printer': return <PrinterModuleWrapper onNavigateToQuotes={() => setActiveTab('quotes')} />;


            case 'portal-busca': return <PortalBusca />;
            case 'bids-analysis': return <EditalAnalysisView
                editais={editais}
                onAdd={(edital) => setEditais(prev => [...prev, { ...edital, id: `EDT-${Date.now()}` }])}
                onUpdate={(id, edital) => setEditais(prev => prev.map(e => e.id === id ? { ...edital, id } : e))}
                onDelete={(id) => setEditais(prev => prev.filter(e => e.id !== id))}
                onAddAnalysis={(editalId, analysis) => setEditais(prev => prev.map(e => e.id === editalId ? { ...e, analysis: { ...analysis, id: `ANL-${Date.now()}`, editalId } } : e))}
            />;
            case 'ai-bid-analyzer': return <AIBidAnalyzer
                onSaveEdital={(edital) => {
                    console.log('Recebendo edital para salvar:', edital);
                    const newEdital = { ...edital, id: `EDT-${Date.now()}` };
                    console.log('Edital com ID:', newEdital);
                    setEditais(prev => {
                        console.log('Editais anteriores:', prev.length);
                        const updated = [...prev, newEdital];
                        console.log('Editais após adicionar:', updated.length);
                        return updated;
                    });
                }}
                onNavigateToAnalyzed={() => setActiveTab('bids-analysis')}
            />;
            case 'bids-docs': return <BidsDocumentationView docs={initialBidDocs} onDocsChange={setBidDocs} />; // Adapte se os docs vierem de outro lugar
            case 'rfp': return <RFPView rfps={rfps} onAdd={(rfp) => setRfps(prev => [...prev, { ...rfp, id: `RFP-${Date.now()}` }])} onUpdate={(id, rfp) => setRfps(prev => prev.map(r => r.id === id ? { ...rfp, id } : r))} onDelete={(id) => setRfps(prev => prev.filter(r => r.id !== id))} />;
            case 'it-assessment': return <ITAssessmentView />;
            case 'poc': return <POCManagementView />;
            case 'price-records': return <PriceRecordView priceRecords={priceRecords} onAdd={(priceRecord) => setPriceRecords(prev => [...prev, { ...priceRecord, id: `ATA-${Date.now()}` }])} onUpdate={(id, priceRecord) => setPriceRecords(prev => prev.map(r => r.id === id ? { ...priceRecord, id } : r))} onDelete={(id) => setPriceRecords(prev => prev.filter(r => r.id !== id))} />;
            case 'settings': return <SettingsView />;
            default: return <DashboardView partners={partners} ros={ros} proposals={proposals} editais={editais} onNavigate={setActiveTab} allowedModules={navItems.flatMap(item => item.subItems ? item.subItems.map(sub => sub.id) : [item.id])} />;
        }
    };


    // **Renderização da UI completa da página principal (sem verificações de autenticação)**
    return (
        <QuoteProvider initialData={quotes}>
            <ApplicationShell items={navItems} activeTab={activeTab} onNavigate={setActiveTab} logoSrc={logoSrc} proposals={proposals} ros={ros} editais={editais}>
                {renderContent()}
            </ApplicationShell>
        </QuoteProvider>
    );
}
