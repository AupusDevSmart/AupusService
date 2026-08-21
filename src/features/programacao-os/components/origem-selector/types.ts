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
/**
 * Plano oferecido na selecao de origem.
 *
 * Espelha o que o `useOrigemDados` monta a partir de `GET /planos-manutencao` —
 * e nao o model do banco. Ja divergiu uma vez: declarava `descricao`, `tipo`,
 * `frequencia` e `equipamentoNome`, que a API nao devolve, e o seletor antigo
 * recebia a lista com `as any`, entao a divergencia nao aparecia no typecheck.
 * Os cards mostravam linhas vazias.
 */
export interface PlanoDisponivel {
  id: string;
  nome: string;
  /** Tipo do equipamento do plano, ou 'GERAL'. */
  categoria: string;
  totalTarefas: number;
  totalEquipamentos: number;
  ativo: boolean;
  tarefasTemplate: unknown[];
  plantaId?: string;
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
/**
 * Tarefa oferecida na selecao de origem.
 *
 * Desde o PR6 a tarefa tem quatro campos e NAO guarda mais conteudo:
 * descricao, categoria, tipo_manutencao, tempo_estimado e duracao_estimada
 * foram droppadas e vivem na instrucao. Declarar aquelas colunas aqui era o
 * que deixava o front compilar lendo campo inexistente.
 */
export interface TarefaDisponivel {
  id: string;
  nome: string;
  tag?: string;
  criticidade?: number;
  frequencia?: string;
  ordem?: number;
  instrucao?: {
    id?: string;
    tag?: string;
    nome?: string;
    categoria?: string;
    tipo_manutencao?: string;
    descricao?: string;
    sub_instrucoes?: Array<{
      id?: string;
      descricao: string;
      obrigatoria?: boolean;
      ordem?: number;
      tempo_estimado?: number | null;
    }>;
  };
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
