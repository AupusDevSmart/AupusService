// src/features/veiculos/config/filter-config.ts
import { type FilterConfig } from '@/types/base';

// ============================================================================
// FILTER CONFIGURATIONS
// ============================================================================

export const veiculosFilterConfig: FilterConfig[] = [
  // Search
  {
    key: 'search',
    type: 'search',
    placeholder: 'Buscar por nome, placa, marca, modelo...',
    className: 'lg:min-w-80'
  },

  // Status
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
    ]
  },

  // Tipo
  {
    key: 'tipo',
    type: 'select',
    label: 'Tipo',
    placeholder: 'Todos os tipos',
    options: [
      { value: 'all', label: 'Todos os tipos' },
      { value: 'carro', label: 'Carro' },
      { value: 'van', label: 'Van' },
      { value: 'caminhonete', label: 'Caminhonete' },
      { value: 'caminhao', label: 'Caminhão' },
      { value: 'onibus', label: 'Ônibus' },
      { value: 'moto', label: 'Moto' }
    ]
  },

  // Tipo Combustível
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
      { value: 'gnv', label: 'GNV' },
      { value: 'eletrico', label: 'Elétrico' },
      { value: 'hibrido', label: 'Híbrido' },
      { value: 'flex', label: 'Flex' }
    ]
  },

  // Marca
  {
    key: 'marca',
    type: 'search',
    label: 'Marca',
    placeholder: 'Ex: Toyota, Volkswagen'
  },

  // Disponível (filtro especial)
  {
    key: 'disponivel',
    type: 'select',
    label: 'Disponibilidade',
    placeholder: 'Todos',
    options: [
      { value: 'all', label: 'Todos' },
      { value: 'true', label: 'Apenas Disponíveis' },
      { value: 'false', label: 'Indisponíveis' }
    ]
  }
];
