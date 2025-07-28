// src/features/ferramentas/config/filter-config.ts
import { FilterConfig } from '@/types/base';

// Mock data para os filtros (normalmente viria da API)
const mockFabricantes = [
  { value: 'Fluke', label: 'Fluke' },
  { value: 'Gedore', label: 'Gedore' },
  { value: 'Bosch', label: 'Bosch' },
  { value: 'Mitutoyo', label: 'Mitutoyo' },
  { value: 'Chicago Pneumatic', label: 'Chicago Pneumatic' },
  { value: 'Tektronix', label: 'Tektronix' },
  { value: 'Makita', label: 'Makita' },
  { value: 'GE', label: 'GE' },
  { value: 'DeWalt', label: 'DeWalt' },
];

const mockResponsaveis = [
  { value: 'João Silva', label: 'João Silva' },
  { value: 'Maria Santos', label: 'Maria Santos' },
  { value: 'Carlos Oliveira', label: 'Carlos Oliveira' },
  { value: 'Pedro Costa', label: 'Pedro Costa' },
  { value: 'Ana Costa', label: 'Ana Costa' },
  { value: 'Roberto Silva', label: 'Roberto Silva' },
  { value: 'Fernanda Lima', label: 'Fernanda Lima' }
];

export const ferramentasFilterConfig: FilterConfig[] = [
  {
    key: 'search',
    type: 'search',
    placeholder: 'Buscar por nome, código, fabricante ou modelo...',
    className: 'lg:min-w-80'
  },
  {
    key: 'fabricante',
    type: 'select',
    label: 'Fabricante',
    placeholder: 'Todos os fabricantes',
    options: [
      { value: 'all', label: 'Todos os fabricantes' },
      ...mockFabricantes
    ],
    className: 'min-w-44'
  },
  {
    key: 'status',
    type: 'select',
    label: 'Status',
    placeholder: 'Todos os status',
    options: [
      { value: 'all', label: 'Todos os status' },
      { value: 'disponivel', label: 'Disponível' },
      { value: 'em_uso', label: 'Em Uso' },
      { value: 'manutencao', label: 'Manutenção' }
    ],
    className: 'min-w-40'
  },
  {
    key: 'necessitaCalibracao',
    type: 'select',
    label: 'Calibração',
    placeholder: 'Todas as ferramentas',
    options: [
      { value: 'all', label: 'Todas as ferramentas' },
      { value: 'true', label: 'Necessita Calibração' },
      { value: 'false', label: 'Não Necessita Calibração' }
    ],
    className: 'min-w-48'
  },
  {
    key: 'responsavel',
    type: 'select',
    label: 'Responsável',
    placeholder: 'Todos os responsáveis',
    options: [
      { value: 'all', label: 'Todos os responsáveis' },
      ...mockResponsaveis
    ],
    className: 'min-w-48'
  }
];