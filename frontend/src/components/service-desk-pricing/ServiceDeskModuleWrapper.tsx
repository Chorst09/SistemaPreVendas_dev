'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ServiceDeskLandingPage } from './ServiceDeskLandingPage';
import { ServiceDeskPricingSystem } from './ServiceDeskPricingSystem';
import { ModernServiceDeskCalculator } from './modern/ModernServiceDeskCalculator';
import { ProposalClientDataForm, ProposalClientData } from '@/components/shared/ProposalClientDataForm';

export function ServiceDeskModuleWrapper() {
  const router = useRouter();
  const [view, setView] = useState<'landing' | 'client-data' | 'pricing' | 'modern' | 'admin'>('landing');
  const [clientData, setClientData] = useState<ProposalClientData | null>(null);

  if (view === 'landing') {
    return (
      <ServiceDeskLandingPage
        onNewProposal={() => setView('client-data')}
        onModernCalculator={() => setView('modern')}
        onAdminPanel={() => setView('admin')}
      />
    );
  }

  if (view === 'client-data') {
    return (
      <ProposalClientDataForm
        moduleType="service-desk"
        onSubmit={(data) => {
          setClientData(data);
          setView('pricing');
        }}
        onBack={() => setView('landing')}
      />
    );
  }

  if (view === 'modern') {
    return (
      <ModernServiceDeskCalculator
        onBack={() => setView('landing')}
        onNavigateToQuotes={() => router.push('/dashboard?tab=quotes')}
      />
    );
  }

  if (view === 'pricing' || view === 'admin') {
    return (
      <ServiceDeskPricingSystem
        integrationMode="integrated"
        onDataChange={(data) => console.log('Service Desk data updated:', data)}
        onBack={() => setView('landing')}
      />
    );
  }

  return null;
}
