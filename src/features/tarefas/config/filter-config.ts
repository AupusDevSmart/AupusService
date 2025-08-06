// src/features/tarefas/config/filter-config.ts
import { FilterConfig } from '@/types/base';

// Mock data para os filtros (normalmente viria da API)
const mockPlantas = [
  { value: '1', label: 'Planta Industrial São Paulo' },
  { value: '2', label: 'Planta Subestação Central' },
  { value: '3', label: 'Estação de Bombeamento Sul' },
  { value: '4', label: 'Oficina João Silva' }
];

export const tarefasFilterConfig: FilterConfig[] = [
  {
    key: 'search',
    type: 'search',
    placeholder: 'Buscar por TAG, descrição ou equipamento...',
    className: 'lg:min-w-80'
  },
  {
    key: 'categoria',
    type: 'select',
    label: 'Categoria',
    placeholder: 'Todas as categorias',
    options: [
      { value: 'all', label: 'Todas as categorias' },
      { value: 'MECANICA', label: 'Mecânica' },
      { value: 'ELETRICA', label: 'Elétrica' },
      { value: 'INSTRUMENTACAO', label: 'Instrumentação' },
      { value: 'LUBRIFICACAO', label: 'Lubrificação' },
      { value: 'LIMPEZA', label: 'Limpeza' },
      { value: 'INSPECAO', label: 'Inspeção' },
      { value: 'CALIBRACAO', label: 'Calibração' },
      { value: 'OUTROS', label: 'Outros' }
    ],
    className: 'min-w-44'
  },
  {
    key: 'tipoManutencao',
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
    key: 'status',
    type: 'select',
    label: 'Status',
    placeholder: 'Todos os status',
    options: [
      { value: 'all', label: 'Todos os status' },
      { value: 'ATIVA', label: 'Ativa' },
      { value: 'INATIVA', label: 'Inativa' },
      { value: 'EM_REVISAO', label: 'Em Revisão' },
      { value: 'ARQUIVADA', label: 'Arquivada' }
    ],
    className: 'min-w-36'
  },
  {
    key: 'origemPlano',
    type: 'select',
    label: 'Origem',
    placeholder: 'Todas as origens',
    options: [
      { value: 'all', label: 'Todas as origens' },
      { value: 'true', label: 'De Planos' },
      { value: 'false', label: 'Manuais' }
    ],
    className: 'min-w-36'
  },
  {
    key: 'sincronizada',
    type: 'select',
    label: 'Sincronização',
    placeholder: 'Todas',
    options: [
      { value: 'all', label: 'Todas' },
      { value: 'true', label: 'Sincronizadas' },
      { value: 'false', label: 'Dessincronizadas' }
    ],
    className: 'min-w-44'
  },
  {
    key: 'planta',
    type: 'select',
    label: 'Planta',
    placeholder: 'Todas as plantas',
    options: [
      { value: 'all', label: 'Todas as plantas' },
      ...mockPlantas
    ],
    className: 'min-w-52'
  },
  {
    key: 'criticidade',
    type: 'select',
    label: 'Criticidade',
    placeholder: 'Todas as criticidades',
    options: [
      { value: 'all', label: 'Todas as criticidades' },
      { value: '5', label: 'Muito Alta' },
      { value: '4', label: 'Alta' },
      { value: '3', label: 'Média' },
      { value: '2', label: 'Baixa' },
      { value: '1', label: 'Muito Baixa' }
    ],
    className: 'min-w-44'
  }
];