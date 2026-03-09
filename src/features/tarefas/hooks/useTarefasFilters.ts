// src/features/tarefas/hooks/useTarefasFilters.ts
import { useState, useCallback } from 'react';
import { PlantasService } from '@/services/plantas.services';
import { unidadesService } from '@/services/unidades.services';
import { usePlanosManutencaoApi } from '@/features/planos-manutencao/hooks/usePlanosManutencaoApi';
import { tarefasFilterConfig } from '../config/filter-config';
import { tarefasFormFields } from '../config/form-config';
import { FilterConfig } from '@/types/base';
import { QueryTarefasApiParams } from '@/services/tarefas.services';

export function useTarefasFilters(initialFilters: QueryTarefasApiParams) {
  const [filterConfig, setFilterConfig] = useState<FilterConfig[]>(tarefasFilterConfig);
  const [formFields, setFormFields] = useState(tarefasFormFields);
  const { fetchPlanos } = usePlanosManutencaoApi();

  const loadFilterOptions = useCallback(async (plantaId?: string, unidadeId?: string) => {
    try {
      const [plantasResponse, unidadesResponse, planosResponse] = await Promise.all([
        PlantasService.getAllPlantas({ limit: 100 }),
        unidadesService.listarUnidades({
          limit: 100,
          ...(plantaId && plantaId !== 'all' ? { planta_id: plantaId } : {})
        }),
        fetchPlanos({
          limit: 100,
          ...(unidadeId && unidadeId !== 'all' ? { unidade_id: unidadeId } : {})
        })
      ]);

      // Atualizar configuração dos filtros
      const updatedConfig = tarefasFilterConfig.map(filter => {
        if (filter.key === 'planta_id') {
          return {
            ...filter,
            options: [
              { value: 'all', label: 'Todas as plantas' },
              ...plantasResponse.data.map(planta => ({
                value: planta.id,
                label: planta.nome
              }))
            ]
          };
        }

        if (filter.key === 'unidade_id') {
          return {
            ...filter,
            options: [
              { value: 'all', label: 'Todas as instalações' },
              ...unidadesResponse.data.map(unidade => ({
                value: unidade.id,
                label: unidade.nome
              }))
            ]
          };
        }

        if (filter.key === 'plano_id') {
          return {
            ...filter,
            options: [
              { value: 'all', label: 'Todos os planos' },
              ...planosResponse.data.map(plano => ({
                value: plano.id,
                label: plano.nome
              }))
            ]
          };
        }

        return filter;
      });

      setFilterConfig(updatedConfig);

      // Atualizar campos do formulário
      const updatedFormFields = tarefasFormFields.map(field => {
        if (field.key === 'plano_manutencao_id') {
          return {
            ...field,
            placeholder: 'Selecione um plano...',
            options: planosResponse.data
              .filter(plano => plano.id && plano.nome)
              .map(plano => ({
                value: plano.id,
                label: plano.nome
              }))
          };
        }

        // Planta e Equipamento não precisam de opções
        // São campos informativos (read-only) que mostram os dados da entidade

        return field;
      });

      setFormFields(updatedFormFields);
    } catch (error) {
      console.error('Erro ao carregar opções dos filtros:', error);
    }
  }, [fetchPlanos]);

  return {
    filterConfig,
    formFields,
    loadFilterOptions
  };
}
