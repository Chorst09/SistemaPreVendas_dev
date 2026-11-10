'use client';

import React, { useEffect, useState } from 'react';
import { PrinterLandingPage } from './PrinterLandingPage';
import { PrinterOutsourcingModule } from './PrinterOutsourcingModule';
import { ProposalClientDataForm, ProposalClientData } from '@/components/shared/ProposalClientDataForm';

interface PrinterModuleWrapperProps {
  onNavigateToQuotes?: () => void;
}

type PrinterView = 'landing' | 'client-data' | 'pricing' | 'admin';
const PRINTER_VIEW_STORAGE_KEY = 'printer-module-view';
const PRINTER_CLIENT_DATA_STORAGE_KEY = 'printer-module-client-data';
const ACTIVE_TAB_STORAGE_KEY = 'sistema-pre-active-tab';
const PRINTER_ACTIVE_TAB_ID = 'calculator-printer';
const PRINTER_VIEWS: PrinterView[] = ['landing', 'client-data', 'pricing', 'admin'];

function readStoredView(): PrinterView {
  if (typeof window === 'undefined') return 'landing';
  const stored = window.localStorage.getItem(PRINTER_VIEW_STORAGE_KEY) as PrinterView | null;
  return stored && PRINTER_VIEWS.includes(stored) ? stored : 'landing';
}

function readStoredClientData(): ProposalClientData | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem(PRINTER_CLIENT_DATA_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    window.localStorage.removeItem(PRINTER_CLIENT_DATA_STORAGE_KEY);
    return null;
  }
}

export function PrinterModuleWrapper({ onNavigateToQuotes }: PrinterModuleWrapperProps = {}) {
  const [view, setViewState] = useState<PrinterView>(readStoredView);
  const [clientData, setClientData] = useState<ProposalClientData | null>(readStoredClientData);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, PRINTER_ACTIVE_TAB_ID);
    window.localStorage.setItem(PRINTER_VIEW_STORAGE_KEY, view);
  }, [view]);

  const setView = (nextView: PrinterView) => {
    setViewState(nextView);
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, PRINTER_ACTIVE_TAB_ID);
    window.localStorage.setItem(PRINTER_VIEW_STORAGE_KEY, nextView);
  };

  const setStoredClientData = (data: ProposalClientData | null) => {
    setClientData(data);
    if (typeof window === 'undefined') return;
    if (data) {
      window.localStorage.setItem(PRINTER_CLIENT_DATA_STORAGE_KEY, JSON.stringify(data));
    } else {
      window.localStorage.removeItem(PRINTER_CLIENT_DATA_STORAGE_KEY);
    }
  };

  if (view === 'landing') {
    return (
      <PrinterLandingPage
        onOpenQuotes={onNavigateToQuotes}
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
      <PrinterOutsourcingModule
        onNavigateToProposals={onNavigateToQuotes}
        proposalClientData={clientData}
        onBack={() => setView('landing')}
      />
    );
  }

  return null;
}
