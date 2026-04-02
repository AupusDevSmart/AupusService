// src/features/execucao-os/index.ts - REFATORADO

// Exportar a página principal
export { default as ExecucaoOSPage } from './components/ExecucaoOSPage';

// Exportar componentes
export { ExecucaoOSDashboard } from './components/ExecucaoOSDashboard';
export { ActionConfirmPanel } from './components/ActionConfirmPanel';

// Exportar células customizadas
export { OSInfoCell } from './components/table-cells/OSInfoCell';
export { StatusCell } from './components/table-cells/StatusCell';
export { ResponsavelCell } from './components/table-cells/ResponsavelCell';
export { ProgressoCell } from './components/table-cells/ProgressoCell';
export { TipoEPrioridadeCell } from './components/table-cells/TipoEPrioridadeCell';

// Exportar tipos
export type {
  ExecucaoOS,
  ExecucaoOSFormData,
  ExecucaoOSFilters,
  ChecklistAtividade,
  MaterialConsumido,
  FerramentaUtilizada,
  StatusExecucaoOS,
  TipoOS,
  PrioridadeOS,
  FinalizarExecucaoData,
  MaterialOS,
  FerramentaOS,
  TecnicoOS,
  AnexoOS,
} from './types';

// Exportar hooks customizados
export { useExecucaoOSApi } from './hooks/useExecucaoOSApi';
export { useExecucaoOSFilters } from './hooks/useExecucaoOSFilters';

// Exportar configurações
export { execucaoOSTableColumns } from './config/table-config';
export { execucaoOSFilterConfig } from './config/filter-config';
export { execucaoOSFormFields, execucaoOSFormGroups } from './config/form-config';
export { createExecucaoOSTableActions } from './config/actions-config';

// Exportar utilitários
export { transformApiResponseToExecucaoOS, transformApiArrayToExecucaoOS } from './utils/transform-api-data';