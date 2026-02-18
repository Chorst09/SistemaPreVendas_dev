import type { ClientData as LegacyClientData } from '@/components/calculators/ProposalClientForm';
import type { ProposalClientData } from '@/components/shared/ProposalClientDataForm';

export function mapProposalClientDataToLegacyClientData(data: ProposalClientData): LegacyClientData {
  return {
    razaoSocial: data.companyName || data.clientName || '',
    nomeContato: data.clientName || data.companyName || '',
    telefoneCliente: data.clientPhone || '',
    emailCliente: data.clientEmail || '',
    nomeProjeto: data.projectName || '',
    nomeGerente: data.managerName || '',
    telefoneGerente: data.managerPhone || '',
    emailGerente: data.managerEmail || '',
  };
}

