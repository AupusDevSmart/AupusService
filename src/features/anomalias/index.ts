// src/features/anomalias/index.ts

// Exportar a página principal
export { AnomaliasPage } from './components/AnomaliasPage';

// Exportar tipos
export type { 
  Anomalia, 
  AnomaliaFormData, 
  AnomaliasFilters,
  HistoricoAnomalia,
  StatusAnomalia,
  PrioridadeAnomalia,
  CondicaoAnomalia,
  OrigemAnomalia,
  ModalState,
  ModalMode,
  Pagination
} from './types';

// Exportar hooks customizados
export { useAnomalias } from './hooks/useAnomalias';
export { useAnomaliasTable } from './hooks/useAnomaliasTable';

// Exportar configurações
export { anomaliasTableColumns } from './config/table-config';
export { anomaliasFilterConfig } from './config/filter-config';
export { anomaliasFormFields } from './config/form-config';