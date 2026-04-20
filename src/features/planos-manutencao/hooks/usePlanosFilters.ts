// src/features/planos-manutencao/hooks/usePlanosFilters.ts
import { useState, useCallback } from 'react';
import { FilterConfig } from '@/types/base';
import { QueryPlanosApiParams } from '@/services/planos-manutencao.services';
import { planosFilterConfig } from '../config/filter-config';
import { planosFormFields } from '../config/form-config';

export function usePlanosFilters(_initialFilters: QueryPlanosApiParams) {
  const [filterConfig] = useState<FilterConfig[]>(planosFilterConfig);
  const [formFields] = useState(planosFormFields);

  const loadFilterOptions = useCallback(async () => {
    try {
      // TODO: Carregar opções dinâmicas de equipamentos se necessário
      // Por enquanto, os filtros são estáticos

      // Você pode adicionar lógica aqui para carregar plantas/equipamentos dinamicamente
      // Exemplo:
      // const equipamentos = await equipamentosService.findAll({ limit: 100 });
      // const updatedConfig = planosFilterConfig.map(filter => {
      //   if (filter.key === 'equipamento_id') {
      //     return {
      //       ...filter,
      //       options: [
      //         { value: 'all', label: 'Todos os equipamentos' },
      //         ...equipamentos.data.map(eq => ({ value: eq.id, label: eq.nome }))
      //       ]
      //     };
      //   }
      //   return filter;
      // });
      // setFilterConfig(updatedConfig);
    } catch (error) {
      console.error('Erro ao carregar opções dos filtros:', error);
    }
  }, []);

  return {
    filterConfig,
    formFields,
    loadFilterOptions
  };
}
