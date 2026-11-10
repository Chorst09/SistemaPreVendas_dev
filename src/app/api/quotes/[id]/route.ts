/**
 * API de Orçamento Individual
 * 
 * GET /api/quotes/[id] - Busca orçamento por ID
 * PUT /api/quotes/[id] - Atualiza orçamento
 * DELETE /api/quotes/[id] - Remove orçamento
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/quotes/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const quote = await prisma.quote.findUnique({
      where: { id: params.id },
      include: {
        partner: true,
        items: {
          include: {
            product: true,
          },
        },
        versions: {
          orderBy: { version: 'desc' },
        },
        approvals: {
          orderBy: { approvedAt: 'desc' },
        },
        activities: {
          orderBy: { occurredAt: 'desc' },
          take: 20,
        },
        quotations: {
          select: {
            id: true,
            quotationNumber: true,
            partner: {
              select: {
                id: true,
                name: true,
              },
            },
            status: true,
            createdAt: true,
          },
        },
        proposals: {
          select: {
            id: true,
            proposalNumber: true,
            status: true,
            createdAt: true,
          },
        },
        registeredOpportunity: {
          select: {
            id: true,
            roNumber: true,
            status: true,
          },
        },
      },
    });

    if (!quote) {
      return NextResponse.json(
        { success: false, error: 'Orçamento não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: quote,
    });
  } catch (error: any) {
    console.error('Erro ao buscar orçamento:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/quotes/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const quote = await prisma.quote.update({
      where: { id: params.id },
      data: {
        ...(body.clientName && { clientName: body.clientName }),
        ...(body.projectName !== undefined && { projectName: body.projectName }),
        ...(body.accountManager && { accountManager: body.accountManager }),
        ...(body.status && { status: body.status }),
        ...(body.validUntil && { validUntil: new Date(body.validUntil) }),
        ...(body.deliveryDays !== undefined && { deliveryDays: body.deliveryDays }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.internalNotes !== undefined && { internalNotes: body.internalNotes }),
        ...(body.partnerId !== undefined && { partnerId: body.partnerId }),
        ...(body.subtotal !== undefined && { subtotal: body.subtotal }),
        ...(body.discount !== undefined && { discount: body.discount }),
        ...(body.discountPercent !== undefined && { discountPercent: body.discountPercent }),
        ...(body.totalCost !== undefined && { totalCost: body.totalCost }),
        ...(body.totalPrice !== undefined && { totalPrice: body.totalPrice }),
        ...(body.margin !== undefined && { margin: body.margin }),
        ...(body.marginPercent !== undefined && { marginPercent: body.marginPercent }),
      },
      include: {
        partner: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Registrar atividade de atualização
    await prisma.quoteActivity.create({
      data: {
        quoteId: params.id,
        activityType: 'STATUS_CHANGE',
        description: `Orçamento atualizado`,
        performedBy: body.updatedBy || 'Sistema',
      },
    });

    return NextResponse.json({
      success: true,
      data: quote,
    });
  } catch (error: any) {
    console.error('Erro ao atualizar orçamento:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/quotes/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const quote = await prisma.quote.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            proposals: true,
          },
        },
      },
    });

    if (!quote) {
      return NextResponse.json(
        { success: false, error: 'Orçamento não encontrado' },
        { status: 404 }
      );
    }

    // Não permitir exclusão se houver propostas geradas
    if (quote._count.proposals > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Não é possível excluir orçamento com propostas geradas',
        },
        { status: 400 }
      );
    }

    // Deletar em cascata (itens, versões, aprovações, atividades)
    await prisma.quote.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Orçamento removido com sucesso',
    });
  } catch (error: any) {
    console.error('Erro ao remover orçamento:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
