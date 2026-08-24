// src/features/anomalias/hooks/useAnomaliasFilters.ts
import { useState, useCallback, useMemo } from 'react';
import { FilterConfig } from '@/types/base';
import { AnomaliasFilters } from '../types';
import { anomaliasFormFields } from '../config/form-config';

export function useAnomaliasFilters(_initialFilters: Partial<AnomaliasFilters>) {
  const [unidades, setUnidades] = useState<Array<{ value: string; label: string }>>([]);

  // Carregar opções de filtros da API
  const loadFilterOptions = useCallback(async () => {
    try {
      // Carregar unidades (instalações) para o filtro
      const { unidadesService } = await import('@/services/unidades.services');
      const unidadesResponse = await unidadesService.listarUnidades({ limit: 100 });

      const unidadesOptions = unidadesResponse.data.map((unidade: any) => ({
        value: unidade.id.toString(),
        label: unidade.nome,
      }));

      setUnidades(unidadesOptions);
    } catch (error) {
      console.error('Erro ao carregar opções de filtros:', error);
    }
  }, []);

  const loadUnidadesForPlanta = useCallback(async (plantaId?: string) => {
    if (!plantaId) {
      setUnidades([]);
      return;
    }

    try {
      const { unidadesService } = await import('@/services/unidades.services');
      const unidadesResponse = await unidadesService.listarUnidades({
        plantaId,
        limit: 100,
      });

      const unidadesOptions = unidadesResponse.data.map((unidade: any) => ({
        value: unidade.id.toString(),
        label: unidade.nome,
      }));

      setUnidades(unidadesOptions);
    } catch (error) {
      console.error('Erro ao carregar unidades:', error);
      setUnidades([]);
    }
  }, []);

  // Configuração de filtros - apenas os essenciais
  const filterConfigs: FilterConfig[] = useMemo(() => [
    {
      key: 'search',
      type: 'search',
      placeholder: 'Buscar por TAG, equipamento, descrição...',
      className: 'flex-1 min-w-[200px]'
    },
    {
      key: 'status',
      type: 'combobox',
      label: 'Status',
      placeholder: 'Todos os status',
      options: [
        // O BaseFilters mostra o rotulo da OPCAO selecionada, nao o placeholder.
        // Encurtar aqui fazia o filtro exibir so 'Todos', sem dizer de que.
        { value: 'all', label: 'Todos os status' },
        { value: 'REGISTRADA', label: 'Registrada' },
        { value: 'PROGRAMADA', label: 'Programada' },
        { value: 'FINALIZADA', label: 'Finalizada' },
      ],
      className: 'w-full sm:w-auto sm:min-w-[160px]'
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
        { value: 'BAIXA', label: 'Baixa' }
      ],
      className: 'w-full sm:w-auto sm:min-w-[140px]'
    },
    {
      key: 'unidade',
      type: 'combobox',
      label: 'Instalação',
      placeholder: 'Todas as instalações',
      options: [
        { value: 'all', label: 'Todas as instalações' },
        ...unidades
      ],
      className: 'w-full sm:w-auto sm:min-w-[180px]'
    },
  ], [unidades]);

  // Sem injecao: o campo de instrucoes vinculadas saiu do sheet de anomalia.
  const formFields = anomaliasFormFields;

  return {
    filterConfigs,
    formFields,
    loadFilterOptions,
    loadUnidadesForPlanta,
  };
}
