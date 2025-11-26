// Shared utility functions

export function calculateErlangC(
  calls: number,
  aht: number,
  agents: number
): number {
  const intensity = (calls * aht) / 3600;
  
  if (intensity >= agents) return 1;
  
  let erlang = 1;
  for (let i = 1; i < agents; i++) {
    erlang = (intensity * erlang) / (i + intensity * erlang);
  }
  
  return erlang;
}

export function formatCurrency(value: number, locale = 'pt-BR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(date: Date, locale = 'pt-BR'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}
