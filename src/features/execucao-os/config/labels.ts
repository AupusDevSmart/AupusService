// src/features/execucao-os/config/labels.ts

export const tipoLabels: Record<string, string> = {
  PREVENTIVA: 'Preventiva',
  PREDITIVA: 'Preditiva',
  CORRETIVA: 'Corretiva',
  INSPECAO: 'Inspeção',
  VISITA_TECNICA: 'Visita Técnica',
};

export const prioridadeLabels: Record<string, string> = {
  BAIXA: 'Baixa',
  MEDIA: 'Média',
  ALTA: 'Alta',
  CRITICA: 'Crítica',
};

export function formatarTempo(minutos?: number | null): string {
  if (!minutos) return '-';
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  return horas > 0 ? `${horas}h ${mins}min` : `${mins}min`;
}

export function formatarData(data?: string | Date | null): string {
  if (!data) return '-';
  const d = new Date(data);
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString('pt-BR');
}
