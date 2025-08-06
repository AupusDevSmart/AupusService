// src/features/programacao-os/index.ts

// Exportar a página principal
export { ProgramacaoOSPage } from './components/ProgramacaoOSPage';

// Exportar tipos
export type { 
  OrdemServico, 
  OrdemServicoFormData, 
  ProgramacaoOSFormData,
  ProgramacaoOSFilters,
  MaterialOS,
  FerramentaOS,
  TecnicoOS,
  HistoricoOS,
  StatusOS,
  TipoOS,
  CondicaoOS,
  PrioridadeOS,
  OrigemOS,
  ModalState,
  ModalMode,
  Pagination
} from './types';

// Exportar hook customizado
export { useProgramacaoOS } from './hooks/useProgramacaoOS';

// Exportar configurações
export { programacaoOSTableColumns } from './config/table-config';
export { programacaoOSFilterConfig } from './config/filter-config';
export { programacaoOSFormFields } from './config/form-config';

// Exportar dados mock
export { mockOrdensServico } from './data/mock-data';