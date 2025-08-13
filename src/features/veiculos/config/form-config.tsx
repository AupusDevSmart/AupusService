// src/features/veiculos/config/form-config.tsx
import React from 'react';
import { Car, Users, Weight, Fuel, MapPin } from 'lucide-react';
import { Veiculo } from '../../reservas/types';

export interface FormField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'textarea' | 'date' | 'time' | 'number' | 'custom';
  required?: boolean;
  placeholder?: string;
  options?: { label: string; value: string | number }[];
  validation?: (value: any) => string | null;
  render?: (props: any) => React.ReactNode;
  colSpan?: number;
}

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  width?: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date';
  options?: { label: string; value: string }[];
  placeholder?: string;
}

// Configuração da tabela de veículos
export const veiculosTableConfig: TableColumn<Veiculo>[] = [
  {
    key: 'nome',
    label: 'Veículo',
    sortable: true,
    render: (veiculo) => (
      <div className="flex items-center gap-3">
        <Car className="w-8 h-8 text-gray-400" />
        <div>
          <div className="font-medium text-gray-900">{veiculo.nome}</div>
          <div className="text-sm text-gray-500">{veiculo.marca} {veiculo.modelo}</div>
          <div className="text-sm font-mono text-gray-600">{veiculo.placa}</div>
        </div>
      </div>
    )
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    render: (veiculo) => {
      const configs = {
        disponivel: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Disponível' },
        em_uso: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Em Uso' },
        manutencao: { color: 'bg-amber-100 text-amber-800 border-amber-200', label: 'Manutenção' },
        inativo: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Inativo' }
      };
      
      const config = configs[veiculo.status];
      return (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}>
          {config.label}
        </span>
      );
    }
  },
  {
    key: 'especificacoes',
    label: 'Especificações',
    render: (veiculo) => (
      <div className="space-y-1 text-sm">
        <div className="flex items-center gap-1">
          <Users className="w-3 h-3 text-gray-400" />
          <span>{veiculo.capacidadePassageiros || veiculo.numeroPassageiros || 0} passageiros</span>
        </div>
        <div className="flex items-center gap-1">
          <Weight className="w-3 h-3 text-gray-400" />
          <span>{veiculo.capacidadeCarga}kg</span>
        </div>
        <div className="flex items-center gap-1">
          <Fuel className="w-3 h-3 text-gray-400" />
          <span className="capitalize">{veiculo.tipoCombustivel}</span>
        </div>
      </div>
    )
  },
  {
    key: 'responsavel',
    label: 'Responsável',
    sortable: true,
    render: (veiculo) => (
      <div>
        <div className="font-medium text-gray-900">{veiculo.responsavel || veiculo.responsavelManutencao || 'Não informado'}</div>
        <div className="text-sm text-gray-500 flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {veiculo.localizacaoAtual}
        </div>
      </div>
    )
  },
  {
    key: 'valorDiaria',
    label: 'Valor/Dia',
    sortable: true,
    render: (veiculo) => (
      <div className="font-bold text-green-600">
        R$ {veiculo.valorDiaria?.toFixed(2) || '0.00'}
      </div>
    )
  },
  {
    key: 'quilometragem',
    label: 'Km',
    sortable: true,
    render: (veiculo) => (
      <div className="text-sm">
        {(veiculo.quilometragem || veiculo.kmAtual || 0).toLocaleString()} km
      </div>
    )
  }
];

// Configuração dos filtros de veículos
export const veiculosFilterConfig: FilterConfig[] = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { label: 'Todos os Status', value: 'todos' },
      { label: 'Disponível', value: 'disponivel' },
      { label: 'Em Uso', value: 'em_uso' },
      { label: 'Manutenção', value: 'manutencao' },
      { label: 'Inativo', value: 'inativo' }
    ]
  },
  {
    key: 'combustivel',
    label: 'Combustível',
    type: 'select',
    options: [
      { label: 'Todos os Combustíveis', value: 'todos' },
      { label: 'Flex', value: 'flex' },
      { label: 'Gasolina', value: 'gasolina' },
      { label: 'Diesel', value: 'diesel' },
      { label: 'Elétrico', value: 'eletrico' },
      { label: 'Híbrido', value: 'hibrido' }
    ]
  },
  {
    key: 'busca',
    label: 'Busca',
    type: 'text',
    placeholder: 'Buscar por nome, placa, marca, responsável...'
  }
];

