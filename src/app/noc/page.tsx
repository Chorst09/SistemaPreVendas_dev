'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { NOCPricingSystem } from '@/components/noc-pricing/NOCPricingSystem';
import { QuoteProvider } from '@/contexts/QuoteContext';
import { initialQuotes } from '@/lib/data';

export default function NOCPage() {
  const router = useRouter();
  return (
    <QuoteProvider initialData={initialQuotes}>
      <div className="min-h-screen bg-background">
        <NOCPricingSystem onNavigateToQuotes={() => router.push('/?tab=quotes')} />
      </div>
    </QuoteProvider>
  );
}
