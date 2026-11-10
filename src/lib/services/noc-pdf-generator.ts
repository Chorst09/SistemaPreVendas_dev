import jsPDF from 'jspdf';
import { NOCPricingData, NOCCalculations } from '@/lib/types/noc-pricing';
import { defaultCompanyData } from '@/lib/types/company-data';

export interface NOCPDFExportPayload {
  proposalTitle?: string;
  proposalDescription?: string;
  companyName?: string;
  companyCnpj?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
  logoDataUrl?: string | null;
}

interface NOCDRERow {
  label: string;
  monthly: number;
  annual: number;
  emphasized?: boolean;
}

interface NOCDRESummary {
  rows: NOCDRERow[];
  monthlyOperatingMargin: number;
  contractNetMargin: number;
  contractTaxAmount: number;
  contractOperationalCost: number;
  contractRiskProvision: number;
  contractNetRevenue: number;
  contractResult: number;
  contractMonths: number;
}

interface NOCBrandingInfo {
  companyName: string;
  companyCnpj: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite: string;
  logoDataUrl: string | null;
}

export class NOCPDFGenerator {
  private static readonly LOGO_STORAGE_KEY = 'chorst-custom-logo';
  private static readonly CONFIG_STORAGE_KEY = 'it-pricing-configuration';
  private static readonly HEADER_ASSET_PATHS = [
    '/images/proposal/header.png',
    '/proposal/header.png',
  ];
  private static readonly FOOTER_ASSET_PATHS = [
    '/images/proposal/footer.png',
    '/proposal/footer.png',
  ];

  private readonly brandPrimary: [number, number, number] = [10, 44, 92];
  private readonly brandSecondary: [number, number, number] = [25, 96, 170];
  private readonly brandTextLight: [number, number, number] = [236, 244, 252];
  private readonly neutralText: [number, number, number] = [33, 37, 41];
  private readonly divider: [number, number, number] = [214, 222, 231];

  private readonly headerHeight = 18;
  private readonly footerHeight = 14;

  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin = 15;
  private currentY = 20;
  private lineHeight = 6;
  private brandingInfo: NOCBrandingInfo | null = null;
  private reportTitle = 'Proposta NOC';
  private generatedAtLabel = '';
  private summaryPageNumber: number | null = null;
  private sectionIndex: Array<{ title: string; page: number }> = [];
  private coverBackgroundDataUrl: string | null = null;
  private headerAssetDataUrl: string | null = null;
  private footerAssetDataUrl: string | null = null;

  constructor() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  async generate(data: NOCPricingData, payload: NOCPDFExportPayload = {}): Promise<Blob> {
    if (!data.calculations) {
      throw new Error('Os cálculos do NOC não foram gerados.');
    }

    this.resetDocument();
    this.brandingInfo = this.resolveBrandingInfo(payload);
    this.reportTitle = payload.proposalTitle || data.project.projectName || 'Proposta NOC';
    this.generatedAtLabel = new Date().toLocaleString('pt-BR');

    await this.loadVisualAssets();

    const calculations = data.calculations;
    const dreSummary = this.calculateDRE(data, calculations);

    this.addCover(data, payload);
    this.addSummaryPlaceholderPage();

    this.beginSection('Resumo Financeiro');
    this.addFinancialSummary(data, calculations);
    this.addCostComposition(data, calculations);
    this.beginSection('Análise de Mercado');
    this.addMarketAnalysis(data, calculations);
    this.beginSection('DRE Final (Demonstrativo de Resultado)');
    this.addDRETable(data, dreSummary);
    this.addDREHighlights(data, dreSummary);
    this.beginSection('Assinaturas e Aprovação');
    this.addDigitalSignatureSection(data);

    this.renderSummaryPage(data);
    this.renderPageFooters();

    return this.doc.output('blob');
  }

