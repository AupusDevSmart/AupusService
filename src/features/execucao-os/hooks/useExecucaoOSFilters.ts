// src/features/execucao-os/hooks/useExecucaoOSFilters.ts
import { useMemo } from 'react';
import { execucaoOSFilterConfig } from '../config/filter-config';
import { execucaoOSFormFields, execucaoOSFormGroups } from '../config/form-config';
import type { ExecucaoOSFilters } from '../types';

/**
 * Hook customizado para gerenciar filtros da feature Execução de OS
 * Segue o padrão definido no FEATURE_REFACTORING_GUIDE.md
 */
export function useExecucaoOSFilters(currentFilters: ExecucaoOSFilters) {
  // Retorna as configurações de filtros (imutável)
  const filterConfigs = useMemo(() => execucaoOSFilterConfig, []);

  // Retorna os campos do formulário (imutável)
  const formFields = useMemo(() => execucaoOSFormFields, []);

  // Retorna os grupos do formulário (imutável)
  const formGroups = useMemo(() => execucaoOSFormGroups, []);

  // Converte filtros do frontend para parâmetros da API
  const toApiParams = useMemo(() => {
    const params: any = {
      page: currentFilters.page || 1,
      limit: currentFilters.limit || 10,
    };

    if (currentFilters.search) {
      params.search = currentFilters.search;
    }

    if (currentFilters.statusExecucao && currentFilters.statusExecucao !== 'all') {
      params.status = currentFilters.statusExecucao;
    }

    if (currentFilters.tipo && currentFilters.tipo !== 'all') {
      params.tipo = currentFilters.tipo;
    }

    if (currentFilters.prioridade && currentFilters.prioridade !== 'all') {
      params.prioridade = currentFilters.prioridade;
    }

    if (currentFilters.responsavel && currentFilters.responsavel !== 'all') {
      params.responsavel_id = currentFilters.responsavel;
    }

    if (currentFilters.planta && currentFilters.planta !== 'all') {
      params.planta_id = currentFilters.planta;
    }

    if (currentFilters.dataExecucao) {
      params.data_execucao = currentFilters.dataExecucao;
    }

    // Adicionar filtro de OS atrasadas
    if (currentFilters.atrasadas === true) {
      params.atrasadas = true;
    }

    return params;
  }, [currentFilters]);

  return {
    filterConfigs,
    formFields,
    formGroups,
    toApiParams,
  };
}
