// src/features/plantas/config/filter-config.ts - ESTRUTURA SIMPLIFICADA
import { FilterConfig } from '@/types/base';

// Mock data para os filtros (normalmente viria da API)
const mockProprietarios = [
  { value: '1', label: 'Empresa ABC Ltda' },
  { value: '2', label: 'João Silva' },
  { value: '3', label: 'Maria Santos Consultoria ME' },
  { value: '4', label: 'Tech Solutions Ltda' },
  { value: '5', label: 'Ana Costa' },
  { value: '6', label: 'Indústria XYZ S.A.' }
];

export const plantasFilterConfig: FilterConfig[] = [
  {
    key: 'search',
    type: 'search',
    placeholder: 'Buscar por nome, CNPJ ou localização...',
    className: 'lg:min-w-80'
  },
  {
    key: 'proprietarioId',
    type: 'select',
    label: 'Proprietário',
    placeholder: 'Todos os proprietários',
    options: [
      { value: 'all', label: 'Todos os proprietários' },
      ...mockProprietarios
    ],
    className: 'min-w-48'
  }
];