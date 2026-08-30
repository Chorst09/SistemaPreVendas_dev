import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    fontes: [
      {
        id: 'pncp',
        nome: 'PNCP',
        descricao: 'Portal Nacional de Contratações Públicas',
        logo: '🏛️',
        tipo: 'federal',
        status: 'ativo',
        url: 'https://pncp.gov.br'
      },
      {
        id: 'comprasnet',
        nome: 'ComprasNet',
        descricao: 'Portal de Compras do Governo Federal',
        logo: '🇧🇷',
        tipo: 'federal',
        status: 'ativo',
        url: 'https://compras.gov.br'
      },
      {
        id: 'curitiba-ecompras',
        nome: 'e-Compras Curitiba',
        descricao: 'Portal de Compras Eletrônicas do Município de Curitiba',
        logo: '🏙️',
        tipo: 'municipal',
        status: 'ativo',
        url: 'https://e-compras.curitiba.pr.gov.br'
      }
    ]
  });
}
