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
  Award,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Edit,
  Eye,
  FileText,
  Filter,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  XCircle
} from 'lucide-react';
import { PriceRecord } from '@/lib/types';
import PriceRecordForm from './PriceRecordForm';

interface PriceRecordViewProps {
  priceRecords: PriceRecord[];
  onAdd: (priceRecord: Omit<PriceRecord, 'id'>) => void;
  onUpdate: (id: string, priceRecord: Omit<PriceRecord, 'id'>) => void;
  onDelete: (id: string) => void;
}

const statusStyles: Record<string, string> = {
  Ativo: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  Suspenso: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  Vencido: 'border-red-400/30 bg-red-400/10 text-red-300',
  Cancelado: 'border-muted bg-muted text-muted-foreground',
  Renovado: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300'
};

const typeStyles: Record<string, string> = {
  'Ata de Registro de Preços': 'border-purple-400/30 bg-purple-400/10 text-purple-300',
  'Pregão Eletrônico': 'border-orange-400/30 bg-orange-400/10 text-orange-300',
  Concorrência: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300'
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');

const getDaysUntilValidity = (validityDate: string) => {
  const today = new Date();
  const validity = new Date(validityDate);
  return Math.ceil((validity.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const statusIcon = (status: string) => {
  if (status === 'Ativo' || status === 'Renovado') return CheckCircle;
  if (status === 'Suspenso') return AlertTriangle;
  if (status === 'Vencido' || status === 'Cancelado') return XCircle;
  return Clock;
};

const PriceRecordView: React.FC<PriceRecordViewProps> = ({ priceRecords, onAdd, onUpdate, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingPriceRecord, setEditingPriceRecord] = useState<PriceRecord | null>(null);
  const [viewingPriceRecord, setViewingPriceRecord] = useState<PriceRecord | null>(null);

  const filteredPriceRecords = useMemo(() => {
    return priceRecords.filter(record => {
      const normalizedSearch = searchTerm.toLowerCase();
      const matchesSearch =
        record.title.toLowerCase().includes(normalizedSearch) ||
        record.client.toLowerCase().includes(normalizedSearch) ||
        record.description.toLowerCase().includes(normalizedSearch) ||
        record.accountManager.toLowerCase().includes(normalizedSearch);
      const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
      const matchesType = typeFilter === 'all' || record.type === typeFilter;
      const matchesCategory = categoryFilter === 'all' || record.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesType && matchesCategory;
    });
  }, [priceRecords, searchTerm, statusFilter, typeFilter, categoryFilter]);

  const stats = {
    total: priceRecords.length,
    active: priceRecords.filter(r => r.status === 'Ativo').length,
    expiring: priceRecords.filter(r => {
      const days = getDaysUntilValidity(r.validityDate);
      return days >= 0 && days <= 30;
    }).length,
    totalValue: priceRecords.reduce((sum, r) => sum + r.totalValue, 0),
    participants: priceRecords.reduce((sum, r) => sum + r.participants.length, 0)
  };

  const handleCreate = () => {
    setEditingPriceRecord(null);
    setShowForm(true);
  };

  const handleEdit = (priceRecord: PriceRecord) => {
    setEditingPriceRecord(priceRecord);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta ata de registro de preços?')) onDelete(id);
  };

  const handleSubmit = (priceRecordData: Omit<PriceRecord, 'id'>) => {
    if (editingPriceRecord) onUpdate(editingPriceRecord.id, priceRecordData);
    else onAdd(priceRecordData);
    setShowForm(false);
    setEditingPriceRecord(null);
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
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1600&q=80')" }}
        />
        <div className="relative z-10 grid gap-6 p-6 text-white lg:grid-cols-[1fr_360px] lg:p-8">
          <div>
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-100">
              <Award className="h-4 w-4 text-cyan-300" />
              Governança de atas, preços registrados e validade contratual
            </div>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">Atas de Registro de Preços</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-200">
              Controle atas, pregões e concorrências com visibilidade de validade, valor contratado, participantes, itens e riscos de vencimento.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={handleCreate} className="bg-orange-500 text-white hover:bg-orange-600">
                <Plus className="mr-2 h-4 w-4" />
                Nova Ata
              </Button>
              <Button variant="outline" className="border-cyan-300/50 bg-slate-950/30 text-white hover:bg-cyan-300/10 hover:text-white">
                <FileText className="mr-2 h-4 w-4" />
                Relatório de Atas
              </Button>
            </div>
          </div>

          <Card className="border-white/15 bg-slate-950/50 text-white backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-white">
                <ShieldCheck className="h-5 w-5 text-cyan-300" />
                Carteira monitorada
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-slate-300">Ativas</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-300">{stats.active}</p>
                </div>
                <div className="rounded-md border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-slate-300">A vencer</p>
                  <p className="mt-1 text-2xl font-bold text-amber-300">{stats.expiring}</p>
                </div>
              </div>
              <div className="rounded-md border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-slate-300">Valor total registrado</p>
                <p className="mt-1 text-xl font-bold">{formatCurrency(stats.totalValue)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total de Atas', value: stats.total, icon: Award, accent: 'text-cyan-300' },
          { label: 'Ativas', value: stats.active, icon: CheckCircle, accent: 'text-emerald-300' },
          { label: 'Valor Total', value: formatCurrency(stats.totalValue), icon: DollarSign, accent: 'text-orange-300' },
          { label: 'Participantes', value: stats.participants, icon: Users, accent: 'text-purple-300' }
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
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="search" placeholder="Título, cliente, gerente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue placeholder="Todos os status" /></SelectTrigger>
                <SelectContent>
                  {['all', 'Ativo', 'Suspenso', 'Vencido', 'Cancelado', 'Renovado'].map((status) => (
                    <SelectItem key={status} value={status}>{status === 'all' ? 'Todos os status' : status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger><SelectValue placeholder="Todos os tipos" /></SelectTrigger>
                <SelectContent>
                  {['all', 'Ata de Registro de Preços', 'Pregão Eletrônico', 'Concorrência'].map((type) => (
                    <SelectItem key={type} value={type}>{type === 'all' ? 'Todos os tipos' : type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger><SelectValue placeholder="Todas as categorias" /></SelectTrigger>
                <SelectContent>
                  {['all', 'Tecnologia', 'Serviços', 'Educação', 'Saúde', 'Segurança', 'Administrativo', 'Infraestrutura', 'Transporte', 'Outros'].map((category) => (
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
          <CardTitle>Atas Encontradas ({filteredPriceRecords.length})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Gerente</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPriceRecords.map((record) => {
                const days = getDaysUntilValidity(record.validityDate);
                const isExpired = days < 0;
                const isExpiringSoon = days <= 30 && days >= 0;
                return (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div>
                        <div className="font-semibold text-foreground">{record.title}</div>
                        <div className="max-w-xs truncate text-sm text-muted-foreground">{record.description}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground">{record.client}</TableCell>
                    <TableCell><Badge variant="outline" className={typeStyles[record.type] || 'border-border bg-muted text-muted-foreground'}>{record.type}</Badge></TableCell>
                    <TableCell>{badgeForStatus(record.status)}</TableCell>
                    <TableCell>
                      <div className={`text-sm ${isExpired ? 'font-semibold text-red-300' : isExpiringSoon ? 'font-semibold text-amber-300' : 'text-foreground'}`}>
                        {formatDate(record.validityDate)}
                        {isExpired && <div className="text-xs text-red-300">Vencida há {Math.abs(days)} dias</div>}
                        {isExpiringSoon && <div className="text-xs text-amber-300">Vence em {days} dias</div>}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">{formatCurrency(record.totalValue)}</TableCell>
                    <TableCell className="text-muted-foreground">{record.items.length} itens</TableCell>
                    <TableCell className="text-foreground">{record.accountManager}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setViewingPriceRecord(record)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(record)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(record.id)}><Trash2 className="h-4 w-4 text-red-300" /></Button>
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
        <PriceRecordForm
          priceRecord={editingPriceRecord || undefined}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingPriceRecord(null);
          }}
        />
      )}

      {viewingPriceRecord && (
        <Dialog open={true} onOpenChange={() => setViewingPriceRecord(null)}>
          <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-cyan-300" />
                Detalhes da {viewingPriceRecord.type}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {[
                  ['Título', viewingPriceRecord.title],
                  ['Cliente', viewingPriceRecord.client],
                  ['Gerente de Conta', viewingPriceRecord.accountManager],
                  ['Publicação', formatDate(viewingPriceRecord.publishDate)],
                  ['Validade', formatDate(viewingPriceRecord.validityDate)],
                  ['Valor Total', formatCurrency(viewingPriceRecord.totalValue)]
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md border border-border bg-background/50 p-4">
                    <Label className="text-xs text-muted-foreground">{label}</Label>
                    <p className="mt-1 font-semibold text-foreground">{value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-md border border-border bg-background/50 p-4">
                <Label className="text-xs text-muted-foreground">Descrição</Label>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">{viewingPriceRecord.description}</p>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Itens da Ata</Label>
                <div className="mt-2 overflow-x-auto rounded-md border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Unidade</TableHead>
                        <TableHead>Qtd</TableHead>
                        <TableHead>Preço Unit.</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Fornecedor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewingPriceRecord.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell>{formatCurrency(item.totalPrice)}</TableCell>
                          <TableCell>{item.supplier}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {viewingPriceRecord.participants.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Participantes</Label>
                  <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                    {viewingPriceRecord.participants.map((participant) => (
                      <div key={participant} className="rounded-md border border-border bg-background/50 p-3 text-sm text-foreground">
                        <Building2 className="mr-2 inline h-4 w-4 text-cyan-300" />
                        {participant}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default PriceRecordView;
