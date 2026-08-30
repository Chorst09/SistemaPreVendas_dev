import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    data: [],
    total: 0,
    erro: 'ComprasNet proxy não está configurado neste deploy. Use PNCP Oficial para busca pública.'
  });
}
