// src/features/instrucoes/index.ts

export { InstrucoesPage } from './components/InstrucoesPage';

export type {
  StatusInstrucao,
  CategoriaTarefa,
  TipoManutencao,
  CondicaoAtivo,
  SubInstrucao,
  RecursoInstrucao,
  AnexoInstrucao,
  ModalState,
  ModalMode,
  Pagination
} from './types';

export { instrucoesTableColumns } from './config/table-config';
export { instrucoesFilterConfig } from './config/filter-config';
export { instrucoesFormFields } from './config/form-config';
