import jsPDF from 'jspdf';
import {
  Project,
  ProjectDeliverable,
  ProjectMilestone,
  ProjectPhase,
  ProjectPriority,
  ProjectRisk,
  ProjectStatus,
} from '@/lib/types/project';

const COLORS = {
  ink: [24, 34, 52],
  muted: [91, 104, 124],
  lightText: [255, 255, 255],
  line: [215, 222, 235],
  panel: [246, 248, 252],
  primary: [12, 140, 233],
  accent: [255, 115, 48],
  success: [22, 163, 74],
  warning: [202, 138, 4],
  danger: [220, 38, 38],
} as const;

type RGB = readonly [number, number, number];

export class ProjectPDFService {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin = 16;
  private y = 16;

  constructor() {
    this.doc = new jsPDF({ unit: 'mm', format: 'a4' });
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  createProjectPDFUrl(project: Project): string {
    this.generate(project);

    const blob = this.doc.output('blob');
    return URL.createObjectURL(blob);
  }

  downloadProjectPDF(project: Project): void {
    const url = this.createProjectPDFUrl(project);
    const link = document.createElement('a');
    link.href = url;
    link.download = this.buildFileName(project);
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
  }

  openProjectPDF(project: Project): void {
    const url = this.createProjectPDFUrl(project);
    window.open(url, '_blank', 'noopener,noreferrer');
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  private generate(project: Project): void {
    this.addCoverHeader(project);
    this.addExecutiveSummary(project);
    this.addScope(project);
    this.addTimeline(project);
    this.addBudget(project);
    this.addTeam(project);
    this.addRisks(project);
    this.addDeliverables(project);
    this.addNotes(project);
    this.addFooterToAllPages(project);
  }

  private addCoverHeader(project: Project): void {
    this.doc.setFillColor(...COLORS.ink);
    this.doc.rect(0, 0, this.pageWidth, 48, 'F');
    this.doc.setFillColor(...COLORS.primary);
    this.doc.rect(0, 0, 5, 48, 'F');

    this.text('RELATORIO DE PROJETO', this.margin, 15, {
      size: 10,
      color: COLORS.lightText,
      bold: true,
    });

    const title = this.truncate(project.name || 'Projeto sem nome', 72);
    this.text(title, this.margin, 28, {
      size: 20,
      color: COLORS.lightText,
      bold: true,
    });

    this.text(project.description || 'Sem descricao informada.', this.margin, 39, {
      size: 9,
      color: [219, 226, 239],
      maxWidth: this.pageWidth - this.margin * 2,
    });

    this.y = 58;
  }

  private addExecutiveSummary(project: Project): void {
    this.sectionTitle('Resumo Executivo');

    const statusColor = this.getStatusColor(project.status);
    const healthColor = this.getHealthColor(project.progress.healthStatus);
    const budgetUsed = project.budget.totalBudget > 0
      ? (project.budget.spentBudget / project.budget.totalBudget) * 100
      : 0;

    this.metricGrid([
      { label: 'Status', value: this.statusLabel(project.status), color: statusColor },
      { label: 'Saude', value: this.healthLabel(project.progress.healthStatus), color: healthColor },
      { label: 'Progresso', value: `${project.progress.overallProgress || 0}%`, color: COLORS.primary },
      { label: 'Orcamento', value: this.currency(project.budget.totalBudget, project.budget.currency), color: COLORS.accent },
      { label: 'Gasto', value: `${budgetUsed.toFixed(0)}%`, color: COLORS.warning },
      { label: 'Equipe', value: `${project.team.length} membro${project.team.length === 1 ? '' : 's'}`, color: COLORS.primary },
    ]);

    this.twoColumnFacts([
      ['Cliente', project.clientId || 'Nao informado'],
      ['Gerente', project.projectManager || 'Nao atribuido'],
      ['Tipo', project.type],
      ['Prioridade', this.priorityLabel(project.priority)],
      ['Inicio', this.date(project.startDate)],
      ['Fim previsto', this.date(project.endDate)],
      ['Criado em', this.date(project.createdAt)],
      ['Atualizado em', this.date(project.updatedAt)],
    ]);

    this.progressBar('Progresso geral', project.progress.overallProgress || 0, COLORS.primary);
    this.progressBar('Consumo do orcamento', budgetUsed, COLORS.accent);
  }

  private addScope(project: Project): void {
    this.sectionTitle('Escopo do Projeto');
    this.listBlock('Objetivos', project.scope.objectives);
    this.listBlock('Entregas principais', project.scope.deliverables);
    this.listBlock('Fora do escopo', project.scope.outOfScope);
    this.listBlock('Premissas', project.scope.assumptions);
    this.listBlock('Restricoes', project.scope.constraints);
  }

  private addTimeline(project: Project): void {
    this.sectionTitle('Cronograma');

    if (!project.timeline.phases.length) {
      this.emptyText('Nenhuma fase cadastrada.');
      return;
    }

    project.timeline.phases.forEach((phase, index) => this.phaseBlock(phase, index + 1));

    if (project.timeline.milestones.length) {
      this.sectionTitle('Marcos');
      project.timeline.milestones.forEach((milestone) => this.milestoneBlock(milestone));
    }
  }

  private addBudget(project: Project): void {
    this.sectionTitle('Orcamento');
    this.twoColumnFacts([
      ['Orcamento total', this.currency(project.budget.totalBudget, project.budget.currency)],
      ['Valor gasto', this.currency(project.budget.spentBudget, project.budget.currency)],
      ['Valor restante', this.currency(project.budget.remainingBudget, project.budget.currency)],
      ['CPI', `${project.budget.costPerformanceIndex || 0}`],
      ['Variacao de custo', this.currency(project.budget.costVariance || 0, project.budget.currency)],
    ]);

    if (!project.budget.breakdown.length) {
      this.emptyText('Nenhum item de custo cadastrado.');
      return;
    }

    this.table(
      ['Categoria', 'Planejado', 'Realizado', 'Variacao'],
      project.budget.breakdown.map((item) => [
        `${item.category}${item.description ? ` - ${item.description}` : ''}`,
        this.currency(item.plannedCost, project.budget.currency),
        this.currency(item.actualCost, project.budget.currency),
        this.currency(item.variance, project.budget.currency),
      ]),
      [78, 32, 32, 32],
    );
  }

  private addTeam(project: Project): void {
    this.sectionTitle('Equipe');

    if (!project.team.length) {
      this.emptyText('Nenhum membro cadastrado.');
      return;
    }

    this.table(
      ['Nome', 'Funcao', 'Alocacao', 'Periodo'],
      project.team.map((member) => [
        member.name,
        member.role,
        `${member.allocation}%`,
        `${this.date(member.startDate)} - ${this.date(member.endDate)}`,
      ]),
      [45, 55, 25, 49],
    );
  }

  private addRisks(project: Project): void {
    this.sectionTitle('Riscos');

    if (!project.risks.length) {
      this.emptyText('Nenhum risco identificado.');
      return;
    }

    [...project.risks]
      .sort((a, b) => b.riskScore - a.riskScore)
      .forEach((risk) => this.riskBlock(risk));
  }

  private addDeliverables(project: Project): void {
    this.sectionTitle('Entregas');

    if (!project.deliverables.length) {
      this.emptyText('Nenhuma entrega cadastrada.');
      return;
    }

    project.deliverables.forEach((deliverable) => this.deliverableBlock(deliverable));
  }

  private addNotes(project: Project): void {
    if (!project.notes && !project.tags.length) return;

    this.sectionTitle('Notas e Tags');

    if (project.notes) {
      this.paragraph(project.notes);
    }

    if (project.tags.length) {
      this.text(`Tags: ${project.tags.join(', ')}`, this.margin, this.y, {
        size: 9,
        color: COLORS.muted,
        maxWidth: this.contentWidth(),
      });
      this.y += 8;
    }
  }

  private phaseBlock(phase: ProjectPhase, index: number): void {
    const taskTotal = phase.tasks.length;
    const done = phase.tasks.filter((task) => task.status === 'done').length;
    const progress = taskTotal > 0 ? (done / taskTotal) * 100 : this.phaseStatusProgress(phase.status);
    const height = phase.tasks.length ? 33 + Math.min(phase.tasks.length, 4) * 5 : 31;

    this.ensureSpace(height);
    this.panel(height);

    this.text(`${index}. ${phase.name}`, this.margin + 4, this.y + 7, {
      size: 11,
      bold: true,
      color: COLORS.ink,
    });
    this.badge(this.phaseStatusLabel(phase.status), this.pageWidth - this.margin - 36, this.y + 2, this.getPhaseColor(phase.status));
    this.text(`${this.date(phase.startDate)} ate ${this.date(phase.endDate)}`, this.margin + 4, this.y + 14, {
      size: 8,
      color: COLORS.muted,
    });
    this.text(phase.description || 'Sem descricao.', this.margin + 4, this.y + 20, {
      size: 8,
      color: COLORS.ink,
      maxWidth: this.contentWidth() - 8,
    });
    this.progressBarAt(this.margin + 4, this.y + 25, this.contentWidth() - 8, progress, COLORS.primary);

    let taskY = this.y + 34;
    phase.tasks.slice(0, 4).forEach((task) => {
      this.text(`- ${task.name} (${this.taskStatusLabel(task.status)})`, this.margin + 6, taskY, {
        size: 7,
        color: COLORS.muted,
        maxWidth: this.contentWidth() - 12,
      });
      taskY += 5;
    });

    if (phase.tasks.length > 4) {
      this.text(`+ ${phase.tasks.length - 4} tarefas adicionais`, this.margin + 6, taskY, {
        size: 7,
        color: COLORS.muted,
      });
    }

    this.y += height + 5;
  }

  private milestoneBlock(milestone: ProjectMilestone): void {
    this.ensureSpace(21);
    this.panel(18);
    this.text(milestone.name, this.margin + 4, this.y + 7, { size: 10, bold: true, color: COLORS.ink });
    this.text(`${this.date(milestone.dueDate)} - ${this.milestoneStatusLabel(milestone.status)}`, this.margin + 4, this.y + 13, {
      size: 8,
      color: COLORS.muted,
    });
    this.y += 23;
  }

  private riskBlock(risk: ProjectRisk): void {
    const height = risk.mitigationPlan ? 34 : 26;
    this.ensureSpace(height);
    this.panel(height);
    this.text(risk.title, this.margin + 4, this.y + 7, { size: 10, bold: true, color: COLORS.ink });
    this.badge(`Score ${risk.riskScore}`, this.pageWidth - this.margin - 30, this.y + 2, this.riskColor(risk.riskScore));
    this.text(`${this.riskProbabilityLabel(risk.probability)} probabilidade / ${this.riskImpactLabel(risk.impact)} impacto`, this.margin + 4, this.y + 13, {
      size: 8,
      color: COLORS.muted,
    });
    this.text(risk.description || 'Sem descricao.', this.margin + 4, this.y + 19, {
      size: 8,
      color: COLORS.ink,
      maxWidth: this.contentWidth() - 8,
    });

    if (risk.mitigationPlan) {
      this.text(`Mitigacao: ${risk.mitigationPlan}`, this.margin + 4, this.y + 27, {
        size: 8,
        color: COLORS.muted,
        maxWidth: this.contentWidth() - 8,
      });
    }

    this.y += height + 5;
  }

  private deliverableBlock(deliverable: ProjectDeliverable): void {
    const criteria = deliverable.acceptanceCriteria?.length
      ? `Criterios: ${deliverable.acceptanceCriteria.join('; ')}`
      : 'Sem criterios de aceite cadastrados.';
    const height = 33;

    this.ensureSpace(height);
    this.panel(height);
    this.text(deliverable.name, this.margin + 4, this.y + 7, { size: 10, bold: true, color: COLORS.ink });
    this.badge(this.deliverableStatusLabel(deliverable.status), this.pageWidth - this.margin - 37, this.y + 2, COLORS.primary);
    this.text(`${deliverable.type} - Prazo: ${this.date(deliverable.dueDate)} - Resp.: ${deliverable.assignedTo || 'Nao atribuido'}`, this.margin + 4, this.y + 13, {
      size: 8,
      color: COLORS.muted,
      maxWidth: this.contentWidth() - 8,
    });
    this.text(deliverable.description || 'Sem descricao.', this.margin + 4, this.y + 20, {
      size: 8,
      color: COLORS.ink,
      maxWidth: this.contentWidth() - 8,
    });
    this.text(criteria, this.margin + 4, this.y + 27, {
      size: 7,
      color: COLORS.muted,
      maxWidth: this.contentWidth() - 8,
    });
    this.y += height + 5;
  }

  private sectionTitle(title: string): void {
    this.ensureSpace(18);
    this.doc.setDrawColor(...COLORS.primary);
    this.doc.setLineWidth(0.8);
    this.doc.line(this.margin, this.y, this.margin + 10, this.y);
    this.text(title, this.margin, this.y + 8, { size: 14, bold: true, color: COLORS.ink });
    this.y += 14;
  }

  private metricGrid(metrics: Array<{ label: string; value: string; color: RGB }>): void {
    const gap = 4;
    const width = (this.contentWidth() - gap * 2) / 3;
    const height = 22;

    metrics.forEach((metric, index) => {
      if (index > 0 && index % 3 === 0) this.y += height + gap;
      const x = this.margin + (index % 3) * (width + gap);
      this.doc.setFillColor(...COLORS.panel);
      this.doc.roundedRect(x, this.y, width, height, 2, 2, 'F');
      this.doc.setFillColor(...metric.color);
      this.doc.rect(x, this.y, 2, height, 'F');
      this.text(metric.label, x + 5, this.y + 7, { size: 7, color: COLORS.muted, bold: true });
      this.text(metric.value, x + 5, this.y + 16, { size: 11, color: COLORS.ink, bold: true });
    });

    this.y += height + 8;
  }

  private twoColumnFacts(facts: Array<[string, string]>): void {
    const colWidth = this.contentWidth() / 2;

    facts.forEach(([label, value], index) => {
      if (index % 2 === 0) this.ensureSpace(8);
      const x = this.margin + (index % 2) * colWidth;
      const rowY = this.y + Math.floor(index / 2) * 8;
      this.text(label, x, rowY, { size: 7, color: COLORS.muted, bold: true });
      this.text(value, x + 26, rowY, { size: 8, color: COLORS.ink, maxWidth: colWidth - 29 });
    });

    this.y += Math.ceil(facts.length / 2) * 8 + 6;
  }

  private listBlock(title: string, items?: string[]): void {
    if (!items?.length) return;

    this.ensureSpace(16);
    this.text(title, this.margin, this.y, { size: 10, bold: true, color: COLORS.ink });
    this.y += 6;

    items.forEach((item) => {
      const lines = this.doc.splitTextToSize(`- ${item}`, this.contentWidth() - 2) as string[];
      this.ensureSpace(lines.length * 4 + 2);
      this.text(lines.join('\n'), this.margin + 2, this.y, { size: 8, color: COLORS.muted });
      this.y += lines.length * 4 + 2;
    });

    this.y += 2;
  }

  private paragraph(text: string): void {
    const lines = this.doc.splitTextToSize(text, this.contentWidth()) as string[];
    this.ensureSpace(lines.length * 5 + 4);
    this.text(lines.join('\n'), this.margin, this.y, { size: 9, color: COLORS.ink });
    this.y += lines.length * 5 + 6;
  }

  private table(headers: string[], rows: string[][], widths: number[]): void {
    const rowHeight = 9;
    this.ensureSpace(rowHeight * 2);

    let x = this.margin;
    this.doc.setFillColor(...COLORS.ink);
    this.doc.rect(this.margin, this.y, this.contentWidth(), rowHeight, 'F');
    headers.forEach((header, index) => {
      this.text(header, x + 2, this.y + 6, { size: 7, color: COLORS.lightText, bold: true });
      x += widths[index];
    });
    this.y += rowHeight;

    rows.forEach((row, rowIndex) => {
      this.ensureSpace(rowHeight);
      x = this.margin;
      this.doc.setFillColor(...(rowIndex % 2 === 0 ? COLORS.panel : [255, 255, 255] as RGB));
      this.doc.rect(this.margin, this.y, this.contentWidth(), rowHeight, 'F');
      row.forEach((cell, index) => {
        this.text(this.truncate(cell, index === 0 ? 46 : 22), x + 2, this.y + 6, {
          size: 7,
          color: COLORS.ink,
        });
        x += widths[index];
      });
      this.y += rowHeight;
    });

    this.y += 6;
  }

  private progressBar(label: string, value: number, color: RGB): void {
    this.ensureSpace(13);
    this.text(`${label}: ${Math.min(Math.max(value, 0), 100).toFixed(0)}%`, this.margin, this.y, {
      size: 8,
      color: COLORS.muted,
      bold: true,
    });
    this.progressBarAt(this.margin, this.y + 3, this.contentWidth(), value, color);
    this.y += 12;
  }

  private progressBarAt(x: number, y: number, width: number, value: number, color: RGB): void {
    const safeValue = Math.min(Math.max(value || 0, 0), 100);
    this.doc.setFillColor(226, 232, 240);
    this.doc.roundedRect(x, y, width, 3, 1.5, 1.5, 'F');
    this.doc.setFillColor(...color);
    this.doc.roundedRect(x, y, (width * safeValue) / 100, 3, 1.5, 1.5, 'F');
  }

  private panel(height: number): void {
    this.doc.setFillColor(...COLORS.panel);
    this.doc.setDrawColor(...COLORS.line);
    this.doc.roundedRect(this.margin, this.y, this.contentWidth(), height, 2, 2, 'FD');
  }

  private badge(label: string, x: number, y: number, color: RGB): void {
    this.doc.setFillColor(...color);
    this.doc.roundedRect(x, y, 32, 7, 3, 3, 'F');
    this.text(label, x + 16, y + 4.8, { size: 6.5, color: COLORS.lightText, bold: true, align: 'center' });
  }

  private emptyText(text: string): void {
    this.ensureSpace(8);
    this.text(text, this.margin, this.y, { size: 9, color: COLORS.muted });
    this.y += 8;
  }

  private ensureSpace(height: number): void {
    if (this.y + height <= this.pageHeight - 18) return;
    this.doc.addPage();
    this.y = 18;
  }

  private addFooterToAllPages(project: Project): void {
    const totalPages = this.doc.internal.pages.length - 1;

    for (let page = 1; page <= totalPages; page += 1) {
      this.doc.setPage(page);
      this.doc.setDrawColor(...COLORS.line);
      this.doc.line(this.margin, this.pageHeight - 12, this.pageWidth - this.margin, this.pageHeight - 12);
      this.text(project.name || 'Projeto', this.margin, this.pageHeight - 7, {
        size: 7,
        color: COLORS.muted,
      });
      this.text(`Pagina ${page} de ${totalPages}`, this.pageWidth - this.margin, this.pageHeight - 7, {
        size: 7,
        color: COLORS.muted,
        align: 'right',
      });
    }
  }

  private text(
    value: string,
    x: number,
    y: number,
    options: {
      size?: number;
      color?: RGB;
      bold?: boolean;
      align?: 'left' | 'center' | 'right';
      maxWidth?: number;
    } = {},
  ): void {
    this.doc.setFont('helvetica', options.bold ? 'bold' : 'normal');
    this.doc.setFontSize(options.size || 9);
    this.doc.setTextColor(...(options.color || COLORS.ink));
    this.doc.text(value || '-', x, y, {
      align: options.align || 'left',
      maxWidth: options.maxWidth,
    });
  }

  private contentWidth(): number {
    return this.pageWidth - this.margin * 2;
  }

  private currency(value = 0, currency = 'BRL'): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value || 0);
  }

