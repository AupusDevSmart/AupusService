// src/features/programacao-os/config/labels.ts

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

export const origemLabels: Record<string, string> = {
  ANOMALIA: 'Anomalia',
  PLANO_MANUTENCAO: 'Plano',
  TAREFA: 'Tarefa',
  SOLICITACAO_SERVICO: 'Solicitação',
  MANUAL: 'Manual',
};

/** Data e hora numa linha so: sao a mesma informacao, "quando". */
export function formatarDataHora(valor?: string | null): string | null {
  if (!valor) return null;
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}
