// src/types/os-common.ts

// Enums compartilhados entre programação-os e execução-os

export type StatusProgramacaoOS =
  | 'RASCUNHO'
  | 'PENDENTE'
  | 'EM_ANALISE'
  | 'APROVADA'
  | 'REJEITADA'
  | 'CANCELADA';

export type StatusOS =
  | 'PLANEJADA'
  | 'PROGRAMADA'
  | 'EM_EXECUCAO'
  | 'PAUSADA'
  | 'FINALIZADA'
  | 'CANCELADA';

export type TipoOS =
  | 'PREVENTIVA'
  | 'CORRETIVA'
  | 'PREDITIVA'
  | 'EMERGENCIAL'
  | 'CALIBRACAO'
  | 'INSTALACAO'
  | 'REMOCAO'
  | 'OUTROS';

export type PrioridadeOS =
  | 'CRITICA'
  | 'ALTA'
  | 'MEDIA'
  | 'BAIXA';

export type OrigemOS =
  | 'ANOMALIA'
  | 'TAREFA'
  | 'PLANO_MANUTENCAO'
  | 'MANUAL';

export type CondicaoOS =
  | 'NORMAL'
  | 'EMERGENCIA'
  | 'PARADA_PROGRAMADA'
  | 'PRODUCAO_REDUZIDA';

export type TipoAnexoOS =
  | 'FOTO_ANTES'
  | 'FOTO_DEPOIS'
  | 'DOCUMENTO'
  | 'RELATORIO'
  | 'CHECKLIST'
  | 'OUTROS';

export type TipoSolicitante =
  | 'USUARIO'
  | 'SISTEMA'
  | 'PROGRAMACAO_OS';

export type StatusReserva =
  | 'ATIVA'
  | 'FINALIZADA'
  | 'CANCELADA';

// Labels para exibição
export const STATUS_PROGRAMACAO_LABELS: Record<StatusProgramacaoOS, string> = {
  RASCUNHO: 'Rascunho',
  PENDENTE: 'Pendente',
  EM_ANALISE: 'Em Análise',
  APROVADA: 'Aprovada',
  REJEITADA: 'Rejeitada',
  CANCELADA: 'Cancelada'
};

export const STATUS_OS_LABELS: Record<StatusOS, string> = {
  PLANEJADA: 'Planejada',
  PROGRAMADA: 'Programada',
  EM_EXECUCAO: 'Em Execução',
  PAUSADA: 'Pausada',
  FINALIZADA: 'Finalizada',
  CANCELADA: 'Cancelada'
};

export const TIPO_OS_LABELS: Record<TipoOS, string> = {
  PREVENTIVA: 'Preventiva',
  CORRETIVA: 'Corretiva',
  PREDITIVA: 'Preditiva',
  EMERGENCIAL: 'Emergencial',
  CALIBRACAO: 'Calibração',
  INSTALACAO: 'Instalação',
  REMOCAO: 'Remoção',
  OUTROS: 'Outros'
};

export const PRIORIDADE_OS_LABELS: Record<PrioridadeOS, string> = {
  CRITICA: 'Crítica',
  ALTA: 'Alta',
  MEDIA: 'Média',
  BAIXA: 'Baixa'
};

export const ORIGEM_OS_LABELS: Record<OrigemOS, string> = {
  ANOMALIA: 'Anomalia',
  TAREFA: 'Tarefa',
  PLANO_MANUTENCAO: 'Plano de Manutenção',
  MANUAL: 'Manual'
};

export const CONDICAO_OS_LABELS: Record<CondicaoOS, string> = {
  NORMAL: 'Normal',
  EMERGENCIA: 'Emergência',
  PARADA_PROGRAMADA: 'Parada Programada',
  PRODUCAO_REDUZIDA: 'Produção Reduzida'
};

// Cores para status
export const STATUS_PROGRAMACAO_COLORS: Record<StatusProgramacaoOS, string> = {
  RASCUNHO: 'bg-gray-100 text-gray-800',
  PENDENTE: 'bg-yellow-100 text-yellow-800',
  EM_ANALISE: 'bg-blue-100 text-blue-800',
  APROVADA: 'bg-green-100 text-green-800',
  REJEITADA: 'bg-red-100 text-red-800',
  CANCELADA: 'bg-gray-100 text-gray-600'
};

export const STATUS_OS_COLORS: Record<StatusOS, string> = {
  PLANEJADA: 'bg-gray-100 text-gray-800',
  PROGRAMADA: 'bg-blue-100 text-blue-800',
  EM_EXECUCAO: 'bg-orange-100 text-orange-800',
  PAUSADA: 'bg-yellow-100 text-yellow-800',
  FINALIZADA: 'bg-green-100 text-green-800',
  CANCELADA: 'bg-red-100 text-red-800'
};

export const PRIORIDADE_OS_COLORS: Record<PrioridadeOS, string> = {
  CRITICA: 'bg-red-100 text-red-800',
  ALTA: 'bg-orange-100 text-orange-800',
  MEDIA: 'bg-yellow-100 text-yellow-800',
  BAIXA: 'bg-green-100 text-green-800'
};