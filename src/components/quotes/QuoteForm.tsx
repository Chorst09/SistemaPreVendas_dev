"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Quote, Partner } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Paperclip, Plus, Trash2, X } from 'lucide-react';

const QUOTE_MODULES = [
  { value: 'Service Desk', label: 'Service Desk' },
  { value: 'IT Sales/Rental/Services', label: 'Venda/Locação/Serviços' },
  { value: 'Printer Outsourcing', label: 'Outsourcing de Impressão' },
  { value: 'NOC', label: 'NOC' },
] as const;

const QUOTE_MODALITIES = [
  { value: 'Venda', label: 'Venda' },
  { value: 'Locação', label: 'Locação' },
  { value: 'Serviços', label: 'Serviços' },
] as const;

const createEmptyProduct = () => ({
  id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  description: '',
  quantity: 1,
  unitCost: 0,
});

const formSchema = z.object({
  client: z.string().min(1, 'O nome do cliente é obrigatório.'),
  projectName: z.string().min(1, 'O nome do projeto é obrigatório.'),
  accountManager: z.string().optional(),
  module: z.enum(['Service Desk', 'IT Sales/Rental/Services', 'Printer Outsourcing', 'NOC'], {
    required_error: 'Selecione o tipo do orçamento.',
  }),
  modality: z.enum(['Venda', 'Locação', 'Serviços']).optional(),
  total: z.coerce.number().min(0, 'O valor total deve ser positivo.'),
  date: z.string().min(1, 'A data é obrigatória.'),
  status: z.enum(['Pendente', 'Enviado', 'Aprovado', 'Rejeitado', 'Aguardando Distribuidor']),
  distributorId: z.string().min(1, 'Selecione um distribuidor.'),
  quotationFile: z.string().optional(),
  pricingFile: z.string().optional(),
  quotedProducts: z.array(z.object({
    id: z.string(),
    description: z.string().min(1, 'Informe a descrição.'),
    quantity: z.coerce.number().min(1, 'Qtd mínima: 1.'),
    unitCost: z.coerce.number().min(0, 'Custo deve ser positivo.'),
  })).optional(),
});

interface QuoteFormProps {
  quote: Quote | null;
  partners: Partner[];
  onSave: (data: Quote) => void;
  onCancel: () => void;
}

