"use client";

import React, { useState } from 'react';
import { AcessoPartner } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit, Globe, Lock, User, Eye, EyeOff } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const acessoSchema = z.object({
  nome: z.string().min(1, 'Nome do site é obrigatório'),
  site: z.string().url('URL inválida').min(1, 'Site é obrigatório'),
  login: z.string().min(1, 'Login é obrigatório'),
  senha: z.string().min(1, 'Senha é obrigatória'),
});

interface AcessosManagerProps {
  acessos: AcessoPartner[];
  onChange: (acessos: AcessoPartner[]) => void;
}

export function AcessosManager({ acessos, onChange }: AcessosManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAcesso, setEditingAcesso] = useState<AcessoPartner | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showPasswords, setShowPasswords] = useState<{[key: string]: boolean}>({});

  const form = useForm<z.infer<typeof acessoSchema>>({
    resolver: zodResolver(acessoSchema),
    defaultValues: {
      nome: '',
      site: '',
      login: '',
      senha: '',
    },
  });

  const handleOpenModal = (acesso?: AcessoPartner) => {
    console.log('Abrindo modal para:', acesso ? 'editar' : 'adicionar');
    
    if (acesso) {
      setEditingAcesso(acesso);
      form.reset({
        nome: acesso.nome,
        site: acesso.site,
        login: acesso.login,
        senha: acesso.senha,
      });
    } else {
      setEditingAcesso(null);
      form.reset({
        nome: '',
        site: '',
        login: '',
        senha: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    console.log('Fechando modal');
    setIsModalOpen(false);
    setEditingAcesso(null);
    setSuccessMessage('');
    form.reset();
  };

  const onSubmit = (values: z.infer<typeof acessoSchema>) => {
    console.log('=== SUBMISSÃO INICIADA ===');
    console.log('Dados do formulário:', values);
    
    if (editingAcesso) {
      // Editando acesso existente
      const updatedAcessos = acessos.map(a => 
        a.id === editingAcesso.id 
          ? { ...a, ...values }
          : a
      );
      onChange(updatedAcessos);
      setSuccessMessage('Acesso atualizado com sucesso!');
      console.log('Acesso editado com sucesso');
    } else {
      // Adicionando novo acesso
      const newAcesso: AcessoPartner = {
        id: Date.now().toString(),
        ...values,
      };
      
      const novosAcessos = [...acessos, newAcesso];
      onChange(novosAcessos);
      setSuccessMessage(`Acesso "${values.nome}" adicionado com sucesso!`);
      console.log('Novo acesso adicionado:', newAcesso);
      console.log('Total de acessos:', novosAcessos.length);
    }
    
    // Resetar o formulário mas manter o modal aberto
    form.reset({
      nome: '',
      site: '',
      login: '',
      senha: '',
    });
    
    // Limpar mensagem de sucesso após 3 segundos
    setTimeout(() => setSuccessMessage(''), 3000);
    
    console.log('=== SUBMISSÃO CONCLUÍDA - MODAL PERMANECE ABERTO ===');
  };

  const handleRemove = (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este acesso?')) {
      onChange(acessos.filter(a => a.id !== id));
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-md font-semibold">Acessos ao Partner</h4>
        <Dialog 
          open={isModalOpen} 
          onOpenChange={(open) => {
            console.log('Dialog onOpenChange chamado com:', open);
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
              Adicionar Acesso
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingAcesso ? 'Editar Acesso' : 'Adicionar Acesso ao Partner'}
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
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Site</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Site Partner, Portal RO, Dashboard..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="site"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL do Site</FormLabel>
                      <FormControl>
                        <Input placeholder="https://partner.fornecedor.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="login"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Login</FormLabel>
                        <FormControl>
                          <Input placeholder="usuario@empresa.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="senha"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <Input type="text" placeholder="Digite a senha" {...field} />
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
                          nome: '',
                          site: '',
                          login: '',
                          senha: '',
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
                      {editingAcesso ? 'Atualizar' : 'Adicionar'}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Acessos */}
      <div className="space-y-2">
        {acessos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Globe className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum acesso cadastrado</p>
            <p className="text-sm">Clique em "Adicionar Acesso" para começar</p>
          </div>
        ) : (
          acessos.map((acesso) => (
            <Card key={acesso.id} className="p-4 border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-2">
                  {/* Nome do site em destaque */}
                  <div className="flex items-center space-x-3">
                    <Globe className="h-5 w-5 text-emerald-600" />
                    <span className="text-lg font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                      {acesso.nome}
                    </span>
                  </div>
                  
                  {/* URL do site */}
                  <div className="ml-8">
                    <a 
                      href={acesso.site}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200 font-medium"
                    >
                      {acesso.site}
                      <svg className="w-3 h-3 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                  
                  {/* Credenciais */}
                  <div className="flex items-center space-x-6 ml-8 text-sm">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-white">{acesso.login}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Lock className="h-4 w-4 text-purple-600" />
                      <span className="font-medium text-white">
                        {showPasswords[acesso.id] ? acesso.senha : '••••••••'}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePasswordVisibility(acesso.id)}
                        className="h-6 w-6 p-0"
                      >
                        {showPasswords[acesso.id] ? 
                          <EyeOff className="h-3 w-3" /> : 
                          <Eye className="h-3 w-3" />
                        }
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenModal(acesso)}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemove(acesso.id)}
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