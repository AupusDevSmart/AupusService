// src/features/execucao-os/index.ts - REFATORADO

// Exportar a página principal
export { default as ExecucaoOSPage } from './components/ExecucaoOSPage';

// Exportar componentes
export { ExecucaoOSDashboard } from './components/ExecucaoOSDashboard';
export { IniciarExecucaoModal } from './components/IniciarExecucaoModal';
export { FinalizarExecucaoModal } from './components/FinalizarExecucaoModal';

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

// Exportar hooks customizados REFATORADOS
export { useExecucaoOSApi } from './hooks/useExecucaoOSApi';
export { useExecucaoOSFilters } from './hooks/useExecucaoOSFilters';
export { useExecucaoOSActions } from './hooks/useExecucaoOSActions';

// Manter export do hook antigo para compatibilidade (deprecated)
export { useExecucaoOS } from './hooks/useExecucaoOS';

// Exportar configurações
export { execucaoOSTableColumns } from './config/table-config';
export { execucaoOSFilterConfig } from './config/filter-config';
export { execucaoOSFormFields, execucaoOSFormGroups } from './config/form-config';
export { createExecucaoOSTableActions } from './config/actions-config';

// Exportar utilitários
export { transformApiResponseToExecucaoOS, transformApiArrayToExecucaoOS } from './utils/transform-api-data';