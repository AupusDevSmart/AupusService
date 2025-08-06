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

// Exportar hook customizado
export { useAnomalias } from './hooks/useAnomalias';

// Exportar configurações
export { anomaliasTableColumns } from './config/table-config';
export { anomaliasFilterConfig } from './config/filter-config';
export { anomaliasFormFields } from './config/form-config';

// Exportar dados mock
export { mockAnomalias } from './data/mock-data';