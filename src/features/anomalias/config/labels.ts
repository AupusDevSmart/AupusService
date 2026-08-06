// src/features/anomalias/config/labels.ts

export function formatarData(data?: string | Date | null): string | null {
  if (!data) return null;
  const d = new Date(data);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString('pt-BR');
}
