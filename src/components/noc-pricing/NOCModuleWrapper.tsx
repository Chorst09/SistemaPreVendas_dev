'use client';

import React, { useEffect, useState } from 'react';
import { NOCLandingPage } from './NOCLandingPage';
import { NOCPricingSystem } from './NOCPricingSystem';
import { SIEMPricingSystem, SOCPricingSystem } from './SecurityPricingSystem';
import { ProposalClientDataForm, ProposalClientData } from '@/components/shared/ProposalClientDataForm';
import { NOCServiceScope } from '@/lib/types/noc-pricing';

interface NOCModuleWrapperProps {
  onNavigateToQuotes?: () => void;
}

type NOCView = 'landing' | 'client-data' | 'pricing' | 'admin';
const NOC_VIEW_STORAGE_KEY = 'noc-module-view';
const NOC_CLIENT_DATA_STORAGE_KEY = 'noc-module-client-data';
const NOC_SERVICE_MODE_STORAGE_KEY = 'noc-module-service-mode';
const ACTIVE_TAB_STORAGE_KEY = 'sistema-pre-active-tab';
const NOC_ACTIVE_TAB_ID = 'calculator-noc';
const NOC_VIEWS: NOCView[] = ['landing', 'client-data', 'pricing', 'admin'];

function readStoredView(): NOCView {
  if (typeof window === 'undefined') return 'landing';
  const stored = window.localStorage.getItem(NOC_VIEW_STORAGE_KEY) as NOCView | null;
  return stored && NOC_VIEWS.includes(stored) ? stored : 'landing';
}

function readStoredClientData(): ProposalClientData | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem(NOC_CLIENT_DATA_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    window.localStorage.removeItem(NOC_CLIENT_DATA_STORAGE_KEY);
    return null;
  }
}

function readStoredServiceMode(): NOCServiceScope {
  if (typeof window === 'undefined') return 'noc';
  const stored = window.localStorage.getItem(NOC_SERVICE_MODE_STORAGE_KEY) as NOCServiceScope | null;
  return stored && ['noc', 'soc', 'siem'].includes(stored) ? stored : 'noc';
}

export function NOCModuleWrapper({ onNavigateToQuotes }: NOCModuleWrapperProps = {}) {
  const [view, setViewState] = useState<NOCView>(readStoredView);
  const [clientData, setClientData] = useState<ProposalClientData | null>(readStoredClientData);
  const [serviceMode, setServiceModeState] = useState<NOCServiceScope>(readStoredServiceMode);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, NOC_ACTIVE_TAB_ID);
    window.localStorage.setItem(NOC_VIEW_STORAGE_KEY, view);
  }, [view]);

  const setView = (nextView: NOCView) => {
    setViewState(nextView);
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, NOC_ACTIVE_TAB_ID);
    window.localStorage.setItem(NOC_VIEW_STORAGE_KEY, nextView);
  };

  const setStoredClientData = (data: ProposalClientData | null) => {
    setClientData(data);
    if (typeof window === 'undefined') return;
    if (data) {
      window.localStorage.setItem(NOC_CLIENT_DATA_STORAGE_KEY, JSON.stringify(data));
    } else {
      window.localStorage.removeItem(NOC_CLIENT_DATA_STORAGE_KEY);
    }
  };

  const setServiceMode = (nextMode: NOCServiceScope) => {
    setServiceModeState(nextMode);
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(NOC_SERVICE_MODE_STORAGE_KEY, nextMode);
  };

  if (view === 'landing') {
    return (
      <NOCLandingPage
        onNewProposal={(mode) => {
          setServiceMode(mode);
          setView('client-data');
        }}
        onAdminPanel={() => setView('admin')}
      />
    );
  }

  if (view === 'client-data') {
    return (
      <ProposalClientDataForm
        moduleType="noc"
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
    if (serviceMode === 'soc') {
      return (
        <SOCPricingSystem
          onBack={() => setView('landing')}
          proposalClientData={clientData}
          onNavigateToQuotes={onNavigateToQuotes}
        />
      );
    }

    if (serviceMode === 'siem') {
      return (
        <SIEMPricingSystem
          onBack={() => setView('landing')}
          proposalClientData={clientData}
          onNavigateToQuotes={onNavigateToQuotes}
        />
      );
    }

    return (
      <NOCPricingSystem
        onBack={() => setView('landing')}
        proposalClientData={clientData}
        onNavigateToQuotes={onNavigateToQuotes}
      />
    );
  }

  return null;
}
