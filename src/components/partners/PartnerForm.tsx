"use client";

import React, { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Partner, VendedorResponsavel, AcessoPartner } from '@/lib/types/base';
import { GeneralStatus } from '@/lib/types/enums';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Paperclip, X } from 'lucide-react';
import { VendedoresManager } from './VendedoresManager';
import { AcessosManager } from './AcessosManager';

const formSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório.'),
  // Adicionado o campo mainContact aqui
  mainContact: z.string().optional().transform(val => val || ''),
  contact: z.string().email('Email de contato inválido.'),
  phone: z.string().optional().transform(val => val || ''),
  status: z.enum(['Ativo', 'Inativo']),
  site: z.string().url().optional().or(z.literal('')).transform(val => val || ''),
  siteEcommerce: z.string().url().optional().or(z.literal('')).transform(val => val || ''),
  login: z.string().optional().transform(val => val || ''),
  password: z.string().optional().transform(val => val || ''),
  loginEcommerce: z.string().optional().transform(val => val || ''),
  passwordEcommerce: z.string().optional().transform(val => val || ''),
  products: z.string().optional().transform(val => val || ''),
  sitePartner: z.string().url().optional().or(z.literal('')).transform(val => val || ''),
  siteRO: z.string().url().optional().or(z.literal('')).transform(val => val || ''),
  templateRO: z.string().optional().transform(val => val || ''),
  procedimentoRO: z.string().optional().transform(val => val || ''),
});

interface PartnerFormProps {
  partner: Partner | null;
  onSave: (data: Partner) => void;
  onCancel: () => void;
  partnerType: string;
}

