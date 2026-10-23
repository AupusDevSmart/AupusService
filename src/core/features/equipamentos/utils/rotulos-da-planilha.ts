/**
 * Os rótulos que a planilha de equipamentos escreve no lugar dos códigos
 * (criticidade, periodicidade da tarefa), num lugar só: a exportação escreve
 * por eles e a leitura dos planos citados (SN-98) volta deles para o código.
 */

export const CRITICIDADES: Record<string, string> = {
  '1': 'Muito Baixa',
  '2': 'Baixa',
  '3': 'Média',
  '4': 'Alta',
  '5': 'Muito Alta',
};

export const PERIODICIDADES: Record<string, string> = {
  DIARIA: 'Diária',
  SEMANAL: 'Semanal',
  QUINZENAL: 'Quinzenal',
  MENSAL: 'Mensal',
  BIMESTRAL: 'Bimestral',
  TRIMESTRAL: 'Trimestral',
  SEMESTRAL: 'Semestral',
  ANUAL: 'Anual',
  PERSONALIZADA: 'Personalizada',
};

/** "Mensal", ou "A cada 45 dias" na personalizada */
export function rotuloDaPeriodicidade(frequencia?: string | null, dias?: number | null): string | null {
  if (!frequencia) return null;
  if (frequencia === 'PERSONALIZADA') return `A cada ${dias ?? '?'} dias`;
  return PERIODICIDADES[frequencia] ?? frequencia;
}
