// src/features/solicitacoes-servico/hooks/useSolicitacoesFilters.tsx
import { useCallback, useMemo } from 'react';
import { FilterConfig } from '@/types/base';
import { SolicitacoesFilters } from '../types';
import { solicitacoesFormFields } from '../config/form-config';
import { InstrucoesSelector } from '../components/InstrucoesSelector';

export function useSolicitacoesFilters(_initialFilters: Partial<SolicitacoesFilters>) {
  /**
   * Sem opcao para carregar.
   *
   * A unica coisa que esta funcao buscava eram as plantas, para alimentar o
   * filtro de planta — que saiu da barra. Mantida como no-op porque a pagina a
   * chama num efeito de montagem; some quando algum filtro voltar a precisar
   * de dados do servidor. Buscar cem plantas a cada abertura para nao usar
   * nenhuma seria pior do que a funcao vazia.
   */
  const loadFilterOptions = useCallback(async () => {}, []);

  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: 'search',
        type: 'search',
        placeholder: 'Buscar por número, título, descrição...',
        className: 'flex-1 min-w-[200px]',
      },
      // Status e Planta sairam da barra de filtros a pedido: o status ja e
      // legivel na propria linha da tabela, e a planta raramente e o recorte
      // que se procura aqui. Continuam existindo na consulta — a pagina pode
      // manda-los pela URL —, so nao ocupam mais espaco na tela.
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
    ],
    []
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
