// src/app/page.tsx
'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react'; // Mantenha todos os hooks necessários
// Importação de useAuth removida
// import { useAuth } from "@/hooks/use-auth";
import { useRouter } from 'next/navigation';
import {
    Loader2, LogOut, User, Briefcase, BarChart, Search, Menu,
    Users, DollarSign, Archive, Calculator, PlusCircle,
    Trash2, Edit, Building, ShoppingCart, ExternalLink, FileDown, Paperclip,
    X, Server, Headset, Printer, ChevronDown, Tag, Info, Settings, FileText,
    BarChart2, TrendingUp, Percent, ShoppingBag, Repeat, Wrench, Zap,
    CheckCircle, Award, Gavel, Moon, Sun, Brain, CheckSquare, BarChart3,
    Home, ArrowRight, Layers, ClipboardCheck, ShieldCheck, Network, Target,
    Shield, Lock, RefreshCw, Globe, Cpu, AlertTriangle, HardDrive
} from 'lucide-react'; // Importe todos os ícones usados diretamente aqui

// Importe seus componentes de UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Header } from '@/components/ui/header';

// Importe seus componentes de View
import DashboardOverviewV3 from '@/components/dashboard/DashboardOverviewV3';
import { ApplicationShell } from '@/components/layout/application-shell';
import { useModuleNavigation } from '@/hooks/use-module-navigation';
import PartnerView from '@/components/partners/PartnerView';
import QuotesViewV2 from '@/components/quotes/QuotesViewV2';
import ProposalsViewV2 from '@/components/proposals/ProposalsViewV2';
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
import ProjectManagementApp from '@/components/project-management/App';

import { ITPricingModule } from '@/components/it-pricing/ITPricingModule';
import { SettingsView } from '@/components/settings/SettingsView';
import { RoChartsView } from '@/components/dashboard/RoChartsView';
import { NOCModuleWrapper } from '@/components/noc-pricing/NOCModuleWrapper';
import { ServiceDeskModuleWrapper } from '@/components/service-desk-pricing/ServiceDeskModuleWrapper';
import { PrinterModuleWrapper } from '@/components/printer-outsourcing/PrinterModuleWrapper';
import { ProposalListManager } from '@/components/pdf-generation/managers/ProposalListManager';
import { ServiceDeskModule } from '@/components/service-desk/ServiceDeskModule';


// Importe dados e tipos se ainda usados aqui
import type { Partner, Quote, RO, Training, BidDocs, NavItem, NavSubItem, Proposal, RFP, PriceRecord, Edital } from '@/lib/types';
import { initialPartners, initialQuotes, initialRos, initialTrainings, initialBidDocs, initialProposals, initialRFPs, initialPriceRecords, initialEditais, salesData, quoteStatusData } from '@/lib/data';

// Importe o hook useTheme
import { useTheme } from 'next-themes'; // <--- ADICIONADO ESTE IMPORT
import { useLogo } from '@/hooks/use-logo';
import { QuoteProvider } from '@/contexts/QuoteContext';
import { SystemUser, UserAuthService } from '@/lib/services/user-auth-service';
import { MODULE_DEFINITIONS } from '@/lib/modules';


const ACTIVE_TAB_STORAGE_KEY = 'sistema-pre-active-tab';

type HomeLandingPageProps = {
    setActiveTab: (tab: string) => void;
    currentUser?: SystemUser | null;
};

type LoginScreenProps = {
    logoSrc?: string | null;
    onLogin: (email: string, password: string) => boolean;
    onBack?: () => void;
};

function LoginScreen({ logoSrc, onLogin, onBack }: LoginScreenProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setError('');
        
        // Simular delay de autenticação
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const authenticated = onLogin(email, password);
        setIsLoading(false);

        if (!authenticated) {
            setError('E-mail ou senha inválidos, ou usuário inativo.');
            return;
        }

        setError('');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-grid-pattern opacity-30" />
            
            <div className="relative z-10 w-full max-w-md">
                {/* Logo & Brand */}
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
                        {logoSrc ? (
                            <img src={logoSrc} alt="Chorst Consultoria" className="h-12 w-12 rounded-xl object-contain" />
                        ) : (
                            <Briefcase className="h-8 w-8 text-primary" />
                        )}
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">Sistema Pré-Venda TI</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Chorst Consultoria
                    </p>
                </div>

                {/* Login Card */}
                <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl shadow-xl">
                    <div className="p-6 pb-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-foreground">Acesso ao Sistema</h2>
                                <p className="text-xs text-muted-foreground">
                                    Entre com suas credenciais autorizadas
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="px-6 pb-6">
                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground" htmlFor="login-email">
                                    E-mail
                                </label>
                                <Input
                                    id="login-email"
                                    type="email"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    placeholder="usuario@empresa.com"
                                    className="h-11"
                                    autoComplete="email"
                                    required
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground" htmlFor="login-password">
                                    Senha
                                </label>
                                <Input
                                    id="login-password"
                                    type="password"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    placeholder="Digite sua senha"
                                    className="h-11"
                                    autoComplete="current-password"
                                    required
                                />
                            </div>

                            {error && (
                                <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                                    {error}
                                </div>
                            )}
                            
                            <Button 
                                type="submit" 
                                className="h-12 w-full text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Entrando...
                                    </>
                                ) : (
                                    <>
                                        Entrar no Sistema
                                        <ArrowRight className="h-4 w-4" />
                                    </>
                                )}
                            </Button>
                            
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setEmail('chorstconsult@gmail.com');
                                    setPassword('Double@2026');
                                }}
                                className="w-full text-xs border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary py-2.5"
                            >
                                ⚡ Preencher Acesso Rápido (Admin Demo)
                            </Button>
                            
                            {onBack && (
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    onClick={onBack} 
                                    className="w-full text-muted-foreground"
                                >
                                    Voltar para início
                                </Button>
                            )}
                        </form>
                    </div>
                </div>

                {/* Footer */}
                <p className="mt-6 text-center text-xs text-muted-foreground">
                    Plataforma para pré-vendas, arquitetura de soluções e propostas técnicas
                </p>
            </div>
        </div>
    );
}

