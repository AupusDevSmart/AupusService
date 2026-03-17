// src/features/solicitacoes-servico/index.ts

// Exportar a página principal
export { SolicitacoesPage } from './components/SolicitacoesPage';

// Exportar tipos
export type {
  SolicitacaoServico,
  SolicitacaoServicoFormData,
  SolicitacoesFilters,
  StatusSolicitacaoServico,
  PrioridadeSolicitacao,
  TipoSolicitacaoServico,
  OrigemSolicitacao,
  ModalState,
  ModalMode,
  Pagination,
} from './types';

// Exportar hooks customizados
export { useSolicitacoesApi } from './hooks/useSolicitacoesApi';
export { useSolicitacoesFilters } from './hooks/useSolicitacoesFilters';
export { useSolicitacoesActions } from './hooks/useSolicitacoesActions';

// Exportar configurações
export { solicitacoesTableColumns } from './config/table-config';
export { solicitacoesFilterConfig } from './config/filter-config';
export { solicitacoesFormFields } from './config/form-config';
export { createSolicitacoesTableActions } from './config/actions-config';
