import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    data: [],
    total: 0,
    fonte: 'e-Compras Curitiba',
    erros: ['Fonte disponível no Portal de Busca, mas o proxy municipal não está configurado neste deploy.'],
    timestamp: new Date().toISOString()
  });
}
