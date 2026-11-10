/**
 * API de Cotação Individual
 * 
 * GET /api/quotations/[id] - Busca cotação por ID
 * PUT /api/quotations/[id] - Atualiza cotação (receber resposta do fornecedor)
 * DELETE /api/quotations/[id] - Remove cotação
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/quotations/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: params.id },
      include: {
        partner: {
          include: {
            contacts: true,
            evaluations: {
              orderBy: { evaluatedAt: 'desc' },
              take: 3,
            },
          },
        },
        quote: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!quotation) {
      return NextResponse.json(
        { success: false, error: 'Cotação não encontrada' },
        { status: 404 }
      );
    }

    // Calcular estatísticas
    const responseTime = quotation.respondedAt
      ? Math.ceil(
          (quotation.respondedAt.getTime() - quotation.requestedAt.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : null;

    const itemsTotal = quotation.items.reduce(
      (acc, item) => acc + item.totalPrice,
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        ...quotation,
        stats: {
          responseTimeInDays: responseTime,
          itemsCount: quotation.items.length,
          totalValue: itemsTotal,
        },
      },
    });
  } catch (error: any) {
    console.error('Erro ao buscar cotação:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/quotations/[id] - Receber resposta do fornecedor
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Buscar cotação atual
    const currentQuotation = await prisma.quotation.findUnique({
      where: { id: params.id },
      include: { partner: true },
    });

    if (!currentQuotation) {
      return NextResponse.json(
        { success: false, error: 'Cotação não encontrada' },
        { status: 404 }
      );
    }

    // Atualizar cotação
    const quotation = await prisma.quotation.update({
      where: { id: params.id },
      data: {
        ...(body.status && { status: body.status }),
        ...(body.respondedAt && { respondedAt: new Date(body.respondedAt) }),
        ...(body.validUntil && { validUntil: new Date(body.validUntil) }),
        ...(body.deliveryDays !== undefined && { deliveryDays: body.deliveryDays }),
        ...(body.paymentTerms !== undefined && { paymentTerms: body.paymentTerms }),
        ...(body.responseNotes !== undefined && { responseNotes: body.responseNotes }),
        ...(body.internalNotes !== undefined && { internalNotes: body.internalNotes }),
        
        // Atualizar totais se fornecidos
        ...(body.subtotal !== undefined && { subtotal: body.subtotal }),
        ...(body.taxes !== undefined && { taxes: body.taxes }),
        ...(body.freight !== undefined && { freight: body.freight }),
        ...(body.totalPrice !== undefined && { totalPrice: body.totalPrice }),
      },
      include: {
        partner: {
          select: {
            id: true,
            name: true,
            type: true,
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

    // Se houve resposta, atualizar tempo médio de resposta do parceiro
    if (body.status === 'RESPONDED' && body.respondedAt) {
      const responseTime = Math.ceil(
        (new Date(body.respondedAt).getTime() - currentQuotation.requestedAt.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      // Recalcular média de tempo de resposta
      const allQuotations = await prisma.quotation.findMany({
        where: {
          partnerId: currentQuotation.partnerId,
          status: 'RESPONDED',
          respondedAt: { not: null },
        },
        select: {
          requestedAt: true,
          respondedAt: true,
        },
      });

      if (allQuotations.length > 0) {
        const avgResponseTime =
          allQuotations.reduce((acc, q) => {
            const days = Math.ceil(
              (q.respondedAt!.getTime() - q.requestedAt.getTime()) /
                (1000 * 60 * 60 * 24)
            );
            return acc + days;
          }, 0) / allQuotations.length;

        await prisma.partner.update({
          where: { id: currentQuotation.partnerId },
          data: {
            avgResponseTime,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: quotation,
    });
  } catch (error: any) {
    console.error('Erro ao atualizar cotação:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/quotations/[id] - Atualizar item individual
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { itemId, ...itemData } = body;

    if (!itemId) {
      return NextResponse.json(
        { success: false, error: 'itemId é obrigatório' },
        { status: 400 }
      );
    }

    // Atualizar item
    const item = await prisma.quotationItem.update({
      where: { id: itemId },
      data: {
        ...(itemData.quotedBrand !== undefined && { quotedBrand: itemData.quotedBrand }),
        ...(itemData.quotedModel !== undefined && { quotedModel: itemData.quotedModel }),
        ...(itemData.unitCost !== undefined && { unitCost: itemData.unitCost }),
        ...(itemData.totalCost !== undefined && { totalCost: itemData.totalCost }),
        ...(itemData.unitPrice !== undefined && { unitPrice: itemData.unitPrice }),
        ...(itemData.totalPrice !== undefined && { totalPrice: itemData.totalPrice }),
        ...(itemData.availability !== undefined && { availability: itemData.availability }),
        ...(itemData.leadTimeDays !== undefined && { leadTimeDays: itemData.leadTimeDays }),
        ...(itemData.notes !== undefined && { notes: itemData.notes }),
      },
      include: {
        product: true,
      },
    });

    // Recalcular totais da cotação
    const allItems = await prisma.quotationItem.findMany({
      where: { quotationId: params.id },
    });

    const subtotal = allItems.reduce((acc, item) => acc + item.totalPrice, 0);

    await prisma.quotation.update({
      where: { id: params.id },
      data: { subtotal },
    });

    return NextResponse.json({
      success: true,
      data: item,
    });
  } catch (error: any) {
    console.error('Erro ao atualizar item da cotação:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/quotations/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: params.id },
    });

    if (!quotation) {
      return NextResponse.json(
        { success: false, error: 'Cotação não encontrada' },
        { status: 404 }
      );
    }

    // Não permitir exclusão se já foi respondida e vinculada ao orçamento
    if (quotation.status === 'SELECTED') {
      return NextResponse.json(
        {
          success: false,
          error: 'Não é possível excluir cotação selecionada para orçamento',
        },
        { status: 400 }
      );
    }

    await prisma.quotation.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Cotação removida com sucesso',
    });
  } catch (error: any) {
    console.error('Erro ao remover cotação:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
