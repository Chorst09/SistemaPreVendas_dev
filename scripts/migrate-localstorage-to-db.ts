/**
 * Script de Migração: localStorage → PostgreSQL
 * 
 * Migra todos os dados do localStorage (src/lib/data.ts) para o banco de dados PostgreSQL
 * 
 * CRÍTICO: Este script deve ser executado ANTES de remover o localStorage do código
 * 
 * Execução: npx tsx scripts/migrate-localstorage-to-db.ts
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ============================================
// DADOS DO LOCALSTORAGE (de src/lib/data.ts)
// ============================================

const initialPartners = [
  {
    id: '1',
    name: 'Dell Technologies',
    type: 'MANUFACTURER' as const,
    cnpj: '12.345.678/0001-90',
    email: 'contato@dell.com.br',
    phone: '(11) 3456-7890',
    status: 'ACTIVE' as const,
    credentials: [
      {
        id: 'c1',
        partnerId: '1',
        platform: 'Portal Dell Partner',
        username: 'chorst_partner',
        password: '123', // CRÍTICO: será criptografado
        notes: 'Acesso ao portal de parceiros Dell',
        lastUsed: new Date('2024-02-15'),
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-02-15'),
      },
    ],
    contacts: [
      {
        id: 'cnt1',
        partnerId: '1',
        name: 'João Silva',
        role: 'Gerente de Contas',
        email: 'joao.silva@dell.com.br',
        phone: '(11) 98765-4321',
        isPrimary: true,
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-10'),
      },
    ],
    evaluations: [
      {
        id: 'eval1',
        partnerId: '1',
        date: new Date('2024-02-01'),
        responseTime: 5,
        priceCompetitiveness: 4,
        productQuality: 5,
        technicalSupport: 4,
        overallSatisfaction: 5,
        comments: 'Excelente parceiro, sempre atende no prazo',
        evaluatedBy: 'Carlos Horst',
        createdAt: new Date('2024-02-01'),
      },
    ],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-02-15'),
  },
  {
    id: '2',
    name: 'HP Inc.',
    type: 'MANUFACTURER' as const,
    cnpj: '23.456.789/0001-01',
    email: 'parceiros@hp.com.br',
    phone: '(11) 2345-6789',
    status: 'ACTIVE' as const,
    credentials: [],
    contacts: [
      {
        id: 'cnt2',
        partnerId: '2',
        name: 'Maria Santos',
        role: 'Coordenadora de Vendas',
        email: 'maria.santos@hp.com.br',
        phone: '(11) 97654-3210',
        isPrimary: true,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      },
    ],
    evaluations: [],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '3',
    name: 'Lenovo Brasil',
    type: 'MANUFACTURER' as const,
    cnpj: '34.567.890/0001-12',
    email: 'partners@lenovo.com.br',
    phone: '(11) 3344-5566',
    status: 'ACTIVE' as const,
    credentials: [],
    contacts: [],
    evaluations: [],
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
  },
];

const initialQuotes = [
  {
    id: '1',
    code: 'ORC-2024-001',
    clientName: 'Empresa ABC Ltda',
    clientEmail: 'contato@empresaabc.com.br',
    clientPhone: '(11) 98765-4321',
    status: 'IN_PREPARATION' as const,
    items: [
      {
        id: 'item1',
        quoteId: '1',
        category: 'Notebooks',
        description: 'Notebook Dell Latitude 5430',
        quantity: 10,
        unitPrice: 4500.0,
        discount: 5,
        notes: 'Processador i5, 16GB RAM, SSD 512GB',
        createdAt: new Date('2024-02-01'),
      },
      {
        id: 'item2',
        quoteId: '1',
        category: 'Monitores',
        description: 'Monitor Dell 24" P2422H',
        quantity: 10,
        unitPrice: 950.0,
        discount: 0,
        notes: 'Full HD, altura ajustável',
        createdAt: new Date('2024-02-01'),
      },
    ],
    validUntil: new Date('2024-03-15'),
    deliveryTime: '15 dias úteis',
    paymentTerms: '30 dias',
    notes: 'Cliente solicitou urgência na entrega',
    createdBy: 'Carlos Horst',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-10'),
  },
  {
    id: '2',
    code: 'ORC-2024-002',
    clientName: 'TechCorp Solutions',
    clientEmail: 'compras@techcorp.com',
    clientPhone: '(11) 97654-3210',
    status: 'AWAITING_QUOTATION' as const,
    items: [
      {
        id: 'item3',
        quoteId: '2',
        category: 'Servidores',
        description: 'Servidor Dell PowerEdge R650',
        quantity: 2,
        unitPrice: 35000.0,
        discount: 8,
        notes: 'Xeon Silver, 64GB RAM, 2x 2TB SSD',
        createdAt: new Date('2024-02-05'),
      },
    ],
    validUntil: new Date('2024-03-20'),
    deliveryTime: '30 dias úteis',
    paymentTerms: '45 dias',
    notes: 'Projeto de expansão de datacenter',
    createdBy: 'Carlos Horst',
    createdAt: new Date('2024-02-05'),
    updatedAt: new Date('2024-02-12'),
  },
];

// ============================================
// FUNÇÕES DE MIGRAÇÃO
// ============================================

async function migratePartners() {
  console.log('\n📦 Migrando Parceiros...');
  
  for (const partner of initialPartners) {
    try {
      // Criar parceiro
      const createdPartner = await prisma.partner.create({
        data: {
          name: partner.name,
          type: partner.type,
          document: partner.cnpj,
          email: partner.email,
          phone: partner.phone,
          status: partner.status,
          createdAt: partner.createdAt,
          updatedAt: partner.updatedAt,
        },
      });

      console.log(`  ✓ Parceiro criado: ${createdPartner.name}`);

      // Criar credenciais (com criptografia)
      for (const credential of partner.credentials) {
        const hashedPassword = await bcrypt.hash(credential.password, 10);
        
        await prisma.partnerCredential.create({
          data: {
            partnerId: createdPartner.id,
            systemName: credential.platform,
            url: '',
            username: credential.username,
            passwordHash: hashedPassword, // CRIPTOGRAFADO
            notes: credential.notes,
            createdAt: credential.createdAt,
            updatedAt: credential.updatedAt,
          },
        });

        console.log(`    ✓ Credencial criada: ${credential.platform}`);
      }

      // Criar contatos
      for (const contact of partner.contacts) {
        await prisma.partnerContact.create({
          data: {
            partnerId: createdPartner.id,
            name: contact.name,
            role: contact.role,
            email: contact.email,
            phone: contact.phone,
            isPrimary: contact.isPrimary,
            createdAt: contact.createdAt,
            updatedAt: contact.updatedAt,
          },
        });

        console.log(`    ✓ Contato criado: ${contact.name}`);
      }

      // Criar avaliações
      for (const evaluation of partner.evaluations) {
        await prisma.partnerEvaluation.create({
          data: {
            partnerId: createdPartner.id,
            evaluatedBy: evaluation.evaluatedBy,
            rating: evaluation.overallSatisfaction,
            responseTime: evaluation.responseTime,
            priceCompetitiveness: evaluation.priceCompetitiveness,
            serviceQuality: evaluation.productQuality,
            comments: evaluation.comments,
            evaluatedAt: evaluation.date,
          },
        });

        console.log(`    ✓ Avaliação criada: ${evaluation.date.toLocaleDateString()}`);
      }

    } catch (error) {
      console.error(`  ✗ Erro ao migrar parceiro ${partner.name}:`, error);
    }
  }
}

async function migrateQuotes() {
  console.log('\n💰 Migrando Orçamentos...');
  
  for (const quote of initialQuotes) {
    try {
      // Criar orçamento
      const createdQuote = await prisma.quote.create({
        data: {
          quoteNumber: quote.code,
          clientName: quote.clientName,
          accountManager: quote.createdBy,
          projectName: quote.clientName,
          status: quote.status,
          validUntil: quote.validUntil,
          deliveryDays: parseInt(quote.deliveryTime.match(/\d+/)?.[0] || '15'),
          notes: quote.notes,
          createdAt: quote.createdAt,
          updatedAt: quote.updatedAt,
        },
      });

      console.log(`  ✓ Orçamento criado: ${createdQuote.code}`);

      // Criar itens do orçamento
      for (const item of quote.items) {
        const totalCost = item.quantity * item.unitPrice * (1 - item.discount / 100);
        
        await prisma.quoteItem.create({
          data: {
            quoteId: createdQuote.id,
            description: `${item.category} - ${item.description}`,
            quantity: item.quantity,
            unitCost: item.unitPrice,
            totalCost: totalCost,
            notes: item.notes,
          },
        });

        console.log(`    ✓ Item criado: ${item.description}`);
      }

    } catch (error) {
      console.error(`  ✗ Erro ao migrar orçamento ${quote.code}:`, error);
    }
  }
}

async function createInitialProducts() {
  console.log('\n📦 Criando produtos iniciais...');
  
  const products = [
    {
      sku: 'NB-DELL-LAT5430',
      name: 'Notebook Dell Latitude 5430',
      category: 'Notebooks',
      description: 'Notebook corporativo Dell Latitude 5430 - Intel Core i5, 16GB RAM, SSD 512GB',
      referenceCost: 4500.00,
      isActive: true,
    },
    {
      sku: 'MON-DELL-P2422H',
      name: 'Monitor Dell P2422H 24"',
      category: 'Monitores',
      description: 'Monitor Dell 24" Full HD, altura ajustável, HDMI/DP',
      referenceCost: 950.00,
      isActive: true,
    },
    {
      sku: 'SRV-DELL-R650',
      name: 'Servidor Dell PowerEdge R650',
      category: 'Servidores',
      description: 'Servidor Dell PowerEdge R650 - Xeon Silver, 64GB RAM, 2x 2TB SSD',
      referenceCost: 35000.00,
      isActive: true,
    },
  ];

  for (const product of products) {
    try {
      await prisma.product.create({
        data: product,
      });
      console.log(`  ✓ Produto criado: ${product.name}`);
    } catch (error) {
      console.error(`  ✗ Erro ao criar produto ${product.name}:`, error);
    }
  }
}

// ============================================
// EXECUÇÃO PRINCIPAL
// ============================================

async function main() {
  console.log('🚀 Iniciando migração localStorage → PostgreSQL\n');
  console.log('━'.repeat(60));

  try {
    await migratePartners();
    await migrateQuotes();
    await createInitialProducts();

    console.log('\n' + '━'.repeat(60));
    console.log('✅ Migração concluída com sucesso!\n');

    // Estatísticas
    const partnersCount = await prisma.partner.count();
    const quotesCount = await prisma.quote.count();
    const productsCount = await prisma.product.count();
    const credentialsCount = await prisma.partnerCredential.count();

    console.log('📊 Estatísticas:');
    console.log(`  • Parceiros: ${partnersCount}`);
    console.log(`  • Orçamentos: ${quotesCount}`);
    console.log(`  • Produtos: ${productsCount}`);
    console.log(`  • Credenciais: ${credentialsCount}`);
    console.log('\n⚠️  PRÓXIMO PASSO: Refatorar QuoteContext e remover localStorage\n');

  } catch (error) {
    console.error('\n❌ Erro durante migração:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
