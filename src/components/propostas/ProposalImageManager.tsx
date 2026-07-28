'use client';

import { useRef, useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Upload, Trash2, ImageIcon, CheckCircle, AlertTriangle,
  FileImage, RefreshCw, Info,
} from 'lucide-react';
import { useProposalImages } from '@/hooks/use-proposal-images';
import type { ProposalImages } from '@/hooks/use-proposal-images';

// ─── Configuração das imagens gerenciáveis ─────────────────────────────────────

interface ImageSlot {
  key: keyof ProposalImages;
  label: string;
  description: string;
  hint: string;
  recommendedSize: string;
  accept: string;
  previewClass: string;
  fallbackText: string;
}

const IMAGE_SLOTS: ImageSlot[] = [
  {
    key: 'header',
    label: 'Cabeçalho (Header)',
    description: 'Aparece no topo de todas as páginas da proposta (papel timbrado superior).',
    hint: 'Ideal: logotipo + nome da empresa + faixa colorida',
    recommendedSize: '1200 × 200px — PNG com fundo transparente ou branco',
    accept: 'image/png,image/jpeg,image/jpg,image/webp',
    previewClass: 'h-20 object-contain object-center',
    fallbackText: 'CABEÇALHO DA PROPOSTA',
  },
  {
    key: 'footer',
    label: 'Rodapé (Footer)',
    description: 'Aparece na parte inferior de todas as páginas (papel timbrado inferior).',
    hint: 'Ideal: dados de contato, CNPJ, redes sociais, faixa da marca',
    recommendedSize: '1200 × 400px — PNG com fundo transparente ou branco',
    accept: 'image/png,image/jpeg,image/jpg,image/webp',
    previewClass: 'h-28 object-contain object-bottom',
    fallbackText: 'RODAPÉ DA PROPOSTA',
  },
  {
    key: 'coverBackground',
    label: 'Imagem de Fundo — Capa',
    description: 'Imagem de fundo da capa da proposta. Substitui a imagem automática baseada no serviço.',
    hint: 'Ideal: foto de datacenter, escritório ou tecnologia',
    recommendedSize: '1200 × 900px — JPG/PNG de alta resolução',
    accept: 'image/png,image/jpeg,image/jpg,image/webp',
    previewClass: 'h-32 object-cover object-center',
    fallbackText: 'IMAGEM DA CAPA',
  },
  {
    key: 'teamPhoto',
    label: 'Foto da Equipe — Quem Somos',
    description: 'Foto da equipe ou da empresa exibida na página "Quem Somos".',
    hint: 'Ideal: foto da equipe técnica ou instalações da empresa',
    recommendedSize: '800 × 500px — JPG/PNG',
    accept: 'image/png,image/jpeg,image/jpg,image/webp',
    previewClass: 'h-32 object-cover object-center',
    fallbackText: 'FOTO DA EQUIPE',
  },
  {
    key: 'aboutBackground',
    label: 'Fundo da Página — Quem Somos',
    description: 'Imagem de fundo decorativa para a seção "Quem Somos".',
    hint: 'Ideal: imagem abstrata ou tecnológica de baixo contraste',
    recommendedSize: '1200 × 800px — PNG/JPG com tons escuros',
    accept: 'image/png,image/jpeg,image/jpg,image/webp',
    previewClass: 'h-24 object-cover object-center',
    fallbackText: 'FUNDO QUEM SOMOS',
  },
  {
    key: 'signature',
    label: 'Assinatura / Logo da Proposta',
    description: 'Logo ou assinatura da empresa para uso no rodapé ou capa da proposta.',
    hint: 'Ideal: logo em alta resolução com fundo transparente (PNG)',
    recommendedSize: '400 × 200px — PNG com fundo transparente',
    accept: 'image/png,image/jpeg,image/jpg,image/webp,image/svg+xml',
    previewClass: 'h-20 object-contain object-center',
    fallbackText: 'ASSINATURA',
  },
];

// ─── Slot individual ──────────────────────────────────────────────────────────