const PartnerForm: React.FC<PartnerFormProps> = ({ partner, onSave, onCancel, partnerType }) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: partner || {
      name: '',
      // Adicionado mainContact nos defaultValues
      mainContact: '',
      contact: '',
      phone: '',
      status: 'Ativo',
      site: '',
      siteEcommerce: '',
      login: '',
      password: '',
      loginEcommerce: '',
      passwordEcommerce: '',
      products: '',
      sitePartner: '',
      siteRO: '',
      templateRO: '',
      procedimentoRO: '',
    },
  });

  const [fileName, setFileName] = useState(partner?.templateRO || '');
  const [vendedores, setVendedores] = useState<VendedorResponsavel[]>(partner?.vendedoresResponsaveis || []);
  const [acessos, setAcessos] = useState<AcessoPartner[]>(partner?.acessosPartner || []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      form.setValue('templateRO', file.name);
    }
  };

  const handleRemoveFile = () => {
    setFileName('');
    form.setValue('templateRO', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Limpar campos undefined/null antes de salvar
    const cleanedValues = Object.fromEntries(
      Object.entries(values).map(([key, value]) => [key, value || ''])
    );

    console.log('=== SALVANDO PARCEIRO ===');
    console.log('Vendedores no estado local:', vendedores);
    console.log('Acessos no estado local:', acessos);
    console.log('Quantidade de vendedores:', vendedores.length);
    console.log('Quantidade de acessos:', acessos.length);

    // Certifique-se de que mainContact está incluído nos dados salvos
    const partnerData: Partner = {
      ...cleanedValues,
      id: partner ? partner.id : Date.now(),
      type: partnerType as any,
      phone: cleanedValues.phone || '', // Garantir que phone não seja undefined
      status: values.status === 'Ativo' ? GeneralStatus.ACTIVE : GeneralStatus.INACTIVE,
      vendedoresResponsaveis: vendedores, // Sempre passar o array, mesmo se vazio
      acessosPartner: acessos // Adicionar os acessos
    } as Partner;

    console.log('Dados completos do parceiro antes de salvar:', partnerData);
    console.log('Vendedores no partnerData:', partnerData.vendedoresResponsaveis);
    console.log('Acessos no partnerData:', partnerData.acessosPartner);
    console.log('=== ENVIANDO PARA SALVAR ===');
    onSave(partnerData);
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-full p-6 rounded-lg">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Seção de Informações Básicas */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
              Informações Básicas
            </h3>
            
            <div className="space-y-5">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-800 mb-2 block">Nome do {partnerType}</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg px-4 py-3 text-white bg-gray-800 font-medium transition-all duration-200 hover:border-gray-400 placeholder-gray-300"
                      placeholder={`Digite o nome do ${partnerType.toLowerCase()}`}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormField control={form.control} name="mainContact" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-800 mb-2 block">Contato Principal</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      className="border-2 border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-lg px-4 py-3 text-white bg-gray-800 font-medium transition-all duration-200 hover:border-gray-400 placeholder-gray-300"
                      placeholder="Nome da pessoa responsável"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField control={form.control} name="contact" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-gray-800 mb-2 block">Email de Contato</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        {...field} 
                        className="border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-lg px-4 py-3 text-white bg-gray-800 font-medium transition-all duration-200 hover:border-gray-400 placeholder-gray-300"
                        placeholder="email@exemplo.com"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-gray-800 mb-2 block">Telefone</FormLabel>
                    <FormControl>
                      <Input 
                        type="tel" 
                        {...field} 
                        className="border-2 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 rounded-lg px-4 py-3 text-white bg-gray-800 font-medium transition-all duration-200 hover:border-gray-400 placeholder-gray-300"
                        placeholder="(11) 99999-9999"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-800 mb-2 block">Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="border-2 border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-lg px-4 py-3 text-white bg-gray-800 font-medium transition-all duration-200 hover:border-gray-400">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </div>

          {partnerType === 'Distribuidor' && (
            <>
              {/* Seção de Informações do Portal */}
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  Informações do Portal
                </h3>
                
                <div className="space-y-5">
                  {/* Site de Acesso */}
                  <FormField control={form.control} name="site" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-800 mb-2 block">Site de Acesso</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://portal.distribuidor.com" 
                          {...field} 
                          className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg px-4 py-3 text-white bg-gray-800 font-medium transition-all duration-200 hover:border-gray-400 placeholder-gray-300"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormField control={form.control} name="login" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-gray-800 mb-2 block">Login Portal</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            className="border-2 border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-lg px-4 py-3 text-white bg-gray-800 font-medium transition-all duration-200 hover:border-gray-400 placeholder-gray-300"
                            placeholder="Usuário do portal"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    
                    <FormField control={form.control} name="password" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-gray-800 mb-2 block">Senha Portal</FormLabel>
                        <FormControl>
                          <Input 
                            type="text" 
                            {...field} 
                            className="border-2 border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 rounded-lg px-4 py-3 text-white bg-gray-800 font-medium transition-all duration-200 hover:border-gray-400 placeholder-gray-300"
                            placeholder="Senha do portal"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  {/* Site E-commerce */}
                  <FormField control={form.control} name="siteEcommerce" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-800 mb-2 block">Site E-commerce</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://loja.distribuidor.com" 
                          {...field} 
                          className="border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-lg px-4 py-3 text-white bg-gray-800 font-medium transition-all duration-200 hover:border-gray-400 placeholder-gray-300"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormField control={form.control} name="loginEcommerce" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-gray-800 mb-2 block">Login E-commerce</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            className="border-2 border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-lg px-4 py-3 text-white bg-gray-800 font-medium transition-all duration-200 hover:border-gray-400 placeholder-gray-300"
                            placeholder="Usuário do e-commerce"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    
                    <FormField control={form.control} name="passwordEcommerce" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-gray-800 mb-2 block">Senha E-commerce</FormLabel>
                        <FormControl>
                          <Input 
                            type="text" 
                            {...field} 
                            className="border-2 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 rounded-lg px-4 py-3 text-white bg-gray-800 font-medium transition-all duration-200 hover:border-gray-400 placeholder-gray-300"
                            placeholder="Senha do e-commerce"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  
                  <FormField control={form.control} name="products" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-800 mb-2 block">Produtos Principais</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ex: Microsoft, Dell, Cisco, HP, Lenovo, VMware..."
                          {...field}
                          rows={3}
                          className="border-2 border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 rounded-lg px-4 py-3 text-white bg-gray-800 font-medium transition-all duration-200 hover:border-gray-400 resize-none placeholder-gray-300"
                        />
                      </FormControl>
                      <p className="text-xs text-gray-700 mt-2 bg-gray-100 p-2 rounded-md">
                        💡 Separe os produtos por vírgula. Estes produtos aparecerão na lista de distribuidores.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* Vendedores Responsáveis */}
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
                <VendedoresManager
                  vendedores={vendedores}
                  onChange={setVendedores}
                />
              </div>
            </>
          )}

          {partnerType === 'Fornecedor' && (
            <>
              {/* Seção de Informações Gerais */}
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                  Informações Gerais
                </h3>
                
                <div className="space-y-5">
                  <FormField control={form.control} name="products" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-800 mb-2 block">Produtos/Serviços Oferecidos</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ex: Desenvolvimento de Software, Consultoria em TI, Suporte Técnico, Infraestrutura..."
                          {...field}
                          rows={3}
                          className="border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-lg px-4 py-3 text-white bg-gray-800 font-medium transition-all duration-200 hover:border-gray-400 resize-none placeholder-gray-300"
                        />
                      </FormControl>
                      <p className="text-xs text-gray-700 mt-2 bg-gray-100 p-2 rounded-md">
                        💡 Separe os produtos/serviços por vírgula. Estes aparecerão na lista de fornecedores.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* Acessos ao Partner */}
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-teal-500">
                <AcessosManager
                  acessos={acessos}
                  onChange={setAcessos}
                />
              </div>
              
              {/* Seção de Documentos e Procedimentos */}
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                  <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                  Documentos e Procedimentos
                </h3>
                
                <div className="space-y-5">
                  <FormField control={form.control} name="templateRO" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-800 mb-2 block">Template RO</FormLabel>
                      <FormControl>
                        <div>
                          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                          {!fileName ? (
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => fileInputRef.current?.click()}
                              className="border-2 border-dashed border-gray-300 hover:border-orange-400 hover:bg-orange-50 transition-all duration-200 p-6 w-full"
                            >
                              <Paperclip className="w-5 h-5 mr-2 text-orange-500" />
                              <span className="font-medium text-gray-800">Anexar Arquivo</span>
                            </Button>
                          ) : (
                            <div className="flex items-center justify-between p-4 border-2 border-green-300 bg-green-50 rounded-lg">
                              <span className="text-sm font-medium text-green-800 truncate">{fileName}</span>
                              <Button type="button" variant="ghost" size="icon" onClick={handleRemoveFile} className="hover:bg-red-100">
                                <X className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormField control={form.control} name="procedimentoRO" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-800 mb-2 block">Procedimento para RO</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descreva o passo a passo para criação de RO..." 
                          {...field} 
                          rows={4}
                          className="border-2 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 rounded-lg px-4 py-3 text-white bg-gray-800 font-medium transition-all duration-200 hover:border-gray-400 resize-none placeholder-gray-300"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>
            </>
          )}

          {/* Botões de Ação */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-gray-400">
            <div className="flex justify-end space-x-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                className="px-6 py-3 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-700 font-semibold text-white bg-gray-800 transition-all duration-200"
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                Salvar {partnerType}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default PartnerForm;
