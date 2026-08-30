import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      data: [],
      total: 0,
      erro: 'BLL requer integração autenticada específica no backend.'
    },
    { status: 501 }
  );
}
