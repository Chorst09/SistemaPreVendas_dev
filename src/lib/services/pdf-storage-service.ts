const PDF_STORAGE_KEY = 'service-desk-pdfs-v1';

export function storePDF(quoteId: string, base64Data: string): void {
  if (typeof window === 'undefined') return;
  try {
    const stored = JSON.parse(localStorage.getItem(PDF_STORAGE_KEY) || '{}');
    stored[quoteId] = base64Data;
    localStorage.setItem(PDF_STORAGE_KEY, JSON.stringify(stored));
  } catch (error) {
    console.error('Erro ao armazenar PDF:', error);
  }
}

export function getPDF(quoteId: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = JSON.parse(localStorage.getItem(PDF_STORAGE_KEY) || '{}');
    return stored[quoteId] || null;
  } catch {
    return null;
  }
}

export function removePDF(quoteId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const stored = JSON.parse(localStorage.getItem(PDF_STORAGE_KEY) || '{}');
    delete stored[quoteId];
    localStorage.setItem(PDF_STORAGE_KEY, JSON.stringify(stored));
  } catch (error) {
    console.error('Erro ao remover PDF:', error);
  }
}

export function hasPDF(quoteId: string): boolean {
  return getPDF(quoteId) !== null;
}

export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
