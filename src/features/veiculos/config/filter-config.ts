// src/features/veiculos/config/filter-config.ts
import { FilterConfig } from '@/types/base';

// Mock data para os filtros (normalmente viria da API)
const mockResponsaveis = [
  { value: 'João Silva', label: 'João Silva' },
  { value: 'Maria Santos', label: 'Maria Santos' },
  { value: 'Carlos Oliveira', label: 'Carlos Oliveira' },
  { value: 'Pedro Costa', label: 'Pedro Costa' },
  { value: 'Ana Costa', label: 'Ana Costa' },
  { value: 'Roberto Silva', label: 'Roberto Silva' },
  { value: 'Fernanda Lima', label: 'Fernanda Lima' }
];

const anosFabricacao = [
  { value: '2023', label: '2023' },
  { value: '2022', label: '2022' },
  { value: '2021', label: '2021' },
  { value: '2020', label: '2020' },
  { value: '2019', label: '2019' },
  { value: '2018', label: '2018' },
  { value: '2017', label: '2017' },
  { value: '2016', label: '2016' },
  { value: '2015', label: '2015' }
];

export const veiculosFilterConfig: FilterConfig[] = [
  {
    key: 'search',
    type: 'search',
    placeholder: 'Buscar por nome, placa, marca ou modelo...',
    className: 'lg:min-w-80'
  },
  {
    key: 'tipoCombustivel',
    type: 'select',
    label: 'Combustível',
    placeholder: 'Todos os combustíveis',
    options: [
      { value: 'all', label: 'Todos os combustíveis' },
      { value: 'gasolina', label: 'Gasolina' },
      { value: 'etanol', label: 'Etanol' },
      { value: 'diesel', label: 'Diesel' },
      { value: 'flex', label: 'Flex' },
      { value: 'eletrico', label: 'Elétrico' },
      { value: 'hibrido', label: 'Híbrido' },
      { value: 'gnv', label: 'GNV' }
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
      { value: 'manutencao', label: 'Manutenção' },
      { value: 'inativo', label: 'Inativo' }
    ],
    className: 'min-w-40'
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
  },
  {
    key: 'anoFabricacao',
    type: 'select',
    label: 'Ano',
    placeholder: 'Todos os anos',
    options: [
      { value: 'all', label: 'Todos os anos' },
      ...anosFabricacao
    ],
    className: 'min-w-32'
  }
];