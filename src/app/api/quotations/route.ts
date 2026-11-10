/**
 * API de Cotações (Quotations)
 * 
 * GET /api/quotations - Lista todas as cotações
 * POST /api/quotations - Cria nova cotação
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Função para gerar número de cotação: COT-YYYY-9999
async function generateQuotationNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `COT-${year}-`;
  
  const lastQuotation = await prisma.quotation.findFirst({
    where: {
      quotationNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      quotationNumber: 'desc',
    },
  });

  let nextNumber = 1;
  if (lastQuotation) {
    const lastNumber = parseInt(lastQuotation.quotationNumber.split('-')[2]);
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
}

// GET /api/quotations - Lista cotações
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const partnerId = searchParams.get('partnerId');
    const quoteId = searchParams.get('quoteId');
    
    const quotations = await prisma.quotation.findMany({
      where: {
        ...(status && { status: status as any }),
        ...(partnerId && { partnerId }),
        ...(quoteId && { quoteId }),
      },
      include: {
        partner: {
          select: {
            id: true,
            name: true,
            type: true,
            email: true,
            phone: true,
            avgResponseTime: true,
            rating: true,
          },
        },
        quote: {
          select: {
            id: true,
            quoteNumber: true,
            clientName: true,
            accountManager: true,
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calcular totais e tempos de resposta
    const quotationsWithStats = quotations.map(quotation => {
      const itemsTotal = quotation.items.reduce(
        (acc, item) => acc + item.totalPrice,
        0
      );
      
      const responseTime = quotation.respondedAt
        ? Math.ceil(
            (quotation.respondedAt.getTime() - quotation.requestedAt.getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : null;

      return {
        ...quotation,
        itemsCount: quotation.items.length,
        calculatedTotal: itemsTotal,
        responseTimeInDays: responseTime,
      };
    });

    return NextResponse.json({
      success: true,
      data: quotationsWithStats,
      count: quotations.length,
    });
  } catch (error: any) {
    console.error('Erro ao listar cotações:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/quotations - Cria nova cotação
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Gerar número da cotação
    const quotationNumber = await generateQuotationNumber();
    
    // Validar se o Quote existe
    if (body.quoteId) {
      const quote = await prisma.quote.findUnique({
        where: { id: body.quoteId },
      });

      if (!quote) {
        return NextResponse.json(
          { success: false, error: 'Orçamento não encontrado' },
          { status: 404 }
        );
      }
    }

    // Validar se o Partner existe
    const partner = await prisma.partner.findUnique({
      where: { id: body.partnerId },
    });

    if (!partner) {
      return NextResponse.json(
        { success: false, error: 'Parceiro não encontrado' },
        { status: 404 }
      );
    }
    
    const quotation = await prisma.quotation.create({
      data: {
        quotationNumber,
        partnerId: body.partnerId,
        quoteId: body.quoteId,
        roNumber: body.roNumber,
        requestedAt: new Date(),
        expectedResponseDate: body.expectedResponseDate
          ? new Date(body.expectedResponseDate)
          : undefined,
        status: 'PENDING',
        requestNotes: body.requestNotes,
        
        // Itens da cotação
        items: body.items ? {
          create: body.items.map((item: any) => ({
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            unitOfMeasure: item.unitOfMeasure || 'UN',
            requestedSpecs: item.requestedSpecs,
          })),
        } : undefined,
      },
      include: {
        partner: {
          select: {
            id: true,
            name: true,
            type: true,
            email: true,
            phone: true,
          },
        },
        quote: {
          select: {
            id: true,
            quoteNumber: true,
            clientName: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Incrementar contador de cotações do parceiro
    await prisma.partner.update({
      where: { id: body.partnerId },
      data: {
        totalQuotations: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: quotation,
      message: `Cotação ${quotationNumber} criada e enviada ao parceiro ${partner.name}`,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar cotação:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
