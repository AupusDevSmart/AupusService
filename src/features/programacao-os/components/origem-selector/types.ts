// src/features/programacao-os/components/origem-selector/types.ts

/**
 * Tipo de origem da ordem de serviço
 */
export type TipoOrigem = 'ANOMALIA' | 'PLANO_MANUTENCAO' | 'SOLICITACAO_SERVICO';

/**
 * Valor completo da seleção de origem
 */
export interface OrigemOSValue {
  tipo: TipoOrigem;
  anomaliaId?: string;
  planoId?: string;
  solicitacaoServicoId?: string;
  tarefasSelecionadas?: string[];
  plantaId?: string;
  unidadeId?: string;
  planosSelecionados?: string[];
  tarefasPorPlano?: any;
}

/**
 * Interface para plantas disponíveis
 */
export interface PlantaDisponivel {
  id: string;
  nome: string;
  localizacao?: string;
}

/**
 * Interface para unidades disponíveis
 */
export interface UnidadeDisponivel {
  id: string;
  nome: string;
  tipo?: string;
  planta_id: string;
}

/**
 * Interface para anomalias disponíveis
 */
export interface AnomaliaDisponivel {
  id: string;
  descricao: string;
  prioridade: string;
  status: string;
  local: string;
  ativo: string;
  equipamentoId?: string;
  plantaId?: string;
  unidadeId?: string;
  plantaNome?: string;
  unidadeNome?: string;
  dataDeteccao: string;
}

/**
 * Interface para planos de manutenção disponíveis
 */
export interface PlanoDisponivel {
  id: string;
  nome: string;
  descricao: string;
  tipo: string;
  frequencia: string;
  equipamentoId?: string;
  equipamentoNome?: string;
  plantaId: string;
}

/**
 * Interface para solicitações de serviço disponíveis
 */
export interface SolicitacaoDisponivel {
  id: string;
  numero: string;
  titulo: string;
  descricao: string;
  tipo: string;
  prioridade: string;
  status: string;
  local: string;
  plantaId?: string;
  unidadeId?: string;
  plantaNome?: string;
  unidadeNome?: string;
  equipamentoId?: string;
  solicitanteNome: string;
  dataSolicitacao: string;
}

/**
 * Interface para tarefas disponíveis
 */
export interface TarefaDisponivel {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  tipo_manutencao: string;
  tempo_estimado: number;
  duracao_estimada: number;
}

/**
 * Props base para seletores
 */
export interface SelectorBaseProps {
  disabled?: boolean;
}

/**
 * Step para breadcrumb de hierarquia
 */
export interface HierarchyStep {
  label: string;
  value?: string;
  active: boolean;
}
