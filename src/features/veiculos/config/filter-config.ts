// src/features/veiculos/config/filter-config.ts
import { FilterConfig } from '@/types/base';

export const veiculosFilterConfig: FilterConfig[] = [
  {
    key: 'search',
    type: 'search',
    placeholder: 'Buscar por nome, placa, marca, modelo...',
    className: 'lg:min-w-80'
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
    className: 'min-w-32'
  },
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
    ],
    className: 'min-w-32'
  },
  {
    key: 'tipoCombustivel',
    type: 'select',
    label: 'Combustível',
    placeholder: 'Todos',
    options: [
      { value: 'all', label: 'Todos' },
      { value: 'gasolina', label: 'Gasolina' },
      { value: 'etanol', label: 'Etanol' },
      { value: 'diesel', label: 'Diesel' },
      { value: 'gnv', label: 'GNV' },
      { value: 'eletrico', label: 'Elétrico' },
      { value: 'hibrido', label: 'Híbrido' }
    ],
    className: 'min-w-28'
  },
  {
    key: 'marca',
    type: 'select',
    label: 'Marca',
    placeholder: 'Todas as marcas',
    options: [
      { value: 'all', label: 'Todas as marcas' },
      { value: 'Toyota', label: 'Toyota' },
      { value: 'Mercedes-Benz', label: 'Mercedes-Benz' },
      { value: 'Ford', label: 'Ford' },
      { value: 'Chevrolet', label: 'Chevrolet' },
      { value: 'Volvo', label: 'Volvo' },
      { value: 'Honda', label: 'Honda' },
      { value: 'Hyundai', label: 'Hyundai' }
    ],
    className: 'min-w-32'
  }
];