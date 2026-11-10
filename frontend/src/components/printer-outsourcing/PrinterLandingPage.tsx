'use client';
import { Printer } from 'lucide-react';
import { ModuleLauncher } from '@/components/shared/ModuleLauncher';

interface Props { onNewProposal: () => void; onAdminPanel: () => void; onOpenQuotes?: () => void }
export function PrinterLandingPage({ onNewProposal, onAdminPanel, onOpenQuotes }: Props) {
 return <ModuleLauncher title="Outsourcing de impressão" description="Componha o parque, as franquias e os custos do contrato em um único fluxo." module="Printer Outsourcing" onConfigure={onAdminPanel} onOpenQuotes={onOpenQuotes} actions={[{ title: 'Novo orçamento', description: 'Comece pelas premissas do cliente e avance até a revisão dos resultados.', icon: <Printer className="h-5 w-5" />, label: 'Começar composição', onClick: onNewProposal }]} help="Configure equipamentos, volume e franquias, revise suprimentos, logística e manutenção e confira preço mensal e total do contrato antes de gerar a proposta." />;
}
