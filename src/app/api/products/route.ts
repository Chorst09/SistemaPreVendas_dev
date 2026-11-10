/**
 * API de Produtos
 * 
 * GET /api/products - Lista todos os produtos
 * POST /api/products - Cria novo produto
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/products - Lista produtos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const manufacturer = searchParams.get('manufacturer');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');
    
    const products = await prisma.product.findMany({
      where: {
        ...(category && { category }),
        ...(manufacturer && { manufacturer }),
        ...(isActive !== null && { isActive: isActive === 'true' }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        costHistory: {
          orderBy: { validFrom: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            quoteItems: true,
            quotationItems: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: products,
      count: products.length,
    });
  } catch (error: any) {
    console.error('Erro ao listar produtos:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/products - Cria novo produto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Verificar se SKU já existe
    const existingProduct = await prisma.product.findUnique({
      where: { sku: body.sku },
    });

    if (existingProduct) {
      return NextResponse.json(
        { success: false, error: 'SKU já cadastrado' },
        { status: 400 }
      );
    }
    
    const product = await prisma.product.create({
      data: {
        sku: body.sku,
        name: body.name,
        description: body.description,
        category: body.category,
        manufacturer: body.manufacturer,
        unitOfMeasure: body.unitOfMeasure || 'UN',
        isActive: body.isActive !== undefined ? body.isActive : true,
        referenceCost: body.referenceCost,
        technicalSheet: body.technicalSheet,
      },
      include: {
        costHistory: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: product,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar produto:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
