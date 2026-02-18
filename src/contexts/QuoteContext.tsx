"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Quote } from '@/lib/types';
import { initialQuotes } from '@/lib/data';
import { PricingProposal, useQuoteIntegration } from '@/hooks/use-quote-integration';

interface QuoteContextType {
  quotes: Quote[];
  addQuote: (quote: Quote) => void;
  updateQuote: (id: string, quote: Partial<Quote>) => void;
  deleteQuote: (id: string) => void;
  createQuoteFromProposal: (proposal: PricingProposal) => Quote;
  getQuoteById: (id: string) => Quote | undefined;
}

export const QuoteContext = createContext<QuoteContextType | undefined>(undefined);
const QUOTES_STORAGE_KEY = 'quotes-storage-v1';

interface QuoteProviderProps {
  children: ReactNode;
  initialData?: Quote[];
}

export function QuoteProvider({ children, initialData = initialQuotes }: QuoteProviderProps) {
  const [quotes, setQuotes] = useState<Quote[]>(() => {
    if (typeof window === 'undefined') return initialData;

    try {
      const storedQuotes = localStorage.getItem(QUOTES_STORAGE_KEY);
      if (storedQuotes) {
        const parsed = JSON.parse(storedQuotes);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('Erro ao carregar orçamentos salvos:', error);
    }

    return initialData;
  });
  const { createQuoteFromProposal: createQuoteFromProposalHook } = useQuoteIntegration();

  useEffect(() => {
    try {
      localStorage.setItem(QUOTES_STORAGE_KEY, JSON.stringify(quotes));
    } catch (error) {
      console.error('Erro ao persistir orçamentos:', error);
    }
  }, [quotes]);

  const addQuote = useCallback((quote: Quote) => {
    setQuotes(prev => {
      // Verificar se já existe um orçamento com o mesmo ID
      const existingIndex = prev.findIndex(q => q.id === quote.id);
      if (existingIndex !== -1) {
        // Atualizar orçamento existente
        const updated = [...prev];
        updated[existingIndex] = quote;
        return updated;
      }
      // Adicionar novo orçamento
      return [...prev, quote];
    });
    
    console.log('Orçamento adicionado:', quote);
  }, []);

  const updateQuote = useCallback((id: string, updatedQuote: Partial<Quote>) => {
    setQuotes(prev => prev.map(quote => 
      quote.id === id ? { ...quote, ...updatedQuote } : quote
    ));
  }, []);

  const deleteQuote = useCallback((id: string) => {
    setQuotes(prev => prev.filter(quote => quote.id !== id));
  }, []);

  const createQuoteFromProposal = useCallback((proposal: PricingProposal): Quote => {
    const quote = createQuoteFromProposalHook(proposal);
    addQuote(quote);
    return quote;
  }, [createQuoteFromProposalHook, addQuote]);

  const getQuoteById = useCallback((id: string): Quote | undefined => {
    return quotes.find(quote => quote.id === id);
  }, [quotes]);

  const value: QuoteContextType = {
    quotes,
    addQuote,
    updateQuote,
    deleteQuote,
    createQuoteFromProposal,
    getQuoteById
  };

  return (
    <QuoteContext.Provider value={value}>
      {children}
    </QuoteContext.Provider>
  );
}

export function useQuotes() {
  const context = useContext(QuoteContext);
  if (context === undefined) {
    throw new Error('useQuotes must be used within a QuoteProvider');
  }
  return context;
}
