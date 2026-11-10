/**
 * API de Orçamentos (Quotes)
 * 
 * GET /api/quotes - Lista todos os orçamentos
 * POST /api/quotes - Cria novo orçamento
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Função para gerar número de orçamento: ORC-YYYY-9999
async function generateQuoteNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `ORC-${year}-`;
  
  // Buscar último número do ano
  const lastQuote = await prisma.quote.findFirst({
    where: {
      quoteNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      quoteNumber: 'desc',
    },
  });

  let nextNumber = 1;
  if (lastQuote) {
    const lastNumber = parseInt(lastQuote.quoteNumber.split('-')[2]);
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
}

// GET /api/quotes - Lista orçamentos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const partnerId = searchParams.get('partnerId');
    const clientName = searchParams.get('clientName');
    
    const quotes = await prisma.quote.findMany({
      where: {
        ...(status && { status: status as any }),
        ...(partnerId && { partnerId }),
        ...(clientName && {
          clientName: {
            contains: clientName,
            mode: 'insensitive',
          },
        }),
      },
      include: {
        partner: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                category: true,
              },
            },
          },
        },
        _count: {
          select: {
            versions: true,
            approvals: true,
            activities: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calcular totais
    const quotesWithTotals = quotes.map(quote => {
      const itemsTotal = quote.items.reduce(
        (acc, item) => acc + item.totalPrice,
        0
      );
      
      return {
        ...quote,
        itemsCount: quote.items.length,
        calculatedTotal: itemsTotal,
      };
    });

    return NextResponse.json({
      success: true,
      data: quotesWithTotals,
      count: quotes.length,
    });
  } catch (error: any) {
    console.error('Erro ao listar orçamentos:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/quotes - Cria novo orçamento
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Gerar número do orçamento
    const quoteNumber = await generateQuoteNumber();
    
    const quote = await prisma.quote.create({
      data: {
        quoteNumber,
        clientName: body.clientName,
        projectName: body.projectName,
        accountManager: body.accountManager,
        status: body.status || 'DRAFT',
        validUntil: body.validUntil ? new Date(body.validUntil) : undefined,
        deliveryDays: body.deliveryDays,
        notes: body.notes,
        internalNotes: body.internalNotes,
        partnerId: body.partnerId,
        roId: body.roId,
        
        // Itens do orçamento
        items: body.items ? {
          create: body.items.map((item: any) => ({
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            unitOfMeasure: item.unitOfMeasure || 'UN',
            unitCost: item.unitCost || 0,
            totalCost: item.totalCost || 0,
            freight: item.freight || 0,
            taxes: item.taxes || 0,
            otherCosts: item.otherCosts || 0,
            markup: item.markup || 0,
            markupPercent: item.markupPercent || 0,
            unitPrice: item.unitPrice || 0,
            totalPrice: item.totalPrice || 0,
            notes: item.notes,
          })),
        } : undefined,
      },
      include: {
        partner: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: quote,
      message: `Orçamento ${quoteNumber} criado com sucesso`,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar orçamento:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