  async downloadPDF(data: NOCPricingData, payload: NOCPDFExportPayload = {}, filename?: string): Promise<void> {
    const blob = await this.generate(data, payload);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || this.getDefaultFilename(data);
    a.click();
    URL.revokeObjectURL(url);
  }

  private addCover(data: NOCPricingData, payload: NOCPDFExportPayload) {
    const title = payload.proposalTitle || data.project.projectName || 'Proposta NOC';
    const subtitle = payload.proposalDescription || 'Network Operations Center - Proposta Comercial e Financeira';
    const clientName = data.project.clientName || 'Cliente não informado';

    if (this.coverBackgroundDataUrl) {
      this.safeAddImage(this.coverBackgroundDataUrl, 0, 0, this.pageWidth, this.pageHeight);
    } else {
      this.doc.setFillColor(...this.brandPrimary);
      this.doc.rect(0, 0, this.pageWidth, this.pageHeight, 'F');
      this.doc.setFillColor(...this.brandSecondary);
      this.doc.rect(0, this.pageHeight * 0.55, this.pageWidth, this.pageHeight * 0.45, 'F');
    }

    this.doc.setFillColor(...this.brandPrimary);
    this.doc.roundedRect(this.margin, 30, this.pageWidth - (this.margin * 2), 50, 3, 3, 'F');

    if (this.brandingInfo?.logoDataUrl) {
      this.drawLogo(this.brandingInfo.logoDataUrl, this.margin + 6, 36, 16, 16);
    }

    this.doc.setTextColor(...this.brandTextLight);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(22);
    this.doc.text(title, this.pageWidth / 2, 50, {
      align: 'center',
      maxWidth: this.pageWidth - (this.margin * 2) - 24,
    });

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10.5);
    const subtitleLines = this.doc.splitTextToSize(subtitle, this.pageWidth - (this.margin * 2) - 12);
    this.doc.text(subtitleLines, this.pageWidth / 2, 61, { align: 'center' });

    this.doc.setTextColor(...this.neutralText);
    this.currentY = 95;
    this.addSubSectionTitle('Dados do Projeto');
    this.addKeyValue('Cliente', clientName);
    this.addKeyValue('Projeto', data.project.projectName || 'Projeto NOC');
    this.addKeyValue('Nível de Serviço', data.project.serviceLevel.toUpperCase());
    this.addKeyValue('Cobertura', data.project.coverage);
    this.addKeyValue('Duração do Contrato', `${Math.max(data.project.contractDuration || 12, 1)} meses`);
    this.addKeyValue('Data de Emissão', this.generatedAtLabel);
    this.currentY += 4;
    this.addSubSectionTitle('Dados da Proponente');
    this.addKeyValue('Empresa', this.brandingInfo?.companyName || defaultCompanyData.name);
    this.addKeyValue('CNPJ', this.brandingInfo?.companyCnpj || defaultCompanyData.cnpj);
    this.addKeyValue('Contato', `${this.brandingInfo?.companyPhone || defaultCompanyData.phone} | ${this.brandingInfo?.companyEmail || defaultCompanyData.email}`);
    this.addKeyValue('Endereço', this.brandingInfo?.companyAddress || `${defaultCompanyData.address} - ${defaultCompanyData.cityState}`);

