import React, { useEffect } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QuoteProvider, useQuotes } from '@/contexts/QuoteContext';
import { usePricingIntegration } from '@/hooks/use-pricing-integration';

function PricingIntegrationTestProbe() {
  const { createQuoteFromPricingData } = usePricingIntegration();
  const { quotes } = useQuotes();

  useEffect(() => {
    createQuoteFromPricingData({
      name: 'Venda TI',
      clientName: 'Cliente VLS',
      totalPrice: 1000,
      module: 'IT Sales/Rental/Services',
      clientData: {
        razaoSocial: 'Cliente VLS',
        nomeContato: 'Contato VLS',
        telefoneCliente: '11999999999',
        emailCliente: 'vls@cliente.com',
        nomeProjeto: 'Projeto VLS',
        nomeGerente: 'Gerente VLS',
        telefoneGerente: '11888888888',
        emailGerente: 'gerente.vls@cliente.com',
      },
    });

    createQuoteFromPricingData({
      name: 'Projeto NOC',
      clientName: 'Cliente NOC',
      totalPrice: 2000,
      module: 'NOC',
      clientData: {
        razaoSocial: 'Cliente NOC',
        nomeContato: 'Contato NOC',
        telefoneCliente: '11999999998',
        emailCliente: 'noc@cliente.com',
        nomeProjeto: 'Projeto NOC',
        nomeGerente: 'Gerente NOC',
        telefoneGerente: '11888888887',
        emailGerente: 'gerente.noc@cliente.com',
      },
    });

    createQuoteFromPricingData({
      name: 'Projeto Service Desk',
      clientName: 'Cliente SD',
      totalPrice: 3000,
      module: 'Service Desk',
      clientData: {
        razaoSocial: 'Cliente SD',
        nomeContato: 'Contato SD',
        telefoneCliente: '11999999997',
        emailCliente: 'sd@cliente.com',
        nomeProjeto: 'Projeto SD',
        nomeGerente: 'Gerente SD',
        telefoneGerente: '11888888886',
        emailGerente: 'gerente.sd@cliente.com',
      },
    });

    createQuoteFromPricingData({
      name: 'Projeto Printer',
      clientName: 'Cliente Printer',
      totalPrice: 4000,
      module: 'Printer Outsourcing',
      clientData: {
        razaoSocial: 'Cliente Printer',
        nomeContato: 'Contato Printer',
        telefoneCliente: '11999999996',
        emailCliente: 'printer@cliente.com',
        nomeProjeto: 'Projeto Printer',
        nomeGerente: 'Gerente Printer',
        telefoneGerente: '11888888885',
        emailGerente: 'gerente.printer@cliente.com',
      },
    });
  }, []);

  return <div data-testid="quotes-count">{quotes.length}</div>;
}

describe('usePricingIntegration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('salva orçamentos para todos os módulos de calculadora', async () => {
    render(
      <QuoteProvider initialData={[]}>
        <PricingIntegrationTestProbe />
      </QuoteProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('quotes-count')).toHaveTextContent('4');
    });
  });
});
