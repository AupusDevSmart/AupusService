// src/features/anomalias/types/index.ts
import { BaseEntity, type BaseFilters as BaseFiltersType, ModalMode } from '@/types/base';

// Enums para os campos de seleção
export type StatusAnomalia = 'REGISTRADA' | 'PROGRAMADA' | 'FINALIZADA';
export type PrioridadeAnomalia = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
export type CondicaoAnomalia = 'PARADO' | 'FUNCIONANDO' | 'RISCO_ACIDENTE';
export type OrigemAnomalia = 'SCADA' | 'OPERADOR' | 'FALHA';

// Interface principal da anomalia
export interface Anomalia extends BaseEntity {
  descricao: string;
  local: string;
  ativo: string;
  data: string;
  condicao: CondicaoAnomalia;
  origem: OrigemAnomalia;
  status: StatusAnomalia;
  prioridade: PrioridadeAnomalia;
  observacoes?: string;
  /** ANO-0000. Ausente nas anomalias anteriores ao campo. */
  numero?: string;
  /** Ate quando precisa estar resolvida. */
  prazo?: string;
  criadoPor?: string;
  atualizadoEm?: string;
  ordemServicoId?: string;
  
  // Campos para relacionamento com a nova estrutura
  plantaId?: number;
  unidadeId?: number; // NOVO: Equipamentos agora pertencem a Unidades
  equipamentoId?: number; // Pode ser UC ou UAR

  // Support for API field names (snake_case)
  planta_id?: string | number;
  unidade_id?: string | number; // NOVO: Support para unidade_id da API
  equipamento_id?: string | number;
  ordem_servico_id?: string;
  criado_por?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
  
  // Support for related objects from API
  planta?: PlantaDaAnomalia | null;
  unidade?: UnidadeDaAnomalia | null;
  equipamento?: EquipamentoDaAnomalia | null;
  usuario?: UsuarioDaAnomalia | null;

  // Histórico da anomalia
  historico?: HistoricoAnomalia[];

  // Instruções vinculadas
  anomalias_instrucoes?: InstrucaoDaAnomalia[];
}

// Relações que o GET da anomalia inclui (o backend manda snake_case; os
// camelCase ficam porque a tela ainda lê os dois).
export interface PlantaDaAnomalia {
  id: string;
  nome?: string;
}

export interface UnidadeDaAnomalia {
  id: string;
  nome?: string;
  planta_id?: string | null;
  planta?: PlantaDaAnomalia | null;
}

export interface EquipamentoDaAnomalia {
  id: string;
  nome?: string;
  unidadeId?: string | number;
  unidade_id?: string | null;
  plantaId?: string | number;
  unidade?: UnidadeDaAnomalia | null;
  planta?: PlantaDaAnomalia | null;
}

export interface UsuarioDaAnomalia {
  id: string;
  nome?: string;
  email?: string;
}

export interface InstrucaoDaAnomalia {
  instrucao_id?: string;
  instrucao?: {
    id: string;
    tag?: string;
    nome?: string;
    status?: string;
    ativo?: boolean;
  } | null;
}

// Interface para histórico da anomalia
export interface HistoricoAnomalia {
  id: number;
  acao: string;
  usuario: string;
  data: string;
  observacoes?: string;
  statusAnterior?: string;
  statusNovo?: string;
}

// Form data para criação/edição
export interface AnomaliaFormData {
  descricao: string;
  local: string;
  ativo: string;
  condicao: CondicaoAnomalia;
  origem: OrigemAnomalia;
  prioridade: PrioridadeAnomalia;
  observacoes?: string;
  plantaId?: number | string;
  unidadeId?: number | string; // NOVO: Equipamentos agora pertencem a Unidades
  equipamentoId?: number | string;
  anexos?: File[];
  instrucoes_ids?: string[];
  // Support for nested localizacao object from form
  localizacao?: {
    plantaId?: number | string;
    unidadeId?: number | string; // NOVO: Unidade no objeto de localização
    equipamentoId?: number | string;
    local?: string;
    ativo?: string;
  };
}

// Filtros para a página
export interface AnomaliasFilters extends BaseFiltersType {
  periodo: string;
  status: string;
  prioridade: string;
  origem: string;
  planta: string;
  unidade: string; // NOVO: Filtro por unidade
}

// Estado do modal
export interface ModalState {
  isOpen: boolean;
  mode: ModalMode;
  anomalia: Anomalia | null;
}

export { type ModalMode };

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

// Anexos
export * from './anexos';