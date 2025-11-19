// src/features/execucao-os/index.ts

// Exportar a página principal
export { default as ExecucaoOSPage } from './components/ExecucaoOSPage';

// Exportar tipos
export type {
  ExecucaoOS,
  ExecucaoOSFormData,
  ExecucaoOSFilters,
  ChecklistAtividade,
  MaterialConsumido,
  FerramentaUtilizada,
  RegistroTempoTecnico,
  AnexoExecucao,
  StatusExecucaoOS,
  TipoOS,
  PrioridadeOS,
  FinalizarExecucaoData
} from './types';

// Exportar hook customizado
export { useExecucaoOS } from './hooks/useExecucaoOS';

// Exportar configurações
export { execucaoOSTableColumns } from './config/table-config';
export { execucaoOSFilterConfig } from './config/filter-config';
export { execucaoOSFormFields } from './config/form-config';