/**
 * API de Parceiros (Partners)
 * 
 * GET /api/partners - Lista todos os parceiros
 * POST /api/partners - Cria novo parceiro
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/partners - Lista parceiros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    
    const partners = await prisma.partner.findMany({
      where: {
        ...(status && { status: status as any }),
        ...(type && { type: type as any }),
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
            // passwordHash excluído por segurança
          },
        },
        evaluations: true,
        _count: {
          select: {
            quotes: true,
            quotations: true,
            registeredOpportunities: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: partners,
      count: partners.length,
    });
  } catch (error: any) {
    console.error('Erro ao listar parceiros:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/partners - Cria novo parceiro
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const partner = await prisma.partner.create({
      data: {
        name: body.name,
        type: body.type,
        document: body.document,
        mainContact: body.mainContact,
        email: body.email,
        phone: body.phone,
        status: body.status || 'ACTIVE',
        website: body.website,
        ecommerceUrl: body.ecommerceUrl,
        partnerPortalUrl: body.partnerPortalUrl,
        roPortalUrl: body.roPortalUrl,
        productsOffered: body.productsOffered,
        brands: body.brands || [],
        roTemplate: body.roTemplate,
        roProcedure: body.roProcedure,
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
    }, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar parceiro:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
