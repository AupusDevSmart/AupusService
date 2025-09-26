// src/features/agenda/index.ts
// ============================================================================
// EXPORTS PRINCIPAIS DA FEATURE AGENDA
// ============================================================================

// Components
export { FeriadosPage } from './components/FeriadosPage';
export { ConfiguracoesDiasUteisPage } from './components/ConfiguracoesDiasUteisPage';
export { PlantasSelector } from './components/PlantasSelector';
export { DiasUteisSelector } from './components/DiasUteisSelector';

// Hooks
export { useFeriados } from './hooks/useFeriados';
export { useConfiguracoesDiasUteis } from './hooks/useConfiguracoesDiasUteis';
export {
  useCalendario,
  useDiaUtilQuick,
  useProximosDiasUteis,
  useCalendarioMensal
} from './hooks/useCalendario';

// Types
export type {
  FeriadoResponse,
  CreateFeriadoData,
  UpdateFeriadoData,
  QueryFeriadosParams,
  ConfiguracaoDiasUteisResponse,
  CreateConfiguracaoDiasUteisData,
  UpdateConfiguracaoDiasUteisData,
  QueryConfiguracoesDiasUteisParams,
  TipoFeriado,
  FeriadoFormData,
  ConfiguracaoDiasUteisFormData,
  FeriadosFilters,
  ConfiguracoesDiasUteisFilters,
  FeriadoModalState,
  ConfiguracaoDiasUteisModalState,
  Pagination,
  AgendaLoadingState,
  FeriadoOperationResult,
  ConfiguracaoDiasUteisOperationResult,
  UseFeriadosResult,
  UseConfiguracoesDiasUteisResult,
  FeriadoValidationErrors,
  ConfiguracaoDiasUteisValidationErrors
} from './types';

export {
  TIPOS_FERIADO,
  DIAS_SEMANA,
  MESES
} from './types';

// Configs
export {
  feriadosTableColumns,
  configuracoesDiasUteisTableColumns,
  feriadosTableConfig,
  configuracoesDiasUteisTableConfig
} from './config/table-config';

export {
  usePlantas,
  createFeriadosFilterConfig,
  createConfiguracoesDiasUteisFilterConfig,
  feriadosFilterPresets,
  configuracoesDiasUteisFilterPresets,
  getActiveFiltersCount,
  formatFilterValue,
  buildApiFilters
} from './config/filter-config';

export {
  feriadosFormFields,
  configuracoesDiasUteisFormFields,
  feriadosFormGroups,
  configuracoesDiasUteisFormGroups,
  feriadosValidationRules,
  configuracoesDiasUteisValidationRules,
  feriadosFormDefaults,
  configuracoesDiasUteisFormDefaults,
  transformFeriadoFormData,
  transformConfiguracaoDiasUteisFormData
} from './config/form-config';

// ============================================================================
// FEATURE INFO
// ============================================================================

export const AGENDA_FEATURE = {
  name: 'agenda',
  displayName: 'Agenda',
  description: 'Gerenciamento de feriados e configurações de dias úteis',
  version: '1.0.0',
  routes: [
    {
      path: '/agenda/feriados',
      component: 'FeriadosPage',
      title: 'Feriados',
      description: 'Gerenciar feriados e datas especiais'
    },
    {
      path: '/agenda/configuracoes-dias-uteis',
      component: 'ConfiguracoesDiasUteisPage',
      title: 'Configurações de Dias Úteis',
      description: 'Configurar dias úteis para as plantas'
    }
  ],
  permissions: [
    'agenda.feriados.view',
    'agenda.feriados.create',
    'agenda.feriados.edit',
    'agenda.feriados.delete',
    'agenda.configuracoes.view',
    'agenda.configuracoes.create',
    'agenda.configuracoes.edit',
    'agenda.configuracoes.delete'
  ]
} as const;