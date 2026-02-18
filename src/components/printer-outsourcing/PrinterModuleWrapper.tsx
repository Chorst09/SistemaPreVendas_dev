'use client';

import React, { useState } from 'react';
import { PrinterLandingPage } from './PrinterLandingPage';
import { PrinterOutsourcingModule } from './PrinterOutsourcingModule';
import { ProposalClientDataForm, ProposalClientData } from '@/components/shared/ProposalClientDataForm';

interface PrinterModuleWrapperProps {
  onNavigateToQuotes?: () => void;
}

export function PrinterModuleWrapper({ onNavigateToQuotes }: PrinterModuleWrapperProps = {}) {
  const [view, setView] = useState<'landing' | 'client-data' | 'pricing' | 'admin'>('landing');
  const [clientData, setClientData] = useState<ProposalClientData | null>(null);

  if (view === 'landing') {
    return (
      <PrinterLandingPage
        onNewProposal={() => setView('client-data')}
        onAdminPanel={() => setView('admin')}
      />
    );
  }

  if (view === 'client-data') {
    return (
      <ProposalClientDataForm
        moduleType="printer"
        onSubmit={(data) => {
          setClientData(data);
          setView('pricing');
        }}
        onBack={() => setView('landing')}
      />
    );
  }

  if (view === 'pricing' || view === 'admin') {
    return (
      <PrinterOutsourcingModule
        onNavigateToProposals={onNavigateToQuotes}
        proposalClientData={clientData}
        onBack={() => setView('landing')}
      />
    );
  }

  return null;
}
