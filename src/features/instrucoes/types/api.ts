// src/features/instrucoes/types/api.ts
// Re-export all types from the service layer for backwards compatibility
export type {
  StatusInstrucao,
  CategoriaTarefa,
  TipoManutencao,
  CondicaoAtivo,
  TipoAnexo,
  CreateSubInstrucaoApiData,
  CreateRecursoInstrucaoApiData,
  CreateInstrucaoApiData,
  UpdateInstrucaoApiData,
  UpdateStatusInstrucaoApiData,
  AdicionarAoPlanoApiData,
  AssociarAnomaliaApiData,
  AssociarSolicitacaoApiData,
  UsuarioResumoDto,
  SubInstrucaoApiResponse,
  RecursoInstrucaoApiResponse,
  AnexoInstrucaoApiResponse,
  InstrucaoApiResponse,
  DashboardInstrucoesDto,
  QueryInstrucoesApiParams,
  InstrucoesListApiResponse,
  AnomaliaAssociadaResponse,
  SolicitacaoAssociadaResponse
} from '@/services/instrucoes.services';
