// src/features/execucao-os/hooks/useExecucaoOSFilters.ts
import { useMemo } from 'react';
import { execucaoOSFilterConfig } from '../config/filter-config';
import { execucaoOSFormFields, execucaoOSFormGroups } from '../config/form-config';
import type { ExecucaoOSFilters } from '../types';
import type { QueryExecucaoOSApiParams } from '@/services/execucao-os.service';
import { filtrosDePlantaEquipamentoPeriodo } from '@/components/common/filtros/filtros-da-lista';
import { usePlantasDoFiltro } from '@/hooks/usePlantasDoFiltro';

/**
 * Hook customizado para gerenciar filtros da feature Execução de OS
 * Segue o padrão definido no FEATURE_REFACTORING_GUIDE.md
 */
export function useExecucaoOSFilters(currentFilters: ExecucaoOSFilters) {
  // Planta, equipamento e período (SN-55), a mesma régua da Programação
  const plantasDoFiltro = usePlantasDoFiltro();
  const filterConfigs = useMemo(
    () => [
      ...execucaoOSFilterConfig,
      ...filtrosDePlantaEquipamentoPeriodo({
        plantas: plantasDoFiltro.opcoes,
        carregandoPlantas: plantasDoFiltro.carregando,
        plantaId: currentFilters.planta,
        chaves: { planta: 'planta', equipamento: 'equipamento', inicio: 'dataInicio', fim: 'dataFim' },
      }),
    ],
    [plantasDoFiltro.opcoes, plantasDoFiltro.carregando, currentFilters.planta],
  );

  // Retorna os campos do formulário (imutável)
  const formFields = useMemo(() => execucaoOSFormFields, []);

  // Retorna os grupos do formulário (imutável)
  const formGroups = useMemo(() => execucaoOSFormGroups, []);

  // Converte filtros do frontend para parâmetros da API
  const toApiParams = useMemo(() => {
    const params: QueryExecucaoOSApiParams = {
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

    // A API filtra o responsável pelo nome (texto); responsavel_id e
    // data_execucao, que iam antes, ela não declara: davam 400 no primeiro uso
    if (currentFilters.responsavel && currentFilters.responsavel !== 'all') {
      params.responsavel = currentFilters.responsavel;
    }

    if (currentFilters.planta && currentFilters.planta !== 'all') {
      params.planta_id = currentFilters.planta;
    }

    if (currentFilters.equipamento && currentFilters.equipamento !== 'all') {
      params.equipamento_id = currentFilters.equipamento;
    }

    if (currentFilters.dataInicio) params.data_inicio = currentFilters.dataInicio;
    if (currentFilters.dataFim) params.data_fim = currentFilters.dataFim;

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