function ImageSlotCard({
  slot,
  currentImage,
  onUpload,
  onRemove,
}: {
  slot: ImageSlot;
  currentImage: string | null;
  onUpload: (key: keyof ProposalImages, file: File) => Promise<void>;
  onRemove: (key: keyof ProposalImages) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    // Verificar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Arquivo muito grande. O tamanho máximo é 5MB.');
      return;
    }
    setUploading(true);
    try {
      await onUpload(slot.key, file);
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Cabeçalho do slot */}
      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-semibold text-foreground text-sm">{slot.label}</p>
            {currentImage ? (
              <Badge variant="outline" className="text-[10px] border-emerald-400/30 text-emerald-400 gap-1">
                <CheckCircle className="h-2.5 w-2.5" /> Personalizada
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] text-muted-foreground">Padrão</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-5">{slot.description}</p>
        </div>
      </div>

      {/* Preview */}
      <div
        className={`relative mx-4 mb-3 rounded-lg overflow-hidden border-2 border-dashed transition-colors ${
          dragOver ? 'border-primary bg-primary/5' : 'border-border bg-muted/20'
        }`}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {currentImage ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentImage}
              alt={slot.label}
              className={`w-full ${slot.previewClass}`}
            />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
              <p className="text-white text-xs font-medium bg-black/60 px-3 py-1 rounded-full">Arraste para substituir</p>
            </div>
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center py-8 cursor-pointer"
            onClick={() => inputRef.current?.click()}
          >
            <FileImage className="h-10 w-10 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">{slot.fallbackText}</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Clique ou arraste para enviar</p>
          </div>
        )}
      </div>

      {/* Info e recomendações */}
      <div className="mx-4 mb-3 flex items-start gap-2 rounded-lg bg-muted/30 px-3 py-2">
        <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
        <div>
          <p className="text-[11px] text-muted-foreground">{slot.hint}</p>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">{slot.recommendedSize}</p>
        </div>
      </div>

      {/* Ações */}
      <div className="flex gap-2 px-4 pb-4">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 gap-1.5"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
          {currentImage ? 'Substituir' : 'Enviar Imagem'}
        </Button>
        {currentImage && (
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(slot.key)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={slot.accept}
        className="sr-only"
        onChange={handleInputChange}
      />
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface ProposalImageManagerProps {
  onClose: () => void;
}

export function ProposalImageManager({ onClose }: ProposalImageManagerProps) {
  const { images, uploadImage, removeImage, resetAll } = useProposalImages();
  const [confirmReset, setConfirmReset] = useState(false);

  const customCount = Object.values(images).filter(Boolean).length;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ImageIcon className="h-5 w-5 text-primary" />
            Gerenciar Imagens da Proposta
          </DialogTitle>
          <DialogDescription>
            Configure o papel timbrado (cabeçalho e rodapé), imagens de capa, equipe e assinatura.
            As imagens são salvas localmente e aplicadas em todas as propostas.
          </DialogDescription>
        </DialogHeader>

        {/* Status geral */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3">
          <div className="flex items-center gap-2">
            {customCount > 0 ? (
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            )}
            <span className="text-sm text-foreground">
              {customCount > 0
                ? `${customCount} imagem${customCount > 1 ? 's' : ''} personalizada${customCount > 1 ? 's' : ''}`
                : 'Nenhuma imagem personalizada — usando imagens padrão'}
            </span>
          </div>
          {customCount > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground hover:text-destructive text-xs"
              onClick={() => setConfirmReset(true)}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Restaurar Padrão
            </Button>
          )}
        </div>

        {/* Confirmação de reset */}
        {confirmReset && (
          <div className="flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
            <p className="text-sm text-destructive">Remover todas as imagens personalizadas?</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setConfirmReset(false)}>Cancelar</Button>
              <Button size="sm" variant="destructive" onClick={() => { resetAll(); setConfirmReset(false); }}>Confirmar</Button>
            </div>
          </div>
        )}

        {/* Grid de slots */}
        <div className="grid gap-4 sm:grid-cols-2">
          {IMAGE_SLOTS.map(slot => (
            <ImageSlotCard
              key={slot.key}
              slot={slot}
              currentImage={images[slot.key]}
              onUpload={uploadImage}
              onRemove={removeImage}
            />
          ))}
        </div>

        {/* Nota */}
        <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/10 px-4 py-3 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <p>As imagens são armazenadas localmente no seu navegador (localStorage). Para uso em múltiplos dispositivos, faça o upload em cada um. Tamanho máximo por imagem: 5MB.</p>
        </div>

        <div className="flex justify-end pt-1">
          <Button onClick={onClose}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