const QuoteForm: React.FC<QuoteFormProps> = ({ quote, partners, onSave, onCancel }) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: quote 
      ? {
        ...quote,
        module: QUOTE_MODULES.some(module => module.value === quote.module) ? quote.module as typeof QUOTE_MODULES[number]['value'] : 'IT Sales/Rental/Services',
        modality: QUOTE_MODALITIES.some(modality => modality.value === quote.modality) ? quote.modality : 'Venda',
        distributorId: String(quote.distributorId),
        quotedProducts: quote.quotedProducts || [],
      }
      : {
        client: '',
        projectName: '',
        accountManager: '',
        module: 'Service Desk',
        modality: 'Venda',
        total: 0,
        date: new Date().toISOString().split('T')[0],
        status: 'Pendente',
        distributorId: '',
        quotationFile: '',
        pricingFile: '',
        quotedProducts: [createEmptyProduct()],
      },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'quotedProducts',
  });
  const watchedProducts = useWatch({
    control: form.control,
    name: 'quotedProducts',
  });
  const selectedModule = useWatch({
    control: form.control,
    name: 'module',
  });
  const [quotationFileName, setQuotationFileName] = useState(quote?.quotationFile || '');
  const [pricingFileName, setPricingFileName] = useState(quote?.pricingFile || '');
  const quotationFileInputRef = useRef<HTMLInputElement>(null);
  const pricingFileInputRef = useRef<HTMLInputElement>(null);

  const distributors = partners.filter(p => p.type === 'Distribuidor');
  const productsTotal = useMemo(() => {
    return (watchedProducts || []).reduce((sum, item) => {
      return sum + Number(item?.quantity || 0) * Number(item?.unitCost || 0);
    }, 0);
  }, [watchedProducts]);

  useEffect(() => {
    if ((watchedProducts || []).length > 0) {
      form.setValue('total', Number(productsTotal.toFixed(2)), { shouldValidate: true });
    }
  }, [form, productsTotal, watchedProducts]);

  useEffect(() => {
    if (!form.getValues('modality')) {
      form.setValue('modality', 'Venda');
    }
  }, [form, selectedModule]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'quotation' | 'pricing') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (fileType === 'quotation') {
        setQuotationFileName(file.name);
        form.setValue('quotationFile', file.name);
      } else {
        setPricingFileName(file.name);
        form.setValue('pricingFile', file.name);
      }
    }
  };

  const handleRemoveFile = (fileType: 'quotation' | 'pricing') => {
    if (fileType === 'quotation') {
      setQuotationFileName('');
      form.setValue('quotationFile', '');
      if (quotationFileInputRef.current) quotationFileInputRef.current.value = "";
    } else {
      setPricingFileName('');
      form.setValue('pricingFile', '');
      if (pricingFileInputRef.current) pricingFileInputRef.current.value = "";
    }
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const quotedProducts = (values.quotedProducts || [])
      .filter(item => item.description.trim())
      .map(item => ({
        id: item.id,
        description: item.description.trim(),
        quantity: Number(item.quantity || 0),
        unitCost: Number(item.unitCost || 0),
      }));

    onSave({ 
      ...values, 
      id: quote ? quote.id : `ORC-${String(Date.now()).slice(-5)}`,
      distributorId: Number(values.distributorId),
      modality: values.modality || 'Venda',
      quotedProducts,
      total: quotedProducts.length > 0
        ? quotedProducts.reduce((sum, item) => sum + item.quantity * item.unitCost, 0)
        : Number(values.total || 0),
    });
  };

  const FileUploadButton = ({ name, fileName, fileInputRef, onChange, onRemove }: any) => (
     <div>
        <input type="file" ref={fileInputRef} onChange={onChange} className="hidden" />
        {!fileName ? (
            <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                <Paperclip className="w-4 h-4 mr-2"/>Anexar {name}
            </Button>
        ) : (
            <div className="flex items-center justify-between p-2 border rounded-lg">
                <span className="text-sm truncate">{fileName}</span>
                <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
                    <X className="w-4 h-4"/>
                </Button>
            </div>
        )}
    </div>
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-4">
        <FormField control={form.control} name="client" render={({ field }) => (
          <FormItem><FormLabel>Nome do Cliente</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="projectName" render={({ field }) => (
          <FormItem><FormLabel>Nome do Projeto</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="accountManager" render={({ field }) => (
          <FormItem><FormLabel>Gerente de Contas</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="module" render={({ field }) => (
          <FormItem>
            <FormLabel>Tipo do Orçamento</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Selecione o tipo do orçamento" /></SelectTrigger></FormControl>
              <SelectContent>
                {QUOTE_MODULES.map(module => (
                  <SelectItem key={module.value} value={module.value}>{module.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="modality" render={({ field }) => (
          <FormItem>
            <FormLabel>Modalidade</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value || 'Venda'}>
              <FormControl><SelectTrigger><SelectValue placeholder="Selecione a modalidade" /></SelectTrigger></FormControl>
              <SelectContent>
                {QUOTE_MODALITIES.map(modality => (
                  <SelectItem key={modality.value} value={modality.value}>{modality.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="total" render={({ field }) => (
            <FormItem>
              <FormLabel>Valor Total (R$)</FormLabel>
              <FormControl><Input type="number" step="0.01" {...field} readOnly={fields.length > 0} /></FormControl>
              {fields.length > 0 && (
                <p className="text-xs text-muted-foreground">Calculado automaticamente pelos produtos orçados.</p>
              )}
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="date" render={({ field }) => (
            <FormItem><FormLabel>Data</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <FormField control={form.control} name="status" render={({ field }) => (
          <FormItem>
            <FormLabel>Status</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Aguardando Distribuidor">Aguardando Distribuidor</SelectItem>
                <SelectItem value="Enviado">Enviado</SelectItem>
                <SelectItem value="Aprovado">Aprovado</SelectItem>
                <SelectItem value="Rejeitado">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        
        <h4 className="text-md font-semibold pt-4 border-t">Cotação e Precificação</h4>
        
        <FormField control={form.control} name="distributorId" render={({ field }) => (
          <FormItem>
            <FormLabel>Distribuidor</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Selecione um distribuidor" /></SelectTrigger></FormControl>
              <SelectContent>
                {distributors.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="font-semibold">Produtos Orçados</h4>
              <p className="text-sm text-muted-foreground">Informe os itens cotados pelo distribuidor.</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => append(createEmptyProduct())}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Produto
            </Button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => {
              const quantity = Number(watchedProducts?.[index]?.quantity || 0);
              const unitCost = Number(watchedProducts?.[index]?.unitCost || 0);
              const subtotal = quantity * unitCost;

              return (
                <div key={field.id} className="space-y-3 rounded-md border bg-muted/20 p-3">
                  <FormField control={form.control} name={`quotedProducts.${index}.description`} render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ex: Notebook, licença, serviço, condição comercial, observações do produto..."
                          className="min-h-[150px] resize-y"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-1 md:grid-cols-[140px_180px_1fr_44px] gap-3 items-start">
                    <FormField control={form.control} name={`quotedProducts.${index}.quantity`} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Qtd</FormLabel>
                        <FormControl><Input type="number" min="1" step="1" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name={`quotedProducts.${index}.unitCost`} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custo Unitário</FormLabel>
                        <FormControl><Input type="number" min="0" step="0.01" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div>
                      <FormLabel>Subtotal</FormLabel>
                      <div className="h-10 rounded-md border bg-background px-3 py-2 text-sm font-semibold">
                        {subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="md:mt-7"
                      onClick={() => fields.length > 1 ? remove(index) : form.setValue(`quotedProducts.${index}`, createEmptyProduct())}
                      aria-label="Remover produto"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end border-t pt-3">
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Total dos produtos</div>
              <div className="text-xl font-bold">
                {productsTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="quotationFile" render={({ field }) => (
              <FormItem>
                <FormLabel>Arquivo da Cotação</FormLabel>
                <FormControl>
                    <FileUploadButton name="Cotação" fileName={quotationFileName} fileInputRef={quotationFileInputRef} onChange={(e:any) => handleFileChange(e, 'quotation')} onRemove={() => handleRemoveFile('quotation')} />
                </FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="pricingFile" render={({ field }) => (
              <FormItem>
                <FormLabel>Arquivo de Precificação</FormLabel>
                <FormControl>
                     <FileUploadButton name="Precificação" fileName={pricingFileName} fileInputRef={pricingFileInputRef} onChange={(e:any) => handleFileChange(e, 'pricing')} onRemove={() => handleRemoveFile('pricing')} />
                </FormControl>
              </FormItem>
            )} />
        </div>
        
        <div className="flex justify-end space-x-4 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </Form>
  );
};

export default QuoteForm;
