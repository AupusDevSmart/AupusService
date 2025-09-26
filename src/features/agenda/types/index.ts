// src/features/agenda/types/index.ts
import { ModalMode } from '@/types/base';
import type {
  FeriadoResponse,
  CreateFeriadoData,
  UpdateFeriadoData,
  QueryFeriadosParams,
  ConfiguracaoDiasUteisResponse,
  CreateConfiguracaoDiasUteisData,
  UpdateConfiguracaoDiasUteisData,
  QueryConfiguracoesDiasUteisParams,
  TipoFeriado
} from '@/services/agenda.services';

// Re-exports dos tipos da API
export type {
  FeriadoResponse,
  CreateFeriadoData,
  UpdateFeriadoData,
  QueryFeriadosParams,
  ConfiguracaoDiasUteisResponse,
  CreateConfiguracaoDiasUteisData,
  UpdateConfiguracaoDiasUteisData,
  QueryConfiguracoesDiasUteisParams,
  TipoFeriado
};

// Tipos específicos da feature
export interface FeriadoFormData {
  nome: string;
  data: string;
  tipo: TipoFeriado;
  geral?: boolean;
  recorrente?: boolean;
  descricao?: string;
  plantaIds?: string[];
}

export interface ConfiguracaoDiasUteisFormData {
  nome: string;
  descricao?: string;
  segunda?: boolean;
  terca?: boolean;
  quarta?: boolean;
  quinta?: boolean;
  sexta?: boolean;
  sabado?: boolean;
  domingo?: boolean;
  geral?: boolean;
  plantaIds?: string[];
}

// Filtros
export interface FeriadosFilters {
  search: string;
  tipo: string; // 'all' | TipoFeriado
  plantaId: string; // 'all' | plantaId
  ano: string; // 'all' | year
  mes: string; // 'all' | month
  geral: string; // 'all' | 'true' | 'false'
  recorrente: string; // 'all' | 'true' | 'false'
  page: number;
  limit: number;
}

export interface ConfiguracoesDiasUteisFilters {
  search: string;
  plantaId: string; // 'all' | plantaId
  geral: string; // 'all' | 'true' | 'false'
  sabado: string; // 'all' | 'true' | 'false'
  domingo: string; // 'all' | 'true' | 'false'
  page: number;
  limit: number;
}

// Estados do modal
export interface FeriadoModalState {
  isOpen: boolean;
  mode: ModalMode;
  feriado: FeriadoResponse | null;
}

export interface ConfiguracaoDiasUteisModalState {
  isOpen: boolean;
  mode: ModalMode;
  configuracao: ConfiguracaoDiasUteisResponse | null;
}

// Tipos de paginação
export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

// Loading states
export interface AgendaLoadingState {
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error?: string;
}

// Operation results
export interface FeriadoOperationResult {
  success: boolean;
  data?: FeriadoResponse;
  error?: string;
}

export interface ConfiguracaoDiasUteisOperationResult {
  success: boolean;
  data?: ConfiguracaoDiasUteisResponse;
  error?: string;
}

// Hook return types
export interface UseFeriadosResult {
  feriados: FeriadoResponse[];
  pagination: Pagination;
  loading: AgendaLoadingState;
  filters: FeriadosFilters;

  // Actions
  fetchFeriados: (params?: QueryFeriadosParams) => Promise<void>;
  createFeriado: (data: FeriadoFormData) => Promise<FeriadoOperationResult>;
  updateFeriado: (id: string, data: Partial<FeriadoFormData>) => Promise<FeriadoOperationResult>;
  deleteFeriado: (id: string) => Promise<void>;
  setFilters: (filters: Partial<FeriadosFilters>) => void;
  handlePageChange: (page: number) => void;
}

export interface UseConfiguracoesDiasUteisResult {
  configuracoes: ConfiguracaoDiasUteisResponse[];
  pagination: Pagination;
  loading: AgendaLoadingState;
  filters: ConfiguracoesDiasUteisFilters;

  // Actions
  fetchConfiguracoes: (params?: QueryConfiguracoesDiasUteisParams) => Promise<void>;
  createConfiguracao: (data: ConfiguracaoDiasUteisFormData) => Promise<ConfiguracaoDiasUteisOperationResult>;
  updateConfiguracao: (id: string, data: Partial<ConfiguracaoDiasUteisFormData>) => Promise<ConfiguracaoDiasUteisOperationResult>;
  deleteConfiguracao: (id: string) => Promise<void>;
  setFilters: (filters: Partial<ConfiguracoesDiasUteisFilters>) => void;
  handlePageChange: (page: number) => void;
}

// Constantes
export const TIPOS_FERIADO: { value: TipoFeriado; label: string }[] = [
  { value: 'NACIONAL', label: 'Nacional' },
  { value: 'ESTADUAL', label: 'Estadual' },
  { value: 'MUNICIPAL', label: 'Municipal' },
  { value: 'PERSONALIZADO', label: 'Personalizado' }
];

export const DIAS_SEMANA = [
  { key: 'segunda', label: 'Segunda-feira' },
  { key: 'terca', label: 'Terça-feira' },
  { key: 'quarta', label: 'Quarta-feira' },
  { key: 'quinta', label: 'Quinta-feira' },
  { key: 'sexta', label: 'Sexta-feira' },
  { key: 'sabado', label: 'Sábado' },
  { key: 'domingo', label: 'Domingo' }
];

export const MESES = [
  { value: '1', label: 'Janeiro' },
  { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' },
  { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' }
];

// Validation errors
export interface FeriadoValidationErrors {
  nome?: string;
  data?: string;
  tipo?: string;
  plantaIds?: string;
  descricao?: string;
}

export interface ConfiguracaoDiasUteisValidationErrors {
  nome?: string;
  descricao?: string;
  plantaIds?: string;
  diasSemana?: string;
}