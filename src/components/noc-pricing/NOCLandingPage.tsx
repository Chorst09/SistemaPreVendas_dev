'use client';
import { Database, Network, Shield } from 'lucide-react';
import { ModuleLauncher } from '@/components/shared/ModuleLauncher';
import type { NOCServiceScope } from '@/lib/types/noc-pricing';
interface Props { onNewProposal: (mode: NOCServiceScope) => void; onAdminPanel: () => void; onOpenQuotes?: () => void }
export function NOCLandingPage({ onNewProposal, onAdminPanel, onOpenQuotes }: Props) {
 return <ModuleLauncher title="NOC, SOC e SIEM" description="Escolha o escopo do serviço e construa a composição técnica e financeira." module="NOC" onConfigure={onAdminPanel} onOpenQuotes={onOpenQuotes} actions={[
 {title:'NOC',description:'Monitoramento de rede e infraestrutura, dispositivos, disponibilidade, SLA e cobertura operacional.',icon:<Network className="h-5 w-5" />,label:'Precificar NOC',onClick:()=>onNewProposal('noc')},
 {title:'SOC',description:'Operação de segurança por ativo, monitoramento, triagem e resposta a incidentes.',icon:<Shield className="h-5 w-5" />,label:'Precificar SOC',onClick:()=>onNewProposal('soc')},
 {title:'SIEM',description:'Ingestão de logs, fontes de dados, regras de correlação, retenção e serviços gerenciados.',icon:<Database className="h-5 w-5" />,label:'Precificar SIEM',onClick:()=>onNewProposal('siem')}
 ]} help="Escolha o serviço, informe os dados do cliente e revise escopo, dispositivos, equipe, SLA e custos. Antes de gerar o orçamento, confira as premissas, os impostos e o resultado global do contrato." />;
}
