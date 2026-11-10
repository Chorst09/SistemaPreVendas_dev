/**
 * API de Parceiro Individual
 * 
 * GET /api/partners/[id] - Busca parceiro por ID
 * PUT /api/partners/[id] - Atualiza parceiro
 * DELETE /api/partners/[id] - Remove parceiro
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/partners/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const partner = await prisma.partner.findUnique({
      where: { id: params.id },
      include: {
        contacts: true,
        credentials: {
          select: {
            id: true,
            systemName: true,
            url: true,
            username: true,
            notes: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        evaluations: {
          orderBy: { evaluatedAt: 'desc' },
          take: 10,
        },
        quotes: {
          select: {
            id: true,
            quoteNumber: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        quotations: {
          select: {
            id: true,
            quotationNumber: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        _count: {
          select: {
            quotes: true,
            quotations: true,
            registeredOpportunities: true,
          },
        },
      },
    });

    if (!partner) {
      return NextResponse.json(
        { success: false, error: 'Parceiro não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: partner,
    });
  } catch (error: any) {
    console.error('Erro ao buscar parceiro:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/partners/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const partner = await prisma.partner.update({
      where: { id: params.id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.type && { type: body.type }),
        ...(body.document !== undefined && { document: body.document }),
        ...(body.mainContact !== undefined && { mainContact: body.mainContact }),
        ...(body.email !== undefined && { email: body.email }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.status && { status: body.status }),
        ...(body.website !== undefined && { website: body.website }),
        ...(body.ecommerceUrl !== undefined && { ecommerceUrl: body.ecommerceUrl }),
        ...(body.partnerPortalUrl !== undefined && { partnerPortalUrl: body.partnerPortalUrl }),
        ...(body.roPortalUrl !== undefined && { roPortalUrl: body.roPortalUrl }),
        ...(body.productsOffered !== undefined && { productsOffered: body.productsOffered }),
        ...(body.brands !== undefined && { brands: body.brands }),
        ...(body.roTemplate !== undefined && { roTemplate: body.roTemplate }),
        ...(body.roProcedure !== undefined && { roProcedure: body.roProcedure }),
        ...(body.avgResponseTime !== undefined && { avgResponseTime: body.avgResponseTime }),
        ...(body.rating !== undefined && { rating: body.rating }),
      },
      include: {
        contacts: true,
        credentials: {
          select: {
            id: true,
            systemName: true,
            url: true,
            username: true,
            notes: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        evaluations: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: partner,
    });
  } catch (error: any) {
    console.error('Erro ao atualizar parceiro:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/partners/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar se o parceiro tem relacionamentos ativos
    const partner = await prisma.partner.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            quotes: true,
            quotations: true,
            registeredOpportunities: true,
          },
        },
      },
    });

    if (!partner) {
      return NextResponse.json(
        { success: false, error: 'Parceiro não encontrado' },
        { status: 404 }
      );
    }

    const hasActiveRelations = 
      partner._count.quotes > 0 ||
      partner._count.quotations > 0 ||
      partner._count.registeredOpportunities > 0;

    if (hasActiveRelations) {
      // Apenas inativar ao invés de deletar
      const inactivated = await prisma.partner.update({
        where: { id: params.id },
        data: { status: 'INACTIVE' },
      });

      return NextResponse.json({
        success: true,
        message: 'Parceiro inativado (possui relacionamentos ativos)',
        data: inactivated,
      });
    }

    // Se não houver relacionamentos, pode deletar
    await prisma.partner.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Parceiro removido com sucesso',
    });
  } catch (error: any) {
    console.error('Erro ao remover parceiro:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