// Configuração do formulário de veículos
export const veiculoFormConfig: FormField[] = [
  {
    key: 'nome',
    label: 'Nome do Veículo',
    type: 'text',
    required: true,
    placeholder: 'Ex: Strada Adventure CD',
    validation: (value) => {
      if (!value || value.trim().length < 3) {
        return 'Nome deve ter pelo menos 3 caracteres';
      }
      return null;
    }
  },
  {
    key: 'placa',
    label: 'Placa',
    type: 'text',
    required: true,
    placeholder: 'ABC-1234',
    validation: (value) => {
      if (!value) return 'Placa é obrigatória';
      const placaRegex = /^[A-Z]{3}-\d{4}$/;
      if (!placaRegex.test(value.toUpperCase())) {
        return 'Formato de placa inválido (ABC-1234)';
      }
      return null;
    }
  },
  {
    key: 'marca',
    label: 'Marca',
    type: 'text',
    required: true,
    placeholder: 'Ex: Fiat, Toyota, Ford'
  },
  {
    key: 'modelo',
    label: 'Modelo',
    type: 'text',
    required: true,
    placeholder: 'Ex: Strada Adventure, Hilux SR'
  },
  {
    key: 'ano',
    label: 'Ano',
    type: 'number',
    required: true,
    validation: (value) => {
      const ano = parseInt(value);
      const anoAtual = new Date().getFullYear();
      if (isNaN(ano) || ano < 1990 || ano > anoAtual + 1) {
        return `Ano deve estar entre 1990 e ${anoAtual + 1}`;
      }
      return null;
    }
  },
  {
    key: 'tipoCombustivel',
    label: 'Tipo de Combustível',
    type: 'select',
    required: true,
    options: [
      { label: 'Flex', value: 'flex' },
      { label: 'Gasolina', value: 'gasolina' },
      { label: 'Diesel', value: 'diesel' },
      { label: 'Elétrico', value: 'eletrico' },
      { label: 'Híbrido', value: 'hibrido' }
    ]
  },
  {
    key: 'valorDiaria',
    label: 'Valor da Diária (R$)',
    type: 'number',
    required: true,
    validation: (value) => {
      const valor = parseFloat(value);
      if (isNaN(valor) || valor <= 0) {
        return 'Valor deve ser maior que zero';
      }
      return null;
    }
  },
  {
    key: 'capacidadeCarga',
    label: 'Capacidade de Carga (kg)',
    type: 'number',
    required: true,
    validation: (value) => {
      const capacidade = parseInt(value);
      if (isNaN(capacidade) || capacidade < 0) {
        return 'Capacidade deve ser um número positivo';
      }
      return null;
    }
  },
  {
    key: 'numeroPassageiros',
    label: 'Número de Passageiros',
    type: 'number',
    required: true,
    validation: (value) => {
      const passageiros = parseInt(value);
      if (isNaN(passageiros) || passageiros < 1 || passageiros > 50) {
        return 'Número de passageiros deve estar entre 1 e 50';
      }
      return null;
    }
  },
  {
    key: 'responsavel',
    label: 'Responsável',
    type: 'text',
    required: true,
    placeholder: 'Nome do responsável pelo veículo'
  },
  {
    key: 'localizacaoAtual',
    label: 'Localização Atual',
    type: 'text',
    required: true,
    placeholder: 'Ex: Garagem Principal, Pátio Externo'
  },
  {
    key: 'quilometragem',
    label: 'Quilometragem Atual',
    type: 'number',
    required: true,
    validation: (value) => {
      const km = parseInt(value);
      if (isNaN(km) || km < 0) {
        return 'Quilometragem deve ser um número positivo';
      }
      return null;
    }
  },
  {
    key: 'observacoes',
    label: 'Observações',
    type: 'textarea',
    placeholder: 'Informações adicionais sobre o veículo...',
    colSpan: 2
  }
];

// Exportações com nomes compatíveis
export const veiculosFormFields = veiculoFormConfig;
export const veiculosTableColumns = veiculosTableConfig;