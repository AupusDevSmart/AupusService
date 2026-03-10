// src/features/veiculos/config/form-config.tsx
import React from 'react';
import { type FormField } from '@/types/base';
import { DocumentosUpload } from '../components/DocumentosUpload';

// Configuração do formulário de veículos - REORGANIZADA
export const veiculosFormFields: FormField[] = [
  // ========== SEÇÃO 1: IDENTIFICAÇÃO ==========
  {
    key: 'nome',
    label: 'Nome do Veículo',
    type: 'text',
    required: true,
    placeholder: 'Ex: Strada Adventure CD',
    width: 'half',
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
    width: 'half',
    validation: (value) => {
      if (!value) return 'Placa é obrigatória';
      const placaRegex = /^[A-Z]{3}-\d{4}$/;
      if (!placaRegex.test(value.toUpperCase())) {
        return 'Formato de placa inválido (ABC-1234)';
      }
      return null;
    }
  },

  // ========== SEÇÃO 2: ESPECIFICAÇÕES DO VEÍCULO ==========
  {
    key: 'marca',
    label: 'Marca',
    type: 'text',
    required: true,
    placeholder: 'Ex: Fiat, Toyota, Ford',
    width: 'half'
  },
  {
    key: 'modelo',
    label: 'Modelo',
    type: 'text',
    required: true,
    placeholder: 'Ex: Strada Adventure, Hilux SR',
    width: 'half'
  },
  {
    key: 'ano',
    label: 'Ano Modelo',
    type: 'number',
    required: true,
    width: 'third',
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
    key: 'cor',
    label: 'Cor',
    type: 'text',
    required: false,
    placeholder: 'Ex: Branco, Prata, Azul',
    width: 'third'
  },
  {
    key: 'tipoCombustivel',
    label: 'Tipo de Combustível',
    type: 'select',
    required: true,
    width: 'third',
    options: [
      { label: 'Flex', value: 'flex' },
      { label: 'Gasolina', value: 'gasolina' },
      { label: 'Diesel', value: 'diesel' },
      { label: 'Elétrico', value: 'eletrico' },
      { label: 'Híbrido', value: 'hibrido' }
    ]
  },
  {
    key: 'tipo',
    label: 'Tipo de Veículo',
    type: 'select',
    required: true,
    width: 'half',
    options: [
      { label: 'Carro', value: 'carro' },
      { label: 'Van', value: 'van' },
      { label: 'Caminhonete', value: 'caminhonete' },
      { label: 'Caminhão', value: 'caminhao' },
      { label: 'Ônibus', value: 'onibus' },
      { label: 'Moto', value: 'moto' }
    ]
  },

  // ========== SEÇÃO 3: CAPACIDADES ==========
  {
    key: 'capacidadePassageiros',
    label: 'Número de Passageiros',
    type: 'number',
    required: true,
    width: 'half',
    validation: (value) => {
      const passageiros = parseInt(value);
      if (isNaN(passageiros) || passageiros < 1 || passageiros > 50) {
        return 'Número de passageiros deve estar entre 1 e 50';
      }
      return null;
    }
  },
  {
    key: 'capacidadeCarga',
    label: 'Capacidade de Carga (kg)',
    type: 'number',
    required: true,
    width: 'half',
    validation: (value) => {
      const capacidade = parseInt(value);
      if (isNaN(capacidade) || capacidade < 0) {
        return 'Capacidade deve ser um número positivo';
      }
      return null;
    }
  },

  // ========== SEÇÃO 4: MANUTENÇÃO E LOCALIZAÇÃO ==========
  {
    key: 'kmAtual',
    label: 'Quilometragem Atual',
    type: 'number',
    required: true,
    width: 'half',
    validation: (value) => {
      const km = parseInt(value);
      if (isNaN(km) || km < 0) {
        return 'Quilometragem deve ser um número válido (0 ou maior)';
      }
      return null;
    }
  },
  {
    key: 'proximaRevisao',
    label: 'Próxima Revisão',
    type: 'date',
    required: false,
    width: 'half'
  },
  {
    key: 'responsavelManutencao',
    label: 'Responsável pela Manutenção',
    type: 'text',
    required: false,
    placeholder: 'Nome do responsável pelo veículo',
    width: 'half'
  },
  {
    key: 'localizacaoAtual',
    label: 'Localização Atual',
    type: 'text',
    required: true,
    placeholder: 'Ex: Garagem Principal, Pátio Externo',
    width: 'half'
  },

  // ========== SEÇÃO 5: DOCUMENTAÇÃO ==========
  {
    key: 'chassi',
    label: 'Chassi',
    type: 'text',
    required: false,
    placeholder: 'Número do chassi',
    width: 'half'
  },
  {
    key: 'renavam',
    label: 'Renavam',
    type: 'text',
    required: false,
    placeholder: 'Número do Renavam',
    width: 'half'
  },
  {
    key: 'seguradora',
    label: 'Seguradora',
    type: 'text',
    required: false,
    placeholder: 'Nome da seguradora',
    width: 'half'
  },

  // ========== SEÇÃO 6: DOCUMENTOS (Full Width com colSpan) ==========
  {
    key: 'documentos',
    label: 'Documentos',
    type: 'custom',
    width: 'full',
    colSpan: 2, // ✅ Adiciona colspan 2 para ocupar 100% da largura
    render: (props: any) => React.createElement(DocumentosUpload, {
      ...props,
      veiculoId: props.entity?.id,
      mode: props.mode
    })
  },

  // ========== SEÇÃO 7: OBSERVAÇÕES (Full Width com colSpan) ==========
  {
    key: 'observacoes',
    label: 'Observações',
    type: 'textarea',
    placeholder: 'Informações adicionais sobre o veículo...',
    width: 'full',
    colSpan: 2 // ✅ Adiciona colspan 2 para ocupar 100% da largura
  }
];

// Manter compatibilidade com exportações antigas
export const veiculoFormConfig = veiculosFormFields;
