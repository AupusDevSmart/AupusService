// src/features/tarefas/index.ts

// Exportar a página principal
export { TarefasPage } from './components/TarefasPage';

// Exportar tipos
export type { 
  Tarefa, 
  TarefaFormData, 
  TarefasFilters,
  SubTarefa,
  RecursoTarefa,
  AnexoTarefa,
  TipoManutencao,
  FrequenciaTarefa,
  CondicaoAtivo,
  StatusTarefa,
  CategoriaTarefa,
  ModalState,
  ModalMode,
  Pagination
} from './types';

// Exportar configurações
export { tarefasTableColumns } from './config/table-config';
export { tarefasFilterConfig } from './config/filter-config';
export { tarefasFormFields } from './config/form-config';