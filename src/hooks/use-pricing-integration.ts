"use client";

import { useCallback, useContext } from 'react';
import { QuoteContext } from '@/contexts/QuoteContext';
import { PricingProposal, useQuoteIntegration } from '@/hooks/use-quote-integration';

export function usePricingIntegration() {
  const quoteContext = useContext(QuoteContext);
  const { createQuoteFromProposal: createQuoteFromProposalFallback } = useQuoteIntegration();

  const createQuoteFromPricingData = useCallback((
    proposalData: {
      name: string;
      clientName: string;
      totalPrice: number;
      module: PricingProposal['module'];
      modality?: string;
      technicalSpecs?: any;
      clientData?: PricingProposal['clientData'];
    }
  ) => {
    const pricingProposal: PricingProposal = {
      id: `${proposalData.module.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: proposalData.name,
      clientName: proposalData.clientName,
      date: new Date().toISOString(),
      totalPrice: proposalData.totalPrice,
      module: proposalData.module,
      modality: proposalData.modality,
      clientData: proposalData.clientData,
      technicalSpecs: proposalData.technicalSpecs
    };

    try {
      const quote = (quoteContext?.createQuoteFromProposal || createQuoteFromProposalFallback)(pricingProposal);
      console.log(`Orçamento criado para ${proposalData.module}:`, quote);
      return quote;
    } catch (error) {
      console.error(`Erro ao criar orçamento para ${proposalData.module}:`, error);
      throw error;
    }
  }, [quoteContext, createQuoteFromProposalFallback]);

  return {
    createQuoteFromPricingData
  };
}
