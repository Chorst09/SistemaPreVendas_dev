"use client";

import { useRecordLink } from '@/hooks/use-record-link';
import React, { useState, useMemo } from 'react';
import {
  Edit,
  Trash2,
  PlusCircle,
  ShieldCheck,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Building,
} from 'lucide-react';
import type { RO, Partner } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatMoney } from '@/lib/dashboard';
import { cn } from '@/lib/utils';
import RoForm from './RoForm';

interface RoManagementViewProps {
  ros: RO[];
  partners: Partner[];
  onSave: (ro: RO) => void;
  onDelete: (id: number) => void;
}

const RO_STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  'Aprovado': { bg: 'bg-emerald-500/10 border-emerald-500/25', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
  'Em Análise': { bg: 'bg-blue-500/10 border-blue-500/25', text: 'text-blue-600 dark:text-blue-400', dot: 'bg-blue-500' },
  'Pendente': { bg: 'bg-amber-500/10 border-amber-500/25', text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
  'Negado': { bg: 'bg-rose-500/10 border-rose-500/25', text: 'text-rose-600 dark:text-rose-400', dot: 'bg-rose-500' },
  'Expirado': { bg: 'bg-muted border-border', text: 'text-muted-foreground', dot: 'bg-muted-foreground' },
};

const RoManagementView: React.FC<RoManagementViewProps> = ({ ros, partners, onSave, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRo, setEditingRo] = useState<RO | null>(null);
  useRecordLink('ro-management', ros, (ro) => {
    setEditingRo(ro);
    setIsModalOpen(true);
  });
  const suppliers = partners.filter((p) => p.type === 'Fornecedor');

  const stats = useMemo(() => {
    const total = ros.length;
    const totalValue = ros.reduce((sum, r) => sum + (r.value || 0), 0);
    const approved = ros.filter((r) => r.status === 'Aprovado').length;
    const inAnalysis = ros.filter((r) => r.status === 'Em Análise' || r.status === 'Pendente').length;

    const today = new Date();
    const in7Days = new Date();
    in7Days.setDate(in7Days.getDate() + 7);

    const expiringSoon = ros.filter((r) => {
      if (r.status === 'Negado' || r.status === 'Expirado') return false;
      const exp = new Date(r.expiryDate);
      return exp >= today && exp <= in7Days;
    }).length;

    return { total, totalValue, approved, inAnalysis, expiringSoon };
  }, [ros]);

  const handleOpenModal = (ro: RO | null = null) => {
    setEditingRo(ro);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRo(null);
  };

  const handleSave = (roData: RO) => {
    try {
      onSave(roData);
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao salvar RO:', error);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            Proteção de Margens & Canal Oficial
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Registro de Oportunidades (ROs)
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestão de registros junto a fabricantes (Dell, HP, Lenovo, Fortinet) para garantir desconto de canal e exclusividade.
          </p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenModal()} size="lg" className="gap-2 shadow-md hover:shadow-lg">
              <PlusCircle size={20} />
              Novo RO
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingRo ? 'Editar RO' : 'Novo Registro de Oportunidade'}</DialogTitle>
            </DialogHeader>
            <RoForm ro={editingRo} suppliers={suppliers} onSave={handleSave} onCancel={handleCloseModal} />
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Total de ROs</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {stats.total}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Oportunidades mapeadas</p>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Valor Total Protegido</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {formatMoney(stats.totalValue)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Volume financeiro protegido</p>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>ROs Aprovadas</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {stats.approved}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Desconto e exclusividade garantidos</p>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Vencendo em 7 Dias</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
            {stats.expiringSoon}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Requer renovação imediata</p>
        </div>
      </div>

      {/* Main Table */}
      <Card className="border-border/60 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-semibold">Nº do RO</TableHead>
                  <TableHead className="font-semibold">Fabricante</TableHead>
                  <TableHead className="font-semibold">Cliente</TableHead>
                  <TableHead className="font-semibold">Produto / Solução</TableHead>
                  <TableHead className="font-semibold">Valor</TableHead>
                  <TableHead className="font-semibold">Expiração</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="text-right font-semibold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ros.map((ro) => {
                  const supplier = partners.find((p) => p.id === Number(ro.supplierId));
                  const statusStyle = RO_STATUS_STYLES[ro.status] || {
                    bg: 'bg-muted',
                    text: 'text-muted-foreground',
                    dot: 'bg-muted-foreground',
                  };

                  return (
                    <TableRow key={ro.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-mono text-xs font-bold text-primary">
                        {ro.roNumber}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-medium text-xs">
                          {supplier?.name || 'Fabricante'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-foreground text-xs">{ro.clientName}</p>
                          <p className="text-[11px] text-muted-foreground">Resp.: {ro.accountManager || 'Carlos Horst'}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                        {ro.product}
                      </TableCell>
                      <TableCell className="font-bold text-xs text-foreground">
                        {formatMoney(ro.value)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(ro.expiryDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
                            statusStyle.bg,
                            statusStyle.text
                          )}
                        >
                          <span className={cn('h-1.5 w-1.5 rounded-full', statusStyle.dot)} />
                          {ro.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex space-x-1 justify-end">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenModal(ro)} title="Editar">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => onDelete(ro.id)} title="Excluir">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoManagementView;
