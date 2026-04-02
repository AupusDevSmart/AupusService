// src/features/solicitacoes-servico/hooks/useSolicitacoesFilters.tsx
import { useState, useCallback, useMemo } from 'react';
import { FilterConfig } from '@/types/base';
import { SolicitacoesFilters } from '../types';
import { solicitacoesFormFields } from '../config/form-config';
import { InstrucoesSelector } from '../components/InstrucoesSelector';

export function useSolicitacoesFilters(initialFilters: Partial<SolicitacoesFilters>) {
  const [plantas, setPlantas] = useState<Array<{ value: string; label: string }>>([]);

  const loadFilterOptions = useCallback(async () => {
    try {
      const { PlantasService } = await import('@/services/plantas.services');
      const plantasResponse = await PlantasService.getAllPlantas({ limit: 100 });

      setPlantas(plantasResponse.data.map((planta: any) => ({
        value: planta.id.toString(),
        label: planta.nome,
      })));
    } catch (error) {
      console.error('Erro ao carregar opções de filtros:', error);
    }
  }, []);

  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: 'search',
        type: 'search',
        placeholder: 'Buscar por número, título, descrição...',
        className: 'flex-1 min-w-[200px]',
      },
      {
        key: 'status',
        type: 'combobox',
        label: 'Status',
        placeholder: 'Todos os status',
        allowClear: true,
        options: [
          { value: 'all', label: 'Todos os status' },
          { value: 'REGISTRADA', label: 'Registrada' },
          { value: 'PROGRAMADA', label: 'Programada' },
          { value: 'FINALIZADA', label: 'Finalizada' },
        ],
        className: 'w-full sm:w-auto sm:min-w-[180px]',
      },
      {
        key: 'tipo',
        type: 'combobox',
        label: 'Tipo',
        placeholder: 'Todos os tipos',
        allowClear: true,
        options: [
          { value: 'all', label: 'Todos os tipos' },
          { value: 'INSTALACAO', label: 'Instalação' },
          { value: 'MANUTENCAO_CORRETIVA', label: 'Manutenção Corretiva' },
          { value: 'MANUTENCAO_PREVENTIVA', label: 'Manutenção Preventiva' },
          { value: 'MELHORIA', label: 'Melhoria' },
          { value: 'OUTRO', label: 'Outro' },
        ],
        className: 'w-full sm:w-auto sm:min-w-[160px]',
      },
      {
        key: 'prioridade',
        type: 'combobox',
        label: 'Prioridade',
        placeholder: 'Todas as prioridades',
        allowClear: true,
        options: [
          { value: 'all', label: 'Todas as prioridades' },
          { value: 'URGENTE', label: 'Urgente' },
          { value: 'ALTA', label: 'Alta' },
          { value: 'MEDIA', label: 'Média' },
          { value: 'BAIXA', label: 'Baixa' },
        ],
        className: 'w-full sm:w-auto sm:min-w-[140px]',
      },
      {
        key: 'planta_id',
        type: 'combobox',
        label: 'Planta',
        placeholder: 'Todas as plantas',
        allowClear: true,
        options: [{ value: 'all', label: 'Todas as plantas' }, ...plantas],
        className: 'w-full sm:w-auto sm:min-w-[180px]',
      },
    ],
    [plantas]
  );

  // Form fields com render do InstrucoesSelector injetado
  const formFields = useMemo(() => {
    return solicitacoesFormFields.map(field => {
      if (field.key === 'instrucoes_ids') {
        return {
          ...field,
          render: InstrucoesSelector
        };
      }
      return field;
    });
  }, []);

  return {
    filterConfigs,
    formFields,
    loadFilterOptions,
  };
}
