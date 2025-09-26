// src/features/anomalias/types/index.ts
import { BaseEntity, type BaseFilters as BaseFiltersType, ModalMode } from '@/types/base';

// Enums para os campos de seleção
export type StatusAnomalia = 'AGUARDANDO' | 'EM_ANALISE' | 'OS_GERADA' | 'CANCELADA' | 'RESOLVIDA';
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
  criadoPor?: string;
  atualizadoEm?: string;
  ordemServicoId?: string;
  
  // Campos para relacionamento com a nova estrutura
  plantaId?: number;
  equipamentoId?: number; // Pode ser UC ou UAR
  
  // Support for API field names (snake_case)
  planta_id?: string | number;
  equipamento_id?: string | number;
  ordem_servico_id?: string;
  criado_por?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
  
  // Support for related objects from API
  planta?: any;
  equipamento?: any;
  usuario?: any;
  
  // Histórico da anomalia
  historico?: HistoricoAnomalia[];
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
  equipamentoId?: number | string;
  anexos?: File[];
  // Support for nested localizacao object from form
  localizacao?: {
    plantaId?: number | string;
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