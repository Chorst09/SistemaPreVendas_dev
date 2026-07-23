"use client";

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Edit,
  Eye,
  FileQuestion,
  FileText,
  Filter,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  User,
  XCircle
} from 'lucide-react';
import { RFP } from '@/lib/types';
import RFPForm from './RFPForm';

interface RFPViewProps {
  rfps: RFP[];
  onAdd: (rfp: Omit<RFP, 'id'>) => void;
  onUpdate: (id: string, rfp: Omit<RFP, 'id'>) => void;
  onDelete: (id: string) => void;
}

const statusStyles: Record<string, string> = {
  Aberto: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  'Em Análise': 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300',
  Respondido: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  Fechado: 'border-muted bg-muted text-muted-foreground',
  Vencido: 'border-red-400/30 bg-red-400/10 text-red-300'
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');

const getDaysUntilDeadline = (deadlineDate: string) => {
  const today = new Date();
  const deadline = new Date(deadlineDate);
  return Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const statusIcon = (status: string) => {
  if (status === 'Aberto') return CheckCircle;
  if (status === 'Em Análise') return Clock;
  if (status === 'Respondido') return Send;
  if (status === 'Vencido') return XCircle;
  return FileText;
};

const RFPView: React.FC<RFPViewProps> = ({ rfps, onAdd, onUpdate, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingRFP, setEditingRFP] = useState<RFP | null>(null);
  const [viewingRFP, setViewingRFP] = useState<RFP | null>(null);

  const filteredRFPs = useMemo(() => {
    return rfps.filter(rfp => {
      const normalizedSearch = searchTerm.toLowerCase();
      const matchesSearch =
        rfp.title.toLowerCase().includes(normalizedSearch) ||
        rfp.client.toLowerCase().includes(normalizedSearch) ||
        rfp.description.toLowerCase().includes(normalizedSearch) ||
        rfp.accountManager.toLowerCase().includes(normalizedSearch);
      const matchesStatus = statusFilter === 'all' || rfp.status === statusFilter;
      const matchesType = typeFilter === 'all' || rfp.type === typeFilter;
      const matchesCategory = categoryFilter === 'all' || rfp.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesType && matchesCategory;
    });
  }, [rfps, searchTerm, statusFilter, typeFilter, categoryFilter]);

  const stats = {
    total: rfps.length,
    open: rfps.filter(r => r.status === 'Aberto').length,
    answered: rfps.filter(r => r.status === 'Respondido').length,
    urgent: rfps.filter(r => {
      const days = getDaysUntilDeadline(r.deadlineDate);
      return days >= 0 && days <= 7;
    }).length,
    totalValue: rfps.reduce((sum, r) => sum + (r.value || 0), 0)
  };

  const handleCreate = () => {
    setEditingRFP(null);
    setShowForm(true);
  };

  const handleEdit = (rfp: RFP) => {
    setEditingRFP(rfp);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este RFP/RFI?')) onDelete(id);
  };

  const handleSubmit = (rfpData: Omit<RFP, 'id'>) => {
    if (editingRFP) onUpdate(editingRFP.id, rfpData);
    else onAdd(rfpData);
    setShowForm(false);
    setEditingRFP(null);
  };

  const badgeForStatus = (status: string) => {
    const Icon = statusIcon(status);
    return (
      <Badge variant="outline" className={statusStyles[status] || 'border-border bg-muted text-muted-foreground'}>
        <Icon className="mr-1 h-3 w-3" />
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-7 p-4 sm:p-6">
      <section className="relative overflow-hidden rounded-lg border border-cyan-400/20 bg-card shadow-xl">
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(6,14,30,0.96)_0%,rgba(11,24,48,0.86)_50%,rgba(255,115,45,0.16)_100%)]" />
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1600&q=80')" }}
        />
        <div className="relative z-10 grid gap-6 p-6 text-white lg:grid-cols-[1fr_360px] lg:p-8">
          <div>
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-100">
              <FileQuestion className="h-4 w-4 text-cyan-300" />
              Gestão de demandas formais, perguntas técnicas e respostas comerciais
            </div>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">RFP/RFI</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-200">
              Controle solicitações, prazos, requisitos, responsáveis e status de resposta para transformar demandas formais em propostas consistentes.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={handleCreate} className="bg-orange-500 text-white hover:bg-orange-600">
                <Plus className="mr-2 h-4 w-4" />
                Novo RFP/RFI
              </Button>
              <Button variant="outline" className="border-cyan-300/50 bg-slate-950/30 text-white hover:bg-cyan-300/10 hover:text-white">
                <FileText className="mr-2 h-4 w-4" />
                Central de Respostas
              </Button>
            </div>
          </div>

          <Card className="border-white/15 bg-slate-950/50 text-white backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-white">
                <ShieldCheck className="h-5 w-5 text-cyan-300" />
                Prioridade da fila
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-slate-300">Em aberto</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-300">{stats.open}</p>
                </div>
                <div className="rounded-md border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-slate-300">Urgentes</p>
                  <p className="mt-1 text-2xl font-bold text-amber-300">{stats.urgent}</p>
                </div>
              </div>
              <div className="rounded-md border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-slate-300">Valor estimado</p>
                <p className="mt-1 text-xl font-bold">{formatCurrency(stats.totalValue)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total RFP/RFI', value: stats.total, icon: FileQuestion, accent: 'text-cyan-300' },
          { label: 'Em Aberto', value: stats.open, icon: Calendar, accent: 'text-emerald-300' },
          { label: 'Respondidos', value: stats.answered, icon: Send, accent: 'text-amber-300' },
          { label: 'Valor Total', value: formatCurrency(stats.totalValue), icon: DollarSign, accent: 'text-orange-300' }
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="border-border bg-card shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                    <p className="mt-2 text-2xl font-bold text-foreground">{item.value}</p>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-md bg-background ${item.accent}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-cyan-300" />
            Filtros e Pesquisa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Título, cliente, gerente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['all', 'Aberto', 'Em Análise', 'Respondido', 'Fechado', 'Vencido'].map((status) => (
                    <SelectItem key={status} value={status}>{status === 'all' ? 'Todos os status' : status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['all', 'RFP', 'RFI'].map((type) => (
                    <SelectItem key={type} value={type}>{type === 'all' ? 'Todos os tipos' : type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['all', 'Saúde', 'Governo', 'Educação', 'Financeiro', 'Transporte', 'Varejo', 'Indústria', 'Serviços', 'Tecnologia', 'Outros'].map((category) => (
                    <SelectItem key={category} value={category}>{category === 'all' ? 'Todas as categorias' : category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle>Solicitações Encontradas ({filteredRFPs.length})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Gerente</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRFPs.map((rfp) => {
                const days = getDaysUntilDeadline(rfp.deadlineDate);
                const isOverdue = days < 0;
                const isUrgent = days <= 7 && days >= 0;
                return (
                  <TableRow key={rfp.id}>
                    <TableCell>
                      <div>
                        <div className="font-semibold text-foreground">{rfp.title}</div>
                        <div className="max-w-xs truncate text-sm text-muted-foreground">{rfp.description}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground">{rfp.client}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={rfp.type === 'RFP' ? 'border-purple-400/30 bg-purple-400/10 text-purple-300' : 'border-orange-400/30 bg-orange-400/10 text-orange-300'}>
                        {rfp.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{badgeForStatus(rfp.status)}</TableCell>
                    <TableCell className="text-muted-foreground">{rfp.category}</TableCell>
                    <TableCell>
                      <div className={`text-sm ${isOverdue ? 'font-semibold text-red-300' : isUrgent ? 'font-semibold text-amber-300' : 'text-foreground'}`}>
                        {formatDate(rfp.deadlineDate)}
                        {isOverdue && <div className="text-xs text-red-300">Vencido há {Math.abs(days)} dias</div>}
                        {isUrgent && <div className="text-xs text-amber-300">Vence em {days} dias</div>}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">{rfp.value ? formatCurrency(rfp.value) : '-'}</TableCell>
                    <TableCell className="text-foreground">{rfp.accountManager}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setViewingRFP(rfp)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(rfp)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(rfp.id)}><Trash2 className="h-4 w-4 text-red-300" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {showForm && (
        <RFPForm
          rfp={editingRFP || undefined}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingRFP(null);
          }}
        />
      )}

      {viewingRFP && (
        <Dialog open={true} onOpenChange={() => setViewingRFP(null)}>
          <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileQuestion className="h-5 w-5 text-cyan-300" />
                Detalhes do {viewingRFP.type}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[
                  ['Título', viewingRFP.title],
                  ['Cliente', viewingRFP.client],
                  ['Publicação', formatDate(viewingRFP.publishDate)],
                  ['Data Limite', formatDate(viewingRFP.deadlineDate)],
                  ['Gerente de Conta', viewingRFP.accountManager],
                  ['Valor Estimado', viewingRFP.value ? formatCurrency(viewingRFP.value) : '-']
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md border border-border bg-background/50 p-4">
                    <Label className="text-xs text-muted-foreground">{label}</Label>
                    <p className="mt-1 font-semibold text-foreground">{value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-md border border-border bg-background/50 p-4">
                <Label className="text-xs text-muted-foreground">Descrição</Label>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">{viewingRFP.description}</p>
              </div>
              <div className="rounded-md border border-border bg-background/50 p-4">
                <Label className="text-xs text-muted-foreground">Requisitos</Label>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">{viewingRFP.requirements}</p>
              </div>
              {viewingRFP.notes && (
                <div className="rounded-md border border-border bg-background/50 p-4">
                  <Label className="text-xs text-muted-foreground">Observações</Label>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">{viewingRFP.notes}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default RFPView;
