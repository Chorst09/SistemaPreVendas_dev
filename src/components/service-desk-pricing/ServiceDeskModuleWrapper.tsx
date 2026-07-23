'use client';

import React, { Component, useEffect, useState } from 'react';
import { ServiceDeskLandingPage } from './ServiceDeskLandingPage';
import { ServiceDeskPricingSystem } from './ServiceDeskPricingSystem';
import { ProposalClientDataForm, ProposalClientData } from '@/components/shared/ProposalClientDataForm';
import { Button } from '@/components/ui/button';

class PricingErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center space-y-4">
          <div className="text-destructive text-lg font-semibold">Erro no Sistema de Precificação</div>
          <p className="text-muted-foreground max-w-md">
            Ocorreu um erro inesperado. Tente recarregar ou retornar à página inicial.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={this.handleRetry}>Tentar novamente</Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

type ServiceDeskView = 'landing' | 'client-data' | 'pricing' | 'admin';
const SERVICE_DESK_VIEW_STORAGE_KEY = 'service-desk-module-view';
const SERVICE_DESK_CLIENT_DATA_STORAGE_KEY = 'service-desk-module-client-data';
const SERVICE_DESK_EDITING_PROPOSAL_KEY = 'service-desk-editing-proposal-id';
const ACTIVE_TAB_STORAGE_KEY = 'sistema-pre-active-tab';
const SERVICE_DESK_ACTIVE_TAB_ID = 'calculator-servicedesk-advanced';

function readStoredView(): ServiceDeskView {
  if (typeof window === 'undefined') return 'landing';
  if (window.localStorage.getItem(SERVICE_DESK_EDITING_PROPOSAL_KEY)) return 'client-data';
  return 'landing';
}

function readStoredClientData(): ProposalClientData | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem(SERVICE_DESK_CLIENT_DATA_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    window.localStorage.removeItem(SERVICE_DESK_CLIENT_DATA_STORAGE_KEY);
    return null;
  }
}

interface ServiceDeskModuleWrapperProps {
  onNavigateToQuotes?: () => void;
  onNavigateToProposals?: () => void;
}

export function ServiceDeskModuleWrapper({ onNavigateToQuotes, onNavigateToProposals }: ServiceDeskModuleWrapperProps = {}) {
  const [view, setViewState] = useState<ServiceDeskView>(() => {
    const stored = readStoredView();
    if (stored === 'landing') {
      const editingId = typeof window !== 'undefined' ? window.localStorage.getItem(SERVICE_DESK_EDITING_PROPOSAL_KEY) : null;
      if (editingId) {
        window.localStorage.removeItem(SERVICE_DESK_EDITING_PROPOSAL_KEY);
        return 'client-data';
      }
    }
    return stored;
  });
  const [clientData, setClientData] = useState<ProposalClientData | null>(() => {
    const stored = readStoredClientData();
    if (!stored) {
      const editingId = typeof window !== 'undefined' ? window.localStorage.getItem(SERVICE_DESK_EDITING_PROPOSAL_KEY) : null;
      if (editingId) {
        try {
          const savedProposals = JSON.parse(localStorage.getItem('serviceDeskProposals') || '[]');
          const proposal = savedProposals.find((p: any) => p.id === editingId);
          if (proposal) {
            window.localStorage.removeItem(SERVICE_DESK_EDITING_PROPOSAL_KEY);
            return {
              companyName: proposal.clientData?.companyName || '',
              clientName: proposal.clientData?.contactName || '',
              projectName: proposal.clientData?.projectName || '',
              clientEmail: proposal.clientData?.email || '',
              clientPhone: proposal.clientData?.phone || '',
              managerName: proposal.clientData?.managerName || '',
              managerEmail: proposal.clientData?.managerEmail || '',
              managerPhone: proposal.clientData?.managerPhone || '',
              cnpj: '',
              address: proposal.clientData?.companyName || '',
              projectDescription: `Edição: ${proposal.clientData?.projectName || ''}`,
              projectType: 'service-desk',
              deliveryDate: '',
              estimatedBudget: '',
              department: 'TI'
            };
          }
        } catch (e) {
          console.error('Error loading editing proposal:', e);
        }
      }
    }
    return stored;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, SERVICE_DESK_ACTIVE_TAB_ID);
    if (view === 'pricing' || view === 'admin') {
      window.localStorage.setItem(SERVICE_DESK_VIEW_STORAGE_KEY, view);
    }
  }, [view]);

  const setView = (nextView: ServiceDeskView) => {
    setViewState(nextView);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, SERVICE_DESK_ACTIVE_TAB_ID);
      window.localStorage.setItem(SERVICE_DESK_VIEW_STORAGE_KEY, nextView);
    }
  };

  const setStoredClientData = (data: ProposalClientData | null) => {
    setClientData(data);
    if (typeof window === 'undefined') return;
    if (data) {
      window.localStorage.setItem(SERVICE_DESK_CLIENT_DATA_STORAGE_KEY, JSON.stringify(data));
    } else {
      window.localStorage.removeItem(SERVICE_DESK_CLIENT_DATA_STORAGE_KEY);
    }
  };

  if (view === 'landing') {
    return (
      <ServiceDeskLandingPage
        onNewProposal={() => setView('client-data')}
        onAdminPanel={() => setView('admin')}
      />
    );
  }

  if (view === 'client-data') {
    return (
      <ProposalClientDataForm
        moduleType="service-desk"
        onSubmit={(data) => {
          setStoredClientData(data);
          setView('pricing');
        }}
        onSkip={() => {
          setStoredClientData(null);
          setView('pricing');
        }}
        onBack={() => setView('landing')}
      />
    );
  }

  if (view === 'pricing' || view === 'admin') {
    return (
      <PricingErrorBoundary>
        <ServiceDeskPricingSystem
          integrationMode="integrated"
          onDataChange={(data) => console.log('Service Desk data updated:', data)}
          onBack={() => setView('landing')}
          proposalClientData={clientData}
          onNavigateToQuotes={onNavigateToQuotes}
          onNavigateToProposals={onNavigateToProposals}
        />
      </PricingErrorBoundary>
    );
  }

  return null;
}