type PublicHomePageProps = {
    logoSrc?: string | null;
    onLoginClick: () => void;
};

function PublicHomePage({ logoSrc, onLoginClick }: PublicHomePageProps) {
    const moduleHighlights = [
        {
            title: 'Orçamentos e Propostas',
            description: 'Cadastro de oportunidades, orçamento por categoria, itens orçados, propostas comerciais e PDFs executivos.',
            image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
            icon: <FileText className="h-5 w-5" />,
            meta: 'Comercial',
            bullets: ['Produtos e serviços', 'Modalidades', 'Propostas']
        },
        {
            title: 'Precificação VLS',
            description: 'Venda, Locação e Serviços com custos, impostos, margem, recorrência e cenários para tomada de decisão.',
            image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80',
            icon: <Calculator className="h-5 w-5" />,
            meta: 'Financeiro',
            bullets: ['Custos', 'Margens', 'Cenários']
        },
        {
            title: 'Service Desk',
            description: 'Dimensionamento de equipe, escalas, SLA, volume de chamados, custos operacionais e relatório de proposta.',
            image: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1200&q=80',
            icon: <Headset className="h-5 w-5" />,
            meta: 'Operação',
            bullets: ['SLA', 'Equipe', 'Forecast']
        },
        {
            title: 'NOC, SOC e SIEM',
            description: 'Monitoramento, segurança, cobertura, dispositivos, ferramentas e serviços gerenciados 24x7.',
            image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
            icon: <Network className="h-5 w-5" />,
            meta: 'Segurança',
            bullets: ['NOC', 'SOC', 'SIEM']
        },
        {
            title: 'Outsourcing de Impressão',
            description: 'Parque de equipamentos, franquias, excedentes, contrato, custos logísticos e memória de cálculo.',
            image: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=1200&q=80',
            icon: <Printer className="h-5 w-5" />,
            meta: 'Managed Print',
            bullets: ['Franquia', 'Frota', 'Contrato']
        },
        {
            title: 'Licitações, Editais e IA',
            description: 'Análise de requisitos, documentação, elegibilidade, riscos e apoio inteligente para respostas B2G.',
            image: 'https://images.unsplash.com/photo-1521791055366-0d553872125f?auto=format&fit=crop&w=1200&q=80',
            icon: <Gavel className="h-5 w-5" />,
            meta: 'B2G',
            bullets: ['Editais', 'IA', 'Compliance']
        },
        {
            title: 'Gestão de Projetos',
            description: 'Handoff da proposta aprovada para fases, riscos, orçamento, equipe, entregáveis e visão executiva.',
            image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
            icon: <Briefcase className="h-5 w-5" />,
            meta: 'Entrega',
            bullets: ['Fases', 'Riscos', 'PDF']
        },
        {
            title: 'Assessment, POC e RFP',
            description: 'Discovery técnico, provas de conceito, RFP/RFI, atas e organização para arquitetos de soluções.',
            image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
            icon: <Target className="h-5 w-5" />,
            meta: 'Arquitetura',
            bullets: ['Discovery', 'POC', 'RFP']
        }
    ];

    const workflow = [
        { title: 'Qualificar', text: 'Centralize cliente, oportunidade, edital e premissas técnicas em uma visão única.', icon: <Search className="h-5 w-5" /> },
        { title: 'Arquitetar', text: 'Transforme necessidades em escopo, componentes, serviços, riscos e entregáveis.', icon: <Layers className="h-5 w-5" /> },
        { title: 'Precificar', text: 'Calcule investimento, recorrência, margem, impostos e composição de custos.', icon: <DollarSign className="h-5 w-5" /> },
        { title: 'Defender', text: 'Gere proposta, PDF, evidências e handoff para implantação com clareza.', icon: <ClipboardCheck className="h-5 w-5" /> }
    ];

    const stats = [
        { value: '360°', label: 'pré-vendas conectada' },
        { value: '100%', label: 'cálculo padronizado' },
        { value: '0', label: 'fórmulas soltas de Excel' },
        { value: 'IA', label: 'apoio em editais' }
    ];

    const outcomes = [
        'Padronização da engenharia de propostas',
        'Memória de cálculo protegida e rastreável',
        'Redução de erros manuais comuns em planilhas',
        'Visão executiva para decisão comercial segura'
    ];

    const calculationControls = [
        { title: 'Sem fórmulas quebradas', text: 'As regras ficam dentro do sistema, evitando células alteradas, fórmulas apagadas ou referências incorretas.' },
        { title: 'Cálculo padronizado', text: 'Todos trabalham com a mesma lógica para custos, impostos, margem, recorrência e composição final.' },
        { title: 'Memória rastreável', text: 'A proposta nasce com premissas e resultados organizados, facilitando revisão e aprovação.' }
    ];

    const pricingModules = moduleHighlights.slice(1, 5);

    const portfolioPillars = [
        { title: 'Comercial', text: 'Orçamentos, propostas, oportunidades e documentação para decisão.', icon: <Briefcase className="h-5 w-5" /> },
        { title: 'Precificação', text: 'VLS, Service Desk, NOC/SOC/SIEM e Outsourcing com memória de cálculo.', icon: <Calculator className="h-5 w-5" /> },
        { title: 'Técnico', text: 'Assessment, POC, RFP, projetos e arquitetura de soluções.', icon: <Network className="h-5 w-5" /> }
    ];

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Header */}
            <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 md:px-6 h-16">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                            {logoSrc ? (
                                <img src={logoSrc} alt="Chorst Consultoria" className="h-8 w-8 rounded-lg object-contain" />
                            ) : (
                                <Briefcase className="h-5 w-5 text-primary" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <h1 className="truncate text-lg font-bold text-foreground">Sistema Pré-Venda TI</h1>
                            <p className="hidden text-xs text-muted-foreground sm:block">Pré-vendas, arquitetura de soluções e propostas técnicas</p>
                        </div>
                    </div>
                    <div className="hidden items-center gap-6 text-sm font-medium text-muted-foreground lg:flex">
                        <a href="#jornada" className="hover:text-foreground transition-colors">Jornada</a>
                        <a href="#seguranca" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                            <Shield className="h-3.5 w-3.5 text-emerald-500" />
                            Segurança
                        </a>
                        <a href="#modulos" className="hover:text-foreground transition-colors">Módulos</a>
                        <a href="#valor" className="hover:text-foreground transition-colors">Valor</a>
                    </div>
                    <Button onClick={onLoginClick}>
                        Login
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>
            </header>

            <main>
                {/* Hero Section */}
                <section className="relative min-h-[600px] overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
                    <div className="absolute inset-0 bg-grid-pattern opacity-20" />
                    <div className="relative z-10 mx-auto grid min-h-[600px] max-w-7xl items-center gap-8 px-4 md:px-6 py-12 lg:grid-cols-[1.05fr_0.95fr]">
                        <div>
                            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary">
                                <ShieldCheck className="h-4 w-4" />
                                Plataforma para pré-vendas, arquitetura de soluções e estratégia comercial
                            </div>
                            <h2 className="max-w-4xl text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl">
                                Precifique sem depender de planilhas frágeis de Excel.
                            </h2>
                            <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
                                O Sistema Pré-Venda TI substitui cálculos manuais dispersos por motores padronizados, seguros e rastreáveis, reduzindo riscos de fórmulas quebradas, versões divergentes e erros humanos na formação de preço.
                            </p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                <Button size="lg" onClick={onLoginClick}>
                                    Acessar Sistema
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                                <Button size="lg" variant="outline" asChild>
                                    <a href="#modulos">Ver módulos</a>
                                </Button>
                            </div>
                            <div className="mt-10 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
                                {stats.map((stat) => (
                                    <div key={stat.label} className="rounded-xl border border-border/60 bg-card/50 p-4 backdrop-blur">
                                        <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                                        <div className="mt-1 text-xs text-muted-foreground">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-3">
                                <Shield className="h-5 w-5 text-emerald-500" />
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1.5">
                                        <Lock className="h-3.5 w-3.5 text-emerald-500" />
                                        Firewall de última geração
                                    </span>
                                    <span className="hidden text-border sm:inline">|</span>
                                    <span className="flex items-center gap-1.5">
                                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                                        Proteção Anti-DDoS
                                    </span>
                                    <span className="hidden text-border sm:inline">|</span>
                                    <span className="flex items-center gap-1.5">
                                        <HardDrive className="h-3.5 w-3.5 text-emerald-500" />
                                        Backup automático
                                    </span>
                                </div>
                                <a href="#seguranca" className="ml-auto hidden shrink-0 text-xs font-medium text-emerald-500 underline-offset-2 hover:underline sm:block">
                                    Ver detalhes
                                </a>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-xl backdrop-blur-xl">
                            <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-4">
                                <div>
                                    <p className="text-sm font-semibold text-primary">Governança de cálculo</p>
                                    <h3 className="mt-1 text-2xl font-bold text-foreground">Menos Excel, mais precisão operacional</h3>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                                    <Calculator className="h-6 w-6" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                {calculationControls.map((item, index) => (
                                    <div key={item.title} className="flex gap-3 rounded-xl border border-border/60 bg-muted/30 p-4">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                            <CheckCircle className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-accent">0{index + 1}</span>
                                                <h4 className="font-semibold text-foreground">{item.title}</h4>
                                            </div>
                                            <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Workflow Section */}
                <section id="jornada" className="border-y border-border/60 bg-muted/20">
                    <div className="mx-auto grid max-w-7xl gap-4 px-4 md:px-6 py-8 md:grid-cols-4">
                        {workflow.map((item) => (
                            <div key={item.title} className="rounded-xl border border-border/60 bg-card/80 p-5 shadow-sm">
                                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    {item.icon}
                                </div>
                                <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Cybersecurity Section */}
                <section id="seguranca" className="relative overflow-hidden bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-emerald-950/40 via-background to-background border-y border-emerald-500/15">
                    <div className="absolute inset-0 bg-grid-pattern opacity-10" />
                    <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-6 py-14">

                        {/* Header */}
                        <div className="mb-10 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/8 px-4 py-2 text-sm font-semibold text-emerald-500">
                                    <Shield className="h-4 w-4" />
                                    Infraestrutura protegida
                                </div>
                                <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
                                    Seus dados protegidos.<br className="hidden sm:inline" /> Nossa responsabilidade.
                                </h2>
                                <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
                                    O Sistema Pré-Venda TI opera sobre infraestrutura com múltiplas camadas de segurança ativa — proteção contra ataques, firewall gerenciado e backup automático das suas informações.
                                </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5">
                                <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                                <span className="text-sm font-medium text-emerald-500">Proteção ativa 24/7</span>
                            </div>
                        </div>

                        {/* 3 main pillars */}
                        <div className="grid gap-5 md:grid-cols-3">

                            {/* Firewall */}
                            <div className="group relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-card/80 p-6 shadow-sm transition-all duration-300 hover:border-emerald-500/40 hover:shadow-emerald-500/10 hover:shadow-lg">
                                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-500/5 transition-all group-hover:bg-emerald-500/10" />
                                <div className="relative z-10">
                                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10">
                                        <Lock className="h-6 w-6 text-emerald-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground">Firewall de Última Geração</h3>
                                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                                        Tráfego inspecionado em tempo real com regras granulares de controle de acesso. Bloqueio automático de tentativas de intrusão, varredura de portas e acessos não autorizados.
                                    </p>
                                    <div className="mt-5 space-y-2">
                                        {[
                                            { icon: <Globe className="h-3.5 w-3.5" />, label: 'Inspeção deep packet (DPI)' },
                                            { icon: <Cpu className="h-3.5 w-3.5" />, label: 'Bloqueio de intrusões (IPS/IDS)' },
                                            { icon: <Lock className="h-3.5 w-3.5" />, label: 'Controle de acesso por perfil' },
                                        ].map((item) => (
                                            <div key={item.label} className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span className="text-emerald-500">{item.icon}</span>
                                                {item.label}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Anti-DDoS */}
                            <div className="group relative overflow-hidden rounded-2xl border border-blue-500/20 bg-card/80 p-6 shadow-sm transition-all duration-300 hover:border-blue-500/40 hover:shadow-blue-500/10 hover:shadow-lg">
                                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-blue-500/5 transition-all group-hover:bg-blue-500/10" />
                                <div className="relative z-10">
                                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10">
                                        <ShieldCheck className="h-6 w-6 text-blue-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground">Proteção Anti-DDoS</h3>
                                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                                        Mitigação automática de ataques volumétricos e de camada de aplicação. O sistema absorve e filtra tráfego malicioso antes que ele atinja a plataforma, garantindo disponibilidade contínua.
                                    </p>
                                    <div className="mt-5 space-y-2">
                                        {[
                                            { icon: <Network className="h-3.5 w-3.5" />, label: 'Mitigação volumétrica (L3/L4)' },
                                            { icon: <AlertTriangle className="h-3.5 w-3.5" />, label: 'Proteção de camada de aplicação (L7)' },
                                            { icon: <RefreshCw className="h-3.5 w-3.5" />, label: 'Ativação automática em segundos' },
                                        ].map((item) => (
                                            <div key={item.label} className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span className="text-blue-400">{item.icon}</span>
                                                {item.label}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Backup */}
                            <div className="group relative overflow-hidden rounded-2xl border border-amber-500/20 bg-card/80 p-6 shadow-sm transition-all duration-300 hover:border-amber-500/40 hover:shadow-amber-500/10 hover:shadow-lg">
                                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-500/5 transition-all group-hover:bg-amber-500/10" />
                                <div className="relative z-10">
                                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10">
                                        <HardDrive className="h-6 w-6 text-amber-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground">Backup Automático</h3>
                                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                                        Seus dados são copiados automaticamente em intervalos regulares, com armazenamento redundante em múltiplas regiões. Recuperação rápida em caso de qualquer incidente.
                                    </p>
                                    <div className="mt-5 space-y-2">
                                        {[
                                            { icon: <RefreshCw className="h-3.5 w-3.5" />, label: 'Backup diário automatizado' },
                                            { icon: <HardDrive className="h-3.5 w-3.5" />, label: 'Redundância em múltiplas regiões' },
                                            { icon: <CheckCircle className="h-3.5 w-3.5" />, label: 'Restauração pontual (PITR)' },
                                        ].map((item) => (
                                            <div key={item.label} className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span className="text-amber-400">{item.icon}</span>
                                                {item.label}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom trust bar */}
                        <div className="mt-8 grid gap-4 rounded-2xl border border-border/60 bg-card/60 p-5 sm:grid-cols-4">
                            {[
                                { icon: <ShieldCheck className="h-5 w-5 text-emerald-500" />, title: 'HTTPS / TLS 1.3', text: 'Toda comunicação criptografada em trânsito' },
                                { icon: <Lock className="h-5 w-5 text-emerald-500" />, title: 'Dados em repouso', text: 'Banco de dados criptografado (AES-256)' },
                                { icon: <Users className="h-5 w-5 text-emerald-500" />, title: 'Acesso por credencial', text: 'Login com gestão de usuários e perfis' },
                                { icon: <RefreshCw className="h-5 w-5 text-emerald-500" />, title: 'Monitoramento contínuo', text: 'Alertas e logs de atividade 24/7' },
                            ].map((item) => (
                                <div key={item.title} className="flex items-start gap-3">
                                    <div className="mt-0.5 shrink-0">{item.icon}</div>
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">{item.title}</p>
                                        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{item.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Modules Section */}
                <section id="modulos" className="bg-background">
                    <div className="mx-auto max-w-7xl px-4 md:px-6 py-14">
                        <div className="mb-8 grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-end">
                            <div>
                                <p className="text-sm font-semibold uppercase text-primary">Portfólio operacional</p>
                                <h2 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">Módulos do Sistema</h2>
                                <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
                                    Uma esteira integrada para pré-vendas de TI, com forte apoio aos motores de precificação: Venda, Locação, Serviços, Service Desk, NOC/SOC/SIEM e Outsourcing de Impressão.
                                </p>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-3">
                                {portfolioPillars.map((pillar) => (
                                    <div key={pillar.title} className="rounded-xl border border-border/60 bg-card/80 p-4 shadow-sm">
                                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                            {pillar.icon}
                                        </div>
                                        <h3 className="font-semibold text-foreground">{pillar.title}</h3>
                                        <p className="mt-2 text-xs leading-5 text-muted-foreground">{pillar.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Pricing Modules */}
                        <div className="mb-6 rounded-2xl border border-accent/20 bg-card/80 p-5 shadow-sm">
                            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <p className="text-sm font-semibold uppercase text-accent">Centro de precificação</p>
                                    <h3 className="mt-2 text-2xl font-bold text-foreground">Motores para formar preço sem risco de planilha manual.</h3>
                                    <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                                        Os módulos de precificação concentram regras comerciais, custos operacionais, impostos, recorrência, capacidade técnica e memória de cálculo, evitando versões paralelas de Excel e falhas comuns de fórmulas manuais.
                                    </p>
                                </div>
                                <Button onClick={onLoginClick} className="shrink-0">
                                    Abrir precificação
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="grid gap-4 lg:grid-cols-4">
                                {pricingModules.map((module) => (
                                    <div key={module.title} className="overflow-hidden rounded-xl border border-border/60 bg-background/70 shadow-sm">
                                        <div className="relative h-40">
                                            <img src={module.image} alt={module.title} className="absolute inset-0 h-full w-full object-cover" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/25 to-transparent" />
                                            <div className="absolute bottom-3 left-3 flex items-center gap-2">
                                                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                                                    {module.icon}
                                                </span>
                                                <span className="rounded-full bg-background/70 px-3 py-1 text-xs font-semibold uppercase text-primary backdrop-blur">
                                                    {module.meta}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <h4 className="text-lg font-bold text-foreground">{module.title}</h4>
                                            <p className="mt-2 min-h-[72px] text-sm leading-6 text-muted-foreground">{module.description}</p>
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                {module.bullets.map((bullet) => (
                                                    <span key={bullet} className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs text-accent">
                                                        {bullet}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Main Module + Side Cards */}
                        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                            <div className="relative min-h-[430px] overflow-hidden rounded-2xl border border-primary/20 bg-cover bg-center shadow-xl"
                                style={{ backgroundImage: `url('${moduleHighlights[0].image}')` }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/20" />
                                <div className="relative z-10 flex min-h-[430px] max-w-2xl flex-col justify-end p-6 sm:p-8">
                                    <div className="mb-4 flex w-fit items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent">
                                        <FileText className="h-4 w-4" />
                                        Módulo central da operação
                                    </div>
                                    <h3 className="text-3xl font-bold text-foreground">Orçamentos e Propostas</h3>
                                    <p className="mt-4 text-base leading-7 text-muted-foreground">
                                        O ponto de convergência entre oportunidade, escopo, composição de produtos, modalidades comerciais e documentação final para o cliente.
                                    </p>
                                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                                        {moduleHighlights[0].bullets.map((bullet) => (
                                            <div key={bullet} className="rounded-lg border border-border/60 bg-card/50 px-3 py-3 text-sm font-medium text-foreground backdrop-blur">
                                                {bullet}
                                            </div>
                                        ))}
                                    </div>
                                    <Button className="mt-6 w-fit" onClick={onLoginClick}>
                                        Acessar portfólio
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                                {moduleHighlights.slice(5, 8).map((module) => (
                                    <Card key={module.title} className="overflow-hidden border-border/60 bg-card/80 shadow-sm">
                                        <div className="grid min-h-[132px] grid-cols-[112px_1fr]">
                                            <div className="relative">
                                                <img src={module.image} alt={module.title} className="absolute inset-0 h-full w-full object-cover" />
                                                <div className="absolute inset-0 bg-background/25" />
                                            </div>
                                            <CardContent className="p-4">
                                                <div className="mb-2 flex items-center gap-2">
                                                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent">{module.icon}</span>
                                                    <span className="text-xs font-semibold uppercase text-primary">{module.meta}</span>
                                                </div>
                                                <CardTitle className="text-base">{module.title}</CardTitle>
                                                <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{module.description}</p>
                                            </CardContent>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        {/* CTA */}
                        <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-foreground">Acesse o portfólio completo com seu usuário autorizado.</h3>
                                <p className="mt-2 text-sm text-muted-foreground">Os módulos são protegidos por login e gestão de usuários no menu Configurações.</p>
                            </div>
                            <Button onClick={onLoginClick} className="shrink-0">
                                Login
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Value Section */}
                <section id="valor" className="bg-muted/20">
                    <div className="mx-auto grid max-w-7xl gap-8 px-4 md:px-6 py-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
                        <div>
                            <p className="text-sm font-semibold uppercase text-accent">Resultado esperado</p>
                            <h2 className="mt-2 text-3xl font-bold text-foreground">Cálculos seguros, sem a fragilidade das planilhas soltas.</h2>
                            <p className="mt-4 leading-7 text-muted-foreground">
                                A plataforma cria uma ponte entre comercial, arquitetura, operação e entrega, com cálculos padronizados para reduzir erros de digitação, fórmulas alteradas, arquivos duplicados e decisões baseadas em versões incorretas.
                            </p>
                            <Button onClick={onLoginClick} className="mt-6">
                                Entrar no sistema
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {outcomes.map((outcome) => (
                                <div key={outcome} className="rounded-xl border border-border/60 bg-card/80 p-5 shadow-sm">
                                    <CheckCircle className="mb-4 h-6 w-6 text-accent-green" />
                                    <p className="font-semibold text-foreground">{outcome}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

function HomeLandingPage({ setActiveTab, currentUser }: HomeLandingPageProps) {
    const pricingEngines = [
        {
            title: 'NOC / SOC / SIEM 24×7',
            category: 'Operação & Cibersegurança',
            description: 'Monitoramento contínuo de ativos e eventos. Volumetria, ferramentas gerenciadas (Zabbix, Grafana, Wazuh), escala de analistas e DRE em tempo real.',
            tab: 'calculator-noc',
            icon: <Network className="h-6 w-6 text-cyan-400" />,
            badge: '24×7 Crítico',
            accentColor: 'from-cyan-500/20 via-blue-500/10 to-transparent',
            borderColor: 'hover:border-cyan-500/50',
            tagColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
            highlights: ['Zabbix & Grafana', 'Escala N1 / N2 / N3', 'Custos & Margens', 'DRE Integrada']
        },
        {
            title: 'Service Desk Avançado',
            category: 'Suporte & Atendimento',
            description: 'Dimensionamento operacional por volume de chamados. Simulação de escalas (12x36, 6h, 8h), SLAs 24x7 ou 8x5, custos diretos e margens de lucro.',
            tab: 'calculator-servicedesk-advanced',
            icon: <Headset className="h-6 w-6 text-purple-400" />,
            badge: 'SLA Dinâmico',
            accentColor: 'from-purple-500/20 via-indigo-500/10 to-transparent',
            borderColor: 'hover:border-purple-500/50',
            tagColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
            highlights: ['Escalas 12x36 & 6h', 'Dimensionamento de PAs', 'Forecast de Chamados', 'Margem Desejada']
        },
        {
            title: 'Precificação VLS TI',
            category: 'Venda, Locação & Serviços',
            description: 'Formação científica de preço para hardware, software e serviços. Impostos (PIS/COFINS/ISS/ICMS), markups, taxas de risco e cenários CAPEX vs OPEX.',
            tab: 'calculator-ti-vls',
            icon: <Calculator className="h-6 w-6 text-emerald-400" />,
            badge: 'CAPEX & OPEX',
            accentColor: 'from-emerald-500/20 via-teal-500/10 to-transparent',
            borderColor: 'hover:border-emerald-500/50',
            tagColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            highlights: ['Decomposição Tributária', 'Markups Customizáveis', 'Contratos Recorrentes', 'Memória de Cálculo']
        },
        {
            title: 'Outsourcing de Impressão',
            category: 'Gestão de Frotas & Páginas',
            description: 'Modelagem completa para parque de impressão. Franquias mono e color, custo por página (CPP), excedentes, suprimentos e TCO de longo prazo.',
            tab: 'calculator-printer',
            icon: <Printer className="h-6 w-6 text-amber-400" />,
            badge: 'Frota & Franquia',
            accentColor: 'from-amber-500/20 via-orange-500/10 to-transparent',
            borderColor: 'hover:border-amber-500/50',
            tagColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            highlights: ['Custo por Página (CPP)', 'Franquia Mono / Color', 'Custos de Equipamentos', 'Gestão de Suprimentos']
        }
    ];

    const platformModules = [
        {
            title: 'Orçamentos & Propostas',
            meta: 'Comercial & Propostas',
            description: 'Ciclo completo de orçamentação por fornecedor, margens consolidadas, itens em cotação e emissão de propostas executivas.',
            tab: 'quotes',
            icon: <FileText className="h-5 w-5 text-blue-400" />,
            actionLabel: 'Ver Orçamentos'
        },
        {
            title: 'Gestão de Projetos',
            meta: 'Handoff & Implantação',
            description: 'Visões integradas em Kanban, Gráficos de Gantt, carga de equipe (Workload) e arquitetura de entrega.',
            tab: 'projects',
            icon: <Briefcase className="h-5 w-5 text-indigo-400" />,
            actionLabel: 'Abrir Projetos'
        },
        {
            title: 'Portal de Busca B2G',
            meta: 'Licitações Governamentais',
            description: 'Rastreamento de editais de compras públicas, Curitiba e-compras, Comprasnet e gestão de licitações concorrentes.',
            tab: 'portal-busca',
            icon: <Globe className="h-5 w-5 text-cyan-400" />,
            actionLabel: 'Buscar Licitações'
        },
        {
            title: 'Análise de Editais com IA',
            meta: 'Inteligência Artificial',
            description: 'Leitura assistida de editais complexos via IA, identificação instantânea de requisitos, prazos e itens mandatórios.',
            tab: 'ai-bid-analyzer',
            icon: <Brain className="h-5 w-5 text-purple-400" />,
            actionLabel: 'Analisar com IA'
        },
        {
            title: 'Gestão de ROs com Fabricantes',
            meta: 'Parcerias & Descontos',
            description: 'Controle de registro de oportunidades junto a Dell, HP, Lenovo e distribuidores com monitoramento de validade.',
            tab: 'ro-management',
            icon: <Building className="h-5 w-5 text-amber-400" />,
            actionLabel: 'Gerenciar ROs'
        },
        {
            title: 'Assessment & Pré-Venda Técnica',
            meta: 'Arquitetura de Solução',
            description: 'Questionários técnicos de diagnóstico de infraestrutura, matriz de maturidade e levantamento de escopo.',
            tab: 'it-assessment',
            icon: <Target className="h-5 w-5 text-emerald-400" />,
            actionLabel: 'Abrir Assessment'
        }
    ];

    const workflowSteps = [
        { step: '01', title: 'Descoberta & Edital', text: 'Captura da oportunidade, leitura de edital por IA e identificação de exigências técnicas.', icon: <Search className="h-5 w-5" /> },
        { step: '02', title: 'Engenharia & POC', text: 'Dimensionamento da arquitetura, validação de viabilidade técnica, provas de conceito e RFPs.', icon: <Layers className="h-5 w-5" /> },
        { step: '03', title: 'Precificação Científica', text: 'Simulação precisa de custos, salários, escalas, impostos, fornecedores e margem desejada.', icon: <Calculator className="h-5 w-5" /> },
        { step: '04', title: 'Defesa & Handoff', text: 'Geração de proposta executiva auditável em PDF e passagem automatizada para o time de projetos.', icon: <ClipboardCheck className="h-5 w-5" /> }
    ];

    return (
        <div className="space-y-10 pb-12">
            {/* HERO COMMAND CENTER */}
            <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-8 sm:p-12 text-white shadow-2xl">
                {/* Ambient Aura Lights */}
                <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />
                <div className="absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
                <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />

                <div className="relative z-10 max-w-4xl space-y-6">
                    {/* Live Status Pill */}
                    <div className="inline-flex items-center gap-2.5 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-cyan-300 backdrop-blur-md">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                        </span>
                        PLATAFORMA DE PRÉ-VENDAS · CONECTADA AO BANCO DE DADOS
                    </div>

                    {/* Main Title & Description */}
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-white">
                            Engenharia Comercial & <br className="hidden sm:inline" />
                            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300 bg-clip-text text-transparent">
                                Precificação Estratégica
                            </span>
                        </h1>
                        <p className="mt-4 max-w-2xl text-base sm:text-lg text-slate-300 leading-relaxed">
                            {currentUser ? `Bem-vindo, ${currentUser.name}. ` : ''}
                            Elimine planilhas frágeis. Centralize formação de preço, dimensionamento de serviços especializados, análise de editais com IA e geração de propostas executivas.
                        </p>
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                        <Button 
                            size="lg" 
                            onClick={() => setActiveTab('quotes')} 
                            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02]"
                        >
                            <PlusCircle className="mr-2 h-5 w-5" />
                            Novo Orçamento
                        </Button>
                        <Button 
                            size="lg" 
                            variant="outline" 
                            onClick={() => setActiveTab('calculator-noc')} 
                            className="border-cyan-400/30 bg-slate-900/60 text-cyan-200 hover:bg-cyan-500/20 hover:text-white backdrop-blur-md"
                        >
                            <Network className="mr-2 h-4 w-4 text-cyan-400" />
                            Calculadora NOC
                        </Button>
                        <Button 
                            size="lg" 
                            variant="outline" 
                            onClick={() => setActiveTab('calculator-servicedesk-advanced')} 
                            className="border-purple-400/30 bg-slate-900/60 text-purple-200 hover:bg-purple-500/20 hover:text-white backdrop-blur-md"
                        >
                            <Headset className="mr-2 h-4 w-4 text-purple-400" />
                            Service Desk
                        </Button>
                        <Button 
                            size="lg" 
                            variant="outline" 
                            onClick={() => setActiveTab('dashboard')} 
                            className="border-white/20 bg-slate-900/40 text-slate-200 hover:bg-white/10 hover:text-white"
                        >
                            <BarChart3 className="mr-2 h-4 w-4" />
                            Dashboard
                        </Button>
                    </div>

                    {/* Real-Time KPIs in Hero */}
                    <div className="grid grid-cols-2 gap-3 pt-4 sm:grid-cols-4 max-w-3xl">
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                            <p className="text-2xl sm:text-3xl font-extrabold text-white">4</p>
                            <p className="text-xs text-slate-300 font-medium mt-1">Motores de Precificação</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                            <p className="text-2xl sm:text-3xl font-extrabold text-cyan-300">100%</p>
                            <p className="text-xs text-slate-300 font-medium mt-1">Memória Auditável</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-300">DRE</p>
                            <p className="text-xs text-slate-300 font-medium mt-1">Margem & Tributos</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                            <p className="text-2xl sm:text-3xl font-extrabold text-purple-300">IA</p>
                            <p className="text-xs text-slate-300 font-medium mt-1">Análise de Editais</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* SEÇÃO 1: OS 4 MOTORES ESPECIALIZADOS DE PRECIFICAÇÃO */}
            <div className="space-y-5">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                            <Calculator className="h-4 w-4" />
                            Cálculo Especializado
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                            Motores de Precificação Dedicados
                        </h2>
                    </div>
                    <p className="text-sm text-muted-foreground max-w-md">
                        Cada segmento técnico possui sua própria lógica matemática para formação de preço, encargos e riscos.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {pricingEngines.map((engine) => (
                        <div 
                            key={engine.title}
                            className={cn(
                                "group relative overflow-hidden rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
                                engine.borderColor
                            )}
                        >
                            {/* Subtle Ambient Gradient Corner */}
                            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-40 transition-opacity group-hover:opacity-100 pointer-events-none", engine.accentColor)} />
                            
                            <div className="relative z-10 flex flex-col justify-between h-full space-y-5">
                                <div>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/80 shadow-inner group-hover:scale-110 transition-transform">
                                                {engine.icon}
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{engine.category}</p>
                                                <h3 className="text-xl font-bold text-foreground">{engine.title}</h3>
                                            </div>
                                        </div>
                                        <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", engine.tagColor)}>
                                            {engine.badge}
                                        </span>
                                    </div>

                                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                                        {engine.description}
                                    </p>

                                    {/* Highlights Pill Tags */}
                                    <div className="mt-4 flex flex-wrap gap-1.5">
                                        {engine.highlights.map(h => (
                                            <span key={h} className="rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-xs font-medium text-foreground/80">
                                                ✓ {h}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <Button 
                                        onClick={() => setActiveTab(engine.tab)} 
                                        className="w-full sm:w-auto font-semibold gap-2 transition-all group-hover:bg-primary group-hover:text-primary-foreground"
                                        variant="outline"
                                    >
                                        Acessar Simulador
                                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* SEÇÃO 2: A JORNADA DE PRÉ-VENDAS 360° */}
            <div className="space-y-5">
                <div className="flex flex-col gap-1">
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                        <Layers className="h-4 w-4" />
                        Metodologia & Governança
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                        A Jornada Completa do Negócio
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Fluxo estruturado do primeiro contato com o cliente até a entrega do projeto aprovado.
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {workflowSteps.map((wf) => (
                        <div key={wf.step} className="group relative rounded-2xl border border-border/80 bg-card p-5 shadow-sm transition-all hover:border-primary/50 hover:shadow-md">
                            <div className="flex items-center justify-between mb-4">
                                <span className="font-mono text-xs font-black px-2 py-1 rounded bg-primary/10 text-primary">
                                    {wf.step}
                                </span>
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                    {wf.icon}
                                </div>
                            </div>
                            <h3 className="text-base font-bold text-foreground">{wf.title}</h3>
                            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{wf.text}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* SEÇÃO 3: MÓDULOS DE GESTÃO, LICITAÇÃO & APOIO */}
            <div className="space-y-5">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                            <Briefcase className="h-4 w-4" />
                            Plataforma Integrada
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                            Módulos Operacionais & de Apoio
                        </h2>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {platformModules.map((mod) => (
                        <div 
                            key={mod.title}
                            className="group flex flex-col justify-between rounded-xl border border-border/70 bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                        {mod.icon}
                                    </div>
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        {mod.meta}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-foreground">{mod.title}</h3>
                                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{mod.description}</p>
                            </div>

                            <div className="pt-4 mt-2 border-t border-border/40">
                                <Button 
                                    size="sm"
                                    variant="ghost" 
                                    onClick={() => setActiveTab(mod.tab)}
                                    className="w-full justify-between font-semibold text-primary hover:bg-primary/10"
                                >
                                    <span>{mod.actionLabel}</span>
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function App() { // Ou Home
    // Chamada e uso de useAuth removidos
    // const { user, loading, logout } = useAuth();
    const router = useRouter();
    // Use useTheme() para gerenciar o tema (chamado incondicionalmente)
    const { theme, setTheme } = useTheme(); // <-- useTheme chamado incondicionalmente
    const [mounted, setMounted] = useState(false);
    const { logoSrc } = useLogo();
    const [authChecked, setAuthChecked] = useState(false);
    const [currentUser, setCurrentUser] = useState<SystemUser | null>(null);
    const [showLogin, setShowLogin] = useState(false);

    const [activeTab, setActiveTab, activeTabRestored] = useModuleNavigation();
    const [editingProposalId, setEditingProposalId] = useState<string | null>(null);
    // Estado para edição de orçamentos IT Sales/Rental/Services na calculadora
    const [itQuoteToEdit, setItQuoteToEdit] = useState<{
        id: string; dominantModule: string; items: any[]
    } | null>(null);
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
        suppliers: false,
        pricing: false,
        bids: false,
    });


    // Efeito para verificar montagem no cliente (útil para coisas como useTheme)
    useEffect(() => {
        setMounted(true);
        UserAuthService.ensureDefaultUsers();
        setCurrentUser(UserAuthService.getCurrentUser());
        setAuthChecked(true);
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

    // Filtrar navItems com base nas permissões do usuário
    const filteredNavItems = useMemo(() => {
        if (!currentUser) return navItems;
        if (currentUser.role === 'admin') return navItems;

        const perms = currentUser.permissions || [];
        return navItems
            .map((item) => {
                if (item.subItems) {
                    const filteredSubs = item.subItems.filter((sub) => perms.includes(sub.id));
                    if (filteredSubs.length === 0) return null;
                    return { ...item, subItems: filteredSubs };
                }
                return perms.includes(item.id) ? item : null;
            })
            .filter(Boolean) as typeof navItems;
    }, [currentUser, navItems]);

    // Redirecionar se o módulo atual não é permitido
    useEffect(() => {
        if (!currentUser || currentUser.role === 'admin') return;
        const perms = currentUser.permissions || [];
        if (activeTab && !perms.includes(activeTab) && activeTab !== 'home') {
            const firstAllowed = filteredNavItems[0];
            if (firstAllowed) {
                setActiveTab(firstAllowed.subItems ? firstAllowed.subItems[0].id : firstAllowed.id);
            }
        }
    }, [currentUser, activeTab, filteredNavItems]);

    // Lógica para encontrar o item de navegação atual (adapte)
    const currentNavItem = useMemo(() => {
        for (const item of filteredNavItems) {
            if (item.id === activeTab) return { ...item, parentLabel: null };
            if (item.subItems) {
                const subItem = item.subItems.find(sub => sub.id === activeTab);
                if (subItem) return { ...subItem, parentLabel: item.label };
            }
        }
        return { ...filteredNavItems[0], parentLabel: null };
    }, [activeTab, filteredNavItems]);

    // Função para lidar com navegação
    const handleNavigation = (item: any) => {
        if (item.openInNewTab && item.url) {
            window.open(item.url, '_blank');
        } else {
            setActiveTab(item.id);
        }
    };

    const handleLogin = (email: string, password: string) => {
        const user = UserAuthService.login(email, password);
        if (!user) return false;

        setCurrentUser(user);
        setShowLogin(false);
        setActiveTab('dashboard');
        return true;
    };

    const handleLogout = () => {
        UserAuthService.logout();
        setCurrentUser(null);
        setShowLogin(false);
        setActiveTab('dashboard');
    };

    // Função para Renderizar o Conteúdo da View Ativa (adapte do seu código original)
    const renderContent = () => {
        // NOTA: Os componentes de view (DashboardView, PartnerView, etc.) agora devem gerenciar seus próprios dados.
        // Remova a dependência de useAuth() dentro deles, se houver.

        // Controle de acesso por módulo
        if (currentUser && currentUser.role !== 'admin' && activeTab !== 'home') {
            const perms = currentUser.permissions || [];
            if (!perms.includes(activeTab)) {
                return (
                    <div className="flex flex-col items-center justify-center h-96 text-center space-y-4">
                        <ShieldCheck className="h-16 w-16 text-muted-foreground/40" />
                        <h2 className="text-xl font-bold text-foreground">Acesso Restrito</h2>
                        <p className="text-muted-foreground max-w-md">
                            Você não tem permissão para acessar este módulo. Entre em contato com o administrador para solicitar acesso.
                        </p>
                        <Button onClick={() => setActiveTab('dashboard')}>
                            Voltar ao Dashboard
                        </Button>
                    </div>
                );
            }
        }

        switch (activeTab) {
            case 'home': return <HomeLandingPage setActiveTab={setActiveTab} />;
            case 'dashboard': return <DashboardOverviewV3 partners={partners} ros={ros} proposals={proposals} editais={editais} onNavigate={setActiveTab} allowedModules={filteredNavItems.flatMap(item => item.subItems ? item.subItems.map(sub => sub.id) : [item.id])} />;
            case 'projects': return <ProjectManagementApp onBack={() => setActiveTab('dashboard')} />;
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
            case 'quotes': return <QuotesViewV2 partners={partners} onEditITQuote={(data) => {
                setItQuoteToEdit(data);
                setActiveTab('calculator-ti-vls');
            }} />;
            case 'proposals': return <ProposalsViewV2 proposals={proposals} partners={partners} onSave={(proposal) => setProposals(prev => [...prev.filter(p => p.id !== proposal.id), proposal])} onDelete={(id) => setProposals(prev => prev.filter(p => p.id !== id))} />;
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
            case 'calculator-ti-vls': return <ITPricingModule
                onNavigateToProposals={() => setActiveTab('quotes')}
                quoteToEdit={itQuoteToEdit}
            />;
            case 'calculator-noc': return <NOCModuleWrapper onNavigateToQuotes={() => setActiveTab('quotes')} />;
            case 'calculator-servicedesk-advanced': return <ServiceDeskModuleWrapper onNavigateToQuotes={() => setActiveTab('quotes')} onNavigateToProposals={() => setActiveTab('quotes')} />;
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
            case 'settings': return <SettingsView currentUser={currentUser} />;
            default: return <HomeLandingPage setActiveTab={setActiveTab} currentUser={currentUser} />;
        }
    };


    if (!authChecked) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
                <div className="flex items-center gap-3 rounded-lg border bg-card px-5 py-4 shadow-lg">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="font-medium">Carregando acesso...</span>
                </div>
            </div>
        );
    }

    if (!currentUser) {
        if (showLogin) {
            return <LoginScreen logoSrc={logoSrc} onLogin={handleLogin} onBack={() => setShowLogin(false)} />;
        }

        return <PublicHomePage logoSrc={logoSrc} onLoginClick={() => setShowLogin(true)} />;
    }

    return (
        <QuoteProvider initialData={quotes}>
            <ApplicationShell items={filteredNavItems} activeTab={activeTab} onNavigate={setActiveTab} logoSrc={logoSrc} proposals={proposals} ros={ros} editais={editais} user={currentUser} onLogout={handleLogout}>
                {renderContent()}
            </ApplicationShell>
        </QuoteProvider>
    );
}
