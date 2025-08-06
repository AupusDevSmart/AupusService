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

// Exportar hook customizado
export { useTarefas } from './hooks/useTarefas';

// Exportar configurações
export { tarefasTableColumns } from './config/table-config';
export { tarefasFilterConfig } from './config/filter-config';
export { tarefasFormFields } from './config/form-config';

// Exportar dados mock
export { mockTarefas } from './data/mock-data';