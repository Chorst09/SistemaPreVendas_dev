'use client';

import React from 'react';
import { NOCPricingSystem } from '@/components/noc-pricing/NOCPricingSystem';
import { QuoteProvider } from '@/contexts/QuoteContext';
import { initialQuotes } from '@/lib/data';

export default function NOCPage() {
  return (
    <QuoteProvider initialData={initialQuotes}>
      <div className="min-h-screen bg-background">
        <NOCPricingSystem />
      </div>
    </QuoteProvider>
  );
}
