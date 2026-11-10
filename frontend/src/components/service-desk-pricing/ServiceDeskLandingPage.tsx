'use client';
import { Headset } from 'lucide-react';
import { ModuleLauncher } from '@/components/shared/ModuleLauncher';

interface Props { onNewProposal: () => void; onAdminPanel: () => void; onOpenQuotes?: () => void }
export function ServiceDeskLandingPage({ onNewProposal, onAdminPanel, onOpenQuotes }: Props) {
 return <ModuleLauncher title="Service Desk" description="Dimensione a operação, componha custos e transforme cenários em orçamentos." module="Service Desk" onConfigure={onAdminPanel} onOpenQuotes={onOpenQuotes} actions={[{ title: 'Novo orçamento', description: 'Comece pelas premissas do cliente e avance até a revisão dos resultados.', icon: <Headset className="h-5 w-5" />, label: 'Começar composição', onClick: onNewProposal }]} help="Defina as premissas de atendimento, dimensione a equipe e a escala, revise impostos e custos e acompanhe o resultado. Os valores mensais e globais ficam identificados nas etapas de resultado." />;
}
