'use client';

import React from 'react';
import { ProposalHeader, ProposalFooter } from './ProposalHeaderFooter';

interface ProposalPageLayoutProps {
  children: React.ReactNode;
  pageNumber?: number;
}

export function ProposalPageLayout({ children, pageNumber }: ProposalPageLayoutProps) {
  return (
    <div className="relative w-full aspect-[3/4] bg-white rounded-lg overflow-hidden shadow-2xl">
      {/* Cabeçalho — usa imagem customizada ou estática */}
      <div className="absolute top-0 left-0 right-0 z-10">
        <ProposalHeader pageNumber={pageNumber} />
      </div>

      {/* Conteúdo da página */}
      <div className="absolute top-24 bottom-48 left-0 right-0 overflow-auto">
        {children}
      </div>

      {/* Rodapé — usa imagem customizada ou estática */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <ProposalFooter pageNumber={pageNumber} />
      </div>
    </div>
  );
}
