/**
 * API de Comparação de Cotações
 * 
 * POST /api/quotations/compare - Compara múltiplas cotações
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ComparisonCriteria {
  weightPrice?: number; // 0-100
  weightDelivery?: number; // 0-100
  weightQuality?: number; // 0-100 (baseado em rating do parceiro)
}

// POST /api/quotations/compare
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { quotationIds, criteria }: { quotationIds: string[]; criteria?: ComparisonCriteria } = body;

    if (!quotationIds || quotationIds.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Forneça ao menos 2 cotações para comparar' },
        { status: 400 }
      );
    }

    // Buscar todas as cotações
    const quotations = await prisma.quotation.findMany({
      where: {
        id: { in: quotationIds },
      },
      include: {
        partner: {
          select: {
            id: true,
            name: true,
            type: true,
            rating: true,
            avgResponseTime: true,
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
    });

    if (quotations.length !== quotationIds.length) {
      return NextResponse.json(
        { success: false, error: 'Uma ou mais cotações não foram encontradas' },
        { status: 404 }
      );
    }

    // Verificar se todas são do mesmo orçamento
    const quoteIds = [...new Set(quotations.map(q => q.quoteId))];
    if (quoteIds.length > 1) {
      return NextResponse.json(
        {
          success: false,
          error: 'As cotações devem ser do mesmo orçamento',
        },
        { status: 400 }
      );
    }

    // Calcular estatísticas de cada cotação
    const quotationsWithStats = quotations.map(quotation => {
      const totalPrice = quotation.items.reduce(
        (acc, item) => acc + item.totalPrice,
        0
      );

      const avgDeliveryTime =
        quotation.items.reduce((acc, item) => acc + (item.leadTimeDays || 0), 0) /
        quotation.items.length;

      const responseTime = quotation.respondedAt
        ? Math.ceil(
            (quotation.respondedAt.getTime() - quotation.requestedAt.getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : null;

      return {
        id: quotation.id,
        quotationNumber: quotation.quotationNumber,
        partner: quotation.partner,
        status: quotation.status,
        totalPrice,
        avgDeliveryTime,
        responseTime,
        validUntil: quotation.validUntil,
        items: quotation.items,
        itemsCount: quotation.items.length,
      };
    });

    // Encontrar melhores valores
    const lowestPrice = Math.min(...quotationsWithStats.map(q => q.totalPrice));
    const fastestDelivery = Math.min(
      ...quotationsWithStats.map(q => q.avgDeliveryTime).filter(d => d > 0)
    );
    const bestRating = Math.max(
      ...quotationsWithStats.map(q => q.partner.rating || 0)
    );

    // Calcular scores (se critérios fornecidos)
    let rankedQuotations = quotationsWithStats;
    
    if (criteria) {
      const {
        weightPrice = 40,
        weightDelivery = 30,
        weightQuality = 30,
      } = criteria;

      rankedQuotations = quotationsWithStats.map(q => {
        // Score de preço (menor é melhor)
        const priceScore = ((lowestPrice / q.totalPrice) * 100) * (weightPrice / 100);

        // Score de entrega (menor é melhor)
        const deliveryScore =
          q.avgDeliveryTime > 0
            ? ((fastestDelivery / q.avgDeliveryTime) * 100) * (weightDelivery / 100)
            : 0;

        // Score de qualidade (maior é melhor)
        const qualityScore =
          bestRating > 0
            ? ((q.partner.rating || 0) / bestRating * 100) * (weightQuality / 100)
            : 0;

        const totalScore = priceScore + deliveryScore + qualityScore;

        return {
          ...q,
          scores: {
            price: parseFloat(priceScore.toFixed(2)),
            delivery: parseFloat(deliveryScore.toFixed(2)),
            quality: parseFloat(qualityScore.toFixed(2)),
            total: parseFloat(totalScore.toFixed(2)),
          },
        };
      });

      // Ordenar por score total
      rankedQuotations.sort((a: any, b: any) => b.scores.total - a.scores.total);
    } else {
      // Ordenar por preço se não houver critérios
      rankedQuotations.sort((a, b) => a.totalPrice - b.totalPrice);
    }

    // Comparação item a item (produtos comuns)
    const itemComparison: any[] = [];
    const firstQuotation = quotations[0];

    firstQuotation.items.forEach(firstItem => {
      const comparison: any = {
        product: firstItem.product,
        quantity: firstItem.quantity,
        quotations: [],
      };

      quotations.forEach(quotation => {
        const matchingItem = quotation.items.find(
          item =>
            item.productId === firstItem.productId ||
            item.description === firstItem.description
        );

        if (matchingItem) {
          comparison.quotations.push({
            quotationId: quotation.id,
            quotationNumber: quotation.quotationNumber,
            partnerName: quotation.partner.name,
            brand: matchingItem.quotedBrand,
            model: matchingItem.quotedModel,
            unitPrice: matchingItem.unitPrice,
            totalPrice: matchingItem.totalPrice,
            leadTimeDays: matchingItem.leadTimeDays,
            availability: matchingItem.availability,
            notes: matchingItem.notes,
          });
        }
      });

      // Identificar melhor preço para este item
      if (comparison.quotations.length > 0) {
        const lowestItemPrice = Math.min(
          ...comparison.quotations.map((q: any) => q.totalPrice)
        );
        comparison.lowestPrice = lowestItemPrice;
        comparison.quotations.forEach((q: any) => {
          q.isBestPrice = q.totalPrice === lowestItemPrice;
        });
      }

      itemComparison.push(comparison);
    });

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalQuotations: quotations.length,
          quoteId: quoteIds[0],
          lowestTotalPrice: lowestPrice,
          fastestDelivery,
          bestRating,
          comparisonDate: new Date().toISOString(),
        },
        rankedQuotations,
        itemComparison,
        recommendation: rankedQuotations[0],
      },
    });
  } catch (error: any) {
    console.error('Erro ao comparar cotações:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
