import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuoteProvider, useQuotes } from '@/contexts/QuoteContext';
import { SalesModule } from '@/components/it-pricing/SalesModule';
import { RentalModule } from '@/components/it-pricing/RentalModule';
import { ServiceModule } from '@/components/it-pricing/ServiceModule';
import type { ProposalClientData } from '@/components/shared/ProposalClientDataForm';

function QuotesCounter() {
  const { quotes } = useQuotes();
  return <div data-testid="quotes-count">{quotes.length}</div>;
}

const proposalClientData: ProposalClientData = {
  clientName: 'Cliente Teste',
  clientEmail: 'cliente@teste.com',
  clientPhone: '11999999999',
  companyName: 'Empresa Teste',
  cnpj: '00.000.000/0000-00',
  address: 'Rua Teste, 123',
  projectName: 'Projeto Teste',
  projectType: 'Venda',
  projectDescription: 'Projeto para teste de integração',
  deliveryDate: '2026-03-01',
  estimatedBudget: '10000',
  managerName: 'Gerente Teste',
  managerEmail: 'gerente@teste.com',
  managerPhone: '11888888888',
  department: 'comercial',
};

function renderWithQuotes(children: React.ReactNode) {
  return render(
    <QuoteProvider initialData={[]}>
      {children}
      <QuotesCounter />
    </QuoteProvider>,
  );
}

describe('IT modules save to quotes', () => {
  const onNavigateToProposals = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    onNavigateToProposals.mockClear();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('salva orçamento no módulo de vendas', async () => {
    renderWithQuotes(
      <SalesModule
        onBack={() => {}}
        onNavigateToProposals={onNavigateToProposals}
        proposalClientData={proposalClientData}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /Adicionar ao Orçamento/i }));

    await waitFor(() => {
      expect(screen.getByTestId('quotes-count')).toHaveTextContent('1');
    });
  });

  it('salva orçamento no módulo de locação', async () => {
    renderWithQuotes(
      <RentalModule
        onBack={() => {}}
        onNavigateToProposals={onNavigateToProposals}
        proposalClientData={proposalClientData}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /Adicionar ao Orçamento/i }));

    await waitFor(() => {
      expect(screen.getByTestId('quotes-count')).toHaveTextContent('1');
    });
  });

  it('salva orçamento no módulo de serviços', async () => {
    renderWithQuotes(
      <ServiceModule
        onBack={() => {}}
        onNavigateToProposals={onNavigateToProposals}
        proposalClientData={proposalClientData}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /Adicionar ao Orçamento/i }));

    await waitFor(() => {
      expect(screen.getByTestId('quotes-count')).toHaveTextContent('1');
    });
  });
});

