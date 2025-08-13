// src/features/ferramentas/config/form-config.tsx - CORREÇÃO FINAL
import { FormField } from '@/types/base';
import { CalibracaoController } from '../components/CalibracaoController';
import { FotoUpload } from '../components/FotoUpload';
import { Ferramenta } from '../types';

export const ferramentasFormFields: FormField[] = [
  // Informações Básicas
  {
    key: 'nome',
    label: 'Nome da Ferramenta',
    type: 'text',
    required: true,
    placeholder: 'Ex: Multímetro Digital Fluke',
    group: 'informacoes_basicas'
  },
  // ✅ REMOVIDO: Campo "tipo" que estava causando o loop
  {
    key: 'codigoPatrimonial',
    label: 'Código Patrimonial',
    type: 'text',
    required: true,
    placeholder: 'Ex: FER-001',
    group: 'informacoes_basicas'
  },

  // Especificações da Ferramenta
  {
    key: 'fabricante',
    label: 'Fabricante',
    type: 'text',
    required: true,
    placeholder: 'Ex: Fluke, Bosch, Mitutoyo',
    group: 'especificacoes'
  },
  {
    key: 'modelo',
    label: 'Modelo',
    type: 'text',
    required: true,
    placeholder: 'Ex: 87V, GSB 20-2 RE',
    group: 'especificacoes'
  },
  {
    key: 'numeroSerie',
    label: 'Número de Série',
    type: 'text',
    required: true,
    placeholder: 'Ex: FLK87V-12345',
    group: 'especificacoes'
  },

  // Calibração
  {
    key: 'calibracao',
    label: 'Calibração',
    type: 'custom',
    required: true,
    render: ({ value, onChange, disabled, entity, mode }) => (
      <CalibracaoController 
        value={value}
        onChange={onChange} 
        disabled={disabled}
        entity={entity as Ferramenta | null}
        mode={mode}
      />
    ),
    group: 'calibracao'
  },

  // Informações Operacionais
  {
    key: 'valorDiaria',
    label: 'Valor da Diária (R$)',
    type: 'text',
    required: true,
    placeholder: 'Ex: 25.00',
    validation: (value) => {
      if (!value) return null;
      const valor = parseFloat(String(value));
      if (valor <= 0) {
        return 'Valor deve ser maior que zero';
      }
      return null;
    },
    group: 'operacionais'
  },
  {
    key: 'localizacaoAtual',
    label: 'Localização Atual',
    type: 'text',
    required: true,
    placeholder: 'Ex: Planta Industrial São Paulo - Laboratório',
    group: 'operacionais'
  },
  {
    key: 'responsavel',
    label: 'Responsável',
    type: 'text',
    required: true,
    placeholder: 'Ex: João Silva',
    group: 'operacionais'
  },
  {
    key: 'dataAquisicao',
    label: 'Data de Aquisição',
    type: 'text',
    required: true,
    placeholder: 'Data de aquisição da ferramenta',
    validation: (value) => {
      if (!value) return null;
      const data = new Date(String(value));
      const hoje = new Date();
      if (data > hoje) {
        return 'Data de aquisição não pode ser futura';
      }
      return null;
    },
    group: 'operacionais'
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    required: true,
    options: [
      { value: 'disponivel', label: 'Disponível' },
      { value: 'em_uso', label: 'Em Uso' },
      { value: 'manutencao', label: 'Em Manutenção' }
    ],
    group: 'operacionais'
  },

  // Observações e Foto
  {
    key: 'observacoes',
    label: 'Observações',
    type: 'textarea',
    required: false,
    placeholder: 'Observações adicionais sobre a ferramenta...',
    group: 'extras'
  },
  {
    key: 'foto',
    label: 'Foto da Ferramenta',
    type: 'custom',
    required: false,
    render: FotoUpload,
    group: 'extras'
  }
];