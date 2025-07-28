// src/features/equipamentos/config/filter-config.tsx - CORRIGIDO
import { FilterConfig } from '@/types/base';

// Mock data para os filtros
const mockProprietarios = [
  { value: '1', label: 'Empresa ABC Ltda' },
  { value: '2', label: 'João Silva' },
  { value: '3', label: 'Maria Santos Consultoria ME' },
  { value: '4', label: 'Tech Solutions Ltda' },
  { value: '5', label: 'Ana Costa' },
  { value: '6', label: 'Indústria XYZ S.A.' }
];

const mockPlantas = [
  { value: '1', label: 'Planta Industrial São Paulo' },
  { value: '2', label: 'Centro de Distribuição Rio' },
  { value: '3', label: 'Unidade Administrativa BH' },
  { value: '4', label: 'Oficina João Silva' },
  { value: '5', label: 'Depósito Ana Costa' },
  { value: '6', label: 'Fábrica Indústria XYZ' }
];

export const equipamentosFilterConfig: FilterConfig[] = [
  {
    key: 'search',
    type: 'search',
    placeholder: 'Buscar por nome, modelo, fabricante...',
    className: 'lg:min-w-80'
  },
  {
    key: 'proprietarioId',
    type: 'select',
    label: 'Proprietário',
    placeholder: 'Todos os Proprietários',
    options: [
      { value: 'all', label: 'Todos os Proprietários' },
      ...mockProprietarios
    ],
    className: 'min-w-48'
  },
  {
    key: 'plantaId',
    type: 'select',
    label: 'Planta',
    placeholder: 'Todas as Plantas',
    options: [
      { value: 'all', label: 'Todas as Plantas' },
      ...mockPlantas
    ],
    className: 'min-w-48'
  },
  {
    key: 'classificacao',
    type: 'select',
    label: 'Classificação',
    placeholder: 'Todas as Classificações',
    options: [
      { value: 'all', label: 'Todas as Classificações' },
      { value: 'UC', label: 'UC (Equipamentos)' },
      { value: 'UAR', label: 'UAR (Componentes)' }
    ],
    className: 'min-w-40'
  },
  {
    key: 'criticidade',
    type: 'select',
    label: 'Criticidade',
    placeholder: 'Todas as Criticidades',
    options: [
      { value: 'all', label: 'Todas as Criticidades' },
      { value: '5', label: '5 (Muito Alta)' },
      { value: '4', label: '4 (Alta)' },
      { value: '3', label: '3 (Média)' },
      { value: '2', label: '2 (Baixa)' },
      { value: '1', label: '1 (Muito Baixa)' }
    ],
    className: 'min-w-40'
  }
];