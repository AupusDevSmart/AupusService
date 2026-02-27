// src/features/veiculos/config/form-config.tsx
import React from 'react';
import { type FormField } from '@/types/base';
import { DocumentosUpload } from '../components/DocumentosUpload';

// Configuração do formulário de veículos
export const veiculoFormConfig: FormField[] = [
  {
    key: 'nome',
    label: 'Nome do Veículo',
    type: 'text',
    required: true,
    placeholder: 'Ex: Strada Adventure CD',
    width: 'half', // 50% em desktop
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
    width: 'half', // 50% em desktop
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
    placeholder: 'Ex: Fiat, Toyota, Ford',
    width: 'half' // 50% em desktop
  },
  {
    key: 'modelo',
    label: 'Modelo',
    type: 'text',
    required: true,
    placeholder: 'Ex: Strada Adventure, Hilux SR',
    width: 'half' // 50% em desktop
  },
  {
    key: 'ano',
    label: 'Ano Modelo',
    type: 'number',
    required: true,
    width: 'third', // 33.33% em desktop
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
    width: 'third', // 33.33% em desktop
    options: [
      { label: 'Flex', value: 'flex' },
      { label: 'Gasolina', value: 'gasolina' },
      { label: 'Diesel', value: 'diesel' },
      { label: 'Elétrico', value: 'eletrico' },
      { label: 'Híbrido', value: 'hibrido' }
    ]
  },
  {
    key: 'capacidadeCarga',
    label: 'Capacidade de Carga (kg)',
    type: 'number',
    required: true,
    width: 'half', // 50% em desktop
    validation: (value) => {
      const capacidade = parseInt(value);
      if (isNaN(capacidade) || capacidade < 0) {
        return 'Capacidade deve ser um número positivo';
      }
      return null;
    }
  },
  {
    key: 'capacidadePassageiros',
    label: 'Número de Passageiros',
    type: 'number',
    required: true,
    width: 'half', // 50% em desktop
    validation: (value) => {
      const passageiros = parseInt(value);
      if (isNaN(passageiros) || passageiros < 1 || passageiros > 50) {
        return 'Número de passageiros deve estar entre 1 e 50';
      }
      return null;
    }
  },
  {
    key: 'responsavelManutencao',
    label: 'Responsável pela Manutenção',
    type: 'text',
    required: false,
    placeholder: 'Nome do responsável pelo veículo',
    width: 'half' // 50% em desktop
  },
  {
    key: 'localizacaoAtual',
    label: 'Localização Atual',
    type: 'text',
    required: true,
    placeholder: 'Ex: Garagem Principal, Pátio Externo',
    width: 'half' // 50% em desktop
  },
  {
    key: 'kmAtual',
    label: 'Quilometragem Atual',
    type: 'number',
    required: true,
    width: 'half', // 50% em desktop
    validation: (value) => {
      const km = parseInt(value);
      if (isNaN(km) || km < 0) {
        return 'Quilometragem deve ser um número válido (0 ou maior)';
      }
      return null;
    }
  },
  {
    key: 'documentos',
    label: 'Documentos',
    type: 'custom',
    width: 'full', // 100% - componente customizado
    render: (props: any) => React.createElement(DocumentosUpload, {
      ...props,
      veiculoId: props.entity?.id,
      mode: props.mode
    })
  },
  {
    key: 'observacoes',
    label: 'Observações',
    type: 'textarea',
    placeholder: 'Informações adicionais sobre o veículo...',
    width: 'full' // 100% - campo de texto longo
  }
];

// Adicionar novos campos do API
const additionalFormFields: FormField[] = [
  {
    key: 'cor',
    label: 'Cor',
    type: 'text',
    required: false,
    placeholder: 'Ex: Branco, Prata, Azul',
    width: 'third' // 33.33% em desktop - ficará ao lado de ano e combustível
  },
  {
    key: 'tipo',
    label: 'Tipo de Veículo',
    type: 'select',
    required: true,
    width: 'half', // 50% em desktop
    options: [
      { label: 'Carro', value: 'carro' },
      { label: 'Van', value: 'van' },
      { label: 'Caminhonete', value: 'caminhonete' },
      { label: 'Caminhão', value: 'caminhao' },
      { label: 'Ônibus', value: 'onibus' },
      { label: 'Moto', value: 'moto' }
    ]
  },
  {
    key: 'proximaRevisao',
    label: 'Próxima Revisão',
    type: 'date',
    required: false,
    width: 'half' // 50% em desktop
  },
  {
    key: 'chassi',
    label: 'Chassi',
    type: 'text',
    required: false,
    placeholder: 'Número do chassi',
    width: 'half' // 50% em desktop
  },
  {
    key: 'renavam',
    label: 'Renavam',
    type: 'text',
    required: false,
    placeholder: 'Número do Renavam',
    width: 'half' // 50% em desktop
  },
  {
    key: 'seguradora',
    label: 'Seguradora',
    type: 'text',
    required: false,
    placeholder: 'Nome da seguradora',
    width: 'half' // 50% em desktop
  },
];

// Inserir novos campos na posição correta
const insertAfterIndex = veiculoFormConfig.findIndex(field => field.key === 'tipoCombustivel');
const typeAndColorFields = additionalFormFields.filter(field => ['cor', 'tipo'].includes(field.key));
veiculoFormConfig.splice(insertAfterIndex + 1, 0, ...typeAndColorFields);

// Adicionar campos de documentos e seguro no final (antes das observações)
const observacoesIndex = veiculoFormConfig.findIndex(field => field.key === 'observacoes');
const documentFields = additionalFormFields.filter(field => !['cor', 'tipo'].includes(field.key));
veiculoFormConfig.splice(observacoesIndex, 0, ...documentFields);

// Exportações com nomes compatíveis
export const veiculosFormFields = veiculoFormConfig;