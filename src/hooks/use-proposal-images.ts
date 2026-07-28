'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ProposalImages {
  header: string | null;      // Base64 ou URL
  footer: string | null;
  coverBackground: string | null;  // Imagem de fundo da capa
  teamPhoto: string | null;        // Foto da equipe (página Quem Somos)
  aboutBackground: string | null;  // Imagem de fundo da página About
  signature: string | null;        // Assinatura/logo da empresa
}

const STORAGE_KEY = 'chorst-proposal-images';

const DEFAULT_IMAGES: ProposalImages = {
  header: null,
  footer: null,
  coverBackground: null,
  teamPhoto: null,
  aboutBackground: null,
  signature: null,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useProposalImages() {
  const [images, setImages] = useState<ProposalImages>(DEFAULT_IMAGES);
  const [isLoaded, setIsLoaded] = useState(false);

  // Carregar do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<ProposalImages>;
        setImages({ ...DEFAULT_IMAGES, ...parsed });
      }
    } catch {
      // ignore
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Persistir no localStorage
  const persist = useCallback((updated: ProposalImages) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignorar erros de quota (imagens muito grandes)
    }
  }, []);

  // Atualizar uma imagem específica
  const updateImage = useCallback((key: keyof ProposalImages, value: string | null) => {
    setImages(prev => {
      const updated = { ...prev, [key]: value };
      persist(updated);
      return updated;
    });
  }, [persist]);

  // Converter File para base64
  const fileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  // Upload de um arquivo e salvar
  const uploadImage = useCallback(async (key: keyof ProposalImages, file: File): Promise<void> => {
    const base64 = await fileToBase64(file);
    updateImage(key, base64);
  }, [fileToBase64, updateImage]);

  // Remover imagem (volta ao default)
  const removeImage = useCallback((key: keyof ProposalImages) => {
    updateImage(key, null);
  }, [updateImage]);

  // Resetar tudo
  const resetAll = useCallback(() => {
    setImages(DEFAULT_IMAGES);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }, []);

  // Helper: retorna a imagem ou o fallback
  const getImage = useCallback((key: keyof ProposalImages, fallback?: string): string | null => {
    return images[key] || fallback || null;
  }, [images]);

  return {
    images,
    isLoaded,
    updateImage,
    uploadImage,
    removeImage,
    resetAll,
    getImage,
  };
}