    const validationCode = `NOC-${Date.now().toString(36).toUpperCase()}`;
    this.currentY += 10;
    this.doc.setFont('helvetica', 'italic');
    this.doc.setFontSize(9);
    this.doc.setTextColor(...this.brandTextLight);
    this.doc.text(`Código de validação: ${validationCode}`, this.pageWidth / 2, this.pageHeight - 20, { align: 'center' });
    this.doc.setTextColor(...this.neutralText);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
  }

  private addSummaryPlaceholderPage() {
    this.addNewPage();
    this.summaryPageNumber = this.doc.internal.getNumberOfPages();
    this.addNewPage();
  }

  private beginSection(title: string) {
    this.sectionIndex.push({
      title,
      page: this.doc.internal.getNumberOfPages(),
    });
    this.addSectionTitle(title);
  }

  private addFinancialSummary(data: NOCPricingData, calculations: NOCCalculations) {
    this.addKeyValue('Custo Mensal Total', this.formatCurrency(data.project.currency, calculations.monthlyTotalCost));
    this.addKeyValue('Preço Final Mensal', this.formatCurrency(data.project.currency, calculations.finalMonthlyPrice));
    this.addKeyValue('Preço Final Anual', this.formatCurrency(data.project.currency, calculations.finalAnnualPrice));
    this.addKeyValue('Rentabilidade', this.formatPercentage(calculations.profitability));
    this.addKeyValue('ROI', this.formatPercentage(calculations.roi));
    this.addKeyValue('Payback', `${this.formatDecimal(calculations.paybackMonths)} meses`);
    this.currentY += 4;
  }

  private addCostComposition(data: NOCPricingData, calculations: NOCCalculations) {
    this.addSubSectionTitle('Composição de Custos Mensais');
    const rows = [
      { label: 'Equipe', value: calculations.monthlyTeamCost },
      { label: 'Infraestrutura', value: calculations.monthlyInfrastructureCost },
      { label: 'Licenças', value: calculations.monthlyLicenseCost },
      { label: 'Operacional', value: calculations.monthlyOperationalCost },
    ];

    rows.forEach((row) => {
      const ratio = calculations.monthlyTotalCost > 0
        ? (row.value / calculations.monthlyTotalCost) * 100
        : 0;
      this.addKeyValue(
        row.label,
        `${this.formatCurrency(data.project.currency, row.value)} (${this.formatDecimal(ratio)}%)`
      );
    });

    this.addKeyValue(
      'Total Mensal',
      this.formatCurrency(data.project.currency, calculations.monthlyTotalCost),
      true
    );
    this.currentY += 4;
  }

  private addDRETable(data: NOCPricingData, dreSummary: NOCDRESummary) {
    const labelX = this.margin;
    const monthlyX = this.pageWidth - 75;
    const annualX = this.pageWidth - this.margin;

    this.checkPageBreak(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(11);
    this.doc.setTextColor(...this.neutralText);
    this.doc.text('Linha', labelX, this.currentY);
    this.doc.text('Mensal', monthlyX, this.currentY, { align: 'right' });
    this.doc.text('Anual', annualX, this.currentY, { align: 'right' });
    this.currentY += this.lineHeight - 1;
    this.drawHorizontalRule();

    dreSummary.rows.forEach((row) => {
      this.checkPageBreak(10);
      this.doc.setFont('helvetica', row.emphasized ? 'bold' : 'normal');
      this.doc.setFontSize(10);

      const labelLines = this.doc.splitTextToSize(row.label, monthlyX - labelX - 4) as string[];
      const rowHeight = Math.max(labelLines.length * this.lineHeight, this.lineHeight) + 1;

      this.doc.text(labelLines, labelX, this.currentY);
      this.doc.setTextColor(...(row.monthly < 0 ? [186, 28, 28] as [number, number, number] : this.neutralText));
      this.doc.text(this.formatSignedCurrency(data.project.currency, row.monthly), monthlyX, this.currentY, { align: 'right' });
      this.doc.setTextColor(...(row.annual < 0 ? [186, 28, 28] as [number, number, number] : this.neutralText));
      this.doc.text(this.formatSignedCurrency(data.project.currency, row.annual), annualX, this.currentY, { align: 'right' });
      this.currentY += rowHeight;
      this.doc.setTextColor(...this.neutralText);
    });

    this.drawHorizontalRule();
    this.currentY += 4;
  }

  private addDREHighlights(data: NOCPricingData, dreSummary: NOCDRESummary) {
    this.addSubSectionTitle('Destaques do DRE');
    this.addKeyValue('Margem Operacional Mensal', this.formatPercentage(dreSummary.monthlyOperatingMargin));
    this.addKeyValue('Margem Líquida do Contrato', this.formatPercentage(dreSummary.contractNetMargin));
    this.addKeyValue(
      `Receita Líquida (${dreSummary.contractMonths} meses)`,
      this.formatCurrency(data.project.currency, dreSummary.contractNetRevenue)
    );
    this.addKeyValue(
      `Impostos Totais (${dreSummary.contractMonths} meses)`,
      this.formatCurrency(data.project.currency, dreSummary.contractTaxAmount)
    );
    this.addKeyValue(
      `Custos Operacionais (${dreSummary.contractMonths} meses)`,
      this.formatCurrency(data.project.currency, dreSummary.contractOperationalCost)
    );
    this.addKeyValue(
      `Provisão de Risco (${dreSummary.contractMonths} meses)`,
      this.formatCurrency(data.project.currency, dreSummary.contractRiskProvision)
    );
    this.addKeyValue(
      `Lucro Projetado (${dreSummary.contractMonths} meses)`,
      this.formatSignedCurrency(data.project.currency, dreSummary.contractResult),
      true
    );
    this.currentY += 4;
  }

  private addMarketAnalysis(data: NOCPricingData, calculations: NOCCalculations) {
    this.addKeyValue(
      'Seu preço por dispositivo',
      this.formatCurrency(data.project.currency, calculations.costPerDevice)
    );
    this.addKeyValue(
      'Média de mercado por dispositivo',
      this.formatCurrency(data.project.currency, calculations.marketAverage)
    );

    const competitivenessLabel = calculations.competitiveness === 'competitive'
      ? 'Competitivo'
      : calculations.competitiveness === 'low'
        ? 'Abaixo do Mercado'
        : 'Acima do Mercado';
    this.addKeyValue('Competitividade', competitivenessLabel, true);
  }

  private addDigitalSignatureSection(data: NOCPricingData) {
    this.checkPageBreak(55);

    const gap = 8;
    const boxWidth = (this.pageWidth - (this.margin * 2) - gap) / 2;
    const boxHeight = 38;
    const leftX = this.margin;
    const rightX = this.margin + boxWidth + gap;

    this.doc.setDrawColor(...this.divider);
    this.doc.roundedRect(leftX, this.currentY, boxWidth, boxHeight, 2, 2, 'S');
    this.doc.roundedRect(rightX, this.currentY, boxWidth, boxHeight, 2, 2, 'S');

    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(10);
    this.doc.text('Representante da Proponente', leftX + 3, this.currentY + 7);
    this.doc.text('Representante do Cliente', rightX + 3, this.currentY + 7);

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    this.doc.text(this.brandingInfo?.companyName || defaultCompanyData.name, leftX + 3, this.currentY + 13);
    this.doc.text(data.project.clientName || 'Cliente', rightX + 3, this.currentY + 13);
    this.doc.text('Assinatura:', leftX + 3, this.currentY + 20);
    this.doc.text('Assinatura:', rightX + 3, this.currentY + 20);
    this.doc.line(leftX + 22, this.currentY + 20, leftX + boxWidth - 3, this.currentY + 20);
    this.doc.line(rightX + 22, this.currentY + 20, rightX + boxWidth - 3, this.currentY + 20);
    this.doc.text('Data:', leftX + 3, this.currentY + 29);
    this.doc.text('Data:', rightX + 3, this.currentY + 29);
    this.doc.line(leftX + 12, this.currentY + 29, leftX + boxWidth - 3, this.currentY + 29);
    this.doc.line(rightX + 12, this.currentY + 29, rightX + boxWidth - 3, this.currentY + 29);

    this.currentY += boxHeight + 8;

    const signatureNotice =
      'Este documento representa a proposta comercial e financeira para prestação de serviços NOC. ' +
      'A assinatura das partes formaliza o aceite das condições técnicas, operacionais e econômicas aqui descritas.';
    this.addParagraph(signatureNotice);
  }

  private calculateDRE(data: NOCPricingData, calculations: NOCCalculations): NOCDRESummary {
    const monthlyTaxAmount = calculations.finalMonthlyPrice - calculations.priceWithMargin;
    const monthlyNetRevenue = calculations.finalMonthlyPrice - monthlyTaxAmount;
    const monthlyContributionMargin = monthlyNetRevenue - calculations.monthlyTotalCost;
    const monthlyRiskProvision = calculations.monthlyTotalCost * ((data.variables.riskMargin || 0) / 100);
    const monthlyOperatingResult = monthlyContributionMargin - monthlyRiskProvision;
    const monthlyOperatingMargin = monthlyNetRevenue > 0
      ? (monthlyOperatingResult / monthlyNetRevenue) * 100
      : 0;
    const contractMonths = Math.max(data.project.contractDuration || 12, 1);
    const contractTaxAmount = monthlyTaxAmount * contractMonths;
    const contractNetRevenue = monthlyNetRevenue * contractMonths;
    const contractOperationalCost = calculations.monthlyTotalCost * contractMonths;
    const contractRiskProvision = monthlyRiskProvision * contractMonths;
    const contractResult = monthlyOperatingResult * contractMonths;
    const contractNetMargin = contractNetRevenue > 0
      ? (contractResult / contractNetRevenue) * 100
      : 0;

    const rows: NOCDRERow[] = [
      {
        label: 'Receita Bruta de Serviços',
        monthly: calculations.finalMonthlyPrice,
        annual: calculations.finalMonthlyPrice * 12,
      },
      {
        label: '(-) Impostos sobre Receita',
        monthly: -monthlyTaxAmount,
        annual: -(monthlyTaxAmount * 12),
      },
      {
        label: 'Receita Líquida',
        monthly: monthlyNetRevenue,
        annual: monthlyNetRevenue * 12,
        emphasized: true,
      },
      {
        label: '(-) Custos Operacionais Totais',
        monthly: -calculations.monthlyTotalCost,
        annual: -(calculations.monthlyTotalCost * 12),
      },
      {
        label: 'Margem de Contribuição',
        monthly: monthlyContributionMargin,
        annual: monthlyContributionMargin * 12,
        emphasized: true,
      },
      {
        label: '(-) Provisão de Risco',
        monthly: -monthlyRiskProvision,
        annual: -(monthlyRiskProvision * 12),
      },
      {
        label: 'Resultado Operacional (Lucro)',
        monthly: monthlyOperatingResult,
        annual: monthlyOperatingResult * 12,
        emphasized: true,
      },
    ];

    return {
      rows,
      monthlyOperatingMargin,
      contractNetMargin,
      contractTaxAmount,
      contractOperationalCost,
      contractRiskProvision,
      contractNetRevenue,
      contractResult,
      contractMonths,
    };
  }

  private renderSummaryPage(data: NOCPricingData) {
    if (!this.summaryPageNumber) return;

    this.doc.setPage(this.summaryPageNumber);
    this.currentY = this.margin + this.headerHeight + 6;

    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(18);
    this.doc.setTextColor(...this.brandPrimary);
    this.doc.text('Sumário Executivo', this.margin, this.currentY);
    this.currentY += 8;

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    this.doc.setTextColor(...this.neutralText);
    this.doc.text(`Projeto: ${data.project.projectName || 'Projeto NOC'}`, this.margin, this.currentY);
    this.currentY += 5;
    this.doc.text(`Cliente: ${data.project.clientName || 'Cliente não informado'}`, this.margin, this.currentY);
    this.currentY += 5;
    this.doc.text(`Emitido em: ${this.generatedAtLabel}`, this.margin, this.currentY);
    this.currentY += 6;
    this.drawHorizontalRule();
    this.currentY += 6;

    this.sectionIndex.forEach((section) => {
      this.checkPageBreak(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(10);
      this.doc.text(section.title, this.margin, this.currentY);
      this.doc.text(`Pág. ${section.page}`, this.pageWidth - this.margin, this.currentY, { align: 'right' });
      this.currentY += this.lineHeight;
      this.doc.setDrawColor(...this.divider);
      this.doc.line(this.margin, this.currentY - 2, this.pageWidth - this.margin, this.currentY - 2);
    });
  }

  private addSectionTitle(title: string) {
    this.checkPageBreak(15);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(15);
    this.doc.setTextColor(...this.brandPrimary);
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += 7;
    this.drawHorizontalRule();
    this.currentY += 5;
    this.doc.setTextColor(...this.neutralText);
  }

  private addSubSectionTitle(title: string) {
    this.checkPageBreak(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(11);
    this.doc.setTextColor(...this.brandSecondary);
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += 6;
    this.doc.setTextColor(...this.neutralText);
  }

  private addKeyValue(label: string, value: string, emphasize = false) {
    this.checkPageBreak(8);
    this.doc.setFont('helvetica', emphasize ? 'bold' : 'normal');
    this.doc.setFontSize(10);
    this.doc.setTextColor(...this.neutralText);
    this.doc.text(label, this.margin, this.currentY);
    this.doc.text(value, this.pageWidth - this.margin, this.currentY, { align: 'right' });
    this.currentY += this.lineHeight;
  }

  private addParagraph(text: string) {
    const lines = this.doc.splitTextToSize(text, this.pageWidth - (this.margin * 2));
    lines.forEach((line: string) => {
      this.checkPageBreak(this.lineHeight + 1);
      this.doc.text(line, this.margin, this.currentY);
      this.currentY += this.lineHeight;
    });
  }

  private drawHorizontalRule() {
    this.doc.setDrawColor(...this.divider);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
  }

  private checkPageBreak(requiredSpace: number) {
    if (this.currentY + requiredSpace > this.pageHeight - this.margin - this.footerHeight) {
      this.addNewPage();
    }
  }

  private addNewPage() {
    this.doc.addPage();
    this.renderPageHeader();
    this.currentY = this.margin + this.headerHeight;
  }

  private renderPageHeader() {
    const companyName = this.brandingInfo?.companyName || defaultCompanyData.name;
    const logoWidth = 10;
    const logoHeight = 10;
    const logoX = this.margin;
    const logoY = 4;
    let textX = this.margin;

    if (this.headerAssetDataUrl) {
      this.safeAddImage(this.headerAssetDataUrl, 0, 0, this.pageWidth, this.headerHeight);
      this.doc.setFillColor(...this.brandPrimary);
      this.doc.roundedRect(this.margin - 2, 2.5, 84, this.headerHeight - 5, 1.5, 1.5, 'F');
      this.doc.roundedRect(this.pageWidth - this.margin - 88, 2.5, 90, this.headerHeight - 5, 1.5, 1.5, 'F');
    } else {
      this.doc.setFillColor(...this.brandPrimary);
      this.doc.rect(0, 0, this.pageWidth, this.headerHeight, 'F');
    }

    if (this.brandingInfo?.logoDataUrl && this.drawLogo(this.brandingInfo.logoDataUrl, logoX, logoY, logoWidth, logoHeight)) {
      textX = logoX + logoWidth + 3;
    }

    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(9.5);
    this.doc.setTextColor(...this.brandTextLight);
    this.doc.text(companyName, textX, 9.5);

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(7.5);
    this.doc.text(this.reportTitle, this.pageWidth - this.margin, 9.5, { align: 'right' });
    this.doc.text('Sistema de Precificação NOC', this.pageWidth - this.margin, 14, { align: 'right' });

    this.doc.setDrawColor(...this.brandSecondary);
    this.doc.setLineWidth(0.6);
    this.doc.line(0, this.headerHeight, this.pageWidth, this.headerHeight);
    this.doc.setTextColor(...this.neutralText);
    this.doc.setLineWidth(0.2);
  }

  private renderPageFooters() {
    const totalPages = this.doc.internal.getNumberOfPages();
    const companyPhone = this.brandingInfo?.companyPhone || defaultCompanyData.phone;
    const companyEmail = this.brandingInfo?.companyEmail || defaultCompanyData.email;
    const companyWebsite = this.brandingInfo?.companyWebsite || 'www.suaempresa.com';
    const footerText = `${companyPhone} | ${companyEmail} | ${companyWebsite}`;

    for (let page = 1; page <= totalPages; page += 1) {
      this.doc.setPage(page);
      const footerTop = this.pageHeight - this.footerHeight;

      if (this.footerAssetDataUrl) {
        this.safeAddImage(this.footerAssetDataUrl, 0, footerTop, this.pageWidth, this.footerHeight);
        this.doc.setFillColor(255, 255, 255);
        this.doc.roundedRect(this.pageWidth / 2 - 70, footerTop + 1.2, 104, 5, 1.2, 1.2, 'F');
        this.doc.roundedRect(this.pageWidth - this.margin - 30, footerTop + 5.8, 30, 4.2, 1.2, 1.2, 'F');
      } else {
        this.doc.setDrawColor(...this.divider);
        this.doc.line(this.margin, footerTop - 1, this.pageWidth - this.margin, footerTop - 1);
      }

      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(8);
      this.doc.setTextColor(90, 100, 112);
      this.doc.text(footerText, this.pageWidth / 2, footerTop + 4, { align: 'center' });
      this.doc.text(`Página ${page} de ${totalPages}`, this.pageWidth - this.margin, footerTop + 8.5, { align: 'right' });
    }

    this.doc.setTextColor(...this.neutralText);
  }

  private safeAddImage(imageDataUrl: string, x: number, y: number, width: number, height: number): boolean {
    try {
      const format = imageDataUrl.startsWith('data:image/jpeg') || imageDataUrl.startsWith('data:image/jpg')
        ? 'JPEG'
        : 'PNG';
      this.doc.addImage(imageDataUrl, format, x, y, width, height);
      return true;
    } catch (error) {
      console.warn('NOCPDFGenerator - Falha ao adicionar imagem no PDF:', error);
      return false;
    }
  }

  private drawLogo(logoDataUrl: string, x: number, y: number, width: number, height: number): boolean {
    return this.safeAddImage(logoDataUrl, x, y, width, height);
  }

  private resolveBrandingInfo(payload: NOCPDFExportPayload): NOCBrandingInfo {
    const fallbackBranding: NOCBrandingInfo = {
      companyName: defaultCompanyData.name,
      companyCnpj: defaultCompanyData.cnpj,
      companyAddress: `${defaultCompanyData.address} - ${defaultCompanyData.cityState}`,
      companyPhone: defaultCompanyData.phone,
      companyEmail: defaultCompanyData.email,
      companyWebsite: 'www.suaempresa.com',
      logoDataUrl: null,
    };

    if (typeof window === 'undefined') {
      return this.mergeBranding(fallbackBranding, payload);
    }

    try {
      const storedLogo = localStorage.getItem(NOCPDFGenerator.LOGO_STORAGE_KEY);
      const configRaw = localStorage.getItem(NOCPDFGenerator.CONFIG_STORAGE_KEY);

      if (!configRaw) {
        return this.mergeBranding({ ...fallbackBranding, logoDataUrl: storedLogo || null }, payload);
      }

      const parsed = JSON.parse(configRaw);
      const companyData = parsed?.state?.companyData;
      if (!companyData) {
        return this.mergeBranding({ ...fallbackBranding, logoDataUrl: storedLogo || null }, payload);
      }

      const mergedFromStore: NOCBrandingInfo = {
        companyName: companyData.name || fallbackBranding.companyName,
        companyCnpj: companyData.cnpj || fallbackBranding.companyCnpj,
        companyAddress: `${companyData.address || fallbackBranding.companyAddress}${companyData.cityState ? ` - ${companyData.cityState}` : ''}`,
        companyPhone: companyData.phone || fallbackBranding.companyPhone,
        companyEmail: companyData.email || fallbackBranding.companyEmail,
        companyWebsite: fallbackBranding.companyWebsite,
        logoDataUrl: storedLogo || null,
      };

      return this.mergeBranding(mergedFromStore, payload);
    } catch (error) {
      console.warn('NOCPDFGenerator - Falha ao carregar branding configurado:', error);
      return this.mergeBranding(fallbackBranding, payload);
    }
  }

  private mergeBranding(base: NOCBrandingInfo, payload: NOCPDFExportPayload): NOCBrandingInfo {
    return {
      companyName: payload.companyName || base.companyName,
      companyCnpj: payload.companyCnpj || base.companyCnpj,
      companyAddress: payload.companyAddress || base.companyAddress,
      companyPhone: payload.companyPhone || base.companyPhone,
      companyEmail: payload.companyEmail || base.companyEmail,
      companyWebsite: payload.companyWebsite || base.companyWebsite,
      logoDataUrl: payload.logoDataUrl ?? base.logoDataUrl,
    };
  }

  private async loadVisualAssets(): Promise<void> {
    if (typeof window === 'undefined') return;

    const [header, footer] = await Promise.all([
      this.loadFirstAvailableImageAsDataUrl(NOCPDFGenerator.HEADER_ASSET_PATHS),
      this.loadFirstAvailableImageAsDataUrl(NOCPDFGenerator.FOOTER_ASSET_PATHS),
    ]);

    this.coverBackgroundDataUrl = header;
    this.headerAssetDataUrl = header;
    this.footerAssetDataUrl = footer;
  }

  private async loadFirstAvailableImageAsDataUrl(paths: string[]): Promise<string | null> {
    for (const path of paths) {
      const image = await this.loadImageAsDataUrl(path);
      if (image) return image;
    }
    return null;
  }

  private async loadImageAsDataUrl(path: string): Promise<string | null> {
    try {
      const response = await fetch(path, { cache: 'force-cache' });
      if (!response.ok) return null;
      const blob = await response.blob();
      return await this.blobToDataUrl(blob);
    } catch (error) {
      console.warn(`NOCPDFGenerator - Falha ao carregar asset de imagem (${path}):`, error);
      return null;
    }
  }

  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
          return;
        }
        reject(new Error('Falha ao converter blob para data URL.'));
      };
      reader.onerror = () => reject(reader.error || new Error('Erro desconhecido ao ler imagem.'));
      reader.readAsDataURL(blob);
    });
  }

  private resetDocument() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.currentY = 20;
    this.summaryPageNumber = null;
    this.sectionIndex = [];
    this.coverBackgroundDataUrl = null;
    this.headerAssetDataUrl = null;
    this.footerAssetDataUrl = null;
    this.generatedAtLabel = '';
  }

  private getDefaultFilename(data: NOCPricingData) {
    const rawProjectName = data.project.projectName || 'projeto-noc';
    const safeProjectName = rawProjectName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'projeto-noc';
    const dateTag = new Date().toISOString().slice(0, 10);
    return `proposta-noc-${safeProjectName}-${dateTag}.pdf`;
  }

  private formatCurrency(currency: string, value: number) {
    return `${currency} ${this.formatAbsoluteCurrency(value)}`;
  }

  private formatSignedCurrency(currency: string, value: number) {
    const abs = this.formatAbsoluteCurrency(Math.abs(value));
    return value < 0 ? `- ${currency} ${abs}` : `${currency} ${abs}`;
  }

  private formatAbsoluteCurrency(value: number) {
    return Number.isFinite(value)
      ? value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : '0,00';
  }

  private formatPercentage(value: number) {
    return `${this.formatDecimal(value)}%`;
  }

  private formatDecimal(value: number) {
    return Number.isFinite(value)
      ? value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
      : '0,0';
  }
}
