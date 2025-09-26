// src/features/veiculos/types/index.ts

// Re-export API types
export type {
  StatusVeiculo,
  TipoCombustivel,
  TipoVeiculo,
  VeiculoResponse,
  CreateVeiculoRequest,
  UpdateVeiculoRequest,
  QueryVeiculosParams,
  VeiculosFilters,
  DashboardVeiculosResponse,
  ManutencaoVeiculo,
  CreateManutencaoRequest
} from '@/services/veiculos.services';

// Re-export document types
export type {
  DocumentoVeiculoResponse,
  TipoDocumento,
  UploadDocumentoDto,
  CATEGORIAS_DOCUMENTOS
} from './documentos';

// Re-export reservas types for integration
export type {
  StatusReserva,
  TipoSolicitante,
  ReservaResponse,
  CreateReservaRequest,
  UpdateReservaRequest
} from '@/services/reservas.services';

// Base filters for components
export interface BaseFilters {
  search: string;
  page: number;
  limit: number;
}