  private date(value?: string): string {
    if (!value) return 'Nao informado';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Nao informado';
    return date.toLocaleDateString('pt-BR');
  }

  private truncate(value: string, maxLength: number): string {
    return value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;
  }

  private buildFileName(project: Project): string {
    const name = (project.name || 'projeto')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .toLowerCase();

    return `projeto-${name || project.id}.pdf`;
  }

  private statusLabel(status: ProjectStatus): string {
    const labels: Record<ProjectStatus, string> = {
      [ProjectStatus.PLANNING]: 'Planejamento',
      [ProjectStatus.IN_PROGRESS]: 'Em andamento',
      [ProjectStatus.ON_HOLD]: 'Pausado',
      [ProjectStatus.COMPLETED]: 'Concluido',
      [ProjectStatus.CANCELLED]: 'Cancelado',
    };
    return labels[status] || status;
  }

  private priorityLabel(priority: ProjectPriority): string {
    const labels: Record<ProjectPriority, string> = {
      [ProjectPriority.LOW]: 'Baixa',
      [ProjectPriority.MEDIUM]: 'Media',
      [ProjectPriority.HIGH]: 'Alta',
      [ProjectPriority.CRITICAL]: 'Critica',
    };
    return labels[priority] || priority;
  }

  private healthLabel(health: string): string {
    if (health === 'green') return 'Saudavel';
    if (health === 'yellow') return 'Atencao';
    if (health === 'red') return 'Critico';
    return health || 'Nao informado';
  }

