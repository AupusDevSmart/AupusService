// src/features/programacao-os/hooks/useProgramacaoOSFilters.ts

import { useMemo } from 'react';
import type { FilterConfig } from '@nexon/components/common/base-filters/types';
import type { ProgramacaoFiltersDto } from '@/services/programacao-os.service';
import { programacaoOSFormFields, programacaoOSFormGroups } from '../config/form-config';

/**
 * Hook customizado para configuração de filtros da feature Programação de OS
 * Segue o padrão definido no FEATURE_REFACTORING_GUIDE.md
 */
export function useProgramacaoOSFilters(currentFilters: ProgramacaoFiltersDto) {
  const filterConfigs: FilterConfig[] = useMemo(() => [
    {
      key: 'search',
      type: 'search',
      placeholder: 'Buscar por código, descrição, local...',
    },
    {
      key: 'status',
      type: 'combobox',
      label: 'Status',
      placeholder: 'Todos os status',
      options: [
        { value: 'all', label: 'Todos os status' },
        { value: 'RASCUNHO', label: 'Rascunho' },
        { value: 'PENDENTE', label: 'Pendente' },
        { value: 'EM_ANALISE', label: 'Em Análise' },
        { value: 'APROVADA', label: 'Aprovada' },
        { value: 'REJEITADA', label: 'Rejeitada' },
        { value: 'CANCELADA', label: 'Cancelada' },
      ],
    },
    {
      key: 'tipo',
      type: 'combobox',
      label: 'Tipo',
      placeholder: 'Todos os tipos',
      options: [
        { value: 'all', label: 'Todos os tipos' },
        { value: 'PREVENTIVA', label: 'Preventiva' },
        { value: 'PREDITIVA', label: 'Preditiva' },
        { value: 'CORRETIVA', label: 'Corretiva' },
        { value: 'INSPECAO', label: 'Inspeção' },
      ],
    },
    {
      key: 'prioridade',
      type: 'combobox',
      label: 'Prioridade',
      placeholder: 'Todas as prioridades',
      options: [
        { value: 'all', label: 'Todas as prioridades' },
        { value: 'CRITICA', label: 'Crítica' },
        { value: 'ALTA', label: 'Alta' },
        { value: 'MEDIA', label: 'Média' },
        { value: 'BAIXA', label: 'Baixa' },
      ],
    },
  ], []);

  // Retornar configurações de filtros e campos do formulário
  return {
    filterConfigs,
    formFields: programacaoOSFormFields,
    formGroups: programacaoOSFormGroups,
  };
}
