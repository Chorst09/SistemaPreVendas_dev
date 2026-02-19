"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
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

const QuoteContext = createContext<QuoteContextType | undefined>(undefined);

interface QuoteProviderProps {
  children: ReactNode;
  initialData?: Quote[];
}

export function QuoteProvider({ children, initialData = initialQuotes }: QuoteProviderProps) {
  const [quotes, setQuotes] = useState<Quote[]>(() => {
    // Tentar carregar do localStorage primeiro
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('quotes-storage');
        if (stored) {
          const parsed = JSON.parse(stored);
          console.log('QuoteProvider - Carregado do localStorage:', parsed.length, 'quotes');
          return parsed;
        }
      } catch (error) {
        console.error('QuoteProvider - Erro ao carregar do localStorage:', error);
      }
    }
    return initialData;
  });
  
  const { createQuoteFromProposal: createQuoteFromProposalHook } = useQuoteIntegration();

  const addQuote = useCallback((quote: Quote) => {
    setQuotes(prev => {
      // Verificar se já existe um orçamento com o mesmo ID
      const existingIndex = prev.findIndex(q => q.id === quote.id);
      let newQuotes;
      
      if (existingIndex !== -1) {
        // Atualizar orçamento existente
        newQuotes = [...prev];
        newQuotes[existingIndex] = quote;
      } else {
        // Adicionar novo orçamento
        newQuotes = [...prev, quote];
      }
      
      // Persistir no localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('quotes-storage', JSON.stringify(newQuotes));
          console.log('QuoteProvider - Salvo no localStorage:', newQuotes.length, 'quotes');
        } catch (error) {
          console.error('QuoteProvider - Erro ao salvar no localStorage:', error);
        }
      }
      
      return newQuotes;
    });
    
    console.log('QuoteProvider - Orçamento adicionado:', quote);
  }, []);

  const updateQuote = useCallback((id: string, updatedQuote: Partial<Quote>) => {
    setQuotes(prev => {
      const newQuotes = prev.map(quote => 
        quote.id === id ? { ...quote, ...updatedQuote } : quote
      );
      
      // Persistir no localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('quotes-storage', JSON.stringify(newQuotes));
          console.log('QuoteProvider - Atualizado no localStorage');
        } catch (error) {
          console.error('QuoteProvider - Erro ao atualizar no localStorage:', error);
        }
      }
      
      return newQuotes;
    });
  }, []);

  const deleteQuote = useCallback((id: string) => {
    setQuotes(prev => {
      const newQuotes = prev.filter(quote => quote.id !== id);
      
      // Persistir no localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('quotes-storage', JSON.stringify(newQuotes));
          console.log('QuoteProvider - Deletado do localStorage');
        } catch (error) {
          console.error('QuoteProvider - Erro ao deletar do localStorage:', error);
        }
      }
      
      return newQuotes;
    });
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