// src/features/programacao-os/config/filter-config.ts
import { FilterConfig } from '@/types/base';

/**
 * ✅ FILTROS ESSENCIAIS SIMPLIFICADOS
 *
 * Mantidos apenas os filtros mais importantes e funcionais:
 * - search: Busca geral por múltiplos campos
 * - status: Principal métrica de workflow (PENDENTE, EM_ANALISE, APROVADA, etc.)
 * - tipo: Classificação da OS (PREVENTIVA, CORRETIVA, etc.)
 * - prioridade: Nível de urgência (CRITICA, ALTA, MEDIA, BAIXA)
 * - origem: Fonte da OS (ANOMALIA, PLANO_MANUTENCAO, MANUAL)
 *
 * ❌ REMOVIDOS (mock data sem integração com API):
 * - planta: Dados mockados, sem conexão real
 * - responsavel: Dados mockados, sem conexão real
 * - periodo: Dados mockados, funcionalidade duplicada
 */

export const programacaoOSFilterConfig: FilterConfig[] = [
  {
    key: 'search',
    type: 'search',
    placeholder: 'Buscar por Nº OS, descrição, local ou ativo...',
    className: 'lg:min-w-80'
  },
  {
    key: 'status',
    type: 'select',
    label: 'Status',
    placeholder: 'Todos os status',
    options: [
      { value: 'all', label: 'Todos os status' },
      { value: 'RASCUNHO', label: 'Rascunho' },
      { value: 'PENDENTE', label: 'Pendente' },
      { value: 'EM_ANALISE', label: 'Em Análise' },
      { value: 'APROVADA', label: 'Aprovada' },
      { value: 'REJEITADA', label: 'Rejeitada' },
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
  },
  {
    key: 'origem',
    type: 'select',
    label: 'Origem',
    placeholder: 'Todas as origens',
    options: [
      { value: 'all', label: 'Todas' },
      { value: 'ANOMALIA', label: 'Anomalia' },
      { value: 'PLANO_MANUTENCAO', label: 'Plano Manutenção' },
      { value: 'MANUAL', label: 'Manual' }
    ],
    className: 'min-w-48'
  }
];