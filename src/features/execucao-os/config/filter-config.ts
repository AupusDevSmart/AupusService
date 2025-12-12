// src/features/execucao-os/config/filter-config.ts
import { FilterConfig } from '@/types/base';

/**
 * ✅ FILTROS ESSENCIAIS SIMPLIFICADOS
 *
 * Mantidos apenas os filtros mais importantes e funcionais:
 * - search: Busca geral por múltiplos campos
 * - statusExecucao: Status atual da execução (PROGRAMADA, EM_EXECUCAO, PAUSADA, etc.)
 * - tipo: Classificação da OS (PREVENTIVA, CORRETIVA, etc.)
 * - prioridade: Nível de urgência (CRITICA, ALTA, MEDIA, BAIXA)
 *
 * ❌ REMOVIDOS (mock data sem integração com API):
 * - responsavel: Dados mockados, sem conexão real
 * - planta/local: Dados mockados, sem conexão real
 * - periodo: Dados mockados, funcionalidade duplicada
 */

export const execucaoOSFilterConfig: FilterConfig[] = [
  {
    key: 'search',
    type: 'search',
    placeholder: 'Buscar por Nº OS, descrição, responsável ou local...',
    className: 'lg:min-w-80'
  },
  {
    key: 'statusExecucao',
    type: 'select',
    label: 'Status',
    placeholder: 'Todos os status',
    options: [
      { value: 'all', label: 'Todos os status' },
      { value: 'PLANEJADA', label: 'Planejada' },
      { value: 'PROGRAMADA', label: 'Programada' },
      { value: 'EM_EXECUCAO', label: 'Em Execução' },
      { value: 'PAUSADA', label: 'Pausada' },
      { value: 'FINALIZADA', label: 'Finalizada' },
      { value: 'CANCELADA', label: 'Cancelada' }
    ],
    className: 'min-w-44'
  },
  {
    key: 'tipo',
    type: 'select',
    label: 'Tipo',
    placeholder: 'Todos os tipos',
    options: [
      { value: 'all', label: 'Todos os tipos' },
      { value: 'PREVENTIVA', label: 'Preventiva' },
      { value: 'PREDITIVA', label: 'Preditiva' },
      { value: 'CORRETIVA', label: 'Corretiva' },
      { value: 'INSPECAO', label: 'Inspeção' },
      { value: 'VISITA_TECNICA', label: 'Visita Técnica' }
    ],
    className: 'min-w-40'
  },
  {
    key: 'prioridade',
    type: 'select',
    label: 'Prioridade',
    placeholder: 'Todas as prioridades',
    options: [
      { value: 'all', label: 'Todas' },
      { value: 'CRITICA', label: 'Crítica' },
      { value: 'ALTA', label: 'Alta' },
      { value: 'MEDIA', label: 'Média' },
      { value: 'BAIXA', label: 'Baixa' }
    ],
    className: 'min-w-36'
  }
];