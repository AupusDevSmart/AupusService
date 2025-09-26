// src/features/reservas/types/index.ts
import { BaseEntity, type BaseFilters as BaseFiltersType, ModalMode } from '@/types/base';

// Re-export API types
export type {
  StatusReserva,
  TipoSolicitante,
  ReservaResponse,
  CreateReservaRequest,
  UpdateReservaRequest,
  QueryReservasParams,
  ReservasFilters,
  DashboardReservasResponse
} from '@/services/reservas.services';

export type {
  VeiculoResponse,
  CreateVeiculoRequest,
  UpdateVeiculoRequest,
  QueryVeiculosParams,
  VeiculosFilters,
  DashboardVeiculosResponse,
  StatusVeiculo,
  TipoCombustivel,
  TipoVeiculo
} from '@/services/veiculos.services';

// Alias for backward compatibility
export type Veiculo = import('@/services/veiculos.services').VeiculoResponse;

// Legacy types for backward compatibility (use API types for new code)
export interface ReservaVeiculo extends BaseEntity {
  veiculoId: number;
  solicitanteId?: string;
  tipoSolicitante: import('@/services/reservas.services').TipoSolicitante;
  dataInicio: string;
  dataFim: string;
  horaInicio: string;
  horaFim: string;
  responsavel: string;
  finalidade: string;
  status: import('@/services/reservas.services').StatusReserva;
  observacoes?: string;
  motivoCancelamento?: string;
  criadoPor?: string;
  dataReserva?: string;
  dataCancelamento?: string;
}

// Form data interfaces
export interface ReservaFormData {
  veiculoId?: number;
  solicitanteId?: string;
  tipoSolicitante: import('@/services/reservas.services').TipoSolicitante;
  dataInicio: string;
  dataFim: string;
  horaInicio: string;
  horaFim: string;
  responsavel: string;
  finalidade: string;
  observacoes?: string;
}

export interface VeiculoFormData {
  nome: string;
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  cor?: string;
  status?: import('@/services/veiculos.services').StatusVeiculo;
  tipo?: import('@/services/veiculos.services').TipoVeiculo;
  tipoCombustivel: import('@/services/veiculos.services').TipoCombustivel;
  capacidadePassageiros?: number;
  capacidadeCarga?: number;
  kmAtual?: number;
  proximaRevisao?: string;
  responsavelManutencao?: string;
  localizacaoAtual: string;
  valorDiaria?: number;
  observacoes?: string;
  chassi?: string;
  renavam?: string;
  seguradora?: string;
  vencimentoSeguro?: string;
}

// Para o ViaturaSelector
export interface ViaturaReservada {
  veiculoId: number;
  dataInicio: string;
  dataFim: string;
  horaInicio: string;
  horaFim: string;
  responsavel?: string;
  finalidade?: string;
}

// Para verificação de disponibilidade
export interface FiltrosDisponibilidade {
  dataInicio: string;
  dataFim: string;
  horaInicio?: string;
  horaFim?: string;
  excluirReservaId?: string;
}

export interface DisponibilidadeVeiculo {
  veiculoId: number;
  disponivel: boolean;
  conflitos: ReservaVeiculo[];
  proximaDisponibilidade?: {
    dataInicio: string;
    horaInicio: string;
  };
}

// Local filters for components - use API types for new code
export interface LocalReservasFilters extends BaseFiltersType {
  veiculoId: string;
  status: string;
  tipoSolicitante: string;
  responsavel: string;
  dataInicioFrom: string;
  dataInicioTo: string;
  dataFimFrom: string;
  dataFimTo: string;
}

export interface LocalVeiculosFilters extends BaseFiltersType {
  status: string;
  tipo: string;
  tipoCombustivel: string;
  marca: string;
  disponivel: string;
}

// Estados dos modais
export interface ReservaModalState {
  isOpen: boolean;
  mode: ModalMode;
  reserva: ReservaVeiculo | null;
}

export interface VeiculoModalState {
  isOpen: boolean;
  mode: ModalMode;
  veiculo: Veiculo | null;
}

export { type ModalMode };

// Interface para ViaturaSelectorProps
export interface ViaturaSelectorProps {
  value: number | ViaturaReservada | null;
  onChange: (value: number | ViaturaReservada | null) => void;
  dataInicio: string;
  dataFim: string;
  horaInicio: string;
  horaFim: string;
  solicitanteId?: string;
  responsavel?: string;
  finalidade?: string;
  mode?: 'simple' | 'complete';
  disabled?: boolean;
  required?: boolean;
  showPeriodSummary?: boolean;
  reservaIdParaExcluir?: string;
}

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};