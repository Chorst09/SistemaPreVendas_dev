"use client";

import React, { useState } from 'react';
import { VendedorResponsavel } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit, User, Phone, Mail, Building } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const vendedorSchema = z.object({
  fornecedor: z.string().min(1, 'Nome do fornecedor é obrigatório'),
  vendedor: z.string().min(1, 'Nome do vendedor é obrigatório'),
  telefone: z.string().min(1, 'Telefone é obrigatório'),
  email: z.string().email('Email inválido'),
});

interface VendedoresManagerProps {
  vendedores: VendedorResponsavel[];
  onChange: (vendedores: VendedorResponsavel[]) => void;
}

export function VendedoresManager({ vendedores, onChange }: VendedoresManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendedor, setEditingVendedor] = useState<VendedorResponsavel | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');

  const form = useForm<z.infer<typeof vendedorSchema>>({
    resolver: zodResolver(vendedorSchema),
    defaultValues: {
      fornecedor: '',
      vendedor: '',
      telefone: '',
      email: '',
    },
  });

  const handleOpenModal = (vendedor?: VendedorResponsavel) => {
    console.log('Abrindo modal para:', vendedor ? 'editar' : 'adicionar'); // Debug log
    
    if (vendedor) {
      setEditingVendedor(vendedor);
      form.reset({
        fornecedor: vendedor.fornecedor,
        vendedor: vendedor.vendedor,
        telefone: vendedor.telefone,
        email: vendedor.email,
      });
    } else {
      setEditingVendedor(null);
      form.reset({
        fornecedor: '',
        vendedor: '',
        telefone: '',
        email: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    console.log('Fechando modal'); // Debug log
    setIsModalOpen(false);
    setEditingVendedor(null);
    setSuccessMessage('');
    form.reset();
  };

  const onSubmit = (values: z.infer<typeof vendedorSchema>, event?: React.BaseSyntheticEvent) => {
    // Prevenir comportamento padrão do formulário
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    console.log('=== SUBMISSÃO INICIADA ===');
    console.log('Dados do formulário:', values);
    
    if (editingVendedor) {
      // Editando vendedor existente
      const updatedVendedores = vendedores.map(v => 
        v.id === editingVendedor.id 
          ? { ...v, ...values }
          : v
      );
      onChange(updatedVendedores);
      setSuccessMessage('Vendedor atualizado com sucesso!');
      console.log('Vendedor editado com sucesso');
    } else {
      // Adicionando novo vendedor
      const newVendedor: VendedorResponsavel = {
        id: Date.now().toString(),
        name: values.vendedor,
        phone: values.telefone,
        email: values.email,
        fornecedor: values.fornecedor,
        vendedor: values.vendedor,
        telefone: values.telefone,
      };
      
      const novosVendedores = [...vendedores, newVendedor];
      onChange(novosVendedores);
      setSuccessMessage(`Vendedor "${values.vendedor}" adicionado com sucesso!`);
      console.log('Novo vendedor adicionado:', newVendedor);
      console.log('Total de vendedores:', novosVendedores.length);
    }
    
    // Resetar o formulário mas manter o modal aberto
    form.reset({
      fornecedor: '',
      vendedor: '',
      telefone: '',
      email: '',
    });
    
    // Limpar mensagem de sucesso após 3 segundos
    setTimeout(() => setSuccessMessage(''), 3000);
    
    console.log('=== SUBMISSÃO CONCLUÍDA - MODAL PERMANECE ABERTO ===');
    
    // Retornar false para garantir que o modal não feche
    return false;
  };

  const handleRemove = (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este vendedor?')) {
      onChange(vendedores.filter(v => v.id !== id));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-md font-semibold">Vendedores Responsáveis</h4>
        <Dialog 
          open={isModalOpen} 
          onOpenChange={(open) => {
            console.log('Dialog onOpenChange chamado com:', open); // Debug log
            // Só fechar se o usuário realmente quiser fechar (clicou fora ou ESC)
            // Não fechar automaticamente quando o formulário for submetido
            if (!open && !successMessage) {
              handleCloseModal();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => handleOpenModal()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Vendedor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingVendedor ? 'Editar Vendedor' : 'Adicionar Vendedor Responsável'}
              </DialogTitle>
            </DialogHeader>
            {successMessage && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                {successMessage}
              </div>
            )}
            <Form {...form}>
              <form onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit(onSubmit, (errors) => {
                  console.log('Erros de validação:', errors);
                })(e);
              }} className="space-y-4">
                <FormField
                  control={form.control}
                  name="fornecedor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fornecedor</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Fortinet, Microsoft, Dell..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vendedor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Vendedor</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Pedro Almeida" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input placeholder="(11) 99999-9999" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="vendedor@empresa.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleCloseModal}
                  >
                    Fechar
                  </Button>
                  <div className="space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        form.reset({
                          fornecedor: '',
                          vendedor: '',
                          telefone: '',
                          email: '',
                        });
                      }}
                    >
                      Limpar
                    </Button>
                    <Button 
                      type="submit"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('Botão Adicionar clicado - modal deve permanecer aberto');
                      }}
                    >
                      {editingVendedor ? 'Atualizar' : 'Adicionar'}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Vendedores */}
      <div className="space-y-2">
        {vendedores.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum vendedor cadastrado</p>
            <p className="text-sm">Clique em "Adicionar Vendedor" para começar</p>
          </div>
        ) : (
          vendedores.map((vendedor) => (
            <Card key={vendedor.id} className="p-4 border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-2">
                  {/* Fornecedor em destaque */}
                  <div className="flex items-center space-x-3">
                    <Building className="h-5 w-5 text-blue-600" />
                    <span className="text-lg font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                      {vendedor.fornecedor}
                    </span>
                  </div>
                  
                  {/* Nome do vendedor */}
                  <div className="ml-8">
                    <span className="text-base font-semibold text-gray-800">
                      {vendedor.vendedor}
                    </span>
                  </div>
                  
                  {/* Informações de contato */}
                  <div className="flex items-center space-x-6 ml-8 text-sm">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-white">{vendedor.telefone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-purple-600" />
                      <span className="font-medium text-white">{vendedor.email}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenModal(vendedor)}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemove(vendedor.id)}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remover
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}