  private getStatusColor(status: ProjectStatus): RGB {
    if (status === ProjectStatus.COMPLETED) return COLORS.success;
    if (status === ProjectStatus.CANCELLED) return COLORS.danger;
    if (status === ProjectStatus.ON_HOLD) return COLORS.warning;
    if (status === ProjectStatus.IN_PROGRESS) return COLORS.primary;
    return COLORS.muted;
  }

  private getHealthColor(health: string): RGB {
    if (health === 'green') return COLORS.success;
    if (health === 'yellow') return COLORS.warning;
    if (health === 'red') return COLORS.danger;
    return COLORS.muted;
  }

  private getPhaseColor(status: ProjectPhase['status']): RGB {
    if (status === 'completed') return COLORS.success;
    if (status === 'in-progress') return COLORS.primary;
    if (status === 'delayed') return COLORS.danger;
    return COLORS.warning;
  }

  private phaseStatusLabel(status: ProjectPhase['status']): string {
    if (status === 'completed') return 'Concluida';
    if (status === 'in-progress') return 'Em andamento';
    if (status === 'delayed') return 'Atrasada';
    return 'Pendente';
  }

  private phaseStatusProgress(status: ProjectPhase['status']): number {
    if (status === 'completed') return 100;
    if (status === 'in-progress') return 50;
    return 0;
  }

  private taskStatusLabel(status: string): string {
    if (status === 'done') return 'concluida';
    if (status === 'in-progress') return 'em andamento';
    if (status === 'review') return 'em revisao';
    return 'a fazer';
  }

  private milestoneStatusLabel(status: string): string {
    if (status === 'achieved') return 'alcancado';
    if (status === 'missed') return 'perdido';
    return 'pendente';
  }

  private riskProbabilityLabel(probability: string): string {
    if (probability === 'high') return 'Alta';
    if (probability === 'medium') return 'Media';
    return 'Baixa';
  }

  private riskImpactLabel(impact: string): string {
    if (impact === 'high') return 'Alto';
    if (impact === 'medium') return 'Medio';
    return 'Baixo';
  }

  private riskColor(score: number): RGB {
    if (score >= 8) return COLORS.danger;
    if (score >= 5) return COLORS.warning;
    return COLORS.success;
  }

  private deliverableStatusLabel(status: string): string {
    if (status === 'in-progress') return 'Em andamento';
    if (status === 'review') return 'Em revisao';
    if (status === 'approved') return 'Aprovada';
    if (status === 'delivered') return 'Entregue';
    return 'Pendente';
  }
}
