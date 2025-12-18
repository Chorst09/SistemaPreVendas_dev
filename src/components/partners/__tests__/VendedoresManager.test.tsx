import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VendedoresManager } from '../VendedoresManager';
import { VendedorResponsavel } from '@/lib/types';

// Mock dos componentes UI
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, type, ...props }: any) => (
    <button onClick={onClick} type={type} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ ...props }: any) => <input {...props} />,
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogTrigger: ({ children }: any) => <div data-testid="dialog-trigger">{children}</div>,
}));

jest.mock('@/components/ui/form', () => ({
  Form: ({ children }: any) => <div data-testid="form">{children}</div>,
  FormControl: ({ children }: any) => <div data-testid="form-control">{children}</div>,
  FormField: ({ render }: any) => render({ field: { onChange: jest.fn(), value: '' } }),
  FormItem: ({ children }: any) => <div data-testid="form-item">{children}</div>,
  FormLabel: ({ children }: any) => <label data-testid="form-label">{children}</label>,
  FormMessage: () => <div data-testid="form-message" />,
}));

describe('VendedoresManager', () => {
  const mockOnChange = jest.fn();
  const mockVendedores: VendedorResponsavel[] = [];

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('deve renderizar o botão de adicionar vendedor', () => {
    render(<VendedoresManager vendedores={mockVendedores} onChange={mockOnChange} />);
    
    expect(screen.getByText('Adicionar Vendedor')).toBeInTheDocument();
  });

  it('deve mostrar mensagem quando não há vendedores', () => {
    render(<VendedoresManager vendedores={mockVendedores} onChange={mockOnChange} />);
    
    expect(screen.getByText('Nenhum vendedor cadastrado')).toBeInTheDocument();
  });

  it('deve abrir o modal ao clicar em adicionar vendedor', () => {
    render(<VendedoresManager vendedores={mockVendedores} onChange={mockOnChange} />);
    
    const addButton = screen.getByText('Adicionar Vendedor');
    fireEvent.click(addButton);
    
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
    expect(screen.getByText('Adicionar Vendedor Responsável')).toBeInTheDocument();
  });
});