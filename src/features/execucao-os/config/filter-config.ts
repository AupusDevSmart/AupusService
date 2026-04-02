// src/features/execucao-os/config/filter-config.ts
import { FilterConfig } from '@/types/base';

/**
 * FILTROS ESSENCIAIS COM COMBOBOX
 * Seguindo guia 5.7 - Filtros assertivos e contextuais
 *
 * ✅ 3 filtros principais (reduzido de 4):
 * - search: Busca geral por múltiplos campos
 * - statusExecucao: Status atual (combobox com busca)
 * - prioridade: Prioridade (combobox com busca)
 */

export const execucaoOSFilterConfig: FilterConfig[] = [
  {
    key: 'search',
    type: 'search',
    placeholder: 'Buscar por TAG, equipamento, responsável...',
    className: 'lg:min-w-80'
  },
  {
    key: 'statusExecucao',
    type: 'combobox', // ✅ Combobox com busca
    label: 'Status',
    placeholder: 'Todos os status', // ✅ Placeholder descritivo
    options: [
      { value: 'all', label: 'Todos os status' },
      { value: 'PENDENTE', label: 'Pendente' },
      { value: 'EM_EXECUCAO', label: 'Em Execução' },
      { value: 'PAUSADA', label: 'Pausada' },
      { value: 'EXECUTADA', label: 'Executada' },
      { value: 'AUDITADA', label: 'Auditada' },
      { value: 'FINALIZADA', label: 'Finalizada' },
      { value: 'CANCELADA', label: 'Cancelada' }
    ],
    className: 'min-w-44'
  },
  {
    key: 'prioridade',
    type: 'combobox', // ✅ Combobox com busca
    label: 'Prioridade',
    placeholder: 'Todas as prioridades', // ✅ Placeholder descritivo
    options: [
      { value: 'all', label: 'Todas as prioridades' },
      { value: 'CRITICA', label: 'Crítica' },
      { value: 'ALTA', label: 'Alta' },
      { value: 'MEDIA', label: 'Média' },
      { value: 'BAIXA', label: 'Baixa' }
    ],
    className: 'min-w-44'
  },
];
