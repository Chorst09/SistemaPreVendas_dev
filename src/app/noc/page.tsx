'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { NOCPricingSystem } from '@/components/noc-pricing/NOCPricingSystem';
import { QuoteProvider } from '@/contexts/QuoteContext';
import { initialQuotes } from '@/lib/data';
import { AuthGate } from '@/components/auth/AuthGate';

export default function NOCPage() {
  const router = useRouter();
  return (
    <AuthGate>
      <QuoteProvider initialData={initialQuotes}>
        <div className="min-h-screen bg-background">
          <NOCPricingSystem onNavigateToQuotes={() => router.push('/?tab=quotes')} />
        </div>
      </QuoteProvider>
    </AuthGate>
  );
}
